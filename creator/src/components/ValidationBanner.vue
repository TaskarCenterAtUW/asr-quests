<!-- @format -->

<script setup>
import { computed } from "vue";
import { useQuestStore } from "../stores/questStore";

const store = useQuestStore();

function formatPath(instancePath) {
    if (!instancePath) {
        return "root";
    }

    return instancePath
        .split("/")
        .filter(Boolean)
        .map((segment) =>
            String(Number(segment)) === segment
                ? `[${Number(segment) + 1}]`
                : segment
        )
        .join(".")
        .replace(/\.\[(\d+)\]/g, "[$1]");
}

const validationErrors = computed(() => store.validationErrors);
const validationWarnings = computed(() => store.validationWarnings);
const canUpgradeVersion = computed(() =>
    validationWarnings.value.some(
        (warning) => warning.keyword === "outdated-version"
    )
);
</script>

<template>
    <div class="d-grid gap-2">
        <div
            v-if="validationErrors.length > 0"
            class="alert alert-danger py-2 px-3 mb-0"
            role="alert"
        >
            <div
                class="d-flex align-items-center justify-content-between gap-2 flex-wrap mb-2"
            >
                <strong class="small">Validation issues</strong>
                <span class="small text-muted"
                    >Export is blocked until these are fixed.</span
                >
            </div>

            <ul class="small mb-0 ps-3">
                <li
                    v-for="error in validationErrors"
                    :key="`${error.instancePath}-${error.keyword}-${error.message}`"
                >
                    <span class="fw-semibold">{{
                        formatPath(error.instancePath)
                    }}</span>
                    <span class="text-muted">: {{ error.message }}</span>
                </li>
            </ul>
        </div>

        <div
            v-if="validationWarnings.length > 0"
            class="alert alert-warning py-2 px-3 mb-0"
            role="status"
        >
            <div
                class="d-flex align-items-center justify-content-between gap-2 flex-wrap mb-2"
            >
                <strong class="small">Warnings</strong>
                <div class="d-flex align-items-center gap-2 flex-wrap">
                    <span class="small text-muted"
                        >Warnings do not block export.</span
                    >
                    <button
                        v-if="canUpgradeVersion"
                        type="button"
                        class="btn btn-sm btn-outline-secondary"
                        @click="store.upgradeDefinitionVersion()"
                    >
                        Upgrade to {{ store.latestDefinitionVersion }}
                    </button>
                </div>
            </div>

            <ul class="small mb-0 ps-3">
                <li
                    v-for="warning in validationWarnings"
                    :key="`${warning.instancePath}-${warning.keyword}-${warning.message}`"
                >
                    <span class="fw-semibold">{{
                        formatPath(warning.instancePath)
                    }}</span>
                    <span class="text-muted">: {{ warning.message }}</span>
                </li>
            </ul>
        </div>

        <div
            v-if="
                validationErrors.length === 0 && validationWarnings.length === 0
            "
            class="alert alert-success py-2 px-3 mb-0 small"
            role="status"
        >
            Definition is current and valid.
        </div>
    </div>
</template>

<style>
/* wrap long validation paths instead of underflowing off the right edge,
   matching the JSON Preview line-wrapping behavior */
.creator-validation-body li {
    overflow-wrap: anywhere;
    word-break: break-word;
}

.creator-validation-body ul {
    min-width: 0;
}
</style>
