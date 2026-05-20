<!-- @format -->

<script setup>
import { computed, ref, watch } from "vue";
import { useClipboard } from "@vueuse/core";
import { useQuestStore } from "../stores/questStore";

const store = useQuestStore();
const { copy, copied } = useClipboard();

const manualFilename = ref(false);
const filename = ref("");

const validationErrors = computed(() => store.validationErrors);
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

function useSuggestedFilename() {
    manualFilename.value = false;
    filename.value = suggestedFilename.value;
}
</script>

<template>
    <div class="d-flex flex-column gap-2">
        <div class="row g-2 align-items-end">
            <div class="col-md-8">
                <label for="export-filename" class="form-label small mb-1">Filename</label>
                <input
                    id="export-filename"
                    type="text"
                    class="form-control form-control-sm"
                    :value="filename"
                    placeholder="quest-definition.json"
                    @input="onFilenameInput"
                />
            </div>

            <div class="col-md-4 d-flex gap-2 justify-content-md-end">
                <button type="button" class="btn btn-sm btn-outline-secondary py-1 px-2" @click="useSuggestedFilename">
                    Use suggested
                </button>
            </div>
        </div>

        <div class="d-flex gap-2 flex-wrap">
            <button
                type="button"
                class="btn btn-sm btn-primary py-1 px-2"
                :disabled="!canExport"
                @click="downloadJson"
            >
                Download .json
            </button>

            <button
                type="button"
                class="btn btn-sm btn-outline-primary py-1 px-2"
                :disabled="!canExport"
                @click="copyJson"
            >
                Copy to Clipboard
            </button>

            <span v-if="copied" class="small text-success align-self-center">Copied</span>
        </div>
    </div>
</template>
