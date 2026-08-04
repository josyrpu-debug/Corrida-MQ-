/**
 * db.js — camada de acesso ao Firestore.
 * Centraliza toda leitura/escrita para manter as telas (views) simples.
 */
import { db } from "./firebase-config.js";
import {
  collection, doc, setDoc, addDoc, updateDoc, deleteDoc, getDocs,
  onSnapshot, query, orderBy, serverTimestamp, writeBatch, limit
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { AREAS, TIMELINE_DEFAULT, CONTACTS_DEFAULT, EMERGENCY_PROTOCOLS } from "./data.js";

const col = {
  tasks: collection(db, "tasks"),
  timeline: collection(db, "timeline"),
  contacts: collection(db, "contacts"),
  activity: collection(db, "activity"),
  incidents: collection(db, "incidents"),
  meta: collection(db, "meta")
};

// -------------------------------------------------------------------------
// Seed inicial — roda uma única vez (marca em meta/seed) para popular a
// linha do tempo padrão e os contatos padrão. As TAREFAS (checklist) não
// são semeadas automaticamente: a equipe cria as tarefas de cada área
// pelo próprio app, evitando poluir o banco com itens que não se aplicam
// à realidade de cada edição do evento.
// -------------------------------------------------------------------------
export async function seedIfNeeded() {
  try {
    const existing = await getDocs(query(col.timeline, limit(1)));
    if (existing.empty) {
      const batch = writeBatch(db);
      TIMELINE_DEFAULT.forEach((item, i) => {
        const ref = doc(col.timeline);
        batch.set(ref, { ...item, ordem: i, realizado: false, createdAt: serverTimestamp() });
      });
      await batch.commit();
    }
  } catch (e) { /* offline na 1ª carga: tudo bem, tentará de novo depois */ }

  try {
    const existingContacts = await getDocs(query(col.contacts, limit(1)));
    if (existingContacts.empty) {
      const batch = writeBatch(db);
      CONTACTS_DEFAULT.forEach((c) => {
        const ref = doc(col.contacts);
        batch.set(ref, c);
      });
      await batch.commit();
    }
  } catch (e) { /* idem */ }
}

// -------------------------------------------------------------------------
// Log de atividades ("últimas atualizações feitas pela equipe")
// -------------------------------------------------------------------------
export async function logActivity({ type, text, level = "info", area = null }) {
  try {
    await addDoc(col.activity, {
      type, text, level, area,
      at: serverTimestamp()
    });
  } catch (e) { /* silencioso: não deve travar a ação principal */ }
}

export function listenActivity(cb, max = 25) {
  const q = query(col.activity, orderBy("at", "desc"), limit(max));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}

// -------------------------------------------------------------------------
// Tarefas (checklist)
// -------------------------------------------------------------------------
export function listenTasks(cb) {
  return onSnapshot(col.tasks, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, (err) => console.warn("listenTasks:", err.message));
}

export async function saveTask(taskId, data, userName) {
  const payload = {
    ...data,
    lastUpdatedBy: userName,
    lastUpdatedAt: serverTimestamp()
  };
  if (taskId) {
    await updateDoc(doc(db, "tasks", taskId), payload);
    return taskId;
  } else {
    const ref = await addDoc(col.tasks, { ...payload, createdAt: serverTimestamp() });
    return ref.id;
  }
}

export async function deleteTask(taskId) {
  await deleteDoc(doc(db, "tasks", taskId));
}

export async function setTaskStatus(taskId, status, userName) {
  const payload = {
    status,
    lastUpdatedBy: userName,
    lastUpdatedAt: serverTimestamp()
  };
  if (status === "concluido") payload.horarioConclusao = serverTimestamp();
  await updateDoc(doc(db, "tasks", taskId), payload);
}

// -------------------------------------------------------------------------
// Linha do tempo
// -------------------------------------------------------------------------
export function listenTimeline(cb) {
  const q = query(col.timeline, orderBy("ordem", "asc"));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}

export async function toggleTimelineItem(itemId, realizado, userName) {
  await updateDoc(doc(db, "timeline", itemId), {
    realizado,
    lastUpdatedBy: userName,
    lastUpdatedAt: serverTimestamp()
  });
}

export async function addTimelineItem({ horario, titulo }, ordem) {
  await addDoc(col.timeline, { horario, titulo, ordem, realizado: false, createdAt: serverTimestamp() });
}

export async function deleteTimelineItem(itemId) {
  await deleteDoc(doc(db, "timeline", itemId));
}

// -------------------------------------------------------------------------
// Contatos
// -------------------------------------------------------------------------
export function listenContacts(cb) {
  return onSnapshot(col.contacts, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}

export async function saveContact(contactId, data) {
  if (contactId) await updateDoc(doc(db, "contacts", contactId), data);
  else await addDoc(col.contacts, data);
}

export async function deleteContact(contactId) {
  await deleteDoc(doc(db, "contacts", contactId));
}

// -------------------------------------------------------------------------
// Incidentes (protocolos de emergência ativados em tempo real)
// -------------------------------------------------------------------------
export function listenIncidents(cb) {
  const q = query(col.incidents, orderBy("createdAt", "desc"), limit(20));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}

export async function openIncident(protocolId, userName) {
  const protocol = EMERGENCY_PROTOCOLS.find((p) => p.id === protocolId);
  if (!protocol) return null;
  const ref = await addDoc(col.incidents, {
    protocolId,
    nome: protocol.nome,
    icone: protocol.icone,
    passos: protocol.passos.map((texto) => ({ texto, feito: false })),
    status: "ativo",
    abertoPor: userName,
    createdAt: serverTimestamp(),
    lastUpdatedAt: serverTimestamp()
  });
  await logActivity({ type: "incident", text: `🚨 ${userName} acionou o protocolo: ${protocol.nome}`, level: "crit" });
  return ref.id;
}

export async function toggleIncidentStep(incidentId, stepIndex, passos, userName) {
  const updated = passos.map((p, i) => (i === stepIndex ? { ...p, feito: !p.feito } : p));
  await updateDoc(doc(db, "incidents", incidentId), {
    passos: updated,
    lastUpdatedBy: userName,
    lastUpdatedAt: serverTimestamp()
  });
}

export async function resolveIncident(incidentId, userName) {
  await updateDoc(doc(db, "incidents", incidentId), {
    status: "resolvido",
    resolvidoPor: userName,
    lastUpdatedAt: serverTimestamp()
  });
  await logActivity({ type: "incident", text: `✅ ${userName} encerrou uma ocorrência`, level: "ok" });
}
