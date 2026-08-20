<!-- @format -->

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { useQuestStore } from "../stores/questStore";
import icons from "../assets/icons.json";
import featureIcons from "../assets/featureIcons.json";

const props = defineProps({
    modelValue: { type: String, default: "" },
    context: { type: String, default: "quest" },
});
const emit = defineEmits(["update:modelValue"]);
const store = useQuestStore();

const filter = ref("");
const open = ref(false);
const triggerButton = ref(null);
const searchInput = ref(null);
const searchId = `icon-search-${Math.random().toString(36).slice(2)}`;
const previewUrl = ref("");
const previewFailed = ref(false);
let previewTimer;

const builtInIcons = computed(() =>
    props.context === "feature-preset" ? featureIcons : icons
);
const customIcons = computed(() =>
    (store.definition["custom-icons"] || [])
        .filter((icon) => icon.type === props.context)
        .map((icon) => ({
            ...icon,
            label: `${icon.name} (custom)`,
            custom: true,
        }))
);
const availableIcons = computed(() => [
    ...builtInIcons.value,
    ...customIcons.value,
]);

const filtered = computed(() => {
    const q = filter.value.trim().toLowerCase();
    return q
        ? availableIcons.value.filter(
              (i) =>
                  i.label.toLowerCase().includes(q) ||
                  i.name.toLowerCase().includes(q)
          )
        : availableIcons.value;
});

const selected = computed(() => {
    if (!props.modelValue) return null;
    return availableIcons.value.find((i) => i.name === props.modelValue) || null;
});

function applyPreviewUrl(url) {
    previewUrl.value = url;
    previewFailed.value = false;
}

watch(
    () => selected.value?.url ?? "",
    (url) => {
        clearTimeout(previewTimer);
        const nextUrl = url || "";
        if (!previewUrl.value || !nextUrl) {
            applyPreviewUrl(nextUrl);
            return;
        }
        if (nextUrl === previewUrl.value) {
            return;
        }
        previewTimer = setTimeout(() => applyPreviewUrl(nextUrl), 180);
    },
    { immediate: true }
);

function markPreviewError() {
    previewFailed.value = true;
}

function isHttpUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}

const previewUnavailable = computed(
    () => !isHttpUrl(previewUrl.value) || previewFailed.value
);

onBeforeUnmount(() => clearTimeout(previewTimer));

function pick(icon) {
    emit("update:modelValue", icon.name);
    closePicker();
}

function clear() {
    emit("update:modelValue", "");
}

function closePicker() {
    open.value = false;
    filter.value = "";
}

function openPicker() {
    open.value = true;
    filter.value = "";
}

watch(open, (isOpen) => {
    nextTick(() => {
        if (isOpen) {
            searchInput.value?.focus();
            return;
        }

        triggerButton.value?.focus();
    });
});
</script>

