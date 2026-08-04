/**
 * views/timeline.js — cronograma do dia da corrida.
 */
import { $, el, escapeHtml, openModal, closeModal, toast } from "../utils.js";
import { toggleTimelineItem, addTimelineItem, deleteTimelineItem, logActivity } from "../db.js";

let getState = () => ({ timeline: [], user: {} });

export function initTimeline(stateGetter) {
  getState = stateGetter;
}

function isLate(item) {
  if (item.realizado) return false;
  const [h, m] = (item.horario || "0:0").split(":").map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(h, m, 0, 0);
  return now > target;
}

export function renderTimeline(state) {
  const container = $("#view-timeline");
  if (!container) return;
  const items = state.timeline || [];

  container.innerHTML = `
    <div class="toolbar">
      <h2 style="font-size:16px;flex:1;">Cronograma do dia 09/08/2026</h2>
      <button class="btn btn-primary btn-sm" id="btn-new-timeline">+ Horário</button>
    </div>
    <div class="card" style="padding:16px 16px 4px;">
      <div class="timeline-list" id="timeline-list"></div>
    </div>
  `;

  const list = $("#timeline-list");
  if (!items.length) {
    list.innerHTML = `<div class="empty-state"><div class="e-title">Nenhum horário cadastrado</div><div class="e-sub">Adicione o primeiro item do cronograma.</div></div>`;
  } else {
    list.innerHTML = "";
    items.forEach((item) => {
      const late = isLate(item);
      const row = el("div", { class: `timeline-item ${item.realizado ? "done" : ""} ${late ? "late" : ""}` });
      const dot = el("div", { class: "timeline-dot" });
      dot.innerHTML = item.realizado ? '<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="#fff" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>' : "";
      row.appendChild(dot);

      const card = el("div", { class: "timeline-card card" });
      const left = el("div", { style: "display:flex;gap:14px;align-items:center;" }, [
        el("div", { class: "timeline-time" }, item.horario),
        el("div", {}, [
          el("div", { class: "timeline-title" }, item.titulo),
          late ? el("div", { class: "timeline-sub", style: "color:var(--crit-600);font-weight:700;" }, "Atrasado") : el("div", { class: "timeline-sub" }, item.realizado ? "Realizado" : "")
        ])
      ]);
      const toggle = el("div", { class: `timeline-toggle ${item.realizado ? "on" : ""}` });
      toggle.innerHTML = item.realizado ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>' : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>';
      toggle.onclick = async () => {
        const st = getState();
        const next = !item.realizado;
        await toggleTimelineItem(item.id, next, st.user?.name || "Equipe");
        await logActivity({
          type: "timeline",
          text: `<b>${escapeHtml(st.user?.name || "Alguém")}</b> marcou "<b>${escapeHtml(item.titulo)}</b>" (${item.horario}) como ${next ? "realizado ✅" : "não realizado"}`,
          level: next ? "ok" : "warn"
        });
      };

      card.appendChild(left);
      card.appendChild(toggle);
      row.appendChild(card);
      list.appendChild(row);
    });
  }

  $("#btn-new-timeline").onclick = openNewTimelineModal;
}

function openNewTimelineModal() {
  $("#simple-modal-title").textContent = "Novo horário";
  const form = $("#form-simple");
  form.innerHTML = `
    <div class="field">
      <label>Horário</label>
      <input type="time" id="new-tl-horario" required>
    </div>
    <div class="field">
      <label>O que acontece</label>
      <input type="text" id="new-tl-titulo" placeholder="Ex: Abertura dos portões" required>
    </div>
    <button type="submit" class="btn btn-primary btn-block">Adicionar ao cronograma</button>
  `;
  form.onsubmit = async (e) => {
    e.preventDefault();
    const horario = $("#new-tl-horario").value;
    const titulo = $("#new-tl-titulo").value.trim();
    if (!horario || !titulo) return;
    const state = getState();
    const ordem = state.timeline.length ? Math.max(...state.timeline.map((t) => t.ordem ?? 0)) + 1 : 0;
    await addTimelineItem({ horario, titulo }, ordem);
    await logActivity({ type: "timeline", text: `<b>${escapeHtml(state.user?.name || "Alguém")}</b> adicionou "${escapeHtml(titulo)}" (${horario}) ao cronograma`, level: "info" });
    toast("Horário adicionado", "success");
    closeModal("#modal-simple");
  };
  $("#simple-modal-close").onclick = () => closeModal("#modal-simple");
  openModal("#modal-simple");
}
