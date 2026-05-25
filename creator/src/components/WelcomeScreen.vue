<!-- @format -->

<script setup>
import { computed, ref } from "vue";
import { useQuestStore } from "../stores/questStore";

const store = useQuestStore();
const emit = defineEmits(["navigate"]);

const fileInput = ref(null);
const loadError = ref("");

const hasDraft = computed(() => store.editorStarted);
const draftSummary = computed(() => {
    const elementCount = store.definition.elements.length;
    const questCount = store.definition.elements.reduce(
        (total, element) => total + element.quests.length,
        0
    );

    return `${elementCount} element${elementCount === 1 ? "" : "s"}, ${questCount} quest${questCount === 1 ? "" : "s"}`;
});

function triggerFileInput() {
    loadError.value = "";
    fileInput.value?.click();
}

async function onFileChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    event.target.value = "";

    let parsed;
    try {
        const text = await file.text();
        parsed = JSON.parse(text);
    } catch {
        loadError.value = "Could not parse file. Make sure it is valid JSON.";
        return;
    }

    try {
        store.loadFromJson(parsed);
        emit("navigate", "editor");
    } catch (error) {
        loadError.value = error.message;
    }
}

function resumeDraft() {
    emit("navigate", "editor");
}

function createNew() {
    loadError.value = "";
    store.resetDefinition();
    emit("navigate", "editor");
}
</script>

<template>
    <div class="creator-home container py-4 py-lg-5">
        <div class="row justify-content-center mb-4">
            <div class="col-12 col-xl-10 text-center">
                <h1 class="display-5 fw-light mb-2">
                    Quest Definition Creator
                </h1>
                <p class="text-muted mb-0">
                    Build or edit an
                    <a
                        href="https://taskarcenteratuw.github.io/tcat-wiki/aviv-scoutroute/"
                        target="_blank"
                        rel="noopener noreferrer"
                        >AVIV ScoutRoute</a
                    >
                    <a
                        href="https://taskarcenteratuw.github.io/tcat-wiki/aviv-scoutroute/quests/"
                        target="_blank"
                        rel="noopener noreferrer"
                        >quest definition</a
                    >
                    with starter templates and live validation.
                </p>
            </div>
        </div>

        <div class="row justify-content-center g-4">
            <div v-if="hasDraft" class="col-sm-10 col-lg-4">
                <div class="card creator-surface-card creator-home-card h-100">
                    <div class="card-body d-flex flex-column">
                        <h2 class="card-title h5">Resume Draft</h2>
                        <p class="card-text text-muted flex-grow-1 mb-2">
                            Continue the locally saved draft from this browser.
                        </p>
                        <p class="small text-muted mb-3">{{ draftSummary }}</p>
                        <button
                            class="btn btn-primary mt-auto"
                            @click="resumeDraft"
                        >
                            Resume Current Draft
                        </button>
                    </div>
                </div>
            </div>

            <div class="col-sm-10 col-lg-4">
                <div
                    class="card creator-surface-card creator-home-card creator-home-card-primary h-100"
                >
                    <div class="card-body d-flex flex-column">
                        <h2 class="card-title h5">Create New</h2>
                        <p class="card-text text-muted flex-grow-1">
                            Start fresh from a blank
                            {{ store.latestDefinitionVersion }}-version quest
                            definition with helpful presets ready-to-add.
                        </p>
                        <button
                            class="btn btn-primary mt-auto"
                            @click="createNew"
                        >
                            Create New Definition
                        </button>
                    </div>
                </div>
            </div>

            <div class="col-sm-10 col-lg-4">
                <div
                    class="card creator-surface-card creator-home-card h-100"
                    :class="{ 'border border-danger': loadError }"
                >
                    <div class="card-body d-flex flex-column">
                        <h2 class="card-title h5">Load Existing JSON</h2>
                        <p class="card-text text-muted flex-grow-1">
                            Open and modify an existing quest definition.
                        </p>

                        <input
                            ref="fileInput"
                            type="file"
                            accept=".json,application/json"
                            class="d-none"
                            @change="onFileChange"
                        />

                        <button
                            class="btn btn-outline-primary mt-auto"
                            @click="triggerFileInput"
                        >
                            Choose File...
                        </button>

                        <div
                            v-if="loadError"
                            role="alert"
                            class="alert alert-danger mt-3 mb-0 py-2 small"
                        >
                            {{ loadError }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
