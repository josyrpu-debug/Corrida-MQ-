/**
 * views/checklists.js — grade de áreas + detalhe de uma área (lista de
 * tarefas) + modal de criação/edição de tarefa (reaproveitado pelo
 * Painel Geral também).
 */
import { $, $$, el, escapeHtml, fmtDateTime, isOverdue, openModal, closeModal, toast, compressImageToBase64 } from "../utils.js";
import { AREAS, areaName, areaIcon } from "../data.js";
import { navigate } from "../router.js";
import { saveTask, deleteTask, setTaskStatus, logActivity } from "../db.js";

let getState = () => ({ tasks: [], user: {} });
let filterState = { search: "", status: "todos" };
let pendingPhotoBase64 = null;
let currentEditingArea = null;

export function initChecklists(stateGetter) {
  getState = stateGetter;
  wireModal();
}

// ---------------------------------------------------------------------
// Grade de áreas
// ---------------------------------------------------------------------
export function renderChecklists(state) {
  const container = $("#view-checklists");
  if (!container) return;
  const tasks = state.tasks || [];

  container.innerHTML = `
    <div class="toolbar">
      <div class="search-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
        <input type="text" id="area-search" placeholder="Buscar área...">
      </div>
    </div>
    <div class="area-grid" id="area-grid"></div>
  `;

  const grid = $("#area-grid");
  const term = "";

  function paint(filterTerm = "") {
    const t = filterTerm.trim().toLowerCase();
    grid.innerHTML = "";
    AREAS.filter((a) => !t || a.nome.toLowerCase().includes(t)).forEach((area) => {
      const areaTasks = tasks.filter((tk) => tk.area === area.id);
      const total = areaTasks.length;
      const done = areaTasks.filter((tk) => tk.status === "concluido").length;
      const crit = areaTasks.filter((tk) => tk.priority === "alta" && tk.status !== "concluido").length;
      const pct = total ? Math.round((done / total) * 100) : 0;

      const card = el("div", { class: "card area-card", onclick: () => navigate("checklists", area.id) }, [
        el("div", { class: "a-icon" }, area.icone),
        el("div", { class: "a-name" }, area.nome),
        el("div", { class: "area-progress-track" }, el("div", { class: "area-progress-fill", style: `width:${pct}%` })),
        el("div", { class: "area-meta" }, [
          el("span", {}, total ? `${done}/${total} concluídas` : "Sem tarefas"),
          crit ? el("span", { class: "area-crit-flag" }, `🚨 ${crit}`) : el("span", {}, "")
        ])
      ]);
      grid.appendChild(card);
    });
  }
  paint();
  $("#area-search").addEventListener("input", (e) => paint(e.target.value));
}

// ---------------------------------------------------------------------
// Detalhe de uma área
// ---------------------------------------------------------------------
export function renderAreaDetail(state, areaId) {
  const container = $("#view-area-detail");
  if (!container || !areaId) return;
  currentEditingArea = areaId;
  const tasks = (state.tasks || []).filter((t) => t.area === areaId);

  container.innerHTML = `
    <button class="btn btn-ghost btn-sm" id="back-to-areas" style="margin-bottom:14px;">← Todas as áreas</button>
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
      <div class="a-icon" style="width:44px;height:44px;font-size:20px;">${areaIcon(areaId)}</div>
      <h2 style="font-size:19px;">${escapeHtml(areaName(areaId))}</h2>
    </div>
    <div class="toolbar">
      <div class="search-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
        <input type="text" id="task-search" placeholder="Buscar tarefa...">
      </div>
      <button class="btn btn-primary btn-sm" id="btn-new-task">+ Nova tarefa</button>
    </div>
    <div class="filter-row" id="status-filters">
      <div class="chip-filter active" data-status="todos">Todas</div>
      <div class="chip-filter" data-status="pendente">Pendentes</div>
      <div class="chip-filter" data-status="andamento">Em andamento</div>
      <div class="chip-filter" data-status="concluido">Concluídas</div>
    </div>
    <div class="task-list" id="task-list"></div>
  `;

  $("#back-to-areas").onclick = () => navigate("checklists");
  $("#btn-new-task").onclick = () => openTaskModal(null, areaId);

  function paint() {
    const list = $("#task-list");
    const term = filterState.search.trim().toLowerCase();
    const filtered = tasks.filter((t) => {
      const matchesTerm = !term || (t.title || "").toLowerCase().includes(term) || (t.responsavel || "").toLowerCase().includes(term);
      const matchesStatus = filterState.status === "todos" || t.status === filterState.status;
      return matchesTerm && matchesStatus;
    });

    if (!filtered.length) {
      list.innerHTML = `<div class="empty-state card">
        <div class="e-title">Nenhuma tarefa aqui ainda</div>
        <div class="e-sub">Toque em "+ Nova tarefa" para começar o checklist desta área.</div>
      </div>`;
      return;
    }

    list.innerHTML = "";
    filtered
      .sort((a, b) => {
        const order = { alta: 0, media: 1, baixa: 2 };
        return (order[a.priority] ?? 3) - (order[b.priority] ?? 3);
      })
      .forEach((t) => list.appendChild(renderTaskRow(t)));
  }

  $("#task-search").addEventListener("input", (e) => { filterState.search = e.target.value; paint(); });
  $$("#status-filters .chip-filter").forEach((chip) => {
    chip.addEventListener("click", () => {
      $$("#status-filters .chip-filter").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      filterState.status = chip.dataset.status;
      paint();
    });
  });

  paint();
}

