<!-- @format -->

<script setup>
import { computed, nextTick, ref, watch } from "vue";
import { useQuestStore } from "../stores/questStore";
import {
    inferElementCategories,
    questPresetLibrary,
} from "../assets/questTemplates";
import QuestEditor from "./QuestEditor.vue";
import DependencyGraph from "./DependencyGraph.vue";

const props = defineProps({
    elementIndex: { type: Number, required: true },
});

const store = useQuestStore();
const addQuestButton = ref(null);
const questButtons = ref([]);
const openQuestIndex = computed(() => store.selectedQuestIndex);
const showDepGraph = ref(false);

const element = computed(
    () => store.definition.elements[props.elementIndex] ?? null
);
const quests = computed(() => element.value?.quests || []);
const compatibleQuestPresets = computed(() => {
    const categories = inferElementCategories(element.value?.element_type);
    if (categories.size === 0) {
        return [];
    }

    return questPresetLibrary.filter((preset) =>
        preset.elementCategories.some((category) => categories.has(category))
    );
});
const questPresetHint = computed(() => {
    if (!element.value?.element_type?.trim()) {
        return "Choose an element preset or enter an element type to unlock matching quest presets.";
    }

    if (compatibleQuestPresets.value.length === 0) {
        return "No quest presets are configured yet for this element type.";
    }

    return `Preset questions available for ${element.value.element_type}.`;
});
const hasQuestPresets = computed(() => compatibleQuestPresets.value.length > 0);
const depGraphToggleLabel = computed(() =>
    showDepGraph.value ? "Hide dependency graph" : "Show dependency graph"
);

watch(
    quests,
    (next) => {
        if (next.length === 0) {
            showDepGraph.value = false;
            store.selectQuest(null);
            return;
        }

        if (
            openQuestIndex.value === null ||
            openQuestIndex.value >= next.length
        ) {
            showDepGraph.value = false;
            store.selectQuest(0);
        }
    },
    { immediate: true }
);

watch(openQuestIndex, (questIndex) => {
    if (questIndex == null) {
        showDepGraph.value = false;
    }
});

function setQuestButtonRef(elementRef, questIndex) {
    if (elementRef) {
        questButtons.value[questIndex] = elementRef;
        return;
    }

    delete questButtons.value[questIndex];
}

function focusQuest(questIndex) {
    nextTick(() => {
        if (questIndex == null) {
            addQuestButton.value?.focus();
            return;
        }

        questButtons.value[questIndex]?.focus();
    });
}

function addQuest() {
    store.addQuest(props.elementIndex);
    focusQuest(store.selectedQuestIndex);
}

function insertSingleQuest(templateQuest) {
    store.insertSingleQuestTemplate(props.elementIndex, templateQuest);
    focusQuest(store.selectedQuestIndex);
}

function insertQuestPreset(questPreset) {
    store.insertQuestPreset(props.elementIndex, questPreset);
    focusQuest(store.selectedQuestIndex);
}

function removeQuest(questIndex) {
    store.removeQuest(props.elementIndex, questIndex);
    focusQuest(store.selectedQuestIndex);
}

function moveQuestUp(questIndex) {
    if (questIndex === 0) {
        return;
    }

    store.moveQuestUp(props.elementIndex, questIndex);
    focusQuest(questIndex - 1);
}

function moveQuestDown(questIndex) {
    if (questIndex >= quests.value.length - 1) {
        return;
    }

    store.moveQuestDown(props.elementIndex, questIndex);
    focusQuest(questIndex + 1);
}

function toggleQuest(questIndex) {
    store.selectQuest(openQuestIndex.value === questIndex ? null : questIndex);
}
</script>

