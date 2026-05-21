<!-- @format -->

<script setup>
import { computed } from "vue";
import { useQuestStore } from "../stores/questStore";

const store = useQuestStore();

function classifyToken(token) {
    if (token.startsWith('"')) {
        return token.endsWith(":") ? "json-key" : "json-string";
    }

    if (token === "true" || token === "false") {
        return "json-boolean";
    }

    if (token === "null") {
        return "json-null";
    }

    return "json-number";
}

function syntaxHighlight(lineText) {
    const tokenPattern =
        /("(?:[^"\\]|\\.)*"(?:\s*:)?|\b-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b|\btrue\b|\bfalse\b|\bnull\b)/g;
    const tokens = [];
    let lastIndex = 0;

    for (const match of lineText.matchAll(tokenPattern)) {
        const token = match[0];
        const index = match.index ?? 0;

        if (index > lastIndex) {
            tokens.push({
                className: "",
                text: lineText.slice(lastIndex, index),
            });
        }

        tokens.push({ className: classifyToken(token), text: token });
        lastIndex = index + token.length;
    }

    if (lastIndex < lineText.length) {
        tokens.push({ className: "", text: lineText.slice(lastIndex) });
    }

    return tokens;
}

const prettyJson = computed(() => JSON.stringify(store.fullJson, null, 2));

const lines = computed(() => prettyJson.value.split("\n").map(syntaxHighlight));
</script>

<template>
    <div class="json-preview" aria-label="Quest definition JSON preview">
        <div
            v-for="(lineTokens, lineIndex) in lines"
            :key="lineIndex"
            class="json-line"
        >
            <span class="json-line-number" aria-hidden="true">{{
                lineIndex + 1
            }}</span
            ><span class="json-line-code"
                ><span
                    v-for="(token, tokenIndex) in lineTokens"
                    :key="tokenIndex"
                    :class="token.className || null"
                    >{{ token.text }}</span
                ></span
            >
        </div>
    </div>
</template>

<style>
.json-preview {
    max-height: 320px;
    overflow-y: auto;
    overflow-x: hidden;
    margin: 0;
    padding: 0.6rem 0;
    font-size: 0.8rem;
    line-height: 1.6;
    background: color-mix(
        in srgb,
        var(--creator-surface-muted) 80%,
        transparent
    );
    border: 1px solid var(--creator-surface-border);
    border-radius: var(--creator-radius-md);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
    color: var(--creator-ink-soft);
    font-family: var(--creator-mono-font);
}

.json-line {
    display: flex;
    align-items: baseline;
    gap: 0.9em;
    padding: 0 0.85rem;
    min-width: 0;
}

.json-line-number {
    flex-shrink: 0;
    min-width: 2ch;
    text-align: right;
    color: var(--creator-ink-muted);
    user-select: none;
    font-variant-numeric: tabular-nums;
    opacity: 0.5;
}

.json-line-code {
    flex: 1;
    min-width: 0;
    white-space: pre-wrap;
    word-break: break-all;
}

.json-key {
    color: var(--creator-syntax-key);
}

.json-string {
    color: var(--creator-syntax-string);
}

.json-number {
    color: var(--creator-syntax-number);
}

.json-boolean {
    color: var(--creator-syntax-boolean);
}

.json-null {
    color: var(--creator-syntax-null);
}
</style>
