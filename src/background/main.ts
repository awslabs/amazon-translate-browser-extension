import { sendMessage, onMessage } from 'webext-bridge';
import { Tabs } from 'webextension-polyfill';

// @ts-ignore
// only on dev mode
if (import.meta.hot) {
  // @ts-expect-error for background HMR
  import('/@vite/client');
  // load latest content script
  import('./contentScriptHMR');
}

browser.runtime.onInstalled.addListener((): void => {
  // eslint-disable-next-line no-console
  console.log('Extension installed');
});

let previousTabId = 0;

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
      // eslint-disable-next-line no-console
      console.log('previous tab', tab);
      void sendMessage('tab-prev', { title: tab.title }, { context: 'content-script', tabId });
    })
    .catch(() => {
      return;
    });
});

const getTabId = async (previousTabId: number): Promise<Tabs.Tab> => {
  return browser.tabs.get(previousTabId);
};

// @ts-expect-error I'm not sure if we can use an async callback on this
onMessage('get-current-tab', async () => {
  try {
    const tab = await getTabId(previousTabId);
    return {
      title: tab?.id,
    };
  } catch {
    return {
      title: undefined,
    };
  }
});
