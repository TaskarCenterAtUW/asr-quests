import { nextTick } from "vue";
import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useQuestStore } from "./questStore";

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

beforeEach(() => {
    setActivePinia(createPinia());
    globalThis.window = { localStorage: createStorage() };
});

describe("v3.2 definition state", () => {
    it("creates a v3.2 definition with the default recency period", () => {
        const store = useQuestStore();

        expect(store.definition).toMatchObject({
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
