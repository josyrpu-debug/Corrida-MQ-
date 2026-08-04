/**
 * main.js — ponto de entrada do app.
 * Responsável por: autenticação, estado global em memória (alimentado
 * pelos listeners em tempo real do Firestore), roteamento e o "cola-tudo"
 * entre as views.
 */
import { $, $$, toast, initials, openModal, closeModal } from "./utils.js";
import { initTheme, toggleTheme, currentTheme } from "./theme.js";
import { initRouter, onRouteChange, currentRoute, navigate } from "./router.js";
import { watchAuth, login, register, resetPassword, logout, friendlyAuthError } from "./auth.js";
import {
  seedIfNeeded, listenTasks, listenTimeline, listenContacts, listenActivity, listenIncidents
} from "./db.js";
import { FIREBASE_READY } from "./firebase-config.js";

import { renderDashboard } from "./views/dashboard.js";
import { renderChecklists, renderAreaDetail, initChecklists } from "./views/checklists.js";
import { renderTimeline, initTimeline } from "./views/timeline.js";
import { renderPanel } from "./views/panel.js";
import { renderCommunication, initCommunication } from "./views/communication.js";
import { renderRaceday, initRaceday } from "./views/raceday.js";

// ---------------------------------------------------------------------
// Estado global em memória (fonte única de verdade para todas as telas)
// ---------------------------------------------------------------------
const state = {
  user: null,
  tasks: [],
  timeline: [],
  contacts: [],
  activity: [],
  incidents: []
};
const getState = () => state;

let unsubscribers = [];

// ---------------------------------------------------------------------
// Inicialização de UI que não depende de login
// ---------------------------------------------------------------------
initTheme();
registerServiceWorker();
wireThemeSwitch();
wireOnlineOfflineBanner();
wireLoginForms();

initChecklists(getState);
initTimeline(getState);
initCommunication(getState);
initRaceday(getState);

// ---------------------------------------------------------------------
// Firebase não configurado ainda -> mostra aviso amigável em vez de travar
// ---------------------------------------------------------------------
if (!FIREBASE_READY) {
  document.getElementById("splash").innerHTML = `
    <div style="max-width:340px;text-align:center;padding:0 20px;">
      <div style="font-size:40px;">⚙️</div>
      <h2 style="font-family:'Poppins',sans-serif;color:#0E3B6E;margin-top:10px;">Configuração pendente</h2>
      <p style="color:#5A6B85;font-size:13.5px;margin-top:8px;line-height:1.5;">
        O Firebase ainda não foi configurado neste app. Abra
        <code>js/firebase-config.js</code> e cole as chaves do seu projeto
        (veja o passo a passo no README.md).
      </p>
    </div>`;
} else {
  boot();
}

async function boot() {
  await seedIfNeeded();

  watchAuth(
    (user) => {
      state.user = { uid: user.uid, name: user.displayName || user.email.split("@")[0] };
      showApp();
      startListeners();
    },
    () => {
      state.user = null;
      stopListeners();
      showLogin();
    }
  );
}

// ---------------------------------------------------------------------
// Listeners em tempo real
// ---------------------------------------------------------------------
function startListeners() {
  stopListeners();
  unsubscribers.push(listenTasks((data) => { state.tasks = data; renderCurrent(); }));
  unsubscribers.push(listenTimeline((data) => { state.timeline = data; renderCurrent(); }));
  unsubscribers.push(listenContacts((data) => { state.contacts = data; renderCurrent(); }));
  unsubscribers.push(listenActivity((data) => { state.activity = data; renderCurrent(); }));
  unsubscribers.push(listenIncidents((data) => { state.incidents = data; renderCurrent(); }));
}
function stopListeners() {
  unsubscribers.forEach((u) => { try { u(); } catch (e) {} });
  unsubscribers = [];
}

// ---------------------------------------------------------------------
// Roteamento -> chama a view certa com o estado mais recente
// ---------------------------------------------------------------------
function renderCurrent() {
  const route = currentRoute();
  renderDashboard(state); // roda sempre: mantém badge de pendências atualizado
  switch (route.view) {
    case "dashboard": renderDashboard(state); break;
    case "checklists":
      if (route.param) renderAreaDetail(state, route.param);
      else renderChecklists(state);
      break;
    case "timeline": renderTimeline(state); break;
    case "panel": renderPanel(state); break;
    case "communication": renderCommunication(state); break;
    case "raceday": renderRaceday(state); break;
    default: renderDashboard(state);
  }
}

