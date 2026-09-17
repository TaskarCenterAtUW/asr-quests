<!-- @format -->
<!--
  DependencyGraph.vue
  ───────────────────
  Visualises prerequisite (parent) and dependent (child) relationships for the
  currently-selected quest inside an element.

  Dependency semantics:
  • Multiple quest_answer_dependency rows are AND conditions.
  • Multiple required_value entries inside a single row are OR choices.
  • Blank/null required values are incomplete authoring state, not "any answer".

  Accessibility features:
  • Semantic sections with aria-labelledby headings
  • aria-label on every interactive quest card
  • aria-hidden on decorative icons / arrows
  • role="list" / role="listitem" for prerequisite lists
  • prefers-reduced-motion respected for transitions
-->

<script setup>
import { computed } from "vue";
import { useQuestStore } from "../stores/questStore";

const props = defineProps({
    elementIndex: { type: Number, required: true },
});

const store = useQuestStore();

const quests = computed(
    () => store.definition.elements[props.elementIndex]?.quests || []
);

const selectedQi = computed(() => store.selectedQuestIndex);

const selectedQuest = computed(() => {
    const qi = selectedQi.value;
    if (qi == null || qi < 0 || qi >= quests.value.length) return null;
    return quests.value[qi];
});

const questById = computed(() => {
    const map = new Map();

    quests.value.forEach((quest, index) => {
        if (!map.has(quest.quest_id)) {
            map.set(quest.quest_id, index);
        }
    });

    return map;
});

/** @type {Record<string, string>} */
const QUEST_TYPE_LABELS = {
    ExclusiveChoice: "Single choice",
    MultipleChoice: "Multiple choice",
    Numeric: "Number entry",
    TextEntry: "Text entry",
    AutoCapture: "Auto capture",
};

/**
 * Return a human-readable label for a quest_type enum value.
 * @param {string} type
 * @returns {string}
 */
function questTypeLabel(type) {
    return QUEST_TYPE_LABELS[type] || type;
}

/**
 * Normalise a dependency required_value into display strings.
 * Blank/null values represent incomplete authoring state and are omitted.
 * @param {unknown} value
 * @returns {string[]}
 */
function formatValues(value) {
    if (value === "" || value == null) return [];

    if (Array.isArray(value)) {
        return value
            .filter((entry) => entry !== "" && entry != null)
            .map((entry) => String(entry));
    }

    return [String(value)];
}

/**
 * Build a stable key for a dependency condition row.
 * @param {object} condition
 * @returns {string}
 */
function conditionKey(condition) {
    return `${condition.question_id ?? "unset"}-${condition.dependencyIndex}`;
}

/**
 * Convert a raw dependency row into a display-safe condition object while
 * preserving the original row. Dependency rows are AND conditions, so callers
 * should not merge rows even if they reference the same parent quest.
 *
 * @param {{ question_id?: number|null, required_value?: unknown }} dependency
 * @param {number} dependencyIndex
 */
function createParentCondition(dependency, dependencyIndex) {
    const hasQuestionId = dependency?.question_id != null;
    const parentIndex = hasQuestionId
        ? questById.value.get(dependency.question_id)
        : null;
    const parentQuest = parentIndex != null ? quests.value[parentIndex] : null;
    const values = formatValues(dependency?.required_value);

    let state = "complete";
    let stateLabel = "";

    if (!hasQuestionId) {
        state = "incomplete-parent";
        stateLabel = "Select a parent quest";
    } else if (!parentQuest) {
        state = "missing-parent";
        stateLabel = `Referenced quest #${dependency.question_id} was not found`;
    } else if (values.length === 0) {
        state = "incomplete-value";
        stateLabel = "Select a required value";
    }

    return {
        dependencyIndex,
        qi: parentIndex,
        quest: parentQuest,
        question_id: dependency?.question_id ?? null,
        values,
        isMultiValue: values.length > 1,
        state,
        stateLabel,
        isComplete: state === "complete",
    };
}

