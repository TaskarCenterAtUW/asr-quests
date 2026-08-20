<!-- @format -->

<script setup>
import { ref, watch } from "vue";

const props = defineProps({
    url: { type: String, default: "" },
    alt: { type: String, default: "Preview image" },
    maxWidth: { type: Number, default: 220 },
    maxHeight: { type: Number, default: 140 },
});

const imageFailed = ref(false);

function isHttpUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}

watch(
    () => props.url,
    () => {
        imageFailed.value = false;
    }
);
</script>

<template>
    <div v-if="url" class="mt-2">
        <img
            v-if="isHttpUrl(url) && !imageFailed"
            :src="url"
            alt=""
            class="img-thumbnail"
            :style="{
                maxWidth: `${maxWidth}px`,
                maxHeight: `${maxHeight}px`,
                objectFit: 'cover',
            }"
            @error="imageFailed = true"
        />
        <span
            v-else
            class="image-preview-fallback"
            role="img"
            :aria-label="`${alt} unavailable`"
        >
            <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                focusable="false"
                aria-hidden="true"
            >
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <circle cx="8" cy="9" r="1.5" />
                <path d="m5 17 4-4 3 3 2-2 5 5" />
                <path d="m4 4 16 16" />
            </svg>
        </span>
    </div>
</template>

<style scoped>
.image-preview-fallback {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    border: 1px solid rgba(var(--bs-danger-rgb), 0.45);
    border-radius: var(--creator-radius-md);
    background: rgba(var(--bs-danger-rgb), 0.08);
    color: var(--bs-danger);
}

.image-preview-fallback svg {
    fill: none;
    stroke: currentColor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 1.5;
}
</style>
