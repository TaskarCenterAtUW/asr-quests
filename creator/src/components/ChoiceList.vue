<!-- @format -->

<script setup>
import { computed, nextTick, ref } from "vue";
import { useQuestStore } from "../stores/questStore";
import ChoiceEditor from "./ChoiceEditor.vue";

const props = defineProps({
    elementIndex: { type: Number, required: true },
    questIndex: { type: Number, required: true },
});

const store = useQuestStore();
const addChoiceButton = ref(null);

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
                :key="`choice-${quest.quest_id}-${choiceIndex}`"
            >
                <div class="d-flex justify-content-end gap-1 mb-1">
                    <button
                        type="button"
                        class="btn btn-sm btn-outline-secondary"
                        :disabled="choiceIndex === 0"
                        aria-label="Move choice up"
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
                        aria-label="Move choice down"
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
