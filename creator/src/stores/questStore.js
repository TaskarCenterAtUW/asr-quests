/** @format */

import { defineStore } from "pinia";
import { computed, ref } from "vue";
import Ajv from "ajv";
import schema from "../assets/schema.json";

// AJV instance compiled once at module load
const ajv = new Ajv({ allErrors: true, strict: false });
const validate = ajv.compile(schema);

// ─── Internal factory helpers ──────────────────────────────────────────────

function newChoice() {
  return { value: "", choice_text: "", image_url: "", choice_follow_up: "" };
}

/**
 * quest_id formula: (elementIndex + 1) * 100 + questIndex + 1
 * e.g. element 0, quest 0 → 101; element 1, quest 2 → 203
 */
function newQuest(elementIndex, questIndex) {
  return {
    quest_id: (elementIndex + 1) * 100 + questIndex + 1,
    quest_title: "",
    quest_description: "",
    quest_type: "ExclusiveChoice",
    quest_tag: "",
    quest_image_url: "",
    quest_answer_choices: [], // ExclusiveChoice / MultipleChoice
    // Numeric validation (UI helpers)
    _validEnableMin: false,
    _validMin: null,
    _validEnableMax: false,
    _validMax: null,
    // Dependencies — always an array internally; [] = no dependency
    // Each: { question_id: number|null, required_value: string | string[] }
    _deps: [],
  };
}

function newElement() {
  return {
    element_type: "",
    element_type_icon: "",
    quest_query: "",
    quests: [],
  };
}

function blankDefinition() {
  return { version: "3.0.0", elements: [] };
}

// ─── JSON ↔ internal conversion ────────────────────────────────────────────

/** Map a JSON quest object to internal representation */
function questFromJson(quest) {
  const dep = quest.quest_answer_dependency;
  const deps = dep
    ? (Array.isArray(dep) ? dep : [dep]).map((d) => ({
        question_id: d.question_id ?? null,
        required_value: Array.isArray(d.required_value)
          ? [...d.required_value]
          : d.required_value ?? "",
      }))
    : [];

  const val = quest.quest_answer_validation || {};
  return {
    quest_id: quest.quest_id ?? 0,
    quest_title: quest.quest_title ?? "",
    quest_description: quest.quest_description ?? "",
    quest_type: quest.quest_type ?? "ExclusiveChoice",
    quest_tag: quest.quest_tag ?? "",
    quest_image_url: quest.quest_image_url ?? "",
    quest_answer_choices: (quest.quest_answer_choices || []).map((c) => ({
      value: c.value ?? "",
      choice_text: c.choice_text ?? "",
      image_url: c.image_url ?? "",
      choice_follow_up: c.choice_follow_up ?? "",
    })),
    _validEnableMin: val.min != null,
    _validMin: val.min ?? null,
    _validEnableMax: val.max != null,
    _validMax: val.max ?? null,
    _deps: deps,
  };
}

/** Serialize internal quest back to clean JSON format */
function questToJson(quest) {
  const out = {
    quest_id: quest.quest_id,
    quest_title: quest.quest_title,
    quest_description: quest.quest_description,
    quest_type: quest.quest_type,
    quest_tag: quest.quest_tag,
  };

  if (quest.quest_image_url) out.quest_image_url = quest.quest_image_url;

  if (
    quest.quest_type === "ExclusiveChoice" ||
    quest.quest_type === "MultipleChoice"
  ) {
    out.quest_answer_choices = quest.quest_answer_choices.map((c) => {
      const co = { value: c.value, choice_text: c.choice_text };
      if (c.image_url) co.image_url = c.image_url;
      if (c.choice_follow_up) co.choice_follow_up = c.choice_follow_up;
      return co;
    });
  }

  if (quest.quest_type === "Numeric") {
    const v = {};
    if (quest._validEnableMin && quest._validMin != null)
      v.min = quest._validMin;
    if (quest._validEnableMax && quest._validMax != null)
      v.max = quest._validMax;
    if (Object.keys(v).length > 0) out.quest_answer_validation = v;
  }

  if (quest._deps.length === 1) {
    out.quest_answer_dependency = { ...quest._deps[0] };
  } else if (quest._deps.length > 1) {
    out.quest_answer_dependency = quest._deps.map((d) => ({ ...d }));
  }

  return out;
}

// ─── Store ─────────────────────────────────────────────────────────────────

