import test from 'ava';
import {
  crawl,
  breakPages,
  breakDocuments,
  validNodeText,
  writePages,
  bindPages,
} from '../src/contentScripts/functions';
import {
  DOM,
  DOM_WITH_EMPTY,
  DOM_EL_POPULATED,
  DOM_EL_EMPTY,
  pageMap,
  // nodeMap,
} from './data';

test.before(() => {
  global.Blob = DOM.window.Blob;
});

test('crawls a web page and returns a pageMap and a nodeMap', t => {
  const body = DOM.window.document.querySelector('body');
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

test('crawling a web page does not return empty text nodes', t => {
  const body = DOM_WITH_EMPTY.window.document.querySelector('body');
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
  const p1 = DOM_EL_POPULATED.window.document.querySelector('#test');
  const p2 = DOM_EL_EMPTY.window.document.querySelector('#test');

  if (p1 && p2) {
    const result1 = validNodeText(p1.childNodes[0]);
    const result2 = validNodeText(p2.childNodes[0]);

    t.is(result1, 'populated text');
    t.falsy(result2);
  } else {
    t.fail();
  }
});

test('creates an array of pages from a page map', t => {
  const pages = writePages(pageMap);

  t.is(pages[0], '<|1:some text|>');
  t.is(pages[1], '<|2:more text|>');
  t.is(pages[2], '<|3:even more text|>');
});

test('Takes DOM text pages (text lines) and binds them into documents (chunks)', t => {
  const pages = ['<|1:some text|>', '<|2:more text|>', '<|3:even more text|>'];
  const documents = bindPages(pages);

  t.is(documents[0], '<|1:some text|><|2:more text|><|3:even more text|>');
});

test('breaks documents into pages', t => {
  const documents = ["<|1:algún texto|><|2:más texto|>", "<|3:aún más texto|>"];
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