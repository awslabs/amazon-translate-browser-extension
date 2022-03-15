/*
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License").
You may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { CacheTextMap, NodeMap, PageMap, TranslateCommandData } from '~/_contracts';
import {
  crawl,
  getCache,
  writePages,
  bindPages,
  pageIsValid,
  translateMany,
  breakDocuments,
  makeCacheTextMap,
  cacheTranslation,
  swapText,
  splitPage,
  sanitizePage,
  createPageMap,
} from './functions';

/**
 * Kicks off logic for translating the webpage from the provided starting element by
 * crawling all children recursively, passing the text to the Amazon Translate API, and
 * then swapping the original text with the translated text.
 */
export async function startTranslation(
  data: TranslateCommandData,
  startingEl: HTMLElement | null
): Promise<void> {
  if (startingEl) {
    // Crawl the DOM from the starting element and get the text pages and node map
    const { pageMap, nodeMap } = crawl(startingEl);
    // Check if a cached translation exists for the current page
    const cache = getCache(window.location.href, data.langs.source, data.langs.target);

    if (cache) {
      translateFromCache(pageMap, nodeMap, cache);
    } else {
      await translateFromApi(data, nodeMap, pageMap);
    }
  } else {
    throw new Error('Amazon Translate Error: The top level tag does not exist on the document.');
  }
}

/**
 * Logic flow to translate the crawled webpage into the target language from the local cache.
 */
function translateFromCache(pageMap: PageMap, nodeMap: NodeMap, cache: CacheTextMap): void {
  Object.entries(pageMap).forEach(([id, srcText]) => swapText(nodeMap, id, cache[srcText]));
}

/**
 * Logic flow to translate the crawled webpage into the target language from the Translate API.
 * If caching is enabled, the result will be cached to localStorage.
 */
async function translateFromApi(
  { creds, langs }: TranslateCommandData,
  nodeMap: NodeMap,
  pageMap: PageMap
) {
  // If the page has not been previously translated and cached, get new translation and apply it

  // Create translatable pages from the page map.
  const writtenPages = writePages(pageMap);

  // Bind the pages into documents (chunks) that can be sent to Amazon Translate
  const docs = bindPages(writtenPages);

  // Translate the documents
  const tDocs = await translateMany(creds, langs.source, langs.target, docs);

  // Break the translated documents back into pages
  const tPagesRaw = breakDocuments(tDocs);

  // Sanitize the pages returned from Amazon Translate
  const tPagesSanitized = tPagesRaw.map(page => sanitizePage(page));

  // Break the pages into tuples of the node ID and the translated text
  const translatedPageMap = createPageMap(tPagesSanitized);

  // Make a cache text map for the selected language pair
  const textMap = makeCacheTextMap(pageMap, translatedPageMap);

  // Cache the translated text map
  cacheTranslation(window.location.href, langs.source, langs.target, textMap);

  // Apply the translated documents to the DOM
  tPagesSanitized.forEach(page =>
    pageIsValid(page) ? swapText(nodeMap, ...splitPage(page)) : undefined
  );
}
