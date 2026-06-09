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
const dependencyModeName = computed(
    () => `dependency-mode-${props.elementIndex}-${props.questIndex}`
);

const siblingQuests = computed(() => {
    const element = store.definition.elements[props.elementIndex];
    if (!element) return [];
    return element.quests
        .map((siblingQuest, index) => ({
            ...siblingQuest,
            _index: index,
        }))
        .filter((siblingQuest) => siblingQuest._index !== props.questIndex);
});

const hasSiblingQuests = computed(() => siblingQuests.value.length > 0);

const dependencyMode = computed(() => {
    const deps = quest.value?._deps || [];
    if (deps.length === 0) return "none";
    if (deps.length === 1) return "single";
    return "multiple";
});

function updateDeps(nextDeps) {
    store.updateQuest(props.elementIndex, props.questIndex, {
        _deps: nextDeps,
    });
}

function createBlankDependency() {
    return { question_id: null, required_value: "" };
}

function getQuestById(questionId) {
    return (
        siblingQuests.value.find(
            (siblingQuest) => siblingQuest.quest_id === questionId
        ) || null
    );
}

function isChoiceQuest(questType) {
    return questType === "ExclusiveChoice" || questType === "MultipleChoice";
}

function normalizeRequiredValueForParent(parentQuest) {
    return parentQuest && isChoiceQuest(parentQuest.quest_type) ? [] : "";
}

function setMode(mode) {
    const currentDeps = quest.value?._deps || [];

    if (mode === "none") {
        updateDeps([]);
        return;
    }

    if (mode === "single") {
        const firstDependency = currentDeps[0]
            ? { ...currentDeps[0] }
            : createBlankDependency();
        updateDeps([firstDependency]);
        return;
    }

    if (currentDeps.length >= 2) {
        updateDeps(currentDeps.map((dependency) => ({ ...dependency })));
        return;
    }

    const nextDeps =
        currentDeps.length === 1
            ? [{ ...currentDeps[0] }, createBlankDependency()]
            : [createBlankDependency(), createBlankDependency()];
    updateDeps(nextDeps);
}

function addCondition() {
    const currentDeps = quest.value?._deps || [];
    updateDeps([
        ...currentDeps.map((dependency) => ({ ...dependency })),
        createBlankDependency(),
    ]);
}

function removeCondition(dependencyIndex) {
    const currentDeps = quest.value?._deps || [];
    updateDeps(currentDeps.filter((_, index) => index !== dependencyIndex));
}

function updateDependencyQuestion(dependencyIndex, questionId) {
    const currentDeps = quest.value?._deps || [];
    const parsedQuestionId = Number(questionId);
    const nextQuestionId =
        Number.isInteger(parsedQuestionId) && parsedQuestionId > 0
            ? parsedQuestionId
            : null;
    const parentQuest = getQuestById(nextQuestionId);
    const nextDependencies = currentDeps.map((dependency, index) => {
        if (index !== dependencyIndex) return { ...dependency };
        return {
            question_id: nextQuestionId,
            required_value: normalizeRequiredValueForParent(parentQuest),
        };
    });
    updateDeps(nextDependencies);
}

function dependencyQuestionPath(dependencyIndex) {
    return `${questBase.value}/quest_answer_dependency${quest.value?._deps?.length > 1 ? `[${dependencyIndex}]` : ""}/question_id`;
}

function dependencyRequiredValuePath(dependencyIndex) {
    return `${questBase.value}/quest_answer_dependency${quest.value?._deps?.length > 1 ? `[${dependencyIndex}]` : ""}/required_value`;
}

function choiceRequiredValuePath(dependencyIndex) {
    return dependencyRequiredValuePath(dependencyIndex);
}

function updateTextRequiredValue(dependencyIndex, requiredValue) {
    const currentDeps = quest.value?._deps || [];
    const nextDependencies = currentDeps.map((dependency, index) =>
        index === dependencyIndex
            ? { ...dependency, required_value: requiredValue }
            : { ...dependency }
    );
    updateDeps(nextDependencies);
}

