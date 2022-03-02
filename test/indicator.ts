/**
  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
  SPDX-License-Identifier: Apache-2.0
*/
import test from 'ava';
import { JSDOM } from 'jsdom';
import { createOverlay, destroyOverlay } from '../src/contentScripts/functions';

const docString = '<html><body></body></html>';

test.beforeEach(() => {
  global.document = new JSDOM(docString).window.document;
});

test.serial('creates an overlay div that indicates the page is currently translating', t => {
  createOverlay();

  const overlay = document.querySelector<HTMLDivElement>('#amazon-translate-overlay');

  t.is(overlay?.id, 'amazon-translate-overlay');
  t.is(overlay?.innerText, 'Translating...');
  t.is(overlay?.style?.position, 'fixed');
  t.is(overlay?.style.bottom, '0px');
  t.is(overlay?.style.left, '0px');
  t.is(overlay?.style.zIndex, '1000000000');
  t.is(overlay?.style.padding, '5px');
  t.is(overlay?.style.color, 'rgb(255, 255, 255)');
  t.is(overlay?.style.fontSize, '16px');
  t.is(overlay?.style.fontWeight, 'bold');
  t.is(overlay?.style.fontFamily, 'Arial');
  t.is(overlay?.style.backgroundColor, 'rgb(221, 107, 16)');

  destroyOverlay();
});

test.serial('destroys the translating indicator overlay', t => {
  createOverlay();
  destroyOverlay();

  const overlay = document.querySelector<HTMLDivElement>('#amazon-translate-overlay');
  t.is(overlay, undefined);
});