/**
 * Convert a child dependency row that references the selected quest into a
 * display-safe condition object. The selected parent exists by definition, but
 * the required value may still be incomplete.
 *
 * @param {{ required_value?: unknown }} dependency
 * @param {number} dependencyIndex
 */
function createChildCondition(dependency, dependencyIndex) {
    const values = formatValues(dependency?.required_value);
    const isComplete = values.length > 0;

    return {
        dependencyIndex,
        values,
        isMultiValue: values.length > 1,
        state: isComplete ? "complete" : "incomplete-value",
        stateLabel: isComplete ? "" : "Select a required value",
        isComplete,
    };
}

/** @param {number|null|undefined} qi */
function selectQuest(qi) {
    if (qi != null) store.selectQuest(qi);
}

// ── Computed: prerequisites (parents) ───────────────────────────────

const prerequisites = computed(() => {
    const selected = selectedQuest.value;
    if (!selected) return [];

    return (selected._deps || []).map((dependency, dependencyIndex) =>
        createParentCondition(dependency, dependencyIndex)
    );
});

// ── Computed: children (dependents) ─────────────────────────────────

const children = computed(() => {
    const selected = selectedQuest.value;
    if (!selected) return [];

    return quests.value
        .map((quest, questIndex) => {
            if (questIndex === selectedQi.value) return null;

            const dependencyRows = quest._deps || [];
            const conditions = dependencyRows
                .map((dependency, dependencyIndex) => ({
                    dependency,
                    dependencyIndex,
                }))
                .filter(
                    ({ dependency }) =>
                        dependency.question_id === selected.quest_id
                )
                .map(({ dependency, dependencyIndex }) =>
                    createChildCondition(dependency, dependencyIndex)
                );

            if (conditions.length === 0) return null;

            return {
                qi: questIndex,
                quest,
                conditions,
                otherDepsCount: dependencyRows.length - conditions.length,
            };
        })
        .filter(Boolean)
        .sort((left, right) => {
            const leftId = left.quest?.quest_id ?? Number.MAX_SAFE_INTEGER;
            const rightId = right.quest?.quest_id ?? Number.MAX_SAFE_INTEGER;
            return leftId - rightId;
        });
});
</script>

