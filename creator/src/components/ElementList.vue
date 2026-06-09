<!-- @format -->

<script setup>
import { computed, nextTick, ref, watch } from "vue";
import { useQuestStore } from "../stores/questStore";
import ElementEditor from "./ElementEditor.vue";
import JsonPreview from "./JsonPreview.vue";
import ValidationBanner from "./ValidationBanner.vue";
import ExportPanel from "./ExportPanel.vue";
import icons from "../assets/icons.json";
import { elementPresetLibrary } from "../assets/questTemplates";

const store = useQuestStore();
const addElementButton = ref(null);
const elementButtons = ref([]);
const questTreeButtons = ref({});
const expandedElements = ref(new Set());
const elements = computed(() => store.definition.elements);
const selectedIndex = computed(() => store.selectedElementIndex);
const selectedQuestIndex = computed(() => store.selectedQuestIndex);

function iconUrl(name) {
    if (!name) return null;
    return icons.find((icon) => icon.name === name)?.url ?? null;
}

function setElementButtonRef(element, index) {
    if (element) {
        elementButtons.value[index] = element;
        return;
    }

    delete elementButtons.value[index];
}

function setQuestTreeButtonRef(element, elementIndex, questIndex) {
    const key = `${elementIndex}-${questIndex}`;
    if (element) {
        questTreeButtons.value[key] = element;
        return;
    }

    delete questTreeButtons.value[key];
}

function focusElement(index) {
    nextTick(() => {
        if (index == null) {
            addElementButton.value?.focus();
            return;
        }

        elementButtons.value[index]?.focus();
    });
}

function focusQuestTreeItem(elementIndex, questIndex) {
    nextTick(() => {
        questTreeButtons.value[`${elementIndex}-${questIndex}`]?.focus();
    });
}

function isExpanded(index) {
    return expandedElements.value.has(index);
}

function toggleElementExpanded(index) {
    const nextExpanded = new Set(expandedElements.value);
    if (nextExpanded.has(index)) {
        nextExpanded.delete(index);
    } else {
        nextExpanded.add(index);
    }
    expandedElements.value = nextExpanded;
}

function ensureExpanded(index) {
    const nextExpanded = new Set(expandedElements.value);
    nextExpanded.add(index);
    expandedElements.value = nextExpanded;
}

function shiftExpandedAfterRemove(index) {
    const nextExpanded = new Set();

    expandedElements.value.forEach((expandedIndex) => {
        if (expandedIndex < index) {
            nextExpanded.add(expandedIndex);
        } else if (expandedIndex > index) {
            nextExpanded.add(expandedIndex - 1);
        }
    });

    expandedElements.value = nextExpanded;
}

function swapExpandedIndices(firstIndex, secondIndex) {
    const nextExpanded = new Set();

    expandedElements.value.forEach((expandedIndex) => {
        if (expandedIndex === firstIndex) {
            nextExpanded.add(secondIndex);
        } else if (expandedIndex === secondIndex) {
            nextExpanded.add(firstIndex);
        } else {
            nextExpanded.add(expandedIndex);
        }
    });

    expandedElements.value = nextExpanded;
}

function select(index) {
    store.selectElement(index);
}

function selectQuestFromTree(elementIndex, questIndex) {
    ensureExpanded(elementIndex);
    store.selectElement(elementIndex);
    store.selectQuest(questIndex);
    focusQuestTreeItem(elementIndex, questIndex);
}

function addElement() {
    store.addElement();
    focusElement(store.selectedElementIndex);
}

function applyElementPreset(preset) {
    if (selectedIndex.value == null) {
        return;
    }

    store.applyElementPreset(selectedIndex.value, preset);
}

function removeElement(index) {
    shiftExpandedAfterRemove(index);
    store.removeElement(index);
    focusElement(store.selectedElementIndex);
}

function moveElementUp(index) {
    if (index === 0) {
        return;
    }

    swapExpandedIndices(index, index - 1);
    store.moveElementUp(index);
    focusElement(index - 1);
}

function moveElementDown(index) {
    if (index >= elements.value.length - 1) {
        return;
    }

    swapExpandedIndices(index, index + 1);
    store.moveElementDown(index);
    focusElement(index + 1);
}

watch(
    [selectedIndex, selectedQuestIndex],
    ([elementIndex, questIndex]) => {
        if (elementIndex != null && questIndex != null) {
            ensureExpanded(elementIndex);
        }
    },
    { immediate: true }
);
</script>

