/** @format */

import { createApp } from "vue";
import { createPinia } from "pinia";
import "bootstrap/dist/css/bootstrap.min.css";
import "./assets/theme.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import App from "./App.vue";

const app = createApp(App);
app.use(createPinia());
app.mount("#app");
