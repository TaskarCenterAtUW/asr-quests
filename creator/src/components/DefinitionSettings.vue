<!-- @format -->

<script setup>
import { computed, ref, watch } from "vue";
import { useQuestStore } from "../stores/questStore";

const store = useQuestStore();
const fieldPath = "/recency_period";
const recencyInputValue = ref("");
const hasError = computed(() => store.hasValidationError(fieldPath));
const errorMessage = computed(
    () =>
        store.validationErrors.find(
            (error) => error.instancePath === fieldPath
        )?.message || ""
);

watch(
    () => store.definition.recency_period,
    (value) => {
        const nextInputValue = value === 90 ? "" : String(value ?? "");
        if (
            recencyInputValue.value !== String(value) &&
            recencyInputValue.value !== nextInputValue
        ) {
            recencyInputValue.value = nextInputValue;
        }
    },
    { immediate: true }
);

function updateRecency(event) {
    recencyInputValue.value = event.target.value;
    store.setRecencyPeriod(event.target.value);
}
</script>

<template>
    <section class="card creator-surface-card creator-panel-card">
        <div class="card-header">
            <div class="creator-panel-heading flex-grow-1">
                <div class="creator-card-info-wrap">
                    <button
                        type="button"
                        class="creator-card-info-btn"
                        aria-label="About Definition Settings: Adjust global settings for all elements and quests."
                    >
                        <svg
                            aria-hidden="true"
                            viewBox="0 0 16 16"
                            width="15"
                            height="15"
                            fill="currentColor"
                        >
                            <path
                                d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0-0-2z"
                            />
                        </svg>
                    </button>
                    <div role="tooltip" class="creator-card-tooltip">
                        Adjust global settings for all elements and quests.
                    </div>
                </div>
                <h2 class="h6 mb-0">Definition Settings</h2>
            </div>
        </div>
        <div class="card-body">
            <div class="d-flex align-items-center gap-2 flex-wrap">
                <label for="recency-period" class="form-label fw-semibold mb-0"
                    >Resurvey Interval:</label
                >
                <div>
                    <input
                        id="recency-period"
                        type="number"
                        class="form-control form-control-sm creator-recency-input"
                        min="1"
                        step="1"
                        inputmode="numeric"
                        placeholder="90 (default)"
                        :value="recencyInputValue"
                        :class="{ 'is-invalid': hasError }"
                        :aria-describedby="hasError ? 'recency-period-error' : undefined"
                        @input="updateRecency"
                    />
                    <div
                        v-if="hasError"
                        id="recency-period-error"
                        class="invalid-feedback"
                    >
                        {{ errorMessage }}
                    </div>
                </div>
                <span>(days)</span>
            </div>
        </div>
    </section>
</template>
