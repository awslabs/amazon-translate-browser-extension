/* eslint-disable no-console */

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

import { TranslateClientConfig } from '@aws-sdk/client-translate';
import { onMessage, sendMessage } from 'webext-bridge';
import { TranslateCommandData } from '../_contracts';
import { lockr } from '../modules';
import {
  crawl,
  getCache,
  applyCachedTranslation,
  writePages,
  bindPages,
  translateDocuments,
  breakDocuments,
  breakPages,
  makeCacheTextMap,
  cacheTranslation,
  applyTranslation,
  createOverlay,
  destroyOverlay,
} from './functions';

// Firefox `browser.tabs.executeScript()` requires scripts return a primitive value
(() => {
  // Setup message handlers. These handlers receive messages from the popup window.
  translateHandler();
  clearCacheHandler();
  tabPrevHandler();
})();

/**
 * Listen for messages from the popup window that contain the AWS creds and selected
 * languages for translation.
 */
function translateHandler() {
  onMessage<TranslateCommandData, 'translate'>(
    'translate',
    ({ sender: { context, tabId }, data }) => {
      // Destructure our configuration
      const { creds, langs } = data;
      const { source, target } = langs;

      createOverlay();

      // Send a message informing the popup that the translation has started
      void sendMessage('status', { status: 'translating', message: '' }, 'popup');

      // Start the webpage translation process
      const startingEl = document.querySelector('body');

      // Using the Promise chaining API to appease the TS compiler because onMessage does not allow
      // async callbacks.
      startTranslation(creds, source, target, startingEl)
        .then(() => {
          // Send a message to the popup indicating the translation has completed
          void sendMessage(
            'status',
            { status: 'complete', message: 'Translation complete.' },
            'popup'
          );
        })
        .catch(e => {
          console.error(e, startingEl);

          // Send a message to the popup indicating that an error occurred during translation
          void sendMessage(
            'status',
            { status: 'error', message: 'An error occurred. The document failed to translate.' },
            { context, tabId }
          );
        })
        .finally(() => {
          destroyOverlay();
        });
    }
  );
}

/**
 * Listen for messages from the popup window that instruct the contentScript to clear the
 * localStorage translation cache for the current page.
 */
function clearCacheHandler() {
  // Listen to requests to clear the current page's translation cache
  onMessage('clearCache', ({ sender: { context, tabId } }) => {
    lockr.rm(window.location.href);
    void sendMessage(
      'status',
      { status: 'complete', message: 'Cleared cache for this page.' },
      { context, tabId }
    );
  });
}

/**
 * Kicks off logic for translating the webpage from the provided starting element by
 * crawling all children recursively, passing the text to the Amazon Translate API, and
 * then swapping the original text with the translated text.
 */
async function startTranslation(
  creds: TranslateClientConfig,
  source: string,
  target: string,
  startingEl: HTMLElement | null
): Promise<void> {
  if (startingEl) {
    // Crawl the DOM from the starting element and get the text pages and node map
    const { pageMap, nodeMap } = crawl(startingEl);

    const cachedTranslation = getCache(window.location.href, source, target);

    if (cachedTranslation) {
      // If the page has been translated previously and is cached, follow this logic tree
      applyCachedTranslation(pageMap, nodeMap, cachedTranslation);
    } else {
      // If the page has not been previously translated and cached, get new translation and apply it

      // Create translatable pages from the page map.
      const writtenPages = writePages(pageMap);

      // Bind the pages into documents (chunks) that can be sent to Amazon Translate
      const docs = bindPages(writtenPages);

      // Translate the documents
      const translated = await translateDocuments(creds, source, target, docs);

      // Break the translated documents back into pages
      const translatedPages = breakDocuments(translated);

      // Break the pages into tuples of the node ID and the translated text
      const translatedPageMap = breakPages(translatedPages);

      // Make a cache text map for the selected language pair
      const textMap = makeCacheTextMap(pageMap, translatedPageMap);

      // Cache the translated text map
      cacheTranslation(window.location.href, source, target, textMap);

      // Apply the translated documents to the DOM
      applyTranslation(nodeMap, translatedPages);
    }
  } else {
    throw new Error('Amazon Translate Error: The top level tag does not exist on the document.');
  }
}

/**
 * This is a required message handler that must be registered for the extension to function.
 */
function tabPrevHandler() {
  onMessage('tab-prev', () => {
    console.log('Registering tab-prev');
  });
}