<template>
    <div class="d-flex flex-column gap-2">
        <!-- Selected preview + trigger -->
        <div
            class="d-flex align-items-center gap-2 flex-wrap creator-icon-selection"
            :class="$attrs.class"
        >
            <span
                v-if="selected"
                class="creator-icon-preview-shell"
                aria-hidden="true"
            >
                <img
                    v-if="isHttpUrl(previewUrl)"
                    :src="previewUrl"
                    alt=""
                    width="40"
                    height="40"
                    class="creator-icon-preview-art"
                    :class="{
                        'creator-icon-preview-art--hidden': previewFailed,
                    }"
                    @error="markPreviewError"
                />
                <span
                    v-if="previewUnavailable"
                    class="small text-muted text-center px-1 creator-icon-preview-fallback"
                    aria-hidden="true"
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
            </span>
            <span v-if="selected" class="small text-muted">{{
                selected.label
            }}</span>
            <span v-else class="small text-muted fst-italic"
                >No icon selected</span
            >

            <button
                ref="triggerButton"
                type="button"
                class="btn btn-sm btn-outline-secondary"
                @click="openPicker"
            >
                {{ selected ? "Change Icon" : "Pick Icon" }}
            </button>
            <button
                v-if="selected"
                type="button"
                class="btn btn-sm btn-outline-danger"
                @click="clear"
                aria-label="Clear icon"
            >
                &times;
            </button>
        </div>

        <!-- Picker panel -->
        <div
            v-if="open"
            class="creator-icon-picker-dialog p-2"
            role="dialog"
            aria-modal="true"
            :aria-label="`${props.context} icon picker`"
            @keydown.esc.prevent="closePicker"
        >
            <div class="mb-2">
                <label :for="searchId" class="visually-hidden"
                    >Filter icons</label
                >
                <input
                    ref="searchInput"
                    :id="searchId"
                    v-model="filter"
                    type="search"
                    class="form-control form-control-sm"
                    placeholder="Filter icons…"
                    autocomplete="off"
                />
            </div>

            <!-- Scrollable grid -->
            <div class="overflow-auto creator-icon-grid-scroll">
                <div
                    class="creator-icon-grid"
                    role="list"
                    :aria-label="`Icon list, ${filtered.length} icons`"
                >
                    <button
                        v-for="icon in filtered"
                        :key="icon.name"
                        type="button"
                        :aria-label="`Use ${icon.label}`"
                        :aria-pressed="icon.name === modelValue"
                        :title="icon.label"
                        class="btn btn-sm creator-icon-option"
                        :class="{
                            'creator-icon-option--selected':
                                icon.name === modelValue,
                        }"
                        @click="pick(icon)"
                    >
                        <img
                            :src="icon.url"
                            alt=""
                            width="32"
                            height="32"
                            class="creator-icon-option-art"
                        />
                        <span v-if="icon.custom" class="visually-hidden"
                            >Custom icon</span
                        >
                    </button>
                </div>

                <p
                    v-if="filtered.length === 0"
                    class="text-muted small text-center py-2 mb-0"
                >
                    No icons match "{{ filter }}"
                </p>
            </div>

            <div class="mt-2 text-end">
                <button
                    type="button"
                    class="btn btn-sm btn-secondary"
                    @click="closePicker"
                >
                    Close
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.creator-icon-selection {
    min-height: 2.75rem;
}

.creator-icon-picker-dialog {
    border: 1px solid var(--creator-surface-border);
    border-radius: var(--creator-radius-md);
    background: color-mix(in srgb, var(--creator-surface) 94%, transparent);
    box-shadow: var(--creator-shadow-soft);
}

.creator-icon-preview-shell {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.75rem;
    height: 2.75rem;
    flex-shrink: 0;
    border-radius: 50%;
    border: 1.5px solid rgba(var(--creator-primary-rgb), 0.35);
    background: rgba(var(--creator-primary-rgb), 0.08);
    overflow: hidden;
    position: relative;
}

.creator-icon-preview-art--hidden {
    visibility: hidden;
}

.creator-icon-preview-fallback {
    position: absolute;
    inset: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.creator-icon-preview-fallback svg {
    fill: none;
    stroke: var(--bs-danger);
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 1.5;
}

.creator-icon-grid-shell {
    width: 2.2rem;
    height: 2.2rem;
    border-radius: 0.85rem;
}

.creator-icon-preview-art {
    width: 50%;
    height: 50%;
    object-fit: cover;
}

.creator-icon-option-art {
    width: 75%;
    height: 75%;
    object-fit: contain;
}

.creator-icon-grid-scroll {
    max-height: 260px;
}

.creator-icon-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(3rem, 1fr));
    gap: 0.5rem;
}

.creator-icon-option {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    width: 2.75rem;
    height: 2.75rem;
    border-radius: 50%;
    flex-shrink: 0;
    overflow: hidden;
    border: 1.5px solid rgba(var(--creator-primary-rgb), 0.35);
    background: transparent;
    box-shadow: none;
}

.creator-icon-option:hover {
    opacity: 0.8;
}

.creator-icon-option--selected {
    outline: 2.5px solid var(--creator-primary, #7c3aed);
    outline-offset: 2px;
}
</style>
