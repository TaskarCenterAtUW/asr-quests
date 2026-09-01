<!-- @format -->

<script setup>
import { computed } from "vue";
import { useQuestStore } from "../stores/questStore";
import ImagePreview from "./ImagePreview.vue";
import ChoiceList from "./ChoiceList.vue";
import NumericValidation from "./NumericValidation.vue";
import DependencyEditor from "./DependencyEditor.vue";
import AutoCaptureAttributes from "./AutoCaptureAttributes.vue";

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
const questIdPath = computed(() => `${questBase.value}/quest_id`);
const questTitlePath = computed(() => `${questBase.value}/quest_title`);
const questDescriptionPath = computed(
    () => `${questBase.value}/quest_description`
);
const questTypePath = computed(() => `${questBase.value}/quest_type`);
const questTagPath = computed(() => `${questBase.value}/quest_tag`);
const questImagePath = computed(() => `${questBase.value}/quest_image_url`);
const isAutoCapture = computed(() => quest.value?.quest_type === "AutoCapture");

function update(fields) {
    store.updateQuest(props.elementIndex, props.questIndex, fields);
}
</script>

<template>
    <div v-if="quest" class="row g-2">
        <div class="col-md-4">
            <label
                :for="`quest-id-${elementIndex}-${questIndex}`"
                class="form-label"
                >Quest ID</label
            >
            <input
                :id="`quest-id-${elementIndex}-${questIndex}`"
                type="number"
                class="form-control form-control-sm"
                :value="quest.quest_id"
                :class="{ 'is-invalid': store.hasValidationError(questIdPath) }"
                @input="update({ quest_id: Number($event.target.value) || 0 })"
            />
        </div>

        <div class="col-md-8">
            <label
                :for="`quest-title-${elementIndex}-${questIndex}`"
                class="form-label"
                >Quest Title
                <span aria-hidden="true" class="text-danger">*</span></label
            >
            <input
                :id="`quest-title-${elementIndex}-${questIndex}`"
                type="text"
                class="form-control form-control-sm"
                :value="quest.quest_title"
                required
                aria-required="true"
                :class="{
                    'is-invalid': store.hasValidationError(questTitlePath),
                }"
                @input="update({ quest_title: $event.target.value })"
            />
        </div>

        <div class="col-12">
            <label
                :for="`quest-desc-${elementIndex}-${questIndex}`"
                class="form-label"
                >Description
                <span aria-hidden="true" class="text-danger">*</span></label
            >
            <textarea
                :id="`quest-desc-${elementIndex}-${questIndex}`"
                class="form-control form-control-sm"
                rows="2"
                :value="quest.quest_description"
                required
                aria-required="true"
                :class="{
                    'is-invalid':
                        store.hasValidationError(questDescriptionPath),
                }"
                @input="update({ quest_description: $event.target.value })"
            ></textarea>
        </div>

        <div class="col-md-6">
            <label
                :for="`quest-type-${elementIndex}-${questIndex}`"
                class="form-label"
                >Quest Type
                <span aria-hidden="true" class="text-danger">*</span></label
            >
            <select
                :id="`quest-type-${elementIndex}-${questIndex}`"
                class="form-select form-select-sm"
                :value="quest.quest_type"
                required
                aria-required="true"
                :class="{
                    'is-invalid': store.hasValidationError(questTypePath),
                }"
                @change="update({ quest_type: $event.target.value })"
            >
                <option value="ExclusiveChoice">ExclusiveChoice</option>
                <option value="MultipleChoice">MultipleChoice</option>
                <option value="Numeric">Numeric</option>
                <option value="TextEntry">TextEntry</option>
                <option value="AutoCapture">AutoCapture</option>
            </select>
        </div>

        <div v-if="isAutoCapture" class="col-md-6 d-flex align-items-end">
            <div class="form-text small mb-2">
                (only available on iOS devices with LiDAR sensors)
            </div>
        </div>

        <div v-else class="col-md-6">
            <label
                :for="`quest-tag-${elementIndex}-${questIndex}`"
                class="form-label"
                >Quest Tag
                <span aria-hidden="true" class="text-danger">*</span></label
            >
            <input
                :id="`quest-tag-${elementIndex}-${questIndex}`"
                type="text"
                class="form-control form-control-sm"
                :value="quest.quest_tag"
                required
                aria-required="true"
                :class="{
                    'is-invalid': store.hasValidationError(questTagPath),
                }"
                @input="update({ quest_tag: $event.target.value })"
            />
        </div>

        <div class="col-12">
            <label
                :for="`quest-image-${elementIndex}-${questIndex}`"
                class="form-label"
                >Quest Image URL</label
            >
            <input
                :id="`quest-image-${elementIndex}-${questIndex}`"
                type="url"
                class="form-control form-control-sm"
                :value="quest.quest_image_url"
                placeholder="https://example.com/image.jpg"
                :aria-describedby="`quest-image-hint-${elementIndex}-${questIndex}`"
                :class="{
                    'is-invalid': store.hasValidationError(questImagePath),
                }"
                @input="update({ quest_image_url: $event.target.value })"
            />
            <div
                :id="`quest-image-hint-${elementIndex}-${questIndex}`"
                class="form-text small"
            >
                PNG or JPEG, &lt; 0.5 MB, portrait, ~480 px × ~720 px
            </div>
            <ImagePreview
                :url="quest.quest_image_url"
                :alt="`Preview for quest ${quest.quest_title || quest.quest_id}`"
            />
        </div>

        <ChoiceList :element-index="elementIndex" :quest-index="questIndex" />
        <NumericValidation
            :element-index="elementIndex"
            :quest-index="questIndex"
        />
        <AutoCaptureAttributes
            :element-index="elementIndex"
            :quest-index="questIndex"
        />
        <DependencyEditor
            :element-index="elementIndex"
            :quest-index="questIndex"
        />
    </div>
</template>