onRouteChange(() => { if (state.user) renderCurrent(); });
initRouter();

// ---------------------------------------------------------------------
// Login / Logout
// ---------------------------------------------------------------------
function showApp() {
  $("#splash").classList.add("hidden");
  $("#login-screen").classList.add("hidden");
  $("#app-shell").classList.remove("hidden");
  $("#user-name").textContent = state.user.name;
  $("#user-avatar").textContent = initials(state.user.name);
}
function showLogin() {
  $("#splash").classList.add("hidden");
  $("#app-shell").classList.add("hidden");
  $("#view-raceday").classList.add("hidden");
  $("#login-screen").classList.remove("hidden");
}

function wireLoginForms() {
  const err = (id, msg) => { const n = $(id); n.textContent = msg; n.classList.toggle("show", !!msg); };

  $("#form-login").addEventListener("submit", async (e) => {
    e.preventDefault();
    err("#login-error", "");
    const btn = $("#btn-login");
    btn.disabled = true; btn.textContent = "Entrando...";
    try {
      await login($("#login-email").value.trim(), $("#login-pass").value);
    } catch (ex) {
      err("#login-error", friendlyAuthError(ex));
    } finally {
      btn.disabled = false; btn.textContent = "Entrar";
    }
  });

  $("#form-register").addEventListener("submit", async (e) => {
    e.preventDefault();
    err("#register-error", "");
    const btn = $("#btn-register");
    btn.disabled = true; btn.textContent = "Criando...";
    try {
      await register(
        $("#reg-name").value.trim(),
        $("#reg-email").value.trim(),
        $("#reg-pass").value,
        $("#reg-code").value
      );
      toast("Conta criada! Bem-vindo(a) à equipe.", "success");
    } catch (ex) {
      err("#register-error", friendlyAuthError(ex));
    } finally {
      btn.disabled = false; btn.textContent = "Criar conta";
    }
  });

  $("#form-reset").addEventListener("submit", async (e) => {
    e.preventDefault();
    err("#reset-error", "");
    try {
      await resetPassword($("#reset-email").value.trim());
      toast("Link de redefinição enviado ao seu e-mail.", "success");
      switchLoginForm("login");
    } catch (ex) {
      err("#reset-error", friendlyAuthError(ex));
    }
  });

  $("#btn-logout").addEventListener("click", async () => {
    if (!confirm("Sair da sua conta?")) return;
    await logout();
    navigate("dashboard");
  });

  $("#link-show-register").onclick = () => switchLoginForm("register");
  $("#link-show-reset").onclick = () => switchLoginForm("reset");
  $("#link-back-login-1").onclick = () => switchLoginForm("login");
  $("#link-back-login-2").onclick = () => switchLoginForm("login");
}

function switchLoginForm(which) {
  $("#form-login").classList.toggle("hidden", which !== "login");
  $("#form-register").classList.toggle("hidden", which !== "register");
  $("#form-reset").classList.toggle("hidden", which !== "reset");
}

// ---------------------------------------------------------------------
// Tema
// ---------------------------------------------------------------------
function wireThemeSwitch() {
  $("#theme-switch").addEventListener("click", () => toggleTheme());
}

// ---------------------------------------------------------------------
// Online / offline
// ---------------------------------------------------------------------
function wireOnlineOfflineBanner() {
  function update() {
    const online = navigator.onLine;
    const pill = $("#conn-pill");
    const banner = $("#offline-banner");
    if (pill) {
      pill.classList.toggle("offline", !online);
      $("#conn-text").textContent = online ? "Online" : "Offline";
    }
    if (banner) banner.classList.toggle("show", !online);
  }
  window.addEventListener("online", () => { update(); toast("Conexão restabelecida — sincronizando…", "success"); });
  window.addEventListener("offline", update);
  update();
}

// ---------------------------------------------------------------------
// PWA — service worker
// ---------------------------------------------------------------------
function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    });
  }
}

// Fecha modais clicando fora
document.addEventListener("click", (e) => {
  if (e.target.classList && e.target.classList.contains("modal-backdrop")) {
    e.target.classList.remove("show");
    document.body.style.overflow = "";
  }
});

// Fallback: se após 6s ainda estiver no splash e Firebase configurado mas
// sem resposta (ex: bloqueio de rede), mostra a tela de login mesmo assim.
setTimeout(() => {
  if (FIREBASE_READY && !$("#splash").classList.contains("hidden")) {
    showLogin();
  }
}, 6000);
