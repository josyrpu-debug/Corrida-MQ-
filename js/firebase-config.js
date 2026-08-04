/**
 * firebase-config.js
 * -------------------------------------------------------------------------
 * Configuração e inicialização do Firebase (plano gratuito "Spark").
 *
 * ⚠️ PASSO OBRIGATÓRIO ANTES DE USAR O APP:
 *   1. Crie um projeto em https://console.firebase.google.com
 *   2. Ative "Authentication" -> método "E-mail/senha"
 *   3. Crie um banco "Firestore Database" (modo produção, região "southamerica-east1")
 *   4. Em "Configurações do projeto" > "Seus apps" > "Web", copie o objeto de
 *      configuração e cole substituindo os valores de exemplo abaixo.
 *
 * Veja o passo a passo completo no README.md (seção "Configurar o Firebase").
 */

const firebaseConfig = {
  apiKey: "COLE_AQUI_SUA_API_KEY",
  authDomain: "SEU-PROJETO.firebaseapp.com",
  projectId: "SEU-PROJETO",
  storageBucket: "SEU-PROJETO.appspot.com",
  messagingSenderId: "COLE_AQUI",
  appId: "COLE_AQUI"
};

// Código de acesso exigido para criar uma nova conta de equipe pelo app.
// Troque para algo só a organização saiba, e combine com a equipe.
// (Isso é só uma barreira simples contra cadastros indevidos — não é uma
// senha "secreta" de segurança forte, mas evita que estranhos se cadastrem.)
export const TEAM_ACCESS_CODE = "AMPARO2026";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(() => {});

// Firestore com cache local persistente = funcionamento offline +
// sincronização automática quando a internet voltar (requisito do app).
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

export const FIREBASE_READY = !firebaseConfig.apiKey.startsWith("COLE_AQUI");
