<!-- @format -->

<script setup>
import { useQuestStore } from "../stores/questStore";
import IconPicker from "./IconPicker.vue";

const props = defineProps({
    elementIndex: { type: Number, required: true },
});

const store = useQuestStore();

const el = () => store.definition.elements[props.elementIndex];

function update(fields) {
    store.updateElement(props.elementIndex, fields);
}
</script>

<template>
    <div class="mb-3">
        <label :for="`el-type-${elementIndex}`" class="form-label fw-semibold"
            >Element Type
            <span aria-hidden="true" class="text-danger">*</span></label
        >
        <input
            :id="`el-type-${elementIndex}`"
            type="text"
            class="form-control"
            :value="el().element_type"
            placeholder="e.g. Sidewalks"
            required
            aria-required="true"
            @input="update({ element_type: $event.target.value })"
        />
    </div>

    <div class="mb-3">
        <label :for="`el-query-${elementIndex}`" class="form-label fw-semibold"
            >Quest Query
            <span aria-hidden="true" class="text-danger">*</span></label
        >
        <input
            :id="`el-query-${elementIndex}`"
            type="text"
            class="form-control"
            :value="el().quest_query"
            placeholder="e.g. ways with (highway=footway and footway=sidewalk)"
            required
            aria-required="true"
            @input="update({ quest_query: $event.target.value })"
        />
    </div>

    <div class="mb-3">
        <p class="form-label fw-semibold mb-1">
            Element Icon <span aria-hidden="true" class="text-danger">*</span>
        </p>
        <IconPicker
            :model-value="el().element_type_icon"
            @update:model-value="update({ element_type_icon: $event })"
        />
    </div>
</template>
