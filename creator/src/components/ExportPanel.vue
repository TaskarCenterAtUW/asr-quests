<!-- @format -->

<script setup>
import { computed, ref, watch } from "vue";
import { useClipboard } from "@vueuse/core";
import { useQuestStore } from "../stores/questStore";

const store = useQuestStore();
const { copy, copied } = useClipboard({ copiedDuring: 3500 });

const manualFilename = ref(false);
const filename = ref("");

const validationErrors = computed(() => store.validationErrors);
const validationWarnings = computed(() => store.validationWarnings);
const canExport = computed(() => validationErrors.value.length === 0);

function slugify(value) {
    const normalized = value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    return normalized || "quest-definition";
}

const suggestedFilename = computed(() => {
    const firstElementType = store.definition.elements[0]?.element_type || "";
    return `${slugify(firstElementType)}.json`;
});

watch(
    suggestedFilename,
    (next) => {
        if (!manualFilename.value || !filename.value) {
            filename.value = next;
        }
    },
    { immediate: true }
);

const exportJson = computed(() => JSON.stringify(store.fullJson, null, 2));

function resolvedFilename() {
    const raw = filename.value.trim() || suggestedFilename.value;
    return raw.toLowerCase().endsWith(".json") ? raw : `${raw}.json`;
}

async function downloadJson() {
    if (!canExport.value) return;

    const blob = new Blob([exportJson.value], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = resolvedFilename();
    anchor.click();
    URL.revokeObjectURL(url);
}

async function copyJson() {
    if (!canExport.value) return;
    await copy(exportJson.value);
}

function onFilenameInput(event) {
    manualFilename.value = true;
    filename.value = event.target.value;
}
</script>

<template>
    <div class="d-flex flex-column gap-3">
        <div v-if="validationWarnings.length > 0" class="small text-muted">
            Export remains available, but the validator still recommends
            reviewing the warnings above.
        </div>

        <div>
            <label for="export-filename" class="form-label small mb-1"
                >Filename</label
            >
            <input
                id="export-filename"
                type="text"
                class="form-control form-control-sm"
                :value="filename"
                placeholder="quest-definition.json"
                @input="onFilenameInput"
            />
        </div>

        <div class="d-flex gap-2 flex-wrap">
            <button
                type="button"
                class="btn btn-sm btn-primary py-1 px-2 d-inline-flex align-items-center gap-2"
                :disabled="!canExport"
                @click="downloadJson"
            >
                <svg
                    aria-hidden="true"
                    width="13"
                    height="13"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                >
                    <path
                        d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"
                    />
                    <path
                        d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"
                    />
                </svg>
                Download
            </button>

            <button
                type="button"
                class="btn btn-sm btn-outline-primary py-1 px-2 d-inline-flex align-items-center gap-2"
                :disabled="!canExport"
                @click="copyJson"
            >
                <svg
                    aria-hidden="true"
                    width="13"
                    height="13"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                >
                    <path
                        d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"
                    />
                    <path
                        d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"
                    />
                </svg>
                Copy to Clipboard
            </button>

            <span v-if="copied" class="small text-success align-self-center"
                >Copied!</span
            >
        </div>
    </div>
</template>
