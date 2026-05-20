<!-- @format -->

<script setup>
import { computed } from "vue";
import { useQuestStore } from "../stores/questStore";

const store = useQuestStore();

function escapeHtml(value) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function syntaxHighlight(jsonText) {
    return jsonText.replace(
        /("(?:[^"\\]|\\.)*"(?:\s*:)?|\b-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b|\btrue\b|\bfalse\b|\bnull\b)/g,
        (token) => {
            const safeToken = escapeHtml(token);

            if (token.startsWith('"')) {
                return token.endsWith(":")
                    ? `<span class="json-key">${safeToken}</span>`
                    : `<span class="json-string">${safeToken}</span>`;
            }

            if (token === "true" || token === "false") {
                return `<span class="json-boolean">${safeToken}</span>`;
            }

            if (token === "null") {
                return `<span class="json-null">${safeToken}</span>`;
            }

            return `<span class="json-number">${safeToken}</span>`;
        }
    );
}

const prettyJson = computed(() => JSON.stringify(store.fullJson, null, 2));

const highlightedJson = computed(() => syntaxHighlight(prettyJson.value));
</script>

<template>
    <pre class="json-preview mb-0" v-html="highlightedJson"></pre>
</template>

<style>
.json-preview {
    max-height: 320px;
    overflow: auto;
    margin: 0;
    padding: 0;
    font-size: 0.78rem;
    line-height: 1.45;
    white-space: pre;
    background: transparent;
}

.json-key {
    color: #0d6efd;
}

.json-string {
    color: #198754;
}

.json-number {
    color: #d63384;
}

.json-boolean {
    color: #fd7e14;
}

.json-null {
    color: #6c757d;
}
</style>
