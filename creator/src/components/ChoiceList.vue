<!-- @format -->

<script setup>
import { computed } from "vue";
import { useQuestStore } from "../stores/questStore";
import ChoiceEditor from "./ChoiceEditor.vue";

const props = defineProps({
    elementIndex: { type: Number, required: true },
    questIndex: { type: Number, required: true },
});

const store = useQuestStore();

const quest = computed(
    () => store.definition.elements[props.elementIndex]?.quests[props.questIndex]
);

function addChoice() {
    store.addChoice(props.elementIndex, props.questIndex);
}

function removeChoice(choiceIndex) {
    store.removeChoice(props.elementIndex, props.questIndex, choiceIndex);
}

function moveChoiceUp(choiceIndex) {
    store.moveChoiceUp(props.elementIndex, props.questIndex, choiceIndex);
}

function moveChoiceDown(choiceIndex) {
    store.moveChoiceDown(props.elementIndex, props.questIndex, choiceIndex);
}
</script>

<template>
    <section v-if="quest && (quest.quest_type === 'ExclusiveChoice' || quest.quest_type === 'MultipleChoice')" class="col-12 mt-3 pt-2 border-top">
        <div class="d-flex align-items-center justify-content-between mb-2">
            <h3 class="h6 mb-0 fw-semibold">Answer Choices</h3>
            <button type="button" class="btn btn-sm btn-primary" @click="addChoice">
                + Add Choice
            </button>
        </div>

        <div v-if="quest.quest_answer_choices.length === 0" class="text-muted small fst-italic border rounded p-3">
            No choices yet. Add one for this quest type.
        </div>

        <div v-else class="d-grid gap-2">
            <div v-for="(choice, choiceIndex) in quest.quest_answer_choices" :key="`choice-${quest.quest_id}-${choiceIndex}`">
                <div class="d-flex justify-content-end gap-1 mb-1">
                    <button type="button" class="btn btn-sm btn-outline-secondary" :disabled="choiceIndex === 0" aria-label="Move choice up" @click="moveChoiceUp(choiceIndex)">↑</button>
                    <button type="button" class="btn btn-sm btn-outline-secondary" :disabled="choiceIndex === quest.quest_answer_choices.length - 1" aria-label="Move choice down" @click="moveChoiceDown(choiceIndex)">↓</button>
                    <button type="button" class="btn btn-sm btn-outline-danger" aria-label="Delete choice" @click="removeChoice(choiceIndex)">Delete</button>
                </div>
                <ChoiceEditor :element-index="elementIndex" :quest-index="questIndex" :choice-index="choiceIndex" />
            </div>
        </div>
    </section>
</template>
