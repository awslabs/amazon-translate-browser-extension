<!--
  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
  SPDX-License-Identifier: Apache-2.0
-->
<script lang="ts">
import * as lockr from "lockr";
import regionData from "./regions.json";

lockr.setPrefix("amazonTranslate_");

export default defineComponent({
  data() {
    return {
      regions: regionData.regions,
      hasError: false,
      message: "",
      configuration: {
        awsRegion: "",
        awsAccessKeyId: "",
        awsSecretAccessKey: "",
        password: "",
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
      const { awsRegion, awsAccessKeyId, awsSecretAccessKey, cachingEnabled } =
        this.configuration;

      // Validate that the values are all set
      if (
        awsRegion !== "" &&
        awsAccessKeyId !== "" &&
        awsSecretAccessKey !== ""
      ) {
        lockr.set("awsRegion", awsRegion);
        lockr.set("awsAccessKeyId", awsAccessKeyId);
        lockr.set("awsSecretAccessKey", awsSecretAccessKey);
        lockr.set("cachingEnabled", cachingEnabled);

        // Inform the user that the save was successful
        this.hasError = false;
        this.message = "Successfully saved your settings.";
      } else {
        this.hasError = true;
        this.message = "All fields are required in order to save the settings.";
      }
    },
  },
  async mounted() {
    this.hasError = false;
    this.message = "";
    this.configuration.awsRegion = lockr.get("awsRegion", "");
    this.configuration.awsAccessKeyId = lockr.get("awsAccessKeyId", "");
    this.configuration.awsSecretAccessKey = lockr.get("awsSecretAccessKey", "");
    this.configuration.cachingEnabled = lockr.get("cachingEnabled", true);
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
          To use the Amazon Translate Extension you will need to provide the
          accessKeyId and secretAccessKey from an IAM user with a sufficient
          policy.
        </li>
        <li>
          Select a region nearest to you that supports the language pairs you
          need.
        </li>
      </ul>

      <div class="aws-form-row">
        <label for="aws-region">AWS Region*</label>
        <select
          id="aws-region"
          class="aws-field"
          v-model="configuration.awsRegion"
        >
          <option
            v-for="(name, value) in regions"
            :value="value"
            :selected="value === 'us-east-1'"
          >
            {{ name }}
          </option>
        </select>
      </div>

      <div class="aws-form-row">
        <label for="aws-access-key-id">AWS Access Key ID*</label>
        <input
          v-model="configuration.awsAccessKeyId"
          id="aws-access-key-id"
          class="aws-field"
        />
      </div>

      <div class="aws-form-row">
        <label for="aws-secret-access-key">AWS Secret Access Key*</label>
        <input
          v-model="configuration.awsSecretAccessKey"
          id="aws-secret-access-key"
          class="aws-field"
        />
      </div>

      <div class="aws-form-row">
        <label for="enable-caching">Enable Translation Caching</label>
        <p>
          If caching is enabled translations will be stored on your computer for
          the language pair you have selected. Subsequent translation requests
          for the same webpage will use the cached translation which makes it
          much faster and does not create extra requests to Amazon Translate
          (which will save you money). If you need to clear the cache for a
          page, a link will be available on the extension popup that will clear
          the cache for that page when clicked.
        </p>
        <input
          type="checkbox"
          id="enable-caching"
          v-model="configuration.cachingEnabled"
          :checked="configuration.cachingEnabled"
        />
      </div>

      <div class="aws-form-row">
        <button class="aws-btn" @click="saveSettings">Save Settings</button>
      </div>
    </div>
  </main>
</template>

<style lang="scss">
@import "../styles/global.scss";

.information-list {
  font-size: 14px;

  li {
    margin: 0 0 10px 30px;
    list-style-type: disc;
  }
}

label {
  font-weight: bold;
}
</style>
