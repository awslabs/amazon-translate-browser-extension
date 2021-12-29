<!--
  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
  SPDX-License-Identifier: Apache-2.0
-->
<template>
  <main class="w-[300px] px-4 py-5 text-center text-gray-700">
    <!-- <Logo /> -->
    <h1 class="text-lg">Amazon Translate</h1>
    <p>Select your source and target languages.</p>

    <div
      v-if="status !== '' && status !== 'translating'"
      class="form-message text-left"
      :class="{ hasError: status === 'error' }"
      style="max-width: 245px; margin: auto"
    >
      {{ message }}
    </div>

    <form>
      <select v-model="form.sourceLang" class="px-8 py-2 my-2">
        <option v-for="lang in languages" :key="lang.code" :value="lang.code">
          {{ lang.label }}
        </option>
      </select>

      <select v-model="form.targetLang" class="px-8 py-2 my-2">
        <option
          v-for="lang in languages"
          :key="lang.code"
          :value="lang.code"
          :selected="lang.default"
        >
          {{ lang.label }}
        </option>
      </select>

      <button
        class="aws-btn my-2"
        :disabled="status === 'translating'"
        @click="translatePage"
      >
        <span v-if="status === 'translating'">
          <Spinner />
        </span>
        {{ status === "translating" ? "Translating..." : "Translate" }}
      </button>
    </form>

    <div class="mt-2">
      <a @click="openOptionsPage" href="#">Extension Settings</a><br /><br />
      <template v-if="cachingEnabled">
        <a @click="clearPageCache" href="#">Clear Cache for this Page</a>
      </template>
    </div>
  </main>
</template>

<script lang="ts">
import { TranslateClientConfig } from "@aws-sdk/client-translate";
import { onMessage, sendMessage } from "webext-bridge";
import * as lockr from "lockr";
import Spinner from "./Spinner.vue";
import { languages, getCurrentTabId } from "../util";
import { TranslateStatusData } from "../_contracts";

lockr.setPrefix("amazonTranslate_");

export default defineComponent({
  components: {
    Spinner,
  },
  data() {
    return {
      status: "",
      message: "",
      region: "",
      accessKeyId: "",
      secretAccessKey: "",
      cachingEnabled: false,
      form: {
        sourceLang: "auto",
        targetLang: "en",
      },
      languages,
    };
  },
  mounted() {
    this.region = lockr.get("awsRegion", "");
    this.accessKeyId = lockr.get("awsAccessKeyId", "");
    this.secretAccessKey = lockr.get("awsSecretAccessKey", "");
    this.cachingEnabled = lockr.get("cachingEnabled", false);

    onMessage("status", async ({ data: _data }) => {
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
        this.status = "";
        this.message = "";

        if (
          [this.region, this.accessKeyId, this.secretAccessKey].includes("")
        ) {
          throw new Error("Your credentials are invalid.");
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

        sendMessage("translate", message, {
          context: "content-script",
          tabId,
        });
      } catch (err) {
        this.status = "error";
        this.message =
          "An error occurred when attempting to translate.\n Please check your credentials and try again.";
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
        "clearCache",
        { tabId },
        {
          context: "content-script",
          tabId,
        }
      );
    },
  },
});
</script>

<style lang="scss">
@import "../styles/global.scss";

h1 {
  font-size: 16px;
  font-weight: bold;
}

select {
  display: inline-block;
  padding: 4px 15px;
  border: 1px solid $awsGray;
  border-radius: 2px;
}

.password-input {
  text-align: left;
  max-width: 245px;
  margin: auto;
}
</style>