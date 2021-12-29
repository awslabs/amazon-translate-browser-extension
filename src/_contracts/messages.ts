// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { TranslateClientConfig } from "@aws-sdk/client-translate";

/**
 * This interface describes the schema of the message sent from the popup window to the content-script.
 */
export interface TranslateCommandData extends JsonObject {
  creds: TranslateClientConfig;
  langs: {
    source: string;
    target: string;
  };
  tabId: number;
  cachingEnabled: boolean;
}

export interface TranslateStatusData {
  status: "translating" | "complete" | "";
  message: string;
}

export interface TranslateErrorData {
  message: string;
}

// These types are copied from TypeFest to support web-ext interfaces
type JsonObject = { [Key in string]?: JsonValue };
interface JsonArray extends Array<JsonValue> { };
type JsonValue = string | number | boolean | null | JsonObject | JsonArray;