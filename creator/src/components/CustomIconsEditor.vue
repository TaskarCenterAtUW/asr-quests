<!-- @format -->

<script setup>
import { computed, ref } from "vue";
import { useQuestStore } from "../stores/questStore";

const store = useQuestStore();
const icons = computed(() => store.definition["custom-icons"]);
const hasSection = computed(() => Array.isArray(icons.value));
const imageErrors = ref({});
const isExpanded = ref(true);

function addCustomIcon() {
    isExpanded.value = true;
    store.addCustomIcon();
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

function markImageError(index) {
    imageErrors.value[index] = true;
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
            <p v-if="!hasSection" class="small text-muted mb-0">
                Add a custom icon to include the optional custom-icons section
                in the exported definition.
            </p>
            <p v-else-if="icons.length === 0" class="small text-muted mb-0">
                No custom icons defined.
            </p>

            <article
                v-for="(icon, index) in icons || []"
                :key="`custom-icon-${index}`"
                class="creator-editor-row"
            >
                <div
                    class="d-flex justify-content-between align-items-start gap-2 flex-wrap mb-3"
                >
                    <h3 class="h6 mb-0">Custom Icon {{ index + 1 }}</h3>
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
                            :class="{
                                'is-invalid': fieldErrors(
                                    `/custom-icons/${index}/url`
                                ).length,
                            }"
                            @input="
                                store.updateCustomIcon(index, {
                                    url: $event.target.value,
                                }); imageErrors[index] = false
                            "
                        />
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

                <div class="d-flex align-items-center gap-3 flex-wrap mt-3">
                    <div
                        class="creator-icon-preview-shell"
                        aria-label="Custom icon preview"
                    >
                        <img
                            v-if="isHttpUrl(icon.url) && !imageErrors[index]"
                            :src="icon.url"
                            alt=""
                            width="44"
                            height="44"
                            class="creator-icon-preview-art"
                            @error="markImageError(index)"
                        />
                        <span v-else class="small text-muted text-center px-1"
                            >No preview</span
                        >
                    </div>
                    <div class="small text-muted">
                        <span v-if="usedBy(icon.name).length > 0">
                            Used by: {{ usedBy(icon.name).join(", ") }}.
                        </span>
                        <span v-else>Not currently referenced.</span>
                        <span
                            v-if="isHttpUrl(icon.url) && imageErrors[index]"
                            class="d-block"
                            >The URL is valid, but the image could not be
                            loaded.</span
                        >
                    </div>
                </div>
            </article>
        </div>
    </section>
</template>
