<!-- @format -->

<script setup>
import { computed, ref, watch } from "vue";
import { useQuestStore } from "../stores/questStore";
import QuestEditor from "./QuestEditor.vue";

const props = defineProps({
    elementIndex: { type: Number, required: true },
});

const store = useQuestStore();
const openQuestIndex = ref(null);

const quests = computed(
    () => store.definition.elements[props.elementIndex]?.quests || []
);

watch(
    quests,
    (next) => {
        if (next.length === 0) {
            openQuestIndex.value = null;
            return;
        }
        if (
            openQuestIndex.value === null ||
            openQuestIndex.value >= next.length
        ) {
            openQuestIndex.value = 0;
        }
    },
    { immediate: true }
);

function addQuest() {
    store.addQuest(props.elementIndex);
    openQuestIndex.value = quests.value.length - 1;
}

function removeQuest(questIndex) {
    store.removeQuest(props.elementIndex, questIndex);
    if (quests.value.length === 0) {
        openQuestIndex.value = null;
    } else {
        openQuestIndex.value = Math.min(questIndex, quests.value.length - 1);
    }
}

function moveQuestUp(questIndex) {
    store.moveQuestUp(props.elementIndex, questIndex);
    openQuestIndex.value = questIndex - 1;
}

function moveQuestDown(questIndex) {
    store.moveQuestDown(props.elementIndex, questIndex);
    openQuestIndex.value = questIndex + 1;
}
</script>

<template>
    <section class="mt-3 pt-2 border-top">
        <div class="d-flex align-items-center justify-content-between mb-2">
            <h3 class="h6 mb-0 fw-semibold">Quests</h3>
            <button
                type="button"
                class="btn btn-sm btn-primary py-1 px-2"
                @click="addQuest"
                aria-label="Add quest"
            >
                + Add Quest
            </button>
        </div>

        <div
            v-if="quests.length === 0"
            class="text-muted small fst-italic border rounded p-2"
        >
            No quests yet. Add one to define prompts for this element.
        </div>

        <div v-else class="accordion" :id="`quest-accordion-${elementIndex}`">
            <div
                v-for="(quest, questIndex) in quests"
                :key="`q-${quest.quest_id}-${questIndex}`"
                class="accordion-item"
            >
                <h4 class="accordion-header">
                    <button
                        class="accordion-button py-2 px-3 small"
                        :class="{ collapsed: openQuestIndex !== questIndex }"
                        type="button"
                        :aria-expanded="openQuestIndex === questIndex"
                        :aria-controls="`quest-panel-${elementIndex}-${questIndex}`"
                        @click="openQuestIndex = openQuestIndex === questIndex ? null : questIndex"
                    >
                        <span class="me-2 fw-semibold">#{{ quest.quest_id }}</span>
                        <span>{{ quest.quest_title || "(untitled quest)" }}</span>
                    </button>
                </h4>

                <div
                    v-show="openQuestIndex === questIndex"
                    :id="`quest-panel-${elementIndex}-${questIndex}`"
                    class="accordion-collapse show"
                >
                    <div class="accordion-body">
                        <div class="d-flex gap-1 justify-content-end mb-2">
                            <button
                                type="button"
                                class="btn btn-sm btn-outline-secondary py-1 px-2"
                                :disabled="questIndex === 0"
                                aria-label="Move quest up"
                                @click="moveQuestUp(questIndex)"
                            >
                                ↑
                            </button>
                            <button
                                type="button"
                                class="btn btn-sm btn-outline-secondary py-1 px-2"
                                :disabled="questIndex === quests.length - 1"
                                aria-label="Move quest down"
                                @click="moveQuestDown(questIndex)"
                            >
                                ↓
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
