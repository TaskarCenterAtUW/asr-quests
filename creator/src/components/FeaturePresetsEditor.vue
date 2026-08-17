<!-- @format -->

<script setup>
import { computed, ref } from "vue";
import { useQuestStore } from "../stores/questStore";
import IconPicker from "./IconPicker.vue";

const store = useQuestStore();
const presets = computed(() => store.definition["feature-presets"]);
const hasSection = computed(() => Array.isArray(presets.value));
const isExpanded = ref(true);

function addFeaturePreset() {
    isExpanded.value = true;
    store.addFeaturePreset();
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

    const tags = { ...preset.tags };
    delete tags[previousKey];
    tags[nextKey] = value;
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
                :key="`feature-preset-${index}`"
                class="creator-editor-row"
            >
                <div
                    class="d-flex justify-content-between align-items-start gap-2 flex-wrap mb-3"
                >
                    <h3 class="h6 mb-0">Preset {{ index + 1 }}</h3>
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
                            :key="`${index}-${tagIndex}-${key}`"
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
