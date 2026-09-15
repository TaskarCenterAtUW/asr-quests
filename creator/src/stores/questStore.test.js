/** @format */

import { nextTick } from "vue";
import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useQuestStore } from "./questStore";
import { questPresetLibrary } from "../assets/questTemplates";

function createStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

function validV32Definition() {
  return {
    version: "3.2.0",
    recency_period: 30,
    "feature-presets": [
      {
        name: "Bench",
        icon: "preset_temaki_bench",
        tags: { amenity: "bench" },
      },
      {
        name: "Streetlight",
        icon: "preset_temaki_bench",
        tags: { highway: "street_lamp" },
      },
    ],
    "custom-icons": [
      {
        name: "streetlight_custom",
        url: "https://example.com/streetlight.svg",
        type: "quest",
      },
      {
        name: "bench_custom",
        url: "https://example.com/bench.svg",
        type: "feature-preset",
      },
    ],
    elements: [
      {
        element_type: "Streetlight",
        element_type_icon: "streetlight_custom",
        quest_query: "nodes with highway=street_lamp",
        quests: [],
      },
    ],
  };
}

function autoCaptureDefinition() {
  return {
    version: "3.1.0",
    elements: [
      {
        element_type: "Crossings",
        element_type_icon: "pedestrian_crossing",
        quest_query: "ways with (highway=footway and footway=crossing)",
        quests: [
          {
            quest_id: 206,
            quest_title: "Capture crossing attributes",
            quest_description:
              "Automatically captures width, incline, and cross slope.",
            quest_type: "AutoCapture",
            auto_capture_attributes: {
              ac_width: "ext:ac:width",
              ac_incline: "ext:ac:incline",
              ac_cross_slope: "ext:ac:cross_slope",
            },
          },
        ],
      },
    ],
  };
}

beforeEach(() => {
  setActivePinia(createPinia());
  globalThis.window = { localStorage: createStorage() };
});

describe("v3.2 definition state", () => {
  it("creates a v3.2 definition with the default recency period", () => {
    const store = useQuestStore();

    expect(store.definition).toEqual({
      version: "3.2.0",
      recency_period: 90,
      elements: [],
    });
    expect(store.definition["feature-presets"]).toBeUndefined();
    expect(store.definition["custom-icons"]).toBeUndefined();
  });

  it("loads legacy definitions with the v3.2 recency default", () => {
    const store = useQuestStore();

    store.loadFromJson([
      {
        element_type: "Sidewalk",
        element_type_icon: "access_point",
        quest_query: "ways with highway=footway",
        quests: [],
      },
    ]);

    expect(store.definition.version).toBe("1.0.0");
    expect(store.definition.recency_period).toBe(90);
    expect(store.definition["feature-presets"]).toBeUndefined();
    expect(store.definition["custom-icons"]).toBeUndefined();
  });

  it("round-trips v3.2 fields and custom references", () => {
    const store = useQuestStore();
    const input = validV32Definition();

    store.loadFromJson(input);

    expect(store.fullJson).toEqual(input);
    expect(store.validationErrors).toEqual([]);
  });

  it("keeps v3.2 fields in a hydrated draft without UI-only fields", async () => {
    const firstStore = useQuestStore();
    firstStore.loadFromJson(validV32Definition());
    await nextTick();

    const savedDraft = JSON.parse(
      window.localStorage.getItem("quest-creator:draft:v1")
    );
    expect(savedDraft.definition["custom-icons"][0]).toEqual(
      validV32Definition()["custom-icons"][0]
    );
    expect(savedDraft.definition.elements[0].quests).toEqual([]);

    setActivePinia(createPinia());
    const restoredStore = useQuestStore();
    expect(restoredStore.fullJson).toEqual(validV32Definition());
    expect(restoredStore.fullJson.elements[0].quests[0]).toBeUndefined();
  });

  it("persists preset and custom icon mutations through autosave", async () => {
    const store = useQuestStore();
    store.resetDefinition();
    store.addFeaturePreset();
    store.updateFeaturePreset(0, {
      name: "Bench",
      icon: "preset_temaki_bench",
      tags: { amenity: "bench" },
    });
    store.addCustomIcon();
    expect(store.fullJson["feature-presets"]).toHaveLength(1);
    expect(store.fullJson["custom-icons"]).toHaveLength(1);
    expect(store.validationErrors.length).toBeGreaterThan(0);
    store.updateCustomIcon(0, {
      name: "lamp",
      url: "https://example.com/lamp.svg",
      type: "quest",
    });
    await nextTick();

    const savedDraft = JSON.parse(
      window.localStorage.getItem("quest-creator:draft:v1")
    );
    expect(savedDraft.definition["feature-presets"]).toHaveLength(1);
    expect(savedDraft.definition["custom-icons"][0].name).toBe("lamp");
  });
});

