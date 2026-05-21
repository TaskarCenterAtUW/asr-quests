<!-- @format -->

<script setup>
defineProps({
    url: { type: String, default: "" },
    alt: { type: String, default: "Preview image" },
    maxWidth: { type: Number, default: 220 },
    maxHeight: { type: Number, default: 140 },
});
</script>

<template>
    <div v-if="url" class="mt-2">
        <img
            :src="url"
            :alt="alt"
            class="img-thumbnail"
            :style="{
                maxWidth: `${maxWidth}px`,
                maxHeight: `${maxHeight}px`,
                objectFit: 'cover',
            }"
        />
    </div>
</template>
