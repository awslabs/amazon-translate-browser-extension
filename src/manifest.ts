import fs from 'fs-extra';
import type { Manifest } from 'webextension-polyfill';
import type PkgType from '../package.json';
import { isDev, port, r } from '../scripts/utils';

export async function getManifest(): Promise<Manifest.WebExtensionManifest> {
  const pkg = (await fs.readJSON(r('package.json'))) as typeof PkgType;

  // update this file to update this manifest.json
  // can also be conditional based on your need
  const manifest: Manifest.WebExtensionManifest = {
    manifest_version: 3,
    name: pkg.displayName || pkg.name,
    version: pkg.version,
    description: pkg.description,
    commands: {
      // @ts-expect-error The current type system doesn't understand the command API.
      translate: {
        suggested_key: {
          default: 'Alt+Shift+T',
        },
        description: 'Translate the webpage with your default source language and target language.',
      },
    },
    action: {
      default_icon: './assets/logo.png',
      default_popup: './dist/popup/index.html',
    },
    options_ui: {
      page: './dist/options/index.html',
      open_in_tab: true,
    },
    background: {
      service_worker: './dist/background/background.js',
      type: 'module',
    },
    icons: {
      16: './assets/logo.png',
      48: './assets/logo.png',
      128: './assets/logo.png',
    },
    permissions: ['tabs', 'storage', 'activeTab', 'contextMenus'],
    // @ts-expect-error invalid type definition
    optional_host_permissions: ['*://*/*'],
    content_scripts: [
      {
        matches: ['http://*/*', 'https://*/*'],
        js: ['./dist/contentScripts/index.global.js'],
      },
    ],
    web_accessible_resources: [
      { resources: ['dist/contentScripts/style.css'], matches: ['http://*/*', 'https://*/*'] },
    ],
  };

  if (isDev) {
    // for content script, as browsers will cache them for each reload,
    // we use a background script to always inject the latest version
    // see src/background/contentScriptHMR.ts
    delete manifest.content_scripts;
    manifest.permissions?.push('webNavigation');

    // this is required on dev for Vite script to load
    // manifest.content_security_policy = `script-src 'self' http://localhost:${port}; object-src 'self'`;
    manifest.content_security_policy = {
      extension_pages: `script-src 'self' http://localhost:${port}; object-src 'self'`,
    };
  }

  return manifest;
}
