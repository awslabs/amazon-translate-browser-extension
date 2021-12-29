// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export interface TranslateData {
  pageMap: PageMap;
  nodeMap: NodeMap;
}

export type Documents = string[];

export interface NodeMap {
  [key: string]: Node;
}

export interface PageMap {
  [key: string]: string;
}
