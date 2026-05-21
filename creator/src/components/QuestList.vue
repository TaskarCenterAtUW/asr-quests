<!-- @format -->

<script setup>
import { computed, nextTick, ref, watch } from "vue";
import { useQuestStore } from "../stores/questStore";
import {
    inferElementCategories,
    questPresetLibrary,
} from "../assets/questTemplates";
import QuestEditor from "./QuestEditor.vue";

const props = defineProps({
    elementIndex: { type: Number, required: true },
});

const store = useQuestStore();
const addQuestButton = ref(null);
const questButtons = ref([]);
const openQuestIndex = computed(() => store.selectedQuestIndex);

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

watch(
    quests,
    (next) => {
        if (next.length === 0) {
            store.selectQuest(null);
            return;
        }

        if (
            openQuestIndex.value === null ||
            openQuestIndex.value >= next.length
        ) {
            store.selectQuest(0);
        }
    },
    { immediate: true }
);

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
            <div
                v-for="(quest, questIndex) in quests"
                :key="`q-${quest.quest_id}-${questIndex}`"
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
        </div>
    </section>
</template>

<style scoped>
.quest-template-menu {
    min-width: 20rem;
}
</style>