describe("semantic v3.2 validation", () => {
  it("reports field-specific icon, URL, duplicate, and tag errors", () => {
    const store = useQuestStore();
    store.loadFromJson({
      version: "3.2.0",
      recency_period: 0,
      "feature-presets": [
        { name: "Bench", icon: "missing", tags: {} },
        { name: " Bench ", icon: "missing", tags: { amenity: "" } },
      ],
      "custom-icons": [
        { name: "lamp", url: "ftp://example.com/lamp.svg", type: "quest" },
        { name: "lamp", url: "not a url", type: "feature-preset" },
      ],
      elements: [
        {
          element_type: "Lamp",
          element_type_icon: "missing",
          quest_query: "nodes with highway=street_lamp",
          quests: [],
        },
      ],
    });

    const paths = store.validationErrors.map((error) => error.instancePath);
    expect(paths).toContain("/recency_period");
    expect(paths).toContain("/feature-presets/1/name");
    expect(paths).toContain("/feature-presets/0/icon");
    expect(paths).toContain("/feature-presets/0/tags");
    expect(paths).toContain("/custom-icons/0/url");
    expect(paths).toContain("/custom-icons/1/name");
    expect(paths).toContain("/elements/0/element_type_icon");
  });
});

describe("AutoCapture quests", () => {
  it("provides an all-attribute AutoCapture preset for sidewalks", () => {
    const preset = questPresetLibrary.find(
      (entry) => entry.id === "sidewalk-auto-capture"
    );

    expect(preset?.elementCategories).toContain("sidewalk");
    expect(preset?.quests[0]).toMatchObject({
      quest_type: "AutoCapture",
      auto_capture_attributes: {
        ac_width: "ext:ac:width",
        ac_incline: "ext:ac:incline",
        ac_cross_slope: "ext:ac:cross_slope",
        ac_surface_integrity: "ext:ac:surface_integrity",
        ac_surface_disruption: "ext:ac:surface_disruption",
        ac_height_from_ground: "ext:ac:height_from_ground",
        ac_lidar_depth: "ext:ac:lidar_depth",
      },
    });
  });

  it("loads and round-trips AutoCapture attribute mappings", () => {
    const store = useQuestStore();
    const input = autoCaptureDefinition();

    store.loadFromJson(input);

    expect(
      store.definition.elements[0].quests[0].auto_capture_attributes
    ).toEqual(input.elements[0].quests[0].auto_capture_attributes);
    expect(store.fullJson.elements[0].quests[0]).toEqual(
      input.elements[0].quests[0]
    );
    expect(store.validationErrors).toEqual([]);
  });

  it("keeps mappings when restoring an autosaved draft", async () => {
    const firstStore = useQuestStore();
    firstStore.loadFromJson(autoCaptureDefinition());
    await nextTick();

    setActivePinia(createPinia());
    const restoredStore = useQuestStore();

    expect(
      restoredStore.fullJson.elements[0].quests[0].auto_capture_attributes
    ).toEqual(
      autoCaptureDefinition().elements[0].quests[0].auto_capture_attributes
    );
  });

  it("serializes one or more mappings and drops them after changing type", () => {
    const store = useQuestStore();
    store.resetDefinition();
    store.addElement();
    store.addQuest(0);
    store.updateQuest(0, 0, {
      quest_type: "AutoCapture",
      auto_capture_attributes: { ac_width: "width" },
    });

    expect(store.fullJson.elements[0].quests[0]).toMatchObject({
      quest_type: "AutoCapture",
      auto_capture_attributes: { ac_width: "width" },
    });
    expect(store.fullJson.elements[0].quests[0].quest_tag).toBeUndefined();

    store.updateQuest(0, 0, { quest_type: "TextEntry" });

    expect(
      store.fullJson.elements[0].quests[0].auto_capture_attributes
    ).toBeUndefined();
  });

  it("reports missing and unsupported AutoCapture mappings", () => {
    const store = useQuestStore();

    store.loadFromJson({
      ...autoCaptureDefinition(),
      elements: [
        {
          ...autoCaptureDefinition().elements[0],
          quests: [
            {
              ...autoCaptureDefinition().elements[0].quests[0],
              auto_capture_attributes: {
                ac_unknown: "unknown",
              },
            },
          ],
        },
      ],
    });

    const paths = store.validationErrors.map((error) => error.instancePath);
    expect(paths).toContain("/elements/0/quests/0/auto_capture_attributes");

    store.updateQuest(0, 0, { auto_capture_attributes: {} });
    expect(store.validationErrors.map((error) => error.instancePath)).toContain(
      "/elements/0/quests/0/auto_capture_attributes"
    );
  });
});

