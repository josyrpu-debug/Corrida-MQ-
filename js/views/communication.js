/**
 * views/communication.js — telefones importantes e protocolos de
 * situações de emergência (viram checklists sincronizados em tempo real).
 */
import { $, $$, el, escapeHtml, openModal, closeModal, toast } from "../utils.js";
import { EMERGENCY_PROTOCOLS } from "../data.js";
import { openIncident, toggleIncidentStep, resolveIncident } from "../db.js";

let getState = () => ({ contacts: [], incidents: [], user: {} });
let subTab = "contatos";

export function initCommunication(stateGetter) {
  getState = stateGetter;
}

function contactIconFor(cat) {
  const map = { Emergência: "🚨", Organização: "🧑‍💼", Operação: "🚦", Comunicação: "📣" };
  return map[cat] || "☎️";
}

export function renderCommunication(state) {
  const container = $("#view-communication");
  if (!container) return;

  container.innerHTML = `
    <div class="filter-row">
      <div class="chip-filter ${subTab === "contatos" ? "active" : ""}" id="tab-contatos">☎️ Contatos importantes</div>
      <div class="chip-filter ${subTab === "emergencia" ? "active" : ""}" id="tab-emergencia">🚨 Situações de emergência</div>
    </div>
    <div id="comm-body"></div>
  `;

  $("#tab-contatos").onclick = () => { subTab = "contatos"; renderCommunication(getState()); };
  $("#tab-emergencia").onclick = () => { subTab = "emergencia"; renderCommunication(getState()); };

  if (subTab === "contatos") paintContacts(state);
  else paintEmergency(state);
}

function paintContacts(state) {
  const body = $("#comm-body");
  const contacts = state.contacts || [];
  if (!contacts.length) {
    body.innerHTML = `<div class="empty-state card"><div class="e-title">Nenhum contato cadastrado</div></div>`;
    return;
  }
  const cats = [...new Set(contacts.map((c) => c.categoria))];
  body.innerHTML = "";
  cats.forEach((cat) => {
    body.appendChild(el("h3", { class: "section-title" }, cat));
    const list = el("div", { class: "contact-list" });
    contacts
      .filter((c) => c.categoria === cat)
      .forEach((c) => {
        const row = el("div", { class: "contact-row card" }, [
          el("div", { class: "contact-icon" }, contactIconFor(cat)),
          el("div", { class: "contact-info" }, [
            el("div", { class: "contact-name" }, c.nome),
            el("div", { class: "contact-cat" }, c.telefone || "Telefone não cadastrado")
          ])
        ]);
        if (c.telefone) {
          const call = el("a", { class: "contact-call", href: `tel:${c.telefone.replace(/\D/g, "")}` });
          call.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.12.81.3 1.6.54 2.37a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.71-1.11a2 2 0 012.11-.45c.77.24 1.56.42 2.37.54A2 2 0 0122 16.92z"/></svg>';
          row.appendChild(call);
        }
        list.appendChild(row);
      });
    body.appendChild(list);
  });
}

function paintEmergency(state) {
  const body = $("#comm-body");
  const activeIncidents = (state.incidents || []).filter((i) => i.status === "ativo");

  body.innerHTML = "";

  if (activeIncidents.length) {
    activeIncidents.forEach((inc) => {
      const banner = el("div", { class: "incident-active-banner", onclick: () => openIncidentModal(inc) }, [
        document.createTextNode(`${inc.icone} Ocorrência ativa: ${inc.nome} — toque para ver o checklist`)
      ]);
      body.appendChild(banner);
    });
  }

  body.appendChild(el("p", { style: "font-size:12.5px;color:var(--text-dim);font-weight:600;margin-bottom:12px;" },
    "Toque em uma situação para abrir o checklist de ações e acompanhar em tempo real com toda a equipe."));

  const grid = el("div", { class: "situation-grid" });
  EMERGENCY_PROTOCOLS.forEach((p) => {
    const card = el("div", { class: "card situation-card", onclick: () => startOrOpenIncident(p) }, [
      el("div", { class: "sit-icon" }, p.icone),
      el("div", { class: "sit-name" }, p.nome)
    ]);
    grid.appendChild(card);
  });
  body.appendChild(grid);
}

async function startOrOpenIncident(protocol) {
  const state = getState();
  const existing = (state.incidents || []).find((i) => i.protocolId === protocol.id && i.status === "ativo");
  if (existing) return openIncidentModal(existing);

  if (!confirm(`Acionar o protocolo "${protocol.nome}"? Um checklist de ações será aberto para toda a equipe.`)) return;
  await openIncident(protocol.id, state.user?.name || "Equipe");
  toast(`Protocolo "${protocol.nome}" acionado`, "success");
}

export function openIncidentModal(incident) {
  $("#incident-modal-title").textContent = `${incident.icone} ${incident.nome}`;
  const body = $("#incident-modal-body");
  body.innerHTML = "";

  const list = el("div", { class: "protocol-check-list" });
  incident.passos.forEach((step, idx) => {
    const item = el("div", { class: `protocol-check-item ${step.feito ? "checked" : ""}` });
    const check = el("div", { class: `task-check ${step.feito ? "checked" : ""}` });
    check.innerHTML = step.feito ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>' : "";
    check.onclick = async () => {
      const state = getState();
      await toggleIncidentStep(incident.id, idx, incident.passos, state.user?.name || "Equipe");
      // Atualiza localmente para resposta instantânea; o listener do Firestore fará a sincronização final.
      const latest = (getState().incidents || []).find((i) => i.id === incident.id);
      if (latest) openIncidentModal(latest);
    };
    item.appendChild(check);
    item.appendChild(el("div", { class: "pc-text" }, step.texto));
    list.appendChild(item);
  });
  body.appendChild(list);

  const doneCount = incident.passos.filter((s) => s.feito).length;
  const actions = el("div", { class: "modal-actions", style: "margin-top:16px;" }, [
    el("button", {
      class: "btn btn-primary btn-block",
      onclick: async () => {
        const state = getState();
        await resolveIncident(incident.id, state.user?.name || "Equipe");
        toast("Ocorrência encerrada", "success");
        closeModal("#modal-incident");
      }
    }, `Encerrar ocorrência (${doneCount}/${incident.passos.length} ações feitas)`)
  ]);
  body.appendChild(actions);

  $("#incident-modal-close").onclick = () => closeModal("#modal-incident");
  openModal("#modal-incident");
}
