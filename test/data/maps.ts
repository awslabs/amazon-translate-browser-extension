import { DOM } from './dom';
import { PageMap, NodeMap } from '../../src/_contracts';

export const pageMap: PageMap = {
  1: 'some text',
  2: 'more text',
  3: 'even more text',
};

export const nodeMap: NodeMap = {
  1: DOM.window.document.createTextNode('some text'),
  2: DOM.window.document.createTextNode('more text'),
  3: DOM.window.document.createTextNode('even more text'),
};
