<!-- @format -->

<script setup>
import { computed, nextTick, ref, watch } from "vue";
import icons from "../assets/icons.json";

const props = defineProps({
    modelValue: { type: String, default: "" },
});
const emit = defineEmits(["update:modelValue"]);

const filter = ref("");
const open = ref(false);
const triggerButton = ref(null);
const searchInput = ref(null);
const searchId = `icon-search-${Math.random().toString(36).slice(2)}`;

const filtered = computed(() => {
    const q = filter.value.trim().toLowerCase();
    return q ? icons.filter((i) => i.name.toLowerCase().includes(q)) : icons;
});

const selected = computed(() => {
    if (!props.modelValue) return null;
    const normalized = props.modelValue.replace(/_/g, " ").toLowerCase();
    return icons.find((i) => i.name.toLowerCase() === normalized) || null;
});

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
                    :src="selected.url"
                    alt=""
                    width="40"
                    height="40"
                    class="creator-icon-preview-art"
                />
            </span>
            <span v-if="selected" class="small text-muted">{{
                selected.name
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
            aria-label="Icon picker"
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
                        :aria-label="`Use ${icon.name}`"
                        :aria-pressed="icon.name === modelValue"
                        :title="icon.name"
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
}

.creator-icon-grid-shell {
    width: 2.2rem;
    height: 2.2rem;
    border-radius: 0.85rem;
}

.creator-icon-preview-art {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.creator-icon-option-art {
    width: 100%;
    height: 100%;
    object-fit: cover;
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
