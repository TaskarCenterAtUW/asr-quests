<!-- @format -->

<script setup>
import { computed } from "vue";
import { useQuestStore } from "../stores/questStore";
import ImagePreview from "./ImagePreview.vue";

const props = defineProps({
    elementIndex: { type: Number, required: true },
    questIndex: { type: Number, required: true },
    choiceIndex: { type: Number, required: true },
});

const store = useQuestStore();

const choice = computed(
    () =>
        store.definition.elements[props.elementIndex]?.quests[props.questIndex]
            ?.quest_answer_choices[props.choiceIndex]
);

const choiceBase = computed(
    () =>
        `/elements/${props.elementIndex}/quests/${props.questIndex}/quest_answer_choices/${props.choiceIndex}`
);
const choiceValuePath = computed(() => `${choiceBase.value}/value`);
const choiceTextPath = computed(() => `${choiceBase.value}/choice_text`);
const choiceImagePath = computed(() => `${choiceBase.value}/image_url`);

const followUpEnabled = computed({
    get() {
        return Boolean(choice.value?.choice_follow_up);
    },
    set(enabled) {
        update({
            choice_follow_up: enabled
                ? choice.value?.choice_follow_up || ""
                : "",
        });
    },
});

function update(fields) {
    store.updateChoice(
        props.elementIndex,
        props.questIndex,
        props.choiceIndex,
        fields
    );
}

function setFollowUpEnabled(enabled) {
    followUpEnabled.value = enabled;
}
</script>

<template>
    <div v-if="choice" class="border rounded p-2 bg-body-tertiary">
        <div
            class="d-flex align-items-start justify-content-between gap-2 mb-2"
        >
            <div>
                <div class="fw-semibold small">
                    Choice {{ choiceIndex + 1 }}
                </div>
            </div>
        </div>

        <div class="row g-2">
            <div class="col-md-4">
                <label
                    :for="`choice-value-${elementIndex}-${questIndex}-${choiceIndex}`"
                    class="form-label"
                    >Value
                    <span aria-hidden="true" class="text-danger">*</span></label
                >
                <input
                    :id="`choice-value-${elementIndex}-${questIndex}-${choiceIndex}`"
                    type="text"
                    class="form-control form-control-sm"
                    :value="choice.value"
                    required
                    aria-required="true"
                    :class="{
                        'is-invalid': store.hasValidationError(choiceValuePath),
                    }"
                    @input="update({ value: $event.target.value })"
                />
            </div>

            <div class="col-md-8">
                <label
                    :for="`choice-text-${elementIndex}-${questIndex}-${choiceIndex}`"
                    class="form-label"
                    >Choice Text
                    <span aria-hidden="true" class="text-danger">*</span></label
                >
                <input
                    :id="`choice-text-${elementIndex}-${questIndex}-${choiceIndex}`"
                    type="text"
                    class="form-control form-control-sm"
                    :value="choice.choice_text"
                    required
                    aria-required="true"
                    :class="{
                        'is-invalid': store.hasValidationError(choiceTextPath),
                    }"
                    @input="update({ choice_text: $event.target.value })"
                />
            </div>

            <div class="col-12">
                <label
                    :for="`choice-image-${elementIndex}-${questIndex}-${choiceIndex}`"
                    class="form-label"
                    >Image URL</label
                >
                <input
                    :id="`choice-image-${elementIndex}-${questIndex}-${choiceIndex}`"
                    type="url"
                    class="form-control form-control-sm"
                    :value="choice.image_url"
                    placeholder="https://example.com/choice.jpg"
                    :class="{
                        'is-invalid': store.hasValidationError(choiceImagePath),
                    }"
                    @input="update({ image_url: $event.target.value })"
                />
                <ImagePreview
                    :url="choice.image_url"
                    :alt="`Preview for choice ${choiceIndex + 1}`"
                    :max-width="180"
                    :max-height="120"
                />
            </div>

            <div class="col-12">
                <div class="form-check form-switch mb-1">
                    <input
                        :id="`choice-followup-enabled-${elementIndex}-${questIndex}-${choiceIndex}`"
                        class="form-check-input"
                        type="checkbox"
                        :checked="followUpEnabled"
                        @change="setFollowUpEnabled($event.target.checked)"
                    />
                    <label
                        :for="`choice-followup-enabled-${elementIndex}-${questIndex}-${choiceIndex}`"
                        class="form-check-label"
                    >
                        Enable optional picture-taking prompt
                    </label>
                </div>

                <div v-if="followUpEnabled" class="mt-2">
                    <label
                        :for="`choice-followup-${elementIndex}-${questIndex}-${choiceIndex}`"
                        class="form-label small mb-1"
                        >Picture-Taking Prompt Text</label
                    >
                    <div class="form-text small mb-1">
                        This text is shown with the picture-taking prompt for
                        this choice.
                    </div>
                    <textarea
                        :id="`choice-followup-${elementIndex}-${questIndex}-${choiceIndex}`"
                        class="form-control form-control-sm"
                        rows="3"
                        :value="choice.choice_follow_up"
                        placeholder="Enter the text shown with the picture-taking prompt"
                        @input="
                            update({ choice_follow_up: $event.target.value })
                        "
                    ></textarea>
                </div>
            </div>
        </div>
    </div>
</template>
