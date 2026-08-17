<!-- @format -->

<script setup>
import { computed } from "vue";
import { useQuestStore } from "../stores/questStore";

const store = useQuestStore();
const fieldPath = "/recency_period";
const hasError = computed(() => store.hasValidationError(fieldPath));
const errorMessage = computed(
    () =>
        store.validationErrors.find(
            (error) => error.instancePath === fieldPath
        )?.message || ""
);
const recencyInputValue = computed(() =>
    store.definition.recency_period === 90
        ? "90 (default)"
        : String(store.definition.recency_period ?? "")
);

function updateRecency(event) {
    store.setRecencyPeriod(
        event.target.value.replace(/\s*\(default\)\s*$/, "")
    );
}
</script>

<template>
    <section class="card creator-surface-card creator-panel-card">
        <div class="card-header">
            <h2 class="h6 mb-0">Definition Settings</h2>
        </div>
        <div class="card-body">
            <div class="d-flex align-items-center gap-2 flex-wrap">
                <label for="recency-period" class="form-label fw-semibold mb-0"
                    >Resurvey Interval:</label
                >
                <div>
                    <input
                        id="recency-period"
                        type="text"
                        class="form-control form-control-sm creator-recency-input"
                        min="1"
                        step="1"
                        inputmode="numeric"
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