function toggleChoiceRequiredValue(dependencyIndex, choiceValue, enabled) {
    const currentDeps = quest.value?._deps || [];
    const nextDependencies = currentDeps.map((dependency, index) => {
        if (index !== dependencyIndex) return { ...dependency };
        const currentValues = Array.isArray(dependency.required_value)
            ? [...dependency.required_value]
            : dependency.required_value
              ? [dependency.required_value]
              : [];

        const nextValues = enabled
            ? Array.from(new Set([...currentValues, choiceValue]))
            : currentValues.filter((value) => value !== choiceValue);

        return { ...dependency, required_value: nextValues };
    });
    updateDeps(nextDependencies);
}

function isChoiceChecked(dependency, choiceValue) {
    if (Array.isArray(dependency.required_value)) {
        return dependency.required_value.includes(choiceValue);
    }
    return dependency.required_value === choiceValue;
}
</script>

<template>
    <section class="col-12 mt-3 pt-2 border-top">
        <div class="d-flex align-items-center justify-content-between mb-2">
            <h3 class="h6 mb-0 fw-semibold">Dependency</h3>
        </div>

        <div
            class="btn-group btn-group-sm mb-2"
            role="group"
            aria-label="Dependency mode"
        >
            <input
                :id="`dependency-none-${elementIndex}-${questIndex}`"
                type="radio"
                class="btn-check"
                :name="dependencyModeName"
                autocomplete="off"
                :checked="dependencyMode === 'none'"
                @change="setMode('none')"
            />
            <label
                class="btn btn-outline-secondary"
                :for="`dependency-none-${elementIndex}-${questIndex}`"
                >None</label
            >

            <input
                :id="`dependency-single-${elementIndex}-${questIndex}`"
                type="radio"
                class="btn-check"
                :name="dependencyModeName"
                autocomplete="off"
                :checked="dependencyMode === 'single'"
                @change="setMode('single')"
            />
            <label
                class="btn btn-outline-secondary"
                :for="`dependency-single-${elementIndex}-${questIndex}`"
                >Single</label
            >

            <input
                :id="`dependency-multiple-${elementIndex}-${questIndex}`"
                type="radio"
                class="btn-check"
                :name="dependencyModeName"
                autocomplete="off"
                :checked="dependencyMode === 'multiple'"
                @change="setMode('multiple')"
            />
            <label
                class="btn btn-outline-secondary"
                :for="`dependency-multiple-${elementIndex}-${questIndex}`"
                >Multiple (AND)</label
            >
        </div>

        <div v-if="!hasSiblingQuests" class="form-text small mb-2">
            Add another quest in this element before creating a dependency.
        </div>

        <div v-if="dependencyMode !== 'none'" class="d-grid gap-2">
            <div
                v-for="(dependency, dependencyIndex) in quest._deps"
                :key="`dependency-${dependencyIndex}`"
                class="border rounded p-2 bg-body-tertiary"
            >
                <div
                    class="d-flex justify-content-between align-items-center gap-2 mb-2"
                >
                    <div class="fw-semibold small">
                        Condition {{ dependencyIndex + 1 }}
                    </div>
                    <button
                        v-if="dependencyMode === 'multiple'"
                        type="button"
                        class="btn btn-sm btn-outline-danger py-0 px-2"
                        @click="removeCondition(dependencyIndex)"
                    >
                        Remove
                    </button>
                </div>

                <div class="row g-2">
                    <div class="col-md-6">
                        <label
                            :for="`dependency-question-${elementIndex}-${questIndex}-${dependencyIndex}`"
                            class="form-label small mb-1"
                        >
                            Dependent Question
                        </label>
                        <select
                            :id="`dependency-question-${elementIndex}-${questIndex}-${dependencyIndex}`"
                            class="form-select form-select-sm"
                            :value="dependency.question_id ?? ''"
                            :class="{
                                'is-invalid': store.hasValidationError(
                                    dependencyQuestionPath(dependencyIndex)
                                ),
                            }"
                            @change="
                                updateDependencyQuestion(
                                    dependencyIndex,
                                    $event.target.value
                                )
                            "
                        >
                            <option value="">Select a sibling quest</option>
                            <option
                                v-for="siblingQuest in siblingQuests"
                                :key="siblingQuest.quest_id"
                                :value="siblingQuest.quest_id"
                            >
                                #{{ siblingQuest.quest_id }} —
                                {{
                                    siblingQuest.quest_title ||
                                    "(untitled quest)"
                                }}
                            </option>
                        </select>
                    </div>

                    <div class="col-md-6">
                        <label class="form-label small mb-1"
                            >Required Value</label
                        >

                        <div
                            v-if="dependency.question_id == null"
                            class="form-text small border rounded p-2 bg-body-tertiary"
                        >
                            Select a dependent question above to define the
                            required value.
                        </div>

                        <div
                            v-else-if="
                                isChoiceQuest(
                                    getQuestById(dependency.question_id)
                                        ?.quest_type
                                )
                            "
                            class="d-grid gap-1"
                        >
                            <div
                                v-if="
                                    (
                                        getQuestById(dependency.question_id)
                                            ?.quest_answer_choices || []
                                    ).length === 0
                                "
                                class="form-text small border rounded p-2 bg-body-tertiary"
                            >
                                Add answer choices to the dependent question
                                before selecting required values.
                            </div>

                            <div
                                v-for="choice in getQuestById(
                                    dependency.question_id
                                )?.quest_answer_choices || []"
                                :key="choice.value"
                                class="form-check form-check-sm"
                            >
                                <input
                                    :id="`dependency-choice-${elementIndex}-${questIndex}-${dependencyIndex}-${choice.value}`"
                                    class="form-check-input"
                                    type="checkbox"
                                    :checked="
                                        isChoiceChecked(
                                            dependency,
                                            choice.value
                                        )
                                    "
                                    :class="{
                                        'is-invalid': store.hasValidationError(
                                            choiceRequiredValuePath(
                                                dependencyIndex
                                            )
                                        ),
                                    }"
                                    @change="
                                        toggleChoiceRequiredValue(
                                            dependencyIndex,
                                            choice.value,
                                            $event.target.checked
                                        )
                                    "
                                />
                                <label
                                    class="form-check-label small"
                                    :for="`dependency-choice-${elementIndex}-${questIndex}-${dependencyIndex}-${choice.value}`"
                                >
                                    {{ choice.choice_text }}
                                    <span class="text-muted"
                                        >({{ choice.value }})</span
                                    >
                                </label>
                            </div>
                        </div>

                        <input
                            v-else
                            :id="`dependency-value-${elementIndex}-${questIndex}-${dependencyIndex}`"
                            type="text"
                            class="form-control form-control-sm"
                            :value="
                                Array.isArray(dependency.required_value)
                                    ? dependency.required_value.join('; ')
                                    : dependency.required_value
                            "
                            placeholder="Enter the value that makes this quest visible"
                            :class="{
                                'is-invalid': store.hasValidationError(
                                    dependencyRequiredValuePath(dependencyIndex)
                                ),
                            }"
                            @input="
                                updateTextRequiredValue(
                                    dependencyIndex,
                                    $event.target.value
                                )
                            "
                        />
                    </div>
                </div>
            </div>

            <div
                v-if="dependencyMode === 'multiple'"
                class="d-flex justify-content-start"
            >
                <button
                    type="button"
                    class="btn btn-sm btn-outline-primary py-1 px-2"
                    @click="addCondition"
                >
                    + Add condition
                </button>
            </div>
        </div>
    </section>
</template>

<style scoped>
.btn-group .btn {
    display: inline-flex;
    align-items: center;
    text-align: center;
    justify-content: center;
}
</style>
