/**
 * views/raceday.js — Modo Dia da Corrida: tela cheia, botões grandes,
 * só o essencial (críticas, atrasadas, pendências, SOS, contatos, %).
 */
import { $, el, escapeHtml, isOverdue, openModal, closeModal, toast } from "../utils.js";
import { areaName } from "../data.js";
import { EMERGENCY_PROTOCOLS } from "../data.js";
import { openIncident } from "../db.js";
import { navigate } from "../router.js";
import { openTaskModal } from "./checklists.js";

let getState = () => ({ tasks: [], contacts: [], user: {} });

export function initRaceday(stateGetter) {
  getState = stateGetter;
}

export function renderRaceday(state) {
  const container = $("#view-raceday");
  if (!container) return;
  const tasks = state.tasks || [];
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "concluido").length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const critical = tasks.filter((t) => t.priority === "alta" && t.status !== "concluido");
  const overdue = tasks.filter((t) => isOverdue(t.prazo, t.status));
  const pending = tasks.filter((t) => t.status === "pendente" && t.priority !== "alta" && !isOverdue(t.prazo, t.status));

  const importantContacts = (state.contacts || []).filter((c) => c.telefone).slice(0, 8);

  container.innerHTML = `
    <div class="raceday-view">
      <div class="raceday-header">
        <div class="rd-title">🏁 Modo Dia da Corrida</div>
        <button class="raceday-exit" id="rd-exit">✕</button>
      </div>

      <div class="rd-progress">
        <div class="rd-progress-track"><div class="rd-progress-fill" style="width:${pct}%"></div></div>
        <div class="rd-progress-label"><span>${done}/${total} tarefas concluídas</span><span>${pct}%</span></div>
      </div>

      <button class="rd-sos" id="rd-sos">🚨 EMERGÊNCIA — TOQUE AQUI</button>

      <div class="rd-section">
        <div class="rd-section-title">🚨 Críticas em aberto (${critical.length})</div>
        <div id="rd-critical"></div>
      </div>

      <div class="rd-section">
        <div class="rd-section-title">⏰ Atrasadas (${overdue.length})</div>
        <div id="rd-overdue"></div>
      </div>

      <div class="rd-section">
        <div class="rd-section-title">🕓 Outras pendências (${pending.length})</div>
        <div id="rd-pending"></div>
      </div>

      <div class="rd-section">
        <div class="rd-section-title">☎️ Contatos importantes</div>
        <div class="rd-contacts-grid" id="rd-contacts"></div>
      </div>
    </div>
  `;

  $("#rd-exit").onclick = () => navigate("dashboard");
  $("#rd-sos").onclick = openSosSheet;

  fillTaskGroup("#rd-critical", critical, "Nenhuma tarefa crítica em aberto. 🎉");
  fillTaskGroup("#rd-overdue", overdue, "Nada atrasado no momento. 👍");
  fillTaskGroup("#rd-pending", pending, "Sem pendências extras. ✅");

  const contactsWrap = $("#rd-contacts");
  contactsWrap.innerHTML = "";
  if (!importantContacts.length) {
    contactsWrap.appendChild(el("div", { class: "rd-empty" }, "Nenhum telefone cadastrado ainda."));
  } else {
    importantContacts.forEach((c) => {
      const btn = el("a", { class: "rd-contact-btn", href: `tel:${c.telefone.replace(/\D/g, "")}` }, [
        el("div", {}, "☎️"),
        el("div", { class: "c-name" }, c.nome),
        el("div", { class: "c-num" }, c.telefone)
      ]);
      contactsWrap.appendChild(btn);
    });
  }
}

function fillTaskGroup(selector, list, emptyMsg) {
  const wrap = $(selector);
  wrap.innerHTML = "";
  if (!list.length) {
    wrap.appendChild(el("div", { class: "rd-empty" }, emptyMsg));
    return;
  }
  list.forEach((t) => {
    const card = el("div", { class: "rd-card crit", onclick: () => openTaskModal(t) }, [
      el("div", { class: "rd-card-title" }, t.title || "(sem título)"),
      el("div", { class: "rd-card-meta" }, `${areaName(t.area)}${t.responsavel ? " · " + t.responsavel : ""}`)
    ]);
    wrap.appendChild(card);
  });
}

function openSosSheet() {
  $("#simple-modal-title").textContent = "Qual é a emergência?";
  const form = $("#form-simple");
  form.innerHTML = `<div class="situation-grid" id="sos-grid"></div>`;
  form.onsubmit = (e) => e.preventDefault();
  const grid = form.querySelector("#sos-grid");
  EMERGENCY_PROTOCOLS.forEach((p) => {
    const card = el("div", { class: "card situation-card", onclick: async () => {
      const state = getState();
      if (!confirm(`Acionar o protocolo "${p.nome}"?`)) return;
      await openIncident(p.id, state.user?.name || "Equipe");
      toast(`Protocolo "${p.nome}" acionado — veja o checklist em Comunicação`, "success");
      closeModal("#modal-simple");
      navigate("communication");
    }}, [
      el("div", { class: "sit-icon" }, p.icone),
      el("div", { class: "sit-name" }, p.nome)
    ]);
    grid.appendChild(card);
  });
  $("#simple-modal-close").onclick = () => closeModal("#modal-simple");
  openModal("#modal-simple");
}
