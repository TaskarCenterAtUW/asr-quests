<!-- @format -->

<script setup>
import { ref, computed } from "vue";
import icons from "../assets/icons.json";

const props = defineProps({
    modelValue: { type: String, default: "" },
});
const emit = defineEmits(["update:modelValue"]);

const filter = ref("");
const open = ref(false);
const searchId = `icon-search-${Math.random().toString(36).slice(2)}`;

const filtered = computed(() => {
    const q = filter.value.trim().toLowerCase();
    return q ? icons.filter((i) => i.name.toLowerCase().includes(q)) : icons;
});

const selected = computed(
    () => icons.find((i) => i.name === props.modelValue) || null
);

function pick(icon) {
    emit("update:modelValue", icon.name);
    open.value = false;
    filter.value = "";
}

function clear() {
    emit("update:modelValue", "");
}

function openPicker() {
    open.value = true;
    filter.value = "";
}
</script>

<template>
    <!-- Selected preview + trigger -->
    <div class="d-flex align-items-center gap-2 flex-wrap">
        <img
            v-if="selected"
            :src="selected.url"
            :alt="selected.name"
            width="40"
            height="40"
            class="rounded border"
        />
        <span v-if="selected" class="small text-muted">{{
            selected.name
        }}</span>
        <span v-else class="small text-muted fst-italic">No icon selected</span>

        <button
            type="button"
            class="btn btn-sm btn-outline-secondary"
            @click="openPicker"
        >
            {{ selected ? "Change Icon" : "Pick Icon" }}
        </button>
        <button
            v-if="selected"
            type="button"
            class="btn btn-sm btn-outline-danger"
            @click="clear"
            aria-label="Clear icon"
        >
            &times;
        </button>
    </div>

    <!-- Picker panel -->
    <div
        v-if="open"
        class="border rounded p-2 mt-2 bg-white"
        role="dialog"
        aria-modal="true"
        aria-label="Icon picker"
    >
        <div class="mb-2">
            <label :for="searchId" class="visually-hidden">Filter icons</label>
            <input
                :id="searchId"
                v-model="filter"
                type="search"
                class="form-control form-control-sm"
                placeholder="Filter icons…"
                autocomplete="off"
            />
        </div>

        <!-- Scrollable grid -->
        <div
            class="overflow-auto"
            style="max-height: 260px"
            role="listbox"
            :aria-label="`Icon list, ${filtered.length} icons`"
        >
            <div class="d-flex flex-wrap gap-1">
                <button
                    v-for="icon in filtered"
                    :key="icon.name"
                    type="button"
                    role="option"
                    :aria-selected="icon.name === modelValue"
                    :title="icon.name"
                    class="btn btn-sm p-1 border"
                    :class="
                        icon.name === modelValue
                            ? 'btn-primary'
                            : 'btn-outline-secondary'
                    "
                    @click="pick(icon)"
                >
                    <img
                        :src="icon.url"
                        :alt="icon.name"
                        width="32"
                        height="32"
                    />
                </button>
            </div>

            <p
                v-if="filtered.length === 0"
                class="text-muted small text-center py-2 mb-0"
            >
                No icons match "{{ filter }}"
            </p>
        </div>

        <div class="mt-2 text-end">
            <button
                type="button"
                class="btn btn-sm btn-secondary"
                @click="open = false"
            >
                Close
            </button>
        </div>
    </div>
</template>