export const useQuestStore = defineStore("quest", () => {
  const definition = ref(blankDefinition());

  // ── Load / Reset ──────────────────────────────────────────────────────────

  /**
   * Populate store from a parsed JSON object.
   * Throws if version !== '3.0.0'.
   */
  function loadFromJson(jsonObj) {
    if (jsonObj.version !== "3.0.0") {
      throw new Error(
        `Unsupported version "${jsonObj.version}". Only 3.0.0 is supported.`
      );
    }
    definition.value = {
      version: "3.0.0",
      elements: (jsonObj.elements || []).map((el) => ({
        element_type: el.element_type ?? "",
        element_type_icon: el.element_type_icon ?? "",
        quest_query: el.quest_query ?? "",
        quests: (el.quests || []).map((q) => questFromJson(q)),
      })),
    };
  }

  function resetDefinition() {
    definition.value = blankDefinition();
  }

  // ── Elements ──────────────────────────────────────────────────────────────

  function addElement() {
    definition.value.elements.push(newElement());
  }

  function removeElement(elementIndex) {
    definition.value.elements.splice(elementIndex, 1);
  }

  function moveElementUp(elementIndex) {
    if (elementIndex === 0) return;
    const els = definition.value.elements;
    [els[elementIndex - 1], els[elementIndex]] = [
      els[elementIndex],
      els[elementIndex - 1],
    ];
  }

  function moveElementDown(elementIndex) {
    const els = definition.value.elements;
    if (elementIndex >= els.length - 1) return;
    [els[elementIndex], els[elementIndex + 1]] = [
      els[elementIndex + 1],
      els[elementIndex],
    ];
  }

  function updateElement(elementIndex, fields) {
    Object.assign(definition.value.elements[elementIndex], fields);
  }

  // ── Quests ────────────────────────────────────────────────────────────────

  function addQuest(elementIndex) {
    const quests = definition.value.elements[elementIndex].quests;
    quests.push(newQuest(elementIndex, quests.length));
  }

  function removeQuest(elementIndex, questIndex) {
    definition.value.elements[elementIndex].quests.splice(questIndex, 1);
    recomputeQuestIds(elementIndex);
  }

  function moveQuestUp(elementIndex, questIndex) {
    if (questIndex === 0) return;
    const quests = definition.value.elements[elementIndex].quests;
    [quests[questIndex - 1], quests[questIndex]] = [
      quests[questIndex],
      quests[questIndex - 1],
    ];
    recomputeQuestIds(elementIndex);
  }

  function moveQuestDown(elementIndex, questIndex) {
    const quests = definition.value.elements[elementIndex].quests;
    if (questIndex >= quests.length - 1) return;
    [quests[questIndex], quests[questIndex + 1]] = [
      quests[questIndex + 1],
      quests[questIndex],
    ];
    recomputeQuestIds(elementIndex);
  }

  function updateQuest(elementIndex, questIndex, fields) {
    Object.assign(
      definition.value.elements[elementIndex].quests[questIndex],
      fields
    );
  }

  /**
   * Recompute quest_id for every quest in an element using the formula.
   * Called automatically after add/remove/move operations.
   * Individual quest_id overrides can be set via updateQuest.
   */
  function recomputeQuestIds(elementIndex) {
    const quests = definition.value.elements[elementIndex].quests;
    quests.forEach((q, i) => {
      q.quest_id = (elementIndex + 1) * 100 + i + 1;
    });
  }

  // ── Choices ───────────────────────────────────────────────────────────────

  function addChoice(elementIndex, questIndex) {
    definition.value.elements[elementIndex].quests[
      questIndex
    ].quest_answer_choices.push(newChoice());
  }

  function removeChoice(elementIndex, questIndex, choiceIndex) {
    definition.value.elements[elementIndex].quests[
      questIndex
    ].quest_answer_choices.splice(choiceIndex, 1);
  }

  function moveChoiceUp(elementIndex, questIndex, choiceIndex) {
    if (choiceIndex === 0) return;
    const choices =
      definition.value.elements[elementIndex].quests[questIndex]
        .quest_answer_choices;
    [choices[choiceIndex - 1], choices[choiceIndex]] = [
      choices[choiceIndex],
      choices[choiceIndex - 1],
    ];
  }

  function moveChoiceDown(elementIndex, questIndex, choiceIndex) {
    const choices =
      definition.value.elements[elementIndex].quests[questIndex]
        .quest_answer_choices;
    if (choiceIndex >= choices.length - 1) return;
    [choices[choiceIndex], choices[choiceIndex + 1]] = [
      choices[choiceIndex + 1],
      choices[choiceIndex],
    ];
  }

  function updateChoice(elementIndex, questIndex, choiceIndex, fields) {
    Object.assign(
      definition.value.elements[elementIndex].quests[questIndex]
        .quest_answer_choices[choiceIndex],
      fields
    );
  }

  // ── Computed ──────────────────────────────────────────────────────────────

  /** Serialized quest definition ready for export / AJV validation */
  const fullJson = computed(() => {
    const def = definition.value;
    return {
      version: def.version,
      elements: def.elements.map((el) => ({
        element_type: el.element_type,
        element_type_icon: el.element_type_icon,
        quest_query: el.quest_query,
        quests: el.quests.map((q) => questToJson(q)),
      })),
    };
  });

  /** Array of AJV error objects; empty when valid */
  const validationErrors = computed(() => {
    const ok = validate(fullJson.value);
    return ok ? [] : validate.errors || [];
  });

  return {
    definition,
    fullJson,
    validationErrors,
    loadFromJson,
    resetDefinition,
    addElement,
    removeElement,
    moveElementUp,
    moveElementDown,
    updateElement,
    addQuest,
    removeQuest,
    moveQuestUp,
    moveQuestDown,
    updateQuest,
    recomputeQuestIds,
    addChoice,
    removeChoice,
    moveChoiceUp,
    moveChoiceDown,
    updateChoice,
  };
});