export function renderTaskRow(t) {
  const overdue = isOverdue(t.prazo, t.status);
  const row = el("div", { class: `task-item card status-${t.status || "pendente"}` });

  const check = el("div", { class: `task-check ${t.status === "concluido" ? "checked" : ""}` });
  check.innerHTML = t.status === "concluido" ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>' : "";
  check.onclick = async (e) => {
    e.stopPropagation();
    const state = getState();
    const next = t.status === "concluido" ? "pendente" : "concluido";
    await setTaskStatus(t.id, next, state.user?.name || "Equipe");
    await logActivity({
      type: "task",
      text: `<b>${escapeHtml(state.user?.name || "Alguém")}</b> marcou "<b>${escapeHtml(t.title)}</b>" como ${next === "concluido" ? "concluída ✅" : "pendente"}`,
      level: next === "concluido" ? "ok" : "warn",
      area: t.area
    });
  };

  const body = el("div", { class: "task-body" });
  const titleRow = el("div", { class: "task-title-row" }, [
    el("div", { class: "task-title" }, t.title || "(sem título)"),
    el("span", { class: `tag tag-${t.priority || "baixa"}` }, (t.priority || "baixa").replace("baixa", "Baixa").replace("media", "Média").replace("alta", "Alta"))
  ]);
  body.appendChild(titleRow);

  const meta = el("div", { class: "task-meta-row" });
  if (t.responsavel) meta.appendChild(el("span", {}, `👤 ${escapeHtml(t.responsavel)}`));
  if (t.prazo) meta.appendChild(el("span", { class: overdue ? "task-overdue" : "" }, `⏰ ${new Date(t.prazo).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}${overdue ? " (atrasado)" : ""}`));
  if (t.status === "concluido" && t.horarioConclusao) meta.appendChild(el("span", {}, `✅ ${fmtDateTime(t.horarioConclusao)}`));
  if (t.lastUpdatedBy) meta.appendChild(el("span", {}, `✏️ ${escapeHtml(t.lastUpdatedBy)}`));
  body.appendChild(meta);

  row.appendChild(check);
  row.appendChild(body);
  if (t.photoBase64) {
    const img = el("img", { class: "task-photo-thumb", src: t.photoBase64 });
    row.appendChild(img);
  }
  row.addEventListener("click", () => openTaskModal(t));
  return row;
}

