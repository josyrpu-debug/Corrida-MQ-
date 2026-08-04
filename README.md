# 🏁 Painel da Organização — 1ª Corrida Nossa Senhora do Amparo

Aplicativo web (PWA) para a equipe organizadora controlar, em tempo real e
pelo celular, todas as tarefas da **1ª Corrida e Caminhada Nossa Senhora do
Amparo** — 09/08/2026, Maricá/RJ.

Instalável no Android e no iPhone, funciona offline e sincroniza
automaticamente com todos os celulares da equipe assim que a internet volta,
usando o **plano gratuito do Firebase**.

---

## 📁 Estrutura do projeto

```
corrida-app/
├── index.html                 # Tela única do app (login + painel completo)
├── manifest.json               # Configuração do PWA (nome, ícones, cores)
├── sw.js                       # Service Worker (funcionamento offline)
├── firebase.json                # Config opcional p/ Firebase CLI (regras/hosting)
├── firestore.rules             # Regras de segurança do banco de dados
├── firestore.indexes.json      # Índices do Firestore (vazio por padrão)
├── css/
│   └── style.css               # Todo o visual do app (cores, layout, componentes)
├── js/
│   ├── firebase-config.js      # ⚠️ Onde você cola as chaves do seu Firebase
│   ├── data.js                 # Áreas do checklist, cronograma e protocolos padrão
│   ├── db.js                   # Toda a comunicação com o Firestore
│   ├── auth.js                 # Login, cadastro e recuperação de senha
│   ├── theme.js                # Modo claro/escuro
│   ├── router.js                # Navegação entre as telas
│   ├── utils.js                # Funções auxiliares (datas, fotos, toasts...)
│   ├── main.js                  # Ponto de entrada — liga tudo
│   └── views/
│       ├── dashboard.js         # Tela inicial (percentuais, atividades)
│       ├── checklists.js        # Áreas + tarefas + modal de edição
│       ├── timeline.js          # Linha do tempo / cronograma
│       ├── panel.js             # Painel Geral (visão de tudo, colorida)
│       ├── communication.js     # Contatos e protocolos de emergência
│       └── raceday.js           # Modo Dia da Corrida (tela cheia)
├── icons/                       # Ícones do app gerados a partir do logo oficial
└── assets/
    └── logo.png                 # Logo oficial da corrida
```

Todo o código é **JavaScript puro (vanilla)** com módulos ES — não precisa
instalar Node.js, React ou nenhuma ferramenta de build. Isso torna a
publicação em GitHub Pages / Netlify / Vercel extremamente simples: são só
arquivos estáticos.

---

## 🔧 1. Passo a passo para configurar o Firebase (gratuito)

O plano **Spark** (gratuito) do Firebase é suficiente para este app.

1. Acesse **https://console.firebase.google.com** e faça login com uma
   conta Google.
2. Clique em **"Adicionar projeto"**, dê um nome (ex: `corrida-amparo`) e
   conclua a criação (pode desativar o Google Analytics, não é necessário).
3. No menu lateral, vá em **Compilação > Authentication** → clique em
   **"Começar"** → na aba "Sign-in method", ative o provedor
   **"E-mail/senha"** → Salvar.
4. No menu lateral, vá em **Compilação > Firestore Database** → **"Criar
   banco de dados"** → escolha o modo **produção** → selecione a região
   **`southamerica-east1` (São Paulo)** → Ativar.
5. Ainda no Firestore, vá na aba **"Regras"**, apague o conteúdo e cole o
   conteúdo do arquivo `firestore.rules` deste projeto → **Publicar**.
6. Volte para a página inicial do projeto (ícone de casa) → clique no
   ícone **`</>`** ("Adicionar app" → Web) → dê um apelido (ex:
   `painel-corrida`) → **não** marque Firebase Hosting → "Registrar app".
7. O Firebase vai mostrar um bloco `firebaseConfig = { apiKey: ..., ... }`.
   **Copie esse objeto inteiro.**
8. Abra o arquivo **`js/firebase-config.js`** deste projeto e substitua o
   objeto `firebaseConfig` de exemplo pelos valores copiados no passo 7.
9. (Opcional, mas recomendado) No mesmo arquivo, troque o valor de
   `TEAM_ACCESS_CODE` para uma palavra-código que só a sua equipe conheça.
   Ela será exigida para qualquer pessoa criar uma conta no app.
10. Pronto! O banco de dados está configurado. Na primeira vez que alguém
    abrir o app, ele cria automaticamente o cronograma padrão e a lista de
    contatos (você edita/completa tudo depois, direto pelo app).

### Criando os primeiros usuários da equipe
Qualquer pessoa com o **código de acesso da equipe** pode criar sua própria
conta na tela de login → **"Criar conta da equipe"**. Se preferir criar as
contas você mesmo, faça isso em **Authentication > Users > Add user** no
Console do Firebase.

### Sobre fotos anexadas às tarefas
Para manter o app 100% dentro do plano **gratuito**, as fotos anexadas às
tarefas são comprimidas no próprio celular e guardadas dentro do Firestore
(o Firebase Storage passou a exigir plano pago mesmo para uso mínimo). Isso
funciona muito bem para fotos de acompanhamento de tarefas — apenas evite
anexar dezenas de fotos grandes na mesma tarefa.

---

## 💻 2. Passo a passo para instalar/testar gratuitamente no computador

Você só precisa de um navegador e (para testar localmente) um servidor
estático simples, porque módulos ES não funcionam abrindo o `index.html`
diretamente com duplo clique (`file://`).

