<!-- @format -->

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import WelcomeScreen from "./components/WelcomeScreen.vue";
import ElementList from "./components/ElementList.vue";
import { useQuestStore } from "./stores/questStore";

const THEME_MODE_KEY = "quest-creator:theme-mode";
const THEME_MODES = ["light", "dark", "auto"];

function normalizeThemeMode(value) {
    return THEME_MODES.includes(value) ? value : "auto";
}

function readStoredThemeMode() {
    if (typeof window === "undefined") {
        return "auto";
    }

    return normalizeThemeMode(window.localStorage.getItem(THEME_MODE_KEY));
}

const store = useQuestStore();
const currentView = ref(store.editorStarted ? "editor" : "welcome");
const themeMode = ref(readStoredThemeMode());
const systemPrefersDark = ref(false);

let colorSchemeQuery = null;
let colorSchemeHandler = null;

const resolvedTheme = computed(() => {
    if (themeMode.value === "auto") {
        return systemPrefersDark.value ? "dark" : "light";
    }

    return themeMode.value;
});

const navbarStatus = computed(() => {
    if (store.persistenceError) {
        return {
            className: "text-warning",
            text: store.persistenceError,
        };
    }

    if (currentView.value !== "editor") {
        return {
            className: "text-white-50",
            text: "Build, edit, validate, and export long form quest definitions",
        };
    }

    return {
        className: "text-white-50",
        text: store.restoredDraft
            ? "Draft restored and autosaved locally"
            : "Draft autosaves locally as you edit",
    };
});

const editorBreadcrumb = computed(() => {
    const element = store.definition.elements[store.selectedElementIndex ?? -1];
    const quest = element?.quests[store.selectedQuestIndex ?? -1];

    return [
        { label: "Quest Definition", active: false },
        ...(element
            ? [
                  {
                      label: element.element_type || "Element",
                      active: !quest,
                  },
              ]
            : []),
        ...(quest
            ? [
                  {
                      label: quest.quest_title || `Quest ${quest.quest_id}`,
                      active: true,
                  },
              ]
            : []),
    ];
});

function applyTheme(theme) {
    if (typeof document === "undefined") {
        return;
    }

    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.bsTheme = theme;
}

function setThemeMode(mode) {
    themeMode.value = normalizeThemeMode(mode);
}

function navigate(view) {
    currentView.value = view;
}

function returnToWelcome() {
    currentView.value = "welcome";
}

function clearCurrentConfig() {
    store.clearStoredDefinition();
    currentView.value = "welcome";
}

onMounted(() => {
    if (typeof window === "undefined") {
        return;
    }

    colorSchemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    systemPrefersDark.value = colorSchemeQuery.matches;

    colorSchemeHandler = (event) => {
        systemPrefersDark.value = event.matches;
    };

    if (typeof colorSchemeQuery.addEventListener === "function") {
        colorSchemeQuery.addEventListener("change", colorSchemeHandler);
    } else if (typeof colorSchemeQuery.addListener === "function") {
        colorSchemeQuery.addListener(colorSchemeHandler);
    }
});

onBeforeUnmount(() => {
    if (!colorSchemeQuery || !colorSchemeHandler) {
        return;
    }

    if (typeof colorSchemeQuery.removeEventListener === "function") {
        colorSchemeQuery.removeEventListener("change", colorSchemeHandler);
    } else if (typeof colorSchemeQuery.removeListener === "function") {
        colorSchemeQuery.removeListener(colorSchemeHandler);
    }
});

watch(
    themeMode,
    (nextMode) => {
        if (typeof window !== "undefined") {
            window.localStorage.setItem(THEME_MODE_KEY, nextMode);
        }
    },
    { immediate: true }
);

watch(
    resolvedTheme,
    (theme) => {
        applyTheme(theme);
    },
    { immediate: true }
);
</script>

