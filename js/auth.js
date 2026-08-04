/**
 * auth.js — autenticação simples com Firebase Auth (e-mail/senha).
 */
import { auth, TEAM_ACCESS_CODE } from "./firebase-config.js";
import {
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, sendPasswordResetEmail, updateProfile
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

export function watchAuth(onLogin, onLogout) {
  return onAuthStateChanged(auth, (user) => {
    if (user) onLogin(user);
    else onLogout();
  });
}

export async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function register(name, email, password, accessCode) {
  if (accessCode.trim() !== TEAM_ACCESS_CODE) {
    throw new Error("Código de acesso da equipe inválido.");
  }
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  return cred.user;
}

export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

export async function logout() {
  await signOut(auth);
}

// Traduz códigos de erro do Firebase para mensagens amigáveis (equipe não-técnica)
export function friendlyAuthError(err) {
  const code = err?.code || "";
  const map = {
    "auth/invalid-email": "E-mail inválido.",
    "auth/user-not-found": "Não encontramos uma conta com esse e-mail.",
    "auth/wrong-password": "Senha incorreta.",
    "auth/invalid-credential": "E-mail ou senha incorretos.",
    "auth/email-already-in-use": "Já existe uma conta com esse e-mail.",
    "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
    "auth/too-many-requests": "Muitas tentativas. Aguarde um momento e tente novamente.",
    "auth/network-request-failed": "Sem conexão com a internet no momento."
  };
  return map[code] || err.message || "Ocorreu um erro. Tente novamente.";
}
