<!-- @format -->

<script setup>
import { computed, nextTick, ref } from "vue";
import { useQuestStore } from "../stores/questStore";
import { useDragReorder } from "../composables/useDragReorder";
import ChoiceEditor from "./ChoiceEditor.vue";

const props = defineProps({
    elementIndex: { type: Number, required: true },
    questIndex: { type: Number, required: true },
});

const store = useQuestStore();
const addChoiceButton = ref(null);
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
        store.moveChoiceTo(
            props.elementIndex,
            props.questIndex,
            fromIndex,
            toIndex
        );
        reorderAnnouncement.value = `Choice moved to position ${toIndex + 1} of ${quest.value?.quest_answer_choices.length ?? 0}.`;
        focusChoiceField(toIndex);
    })()
);

const quest = computed(
    () =>
        store.definition.elements[props.elementIndex]?.quests[props.questIndex]
);

function focusChoiceField(choiceIndex) {
    nextTick(() => {
        if (choiceIndex == null) {
            addChoiceButton.value?.focus();
            return;
        }

        document
            .getElementById(
                `choice-value-${props.elementIndex}-${props.questIndex}-${choiceIndex}`
            )
            ?.focus();
    });
}

function addChoice() {
    store.addChoice(props.elementIndex, props.questIndex);
    focusChoiceField((quest.value?.quest_answer_choices.length ?? 1) - 1);
}

function removeChoice(choiceIndex) {
    store.removeChoice(props.elementIndex, props.questIndex, choiceIndex);
    const nextLength = quest.value?.quest_answer_choices.length ?? 0;
    focusChoiceField(
        nextLength > 0 ? Math.min(choiceIndex, nextLength - 1) : null
    );
}

function moveChoiceUp(choiceIndex) {
    if (choiceIndex === 0) return;
    store.moveChoiceUp(props.elementIndex, props.questIndex, choiceIndex);
    focusChoiceField(choiceIndex - 1);
}

function moveChoiceDown(choiceIndex) {
    if (choiceIndex >= (quest.value?.quest_answer_choices.length ?? 0) - 1)
        return;
    store.moveChoiceDown(props.elementIndex, props.questIndex, choiceIndex);
    focusChoiceField(choiceIndex + 1);
}
</script>

<template>
    <section
        v-if="
            quest &&
            (quest.quest_type === 'ExclusiveChoice' ||
                quest.quest_type === 'MultipleChoice')
        "
        class="col-12 mt-3 pt-2 border-top"
    >
        <div class="visually-hidden" aria-live="polite">
            {{ reorderAnnouncement }}
        </div>
        <div class="d-flex align-items-center justify-content-between mb-2">
            <h3 class="h6 mb-0 fw-semibold">Answer Choices</h3>
            <button
                ref="addChoiceButton"
                type="button"
                class="btn btn-sm btn-primary"
                @click="addChoice"
            >
                + Add Choice
            </button>
        </div>

        <div
            v-if="quest.quest_answer_choices.length === 0"
            class="text-muted small fst-italic border rounded p-3"
        >
            No choices yet. Add one for this quest type.
        </div>

        <div v-else class="d-grid gap-2">
            <div
                v-for="(choice, choiceIndex) in quest.quest_answer_choices"
                :key="choice"
                :class="{
                    'creator-dragging': draggingIndex === choiceIndex,
                    'creator-drag-over': overIndex === choiceIndex,
                    'creator-drag-over-before':
                        overIndex === choiceIndex && overBefore,
                    'creator-drag-over-after':
                        overIndex === choiceIndex && !overBefore,
                }"
                @dragover="handleDragOver(choiceIndex, $event)"
                @dragleave="handleDragLeave($event)"
                @drop="handleDrop(choiceIndex, $event)"
            >
                <div class="d-flex justify-content-end gap-1 mb-1">
                    <span
                        class="creator-drag-handle me-auto"
                        aria-hidden="true"
                        title="Drag to reorder"
                        draggable="true"
                        @dragstart.stop="startDrag(choiceIndex, $event)"
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
                    <button
                        type="button"
                        class="btn btn-sm btn-outline-secondary"
                        :disabled="choiceIndex === 0"
                        :aria-label="`Move choice ${choiceIndex + 1} up`"
                        @click="moveChoiceUp(choiceIndex)"
                    >
                        ↑
                    </button>
                    <button
                        type="button"
                        class="btn btn-sm btn-outline-secondary"
                        :disabled="
                            choiceIndex ===
                            quest.quest_answer_choices.length - 1
                        "
                        :aria-label="`Move choice ${choiceIndex + 1} down`"
                        @click="moveChoiceDown(choiceIndex)"
                    >
                        ↓
                    </button>
                    <button
                        type="button"
                        class="btn btn-sm btn-outline-danger"
                        aria-label="Delete choice"
                        @click="removeChoice(choiceIndex)"
                    >
                        Delete
                    </button>
                </div>
                <ChoiceEditor
                    :element-index="elementIndex"
                    :quest-index="questIndex"
                    :choice-index="choiceIndex"
                />
            </div>
        </div>
    </section>
</template>