<template>
    <div class="dg-root">
        <!-- Empty state: no quests -->
        <div v-if="quests.length === 0" class="dg-empty">
            <p>Add quests to this element to see dependency chains.</p>
        </div>

        <!-- Empty state: no selection -->
        <div v-else-if="!selectedQuest" class="dg-empty">
            <p>Select a quest in the editor to explore its relationships.</p>
        </div>

        <div v-else class="dg-flow">
            <!-- ── Section 1: Prerequisites ────────────────────── -->
            <section class="dg-section" aria-labelledby="dg-prereq-heading">
                <h3 id="dg-prereq-heading" class="dg-section-heading">
                    <span class="dg-section-icon" aria-hidden="true">
                        <svg
                            viewBox="0 0 16 16"
                            fill="currentColor"
                            width="14"
                            height="14"
                        >
                            <path
                                d="M8 15a1 1 0 0 1-1-1V7.414L4.707 9.707a1 1 0 0 1-1.414-1.414l4-4a1 1 0 0 1 1.414 0l4 4a1 1 0 0 1-1.414 1.414L9 7.414V14a1 1 0 0 1-1 1z"
                            />
                        </svg>
                    </span>
                    When does this quest appear?
                </h3>

                <!-- Always shown -->
                <div v-if="prerequisites.length === 0" class="dg-always-card">
                    <span class="dg-always-check" aria-hidden="true">
                        <svg
                            viewBox="0 0 16 16"
                            fill="currentColor"
                            width="13"
                            height="13"
                        >
                            <path
                                d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"
                            />
                        </svg>
                    </span>
                    <div>
                        <strong>Always shown</strong>
                        <span class="dg-always-sub"
                            >No conditions — this quest is asked of
                            everyone.</span
                        >
                    </div>
                </div>

                <!-- Single prerequisite -->
                <div
                    v-else-if="prerequisites.length === 1"
                    class="dg-prereq-single"
                >
                    <button
                        v-if="prerequisites[0].quest"
                        type="button"
                        class="dg-quest-card dg-quest-card-prereq"
                        @click="selectQuest(prerequisites[0].qi)"
                        :aria-label="`View quest #${prerequisites[0].quest.quest_id}: ${prerequisites[0].quest.quest_title || '(unnamed)'}`"
                    >
                        <span class="dg-qc-id"
                            >#{{ prerequisites[0].quest.quest_id }}</span
                        >
                        <span class="dg-qc-title">{{
                            prerequisites[0].quest.quest_title || "(unnamed)"
                        }}</span>
                        <span class="dg-qc-type">{{
                            questTypeLabel(prerequisites[0].quest.quest_type)
                        }}</span>
                    </button>
                    <div v-else class="dg-quest-card dg-quest-card-missing">
                        <span class="dg-qc-id">?</span>
                        <span class="dg-qc-title">
                            {{
                                prerequisites[0].state === "incomplete-parent"
                                    ? "No parent quest selected"
                                    : `Unknown quest (ID: ${prerequisites[0].question_id})`
                            }}
                        </span>
                    </div>

                    <div class="dg-inline-arrow" aria-hidden="true">→</div>

                    <div
                        class="dg-condition-group"
                        role="note"
                        :aria-label="
                            prerequisites[0].isComplete
                                ? `Required answer: ${prerequisites[0].values.join(' or ')}`
                                : prerequisites[0].stateLabel
                        "
                    >
                        <span class="dg-cg-label">when answered</span>
                        <div class="dg-pills">
                            <template v-if="prerequisites[0].isComplete">
                                <span
                                    v-if="prerequisites[0].isMultiValue"
                                    class="dg-pill-or-hint"
                                    >any of:</span
                                >
                                <span
                                    v-for="(
                                        value, valueIndex
                                    ) in prerequisites[0].values"
                                    :key="`${conditionKey(prerequisites[0])}-${value}-${valueIndex}`"
                                    class="dg-pill dg-pill-value"
                                    >"{{ value }}"</span
                                >
                            </template>
                            <span v-else class="dg-pill dg-pill-warning">
                                {{ prerequisites[0].stateLabel }}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Multiple prerequisites (AND logic) -->
                <div v-else class="dg-prereq-multi">
                    <div class="dg-and-banner" role="note">
                        <span class="dg-and-tag">AND</span>
                        All <strong>{{ prerequisites.length }}</strong> of these
                        conditions must be true:
                    </div>
                    <div class="dg-prereq-multi-list" role="list">
                        <div
                            v-for="(condition, conditionIndex) in prerequisites"
                            :key="conditionKey(condition)"
                            class="dg-prereq-multi-item"
                            role="listitem"
                        >
                            <button
                                v-if="condition.quest"
                                type="button"
                                class="dg-quest-card dg-quest-card-prereq"
                                @click="selectQuest(condition.qi)"
                                :aria-label="`View quest #${condition.quest.quest_id}: ${condition.quest.quest_title || '(unnamed)'}`"
                            >
                                <span class="dg-qc-id"
                                    >#{{ condition.quest.quest_id }}</span
                                >
                                <span class="dg-qc-title">{{
                                    condition.quest.quest_title || "(unnamed)"
                                }}</span>
                                <span class="dg-qc-type">{{
                                    questTypeLabel(condition.quest.quest_type)
                                }}</span>
                            </button>
                            <div
                                v-else
                                class="dg-quest-card dg-quest-card-missing"
                            >
                                <span class="dg-qc-id">?</span>
                                <span class="dg-qc-title">
                                    {{
                                        condition.state === "incomplete-parent"
                                            ? "No parent quest selected"
                                            : `Unknown quest (ID: ${condition.question_id})`
                                    }}
                                </span>
                            </div>

                            <div class="dg-inline-arrow" aria-hidden="true">
                                →
                            </div>

                            <div
                                class="dg-condition-group"
                                role="note"
                                :aria-label="
                                    condition.isComplete
                                        ? `Condition ${conditionIndex + 1} required answer: ${condition.values.join(' or ')}`
                                        : `Condition ${conditionIndex + 1}: ${condition.stateLabel}`
                                "
                            >
                                <span class="dg-cg-label"
                                    >condition {{ conditionIndex + 1 }}</span
                                >
                                <div class="dg-pills">
                                    <template v-if="condition.isComplete">
                                        <span
                                            v-if="condition.isMultiValue"
                                            class="dg-pill-or-hint"
                                            >any of:</span
                                        >
                                        <span
                                            v-for="(
                                                value, valueIndex
                                            ) in condition.values"
                                            :key="`${conditionKey(condition)}-${value}-${valueIndex}`"
                                            class="dg-pill dg-pill-value"
                                            >"{{ value }}"</span
                                        >
                                    </template>
                                    <span
                                        v-else
                                        class="dg-pill dg-pill-warning"
                                    >
                                        {{ condition.stateLabel }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Connector -->
            <div class="dg-connector" aria-hidden="true">
                <div class="dg-connector-line"></div>
                <div class="dg-connector-tip">▼</div>
            </div>

            <!-- ── Section 2: Selected Quest ──────────────────── -->
            <section
                class="dg-section dg-section-selected"
                aria-labelledby="dg-selected-heading"
                aria-current="step"
            >
                <div class="dg-selected-meta">
                    <span class="dg-selected-eyebrow">Selected quest</span>
                    <span class="dg-selected-id"
                        >#{{ selectedQuest.quest_id }}</span
                    >
                    <span class="dg-type-badge">{{
                        questTypeLabel(selectedQuest.quest_type)
                    }}</span>
                    <span
                        v-if="prerequisites.length === 0"
                        class="dg-type-badge dg-badge-always"
                    >
                        Always shown
                    </span>
                </div>
                <h4 id="dg-selected-heading" class="dg-selected-title">
                    {{ selectedQuest.quest_title || "(unnamed)" }}
                </h4>
                <p
                    v-if="selectedQuest.quest_description"
                    class="dg-selected-desc"
                >
                    {{ selectedQuest.quest_description }}
                </p>
            </section>

            <!-- Connector -->
            <div class="dg-connector" aria-hidden="true">
                <div class="dg-connector-line"></div>
                <div class="dg-connector-tip">▼</div>
            </div>

            <!-- ── Section 3: Children ─────────────────────────── -->
            <section class="dg-section" aria-labelledby="dg-children-heading">
                <h3 id="dg-children-heading" class="dg-section-heading">
                    <span class="dg-section-icon" aria-hidden="true">
                        <svg
                            viewBox="0 0 16 16"
                            fill="currentColor"
                            width="14"
                            height="14"
                        >
                            <path
                                d="M8 1a1 1 0 0 1 1 1v6.586l2.293-2.293a1 1 0 1 1 1.414 1.414l-4 4a1 1 0 0 1-1.414 0l-4-4a1 1 0 1 1 1.414-1.414L7 8.586V2a1 1 0 0 1 1-1z"
                            />
                        </svg>
                    </span>
                    What does answering this quest unlock?
                </h3>

                <div v-if="children.length === 0" class="dg-none-card">
                    No other quests depend on this one.
                </div>

                <ol v-else class="dg-children-list">
                    <li
                        v-for="child in children"
                        :key="child.quest.quest_id"
                        class="dg-child-row"
                    >
                        <div class="dg-child-conditions">
                            <div
                                v-if="child.conditions.length > 1"
                                class="dg-child-and-hint"
                                role="note"
                            >
                                <span class="dg-and-tag">AND</span>
                                all listed answers are required
                            </div>

                            <div
                                v-for="condition in child.conditions"
                                :key="conditionKey(condition)"
                                class="dg-condition-group"
                                role="note"
                                :aria-label="
                                    condition.isComplete
                                        ? `This quest unlocks when you answer: ${condition.values.join(' or ')}`
                                        : condition.stateLabel
                                "
                            >
                                <span class="dg-cg-label">when you answer</span>
                                <div class="dg-pills">
                                    <template v-if="condition.isComplete">
                                        <span
                                            v-if="condition.isMultiValue"
                                            class="dg-pill-or-hint"
                                            >any of:</span
                                        >
                                        <span
                                            v-for="(
                                                value, valueIndex
                                            ) in condition.values"
                                            :key="`${conditionKey(condition)}-${value}-${valueIndex}`"
                                            class="dg-pill dg-pill-value"
                                            >"{{ value }}"</span
                                        >
                                    </template>
                                    <span
                                        v-else
                                        class="dg-pill dg-pill-warning"
                                    >
                                        {{ condition.stateLabel }}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div class="dg-inline-arrow" aria-hidden="true">→</div>

                        <button
                            type="button"
                            class="dg-quest-card dg-quest-card-child"
                            @click="selectQuest(child.qi)"
                            :aria-label="`View quest #${child.quest.quest_id}: ${child.quest.quest_title || '(unnamed)'}`"
                        >
                            <span class="dg-qc-id"
                                >#{{ child.quest.quest_id }}</span
                            >
                            <span class="dg-qc-title">{{
                                child.quest.quest_title || "(unnamed)"
                            }}</span>
                            <span class="dg-qc-type">{{
                                questTypeLabel(child.quest.quest_type)
                            }}</span>
                            <span
                                v-if="child.otherDepsCount > 0"
                                class="dg-qc-note"
                            >
                                + {{ child.otherDepsCount }} more condition{{
                                    child.otherDepsCount > 1 ? "s" : ""
                                }}
                                required
                            </span>
                        </button>
                    </li>
                </ol>
            </section>
        </div>
    </div>
