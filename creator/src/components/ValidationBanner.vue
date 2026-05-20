<!-- @format -->

<script setup>
import { computed } from "vue";
import { useQuestStore } from "../stores/questStore";

const store = useQuestStore();

function formatPath(instancePath) {
    if (!instancePath) return "root";

    return instancePath
        .split("/")
        .filter(Boolean)
        .map((segment) => (String(Number(segment)) === segment ? `[${segment}]` : segment))
        .join(".")
        .replace(/\.\[(\d+)\]/g, "[$1]");
}

const validationErrors = computed(() => store.validationErrors);
</script>

<template>
    <div
        v-if="validationErrors.length > 0"
        class="alert alert-warning py-2 px-3 mb-0"
        role="alert"
    >
        <div class="d-flex align-items-center justify-content-between gap-2 flex-wrap mb-2">
            <strong class="small">Validation issues</strong>
            <span class="small text-muted">Export is blocked until these are fixed.</span>
        </div>

        <ul class="small mb-0 ps-3">
            <li v-for="error in validationErrors" :key="`${error.instancePath}-${error.keyword}-${error.message}`">
                <span class="fw-semibold">{{ formatPath(error.instancePath) }}</span>
                <span class="text-muted">: {{ error.message }}</span>
            </li>
        </ul>
    </div>

    <div v-else class="alert alert-success py-2 px-3 mb-0 small" role="status">
        Definition is valid.
    </div>
</template>
