<!-- @format -->

<script setup>
import { computed, nextTick, onBeforeUnmount, reactive, ref } from "vue";
import { useQuestStore } from "../stores/questStore";
import { useDragReorder } from "../composables/useDragReorder";

const store = useQuestStore();
const icons = computed(() => store.definition["custom-icons"]);
const hasSection = computed(() => Array.isArray(icons.value));
const reorderAnnouncement = ref("");
const imageErrors = reactive(new Map());
const previewUrls = reactive(new Map());
const previewTimers = new Map();
const isExpanded = ref(true);

const {
    draggingIndex,
    overIndex,
    overBefore,
    startDrag,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    endDrag,
} = useDragReorder((fromIndex, toIndex) =>
    (() => {
        store.moveCustomIconTo(fromIndex, toIndex);
        reorderAnnouncement.value = `Custom icon moved to position ${toIndex + 1} of ${icons.value?.length ?? 0}.`;
        nextTick(() =>
            document.getElementById(`custom-icon-name-${toIndex}`)?.focus()
        );
    })()
);

function iconHint(type) {
    return type === "feature-preset"
        ? "SVG, < 0.5 MB, square, ~28 px × ~28 px"
        : "SVG, < 0.5 MB, square, ~96 px × ~96 px";
}

function addCustomIcon() {
    isExpanded.value = true;
    store.addCustomIcon();
}

function duplicateCustomIcon(index) {
    store.duplicateCustomIcon(index);
    nextTick(() =>
        document.getElementById(`custom-icon-name-${index + 1}`)?.focus()
    );
}

function fieldErrors(path) {
    return store.validationErrors.filter(
        (error) =>
            error.instancePath === path ||
            error.instancePath.startsWith(`${path}/`)
    );
}

function isHttpUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}

function usedBy(name) {
    const usages = [];
    if (!name) {
        return usages;
    }

    store.definition.elements.forEach((element, elementIndex) => {
        if (element.element_type_icon === name) {
            usages.push(`quest elements (${elementIndex + 1})`);
        }
    });
    (store.definition["feature-presets"] || []).forEach((preset, presetIndex) => {
        if (preset.icon === name) {
            usages.push(`feature presets (${presetIndex + 1})`);
        }
    });
    return usages;
}

function markImageError(icon) {
    imageErrors.set(icon, true);
}

function getPreviewUrl(icon, fallbackUrl) {
    return previewUrls.has(icon)
        ? previewUrls.get(icon)
        : fallbackUrl;
}

function updateUrl(index, value) {
    const icon = icons.value?.[index];
    if (!icon) {
        return;
    }

    const currentUrl = icon.url || "";
    if (!previewUrls.has(icon)) {
        previewUrls.set(icon, currentUrl);
    }

    store.updateCustomIcon(index, { url: value });
    imageErrors.set(icon, false);

    clearTimeout(previewTimers.get(icon));
    previewTimers.set(
        icon,
        setTimeout(() => {
            previewUrls.set(icon, String(value ?? "").trim());
            imageErrors.set(icon, false);
            previewTimers.delete(icon);
        }, 180)
    );
}

onBeforeUnmount(() => {
    previewTimers.forEach((timer) => clearTimeout(timer));
});
</script>

