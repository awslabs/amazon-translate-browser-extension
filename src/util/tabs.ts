/**
 * Returns the ID of the currently viewed tab.
 */
export async function getCurrentTabId() {
  return (await getCurrentTab())?.id ?? 0;
}

/**
 * Queries the browser for the currently viewed tab and returns it.
 */
export async function getCurrentTab() {
  let queryOptions = { active: true, currentWindow: true };
  let [tab] = await browser.tabs.query(queryOptions);
  return tab;
}
