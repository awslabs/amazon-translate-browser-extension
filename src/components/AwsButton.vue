<!--
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0
-->
<script lang="ts">
  export default defineComponent({
    name: 'aws-button',
    props: {
      variant: {
        type: String,
        default: 'normal',
      },
      disabled: {
        type: Boolean,
        default: false,
      }
    }
  });
</script>

<template>
  <button class="aws-button" :class="`variant-${variant}`" :disabled="disabled">
    <slot></slot>
  </button>
</template>

<style lang="scss">
  @use '../styles/colors.scss';

  .aws-button {
    border-radius: 4px;
    cursor: pointer;
    line-height: 21px;
    font-size: 14px;
    font-weight: 700;
    font-family: 'Helvetica Neue', arial;
    padding: 6px 14px;
    text-align: center;
    -webkit-appearance: none;
    white-space: nowrap;
    -moz-appearance: none;
    appearance: none;

    &[disabled] {
      pointer-events: none;
    }
  }

  .variant-normal {
    background-color: #dedede;
    background-image: linear-gradient(white,#dedede);
    border: 1px solid #b8b8b8;
    border-top-color: #dedede;
    color: #444;
    text-shadow: 0 1px 1px rgb(255 255 255 / 75%);

    &:hover {
      background-image: linear-gradient(#dedede,#c5c5c5);
    }

    &:active {
      background-image: linear-gradient(#dedede,#fff);
    }

    &[disabled] {
      cursor: not-allowed;
    }
  }

  .variant-attention {
    background-color: colors.$awsui-color-orange-500;
    border-radius: 2px;
    color: #fff;
    padding: 4px 40px;

    &:hover,
    &:active {
      background-color: colors.$awsui-color-orange-600;
    }

    &[disabled] {
      background-color: colors.$awsui-color-grey-400;
    }
  }

</style>