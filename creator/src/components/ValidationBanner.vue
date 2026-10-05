<!-- @format -->

<script setup>
import { computed } from "vue";
import { useQuestStore } from "../stores/questStore";

const store = useQuestStore();

const arrayItemLabels = new Map([
    ["quests", "Quest"],
    ["quest_answer_choices", "Answer Choice"],
    ["feature-presets", "Feature Preset"],
    ["custom-icons", "Custom Icon"],
]);

const fieldLabels = {
    recency_period: "Resurvey Interval",
    element_type_icon: "Element Icon",
    quest_id: "Quest ID",
    quest_title: "Quest Title",
    quest_description: "Quest Description",
    quest_type: "Quest Type",
    quest_tag: "Quest Tag",
    quest_image_url: "Quest Image URL",
    quest_answer_validation: "Answer Validation",
    quest_answer_dependency: "Answer Dependency",
    auto_capture_attributes: "AutoCapture Attributes",
    choice_text: "Choice Text",
    choice_follow_up: "Picture-Taking Prompt Text",
    url: "URL",
    min: "Minimum",
    max: "Maximum",
};

function decodePointerSegment(segment) {
    return segment.replace(/~1/g, "/").replace(/~0/g, "~");
}

function humanizeField(segment) {
    return (
        fieldLabels[segment] ??
        segment
            .replace(/[_-]+/g, " ")
            .replace(/\b[a-z]/g, (letter) => letter.toUpperCase())
    );
}

function isArrayIndex(segment) {
    return /^\d+$/.test(segment ?? "");
}

function elementLabel(index) {
    const element = store.definition.elements[index];
    const elementType =
        typeof element?.element_type === "string"
            ? element.element_type.trim()
            : "";
    return elementType || `Element #${index + 1}`;
}

function formatPath(error) {
    const segments = String(error.instancePath ?? "")
        .split("/")
        .filter(Boolean)
        .map(decodePointerSegment);

    if (error.keyword === "required" && error.params?.missingProperty) {
        segments.push(error.params.missingProperty);
    } else if (
        error.keyword === "additionalProperties" &&
        error.params?.additionalProperty
    ) {
        segments.push(error.params.additionalProperty);
    }

    if (segments.length === 0) {
        return "Definition";
    }

    const breadcrumbs = [];
    for (let index = 0; index < segments.length; ) {
        const segment = segments[index];
        const itemIndex = segments[index + 1];

        if (segment === "elements" && isArrayIndex(itemIndex)) {
            breadcrumbs.push(elementLabel(Number(itemIndex)));
            index += 2;
            continue;
        }

        const itemLabel = arrayItemLabels.get(segment);
        if (itemLabel && isArrayIndex(itemIndex)) {
            breadcrumbs.push(`${itemLabel} #${Number(itemIndex) + 1}`);
            index += 2;
            continue;
        }

        if (segment === "tags" && index + 1 < segments.length) {
            breadcrumbs.push("Tags");
            breadcrumbs.push(`Tag "${segments[index + 1]}"`);
            index += 2;
            continue;
        }

        breadcrumbs.push(
            isArrayIndex(segment)
                ? `Item #${Number(segment) + 1}`
                : humanizeField(segment)
        );
        index += 1;
    }

    return breadcrumbs.join(" > ");
}

const validationErrors = computed(() => store.validationErrors);
const validationWarnings = computed(() => store.validationWarnings);
const canUpgradeVersion = computed(() =>
    validationWarnings.value.some(
        (warning) => warning.keyword === "outdated-version"
    )
);
</script>

<template>
    <div class="d-grid gap-2">
        <div
            v-if="validationErrors.length > 0"
            class="alert alert-danger py-2 px-3 mb-0"
            role="alert"
        >
            <div
                class="d-flex align-items-center justify-content-between gap-2 flex-wrap mb-2"
            >
                <strong class="small">Validation issues</strong>
                <span class="small text-muted"
                    >Export is blocked until these are fixed.</span
                >
            </div>

            <ul class="small mb-0 ps-3">
                <li
                    v-for="error in validationErrors"
                    :key="`${error.instancePath}-${error.keyword}-${error.message}`"
                >
                    <span class="fw-semibold">{{
                        formatPath(error)
                    }}</span>
                    <span class="text-muted">: {{ error.message }}</span>
                </li>
            </ul>
        </div>

        <div
            v-if="validationWarnings.length > 0"
            class="alert alert-warning py-2 px-3 mb-0"
            role="status"
        >
            <div
                class="d-flex align-items-center justify-content-between gap-2 flex-wrap mb-2"
            >
                <strong class="small">Warnings</strong>
                <div class="d-flex align-items-center gap-2 flex-wrap">
                    <span class="small text-muted"
                        >Warnings do not block export.</span
                    >
                    <button
                        v-if="canUpgradeVersion"
                        type="button"
                        class="btn btn-sm btn-outline-secondary"
                        @click="store.upgradeDefinitionVersion()"
                    >
                        Upgrade to {{ store.latestDefinitionVersion }}
                    </button>
                </div>
            </div>

            <ul class="small mb-0 ps-3">
                <li
                    v-for="warning in validationWarnings"
                    :key="`${warning.instancePath}-${warning.keyword}-${warning.message}`"
                >
                    <span class="fw-semibold">{{
                        formatPath(warning)
                    }}</span>
                    <span class="text-muted">: {{ warning.message }}</span>
                </li>
            </ul>
        </div>

        <div
            v-if="
                validationErrors.length === 0 && validationWarnings.length === 0
            "
            class="alert alert-success py-2 px-3 mb-0 small"
            role="status"
        >
            Definition is current and valid.
        </div>
    </div>
</template>

<style>
/* wrap long validation paths instead of underflowing off the right edge,
   matching the JSON Preview line-wrapping behavior */
.creator-validation-body li {
    overflow-wrap: anywhere;
    word-break: break-word;
}

.creator-validation-body ul {
    min-width: 0;
}
</style>
