<!--
  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
  SPDX-License-Identifier: Apache-2.0
-->
<script lang="ts">
  import { lockr } from '../modules';
  import regionData from './regions.json';
  import { AwsOptions, ExtensionOptions, languages } from '~/constants';

  export default defineComponent({
    data() {
      return {
        regions: regionData.regions,
        hasError: false,
        message: '',
        languages,
        showAccessKeyId: false,
        showSecretAccessKey: false,
        configuration: {
          awsRegion: '',
          awsAccessKeyId: '',
          awsSecretAccessKey: '',
          password: '',
          defaultSourceLang: 'auto',
          defaultTargetLang: 'en',
          cachingEnabled: true,
        },
      };
    },
    methods: {
      /**
       * Saves the user credentials to localStorage after encrypting them using the user's
       * specified password.
       */
      saveSettings() {
        // Get the values
        const {
          awsRegion,
          awsAccessKeyId,
          awsSecretAccessKey,
          defaultSourceLang,
          defaultTargetLang,
          cachingEnabled,
        } = this.configuration;

        // Validate that the values are all set
        if (awsRegion !== '' && awsAccessKeyId !== '' && awsSecretAccessKey !== '') {
          lockr.set(AwsOptions.AWS_REGION, awsRegion);
          lockr.set(AwsOptions.AWS_ACCESS_KEY_ID, awsAccessKeyId);
          lockr.set(AwsOptions.AWS_SECRET_ACCESS_KEY, awsSecretAccessKey);
          lockr.set(ExtensionOptions.DEFAULT_SOURCE_LANG, defaultSourceLang);
          lockr.set(ExtensionOptions.DEFAULT_TARGET_LANG, defaultTargetLang);
          lockr.set(ExtensionOptions.CACHING_ENABLED, cachingEnabled);

          // Notify the user that the save was successful
          this.hasError = false;
          this.message = 'Successfully saved your settings.';
        } else {
          // Notify the user that the save failed because required fields are blank
          this.hasError = true;
          this.message = 'The AWS Region, AWS Access Key ID, and AWS Secret Access Key are required.';
        }
      },
    },
    async mounted() {
      this.hasError = false;
      this.message = '';
      this.configuration.awsRegion = lockr.get(AwsOptions.AWS_REGION, '');
      this.configuration.awsAccessKeyId = lockr.get(AwsOptions.AWS_ACCESS_KEY_ID, '');
      this.configuration.awsSecretAccessKey = lockr.get(AwsOptions.AWS_SECRET_ACCESS_KEY, '');
      this.configuration.defaultSourceLang = lockr.get(ExtensionOptions.DEFAULT_SOURCE_LANG, 'auto');
      this.configuration.defaultTargetLang = lockr.get(ExtensionOptions.DEFAULT_TARGET_LANG, 'en');
      this.configuration.cachingEnabled = lockr.get(ExtensionOptions.CACHING_ENABLED, true);
    },
  });
</script>

<template>
  <main class="container aws-container">
    <div class="form-header">
      <h1>AWS Translate Extension Settings</h1>
    </div>

    <div class="form-container">

      <div v-if="message !== ''" class="form-message" :class="{ hasError }">
        {{ message }}
      </div>

      <ul class="information-list">
        <li>
          To use the Amazon Translate Extension you will need to provide the accessKeyId and
          secretAccessKey from an IAM user with a sufficient policy.
        </li>
        <li>Select a region nearest to you that supports the language pairs you need.</li>
        <li>
          For more detailed information about setting up this extension, refer to the following AWS Blog post:
          <a href="https://aws.amazon.com/blogs/machine-learning/use-a-web-browser-plugin-to-quickly-translate-text-with-amazon-translate/">Use a web browser plugin to quickly translate text with Amazon Translate</a>
        </li>
        <li>
          <strong>Hint:</strong> You can translate a page with your default source language and target language by pressing the keys <em>Alt + Shift + T</em>.
        </li>
      </ul>

      <div class="aws-form-row">
        <label for="aws-region">AWS Region*</label>
        <select id="aws-region" class="aws-field" v-model="configuration.awsRegion" :class="{ error: hasError && !configuration.awsRegion }">
          <option v-for="(name, value) in regions" :value="value" :selected="value === 'us-east-1'">
            {{ name }}
          </option>
        </select>
      </div>

      <div class="aws-form-row">
        <label for="aws-access-key-id">AWS Access Key ID*</label>
        <div class="with-show-container">
          <div class="input-container">
            <input
              v-model="configuration.awsAccessKeyId"
              id="aws-access-key-id"
              :type="showAccessKeyId ? 'text' : 'password'"
              class="aws-field"
              :class="{ error: hasError && !configuration.awsAccessKeyId }"
            />
          </div>
          <div class="show-container">
            <show-button @show="showAccessKeyId = !showAccessKeyId" />
          </div>
        </div>

      </div>

      <div class="aws-form-row">
        <label for="aws-secret-access-key">AWS Secret Access Key*</label>
        <div class="with-show-container">
          <div class="input-container">
            <input
              v-model="configuration.awsSecretAccessKey"
              id="aws-secret-access-key"
              :type="showSecretAccessKey ? 'text' : 'password'"
              class="aws-field"
              :class="{ error: hasError && !configuration.awsSecretAccessKey }"
            />
          </div>
          <div class="show-container">
            <show-button @show="showSecretAccessKey = !showSecretAccessKey" />
          </div>
        </div>
      </div>

      <div class="aws-form-row">
        <label for="aws-region">Default Source Language</label>
        <p>Set the language you would like to translate from by default.</p>
        <select v-model="configuration.defaultSourceLang" class="aws-field">
          <option
            v-for="lang in languages"
            :key="lang.code"
            :value="lang.code"
            :selected="lang.code === configuration.defaultSourceLang"
          >
            {{ lang.label }}
          </option>
        </select>
      </div>

      <div class="aws-form-row">
        <label for="aws-region">Default Target Language</label>
        <p>Set the language you would like to translate to by default.</p>
        <select v-model="configuration.defaultTargetLang" class="aws-field">
          <template v-for="lang in languages">
            <option
              v-if="lang.code !== 'auto'"
              :key="lang.code"
              :value="lang.code"
              :selected="lang.code === configuration.defaultTargetLang"
            >
              {{ lang.label }}
            </option>
          </template>
        </select>
      </div>

      <div class="aws-form-row">
        <label for="enable-caching">Enable Translation Caching</label>
        <p>
          If caching is enabled translations will be stored on your computer for the language pair
          you have selected. Subsequent translation requests for the same webpage will use the
          cached translation which makes it much faster and does not create extra requests to Amazon
          Translate (which will save you money). If you need to clear the cache for a page, a link
          will be available on the extension popup that will clear the cache for that page when
          clicked.
        </p>
        <input
          type="checkbox"
          id="enable-caching"
          v-model="configuration.cachingEnabled"
          :checked="configuration.cachingEnabled"
        />
      </div>

      <div class="aws-form-row">
        <aws-button class="aws-btn" @click="saveSettings" variant="attention">Save Settings</aws-button>
      </div>
    </div>
  </main>
</template>

<style lang="scss">
  @import '../styles/global.scss';

  .information-list {
    font-size: 14px;

    li {
      margin: 0 0 10px 30px;
      list-style-type: disc;
    }
  }

  .with-show-container {
    display: flex;
    gap: 15px;

    .input-container {
      flex: 1 1 auto;
    }

    .show-container {
      flex: 0 1 auto;
    }
  }
</style>
