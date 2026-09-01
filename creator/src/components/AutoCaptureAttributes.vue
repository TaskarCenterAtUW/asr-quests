<!-- @format -->

<script setup>
import { computed } from "vue";
import { useQuestStore } from "../stores/questStore";

const props = defineProps({
    elementIndex: { type: Number, required: true },
    questIndex: { type: Number, required: true },
});

const store = useQuestStore();

const quest = computed(
    () =>
        store.definition.elements[props.elementIndex]?.quests[props.questIndex]
);

const questBase = computed(
    () => `/elements/${props.elementIndex}/quests/${props.questIndex}`
);
const attributesPath = computed(
    () => `${questBase.value}/auto_capture_attributes`
);

const attributes = [
    {
        key: "ac_width",
        label: "Width",
        description: "Automatically captured width measurement.",
        placeholder: "ext:ac:width",
    },
    {
        key: "ac_incline",
        label: "Incline",
        description: "Automatically captured incline measurement.",
        placeholder: "ext:ac:incline",
    },
    {
        key: "ac_cross_slope",
        label: "Cross slope",
        description: "Automatically captured cross-slope measurement.",
        placeholder: "ext:ac:cross_slope",
    },
    {
        key: "ac_surface_integrity",
        label: "Surface integrity",
        description: "Automatically captured surface-integrity measurement.",
        placeholder: "ext:ac:surface_integrity",
    },
    {
        key: "ac_surface_disruption",
        label: "Surface disruption",
        description: "Automatically captured surface-disruption measurement.",
        placeholder: "ext:ac:surface_disruption",
    },
    {
        key: "ac_height_from_ground",
        label: "Height from ground",
        description: "Automatically captured height-from-ground measurement.",
        placeholder: "ext:ac:height_from_ground",
    },
    {
        key: "ac_lidar_depth",
        label: "LiDAR depth",
        description: "Automatically captured LiDAR depth measurement.",
        placeholder: "ext:ac:lidar_depth",
    },
];

const knownAttributeKeys = new Set(attributes.map((attribute) => attribute.key));

const currentAttributes = computed(() => {
    const value = quest.value?.auto_capture_attributes;
    return value && typeof value === "object" && !Array.isArray(value)
        ? value
        : {};
});

const unknownMappings = computed(() =>
    Object.entries(currentAttributes.value).filter(
        ([key]) => !knownAttributeKeys.has(key)
    )
);

const hasEmptyMapping = computed(() =>
    Object.values(currentAttributes.value).some(
        (value) => typeof value !== "string" || !value.trim()
    )
);

function hasAttribute(attributeKey) {
    return Object.prototype.hasOwnProperty.call(
        currentAttributes.value,
        attributeKey
    );
}

function defaultTagFor(attributeKey) {
    return `ext:ac:${attributeKey.slice(3)}`;
}

function updateAttributes(nextAttributes) {
    store.updateQuest(props.elementIndex, props.questIndex, {
        auto_capture_attributes: nextAttributes,
    });
}

function toggleAttribute(attributeKey, enabled) {
    const nextAttributes = { ...currentAttributes.value };

    if (enabled) {
        if (!Object.prototype.hasOwnProperty.call(nextAttributes, attributeKey)) {
            nextAttributes[attributeKey] = defaultTagFor(attributeKey);
        }
    } else {
        delete nextAttributes[attributeKey];
    }

    updateAttributes(nextAttributes);
}

function updateTag(attributeKey, value) {
    updateAttributes({
        ...currentAttributes.value,
        [attributeKey]: value,
    });
}

function removeUnknownMapping(attributeKey) {
    const nextAttributes = { ...currentAttributes.value };
    delete nextAttributes[attributeKey];
    updateAttributes(nextAttributes);
}

function attributePath(attributeKey) {
    return `${attributesPath.value}/${attributeKey}`;
}
</script>