<template>
    <div class="creator-workspace">
        <aside class="creator-sidebar creator-surface-card">
            <div
                class="creator-sidebar-header d-flex justify-content-center align-items-center position-relative"
            >
                <span class="fw-semibold small text-uppercase text-muted"
                    >Elements</span
                >
                <div class="creator-card-info-wrap">
                    <button
                        type="button"
                        class="creator-card-info-btn"
                        aria-label="About the Elements panel: Elements represent the types of map features you are collecting data on (e.g. Sidewalk, Curb Ramp). Add quests to each element to define the survey questions shown to field data collectors."
                    >
                        <svg
                            aria-hidden="true"
                            viewBox="0 0 16 16"
                            width="15"
                            height="15"
                            fill="currentColor"
                        >
                            <path
                                d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"
                            />
                        </svg>
                    </button>
                    <div role="tooltip" class="creator-card-tooltip">
                        Elements represent types of map features you are
                        collecting data on (e.g. Sidewalk, Curb Ramp). Add
                        quests to each element to define the survey questions
                        shown to field data collectors.
                    </div>
                </div>
            </div>

            <div class="creator-sidebar-scroll">
                <ul
                    class="list-unstyled mb-0 d-grid gap-2"
                    aria-label="Elements"
                >
                    <li
                        v-for="(el, i) in elements"
                        :key="`element-${i}`"
                        class="creator-tree-item"
                    >
                        <div class="creator-tree-row">
                            <button
                                v-if="el.quests.length > 0"
                                type="button"
                                class="creator-tree-toggle"
                                :aria-expanded="isExpanded(i)"
                                :aria-controls="`element-quests-${i}`"
                                :aria-label="`${isExpanded(i) ? 'Collapse' : 'Expand'} quests for ${el.element_type || 'this element'}`"
                                @click.stop="toggleElementExpanded(i)"
                            >
                                <span aria-hidden="true">{{
                                    isExpanded(i) ? "▾" : "▸"
                                }}</span>
                            </button>
                            <span
                                v-else
                                class="creator-tree-toggle creator-tree-toggle-placeholder"
                                aria-hidden="true"
                            ></span>

                            <button
                                :ref="
                                    (element) => setElementButtonRef(element, i)
                                "
                                type="button"
                                class="element-list-button d-flex align-items-center gap-2 py-2 px-2"
                                :class="{ active: selectedIndex === i }"
                                @click="select(i)"
                            >
                                <span
                                    class="creator-tree-icon-shell"
                                    aria-hidden="true"
                                >
                                    <img
                                        v-if="iconUrl(el.element_type_icon)"
                                        :src="iconUrl(el.element_type_icon)"
                                        alt=""
                                        width="24"
                                        height="24"
                                        class="creator-tree-icon-art"
                                    />
                                    <span
                                        v-else
                                        class="creator-tree-icon-placeholder"
                                    ></span>
                                </span>

                                <span
                                    class="flex-grow-1 text-truncate text-start small fw-semibold"
                                >
                                    {{ el.element_type || "(unnamed)" }}
                                </span>
                                <span
                                    class="badge text-bg-secondary rounded-pill flex-shrink-0"
                                    :aria-label="`${el.quests.length} quests`"
                                >
                                    {{ el.quests.length }}
                                </span>
                            </button>
                        </div>

                        <ul
                            v-if="isExpanded(i)"
                            :id="`element-quests-${i}`"
                            class="list-unstyled quest-tree-list"
                        >
                            <li
                                v-for="(quest, questIndex) in el.quests"
                                :key="`tree-quest-${quest.quest_id}-${questIndex}`"
                            >
                                <button
                                    :ref="
                                        (element) =>
                                            setQuestTreeButtonRef(
                                                element,
                                                i,
                                                questIndex
                                            )
                                    "
                                    type="button"
                                    class="quest-tree-button"
                                    :class="{
                                        active:
                                            selectedIndex === i &&
                                            selectedQuestIndex === questIndex,
                                    }"
                                    @click="selectQuestFromTree(i, questIndex)"
                                >
                                    <span class="small text-muted flex-shrink-0"
                                        >#{{ quest.quest_id }}</span
                                    >
                                    <span class="text-truncate flex-grow-1">
                                        {{
                                            quest.quest_title ||
                                            "(untitled quest)"
                                        }}
                                    </span>
                                </button>
                            </li>

                            <li
                                v-if="el.quests.length === 0"
                                class="small text-muted fst-italic px-2 py-1"
                            >
                                No quests yet.
                            </li>
                        </ul>
                    </li>

                    <li
                        v-if="elements.length === 0"
                        class="small text-muted fst-italic text-center py-4"
                    >
                        No elements yet.
                    </li>
                </ul>
            </div>

            <div class="creator-sidebar-footer">
                <button
                    ref="addElementButton"
                    type="button"
                    class="btn btn-sm btn-primary creator-add-button w-100"
                    @click="addElement"
                    aria-label="Add element"
                >
                    <span class="creator-button-plus" aria-hidden="true"
                        >+</span
                    >
                    <span>Add Element</span>
                </button>
            </div>
        </aside>

        <section class="creator-main">
            <div class="creator-main-layout">
                <section class="creator-editor-pane">
                    <div class="card creator-surface-card creator-panel-card">
                        <div
                            class="card-header d-flex justify-content-center align-items-center position-relative"
                        >
                            <span
                                class="fw-semibold small text-uppercase text-muted"
                                >Editor</span
                            >
                            <div class="creator-card-info-wrap">
                                <button
                                    type="button"
                                    class="creator-card-info-btn"
                                    aria-label="About the Editor panel: Select or add elements and quests to build your quest definition. Each element represents a map feature type, and each quest is a question shown to data collectors."
                                >
                                    <svg
                                        aria-hidden="true"
                                        viewBox="0 0 16 16"
                                        width="15"
                                        height="15"
                                        fill="currentColor"
                                    >
                                        <path
                                            d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"
                                        />
                                    </svg>
                                </button>
                                <div
                                    role="tooltip"
                                    class="creator-card-tooltip"
                                >
                                    Select or add elements and quests to build
                                    your quest definition. Each element
                                    represents a map feature type, and each
                                    quest is a question shown to data
                                    collectors.
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <template
                                v-if="
                                    selectedIndex !== null &&
                                    elements[selectedIndex]
                                "
                            >
                                <h2 class="h5 mb-0 fw-semibold">
                                    Element {{ selectedIndex + 1 }}
                                    <span
                                        v-if="
                                            elements[selectedIndex].element_type
                                        "
                                        class="text-muted fw-normal"
                                    >
                                        -
                                        {{
                                            elements[selectedIndex].element_type
                                        }}
                                    </span>
                                </h2>

                                <div
                                    class="d-flex gap-2 flex-wrap creator-editor-actions mt-3"
                                >
                                    <div class="dropdown">
                                        <button
                                            type="button"
                                            class="btn btn-sm btn-outline-primary dropdown-toggle creator-toolbar-button"
                                            data-bs-toggle="dropdown"
                                            data-bs-display="static"
                                            aria-expanded="false"
                                        >
                                            Element Presets
                                        </button>

                                        <ul
                                            class="dropdown-menu dropdown-menu-end creator-preset-menu"
                                        >
                                            <li>
                                                <h6 class="dropdown-header">
                                                    Common element presets
                                                </h6>
                                            </li>

                                            <li
                                                v-for="preset in elementPresetLibrary"
                                                :key="preset.id"
                                            >
                                                <button
                                                    type="button"
                                                    class="dropdown-item"
                                                    @click="
                                                        applyElementPreset(
                                                            preset
                                                        )
                                                    "
                                                >
                                                    <span class="fw-semibold">{{
                                                        preset.label
                                                    }}</span>
                                                </button>
                                            </li>
                                        </ul>
                                    </div>

                                    <button
                                        type="button"
                                        class="btn btn-sm btn-outline-secondary creator-toolbar-button"
                                        :disabled="selectedIndex === 0"
                                        aria-label="Move element up"
                                        @click="moveElementUp(selectedIndex)"
                                    >
                                        <svg
                                            aria-hidden="true"
                                            viewBox="0 0 16 16"
                                            class="creator-button-icon"
                                        >
                                            <path
                                                fill="currentColor"
                                                d="M8 2.5L3.5 7h3v6h3V7h3L8 2.5z"
                                            />
                                        </svg>
                                        <span>Move Up</span>
                                    </button>
                                    <button
                                        type="button"
                                        class="btn btn-sm btn-outline-secondary creator-toolbar-button"
                                        :disabled="
                                            selectedIndex ===
                                            elements.length - 1
                                        "
                                        aria-label="Move element down"
                                        @click="moveElementDown(selectedIndex)"
                                    >
                                        <svg
                                            aria-hidden="true"
                                            viewBox="0 0 16 16"
                                            class="creator-button-icon"
                                        >
                                            <path
                                                fill="currentColor"
                                                d="M8 13.5L12.5 9h-3V3h-3v6h-3L8 13.5z"
                                            />
                                        </svg>
                                        <span>Move Down</span>
                                    </button>
                                    <button
                                        type="button"
                                        class="btn btn-sm btn-outline-danger creator-toolbar-button"
                                        aria-label="Delete element"
                                        @click="removeElement(selectedIndex)"
                                    >
                                        <svg
                                            aria-hidden="true"
                                            viewBox="0 0 16 16"
                                            class="creator-button-icon"
                                        >
                                            <path
                                                fill="currentColor"
                                                d="M6 2h4l1 1h3v2H2V3h3l1-1zm-1 4h1v6H5V6zm3 0h1v6H8V6zm3 0h1v6h-1V6zM4 14h8a1 1 0 0 0 1-1V5H3v8a1 1 0 0 0 1 1z"
                                            />
                                        </svg>
                                        <span>Delete Element</span>
                                    </button>
                                </div>

                                <div class="mt-3">
                                    <ElementEditor
                                        :element-index="selectedIndex"
                                    />
                                </div>
                            </template>

                            <div
                                v-else
                                class="creator-empty-state text-center text-muted fst-italic"
                            >
                                {{
                                    elements.length === 0
                                        ? "Add an element to get started!"
                                        : "Select an element to edit it."
                                }}
                            </div>
                        </div>
                    </div>
                </section>

                <aside class="creator-utility-pane d-grid gap-3">
                    <div class="card creator-surface-card creator-panel-card">
                        <div
                            class="card-header d-flex justify-content-center align-items-center position-relative"
                        >
                            <span
                                class="fw-semibold small text-uppercase text-muted"
                                >Validation</span
                            >
                            <div class="creator-card-info-wrap">
                                <button
                                    type="button"
                                    class="creator-card-info-btn"
                                    aria-label="About the Validation panel: Shows errors in your quest definition. All errors must be resolved before exporting."
                                >
                                    <svg
                                        aria-hidden="true"
                                        viewBox="0 0 16 16"
                                        width="15"
                                        height="15"
                                        fill="currentColor"
                                    >
                                        <path
                                            d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"
                                        />
                                    </svg>
                                </button>
                                <div
                                    role="tooltip"
                                    class="creator-card-tooltip"
                                >
                                    Shows errors in your quest definition. All
                                    errors must be resolved before exporting.
                                </div>
                            </div>
                        </div>
                        <div class="card-body creator-validation-body">
                            <ValidationBanner />
                        </div>
                    </div>

                    <div class="card creator-surface-card creator-panel-card">
                        <div
                            class="card-header d-flex justify-content-center align-items-center position-relative"
                        >
                            <span
                                class="fw-semibold small text-uppercase text-muted"
                                >JSON Preview</span
                            >
                            <div class="creator-card-info-wrap">
                                <button
                                    type="button"
                                    class="creator-card-info-btn"
                                    aria-label="About the JSON Preview panel: A live preview of your quest definition in the machine-readable format that AVIV ScoutRoute reads and turns into the quest forms shown to data collectors."
                                >
                                    <svg
                                        aria-hidden="true"
                                        viewBox="0 0 16 16"
                                        width="15"
                                        height="15"
                                        fill="currentColor"
                                    >
                                        <path
                                            d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"
                                        />
                                    </svg>
                                </button>
                                <div
                                    role="tooltip"
                                    class="creator-card-tooltip"
                                >
                                    A live preview of your quest definition in
                                    the machine-readable format that AVIV
                                    ScoutRoute reads and turns into the quest
                                    forms shown to data collectors.
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <JsonPreview />
                        </div>
                    </div>

                    <div class="card creator-surface-card creator-panel-card">
                        <div
                            class="card-header d-flex justify-content-center align-items-center position-relative"
                        >
                            <span
                                class="fw-semibold small text-uppercase text-muted"
                                >Export</span
                            >
                            <div class="creator-card-info-wrap">
                                <button
                                    type="button"
                                    class="creator-card-info-btn"
                                    aria-label="About the Export panel: Download your quest definition as a JSON file, or copy it to the clipboard."
                                >
                                    <svg
                                        aria-hidden="true"
                                        viewBox="0 0 16 16"
                                        width="15"
                                        height="15"
                                        fill="currentColor"
                                    >
                                        <path
                                            d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"
                                        />
                                    </svg>
                                </button>
                                <div
                                    role="tooltip"
                                    class="creator-card-tooltip"
                                >
                                    Download your quest definition as a JSON
                                    file, or copy it to the clipboard.
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <ExportPanel />
                        </div>
                    </div>
                </aside>
            </div>
        </section>
    </div>