describe("recency period normalization", () => {
  it("keeps the recency period as an integer when given the old display text", () => {
    const store = useQuestStore();

    store.setRecencyPeriod("90 (default)");

    expect(store.definition.recency_period).toBe(90);
    expect(Number.isInteger(store.definition.recency_period)).toBe(true);
  });
});

describe("drag-and-drop reordering", () => {
  it("moves an element to an arbitrary index and recomputes quest ids", () => {
    const store = useQuestStore();
    store.resetDefinition();
    store.addElement();
    store.updateElement(0, { element_type: "A" });
    store.addElement();
    store.updateElement(1, { element_type: "B" });
    store.addElement();
    store.updateElement(2, { element_type: "C" });

    store.addQuest(0);
    store.addQuest(0);
    store.addQuest(1);

    // Elements: [A(2 quests), B(1 quest), C(0 quests)].
    expect(
      store.definition.elements[0].quests.map((quest) => quest.quest_id)
    ).toEqual([101, 102]);
    expect(
      store.definition.elements[1].quests.map((quest) => quest.quest_id)
    ).toEqual([201]);

    // Drag element A (index 0) down to the end (index 2).
    store.moveElementTo(0, 2);

    expect(
      store.definition.elements.map((element) => element.element_type)
    ).toEqual(["B", "C", "A"]);

    // B (now index 0) recomputes its quest id to 1xx.
    expect(
      store.definition.elements[0].quests.map((quest) => quest.quest_id)
    ).toEqual([101]);
    // A (now index 2) recomputes its two quest ids to 3xx.
    expect(
      store.definition.elements[2].quests.map((quest) => quest.quest_id)
    ).toEqual([301, 302]);
    // C is empty.
    expect(store.definition.elements[1].quests).toEqual([]);
  });

  it("moves a quest to an arbitrary index and remaps dependencies", () => {
    const store = useQuestStore();
    store.resetDefinition();
    store.addElement();
    store.addQuest(0);
    store.updateQuest(0, 0, { quest_title: "Q0" });
    store.addQuest(0);
    store.updateQuest(0, 1, { quest_title: "Q1" });
    store.addQuest(0);
    store.updateQuest(0, 2, { quest_title: "Q2" });

    // Give Q0 a dependency on Q1's answer (id 102).
    const secondQuestId = store.definition.elements[0].quests[1].quest_id;
    store.updateQuest(0, 0, {
      quest_type: "ExclusiveChoice",
      _deps: [{ question_id: secondQuestId, required_value: ["yes"] }],
    });
    expect(store.definition.elements[0].quests[0]._deps[0].question_id).toBe(
      secondQuestId
    );

    // Drag Q0 (index 0) down to the end (index 2).
    store.moveQuestTo(0, 0, 2);

    const quests = store.definition.elements[0].quests;
    expect(quests.map((quest) => quest.quest_title)).toEqual([
      "Q1",
      "Q2",
      "Q0",
    ]);

    // The moved Q0 still depends on Q1, which is now at index 0 with id 101.
    const movedQuest = quests.find((quest) => quest.quest_title === "Q0");
    const referencedQuest = quests.find(
      (quest) => quest.quest_id === movedQuest._deps[0].question_id
    );
    expect(referencedQuest.quest_title).toBe("Q1");
  });

  it("moves a feature preset to an arbitrary index", () => {
    const store = useQuestStore();
    store.resetDefinition();
    store.addFeaturePreset();
    store.updateFeaturePreset(0, { name: "A", icon: "", tags: { amenity: "a" } });
    store.addFeaturePreset();
    store.updateFeaturePreset(1, { name: "B", icon: "", tags: { amenity: "b" } });
    store.addFeaturePreset();
    store.updateFeaturePreset(2, { name: "C", icon: "", tags: { amenity: "c" } });

    store.moveFeaturePresetTo(2, 0);

    expect(
      store.definition["feature-presets"].map((preset) => preset.name)
    ).toEqual(["C", "A", "B"]);
  });

  it("moves a custom icon to an arbitrary index", () => {
    const store = useQuestStore();
    store.resetDefinition();
    store.addCustomIcon();
    store.updateCustomIcon(0, { name: "a", url: "https://example.com/a.svg" });
    store.addCustomIcon();
    store.updateCustomIcon(1, { name: "b", url: "https://example.com/b.svg" });

    store.moveCustomIconTo(0, 1);

    expect(
      store.definition["custom-icons"].map((icon) => icon.name)
    ).toEqual(["b", "a"]);
  });

  it("moves a choice to an arbitrary index", () => {
    const store = useQuestStore();
    store.resetDefinition();
    store.addElement();
    store.addQuest(0);
    store.updateQuest(0, 0, { quest_type: "ExclusiveChoice" });
    store.addChoice(0, 0);
    store.updateChoice(0, 0, 0, { value: "one" });
    store.addChoice(0, 0);
    store.updateChoice(0, 0, 1, { value: "two" });
    store.addChoice(0, 0);
    store.updateChoice(0, 0, 2, { value: "three" });

    store.moveChoiceTo(0, 0, 2, 0);

    expect(
      store.definition.elements[0].quests[0].quest_answer_choices.map(
        (choice) => choice.value
      )
    ).toEqual(["three", "one", "two"]);
  });
});

