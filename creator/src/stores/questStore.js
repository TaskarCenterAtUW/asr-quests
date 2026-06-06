/** @format */

import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import Ajv from "ajv";
import schema from "../assets/schema.json";

const ajv = new Ajv({ allErrors: true, strict: false });
const validate = ajv.compile(schema);
const STORAGE_KEY = "quest-creator:draft:v1";
const LATEST_DEFINITION_VERSION = schema.version ?? "3.0.0";

function newChoice() {
  return {
    value: "",
    choice_text: "",
    image_url: "",
    choice_follow_up: "",
    _followUpEnabled: false,
  };
}

function isChoiceQuestType(questType) {
  return questType === "ExclusiveChoice" || questType === "MultipleChoice";
}

function normalizeQuestionId(value) {
  const parsedValue = Number(value);
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function normalizeQuestId(value) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function normalizeNumericBound(value) {
  if (value === "" || value == null) {
    return null;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function hasOwnField(object, fieldName) {
  return Object.prototype.hasOwnProperty.call(object, fieldName);
}

function compareSemver(leftVersion, rightVersion) {
  const left = String(leftVersion || "")
    .split(".")
    .map((part) => Number(part));
  const right = String(rightVersion || "")
    .split(".")
    .map((part) => Number(part));

  if (
    left.some((part) => Number.isNaN(part)) ||
    right.some((part) => Number.isNaN(part))
  ) {
    return 0;
  }

  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const leftPart = left[index] ?? 0;
    const rightPart = right[index] ?? 0;

    if (leftPart > rightPart) {
      return 1;
    }

    if (leftPart < rightPart) {
      return -1;
    }
  }

  return 0;
}

function normalizeDefinitionVersion(
  value,
  fallback = LATEST_DEFINITION_VERSION
) {
  return typeof value === "string" && /^\d+\.\d+\.\d+$/.test(value)
    ? value
    : fallback;
}

function normalizeDependencyList(dependencies) {
  if (!Array.isArray(dependencies)) {
    return [];
  }

  return dependencies.map((dependency) => ({
    question_id: normalizeQuestionId(dependency?.question_id),
    required_value: Array.isArray(dependency?.required_value)
      ? dependency.required_value.filter(
          (value) => value != null && value !== ""
        )
      : (dependency?.required_value ?? ""),
  }));
}

function normalizeDependencyRequiredValue(parentQuest, requiredValue) {
  if (!parentQuest) {
    return "";
  }

  if (isChoiceQuestType(parentQuest.quest_type)) {
    if (Array.isArray(requiredValue)) {
      return requiredValue.filter((value) => value != null && value !== "");
    }

    return requiredValue ? [requiredValue] : [];
  }

  if (Array.isArray(requiredValue)) {
    return requiredValue[0] ?? "";
  }

  return requiredValue ?? "";
}

function normalizeQuestForType(quest) {
  if (!isChoiceQuestType(quest.quest_type)) {
    quest.quest_answer_choices = [];
  }

  if (quest.quest_type !== "Numeric") {
    quest._validEnableMin = false;
    quest._validMin = null;
    quest._validEnableMax = false;
    quest._validMax = null;
  }
}

function clampIndex(index, length) {
  if (length <= 0) {
    return null;
  }

  const parsedIndex = Number(index);
  if (!Number.isInteger(parsedIndex)) {
    return 0;
  }

  return Math.min(Math.max(parsedIndex, 0), length - 1);
}

function arrayifyDependency(dependency) {
  if (!dependency) {
    return [];
  }

  return Array.isArray(dependency) ? dependency : [dependency];
}

function newQuest(elementIndex, questIndex) {
  return {
    quest_id: (elementIndex + 1) * 100 + questIndex + 1,
    quest_title: "",
    quest_description: "",
    quest_type: "ExclusiveChoice",
    quest_tag: "",
    quest_image_url: "",
    quest_answer_choices: [],
    _validEnableMin: false,
    _validMin: null,
    _validEnableMax: false,
    _validMax: null,
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
  return { version: LATEST_DEFINITION_VERSION, elements: [] };
}

function normalizeIncomingDefinition(jsonObj) {
  if (Array.isArray(jsonObj)) {
    return { version: "1.0.0", elements: jsonObj };
  }

  if (
    jsonObj &&
    typeof jsonObj === "object" &&
    Array.isArray(jsonObj.elements)
  ) {
    return {
      version: normalizeDefinitionVersion(
        jsonObj.version,
        jsonObj.version == null ? "2.0.0" : LATEST_DEFINITION_VERSION
      ),
      elements: jsonObj.elements,
    };
  }

  throw new Error(
    "Unsupported file format. Expected an array of elements or an object with version and elements."
  );
}

function questFromJson(quest) {
  const dependencies = normalizeDependencyList(
    arrayifyDependency(quest.quest_answer_dependency)
  );
  const validation = quest.quest_answer_validation || {};

  const normalizedQuest = {
    quest_id: normalizeQuestId(quest.quest_id ?? 0),
    quest_title: quest.quest_title ?? "",
    quest_description: quest.quest_description ?? "",
    quest_type: quest.quest_type ?? "ExclusiveChoice",
    quest_tag: quest.quest_tag ?? "",
    quest_image_url: quest.quest_image_url ?? "",
    quest_answer_choices: (quest.quest_answer_choices || []).map((choice) => ({
      value: choice.value ?? "",
      choice_text: choice.choice_text ?? "",
      image_url: choice.image_url ?? "",
      choice_follow_up: choice.choice_follow_up ?? "",
      _followUpEnabled: Boolean(choice.choice_follow_up),
    })),
    _validEnableMin: validation.min != null,
    _validMin: normalizeNumericBound(validation.min),
    _validEnableMax: validation.max != null,
    _validMax: normalizeNumericBound(validation.max),
    _deps: dependencies,
  };

  normalizeQuestForType(normalizedQuest);
  return normalizedQuest;
}

function questFromDraft(quest) {
  const normalizedQuest = questFromJson(quest || {});

  return {
    ...normalizedQuest,
    _validEnableMin:
      typeof quest?._validEnableMin === "boolean"
        ? quest._validEnableMin
        : normalizedQuest._validEnableMin,
    _validMin:
      quest?._validMin !== undefined
        ? normalizeNumericBound(quest._validMin)
        : normalizedQuest._validMin,
    _validEnableMax:
      typeof quest?._validEnableMax === "boolean"
        ? quest._validEnableMax
        : normalizedQuest._validEnableMax,
    _validMax:
      quest?._validMax !== undefined
        ? normalizeNumericBound(quest._validMax)
        : normalizedQuest._validMax,
    _deps: Array.isArray(quest?._deps)
      ? normalizeDependencyList(quest._deps)
      : normalizedQuest._deps,
  };
}

function createQuestFromTemplate(
  templateQuest,
  questId,
  templateQuestionIdMap
) {
  const validation = templateQuest.quest_answer_validation || {};
  const dependencies = arrayifyDependency(
    templateQuest.quest_answer_dependency
  ).map((dependency) => ({
    question_id:
      typeof dependency?.question_id === "string"
        ? (templateQuestionIdMap.get(dependency.question_id) ?? null)
        : normalizeQuestionId(dependency?.question_id),
    required_value: Array.isArray(dependency?.required_value)
      ? dependency.required_value.filter(
          (value) => value != null && value !== ""
        )
      : (dependency?.required_value ?? ""),
  }));

  const quest = {
    quest_id: questId,
    quest_title: templateQuest.quest_title ?? "",
    quest_description: templateQuest.quest_description ?? "",
    quest_type: templateQuest.quest_type ?? "ExclusiveChoice",
    quest_tag: templateQuest.quest_tag ?? "",
    quest_image_url: templateQuest.quest_image_url ?? "",
    quest_answer_choices: (templateQuest.quest_answer_choices || []).map(
      (choice) => ({
        value: choice.value ?? "",
        choice_text: choice.choice_text ?? "",
        image_url: choice.image_url ?? "",
        choice_follow_up: choice.choice_follow_up ?? "",
        _followUpEnabled: Boolean(choice.choice_follow_up),
      })
    ),
    _validEnableMin: validation.min != null,
    _validMin: normalizeNumericBound(validation.min),
    _validEnableMax: validation.max != null,
    _validMax: normalizeNumericBound(validation.max),
    _deps: dependencies,
  };

  normalizeQuestForType(quest);
  return quest;
}

function definitionFromDraft(draftDefinition) {
  return {
    version: normalizeDefinitionVersion(draftDefinition?.version),
    elements: Array.isArray(draftDefinition?.elements)
      ? draftDefinition.elements.map((element) => ({
          element_type: element?.element_type ?? "",
          element_type_icon: element?.element_type_icon ?? "",
          quest_query: element?.quest_query ?? "",
          quests: Array.isArray(element?.quests)
            ? element.quests.map((quest) => questFromDraft(quest))
            : [],
        }))
      : [],
  };
}

function questToJson(quest) {
  const out = {
    quest_id: quest.quest_id,
    quest_title: quest.quest_title,
    quest_description: quest.quest_description,
    quest_type: quest.quest_type,
    quest_tag: quest.quest_tag,
  };

  if (quest.quest_image_url) {
    out.quest_image_url = quest.quest_image_url;
  }

  if (isChoiceQuestType(quest.quest_type)) {
    out.quest_answer_choices = quest.quest_answer_choices.map((choice) => {
      const serializedChoice = {
        value: choice.value,
        choice_text: choice.choice_text,
      };

      if (choice.image_url) {
        serializedChoice.image_url = choice.image_url;
      }

      if (choice.choice_follow_up) {
        serializedChoice.choice_follow_up = choice.choice_follow_up;
      }

      return serializedChoice;
    });
  }

  if (quest.quest_type === "Numeric") {
    const validation = {};

    if (quest._validEnableMin && quest._validMin != null) {
      validation.min = quest._validMin;
    }

    if (quest._validEnableMax && quest._validMax != null) {
      validation.max = quest._validMax;
    }

    if (Object.keys(validation).length > 0) {
      out.quest_answer_validation = validation;
    }
  }

  if (quest._deps.length === 1) {
    out.quest_answer_dependency = { ...quest._deps[0] };
  } else if (quest._deps.length > 1) {
    out.quest_answer_dependency = quest._deps.map((dependency) => ({
      ...dependency,
    }));
  }

  return out;
}

export const useQuestStore = defineStore("quest", () => {
  const definition = ref(blankDefinition());
  const selectedElementIndex = ref(null);
  const selectedQuestIndex = ref(null);
  const editorStarted = ref(false);
  const restoredDraft = ref(false);
  const persistenceError = ref("");
  const lastSavedAt = ref(null);

  function touchEditorSession() {
    editorStarted.value = true;
  }

  function persistDraft() {
    if (!editorStarted.value || typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          definition: definition.value,
          selectedElementIndex: selectedElementIndex.value,
          selectedQuestIndex: selectedQuestIndex.value,
          editorStarted: editorStarted.value,
        })
      );
      lastSavedAt.value = Date.now();
      persistenceError.value = "";
    } catch {
      persistenceError.value = "Local draft autosave is unavailable.";
    }
  }

  function hydrateDraft() {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const rawDraft = window.localStorage.getItem(STORAGE_KEY);
      if (!rawDraft) {
        return;
      }

      const draft = JSON.parse(rawDraft);
      const nextDefinition = definitionFromDraft(draft?.definition);
      const nextElementIndex = clampIndex(
        draft?.selectedElementIndex,
        nextDefinition.elements.length
      );

      definition.value = nextDefinition;
      selectedElementIndex.value = nextElementIndex;
      selectedQuestIndex.value =
        nextElementIndex == null
          ? null
          : clampIndex(
              draft?.selectedQuestIndex,
              nextDefinition.elements[nextElementIndex]?.quests.length ?? 0
            );
      editorStarted.value =
        Boolean(draft?.editorStarted) || nextDefinition.elements.length > 0;
      restoredDraft.value = editorStarted.value;
      persistenceError.value = "";
    } catch {
      persistenceError.value =
        "The previous local draft could not be restored.";
    }
  }

  function remapDependencyQuestionIds(
    elementIndex,
    idMap,
    preserveUnmapped = false
  ) {
    const element = definition.value.elements[elementIndex];
    if (!element) {
      return;
    }

    element.quests.forEach((quest) => {
      quest._deps = (quest._deps || []).map((dependency) => {
        if (dependency.question_id == null) {
          return { ...dependency, question_id: null };
        }

        if (idMap.has(dependency.question_id)) {
          return {
            ...dependency,
            question_id: idMap.get(dependency.question_id) ?? null,
          };
        }

        return {
          ...dependency,
          question_id: preserveUnmapped ? dependency.question_id : null,
        };
      });
    });
  }

  function normalizeDependenciesForElement(elementIndex) {
    const element = definition.value.elements[elementIndex];
    if (!element) {
      return;
    }

    const questionsById = new Map(
      element.quests.map((quest) => [quest.quest_id, quest])
    );

    element.quests.forEach((quest) => {
      quest._deps = (quest._deps || []).map((dependency) => {
        const parentQuest =
          dependency.question_id == null
            ? null
            : questionsById.get(dependency.question_id) || null;

        return {
          question_id: parentQuest ? dependency.question_id : null,
          required_value: normalizeDependencyRequiredValue(
            parentQuest,
            dependency.required_value
          ),
        };
      });
    });
  }

  function recomputeQuestIds(elementIndex) {
    const element = definition.value.elements[elementIndex];
    if (!element) {
      return;
    }

    const idMap = new Map(
      element.quests.map((quest, questIndex) => [
        quest.quest_id,
        (elementIndex + 1) * 100 + questIndex + 1,
      ])
    );

    element.quests.forEach((quest, questIndex) => {
      quest.quest_id = (elementIndex + 1) * 100 + questIndex + 1;
    });

    remapDependencyQuestionIds(elementIndex, idMap);
    normalizeDependenciesForElement(elementIndex);
  }

  hydrateDraft();

  watch(
    [definition, selectedElementIndex, selectedQuestIndex, editorStarted],
    () => {
      persistDraft();
    },
    { deep: true }
  );

  const fullJson = computed(() => {
    const currentDefinition = definition.value;

    return {
      version: currentDefinition.version,
      elements: currentDefinition.elements.map((element) => ({
        element_type: element.element_type,
        element_type_icon: element.element_type_icon,
        quest_query: element.quest_query,
        quests: element.quests.map((quest) => questToJson(quest)),
      })),
    };
  });

  const validationErrors = computed(() => {
    const isValid = validate(fullJson.value);
    return isValid ? [] : validate.errors || [];
  });

  const validationWarnings = computed(() => {
    const warnings = [];
    const versionComparison = compareSemver(
      definition.value.version,
      LATEST_DEFINITION_VERSION
    );

    if (versionComparison < 0) {
      warnings.push({
        instancePath: "/version",
        keyword: "outdated-version",
        message: `Version ${definition.value.version} is outdated. Upgrade to ${LATEST_DEFINITION_VERSION}.`,
        params: {
          currentVersion: definition.value.version,
          latestVersion: LATEST_DEFINITION_VERSION,
        },
      });
    } else if (versionComparison > 0) {
      warnings.push({
        instancePath: "/version",
        keyword: "future-version",
        message: `Version ${definition.value.version} is newer than this creator's schema ${LATEST_DEFINITION_VERSION}. Review carefully before exporting.`,
        params: {
          currentVersion: definition.value.version,
          latestVersion: LATEST_DEFINITION_VERSION,
        },
      });
    }

    return warnings;
  });

  const validationErrorPaths = computed(() => {
    return new Set(
      (validationErrors.value || []).map((error) => error.instancePath || "")
    );
  });

  function hasValidationError(instancePath) {
    for (const errorPath of validationErrorPaths.value) {
      if (
        errorPath === instancePath ||
        errorPath.startsWith(`${instancePath}/`)
      ) {
        return true;
      }
    }

    return false;
  }

  function selectElement(elementIndex) {
    selectedElementIndex.value = clampIndex(
      elementIndex,
      definition.value.elements.length
    );
    selectedQuestIndex.value = null;
  }

  function selectQuest(questIndex) {
    const questCount =
      selectedElementIndex.value == null
        ? 0
        : (definition.value.elements[selectedElementIndex.value]?.quests
            .length ?? 0);

    selectedQuestIndex.value =
      questIndex == null ? null : clampIndex(questIndex, questCount);
  }

  function clearStoredDefinition() {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }

    definition.value = blankDefinition();
    selectedElementIndex.value = null;
    selectedQuestIndex.value = null;
    editorStarted.value = false;
    restoredDraft.value = false;
    persistenceError.value = "";
    lastSavedAt.value = null;
  }

  function upgradeDefinitionVersion() {
    definition.value.version = LATEST_DEFINITION_VERSION;
    touchEditorSession();
  }

  function loadFromJson(jsonObj) {
    const normalizedDefinition = normalizeIncomingDefinition(jsonObj);

    definition.value = {
      version: normalizedDefinition.version,
      elements: normalizedDefinition.elements.map((element) => ({
        element_type: element.element_type ?? "",
        element_type_icon: element.element_type_icon ?? "",
        quest_query: element.quest_query ?? "",
        quests: (element.quests || []).map((quest) => questFromJson(quest)),
      })),
    };

    selectedElementIndex.value =
      definition.value.elements.length > 0 ? 0 : null;
    selectedQuestIndex.value =
      definition.value.elements[0]?.quests.length > 0 ? 0 : null;
    editorStarted.value = true;
    restoredDraft.value = false;
  }

  function resetDefinition() {
    definition.value = blankDefinition();
    selectedElementIndex.value = null;
    selectedQuestIndex.value = null;
    editorStarted.value = true;
    restoredDraft.value = false;
  }

  function addElement() {
    definition.value.elements.push(newElement());
    selectedElementIndex.value = definition.value.elements.length - 1;
    selectedQuestIndex.value = null;
    touchEditorSession();
  }

  function removeElement(elementIndex) {
    definition.value.elements.splice(elementIndex, 1);

    for (
      let nextElementIndex = elementIndex;
      nextElementIndex < definition.value.elements.length;
      nextElementIndex += 1
    ) {
      recomputeQuestIds(nextElementIndex);
    }

    if (selectedElementIndex.value === elementIndex) {
      selectedElementIndex.value =
        definition.value.elements.length > 0
          ? Math.min(elementIndex, definition.value.elements.length - 1)
          : null;
      selectedQuestIndex.value = null;
    } else if (
      selectedElementIndex.value != null &&
      selectedElementIndex.value > elementIndex
    ) {
      selectedElementIndex.value -= 1;
    }

    if (selectedElementIndex.value != null) {
      selectedQuestIndex.value = clampIndex(
        selectedQuestIndex.value,
        definition.value.elements[selectedElementIndex.value]?.quests.length ??
          0
      );
    }

    touchEditorSession();
  }

  function moveElementUp(elementIndex) {
    if (elementIndex === 0) {
      return;
    }

    const elements = definition.value.elements;
    [elements[elementIndex - 1], elements[elementIndex]] = [
      elements[elementIndex],
      elements[elementIndex - 1],
    ];

    recomputeQuestIds(elementIndex - 1);
    recomputeQuestIds(elementIndex);

    if (selectedElementIndex.value === elementIndex) {
      selectedElementIndex.value = elementIndex - 1;
    } else if (selectedElementIndex.value === elementIndex - 1) {
      selectedElementIndex.value = elementIndex;
    }

    touchEditorSession();
  }

  function moveElementDown(elementIndex) {
    const elements = definition.value.elements;
    if (elementIndex >= elements.length - 1) {
      return;
    }

    [elements[elementIndex], elements[elementIndex + 1]] = [
      elements[elementIndex + 1],
      elements[elementIndex],
    ];

    recomputeQuestIds(elementIndex);
    recomputeQuestIds(elementIndex + 1);

    if (selectedElementIndex.value === elementIndex) {
      selectedElementIndex.value = elementIndex + 1;
    } else if (selectedElementIndex.value === elementIndex + 1) {
      selectedElementIndex.value = elementIndex;
    }

    touchEditorSession();
  }

  function updateElement(elementIndex, fields) {
    Object.assign(definition.value.elements[elementIndex], fields);
    touchEditorSession();
  }

  function applyElementPreset(elementIndex, preset) {
    const element = definition.value.elements[elementIndex];
    if (!element || !preset) {
      return;
    }

    Object.assign(element, {
      element_type: preset.element_type ?? element.element_type,
      element_type_icon: preset.element_type_icon ?? element.element_type_icon,
      quest_query: preset.quest_query ?? element.quest_query,
    });

    selectedElementIndex.value = elementIndex;
    touchEditorSession();
  }

  function addQuest(elementIndex) {
    const quests = definition.value.elements[elementIndex].quests;
    quests.push(newQuest(elementIndex, quests.length));
    selectedElementIndex.value = elementIndex;
    selectedQuestIndex.value = quests.length - 1;
    touchEditorSession();
  }

  function insertSingleQuestTemplate(elementIndex, templateQuest) {
    const element = definition.value.elements[elementIndex];
    if (!element || !templateQuest) return null;

    const questId = (elementIndex + 1) * 100 + element.quests.length + 1;
    element.quests.push(
      createQuestFromTemplate(templateQuest, questId, new Map())
    );

    normalizeDependenciesForElement(elementIndex);
    selectedElementIndex.value = elementIndex;
    selectedQuestIndex.value = element.quests.length - 1;
    touchEditorSession();

    return questId;
  }

  function insertQuestPreset(elementIndex, questPreset) {
    const element = definition.value.elements[elementIndex];
    if (
      !element ||
      !Array.isArray(questPreset?.quests) ||
      questPreset.quests.length === 0
    ) {
      return null;
    }

    const startIndex = element.quests.length;
    const templateQuestionIdMap = new Map(
      questPreset.quests.map((quest, offset) => [
        quest.template_quest_id ?? `template-${offset}`,
        (elementIndex + 1) * 100 + startIndex + offset + 1,
      ])
    );

    questPreset.quests.forEach((templateQuest, offset) => {
      const questId = (elementIndex + 1) * 100 + startIndex + offset + 1;
      element.quests.push(
        createQuestFromTemplate(templateQuest, questId, templateQuestionIdMap)
      );
    });

    normalizeDependenciesForElement(elementIndex);
    selectedElementIndex.value = elementIndex;
    selectedQuestIndex.value = startIndex;
    touchEditorSession();

    return { startIndex, count: questPreset.quests.length };
  }

  function insertQuestTemplatePack(elementIndex, templatePack) {
    return insertQuestPreset(elementIndex, templatePack);
  }

  function removeQuest(elementIndex, questIndex) {
    definition.value.elements[elementIndex].quests.splice(questIndex, 1);
    recomputeQuestIds(elementIndex);

    if (selectedElementIndex.value === elementIndex) {
      if (definition.value.elements[elementIndex].quests.length === 0) {
        selectedQuestIndex.value = null;
      } else {
        selectedQuestIndex.value = clampIndex(
          questIndex,
          definition.value.elements[elementIndex].quests.length
        );
      }
    }

    touchEditorSession();
  }

  function moveQuestUp(elementIndex, questIndex) {
    if (questIndex === 0) {
      return;
    }

    const quests = definition.value.elements[elementIndex].quests;
    [quests[questIndex - 1], quests[questIndex]] = [
      quests[questIndex],
      quests[questIndex - 1],
    ];

    recomputeQuestIds(elementIndex);

    if (selectedElementIndex.value === elementIndex) {
      selectedQuestIndex.value = questIndex - 1;
    }

    touchEditorSession();
  }

  function moveQuestDown(elementIndex, questIndex) {
    const quests = definition.value.elements[elementIndex].quests;
    if (questIndex >= quests.length - 1) {
      return;
    }

    [quests[questIndex], quests[questIndex + 1]] = [
      quests[questIndex + 1],
      quests[questIndex],
    ];

    recomputeQuestIds(elementIndex);

    if (selectedElementIndex.value === elementIndex) {
      selectedQuestIndex.value = questIndex + 1;
    }

    touchEditorSession();
  }

  function updateQuest(elementIndex, questIndex, fields) {
    const quest = definition.value.elements[elementIndex]?.quests[questIndex];
    if (!quest) {
      return;
    }

    const previousQuestType = quest.quest_type;
    const previousQuestId = quest.quest_id;

    Object.assign(quest, fields);

    if (hasOwnField(fields, "_validMin")) {
      quest._validMin = normalizeNumericBound(quest._validMin);
    }

    if (hasOwnField(fields, "_validMax")) {
      quest._validMax = normalizeNumericBound(quest._validMax);
    }

    if (hasOwnField(fields, "_validEnableMin") && !quest._validEnableMin) {
      quest._validMin = null;
    }

    if (hasOwnField(fields, "_validEnableMax") && !quest._validEnableMax) {
      quest._validMax = null;
    }

    if (
      hasOwnField(fields, "quest_type") &&
      fields.quest_type !== previousQuestType
    ) {
      normalizeQuestForType(quest);
      normalizeDependenciesForElement(elementIndex);
    }

    if (hasOwnField(fields, "quest_id")) {
      quest.quest_id = normalizeQuestId(quest.quest_id);

      if (quest.quest_id !== previousQuestId) {
        remapDependencyQuestionIds(
          elementIndex,
          new Map([[previousQuestId, quest.quest_id]]),
          true
        );
        normalizeDependenciesForElement(elementIndex);
      }
    }

    if (hasOwnField(fields, "_deps")) {
      normalizeDependenciesForElement(elementIndex);
    }

    touchEditorSession();
  }

  function addChoice(elementIndex, questIndex) {
    definition.value.elements[elementIndex].quests[
      questIndex
    ].quest_answer_choices.push(newChoice());
    touchEditorSession();
  }

  function removeChoice(elementIndex, questIndex, choiceIndex) {
    definition.value.elements[elementIndex].quests[
      questIndex
    ].quest_answer_choices.splice(choiceIndex, 1);
    touchEditorSession();
  }

  function moveChoiceUp(elementIndex, questIndex, choiceIndex) {
    if (choiceIndex === 0) {
      return;
    }

    const choices =
      definition.value.elements[elementIndex].quests[questIndex]
        .quest_answer_choices;

    [choices[choiceIndex - 1], choices[choiceIndex]] = [
      choices[choiceIndex],
      choices[choiceIndex - 1],
    ];

    touchEditorSession();
  }

  function moveChoiceDown(elementIndex, questIndex, choiceIndex) {
    const choices =
      definition.value.elements[elementIndex].quests[questIndex]
        .quest_answer_choices;

    if (choiceIndex >= choices.length - 1) {
      return;
    }

    [choices[choiceIndex], choices[choiceIndex + 1]] = [
      choices[choiceIndex + 1],
      choices[choiceIndex],
    ];

    touchEditorSession();
  }

  function updateChoice(elementIndex, questIndex, choiceIndex, fields) {
    Object.assign(
      definition.value.elements[elementIndex].quests[questIndex]
        .quest_answer_choices[choiceIndex],
      fields
    );
    touchEditorSession();
  }

  return {
    definition,
    fullJson,
    validationErrors,
    validationWarnings,
    validationErrorPaths,
    hasValidationError,
    latestDefinitionVersion: LATEST_DEFINITION_VERSION,
    editorStarted,
    restoredDraft,
    persistenceError,
    lastSavedAt,
    selectedElementIndex,
    selectedQuestIndex,
    selectElement,
    selectQuest,
    clearStoredDefinition,
    upgradeDefinitionVersion,
    loadFromJson,
    resetDefinition,
    addElement,
    removeElement,
    moveElementUp,
    moveElementDown,
    updateElement,
    applyElementPreset,
    addQuest,
    insertSingleQuestTemplate,
    insertQuestPreset,
    insertQuestTemplatePack,
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
