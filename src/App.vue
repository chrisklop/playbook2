<template>
    <div v-if="appErrors.length > 0" class="error-container" :style="theme">
        <Error :errors="appErrors" />
    </div>
    <template v-else>
        <div id="modal-root" :style="theme" />
        <AppShell />
    </template>
</template>

<script setup lang="ts">
import "@fontsource/roboto-mono";
import Error from "components/Error.vue";
import state from "game/state";
import type { CSSProperties } from "vue";
import { computed, toRef } from "vue";
import AppShell from "./ui/AppShell.vue";
import themes from "./data/themes";
import settings from "./game/settings";
import "./main.css";
import "./ui/buttons.css";

const theme = computed(() => themes[settings.theme].variables as CSSProperties);
const appErrors = toRef(state, "errors");
</script>

<style scoped>
#modal-root {
    position: absolute;
    min-height: 100%;
    height: 100%;
    color: var(--foreground);
}

.error-container {
    background: var(--background);
    overflow: auto;
    width: 100%;
    height: 100%;
}

.error-container > .error {
    position: static;
}
</style>
