import { PageMap, CacheTextMap } from '../../src/_contracts';

export const sourcePageMap = (): PageMap => ({
  1: 'some text',
  2: 'more text',
  3: 'even more text',
});

export const targetPageMap = (): PageMap => ({
  1: 'algún texto',
  2: 'más texto',
  3: 'aún más texto',
});

export const cacheTextMap = (): CacheTextMap => ({
  'some text': 'algún texto',
  'more text': 'más texto',
  'even more text': 'aún más texto',
});
