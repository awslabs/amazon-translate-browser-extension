// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export type PromiseResolve = (value: void | PromiseLike<void>) => void;
export type PromiseReject = (reason?: any) => void;
