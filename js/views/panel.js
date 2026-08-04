/**
 * views/panel.js — Painel Geral: todos os itens, coloridos por status,
 * com quem foi o último responsável por alterar cada um.
 */
import { $, $$, el, escapeHtml, fmtRelative, debounce } from "../utils.js";
import { AREAS, areaName } from "../data.js";
import { openTaskModal } from "./checklists.js";

let filters = { search: "", area: "todas", status: "todos" };

function statusClass(status) {
  if (status === "concluido") return "g";
  if (status === "andamento") return "y";
  return "r";
}

export function renderPanel(state) {
  const container = $("#view-panel");
  if (!container) return;
  const tasks = state.tasks || [];

  container.innerHTML = `
    <div class="legend-row">
      <div class="legend-item"><span class="legend-dot" style="background:var(--ok-600)"></span> Concluído</div>
      <div class="legend-item"><span class="legend-dot" style="background:var(--warn-600)"></span> Em andamento</div>
      <div class="legend-item"><span class="legend-dot" style="background:var(--crit-600)"></span> Pendente</div>
    </div>
    <div class="toolbar">
      <div class="search-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
        <input type="text" id="panel-search" placeholder="Buscar tarefa, área ou responsável...">
      </div>
    </div>
    <div class="filter-row" id="panel-area-filters">
      <div class="chip-filter active" data-area="todas">Todas as áreas</div>
      ${AREAS.map((a) => `<div class="chip-filter" data-area="${a.id}">${a.icone} ${a.nome}</div>`).join("")}
    </div>
    <div class="filter-row" id="panel-status-filters">
      <div class="chip-filter active" data-status="todos">Todos status</div>
      <div class="chip-filter" data-status="pendente">🔴 Pendente</div>
      <div class="chip-filter" data-status="andamento">🟡 Em andamento</div>
      <div class="chip-filter" data-status="concluido">🟢 Concluído</div>
    </div>
    <div class="panel-grid" id="panel-grid"></div>
  `;

  function paint() {
    const grid = $("#panel-grid");
    const term = filters.search.trim().toLowerCase();
    const filtered = tasks.filter((t) => {
      const matchesTerm =
        !term ||
        (t.title || "").toLowerCase().includes(term) ||
        (t.responsavel || "").toLowerCase().includes(term) ||
        areaName(t.area).toLowerCase().includes(term);
      const matchesArea = filters.area === "todas" || t.area === filters.area;
      const matchesStatus = filters.status === "todos" || t.status === filters.status;
      return matchesTerm && matchesArea && matchesStatus;
    });

    if (!filtered.length) {
      grid.innerHTML = `<div class="empty-state card"><div class="e-title">Nada encontrado</div><div class="e-sub">Ajuste os filtros ou a busca.</div></div>`;
      return;
    }

    grid.innerHTML = "";
    filtered.forEach((t) => {
      const row = el("div", { class: `panel-row ${statusClass(t.status)}`, onclick: () => openTaskModal(t) }, [
        el("div", { class: "p-title" }, [
          document.createTextNode(t.title || "(sem título)"),
          el("div", { class: "p-area" }, `${areaName(t.area)}${t.priority === "alta" ? " · 🚨 alta prioridade" : ""}`)
        ]),
        el("div", { class: "p-who" }, [
          document.createTextNode(t.lastUpdatedBy || "—"),
          el("div", {}, fmtRelative(t.lastUpdatedAt))
        ])
      ]);
      grid.appendChild(row);
    });
  }

  const onSearch = debounce((v) => { filters.search = v; paint(); }, 150);
  $("#panel-search").addEventListener("input", (e) => onSearch(e.target.value));

  $$("#panel-area-filters .chip-filter").forEach((chip) => {
    chip.addEventListener("click", () => {
      $$("#panel-area-filters .chip-filter").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      filters.area = chip.dataset.area;
      paint();
    });
  });
  $$("#panel-status-filters .chip-filter").forEach((chip) => {
    chip.addEventListener("click", () => {
      $$("#panel-status-filters .chip-filter").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      filters.status = chip.dataset.status;
      paint();
    });
  });

  paint();
}
