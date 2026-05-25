<!-- @format -->

<script setup>
import { computed } from "vue";
import { useQuestStore } from "../stores/questStore";
import IconPicker from "./IconPicker.vue";
import QuestList from "./QuestList.vue";

const props = defineProps({
    elementIndex: { type: Number, required: true },
});

const store = useQuestStore();

const el = () => store.definition.elements[props.elementIndex];

const elementTypePath = computed(
    () => `/elements/${props.elementIndex}/element_type`
);
const questQueryPath = computed(
    () => `/elements/${props.elementIndex}/quest_query`
);
const elementIconPath = computed(
    () => `/elements/${props.elementIndex}/element_type_icon`
);

function update(fields) {
    store.updateElement(props.elementIndex, fields);
}
</script>

<template>
    <div class="mb-2">
        <label :for="`el-type-${elementIndex}`" class="form-label fw-semibold"
            >Element Type
            <span aria-hidden="true" class="text-danger">*</span></label
        >
        <input
            :id="`el-type-${elementIndex}`"
            type="text"
            class="form-control form-control-sm"
            :value="el().element_type"
            placeholder="e.g. Sidewalk"
            required
            aria-required="true"
            :class="{ 'is-invalid': store.hasValidationError(elementTypePath) }"
            @input="update({ element_type: $event.target.value })"
        />
    </div>

    <div class="mb-2">
        <label :for="`el-query-${elementIndex}`" class="form-label fw-semibold"
            >Quest Query
            <span aria-hidden="true" class="text-danger">*</span></label
        >
        <input
            :id="`el-query-${elementIndex}`"
            type="text"
            class="form-control form-control-sm"
            :value="el().quest_query"
            placeholder="e.g. ways with (highway=footway and footway=sidewalk)"
            :aria-describedby="`el-query-help-${elementIndex}`"
            required
            aria-required="true"
            :class="{ 'is-invalid': store.hasValidationError(questQueryPath) }"
            @input="update({ quest_query: $event.target.value })"
        />
    </div>

    <div class="mb-2">
        <p class="form-label fw-semibold mb-1">
            Element Icon <span aria-hidden="true" class="text-danger">*</span>
        </p>
        <div
            :class="{
                'border border-danger rounded p-2':
                    store.hasValidationError(elementIconPath),
            }"
        >
            <IconPicker
                :model-value="el().element_type_icon"
                @update:model-value="update({ element_type_icon: $event })"
            />
        </div>
    </div>

    <QuestList :element-index="elementIndex" />
</template>