**Opção A — Extensão do navegador (mais fácil, sem instalar nada no PC):**
No VS Code, instale a extensão **"Live Server"**, clique com o botão
direito em `index.html` → **"Open with Live Server"**.

**Opção B — Python (já vem instalado no Mac/Linux):**
```bash
cd corrida-app
python3 -m http.server 8080
```
Depois acesse `http://localhost:8080` no navegador.

**Opção C — Node.js:**
```bash
npx serve corrida-app
```

---

## 🚀 3. Passo a passo para publicar gratuitamente

Escolha **uma** das opções abaixo (todas gratuitas):

### Opção A — GitHub Pages
1. Crie uma conta em **github.com** (se ainda não tiver).
2. Crie um repositório novo (ex: `corrida-amparo-app`) e envie todos os
   arquivos desta pasta para ele (pelo site do GitHub, arraste os arquivos
   em "Add file > Upload files", ou via `git push`).
3. No repositório, vá em **Settings > Pages**.
4. Em "Branch", selecione `main` e a pasta `/root` → **Save**.
5. Em alguns minutos, o app estará no ar em algo como:
   `https://SEU-USUARIO.github.io/corrida-amparo-app/`

### Opção B — Netlify (arrastar e soltar, sem linha de comando)
1. Crie uma conta gratuita em **netlify.com**.
2. No painel, clique em **"Add new site" > "Deploy manually"**.
3. Arraste a pasta `corrida-app` inteira para a área indicada.
4. Pronto — o Netlify já publica e te dá um link gratuito
   (`https://algum-nome.netlify.app`). Você pode renomear o subdomínio nas
   configurações do site.

### Opção C — Vercel
1. Crie uma conta gratuita em **vercel.com**.
2. Clique em **"Add New... > Project"** e importe o repositório do GitHub
   (ou use o comando `npx vercel` dentro da pasta do projeto).
3. Como é um site estático, não é necessário configurar build command —
   apenas confirme e clique em "Deploy".

> ⚠️ Depois de publicar, volte ao **Firebase Console > Authentication >
> Settings > Authorized domains** e adicione o domínio onde o app ficou no
> ar (ex: `seu-usuario.github.io` ou `algum-nome.netlify.app`). Sem isso, o
> login não funciona no endereço publicado.

---

## 📲 4. Instalando no celular (Android e iPhone)

**Android (Chrome):**
1. Abra o link do app publicado.
2. Toque no menu (⋮) → **"Adicionar à tela inicial"** / **"Instalar
   aplicativo"**.
3. O ícone oficial da corrida aparecerá na tela como um app normal.

**iPhone (Safari):**
1. Abra o link do app publicado **no Safari** (o "Adicionar à Tela de
   Início" só aparece no Safari, não no Chrome do iPhone).
2. Toque no ícone de compartilhar (□ com seta para cima).
3. Toque em **"Adicionar à Tela de Início"**.
4. O app abrirá em tela cheia, como um aplicativo nativo.

---

## ✅ 5. Primeiros passos depois de publicado

1. Crie sua conta pelo app usando o código de acesso da equipe.
2. Vá em **Checklists**, escolha uma área (ex: Hidratação) e cadastre as
   primeiras tarefas.
3. Vá em **Linha do Tempo** e ajuste o cronograma conforme a realidade do
   seu evento (o cronograma de exemplo já vem pré-carregado).
4. Vá em **Comunicação** e complete os telefones da sua equipe (a lista de
   categorias já vem pronta).
5. No dia 09/08/2026, use o botão vermelho **"🏁 Modo Dia da Corrida"** —
   ele mostra só o essencial em botões grandes, ideal para uso rápido no
   meio da operação.

---

## 🎨 Personalização

- **Cores/identidade visual**: todas as cores estão centralizadas no topo
  do arquivo `css/style.css`, dentro de `:root { ... }` — fáceis de
  ajustar sem mexer no restante do código.
- **Áreas do checklist**: edite a lista `AREAS` em `js/data.js`.
- **Cronograma padrão / contatos padrão / protocolos de emergência**:
  também estão em `js/data.js`.
- **Logo/ícones**: substitua `assets/logo.png` e regenere os arquivos da
  pasta `icons/` (qualquer editor de imagem ou ferramenta online de "PWA
  icon generator" resolve isso a partir do novo logo).

---

## 🛠️ Tecnologias usadas (todas gratuitas)

- HTML5, CSS3 e JavaScript puro (módulos ES) — sem frameworks, sem build.
- **Firebase** (plano gratuito Spark): Authentication + Firestore em tempo
  real, com cache local (funciona offline e sincroniza sozinho depois).
- **Web App Manifest + Service Worker** — deixam o app instalável e com
  funcionamento offline do "app shell" (telas, menus, visual).
- Hospedagem estática gratuita: GitHub Pages, Netlify ou Vercel.

---

## ❓ Problemas comuns

- **"Configuração pendente" na tela inicial** → você ainda não colou as
  chaves do Firebase em `js/firebase-config.js` (veja a seção 1).
- **Login não funciona no site publicado, mas funciona local** → adicione
  o domínio publicado em Firebase Console > Authentication > Settings >
  Authorized domains.
- **App não aparece para instalar no celular** → o PWA só funciona em
  conexões **HTTPS** (GitHub Pages/Netlify/Vercel já servem em HTTPS por
  padrão) — não funciona por `http://` simples.
- **Alterações não aparecem em outro celular** → confira o ícone de
  conexão no topo do app; se estiver "Offline", os dados sincronizam
  automaticamente assim que a internet voltar.
