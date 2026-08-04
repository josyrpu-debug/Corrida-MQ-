/**
 * views/dashboard.js — visão geral do evento.
 */
import { $, escapeHtml, fmtRelative } from "../utils.js";
import { navigate } from "../router.js";

function levelClass(level) {
  if (level === "crit") return "crit";
  if (level === "warn") return "warn";
  return "ok";
}

export function renderDashboard(state) {
  const container = $("#view-dashboard");
  if (!container) return;

  const tasks = state.tasks || [];
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "concluido").length;
  const pending = tasks.filter((t) => t.status === "pendente").length;
  const andamento = tasks.filter((t) => t.status === "andamento").length;
  const critical = tasks.filter((t) => t.priority === "alta" && t.status !== "concluido").length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const circumference = 2 * Math.PI * 46;
  const offset = circumference - (pct / 100) * circumference;

  container.innerHTML = `
    <div class="hero-card">
      <div class="progress-ring-wrap">
        <svg width="112" height="112" viewBox="0 0 112 112">
          <circle class="progress-ring-bg" cx="56" cy="56" r="46"></circle>
          <circle class="progress-ring-fg" cx="56" cy="56" r="46"
            stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"></circle>
        </svg>
        <div class="progress-ring-label">
          <div class="pct">${pct}%</div>
          <div class="pct-sub">CONCLUÍDO</div>
        </div>
      </div>
      <div class="hero-text">
        <div class="h-eyebrow">1ª Corrida N. Sra. do Amparo</div>
        <h2>Preparação geral do evento</h2>
        <div class="h-date">📅 09/08/2026 · Maricá/RJ &nbsp;·&nbsp; ${total} tarefa${total === 1 ? "" : "s"} no total</div>
      </div>
    </div>

    <div class="stat-grid">
      <div class="card stat-card">
        <div class="s-icon ok">✅</div>
        <div class="s-value">${done}</div>
        <div class="s-label">Concluídas</div>
      </div>
      <div class="card stat-card">
        <div class="s-icon warn">🕓</div>
        <div class="s-value">${pending + andamento}</div>
        <div class="s-label">Pendentes</div>
      </div>
      <div class="card stat-card">
        <div class="s-icon crit">🚨</div>
        <div class="s-value">${critical}</div>
        <div class="s-label">Críticas em aberto</div>
      </div>
      <div class="card stat-card">
        <div class="s-icon info">📋</div>
        <div class="s-value">${total}</div>
        <div class="s-label">Total de tarefas</div>
      </div>
    </div>

    <h3 class="section-title">🕐 Últimas atualizações</h3>
    <div class="card" style="padding:6px 14px;">
      <div class="activity-list" id="dash-activity"></div>
    </div>

    <h3 class="section-title">⚡ Acesso rápido</h3>
    <div class="stat-grid" style="grid-template-columns:1fr 1fr;">
      <button class="card stat-card" style="cursor:pointer;border:1px solid var(--border);" id="qa-checklists">
        <div class="s-icon info">📋</div>
        <div class="s-label" style="font-weight:800;color:var(--text);font-size:13px;">Ver checklists</div>
      </button>
      <button class="card stat-card" style="cursor:pointer;border:1px solid var(--border);" id="qa-timeline">
        <div class="s-icon info">⏱️</div>
        <div class="s-label" style="font-weight:800;color:var(--text);font-size:13px;">Linha do tempo</div>
      </button>
    </div>
  `;

  $("#qa-checklists").onclick = () => navigate("checklists");
  $("#qa-timeline").onclick = () => navigate("timeline");

  const activityWrap = $("#dash-activity");
  const activity = (state.activity || []).slice(0, 8);
  if (!activity.length) {
    activityWrap.innerHTML = `<div class="empty-state"><div class="e-title">Nenhuma atividade ainda</div><div class="e-sub">As ações da equipe aparecerão aqui em tempo real.</div></div>`;
  } else {
    activityWrap.innerHTML = activity
      .map(
        (a) => `
      <div class="activity-item">
        <div class="activity-dot ${levelClass(a.level)}"></div>
        <div>
          <div class="activity-text">${escapeHtml(a.text || "")}</div>
          <div class="activity-time">${fmtRelative(a.at)}</div>
        </div>
      </div>`
      )
      .join("");
  }

  // Badge de pendências na sidebar
  const badge = $("#badge-pending");
  if (badge) {
    const n = pending;
    badge.textContent = n;
    badge.classList.toggle("hidden", n === 0);
  }
}
