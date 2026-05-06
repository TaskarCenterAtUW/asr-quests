<!-- @format -->

<script setup>
import { ref } from "vue";
import WelcomeScreen from "./components/WelcomeScreen.vue";

// 'welcome' | 'editor'
const currentView = ref("welcome");
</script>

<template>
    <WelcomeScreen
        v-if="currentView === 'welcome'"
        @navigate="currentView = $event"
    />
    <div v-else-if="currentView === 'editor'">
        <!-- P4: ElementList / QuestEditor will go here -->
    </div>
</template>
