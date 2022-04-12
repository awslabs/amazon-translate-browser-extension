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
import { sendMessage, onMessage } from 'webext-bridge';
import { Tabs } from 'webextension-polyfill';
import { getCurrentTabId } from '../util';
import { lockr } from '../modules';
import { AwsOptions, ExtensionOptions } from '~/constants';
import { translateDocuments } from '../contentScripts/functions';

// @ts-ignore only on dev mode
if (import.meta.hot) {
  // @ts-expect-error for background HMR
  import('/@vite/client');
  // load latest content script
  import('./contentScriptHMR');
}

browser.runtime.onInstalled.addListener((): void => {
  console.info('Extension installed');
  translateHotKeyHandler();
  translateSelectionHandler();
});

let previousTabId = 0;

/**
 * Listens for keyboard keypress events and looks for the combination of cmd+alt+t for Mac systems
 * and ctrl+alt+t for Windows systems.
 */
function translateHotKeyHandler() {
  browser.commands.onCommand.addListener(command => {
    void (async () => {
      if (command === 'translate') {
        console.info('Hotkey has triggered a translation.');
        const tabId = await getCurrentTabId();

        const message = {
          creds: {
            region: lockr.get(AwsOptions.AWS_REGION, ''),
            credentials: {
              accessKeyId: lockr.get(AwsOptions.AWS_ACCESS_KEY_ID, ''),
              secretAccessKey: lockr.get(AwsOptions.AWS_SECRET_ACCESS_KEY, ''),
            },
          },
          langs: {
            source: lockr.get(ExtensionOptions.DEFAULT_SOURCE_LANG, 'auto'),
            target: lockr.get(ExtensionOptions.DEFAULT_TARGET_LANG, 'en'),
          },
          tabId,
          cachingEnabled: lockr.get(ExtensionOptions.CACHING_ENABLED, false),
        };

        void sendMessage('translate', message, {
          context: 'content-script',
          tabId,
        });
      }
    })();
  });
  // document.addEventListener('keydown', (event) => {
  //   // If cmd+alt+t is being held (Mac)
  //   if (event.metaKey && event.altKey && event.key === 't') {
  //     console.log('Holding CMD+ALT+T !!!!');
  //   }
  //   // If cmd+alt+t is being held (Non-Mac)
  //   if (event.ctrlKey && event.altKey && event.key === 't') {
  //     console.log('Holding CTRL+ALT+T !!!!');
  //   }
  // });
}

// communication example: send previous tab title from background page
// see shim.d.ts for type declaration
browser.tabs.onActivated.addListener(({ tabId }) => {
  if (!previousTabId) {
    previousTabId = tabId;
    return;
  }

  getTabId(previousTabId)
    .then(tab => {
      previousTabId = tabId;
      console.info('previous tab', tab);
      console.info('test');
      void sendMessage('tab-prev', { title: tab.title }, { context: 'content-script', tabId });
    })
    .catch(() => {
      return;
    });
});

const getTabId = async (previousTabId: number): Promise<Tabs.Tab> => {
  return browser.tabs.get(previousTabId);
};

onMessage('get-current-tab', async () => {
  try {
    const tab = await getTabId(previousTabId);
    return {
      title: `${tab?.id ?? ''}`,
    };
  } catch {
    return {
      title: '',
    };
  }
});

// Translate selection with right-click menu
const escape = (text: string): string => {
  return text.replaceAll('"', '\\"').replaceAll("'", "\\'");
};

function translateSelectionHandler() {
  browser.contextMenus.create({
    title: 'Translate selection',
    contexts: ['selection'],
    id: 'translate-selection',
  });

  browser.contextMenus.onClicked.addListener((info): void => {
    void (async () => {
      if (info.menuItemId === 'translate-selection') {
        const tabId = await getCurrentTabId();
        void sendMessage(
          'show-overlay',
          {},
          {
            context: 'content-script',
            tabId,
          }
        );
        const translatedDocs = await translateDocuments(
          {
            region: lockr.get(AwsOptions.AWS_REGION, ''),
            credentials: {
              accessKeyId: lockr.get(AwsOptions.AWS_ACCESS_KEY_ID, ''),
              secretAccessKey: lockr.get(AwsOptions.AWS_SECRET_ACCESS_KEY, ''),
            },
          },
          lockr.get(ExtensionOptions.DEFAULT_SOURCE_LANG, 'auto'),
          lockr.get(ExtensionOptions.DEFAULT_TARGET_LANG, 'en'),
          [info.selectionText]
        );

        void sendMessage(
          'translate-selection',
          { translatedText: escape(translatedDocs[0]) },
          {
            context: 'content-script',
            tabId,
          }
        );
      }
    })();
  });
}
