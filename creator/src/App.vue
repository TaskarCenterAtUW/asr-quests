<!-- @format -->

<script setup>
import { ref } from "vue";
import WelcomeScreen from "./components/WelcomeScreen.vue";
import ElementList from "./components/ElementList.vue";

// 'welcome' | 'editor'
const currentView = ref("welcome");
</script>

<template>
    <WelcomeScreen
        v-if="currentView === 'welcome'"
        @navigate="currentView = $event"
    />
    <div
        v-else-if="currentView === 'editor'"
        style="height: 100vh; overflow: hidden"
    >
        <ElementList />
    </div>
</template>