<template>
    <section
        class="card creator-surface-card creator-panel-card"
        :class="{ 'creator-panel-card-collapsed': !isExpanded }"
    >
        <div
            class="card-header d-flex align-items-center justify-content-between gap-2 flex-wrap"
        >
            <h2 class="h6 mb-0">Custom Icons</h2>
            <div class="d-flex align-items-center gap-2 ms-auto">
                <button
                    type="button"
                    class="btn btn-sm btn-outline-primary"
                    @click="addCustomIcon"
                >
                    {{ hasSection ? "Add Custom Icon" : "Enable Custom Icons" }}
                </button>
                <button
                    type="button"
                    class="accordion-button creator-section-toggle"
                    :class="{ collapsed: !isExpanded }"
                    :aria-expanded="isExpanded"
                    aria-controls="custom-icons-panel"
                    :aria-label="`${isExpanded ? 'Collapse' : 'Expand'} Custom Icons`"
                    @click="isExpanded = !isExpanded"
                ></button>
            </div>
        </div>

        <div
            id="custom-icons-panel"
            v-if="isExpanded"
            class="card-body d-grid gap-3"
        >
            <div class="visually-hidden" aria-live="polite">
                {{ reorderAnnouncement }}
            </div>
            <p v-if="!hasSection" class="small text-muted mb-0">
                Add a custom icon to include the optional custom-icons section
                in the exported definition.
            </p>
            <p v-else-if="icons.length === 0" class="small text-muted mb-0">
                No custom icons defined.
            </p>

            <article
                v-for="(icon, index) in icons || []"
                :key="icon"
                class="creator-editor-row"
                :class="{
                    'creator-dragging': draggingIndex === index,
                    'creator-drag-over': overIndex === index,
                    'creator-drag-over-before':
                        overIndex === index && overBefore,
                    'creator-drag-over-after':
                        overIndex === index && !overBefore,
                }"
                @dragover="handleDragOver(index, $event)"
                @dragleave="handleDragLeave($event)"
                @drop="handleDrop(index, $event)"
            >
                <div
                    class="d-flex justify-content-between align-items-start gap-2 flex-wrap mb-3"
                >
                    <h3 class="h6 mb-0 d-inline-flex align-items-center gap-2">
                        <span
                            class="creator-drag-handle"
                            aria-hidden="true"
                            title="Drag to reorder"
                            draggable="true"
                            @dragstart.stop="startDrag(index, $event)"
                            @dragend.stop="endDrag"
                        >
                            <svg
                                viewBox="0 0 16 16"
                                width="14"
                                height="14"
                                fill="currentColor"
                            >
                                <circle cx="5" cy="3" r="1.5" />
                                <circle cx="11" cy="3" r="1.5" />
                                <circle cx="5" cy="8" r="1.5" />
                                <circle cx="11" cy="8" r="1.5" />
                                <circle cx="5" cy="13" r="1.5" />
                                <circle cx="11" cy="13" r="1.5" />
                            </svg>
                        </span>
                        Custom Icon {{ index + 1 }}
                    </h3>
                    <div class="d-flex gap-2 flex-wrap">
                        <button
                            type="button"
                            class="btn btn-sm btn-outline-secondary"
                            :disabled="index === 0"
                            :aria-label="`Move custom icon ${index + 1} up`"
                            @click="store.moveCustomIconUp(index)"
                        >
                            Move Up
                        </button>
                        <button
                            type="button"
                            class="btn btn-sm btn-outline-secondary"
                            :disabled="index === icons.length - 1"
                            :aria-label="`Move custom icon ${index + 1} down`"
                            @click="store.moveCustomIconDown(index)"
                        >
                            Move Down
                        </button>
                        <button
                            type="button"
                            class="btn btn-sm btn-outline-secondary creator-icon-action"
                            :aria-label="`Duplicate custom icon ${index + 1}`"
                            title="Duplicate custom icon"
                            @click="duplicateCustomIcon(index)"
                        >
                            <svg
                                aria-hidden="true"
                                viewBox="0 0 16 16"
                                width="14"
                                height="14"
                                fill="currentColor"
                            >
                                <path
                                    d="M4 1.5A1.5 1.5 0 0 0 2.5 3v8A1.5 1.5 0 0 0 4 12.5h1v-1H4a.5.5 0 0 1-.5-.5V3a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 .5.5v1h1V3A1.5 1.5 0 0 0 10 1.5H4z"
                                />
                                <path
                                    d="M7 4.5A1.5 1.5 0 0 0 5.5 6v7A1.5 1.5 0 0 0 7 14.5h5A1.5 1.5 0 0 0 13.5 13V6A1.5 1.5 0 0 0 12 4.5H7zM6.5 6a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-.5.5H7a.5.5 0 0 1-.5-.5V6z"
                                />
                            </svg>
                        </button>
                        <button
                            type="button"
                            class="btn btn-sm btn-outline-danger"
                            :aria-label="`Remove custom icon ${index + 1}`"
                            @click="store.removeCustomIcon(index)"
                        >
                            Remove
                        </button>
                    </div>
                </div>

                <div class="row g-3 align-items-start">
                    <div class="col-12 col-lg-4">
                        <label
                            :for="`custom-icon-name-${index}`"
                            class="form-label small fw-semibold"
                            >Name</label
                        >
                        <input
                            :id="`custom-icon-name-${index}`"
                            type="text"
                            class="form-control form-control-sm"
                            :value="icon.name"
                            :class="{
                                'is-invalid': fieldErrors(
                                    `/custom-icons/${index}/name`
                                ).length,
                            }"
                            @input="
                                store.updateCustomIcon(index, {
                                    name: $event.target.value,
                                })
                            "
                        />
                        <div
                            v-for="error in fieldErrors(
                                `/custom-icons/${index}/name`
                            )"
                            :key="error.message"
                            class="invalid-feedback"
                        >
                            {{ error.message }}
                        </div>
                    </div>

                    <div class="col-12 col-lg-5">
                        <label
                            :for="`custom-icon-url-${index}`"
                            class="form-label small fw-semibold"
                            >URL</label
                        >
                        <input
                            :id="`custom-icon-url-${index}`"
                            type="url"
                            inputmode="url"
                            class="form-control form-control-sm"
                            placeholder="https://example.com/icon.svg"
                            :value="icon.url"
                            :aria-describedby="`custom-icon-hint-${index}`"
                            :class="{
                                'is-invalid': fieldErrors(
                                    `/custom-icons/${index}/url`
                                ).length,
                            }"
                            @input="updateUrl(index, $event.target.value)"
                        />
                        <div
                            :id="`custom-icon-hint-${index}`"
                            class="form-text small"
                        >
                            {{ iconHint(icon.type) }}
                        </div>
                        <div
                            v-for="error in fieldErrors(
                                `/custom-icons/${index}/url`
                            )"
                            :key="error.message"
                            class="invalid-feedback"
                        >
                            {{ error.message }}
                        </div>
                    </div>

                    <div class="col-12 col-lg-3">
                        <label
                            :for="`custom-icon-type-${index}`"
                            class="form-label small fw-semibold"
                            >Context</label
                        >
                        <select
                            :id="`custom-icon-type-${index}`"
                            class="form-select form-select-sm"
                            :value="icon.type"
                            :class="{
                                'is-invalid': fieldErrors(
                                    `/custom-icons/${index}/type`
                                ).length,
                            }"
                            @change="
                                store.updateCustomIcon(index, {
                                    type: $event.target.value,
                                })
                            "
                        >
                            <option value="quest">Quest</option>
                            <option value="feature-preset">
                                Feature preset
                            </option>
                        </select>
                        <div
                            v-for="error in fieldErrors(
                                `/custom-icons/${index}/type`
                            )"
                            :key="error.message"
                            class="invalid-feedback"
                        >
                            {{ error.message }}
                        </div>
                    </div>
                </div>

                <div
                    class="d-flex align-items-start gap-3 flex-wrap mt-3 creator-icon-preview-row"
                >
                    <div
                        class="creator-icon-preview-shell"
                        role="img"
                        :aria-label="
                            isHttpUrl(getPreviewUrl(icon, icon.url)) &&
                            !imageErrors.get(icon)
                                ? 'Custom icon preview'
                                : 'Custom icon preview unavailable'
                        "
                    >
                        <img
                            v-if="isHttpUrl(getPreviewUrl(icon, icon.url))"
                            :src="getPreviewUrl(icon, icon.url)"
                            alt=""
                            width="44"
                            height="44"
                            class="creator-icon-preview-art"
                            :class="{
                                'creator-icon-preview-art--hidden':
                                    imageErrors.get(icon),
                            }"
                                @error="markImageError(icon)"
                        />
                        <span
                            v-if="
                                !isHttpUrl(getPreviewUrl(icon, icon.url)) ||
                                imageErrors.get(icon)
                            "
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
                                <rect
                                    x="3"
                                    y="4"
                                    width="18"
                                    height="16"
                                    rx="2"
                                />
                                <circle cx="8" cy="9" r="1.5" />
                                <path d="m5 17 4-4 3 3 2-2 5 5" />
                                <path d="m4 4 16 16" />
                            </svg>
                        </span
                        >
                    </div>
                    <div class="small text-muted creator-icon-preview-usage">
                        <span v-if="usedBy(icon.name).length > 0">
                            Used by: {{ usedBy(icon.name).join(", ") }}.
                        </span>
                        <span v-else>Not currently referenced.</span>
                        <span
                            class="d-block creator-icon-preview-status"
                            :class="{
                                invisible: !(
                                    isHttpUrl(getPreviewUrl(icon, icon.url)) &&
                                    imageErrors.get(icon)
                                ),
                            }"
                            >The URL is valid, but the image could not be
                            loaded.</span
                        >
                    </div>
                </div>
            </article>
        </div>
    </section>
</template>

<style scoped>
.creator-icon-preview-shell {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.75rem;
    height: 2.75rem;
    flex: 0 0 2.75rem;
    box-sizing: border-box;
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

.creator-icon-preview-row {
    min-height: 2.75rem;
}

.creator-icon-preview-usage {
    flex: 1 1 0;
    min-width: 0;
}

.creator-icon-preview-status {
    min-height: 1.5em;
}
</style>
