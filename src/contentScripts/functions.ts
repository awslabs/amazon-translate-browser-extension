import {
  TranslateClient,
  TranslateTextCommand,
  TranslateTextCommandOutput,
  TranslateClientConfig,
} from '@aws-sdk/client-translate';
import * as lockr from 'lockr';
import {
  TranslateData,
  Documents,
  NodeMap,
  PageMap,
  CacheLangs,
  CacheTextMap,
} from '../_contracts';

// The maximum translate document size in bytes
const DOC_BOUNDARY = 500;
// Node types that the crawler should ignore
const IGNORED_NODES = ['SCRIPT', 'STYLE', 'PRE', '#comment', 'NOSCRIPT'];
// The formatting to apply to pages before translation
const PAGE_PATTERNIZE = (id: string, text: string) => `<|${id}:${text}|>`;
// The pattern to split translated documents into pages
const PAGE_PATTERN = /[(<|)|(|>)]/g;

/**
 * Recursively crawls the webpage starting from the specified starting node and translates
 * each text node with Amazon Translate (concurrently). It then swaps the original text
 * with the translated text.
 */
export function crawl(
  node: Node,
  data: TranslateData = { pageMap: {}, nodeMap: {} }
): TranslateData {
  const text = validNodeText(node);
  // If it's a text node, add it to docs and map
  if (text) {
    // Add the node to the node map with an ID
    const id = Object.keys(data.nodeMap).length + 1;
    data.nodeMap[`${id}`] = node;
    data.pageMap[id] = text;
  }
  // Don't crawl Script or Style tags
  const name = node.nodeName;
  if (!IGNORED_NODES.includes(name) && node.childNodes.length > 0) {
    // Crawl the node children
    node.childNodes.forEach((child: Node) => {
      crawl(child, data);
    });
  }
  return data;
}

/**
 * Validate that the given DOM node is a TEXT_NODE and consists of characters
 * other than white-space and line-breaks.
 */
export function validNodeText(node: Node): string | null {
  // Make sure the node is a text node
  if (node.nodeType === node.TEXT_NODE) {
    const text = node.textContent;
    // We don't want node text if it is only white space and line breaks
    if (text !== null && /\w+/g.test(text)) {
      return text;
    }
  }
  return null;
}

/**
 * Creates an array of pages (strings for translation) from a page map.
 *
 * Example Page: "<|1:some text|>"
 */
export function writePages(pages: PageMap): string[] {
  return Object.entries(pages).map(([key, text]) => PAGE_PATTERNIZE(key, text));
}

/**
 * Takes DOM text pages (text lines) and binds them into documents (chunks) for
 * batched translation.
 *
 * **Example Pages:**
 *
 * `["1:some text","2:more text","3:even more text"]`
 *
 * **Example return value (Documents):**
 *
 * `["<|1:some text|><|2:more text|>", "<|3:even more text|>"]`
 */
export function bindPages(pages: string[]): Documents {
  return pages.reduce(
    (docs, page) => {
      let doc = docs[docs.length - 1];
      // Check the bytes to ensure the total is less than the upper boundary
      if (new Blob([doc]).size + new Blob([page]).size < DOC_BOUNDARY) {
        doc += page;
        docs[docs.length - 1] = doc;
        return docs;
      }
      docs.push(page);
      return docs;
    },
    [''] as Documents
  );
}

/**
 * Takes the user's credentials as well as the source language code and target language
 * code and makes Amazon Translate API requests for the provided text docs.
 *
 * **Example return value (Translated Documents):**
 *
 * `["<|1:algún texto|><|2:más texto|>", "<|3:aún más texto|>"]`
 */
export async function translateDocuments(
  creds: TranslateClientConfig,
  SourceLanguageCode: string,
  TargetLanguageCode: string,
  docs: Documents
): Promise<Documents> {
  const client = new TranslateClient(creds);
  const responses = await sendDocumentsToTranslate(
    client,
    SourceLanguageCode,
    TargetLanguageCode,
    docs
  );

  if (responses.some(res => res.status === 'rejected')) {
    throw new Error('One or more parts of the document failed to translate.');
  }

  return responses.reduce((docs, response) => {
    if (response.status === 'fulfilled') {
      return docs.concat([response.value.TranslatedText ?? '']);
    }
    return docs;
  }, [] as Documents);
}

