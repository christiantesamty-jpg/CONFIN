import { shell } from "./ui/shell.js";
import { pages } from "./modules/pages.js";
import { bindActions } from "./modules/actions.js";
import { getState, subscribe } from "./core/store.js";
import { checkUpdates } from "./modules/updates.js";

let route = "home";

const appRoot = document.querySelector("#app");

if (!appRoot) {
  throw new Error("No se encontró el contenedor principal #app.");
}

appRoot.innerHTML = shell();

const viewport = document.querySelector("#viewport");
const appShell = document.querySelector(".app");

if (!viewport || !appShell) {
  throw new Error("No se pudo inicializar la estructura de ConFin.");
}

function render() {
  const state = getState();

  document.body.dataset.theme = state.theme || "midnight";

  const pageRenderer = pages[route] || pages.home;
  viewport.innerHTML = pageRenderer();
  viewport.scrollTop = 0;

  document.querySelectorAll(".nav-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.route === route);
  });

  // Importante: conecta eventos en toda la app,
  // no únicamente dentro de #viewport.
  bindActions(appShell, render);
}

window.addEventListener("route", (event) => {
  const requestedRoute = event.detail;

  if (pages[requestedRoute]) {
    route = requestedRoute;
    render();
  }
});

subscribe(render);
render();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("./service-worker.js")
    .catch((error) => console.warn("Service worker:", error));
}

window.setTimeout(() => {
  checkUpdates(true);
}, 1800);
