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

import { onMessage, sendMessage } from 'webext-bridge';
import { TranslateCommandData } from '../_contracts';
import { lockr } from '../modules';
import { createOverlay, destroyOverlay } from './functions';
import { startTranslation } from './translate';

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
      createOverlay();

      // Send a message informing the popup that the translation has started
      void sendMessage('status', { status: 'translating', message: '' }, 'popup');

      // Start the webpage translation process
      const startingEl = document.querySelector('body');

      // Using the Promise chaining API to appease the TS compiler because onMessage does not allow
      // async callbacks.
      startTranslation(data, startingEl)
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
 * This is a required message handler that must be registered for the extension to function.
 */
function tabPrevHandler() {
  onMessage('tab-prev', () => {
    console.log('Registering tab-prev');
  });
}
