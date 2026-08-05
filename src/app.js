import { shell } from "./ui/shell.js";
import { pages } from "./modules/pages.js";
import { bindActions } from "./modules/actions.js";
import { getState, subscribe } from "./core/store.js";
import { checkUpdates } from "./modules/updates.js";

let route = "home";

const appRoot = document.querySelector("#app");
if (!appRoot) throw new Error("No se encontró el contenedor principal #app.");

appRoot.innerHTML = shell();

const viewport = document.querySelector("#viewport");
const appShell = document.querySelector(".app");
if (!viewport || !appShell) throw new Error("No se pudo inicializar ConFin.");

function render() {
  const state = getState();
  document.body.dataset.theme = state.theme || "midnight";

  const pageRenderer = pages[route] || pages.home;
  viewport.innerHTML = pageRenderer();
  viewport.scrollTop = 0;

  document.querySelectorAll(".nav-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.route === route);
  });

  // Los elementos de cada pantalla se vuelven a crear en cada render.
  // Por eso conectamos sus acciones después de pintar la pantalla.
  bindActions(appShell, render);
}

window.addEventListener("route", (event) => {
  const requestedRoute = event.detail;
  if (!pages[requestedRoute]) return;
  route = requestedRoute;
  render();
});

subscribe(render);
render();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("./service-worker.js")
    .catch((error) => console.warn("Service worker:", error));
}

window.setTimeout(() => checkUpdates(true), 1800);