/**
 * Maps over a set of documents to be translated and waits for all of the requests to settle.
 */
async function sendDocumentsToTranslate(
  client: TranslateClient,
  SourceLanguageCode: string,
  TargetLanguageCode: string,
  docs: Documents
) {
  return await Promise.allSettled(
    docs.map(doc => {
      return new Promise<TranslateTextCommandOutput>((resolve, reject) => {
        const command = new TranslateTextCommand({
          Text: doc,
          SourceLanguageCode,
          TargetLanguageCode,
        });
        translateDocument(client, command, resolve, reject);
      });
    })
  );
}

/**
 * Attempts to translate a document with the Amazon Translate API. It retries up to a maximum of
 * 3 times with exponential backoff's if the translate command fails.
 */
function translateDocument(
  client: TranslateClient,
  command: TranslateTextCommand,
  resolve: (value: TranslateTextCommandOutput) => void,
  reject: (reason?: any) => void,
  attempts = 0
) {
  setTimeout(() => {
    client
      .send(command)
      .then(res => {
        resolve(res);
      })
      .catch(e => {
        if (attempts < 4) {
          translateDocument(client, command, resolve, reject, attempts + 1);
        } else {
          reject(e);
        }
      });
  }, Math.pow(10, attempts));
}

/**
 * Breaks apart a set of documents into pages.
 */
export function breakDocuments(docs: Documents): string[] {
  return docs.reduce(
    (acc, doc) =>
      acc.concat(doc.split(PAGE_PATTERN).filter((line: string) => line !== '' && line !== ' ')),
    [] as string[]
  );
}

/**
 * Breaks apart a set of pages into a page map (node id mapped to translated text).
 */
export function breakPages(pages: string[]): PageMap {
  return pages.reduce((acc, page) => {
    const [key] = page.split(':');
    const text = page.substring(key.length + 1);
    acc[key] = text;
    return acc;
  }, {} as PageMap);
}

/**
 * Attempts to retrieve the cached text map from localStorage.
 */
export function getCache(url: string, source: string, target: string): CacheTextMap | null {
  const cache: CacheLangs | null = lockr.get(url, null);
  return cache?.[`${source}-${target}`] ?? null;
}

/**
 * Accepts a page map of the source language and a page map of the translated language and returns
 * a TextMap that matches the source language text to the translated language text. This is used for
 * caching.
 */
export function makeCacheTextMap(pageMap: PageMap, translatedPageMap: PageMap): CacheTextMap {
  return Object.entries(pageMap).reduce((acc, [key, page]) => {
    acc[page] = translatedPageMap[key];
    return acc;
  }, {} as CacheTextMap);
}

/**
 * Caches the translated text map with a composite key of the source language code and the target
 * language code. The map is cached with a top level key that equals the current browser URL. When
 * the user revisits a page and it has language cached it can be pulled directly from the cache
 * rather than accessing the Amazon Translate api's.
 */
export function cacheTranslation(
  url: string,
  source: string,
  target: string,
  textMap: CacheTextMap
): void {
  const cache: CacheLangs = lockr.get(url, {});
  const langPair = `${source}-${target}`;
  const langPairCache = cache[langPair] ?? {};
  const updatedLangPairCache = { ...langPairCache, ...textMap };
  cache[langPair] = updatedLangPairCache;
  lockr.set(url, cache);
}

/**
 * Applies cached translations to the DOM.
 *
 * NOTE: This could probably be merged with applyTranslation when we have time.
 */
export function applyCachedTranslation(
  pageMap: PageMap,
  nodeMap: NodeMap,
  cache: CacheTextMap
): void {
  Object.entries(pageMap).forEach(([id, page]) => {
    const translated = cache[page];
    const node = nodeMap[Number(id)];
    if (node && translated) {
      node.textContent = translated;
    }
  });
}

/**
 * Takes a node map and applies the translated documents to the DOM by parsing each
 * page and node ID then swapping the current text with the translated text.
 */
export function applyTranslation(nodeMap: NodeMap, pages: string[]): void {
  // Loop over each
  pages.forEach(page => {
    let [id, text] = page.split(':');
    // This is a workaround for an Amazon Translate bug that occasionally returns the wrong colon
    if (id === undefined || text === undefined) {
      [id, text] = page.split('：');
    }
    const node = nodeMap[Number(id)];
    if (node) {
      node.textContent = text;
    }
  });
}
