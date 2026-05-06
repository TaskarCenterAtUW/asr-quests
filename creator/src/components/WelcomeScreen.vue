<!-- @format -->

<script setup>
import { ref } from "vue";
import { useQuestStore } from "../stores/questStore";

const store = useQuestStore();
const emit = defineEmits(["navigate"]);

// ── Load Existing ─────────────────────────────────────────────────────────
const fileInput = ref(null);
const loadError = ref("");

function triggerFileInput() {
    loadError.value = "";
    fileInput.value.click();
}

async function onFileChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    // Reset so the same file can be re-selected after an error
    event.target.value = "";

    let parsed;
    try {
        const text = await file.text();
        parsed = JSON.parse(text);
    } catch {
        loadError.value = "Could not parse file — make sure it is valid JSON.";
        return;
    }

    try {
        store.loadFromJson(parsed);
        emit("navigate", "editor");
    } catch (err) {
        loadError.value = err.message;
    }
}

// ── Create New ────────────────────────────────────────────────────────────
function createNew() {
    store.resetDefinition();
    emit("navigate", "editor");
}
</script>

<template>
    <div class="container py-5">
        <div class="row justify-content-center mb-4">
            <div class="col-auto text-center">
                <h1 class="display-5 fw-bold">Quest Definition Creator</h1>
                <p class="text-muted">
                    Build or edit an ASR quest definition file.
                </p>
            </div>
        </div>

        <div class="row justify-content-center g-4">
            <!-- Create New -->
            <div class="col-sm-10 col-md-5 col-lg-4">
                <div class="card h-100 shadow-sm">
                    <div class="card-body d-flex flex-column">
                        <h2 class="card-title h5">Create New</h2>
                        <p class="card-text text-muted flex-grow-1">
                            Start from a blank v3.0.0 definition.
                        </p>
                        <button class="btn btn-primary mt-3" @click="createNew">
                            Create New Definition
                        </button>
                    </div>
                </div>
            </div>

            <!-- Load Existing -->
            <div class="col-sm-10 col-md-5 col-lg-4">
                <div
                    class="card h-100 shadow-sm"
                    :class="{ 'border-danger': loadError }"
                >
                    <div class="card-body d-flex flex-column">
                        <h2 class="card-title h5">Load Existing JSON</h2>
                        <p class="card-text text-muted flex-grow-1">
                            Open an existing v3.0.0 quest definition file.
                        </p>

                        <!-- Hidden file input -->
                        <input
                            ref="fileInput"
                            type="file"
                            accept=".json,application/json"
                            class="visually-hidden"
                            aria-hidden="true"
                            tabindex="-1"
                            @change="onFileChange"
                        />

                        <button
                            class="btn btn-outline-primary mt-3"
                            @click="triggerFileInput"
                        >
                            Choose File&hellip;
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
