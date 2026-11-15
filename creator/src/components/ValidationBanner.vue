<!-- @format -->

<script setup>
import { computed, nextTick } from "vue";
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

function errorPathSegments(error) {
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

    return segments;
}

function formatPath(error) {
    const segments = errorPathSegments(error);

    if (segments.length === 0) {
        return "Definition";
    }

    const breadcrumbs = [];
    for (let index = 0; index < segments.length;) {
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

function arrayIndex(segment) {
    return isArrayIndex(segment) ? Number(segment) : null;
}

function dependencyTargetId(elementIndex, questIndex, segments, fieldIndex) {
    const dependencySegment = segments[fieldIndex + 1];
    const dependencyIndex = arrayIndex(dependencySegment) ?? 0;
    const dependencyField =
        dependencyIndex === 0 && dependencySegment !== "0"
            ? dependencySegment
            : segments[fieldIndex + 2];
    const quest = store.definition.elements[elementIndex]?.quests[questIndex];
    const dependency = quest?._deps?.[dependencyIndex];

    if (dependencyField !== "required_value") {
        return `dependency-question-${elementIndex}-${questIndex}-${dependencyIndex}`;
    }

    if (dependency?.question_id == null) {
        return `dependency-question-${elementIndex}-${questIndex}-${dependencyIndex}`;
    }

    const dependentQuest = store.definition.elements[elementIndex]?.quests.find(
        (item) => item.quest_id === dependency.question_id
    );
    if (
        dependentQuest &&
        ["ExclusiveChoice", "MultipleChoice"].includes(
            dependentQuest.quest_type
        )
    ) {
        const firstChoice = dependentQuest.quest_answer_choices?.[0];
        if (firstChoice) {
            return `dependency-choice-${elementIndex}-${questIndex}-${dependencyIndex}-${firstChoice.value}`;
        }
    }

    return `dependency-value-${elementIndex}-${questIndex}-${dependencyIndex}`;
}

function fieldTargetId(error) {
    const segments = errorPathSegments(error);

    if (segments[0] === "elements") {
        const elementIndex = arrayIndex(segments[1]);
        if (elementIndex === null) {
            return "add-element-button";
        }

        const questPosition = segments.indexOf("quests", 2);
        if (questPosition < 0) {
            const elementField = segments[2];
            if (elementField === "quest_query") {
                return `el-query-${elementIndex}`;
            }
            if (elementField === "element_type_icon") {
                return `element-icon-${elementIndex}`;
            }
            return `el-type-${elementIndex}`;
        }

        const questIndex = arrayIndex(segments[questPosition + 1]);
        if (questIndex === null) {
            return `add-quest-${elementIndex}`;
        }

        const fieldIndex = questPosition + 2;
        const questField = segments[fieldIndex];
        if (questField === "quest_answer_choices") {
            const choiceIndex = arrayIndex(segments[fieldIndex + 1]);
            if (choiceIndex === null) {
                return `add-choice-${elementIndex}-${questIndex}`;
            }

            const choiceField = segments[fieldIndex + 2];
            const choiceTargets = {
                choice_text: "choice-text",
                choice_follow_up: "choice-followup",
                image_url: "choice-image",
                value: "choice-value",
            };
            return `${choiceTargets[choiceField] ?? "choice-value"}-${elementIndex}-${questIndex}-${choiceIndex}`;
        }

        if (questField === "quest_answer_validation") {
            const bound = segments[fieldIndex + 1];
            return `numeric-${bound === "max" ? "max" : "min"}-${elementIndex}-${questIndex}`;
        }

        if (questField === "auto_capture_attributes") {
            const attribute = segments[fieldIndex + 1];
            return attribute
                ? `auto-capture-tag-${elementIndex}-${questIndex}-${attribute}`
                : `auto-capture-enabled-${elementIndex}-${questIndex}-ac_width`;
        }

        if (questField === "quest_answer_dependency") {
            return dependencyTargetId(
                elementIndex,
                questIndex,
                segments,
                fieldIndex
            );
        }

        const questTargets = {
            quest_description: "quest-desc",
            quest_id: "quest-id",
            quest_image_url: "quest-image",
            quest_tag: "quest-tag",
            quest_title: "quest-title",
            quest_type: "quest-type",
        };
        return `${questTargets[questField] ?? "quest-title"}-${elementIndex}-${questIndex}`;
    }

    if (segments[0] === "feature-presets") {
        const presetIndex = arrayIndex(segments[1]);
        if (presetIndex === null) {
            return "feature-presets-add";
        }

        const presetField = segments[2];
        if (presetField === "icon") {
            return `feature-preset-icon-${presetIndex}`;
        }
        if (presetField === "tags") {
            const tagKey = segments[3];
            const tagKeys = Object.keys(
                store.definition["feature-presets"]?.[presetIndex]?.tags ?? {}
            );
            const tagIndex = tagKeys.indexOf(tagKey);
            if (tagIndex >= 0) {
                return `preset-${presetIndex}-tag-value-${tagIndex}`;
            }
            return tagKeys.length > 0
                ? `preset-${presetIndex}-tag-key-0`
                : `preset-${presetIndex}-add-tag`;
        }
        return `feature-preset-name-${presetIndex}`;
    }

    if (segments[0] === "custom-icons") {
        const iconIndex = arrayIndex(segments[1]);
        if (iconIndex === null) {
            return "custom-icons-add";
        }
        const iconField = segments[2];
        const iconTargets = {
            name: "name",
            type: "type",
            url: "url",
        };
        return `custom-icon-${iconTargets[iconField] ?? "name"}-${iconIndex}`;
    }

    if (segments[0] === "recency_period") {
        return "recency-period";
    }

    if (segments[0] === "version") {
        return "upgrade-definition-version";
    }

    return null;
}

function expandPanel(panelId) {
    const toggle = document.querySelector(`[aria-controls="${panelId}"]`);
    if (toggle?.getAttribute("aria-expanded") === "false") {
        toggle.click();
    }
}

async function focusIssue(error) {
    const segments = errorPathSegments(error);
    const targetId = fieldTargetId(error);

    if (segments[0] === "elements") {
        const elementIndex = arrayIndex(segments[1]);
        if (elementIndex !== null) {
            store.selectElement(elementIndex);
            const questPosition = segments.indexOf("quests", 2);
            const questIndex =
                questPosition < 0
                    ? null
                    : arrayIndex(segments[questPosition + 1]);
            if (questIndex !== null) {
                store.selectQuest(questIndex);
            }
        }
    }

    await nextTick();

    if (segments[0] === "feature-presets") {
        expandPanel("feature-presets-panel");
    } else if (segments[0] === "custom-icons") {
        expandPanel("custom-icons-panel");
    }

    await nextTick();
    const target = targetId ? document.getElementById(targetId) : null;
    if (!target) {
        console.error(
            `No focus target found for validation path: ${error.instancePath}`
        );
        return;
    }

    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.focus({ preventScroll: true });
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
                    <span class="fw-semibold">{{ formatPath(error) }}</span>
                    <span class="text-muted">: {{ error.message }}</span>
                    <button
                        v-if="fieldTargetId(error)"
                        type="button"
                        class="validation-focus-link"
                        :aria-label="`Focus ${formatPath(error)}`"
                        :title="`Focus ${formatPath(error)}`"
                        @click="focusIssue(error)"
                    >
                        <svg
                            aria-hidden="true"
                            viewBox="0 0 16 16"
                            width="16"
                            height="16"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.6"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <path
                                d="m6.5 9.5 3-3M5.5 11H4a3 3 0 0 1 0-6h2m4 0h2a3 3 0 0 1 0 6h-2"
                            />
                        </svg>
                    </button>
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
                        id="upgrade-definition-version"
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
                    <span class="fw-semibold">{{ formatPath(warning) }}</span>
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
.validation-focus-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    flex: 0 0 auto;
    margin-inline-start: 0.35rem;
    padding: 0;
    color: inherit;
    vertical-align: middle;
    border: 0;
    background: transparent;
    opacity: 0.75;
}

.validation-focus-link:hover {
    opacity: 1;
}

.validation-focus-link:focus-visible {
    border-radius: 0.15rem;
    outline: 2px solid currentColor;
    outline-offset: 2px;
    opacity: 1;
}

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
