/**
  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
  SPDX-License-Identifier: Apache-2.0
*/
import test from 'ava';
import { LocalStorage } from 'node-localstorage';
import {
  breakDocuments,
  writePages,
  bindPages,
  pagePatternize,
  createPageMap,
  makeCacheTextMap,
  cacheTranslation,
  getCache,
  swapText,
  sanitizePage,
  pageIsValid,
  splitPage,
} from '../src/content/functions';
import { PAGE_PATTERN } from '../src/constants';
import { DOM, sourcePageMap, targetPageMap, cacheTextMap } from './data';
import { NodeMap } from '~/_contracts';

test.before(() => {
  global.Blob = DOM().window.Blob;
  global.localStorage = new LocalStorage('./scratch');
});

test('creates an array of pages from a page map', t => {
  const pages = writePages(sourcePageMap());

  t.is(pages[0], '<|1:some text|>');
  t.is(pages[1], '<|2:more text|>');
  t.is(pages[2], '<|3:even more text|>');
});

test('applies correct template pattern to pages', t => {
  const result = pagePatternize('64', 'Hello world!');
  const matched = result.match(PAGE_PATTERN);

  // We can't use the t.regex() assertion because it passes as long as a part of the string matches
  t.is(matched?.length, 1, 'The result did not match page pattern.');
  t.is(matched?.[0].length, result.length, 'The matched string and the result differ.');
});

test('Takes DOM text pages (text lines) and binds them into documents (chunks)', t => {
  const pages = ['<|1:some text|>', '<|2:more text|>', '<|3:even more text|>'];
  const documents = bindPages(pages);

  t.is(documents[0], '<|1:some text|><|2:more text|><|3:even more text|>');
});

test('breaks documents into pages', t => {
  const documents = [
    '<|1:algún texto|><|2:más texto|>',
    '<|3:aún más texto|>',
    '<|4:more (more) text|>',
  ];
  const pages = breakDocuments(documents);

  t.is(pages[0], '1:algún texto');
  t.is(pages[1], '2:más texto');
  t.is(pages[2], '3:aún más texto');
  t.is(pages[3], '4:more (more) text');
});

test('creates a PageMap from sanitized pages', t => {
  const sanitizedPages = ['1:algún texto', '2:más texto', '3:aún más texto'];
  const pageMap = createPageMap(sanitizedPages);

  t.is(pageMap['1'], 'algún texto');
  t.is(pageMap['2'], 'más texto');
  t.is(pageMap['3'], 'aún más texto');
});

test('creates a CacheTextMap from a source language PageMap and a target language PageMap', t => {
  const cacheTextMap = makeCacheTextMap(sourcePageMap(), targetPageMap());

  t.is(cacheTextMap['some text'], 'algún texto');
  t.is(cacheTextMap['more text'], 'más texto');
  t.is(cacheTextMap['even more text'], 'aún más texto');
});

test('caches the translation for the current url and language pairs in localStorage', t => {
  cacheTranslation('https://www.example.com', 'en', 'es', cacheTextMap());
  const fromCache = getCache('https://www.example.com', 'en', 'es');

  if (fromCache) {
    t.is(fromCache['some text'], 'algún texto');
    t.is(fromCache['more text'], 'más texto');
    t.is(fromCache['even more text'], 'aún más texto');
  } else {
    t.fail();
  }
});

test('swaps text with a node', t => {
  const dom = DOM();
  const tn1 = dom.window.document.querySelector('.child1')?.childNodes[0];

  if (tn1) {
    const nodeMap: NodeMap = {
      1: tn1,
    };

    t.is(tn1.textContent?.replace(/\s+/g, ' ').trim(), 'child 1 text node');

    swapText(nodeMap, '1', 'testing');

    t.is(tn1.textContent?.replace(/\s+/g, ' ').trim(), 'testing');
  } else {
    t.fail();
  }
});

test('sanitizes a translation response to force all colons to be standard colons', t => {
  const unsanitized = 'testing： testing： 123';
  const sanitized = sanitizePage(unsanitized);

  t.is(sanitized.indexOf('：'), -1);
});

test("correctly determines if a page's format is valid", t => {
  const invalidPage = 'abc:testing testing 123';
  const invalidPage2 = '123：testing testing: 123';
  const invalidPage3 = 'dfadfadsfadfa';
  const validPage = '123:testing testing: 123';

  t.false(pageIsValid(invalidPage));
  t.false(pageIsValid(invalidPage2));
  t.false(pageIsValid(invalidPage3));
  t.true(pageIsValid(validPage));
});

test('splits a page into a tuple containing the node ID and the text', t => {
  const validPage = '123:testing testing: 123';
  const [id, text] = splitPage(validPage);

  t.is(id, '123');
  t.is(text, 'testing testing: 123');
});

test('creates a patternized page from a node ID and the page text', t => {
  const patternizedPage = pagePatternize('123', 'testing testing: 123');

  t.is(patternizedPage, '<|123:testing testing: 123|>');
});