describe("duplicate actions", () => {
  it("duplicates an element and recomputes copied and following quest ids", () => {
    const store = useQuestStore();
    store.resetDefinition();
    store.addElement();
    store.updateElement(0, { element_type: "A" });
    store.addQuest(0);
    store.updateQuest(0, 0, { quest_title: "Q0" });
    store.addElement();
    store.updateElement(1, { element_type: "B" });
    store.addQuest(1);

    store.duplicateElement(0);

    expect(store.definition.elements.map((element) => element.element_type)).toEqual([
      "A",
      "A",
      "B",
    ]);
    expect(store.definition.elements[1].quests[0]).toMatchObject({
      quest_id: 201,
      quest_title: "Q0",
    });
    expect(store.definition.elements[2].quests[0].quest_id).toBe(301);
    expect(store.selectedElementIndex).toBe(1);
    expect(store.selectedQuestIndex).toBe(0);
  });

  it("duplicates a quest and preserves dependency relationships", () => {
    const store = useQuestStore();
    store.resetDefinition();
    store.addElement();
    store.addQuest(0);
    store.updateQuest(0, 0, { quest_title: "Q0" });
    store.addQuest(0);
    store.updateQuest(0, 1, {
      quest_title: "Q1",
      _deps: [{ question_id: 101, required_value: "yes" }],
    });

    store.duplicateQuest(0, 1);

    const quests = store.definition.elements[0].quests;
    expect(quests.map((quest) => quest.quest_id)).toEqual([101, 102, 103]);
    expect(quests[2].quest_title).toBe("Q1");
    expect(quests[2]._deps[0].question_id).toBe(101);
    expect(store.selectedQuestIndex).toBe(2);
  });

  it("duplicates choices, feature presets, and custom icons as independent copies", () => {
    const store = useQuestStore();
    store.resetDefinition();
    store.addElement();
    store.addQuest(0);
    store.addChoice(0, 0);
    store.updateChoice(0, 0, 0, { value: "yes" });
    store.duplicateChoice(0, 0, 0);
    store.updateChoice(0, 0, 1, { value: "copied" });

    store.addFeaturePreset();
    store.updateFeaturePreset(0, {
      name: "Bench",
      icon: "preset_temaki_bench",
      tags: { amenity: "bench" },
    });
    store.duplicateFeaturePreset(0);
    store.updateFeaturePreset(1, { name: "Copied bench" });

    store.addCustomIcon();
    store.updateCustomIcon(0, {
      name: "lamp",
      url: "https://example.com/lamp.svg",
    });
    store.duplicateCustomIcon(0);
    store.updateCustomIcon(1, { name: "copied-lamp" });

    expect(
      store.definition.elements[0].quests[0].quest_answer_choices.map(
        (choice) => choice.value
      )
    ).toEqual(["yes", "copied"]);
    expect(store.definition["feature-presets"].map((preset) => preset.name)).toEqual([
      "Bench",
      "Copied bench",
    ]);
    expect(store.definition["custom-icons"].map((icon) => icon.name)).toEqual([
      "lamp",
      "copied-lamp",
    ]);
  });
});