<template>
    <section class="creator-quest-section mt-3 pt-2 border-top">
        <div
            class="d-flex align-items-center justify-content-between mb-2 gap-2 flex-wrap"
        >
            <h3 class="h6 mb-0 fw-semibold">Quests</h3>

            <div class="d-flex gap-2 flex-wrap justify-content-end">
                <button
                    ref="addQuestButton"
                    type="button"
                    class="btn btn-sm btn-primary creator-add-button creator-add-button-inline"
                    @click="addQuest"
                    aria-label="Add quest"
                >
                    <span class="creator-button-plus" aria-hidden="true"
                        >+</span
                    >
                    <span>Add Quest</span>
                </button>

                <div class="dropdown">
                    <button
                        type="button"
                        class="btn btn-sm btn-outline-primary dropdown-toggle"
                        data-bs-toggle="dropdown"
                        data-bs-display="static"
                        aria-expanded="false"
                        :disabled="!hasQuestPresets"
                    >
                        Quest Presets
                    </button>

                    <ul
                        v-if="hasQuestPresets"
                        class="dropdown-menu dropdown-menu-end quest-template-menu"
                    >
                        <li>
                            <h6 class="dropdown-header">Compatible presets</h6>
                        </li>

                        <template
                            v-for="(questPreset, pi) in compatibleQuestPresets"
                            :key="questPreset.id"
                        >
                            <li v-if="pi > 0">
                                <hr class="dropdown-divider my-1" />
                            </li>
                            <li>
                                <span
                                    class="dropdown-header py-1 fw-semibold"
                                    >{{ questPreset.label }}</span
                                >
                            </li>
                            <li
                                v-for="templateQuest in questPreset.quests"
                                :key="templateQuest.template_quest_id"
                            >
                                <button
                                    type="button"
                                    class="dropdown-item small"
                                    @click="insertSingleQuest(templateQuest)"
                                >
                                    {{ templateQuest.quest_title }}
                                </button>
                            </li>
                        </template>
                    </ul>
                </div>
            </div>
        </div>

        <p class="small text-muted mb-3">{{ questPresetHint }}</p>

        <div
            v-if="quests.length === 0"
            class="creator-empty-subpanel text-muted small fst-italic border rounded p-3"
        >
            No quests yet. Add one manually or apply a matching quest preset.
        </div>

        <div v-else class="accordion" :id="`quest-accordion-${elementIndex}`">
            <template
                v-for="(quest, questIndex) in quests"
                :key="`q-${quest.quest_id}-${questIndex}`"
            >
            <div
                class="accordion-item"
            >
                <h4 class="accordion-header">
                    <button
                        :ref="
                            (elementRef) =>
                                setQuestButtonRef(elementRef, questIndex)
                        "
                        class="accordion-button py-2 px-3 small"
                        :class="{ collapsed: openQuestIndex !== questIndex }"
                        type="button"
                        :aria-expanded="openQuestIndex === questIndex"
                        :aria-controls="`quest-panel-${elementIndex}-${questIndex}`"
                        @click="toggleQuest(questIndex)"
                    >
                        <span class="me-2 fw-semibold"
                            >#{{ quest.quest_id }}</span
                        >
                        <span>{{
                            quest.quest_title || "(untitled quest)"
                        }}</span>
                    </button>
                </h4>

                <div
                    v-show="openQuestIndex === questIndex"
                    :id="`quest-panel-${elementIndex}-${questIndex}`"
                    class="accordion-collapse show"
                >
                    <div class="accordion-body">
                        <div
                            class="d-flex gap-1 justify-content-end mb-2 flex-wrap"
                        >
                            <button
                                type="button"
                                class="btn btn-sm btn-outline-secondary py-1 px-2"
                                :disabled="questIndex === 0"
                                aria-label="Move quest up"
                                @click="moveQuestUp(questIndex)"
                            >
                                Move Up
                            </button>
                            <button
                                type="button"
                                class="btn btn-sm btn-outline-secondary py-1 px-2"
                                :disabled="questIndex === quests.length - 1"
                                aria-label="Move quest down"
                                @click="moveQuestDown(questIndex)"
                            >
                                Move Down
                            </button>
                            <button
                                type="button"
                                class="btn btn-sm btn-outline-secondary py-1 px-2"
                                :class="{ active: showDepGraph }"
                                :aria-expanded="showDepGraph"
                                :aria-controls="`dep-graph-${elementIndex}-${questIndex}`"
                                :aria-label="depGraphToggleLabel"
                                @click="showDepGraph = !showDepGraph"
                            >
                                <svg
                                    aria-hidden="true"
                                    viewBox="0 0 16 16"
                                    width="12"
                                    height="12"
                                    class="ql-dep-toggle-icon"
                                    :class="{ 'ql-dep-toggle-icon-open': showDepGraph }"
                                >
                                    <path fill="currentColor" d="M2 5l6 6 6-6H2z" />
                                </svg>
                                Dependencies
                            </button>
                            <button
                                type="button"
                                class="btn btn-sm btn-outline-danger py-1 px-2"
                                aria-label="Delete quest"
                                @click="removeQuest(questIndex)"
                            >
                                Delete
                            </button>
                        </div>

                        <QuestEditor
                            :element-index="elementIndex"
                            :quest-index="questIndex"
                        />
                    </div>
                </div>
            </div>

            <!-- Inline dependency view, rendered below the open quest -->
            <div
                v-if="openQuestIndex === questIndex && showDepGraph"
                :id="`dep-graph-${elementIndex}-${questIndex}`"
                class="ql-dep-panel"
                role="region"
                :aria-label="`Dependency relationships for quest #${quest.quest_id}`"
            >
                <div class="ql-dep-panel-header">
                    <span class="ql-dep-panel-label">
                        Dependency chain for <strong>#{{ quest.quest_id }}</strong>
                    </span>
                    <button
                        type="button"
                        class="ql-dep-panel-close"
                        aria-label="Close dependency view"
                        @click="showDepGraph = false"
                    >✕</button>
                </div>
                <div class="ql-dep-panel-body">
                    <DependencyGraph :element-index="elementIndex" />
                </div>
            </div>
            </template>
        </div>
    </section>
