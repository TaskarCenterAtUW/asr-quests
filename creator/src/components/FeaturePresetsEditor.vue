<!-- @format -->

<script setup>
import { computed, nextTick, ref } from "vue";
import { useQuestStore } from "../stores/questStore";
import { useDragReorder } from "../composables/useDragReorder";
import IconPicker from "./IconPicker.vue";

const store = useQuestStore();
const presets = computed(() => store.definition["feature-presets"]);
const hasSection = computed(() => Array.isArray(presets.value));
const isExpanded = ref(true);
const reorderAnnouncement = ref("");

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
        store.moveFeaturePresetTo(fromIndex, toIndex);
        reorderAnnouncement.value = `Feature preset moved to position ${toIndex + 1} of ${presets.value?.length ?? 0}.`;
        nextTick(() =>
            document.getElementById(`feature-preset-name-${toIndex}`)?.focus()
        );
    })()
);

function addFeaturePreset() {
    isExpanded.value = true;
    store.addFeaturePreset();
}

function duplicateFeaturePreset(index) {
    store.duplicateFeaturePreset(index);
    nextTick(() =>
        document.getElementById(`feature-preset-name-${index + 1}`)?.focus()
    );
}

function fieldErrors(path) {
    return store.validationErrors.filter(
        (error) =>
            error.instancePath === path ||
            error.instancePath.startsWith(`${path}/`)
    );
}

function tagEntries(preset) {
    return Object.entries(preset.tags || {});
}

function addTag(index) {
    const preset = presets.value?.[index];
    if (!preset) return;

    const tags = { ...preset.tags };
    let key = "";
    let suffix = 1;
    while (Object.prototype.hasOwnProperty.call(tags, key)) {
        key = `tag${suffix}`;
        suffix += 1;
    }
    tags[key] = "";
    store.updateFeaturePreset(index, { tags });
}

function updateTag(index, previousKey, nextKey, value) {
    const preset = presets.value?.[index];
    if (!preset) return;

    const tags = Object.fromEntries(
        Object.entries(preset.tags || {}).map(([key, currentValue]) =>
            key === previousKey ? [nextKey, value] : [key, currentValue]
        )
    );
    store.updateFeaturePreset(index, { tags });
}

function removeTag(index, key) {
    store.removeFeaturePresetTag(index, key);
}
</script>