// ---------------------------------------------------------------------
// Modal de tarefa (criar/editar) — usado por Checklists e Painel Geral
// ---------------------------------------------------------------------
function wireModal() {
  $$("#task-status-selector .status-opt").forEach((opt) => {
    opt.addEventListener("click", () => {
      $$("#task-status-selector .status-opt").forEach((o) => o.classList.remove("selected"));
      opt.classList.add("selected");
      $("#task-completion-time-wrap").style.display = opt.dataset.s === "concluido" ? "flex" : "none";
    });
  });
  $$("#task-priority-selector .priority-opt").forEach((opt) => {
    opt.addEventListener("click", () => {
      $$("#task-priority-selector .priority-opt").forEach((o) => o.classList.remove("selected"));
      opt.classList.add("selected");
    });
  });

  $("#task-photo").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      pendingPhotoBase64 = await compressImageToBase64(file);
      $("#task-photo-preview").src = pendingPhotoBase64;
      $("#task-photo-preview").classList.remove("hidden");
    } catch (err) {
      toast("Não foi possível carregar a foto", "error");
    }
  });

  $("#task-modal-close").onclick = () => closeModal("#modal-task");

  $("#task-delete-btn").onclick = async () => {
    const id = $("#task-id").value;
    if (!id) { closeModal("#modal-task"); return; }
    if (!confirm("Excluir esta tarefa? Essa ação não pode ser desfeita.")) return;
    await deleteTask(id);
    toast("Tarefa excluída", "success");
    closeModal("#modal-task");
  };

  $("#form-task").addEventListener("submit", async (e) => {
    e.preventDefault();
    const state = getState();
    const id = $("#task-id").value || null;
    const area = $("#task-area").value;
    const status = $("#task-status-selector .status-opt.selected")?.dataset.s || "pendente";
    const priority = $("#task-priority-selector .priority-opt.selected")?.dataset.p || "baixa";
    const title = $("#task-title").value.trim();
    if (!title) return toast("Digite o título da tarefa", "error");

    const data = {
      area, title, status, priority,
      responsavel: $("#task-responsavel").value.trim(),
      prazo: $("#task-prazo").value || null,
      observacoes: $("#task-obs").value.trim()
    };
    if (pendingPhotoBase64) data.photoBase64 = pendingPhotoBase64;
    if (status === "concluido" && !id) data.horarioConclusao = new Date().toISOString();

    const isNew = !id;
    const savedId = await saveTask(id, data, state.user?.name || "Equipe");
    await logActivity({
      type: "task",
      text: isNew
        ? `<b>${escapeHtml(state.user?.name || "Alguém")}</b> criou a tarefa "<b>${escapeHtml(title)}</b>" em ${escapeHtml(areaName(area))}`
        : `<b>${escapeHtml(state.user?.name || "Alguém")}</b> atualizou "<b>${escapeHtml(title)}</b>"`,
      level: status === "concluido" ? "ok" : priority === "alta" ? "crit" : "warn",
      area
    });
    toast("Tarefa salva!", "success");
    closeModal("#modal-task");
  });
}

export function openTaskModal(task, presetArea) {
  pendingPhotoBase64 = null;
  $("#task-modal-title").textContent = task ? "Editar tarefa" : "Nova tarefa";
  $("#task-id").value = task?.id || "";
  $("#task-area").value = task?.area || presetArea || currentEditingArea || "";
  $("#task-title").value = task?.title || "";
  $("#task-responsavel").value = task?.responsavel || "";
  $("#task-prazo").value = task?.prazo || "";
  $("#task-obs").value = task?.observacoes || "";
  $("#task-photo-preview").classList.add("hidden");
  $("#task-photo").value = "";
  if (task?.photoBase64) {
    $("#task-photo-preview").src = task.photoBase64;
    $("#task-photo-preview").classList.remove("hidden");
  }

  $$("#task-status-selector .status-opt").forEach((o) => o.classList.toggle("selected", o.dataset.s === (task?.status || "pendente")));
  $$("#task-priority-selector .priority-opt").forEach((o) => o.classList.toggle("selected", o.dataset.p === (task?.priority || "baixa")));
  $("#task-completion-time-wrap").style.display = task?.status === "concluido" ? "flex" : "none";
  if (task?.horarioConclusao) $("#task-completion-time").textContent = fmtDateTime(task.horarioConclusao);

  $("#task-delete-btn").style.display = task ? "inline-flex" : "none";
  openModal("#modal-task");
}
