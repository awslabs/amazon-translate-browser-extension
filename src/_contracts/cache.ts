// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * A key/value map of language pairs with text maps. The key is the
 * format of `sourceLang-targetLang` and the value is the CacheTextMap.
 */
export interface CacheLangs {
  [langPair: string]: CacheTextMap;
}

/**
 * Maps source text (ie. "hello world!") to translated text (ie. "¡Hola mundo!").
 */
export interface CacheTextMap {
  [sourceText: string]: string;
}