<template>
    <section
        class="card creator-surface-card creator-panel-card"
        :class="{ 'creator-panel-card-collapsed': !isExpanded }"
    >
        <div
            class="card-header d-flex align-items-center justify-content-between gap-2 flex-wrap"
        >
            <h2 class="h6 mb-0">Feature Presets</h2>
            <div class="d-flex align-items-center gap-2 ms-auto">
                <button
                    v-if="!hasSection"
                    type="button"
                    class="btn btn-sm btn-outline-primary"
                    @click="addFeaturePreset"
                >
                    Add Feature Preset
                </button>
                <button
                    v-else
                    type="button"
                    class="btn btn-sm btn-outline-primary"
                    @click="addFeaturePreset"
                >
                    Add Preset
                </button>
                <button
                    type="button"
                    class="accordion-button creator-section-toggle"
                    :class="{ collapsed: !isExpanded }"
                    :aria-expanded="isExpanded"
                    aria-controls="feature-presets-panel"
                    :aria-label="`${isExpanded ? 'Collapse' : 'Expand'} Feature Presets`"
                    @click="isExpanded = !isExpanded"
                ></button>
            </div>
        </div>

        <div
            id="feature-presets-panel"
            v-if="isExpanded"
            class="card-body d-grid gap-3"
        >
            <div class="visually-hidden" aria-live="polite">
                {{ reorderAnnouncement }}
            </div>
            <p v-if="!hasSection" class="small text-muted mb-0">
                No feature-preset section will be exported until you add a
                preset.
            </p>
            <p
                v-else-if="presets.length === 0"
                class="small text-muted mb-0"
            >
                The feature-preset section is enabled but has no presets.
            </p>

            <article
                v-for="(preset, index) in presets || []"
                :key="preset"
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
                        Preset {{ index + 1 }}
                    </h3>
                    <div class="d-flex gap-2 flex-wrap">
                        <button
                            type="button"
                            class="btn btn-sm btn-outline-secondary"
                            :disabled="index === 0"
                            :aria-label="`Move preset ${index + 1} up`"
                            @click="store.moveFeaturePresetUp(index)"
                        >
                            Move Up
                        </button>
                        <button
                            type="button"
                            class="btn btn-sm btn-outline-secondary"
                            :disabled="index === presets.length - 1"
                            :aria-label="`Move preset ${index + 1} down`"
                            @click="store.moveFeaturePresetDown(index)"
                        >
                            Move Down
                        </button>
                        <button
                            type="button"
                            class="btn btn-sm btn-outline-secondary creator-icon-action"
                            :aria-label="`Duplicate feature preset ${index + 1}`"
                            title="Duplicate feature preset"
                            @click="duplicateFeaturePreset(index)"
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
                            :aria-label="`Remove preset ${index + 1}`"
                            @click="store.removeFeaturePreset(index)"
                        >
                            Remove
                        </button>
                    </div>
                </div>

                <div class="row g-3">
                    <div class="col-12 col-lg-5">
                        <label
                            :for="`feature-preset-name-${index}`"
                            class="form-label small fw-semibold"
                            >Name</label
                        >
                        <input
                            :id="`feature-preset-name-${index}`"
                            type="text"
                            class="form-control form-control-sm"
                            :value="preset.name"
                            :class="{
                                'is-invalid': fieldErrors(
                                    `/feature-presets/${index}/name`
                                ).length,
                            }"
                            @input="
                                store.updateFeaturePreset(index, {
                                    name: $event.target.value,
                                })
                            "
                        />
                        <div
                            v-for="error in fieldErrors(
                                `/feature-presets/${index}/name`
                            )"
                            :key="error.message"
                            class="invalid-feedback"
                        >
                            {{ error.message }}
                        </div>
                    </div>

                    <div class="col-12 col-lg-7">
                        <span class="form-label small fw-semibold d-block"
                            >Icon</span
                        >
                        <IconPicker
                            :model-value="preset.icon"
                            context="feature-preset"
                            @update:model-value="
                                store.updateFeaturePreset(index, {
                                    icon: $event,
                                })
                            "
                        />
                        <div
                            v-for="error in fieldErrors(
                                `/feature-presets/${index}/icon`
                            )"
                            :key="error.message"
                            class="text-danger small mt-1"
                        >
                            {{ error.message }}
                        </div>
                    </div>
                </div>

                <div class="mt-3">
                    <div
                        class="d-flex justify-content-between align-items-center gap-2 flex-wrap pb-1"
                    >
                        <span class="form-label small fw-semibold mb-1"
                            >Tags</span
                        >
                        <button
                            type="button"
                            class="btn btn-sm btn-outline-secondary"
                            @click="addTag(index)"
                        >
                            Add Tag
                        </button>
                    </div>
                    <div class="d-grid gap-2">
                        <div
                            v-for="([key, value], tagIndex) in tagEntries(preset)"
                            :key="`${index}-${tagIndex}`"
                            class="row g-2 align-items-end"
                        >
                            <div class="col-12 col-sm-5">
                                <label
                                    :for="`preset-${index}-tag-key-${tagIndex}`"
                                    class="visually-hidden"
                                    >Tag key {{ tagIndex + 1 }}</label
                                >
                                <input
                                    :id="`preset-${index}-tag-key-${tagIndex}`"
                                    type="text"
                                    class="form-control form-control-sm"
                                    placeholder="Tag key"
                                    :value="key"
                                    @input="
                                        updateTag(
                                            index,
                                            key,
                                            $event.target.value,
                                            value
                                        )
                                    "
                                />
                            </div>
                            <div class="col-12 col-sm-5">
                                <label
                                    :for="`preset-${index}-tag-value-${tagIndex}`"
                                    class="visually-hidden"
                                    >Tag value {{ tagIndex + 1 }}</label
                                >
                                <input
                                    :id="`preset-${index}-tag-value-${tagIndex}`"
                                    type="text"
                                    class="form-control form-control-sm"
                                    placeholder="Tag value"
                                    :value="value"
                                    @input="
                                        updateTag(
                                            index,
                                            key,
                                            key,
                                            $event.target.value
                                        )
                                    "
                                />
                            </div>
                            <div class="col-12 col-sm-2 d-flex align-self-stretch">
                                <button
                                    type="button"
                                    class="btn btn-sm btn-outline-danger w-100"
                                    :aria-label="`Remove tag ${tagIndex + 1}`"
                                    @click="removeTag(index, key)"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    </div>
                    <div
                        v-for="error in fieldErrors(
                            `/feature-presets/${index}/tags`
                        )"
                        :key="error.message"
                        class="text-danger small mt-1"
                    >
                        {{ error.message }}
                    </div>
                </div>
            </article>
        </div>
    </section>
</template>