</template>

<style scoped>
.creator-workspace {
    display: grid;
    gap: 1rem;
    padding: 0.75rem;
}

.creator-sidebar,
.creator-main {
    min-height: 0;
}

.creator-sidebar {
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.creator-tree-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.creator-tree-icon-shell {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    flex-shrink: 0;
    border-radius: 50%;
    overflow: hidden;
}

.creator-tree-icon-art,
.creator-tree-icon-placeholder {
    width: 100%;
    height: 100%;
}

.creator-editor-actions {
    row-gap: 0.5rem;
}

.creator-toolbar-button {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
}

.creator-button-icon {
    width: 0.95rem;
    height: 0.95rem;
    flex-shrink: 0;
}

.creator-preset-menu {
    min-width: 21rem;
}

.creator-tree-toggle {
    width: 2rem;
    height: 2rem;
}

.creator-tree-toggle-placeholder {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    pointer-events: none;
}

.element-list-button,
.quest-tree-button {
    width: 100%;
    min-width: 0;
    color: inherit;
    text-align: left;
}

.element-list-button {
    padding: 0.65rem 0.75rem;
}

.quest-tree-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    overflow: hidden;
}

.quest-tree-button .text-truncate {
    min-width: 0;
    flex: 1 1 0;
}

.quest-tree-list {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 0.35rem;
    margin: 0.35rem 0 0 2.4rem;
    padding-left: 0.65rem;
}

