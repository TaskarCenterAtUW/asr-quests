<!-- @format -->

<script setup>
import { ref, computed } from "vue";
import { useQuestStore } from "../stores/questStore";
import ElementEditor from "./ElementEditor.vue";
import JsonPreview from "./JsonPreview.vue";
import ValidationBanner from "./ValidationBanner.vue";
import ExportPanel from "./ExportPanel.vue";
import icons from "../assets/icons.json";

const store = useQuestStore();

const selectedIndex = ref(null);

const elements = computed(() => store.definition.elements);

function iconUrl(name) {
    return icons.find((i) => i.name === name)?.url ?? null;
}

function select(index) {
    selectedIndex.value = index;
}

function addElement() {
    store.addElement();
    selectedIndex.value = elements.value.length - 1;
}

function removeElement(index) {
    store.removeElement(index);
    if (selectedIndex.value === index) {
        selectedIndex.value =
            elements.value.length > 0
                ? Math.min(index, elements.value.length - 1)
                : null;
    } else if (selectedIndex.value > index) {
        selectedIndex.value--;
    }
}
</script>

<template>
    <div class="row g-0">
        <!-- Left: list -->
        <div class="col-3 col-xl-2 border-end d-flex flex-column">
            <div
                class="px-2 py-2 border-bottom d-flex justify-content-between align-items-center"
            >
                <span class="fw-semibold small text-uppercase text-muted"
                    >Elements</span
                >
                <button
                    type="button"
                    class="btn btn-sm btn-primary"
                    @click="addElement"
                    aria-label="Add element"
                >
                    + Add
                </button>
            </div>

            <ul
                class="list-group list-group-flush flex-grow-1 overflow-auto small"
                role="listbox"
                aria-label="Elements"
            >
                <li
                    v-for="(el, i) in elements"
                    :key="i"
                    role="option"
                    :aria-selected="selectedIndex === i"
                    class="list-group-item list-group-item-action d-flex align-items-center gap-2 py-2 px-2"
                    :class="{ active: selectedIndex === i }"
                    style="cursor: pointer"
                    @click="select(i)"
                >
                    <!-- Icon thumbnail -->
                    <img
                        v-if="iconUrl(el.element_type_icon)"
                        :src="iconUrl(el.element_type_icon)"
                        :alt="el.element_type_icon"
                        width="24"
                        height="24"
                        class="rounded flex-shrink-0"
                    />
                    <span
                        v-else
                        class="rounded bg-secondary flex-shrink-0 d-inline-block"
                        style="width: 24px; height: 24px"
                        aria-hidden="true"
                    ></span>

                    <span class="flex-grow-1 text-truncate small">
                        {{ el.element_type || "(unnamed)" }}
                    </span>
                    <span
                        class="badge bg-secondary rounded-pill flex-shrink-0"
                        :aria-label="`${el.quests.length} quests`"
                    >
                        {{ el.quests.length }}
                    </span>
                </li>

                <li
                    v-if="elements.length === 0"
                    class="list-group-item text-muted small fst-italic py-3 text-center"
                >
                    No elements yet
                </li>
            </ul>
        </div>

        <!-- Right: editor -->
        <div class="col-9 col-xl-10 p-2 p-lg-3">
            <div v-if="selectedIndex !== null && elements[selectedIndex]" class="d-grid gap-3">
                <div
                    class="d-flex justify-content-between align-items-center mb-2"
                >
                    <h2 class="h6 mb-0 fw-semibold">
                        Element {{ selectedIndex + 1 }}
                        <span
                            v-if="elements[selectedIndex].element_type"
                            class="text-muted fw-normal"
                        >
                            — {{ elements[selectedIndex].element_type }}
                        </span>
                    </h2>
                    <div class="d-flex gap-1">
                        <button
                            type="button"
                            class="btn btn-sm btn-outline-secondary py-1 px-2"
                            :disabled="selectedIndex === 0"
                            aria-label="Move element up"
                            @click="
                                store.moveElementUp(selectedIndex);
                                selectedIndex--;
                            "
                        >
                            ↑
                        </button>
                        <button
                            type="button"
                            class="btn btn-sm btn-outline-secondary py-1 px-2"
                            :disabled="selectedIndex === elements.length - 1"
                            aria-label="Move element down"
                            @click="
                                store.moveElementDown(selectedIndex);
                                selectedIndex++;
                            "
                        >
                            ↓
                        </button>
                        <button
                            type="button"
                            class="btn btn-sm btn-outline-danger py-1 px-2"
                            aria-label="Delete element"
                            @click="removeElement(selectedIndex)"
                        >
                            Delete
                        </button>
                    </div>
                </div>

                <ElementEditor :element-index="selectedIndex" />
            </div>

            <div v-else class="text-muted text-center mt-4 fst-italic small">
                {{
                    elements.length === 0
                        ? "Add an element to get started."
                        : "Select an element to edit it."
                }}
            </div>

            <div class="mt-3 d-grid gap-3">
                <ValidationBanner />

                <div class="card shadow-sm">
                    <div class="card-header py-2 px-3 d-flex justify-content-between align-items-center">
                        <span class="fw-semibold small text-uppercase text-muted">JSON Preview</span>
                    </div>
                    <div class="card-body p-2">
                        <JsonPreview />
                    </div>
                </div>

                <div class="card shadow-sm">
                    <div class="card-header py-2 px-3 d-flex justify-content-between align-items-center">
                        <span class="fw-semibold small text-uppercase text-muted">Export</span>
                    </div>
                    <div class="card-body p-2">
                        <ExportPanel />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
