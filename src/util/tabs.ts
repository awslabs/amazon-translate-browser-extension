/**
  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
  SPDX-License-Identifier: Apache-2.0
*/

import type { Tabs } from 'webextension-polyfill';

/**
 * Returns the ID of the currently viewed tab.
 */
export async function getCurrentTabId(): Promise<number> {
  return (await getCurrentTab())?.id ?? 0;
}

/**
 * Queries the browser for the currently viewed tab and returns it.
 */
export async function getCurrentTab(): Promise<Tabs.Tab> {
  const queryOptions = { active: true, currentWindow: true };
  const [tab] = await browser.tabs.query(queryOptions);
  return tab;
}