<template>
    <div
        class="creator-app-shell d-flex flex-column min-vh-100 bg-body-tertiary"
        :class="{ 'creator-app-shell-editor': currentView === 'editor' }"
    >
        <a class="skip-link" href="#app-main">Skip to main content</a>

        <nav class="navbar creator-navbar shadow-sm">
            <div class="container-fluid px-3 py-2 gap-3 align-items-center">
                <div
                    class="d-flex align-items-center gap-3 flex-grow-1 min-w-0"
                >
                    <img
                        src="/favicon.png"
                        alt=""
                        class="creator-brand-icon flex-shrink-0"
                    />
                    <div class="min-w-0">
                        <div class="navbar-brand mb-0 fw-semibold">
                            Quest Definition Creator
                        </div>
                        <div
                            class="small creator-status"
                            :class="navbarStatus.className"
                        >
                            {{ navbarStatus.text }}
                        </div>
                    </div>
                </div>

                <div
                    class="d-flex flex-wrap align-items-center justify-content-end gap-2 creator-nav-actions"
                >
                    <button
                        v-if="currentView === 'editor'"
                        type="button"
                        class="btn btn-sm btn-outline-light creator-nav-button d-inline-flex align-items-center gap-2"
                        @click="returnToWelcome"
                    >
                        <svg
                            aria-hidden="true"
                            width="12"
                            height="12"
                            viewBox="0 0 16 16"
                            fill="currentColor"
                        >
                            <path
                                d="M3.86 8.753l5.482 4.796c.646.566 1.658.106 1.658-.753V3.204a1 1 0 0 0-1.659-.753l-5.48 4.796a1 1 0 0 0 0 1.506z"
                            />
                        </svg>
                        Welcome Page
                    </button>

                    <div
                        class="btn-group btn-group-sm creator-theme-group"
                        role="group"
                        aria-label="Color theme"
                    >
                        <button
                            v-for="mode in THEME_MODES"
                            :key="mode"
                            type="button"
                            class="btn btn-outline-light text-capitalize creator-theme-button"
                            :class="{ active: themeMode === mode }"
                            :aria-pressed="themeMode === mode"
                            @click="setThemeMode(mode)"
                        >
                            {{ mode }}
                        </button>
                    </div>
                </div>
            </div>
        </nav>

        <main
            v-if="currentView === 'welcome'"
            id="app-main"
            class="flex-grow-1"
        >
            <WelcomeScreen @navigate="navigate" />
        </main>

        <main
            v-else-if="currentView === 'editor'"
            id="app-main"
            class="flex-grow-1 d-flex flex-column creator-editor-main"
        >
            <div class="creator-breadcrumb-bar border-bottom bg-body px-3 py-2">
                <nav aria-label="Breadcrumb">
                    <ol class="breadcrumb mb-0 small">
                        <li
                            v-for="(item, index) in editorBreadcrumb"
                            :key="`${item.label}-${index}`"
                            class="breadcrumb-item"
                            :class="{ active: item.active }"
                            :aria-current="
                                item.active &&
                                index === editorBreadcrumb.length - 1
                                    ? 'page'
                                    : null
                            "
                        >
                            {{ item.label }}
                        </li>
                    </ol>
                </nav>
            </div>

            <div class="flex-grow-1 creator-editor-frame">
                <ElementList />
            </div>
        </main>

        <footer class="creator-footer" aria-label="Site footer">
            <span>© Taskar Center for Accessible Technology</span>&#8226;
            <a
                href="https://github.com/TaskarCenterAtUW/asr-quests"
                target="_blank"
                rel="noopener noreferrer"
                class="creator-footer-link"
                >GitHub</a
            >
        </footer>
    </div>
</template>

<style scoped>
.skip-link {
    position: absolute;
    top: -48px;
    left: 0.75rem;
    z-index: 1050;
    padding: 0.5rem 0.75rem;
    color: var(--bs-white);
    background: var(--bs-dark);
    border-radius: 0.6rem;
}

.skip-link:focus {
    top: 0.75rem;
}

.creator-status {
    max-width: 34rem;
}

.creator-navbar :deep(.navbar-brand) {
    color: var(--bs-white);
}

.creator-nav-actions {
    row-gap: 0.5rem;
}

.creator-editor-main,
.creator-editor-frame {
    min-height: 0;
    flex: 1 1 0;
}

@media (max-width: 767.98px) {
    .creator-nav-actions {
        width: 100%;
        justify-content: flex-start;
    }
}

@media (min-width: 992px) {
    .creator-app-shell.creator-app-shell-editor {
        height: 100dvh;
        overflow: hidden;
    }
}
</style>