</template>

<style scoped>
/* ── Root ─────────────────────────────────────────────────── */
.dg-root {
    font-family: var(--creator-font-family, sans-serif);
    font-size: 0.875rem;
    color: var(--creator-ink, #20142f);
    min-width: 0;
}

/* ── Empty state ──────────────────────────────────────────── */
.dg-empty {
    padding: 2.5rem 1.5rem;
    text-align: center;
    color: var(--creator-ink-soft, #6b7280);
    font-style: italic;
    background: linear-gradient(
        180deg,
        rgba(var(--creator-primary-rgb, 95, 34, 201), 0.04),
        transparent
    );
    border-radius: var(--creator-radius-md, 0.75rem);
    border: 1px dashed rgba(var(--creator-primary-rgb, 95, 34, 201), 0.2);
    min-width: 0;
}

.dg-empty p {
    margin: 0;
}

/* ── Main flow layout ─────────────────────────────────────── */
.dg-flow {
    display: flex;
    flex-direction: column;
    min-width: 0;
}

/* ── Sections ─────────────────────────────────────────────── */
.dg-section {
    background: var(--creator-surface, #fff);
    border: 1px solid var(--creator-surface-border, rgba(88, 35, 173, 0.14));
    border-radius: var(--creator-radius-md, 0.75rem);
    padding: 1.1rem 1.15rem;
    min-width: 0;
}

.dg-section-heading {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--creator-ink-soft, #6b7280);
    margin: 0 0 0.9rem;
}

.dg-section-icon {
    display: inline-flex;
    align-items: center;
    color: rgba(var(--creator-primary-rgb, 95, 34, 201), 0.6);
    flex-shrink: 0;
}

/* ── Selected quest section ───────────────────────────────── */
.dg-section-selected {
    border-color: rgba(var(--creator-primary-rgb, 95, 34, 201), 0.35);
    background: linear-gradient(
        135deg,
        rgba(var(--creator-primary-rgb, 95, 34, 201), 0.06),
        rgba(var(--creator-primary-rgb, 95, 34, 201), 0.02)
    );
    box-shadow:
        0 0 0 3px rgba(var(--creator-primary-rgb, 95, 34, 201), 0.08),
        0 4px 14px rgba(62, 22, 132, 0.1);
}

.dg-selected-meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    min-width: 0;
}

.dg-selected-eyebrow {
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: rgba(var(--creator-primary-rgb, 95, 34, 201), 0.7);
}

.dg-selected-id {
    font-family: var(--creator-mono-font, monospace);
    font-size: 0.9rem;
    font-weight: 700;
    color: rgba(var(--creator-primary-rgb, 95, 34, 201), 1);
    background: rgba(var(--creator-primary-rgb, 95, 34, 201), 0.1);
    padding: 0.1rem 0.5rem;
    border-radius: 999px;
}

.dg-selected-title {
    font-size: 1rem;
    font-weight: 700;
    line-height: 1.35;
    color: var(--creator-ink, #20142f);
    margin: 0 0 0.3rem;
    word-break: break-word;
    min-width: 0;
}

.dg-selected-desc {
    font-size: 0.8rem;
    color: var(--creator-ink-soft, #6b7280);
    margin: 0;
    line-height: 1.5;
    word-break: break-word;
    min-width: 0;
}

/* ── Type badge ───────────────────────────────────────────── */
.dg-type-badge {
    font-size: 0.68rem;
    font-weight: 600;
    padding: 0.15rem 0.5rem;
    border-radius: 999px;
    background: rgba(var(--creator-primary-rgb, 95, 34, 201), 0.08);
    color: rgba(var(--creator-primary-rgb, 95, 34, 201), 0.85);
    border: 1px solid rgba(var(--creator-primary-rgb, 95, 34, 201), 0.18);
    white-space: nowrap;
}

.dg-badge-always {
    background: rgba(5, 150, 105, 0.1);
    color: #047857;
    border-color: rgba(5, 150, 105, 0.28);
}

[data-bs-theme="dark"] .dg-badge-always {
    color: #6ee7b7;
    background: rgba(5, 150, 105, 0.15);
    border-color: rgba(5, 150, 105, 0.35);
}

/* ── Connector between sections ───────────────────────────── */
.dg-connector {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.dg-connector-line {
    width: 2px;
    height: 20px;
    background: linear-gradient(
        to bottom,
        var(--creator-surface-border, rgba(88, 35, 173, 0.16)),
        rgba(var(--creator-primary-rgb, 95, 34, 201), 0.25)
    );
}

.dg-connector-tip {
    font-size: 0.6rem;
    color: rgba(var(--creator-primary-rgb, 95, 34, 201), 0.4);
    line-height: 1;
    margin-top: -1px;
}

/* ── Quest cards (clickable) ──────────────────────────────── */
.dg-quest-card {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    padding: 0.6rem 0.8rem;
    border-radius: var(--creator-radius-sm, 0.5rem);
    border: 1.5px solid;
    background: none;
    text-align: left;
    cursor: pointer;
    transition:
        background 0.15s,
        box-shadow 0.15s,
        border-color 0.15s,
        transform 0.12s;
    flex-shrink: 0;
    max-width: 280px;
    min-width: 0;
}

.dg-quest-card:hover,
.dg-quest-card:focus-visible {
    box-shadow: 0 2px 10px rgba(var(--creator-primary-rgb, 95, 34, 201), 0.15);
    transform: translateY(-1px);
}

.dg-quest-card:focus-visible {
    outline: 2px solid rgba(var(--creator-primary-rgb, 95, 34, 201), 0.6);
    outline-offset: 2px;
}

/* Prerequisite card — cyan/teal */
.dg-quest-card-prereq {
    border-color: #a5f3fc;
    background: #ecfeff;
    color: #164e63;
}

[data-bs-theme="dark"] .dg-quest-card-prereq {
    border-color: #0e7490;
    background: #083344;
    color: #cffafe;
}

.dg-quest-card-prereq:hover,
.dg-quest-card-prereq:focus-visible {
    background: #cffafe;
    border-color: #22d3ee;
}

[data-bs-theme="dark"] .dg-quest-card-prereq:hover,
[data-bs-theme="dark"] .dg-quest-card-prereq:focus-visible {
    background: #0c3f50;
    border-color: #22d3ee;
}

/* Child card — green */
.dg-quest-card-child {
    border-color: #bbf7d0;
    background: #f0fdf4;
    color: #14532d;
}

[data-bs-theme="dark"] .dg-quest-card-child {
    border-color: #166534;
    background: #052e16;
    color: #bbf7d0;
}

.dg-quest-card-child:hover,
.dg-quest-card-child:focus-visible {
    background: #dcfce7;
    border-color: #4ade80;
}

[data-bs-theme="dark"] .dg-quest-card-child:hover,
[data-bs-theme="dark"] .dg-quest-card-child:focus-visible {
    background: #083d1a;
    border-color: #4ade80;
}

/* Missing/incomplete card */
.dg-quest-card-missing {
    border-color: #fca5a5;
    background: #fff1f2;
    color: #7f1d1d;
    cursor: default;
}

[data-bs-theme="dark"] .dg-quest-card-missing {
    border-color: #7f1d1d;
    background: #450a0a;
    color: #fca5a5;
}

/* Card content */
.dg-qc-id {
    font-family: var(--creator-mono-font, monospace);
    font-size: 0.7rem;
    font-weight: 700;
    opacity: 0.65;
}

.dg-qc-title {
    font-size: 0.82rem;
    font-weight: 600;
    line-height: 1.3;
    word-break: break-word;
    min-width: 0;
}

.dg-qc-type {
    font-size: 0.67rem;
    font-weight: 500;
    opacity: 0.6;
}

.dg-qc-note {
    font-size: 0.67rem;
    font-style: italic;
    opacity: 0.65;
    margin-top: 0.1rem;
}

/* ── Always-shown card ────────────────────────────────────── */
.dg-always-card {
    display: flex;
    align-items: flex-start;
    gap: 0.7rem;
    padding: 0.8rem 0.95rem;
    background: rgba(5, 150, 105, 0.07);
    border: 1.5px solid rgba(5, 150, 105, 0.22);
    border-radius: var(--creator-radius-sm, 0.5rem);
    color: #065f46;
    min-width: 0;
}

[data-bs-theme="dark"] .dg-always-card {
    background: rgba(5, 150, 105, 0.1);
    border-color: rgba(5, 150, 105, 0.28);
    color: #6ee7b7;
}

.dg-always-check {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    flex-shrink: 0;
    background: rgba(5, 150, 105, 0.15);
    border-radius: 50%;
    color: #059669;
    margin-top: 0.05rem;
}

.dg-always-card strong {
    display: block;
    font-size: 0.875rem;
    margin-bottom: 0.15rem;
}

.dg-always-sub {
    display: block;
    font-size: 0.77rem;
    opacity: 0.75;
}

/* ── Inline arrow between elements in a row ───────────────── */
.dg-inline-arrow {
    font-size: 1.1rem;
    color: var(--creator-ink-muted, #9ca3af);
    flex-shrink: 0;
    line-height: 1;
    align-self: center;
}

/* ── Single prerequisite row ──────────────────────────────── */
.dg-prereq-single {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    flex-wrap: wrap;
    min-width: 0;
}

/* ── Multiple prerequisites (AND) ─────────────────────────── */
.dg-and-banner {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
    color: var(--creator-ink-soft, #6b7280);
    margin-bottom: 0.8rem;
}

.dg-and-tag {
    font-size: 0.63rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    padding: 0.18rem 0.5rem;
    border-radius: 999px;
    background: #fef3c7;
    color: #92400e;
    border: 1px solid #fcd34d;
    white-space: nowrap;
}

[data-bs-theme="dark"] .dg-and-tag {
    background: #451a03;
    color: #fde68a;
    border-color: #78350f;
}

.dg-prereq-multi-list {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    min-width: 0;
}

.dg-prereq-multi-item {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    flex-wrap: wrap;
    min-width: 0;
}

/* ── Condition group ──────────────────────────────────────── */
.dg-condition-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;
}

.dg-cg-label {
    font-size: 0.66rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--creator-ink-muted, #9ca3af);
}

/* ── Pills ───────────────────────────────────────────────── */
.dg-pills {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.3rem;
}

.dg-pill {
    display: inline-block;
    font-family: var(--creator-mono-font, monospace);
    font-size: 0.74rem;
    font-weight: 600;
    padding: 0.18rem 0.52rem;
    border-radius: 999px;
    white-space: nowrap;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
}

.dg-pill-value {
    background: rgba(var(--creator-primary-rgb, 95, 34, 201), 0.1);
    color: rgba(var(--creator-primary-rgb, 95, 34, 201), 0.9);
    border: 1px solid rgba(var(--creator-primary-rgb, 95, 34, 201), 0.2);
}

[data-bs-theme="dark"] .dg-pill-value {
    background: rgba(var(--creator-primary-rgb, 95, 34, 201), 0.2);
    color: #c4b5fd;
    border-color: rgba(var(--creator-primary-rgb, 95, 34, 201), 0.35);
}

.dg-pill-warning {
    background: rgba(245, 158, 11, 0.12);
    color: #92400e;
    border: 1px solid rgba(245, 158, 11, 0.35);
    font-family: var(--creator-font-family, sans-serif);
}

[data-bs-theme="dark"] .dg-pill-warning {
    background: rgba(245, 158, 11, 0.18);
    color: #fcd34d;
    border-color: rgba(245, 158, 11, 0.45);
}

.dg-pill-or-hint {
    font-size: 0.67rem;
    color: var(--creator-ink-muted, #9ca3af);
    font-style: italic;
}

/* ── None/no-children card ───────────────────────────────── */
.dg-none-card {
    padding: 0.8rem 0.95rem;
    border-radius: var(--creator-radius-sm, 0.5rem);
    border: 1px dashed var(--creator-surface-border, rgba(88, 35, 173, 0.16));
    color: var(--creator-ink-soft, #6b7280);
    font-size: 0.82rem;
    font-style: italic;
    min-width: 0;
}

/* ── Children list ───────────────────────────────────────── */
.dg-children-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    min-width: 0;
}

.dg-child-row {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    flex-wrap: wrap;
    padding-bottom: 0.25rem;
    border-bottom: 1px solid
        var(--creator-surface-border, rgba(88, 35, 173, 0.14));
    min-width: 0;
}

.dg-child-row:last-child {
    padding-bottom: 0;
    border-bottom: none;
}

.dg-child-conditions {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    min-width: 0;
}

.dg-child-and-hint {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.72rem;
    color: var(--creator-ink-soft, #6b7280);
}

/* ── Reduced motion ───────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
    .dg-quest-card {
        transition: none;
    }

    .dg-quest-card:hover,
    .dg-quest-card:focus-visible {
        transform: none;
    }
}

/* ── Responsive ──────────────────────────────────────────── */
@media (max-width: 560px) {
    .dg-prereq-single,
    .dg-prereq-multi-item,
    .dg-child-row {
        flex-direction: column;
        align-items: flex-start;
    }

    .dg-inline-arrow {
        transform: rotate(90deg);
        align-self: flex-start;
        margin-left: 0.5rem;
    }

    .dg-quest-card {
        max-width: 100%;
        width: 100%;
    }
}
</style>
