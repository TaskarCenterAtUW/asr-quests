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