.creator-main-layout {
    display: grid;
    gap: 1rem;
}

.creator-editor-pane,
.creator-utility-pane {
    min-width: 0;
}

@media (min-width: 992px) {
    /*
     * Layout philosophy: creator-workspace is the ONE scroll container.
     * creator-sidebar is sticky within it. creator-main has NO overflow
     * so card box-shadows bleed freely across column gaps without clipping.
     */
    .creator-workspace {
        container-type: size; /* enable cqh for sidebar height auto-adaptation */
        grid-template-columns: minmax(280px, 320px) minmax(0, 1fr);
        height: 100%;
        padding: 1.25rem;
        gap: 1.25rem;
        overflow-y: auto;
        overflow-x: clip;
        overflow-clip-margin: 3rem; /* allow card shadows to bleed past the left/right workspace edge */
        align-items: start; /* rows grow to content, not forced equal height */
    }

    .creator-sidebar {
        position: sticky;
        top: 0;
        /* 100cqh = workspace height — auto-adapts as navbar/footer heights change;
           subtract 2×1.25rem workspace padding to fit exactly within the content area */
        height: calc(100cqh - 2.5rem);
    }

    .creator-sidebar-scroll {
        flex: 1 1 0;
        min-height: 0;
        overflow-y: auto;
        overflow-x: hidden;
    }

    /* creator-main: no overflow — shadows render freely */
    .creator-main {
        overflow: visible;
    }

    .creator-main-layout {
        grid-template-columns: minmax(0, 1.45fr) minmax(320px, 0.9fr);
        align-items: start;
        padding-bottom: 3.5rem;
        gap: 1.25rem;
    }

    /* clip button hover-glows to utility card boundaries without affecting the editor card */
    .creator-utility-pane .card-body {
        overflow: hidden;
    }
}