</template>

<style scoped>
.quest-template-menu {
    min-width: 20rem;
}

/* ── Inline dependency panel ──────────────────────────────── */
.ql-dep-panel {
    border: 1px solid var(--creator-surface-border, rgba(88, 35, 173, 0.18));
    border-top: 3px solid rgba(var(--creator-primary-rgb, 95, 34, 201), 0.35);
    border-radius: 0 0 var(--creator-radius-md, 0.75rem) var(--creator-radius-md, 0.75rem);
    margin-top: -1px;
    background: linear-gradient(
        180deg,
        rgba(var(--creator-primary-rgb, 95, 34, 201), 0.035),
        var(--creator-canvas, #f8f5ff)
    );
    overflow: hidden;
    animation: ql-dep-slide-in 0.18s ease;
}

@keyframes ql-dep-slide-in {
    from {
        opacity: 0;
        transform: translateY(-6px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.ql-dep-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.55rem 0.85rem;
    background: rgba(var(--creator-primary-rgb, 95, 34, 201), 0.06);
    border-bottom: 1px solid rgba(var(--creator-primary-rgb, 95, 34, 201), 0.1);
}

.ql-dep-panel-label {
    font-size: 0.78rem;
    color: var(--creator-ink-soft, #6b7280);
}

.ql-dep-panel-label strong {
    font-family: var(--creator-mono-font, monospace);
    color: rgba(var(--creator-primary-rgb, 95, 34, 201), 0.9);
}

.ql-dep-panel-close {
    background: none;
    border: none;
    padding: 0.15rem 0.45rem;
    border-radius: var(--creator-radius-sm, 0.375rem);
    font-size: 0.8rem;
    line-height: 1;
    color: var(--creator-ink-muted, #9ca3af);
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
}

.ql-dep-panel-close:hover {
    background: rgba(var(--creator-primary-rgb, 95, 34, 201), 0.1);
    color: var(--creator-ink, #20142f);
}

.ql-dep-panel-close:focus-visible {
    outline: 2px solid rgba(var(--creator-primary-rgb, 95, 34, 201), 0.6);
    outline-offset: 2px;
}

.ql-dep-toggle-icon {
    margin-right: 4px;
    vertical-align: -1px;
    transition: transform 0.2s;
}

.ql-dep-toggle-icon-open {
    transform: rotate(180deg);
}

.ql-dep-panel-body {
    padding: 1rem 1rem 1.15rem;
}

@media (prefers-reduced-motion: reduce) {
    .ql-dep-panel {
        animation: none;
    }

    .ql-dep-toggle-icon {
        transition: none;
    }
}
</style>
