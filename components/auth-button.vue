<script lang="ts" setup>
import { createAuthClient } from "better-auth/client";

const authClient = createAuthClient();

const loading = ref(false);

async function signIn() {
  loading.value = true;
  await authClient.signIn.social({
    provider: "github",
  });
  loading.value = false;
}
</script>

<template>
  <button :disabled="loading" class="btn btn-accent" @click="signIn">
    Sign In
    <span v-if="loading" class="loading loading-spinner loading-md" />
    <Icon v-else name="tabler:brand-github" size="24" />
  </button>
</template>