.creator-card-info-wrap {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
}

.creator-card-info-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.25rem;
    height: 1.25rem;
    border: none;
    background: transparent;
    color: var(--bs-secondary-color);
    cursor: pointer;
    border-radius: 50%;
    padding: 0;
}

.creator-card-info-btn:hover,
.creator-card-info-btn:focus-visible {
    color: var(--creator-primary, #7c3aed);
    outline: 1.5px solid var(--creator-primary, #7c3aed);
    outline-offset: 2px;
}

.creator-card-tooltip {
    visibility: hidden;
    opacity: 0;
    position: absolute;
    right: 0;
    top: calc(100% + 6px);
    min-width: 14rem;
    max-width: 22rem;
    background-color: var(--creator-surface-muted);
    background-image: none;
    border: 1px solid var(--creator-surface-border);
    border-radius: 6px;
    padding: 0.5rem 0.625rem;
    font-size: 0.75rem;
    line-height: 1.5;
    color: var(--bs-body-color);
    z-index: 1060;
    isolation: isolate;
    text-align: left;
    font-weight: 400;
    text-transform: none;
    letter-spacing: normal;
    white-space: normal;
    pointer-events: none;
}

.creator-card-info-wrap:hover .creator-card-tooltip,
.creator-card-info-wrap:focus-within .creator-card-tooltip {
    visibility: visible;
    opacity: 1;
    pointer-events: auto;
}

/* Ensure card-header stacks above card-body within backdrop-filter stacking context */
.card-header,
.creator-sidebar-header {
    position: relative;
    z-index: 1;
}

.creator-validation-body {
    max-height: min(20rem, 45vh);
    overflow-y: auto;
    overflow-x: hidden;
}
</style>
