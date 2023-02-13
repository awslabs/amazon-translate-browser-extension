/**
  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
  SPDX-License-Identifier: Apache-2.0
*/
import test from 'ava';
import { crawl, validNodeText } from '../src/content/functions';
import {
  DOM,
  DOM_WITH_EMPTY,
  DOM_EL_POPULATED,
  DOM_EL_EMPTY,
  DOM_EL_CODE,
  DOM_EL_COMMENT,
  DOM_EL_NOSCRIPT,
  DOM_EL_PRE,
  DOM_EL_SCRIPT,
  DOM_EL_STYLE,
} from './data';

test('crawls a web page and returns a pageMap and a nodeMap', t => {
  const body = DOM().window.document.querySelector('body');
  if (body) {
    const { pageMap, nodeMap } = crawl(body);

    // Test the pageMap
    t.is(pageMap[1], '\n        child 1 text node\n      ');
    t.is(pageMap[2], '\n        child 2 text node\n      ');
    t.is(pageMap[3], '\n        parent 2 child text node\n        ');
    t.is(pageMap[4], '\n          parent 2 grandchild p tag\n        ');

    // Test the nodeMap (textNodes have a type of number 3)
    t.is(nodeMap[1].nodeType, 3);
    t.is(nodeMap[2].nodeType, 3);
    t.is(nodeMap[3].nodeType, 3);
    t.is(nodeMap[4].nodeType, 3);
  } else {
    t.fail();
  }
});

test('crawling a web page does not return text from <code> nodes', t => {
  const body = DOM_EL_CODE().window.document.querySelector('body');
  if (body) {
    const { pageMap } = crawl(body);
    t.is(Object.keys(pageMap).length, 0);
  } else {
    t.fail();
  }
});

test('crawling a web page does not return text from <!-- comment --> nodes', t => {
  const body = DOM_EL_COMMENT().window.document.querySelector('body');
  if (body) {
    const { pageMap } = crawl(body);
    t.is(Object.keys(pageMap).length, 0);
  } else {
    t.fail();
  }
});

test('crawling a web page does not return text from <noscript> nodes', t => {
  const body = DOM_EL_NOSCRIPT().window.document.querySelector('body');
  if (body) {
    const { pageMap } = crawl(body);
    t.is(Object.keys(pageMap).length, 0);
  } else {
    t.fail();
  }
});

test('crawling a web page does not return text from <pre> nodes', t => {
  const body = DOM_EL_PRE().window.document.querySelector('body');
  if (body) {
    const { pageMap } = crawl(body);
    t.is(Object.keys(pageMap).length, 0);
  } else {
    t.fail();
  }
});

test('crawling a web page does not return text from <script> nodes', t => {
  const body = DOM_EL_SCRIPT().window.document.querySelector('body');
  if (body) {
    const { pageMap } = crawl(body);
    t.is(Object.keys(pageMap).length, 0);
  } else {
    t.fail();
  }
});

test('crawling a web page does not return text from <style> nodes', t => {
  const body = DOM_EL_STYLE().window.document.querySelector('body');
  if (body) {
    const { pageMap } = crawl(body);
    t.is(Object.keys(pageMap).length, 0);
  } else {
    t.fail();
  }
});

test('crawling a web page does not return empty text nodes', t => {
  const body = DOM_WITH_EMPTY().window.document.querySelector('body');
  if (body) {
    const { pageMap, nodeMap } = crawl(body);

    // Test the pageMap
    t.is(Object.entries(pageMap).length, 1);
    t.is(pageMap[1], "I'm not empty");

    // Test the nodeMap (textNodes have a type of number 3)
    t.is(nodeMap[1].nodeType, 3);
  } else {
    t.fail();
  }
});

test('validate that the given DOM node is a TEXT_NODE and consists of characters other than white-space and line-breaks.', t => {
  const p1 = DOM_EL_POPULATED().window.document.querySelector('#test');
  const p2 = DOM_EL_EMPTY().window.document.querySelector('#test');

  if (p1 && p2) {
    const result1 = validNodeText(p1.childNodes[0]);
    const result2 = validNodeText(p2.childNodes[0]);

    t.is(result1, 'populated text');
    t.falsy(result2);
  } else {
    t.fail();
  }
});
