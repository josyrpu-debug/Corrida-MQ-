/**
 * router.js — navegação simples baseada em hash (#/rota), sem dependências.
 * Mantém sidebar, bottom-nav e título do topo sincronizados com a tela ativa.
 */
import { $, $$ } from "./utils.js";

const listeners = [];

export function onRouteChange(cb) {
  listeners.push(cb);
}

export function currentRoute() {
  const hash = location.hash.replace(/^#\/?/, "");
  const [view, ...rest] = hash.split("/").filter(Boolean);
  return { view: view || "dashboard", param: rest.join("/") || null };
}

export function navigate(view, param = null) {
  location.hash = param ? `#/${view}/${param}` : `#/${view}`;
}

function dispatch() {
  const route = currentRoute();
  listeners.forEach((cb) => cb(route));
  syncChrome(route);
}

function syncChrome(route) {
  // Mostra/esconde seções .view dentro de #main-content
  $$(".view").forEach((sec) => sec.classList.add("hidden"));

  const raceday = $("#view-raceday");
  const appShell = $("#app-shell");

  if (route.view === "raceday") {
    raceday.classList.remove("hidden");
    appShell.classList.add("hidden");
    return;
  }
  raceday.classList.add("hidden");
  appShell.classList.remove("hidden");

  const map = {
    dashboard: "view-dashboard",
    checklists: route.param ? "view-area-detail" : "view-checklists",
    timeline: "view-timeline",
    panel: "view-panel",
    communication: "view-communication"
  };
  const targetId = map[route.view] || "view-dashboard";
  const target = document.getElementById(targetId);
  if (target) target.classList.remove("hidden");

  // Título do topo
  const titles = {
    dashboard: "Dashboard",
    checklists: route.param ? "Checklist da área" : "Checklists",
    timeline: "Linha do Tempo",
    panel: "Painel Geral",
    communication: "Comunicação"
  };
  const titleEl = $("#topbar-title");
  if (titleEl) titleEl.textContent = titles[route.view] || "Dashboard";

  // Sidebar / bottom-nav estado ativo
  $$(".nav-item, .bn-item").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === route.view);
  });

  // Fecha sidebar mobile e sobe o scroll
  closeSidebar();
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
}

export function closeSidebar() {
  $("#sidebar")?.classList.remove("open");
  $("#overlay")?.classList.remove("show");
}
export function openSidebar() {
  $("#sidebar")?.classList.add("open");
  $("#overlay")?.classList.add("show");
}

export function initRouter() {
  window.addEventListener("hashchange", dispatch);
  if (!location.hash) location.hash = "#/dashboard";
  dispatch();

  // Clique em qualquer botão de navegação (sidebar, bottom-nav, botão raceday)
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-view]");
    if (btn) navigate(btn.dataset.view);
  });

  $("#menu-toggle")?.addEventListener("click", openSidebar);
  $("#overlay")?.addEventListener("click", closeSidebar);
}