<template>
    <section
        v-if="quest && quest.quest_type === 'AutoCapture'"
        class="col-12 mt-3 pt-2 border-top"
        :aria-labelledby="`auto-capture-heading-${elementIndex}-${questIndex}`"
    >
        <div class="d-flex align-items-center justify-content-between gap-2 mb-1">
            <h3
                :id="`auto-capture-heading-${elementIndex}-${questIndex}`"
                class="h6 mb-0 fw-semibold"
            >
                AutoCapture Attributes
            </h3>
            <span class="badge text-bg-primary">Automatic</span>
        </div>
        <p
            :id="`auto-capture-help-${elementIndex}-${questIndex}`"
            class="form-text small mb-3"
        >
            Select the measurements to capture, and map each one to the tag key
            that should be included in the exported definition.
        </p>

        <div
            class="d-grid gap-2"
            role="group"
            :aria-describedby="`auto-capture-help-${elementIndex}-${questIndex}`"
        >
            <div
                v-for="attribute in attributes"
                :key="attribute.key"
                class="auto-capture-attribute-card border rounded p-2"
            >
                <div class="row g-2 align-items-start">
                    <div class="col-md-5">
                        <div class="form-check">
                            <input
                                :id="`auto-capture-enabled-${elementIndex}-${questIndex}-${attribute.key}`"
                                class="form-check-input"
                                type="checkbox"
                                :checked="hasAttribute(attribute.key)"
                                @change="
                                    toggleAttribute(
                                        attribute.key,
                                        $event.target.checked
                                    )
                                "
                            />
                            <label
                                :for="`auto-capture-enabled-${elementIndex}-${questIndex}-${attribute.key}`"
                                class="form-check-label fw-semibold"
                            >
                                <span class="d-block">{{ attribute.label }}</span>
                                <code class="d-block small text-muted">{{ attribute.key }}</code>
                            </label>
                        </div>
                        <div class="form-text small ms-4">
                            {{ attribute.description }}
                        </div>
                    </div>
                    <div class="col-md-7">
                        <label
                            :for="`auto-capture-tag-${elementIndex}-${questIndex}-${attribute.key}`"
                            class="form-label small mb-1"
                        >
                            Export tag key
                        </label>
                        <input
                            :id="`auto-capture-tag-${elementIndex}-${questIndex}-${attribute.key}`"
                            type="text"
                            class="form-control form-control-sm"
                            :value="currentAttributes[attribute.key] ?? ''"
                            :placeholder="attribute.placeholder"
                            :disabled="!hasAttribute(attribute.key)"
                            :aria-describedby="`auto-capture-tag-hint-${elementIndex}-${questIndex}-${attribute.key}`"
                            :class="{
                                'is-invalid': store.hasValidationError(
                                    attributePath(attribute.key)
                                ),
                            }"
                            @input="updateTag(attribute.key, $event.target.value)"
                        />
                        <div
                            :id="`auto-capture-tag-hint-${elementIndex}-${questIndex}-${attribute.key}`"
                            class="form-text small"
                        >
                            Example: {{ attribute.placeholder }}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div
            v-if="unknownMappings.length > 0"
            class="alert alert-warning py-2 px-3 mt-3 mb-0"
            role="alert"
        >
            <div class="small fw-semibold mb-1">
                Unsupported AutoCapture mappings
            </div>
            <p class="small mb-2">
                These keys are not defined by the schema. Remove them before
                exporting or replace them with one of the supported attributes
                above.
            </p>
            <div
                v-for="([key, value], mappingIndex) in unknownMappings"
                :key="`${key}-${mappingIndex}`"
                class="d-flex align-items-center justify-content-between gap-2"
            >
                <code class="small text-break">{{ key }}: {{ value }}</code>
                <button
                    type="button"
                    class="btn btn-sm btn-outline-danger py-0 px-2"
                    :aria-label="`Remove unsupported mapping ${key}`"
                    @click="removeUnknownMapping(key)"
                >
                    Remove
                </button>
            </div>
        </div>

        <div
            v-if="Object.keys(currentAttributes).length === 0"
            class="form-text text-danger mt-2"
            :class="{
                'fw-semibold': store.hasValidationError(attributesPath),
            }"
        >
            Select at least one AutoCapture attribute.
        </div>
        <div v-else-if="hasEmptyMapping" class="form-text text-danger mt-2">
            Each selected AutoCapture attribute needs a non-empty export tag
            key.
        </div>
    </section>
</template>
