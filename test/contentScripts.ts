/**
  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
  SPDX-License-Identifier: Apache-2.0
*/
import test from 'ava';
import {
  breakPages,
  breakDocuments,
  writePages,
  bindPages,
  pagePatternize,
} from '../src/contentScripts/functions';
import { PAGE_PATTERN } from '../src/constants';
import { DOM, pageMap } from './data';

test.before(() => {
  global.Blob = DOM.window.Blob;
});

test('creates an array of pages from a page map', t => {
  const pages = writePages(pageMap);

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
  const documents = ['<|1:algún texto|><|2:más texto|>', '<|3:aún más texto|>'];
  const pages = breakDocuments(documents);

  t.is(pages[0], '1:algún texto');
  t.is(pages[1], '2:más texto');
  t.is(pages[2], '3:aún más texto');
});

test('breaks pages into a pageMap', t => {
  const pages = ['1:algún texto', '2:más texto', '3:aún más texto'];
  const pageMap = breakPages(pages);

  t.is(pageMap[1], 'algún texto');
  t.is(pageMap[2], 'más texto');
  t.is(pageMap[3], 'aún más texto');
});

test('breaks pages that contain a colon into a pageMap', t => {
  const pages = ['1:algún:texto', '2:más:texto', '3:aún más:texto'];
  const pageMap = breakPages(pages);

  t.is(pageMap[1], 'algún:texto');
  t.is(pageMap[2], 'más:texto');
  t.is(pageMap[3], 'aún más:texto');
});
