<!--
  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
  SPDX-License-Identifier: Apache-2.0
-->
<script lang="ts">
  import { TranslateClientConfig } from '@aws-sdk/client-translate';
  import { onMessage, sendMessage } from 'webext-bridge';
  import { lockr } from '../modules';
  import { getCurrentTabId } from '../util';
  import { AwsOptions, ExtensionOptions, languages } from '~/constants';
  import { TranslateStatusData } from '../_contracts';

  export default defineComponent({
    data() {
      return {
        status: '',
        message: '',
        region: '',
        accessKeyId: '',
        secretAccessKey: '',
        cachingEnabled: false,
        form: {
          sourceLang: 'auto',
          targetLang: 'en',
        },
        languages,
      };
    },
    mounted() {
      this.region = lockr.get(AwsOptions.AWS_REGION, '');
      this.accessKeyId = lockr.get(AwsOptions.AWS_ACCESS_KEY_ID, '');
      this.secretAccessKey = lockr.get(AwsOptions.AWS_SECRET_ACCESS_KEY, '');
      this.form.targetLang = lockr.get(ExtensionOptions.DEFAULT_TARGET_LANG, 'en');
      this.cachingEnabled = lockr.get(ExtensionOptions.CACHING_ENABLED, false);

      onMessage('status', async ({ data: _data }) => {
        const data = _data as unknown;
        const { status, message } = data as TranslateStatusData;
        this.status = status;
        this.message = message;
      });
    },
    methods: {
      /**
       * Captures the user's password then attempts to decrypt their IAM credentials for use with
       * the Amazon Translate API. After the credentials are decrypted it sends them via a message
       * to the content-script along with the selected source and target language codes.
       */
      async translatePage(e: Event) {
        try {
          e.preventDefault();
          this.status = '';
          this.message = '';

          if ([this.region, this.accessKeyId, this.secretAccessKey].includes('')) {
            throw new Error('Your credentials are invalid.');
          }

          const credentials = {
            accessKeyId: this.accessKeyId,
            secretAccessKey: this.secretAccessKey,
          };
          const config: TranslateClientConfig = {
            region: this.region,
            credentials,
          };

          const tabId = await getCurrentTabId();

          const message = {
            creds: config,
            langs: {
              source: this.form.sourceLang,
              target: this.form.targetLang,
            },
            tabId,
            cachingEnabled: this.cachingEnabled,
          };

          sendMessage('translate', message, {
            context: 'content-script',
            tabId,
          });
        } catch (err) {
          this.status = 'error';
          this.message =
            'An error occurred when attempting to translate.\n Please check your credentials and try again.';
        }
      },
      /**
       * Navigates the user to the extension's options page so they can set their credentials.
       */
      openOptionsPage() {
        browser.runtime.openOptionsPage();
      },
      /**
       * Attempts the decrypt and retrieve the user's saved regionId with the provided password.
       */
      async clearPageCache() {
        const tabId = await getCurrentTabId();
        sendMessage(
          'clearCache',
          { tabId },
          {
            context: 'content-script',
            tabId,
          }
        );
      },
    },
  });
</script>

<template>
  <main class="popup-container">
    <!-- <Logo /> -->
    <h1 class="header">Amazon Translate</h1>
    <p>Select your source and target languages.</p>

    <div
      v-if="status !== '' && status !== 'translating'"
      class="form-message text-left"
      :class="{ hasError: status === 'error' }"
      style="max-width: 245px; margin: auto"
    >
      {{ message }}
    </div>

    <form class="form-container popup">
      <div>
        <select v-model="form.sourceLang" class="aws-field">
          <option v-for="lang in languages" :key="lang.code" :value="lang.code">
            {{ lang.label }}
          </option>
        </select>
      </div>

      <div>
        <select v-model="form.targetLang" class="aws-field">
          <option
            v-for="lang in languages"
            :key="lang.code"
            :value="lang.code"
            :selected="lang.default"
          >
            {{ lang.label }}
          </option>
        </select>
      </div>

      <div>
        <aws-button
          class="submit-button"
          variant="attention"
          :disabled="status === 'translating'"
          @click="translatePage"
        >
          <span v-if="status === 'translating'">
            <Spinner />
          </span>
          {{ status === 'translating' ? 'Translating...' : 'Translate' }}
        </aws-button>
      </div>
    </form>

    <div class="links">
      <a @click="openOptionsPage" href="#">Extension Settings</a>
      <template v-if="cachingEnabled">
        <a @click="clearPageCache" href="#">Clear Cache for this Page</a>
      </template>
    </div>
  </main>
</template>

<style lang="scss">
  @import '../styles/global.scss';

  .popup-container {
    width: 280px;
    padding: 20px;
    text-align: center;
    font-size: 12px;
    color: rgba(55, 65, 81, 1);
  }

  .header {
    font-size: 18px;
    font-weight: bold;
  }

  .links {
    a {
      display: inline-block;
      margin-top: 10px;
    }
  }

  .password-input {
    text-align: left;
    max-width: 245px;
    margin: auto;
  }

  .form-container {
    &.popup {
      padding: 0px;
      > div {
        margin: 5px 0;
      }
    }
  }

  .submit-button {
    width: 100%;
  }
</style>
