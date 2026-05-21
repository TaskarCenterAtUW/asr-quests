<!-- @format -->

<script setup>
import { computed } from "vue";
import { useQuestStore } from "../stores/questStore";

const props = defineProps({
    elementIndex: { type: Number, required: true },
    questIndex: { type: Number, required: true },
});

const store = useQuestStore();

const quest = computed(
    () =>
        store.definition.elements[props.elementIndex]?.quests[props.questIndex]
);

const questBase = computed(
    () => `/elements/${props.elementIndex}/quests/${props.questIndex}`
);
const minPath = computed(
    () => `${questBase.value}/quest_answer_validation/min`
);
const maxPath = computed(
    () => `${questBase.value}/quest_answer_validation/max`
);
const hasRangeConflict = computed(() => {
    return (
        quest.value?._validEnableMin &&
        quest.value?._validEnableMax &&
        quest.value?._validMin != null &&
        quest.value?._validMax != null &&
        quest.value._validMin > quest.value._validMax
    );
});

function update(fields) {
    store.updateQuest(props.elementIndex, props.questIndex, fields);
}

function parseNumericValue(rawValue) {
    const trimmedValue = rawValue.trim();
    if (!trimmedValue) {
        return null;
    }

    const parsedValue = Number(trimmedValue);
    return Number.isFinite(parsedValue) ? parsedValue : null;
}

function updateNumericBound(fieldName, rawValue) {
    update({ [fieldName]: parseNumericValue(rawValue) });
}

function toggleMin(enabled) {
    update({
        _validEnableMin: enabled,
        _validMin: enabled ? (quest.value?._validMin ?? 0) : null,
    });
}

function toggleMax(enabled) {
    update({
        _validEnableMax: enabled,
        _validMax: enabled ? (quest.value?._validMax ?? 0) : null,
    });
}
</script>

<template>
    <section
        v-if="quest && quest.quest_type === 'Numeric'"
        class="col-12 mt-3 pt-2 border-top"
    >
        <h3 class="h6 mb-2 fw-semibold">Numeric Validation</h3>

        <div class="row g-2 align-items-end">
            <div class="col-md-6">
                <div class="form-check form-switch mb-1">
                    <input
                        :id="`numeric-min-enabled-${elementIndex}-${questIndex}`"
                        class="form-check-input"
                        type="checkbox"
                        :checked="quest._validEnableMin"
                        @change="toggleMin($event.target.checked)"
                    />
                    <label
                        :for="`numeric-min-enabled-${elementIndex}-${questIndex}`"
                        class="form-check-label"
                    >
                        Enable minimum
                    </label>
                </div>
                <input
                    v-if="quest._validEnableMin"
                    :id="`numeric-min-${elementIndex}-${questIndex}`"
                    type="number"
                    class="form-control form-control-sm"
                    :value="quest._validMin ?? ''"
                    placeholder="Minimum value"
                    :class="{ 'is-invalid': store.hasValidationError(minPath) }"
                    @input="
                        updateNumericBound('_validMin', $event.target.value)
                    "
                />
            </div>

            <div class="col-md-6">
                <div class="form-check form-switch mb-1">
                    <input
                        :id="`numeric-max-enabled-${elementIndex}-${questIndex}`"
                        class="form-check-input"
                        type="checkbox"
                        :checked="quest._validEnableMax"
                        @change="toggleMax($event.target.checked)"
                    />
                    <label
                        :for="`numeric-max-enabled-${elementIndex}-${questIndex}`"
                        class="form-check-label"
                    >
                        Enable maximum
                    </label>
                </div>
                <input
                    v-if="quest._validEnableMax"
                    :id="`numeric-max-${elementIndex}-${questIndex}`"
                    type="number"
                    class="form-control form-control-sm"
                    :value="quest._validMax ?? ''"
                    placeholder="Maximum value"
                    :class="{ 'is-invalid': store.hasValidationError(maxPath) }"
                    @input="
                        updateNumericBound('_validMax', $event.target.value)
                    "
                />
            </div>
        </div>

        <div v-if="hasRangeConflict" class="form-text text-danger mt-2">
            The minimum value must be less than or equal to the maximum value.
        </div>
    </section>
</template>
