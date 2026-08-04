/**
 * data.js — dados de referência do evento.
 * Estes dados "semeiam" o Firestore na primeira vez que o app roda
 * (ver seed() em utils.js) e também servem de fonte para telas estáticas
 * como os protocolos de emergência.
 */

export const EVENT_INFO = {
  nome: "1ª Corrida e Caminhada Nossa Senhora do Amparo",
  data: "2026-08-09",
  cidade: "Maricá/RJ",
  distancia: "5 km"
};

// Áreas do checklist (ordem = ordem de exibição)
export const AREAS = [
  { id: "inscricoes", nome: "Inscrições", icone: "📝" },
  { id: "kits", nome: "Entrega de Kits", icone: "🎒" },
  { id: "percurso", nome: "Percurso", icone: "🗺️" },
  { id: "cones", nome: "Cones", icone: "🚧" },
  { id: "hidratacao", nome: "Hidratação", icone: "💧" },
  { id: "alimentacao", nome: "Alimentação", icone: "🍌" },
  { id: "ambulancia", nome: "Ambulância", icone: "🚑" },
  { id: "seguranca", nome: "Segurança", icone: "🛡️" },
  { id: "transito", nome: "Trânsito", icone: "🚦" },
  { id: "staff", nome: "Staff", icone: "🧑‍💼" },
  { id: "voluntarios", nome: "Voluntários", icone: "🙋" },
  { id: "comunicacao", nome: "Comunicação", icone: "📣" },
  { id: "fotografia", nome: "Fotografia", icone: "📷" },
  { id: "sonorizacao", nome: "Sonorização", icone: "🔊" },
  { id: "premiacao", nome: "Premiação", icone: "🏆" },
  { id: "medalhas", nome: "Medalhas", icone: "🥇" },
  { id: "trofeus", nome: "Troféus", icone: "🏆" },
  { id: "secretaria", nome: "Secretaria", icone: "🗂️" },
  { id: "largada", nome: "Largada", icone: "🏁" },
  { id: "chegada", nome: "Chegada", icone: "🎯" },
  { id: "limpeza", nome: "Limpeza", icone: "🧹" },
  { id: "pos_evento", nome: "Pós-evento", icone: "📦" }
];

export function areaName(id) {
  const a = AREAS.find((x) => x.id === id);
  return a ? a.nome : id;
}
export function areaIcon(id) {
  const a = AREAS.find((x) => x.id === id);
  return a ? a.icone : "📌";
}

// Linha do tempo padrão do dia da corrida (semeada no Firestore na 1ª vez)
export const TIMELINE_DEFAULT = [
  { horario: "05:00", titulo: "Chegada da equipe" },
  { horario: "05:30", titulo: "Montagem da estrutura" },
  { horario: "06:00", titulo: "Hidratação pronta" },
  { horario: "06:30", titulo: "Entrega dos kits" },
  { horario: "07:30", titulo: "Fechamento das inscrições" },
  { horario: "08:00", titulo: "Aquecimento" },
  { horario: "08:30", titulo: "Largada" },
  { horario: "09:15", titulo: "Chegada dos primeiros colocados" },
  { horario: "09:45", titulo: "Encerramento do percurso" },
  { horario: "10:00", titulo: "Premiação" },
  { horario: "10:30", titulo: "Desmontagem" },
  { horario: "11:30", titulo: "Encerramento oficial" }
];

// Contatos de emergência / importantes (semeados no Firestore)
export const CONTACTS_DEFAULT = [
  { categoria: "Emergência", nome: "Polícia Militar", telefone: "190" },
  { categoria: "Emergência", nome: "Bombeiros", telefone: "193" },
  { categoria: "Emergência", nome: "SAMU / Ambulância", telefone: "192" },
  { categoria: "Organização", nome: "Coordenação Geral", telefone: "" },
  { categoria: "Organização", nome: "Organização do Evento", telefone: "" },
  { categoria: "Operação", nome: "Trânsito / Apoio Viário", telefone: "" },
  { categoria: "Comunicação", nome: "Fotógrafo Oficial", telefone: "" },
  { categoria: "Comunicação", nome: "Locutor", telefone: "" }
];

// Protocolos de ações rápidas para situações de emergência.
// Cada item vira um checklist sincronizado em tempo real quando acionado.
export const EMERGENCY_PROTOCOLS = [
  {
    id: "atleta_mal",
    nome: "Atleta passou mal",
    icone: "🩹",
    passos: [
      "Isolar e sinalizar o local imediatamente",
      "Acionar a equipe de ambulância/socorristas no local",
      "Não mover o atleta, salvo risco imediato",
      "Registrar horário e ponto do percurso da ocorrência",
      "Avisar a coordenação geral por rádio/telefone",
      "Se necessário, acionar SAMU (192)",
      "Registrar desfecho (encaminhado, liberado, recusou atendimento)"
    ]
  },
  {
    id: "acidente",
    nome: "Acidente",
    icone: "⚠️",
    passos: [
      "Garantir a segurança do local (sinalizar/isolar)",
      "Prestar/acionar primeiros socorros",
      "Acionar ambulância e, se grave, Bombeiros (193)",
      "Avisar imediatamente a coordenação geral",
      "Registrar fotos do local (se seguro) e horário",
      "Coletar dados das pessoas envolvidas",
      "Comunicar decisão sobre continuidade do trecho/prova"
    ]
  },
  {
    id: "chuva",
    nome: "Chuva",
    icone: "🌧️",
    passos: [
      "Verificar previsão/intensidade com a equipe de comunicação",
      "Proteger equipamentos de som, secretaria e premiação",
      "Avaliar segurança do percurso (pontos escorregadios, alagamento)",
      "Orientar staff e voluntários sobre capas/abrigo",
      "Decidir com a coordenação: manter, adiar largada ou cancelar",
      "Comunicar decisão ao locutor para informar os atletas"
    ]
  },
  {
    id: "falta_energia",
    nome: "Falta de energia",
    icone: "🔌",
    passos: [
      "Verificar gerador/energia reserva disponível",
      "Priorizar sonorização da largada/chegada e secretaria",
      "Avisar fotografia e comunicação sobre equipamentos com bateria",
      "Comunicar equipe técnica responsável pela energia",
      "Informar coordenação sobre tempo estimado de normalização"
    ]
  },
  {
    id: "problema_percurso",
    nome: "Problema no percurso",
    icone: "🚧",
    passos: [
      "Identificar exatamente o ponto do percurso afetado",
      "Isolar a área e sinalizar rota alternativa, se houver",
      "Acionar equipe de trânsito/cones para reforço no local",
      "Avisar locutor para orientar os atletas",
      "Avaliar necessidade de apoio da segurança/trânsito local",
      "Registrar ocorrência e horário de normalização"
    ]
  },
  {
    id: "problema_hidratacao",
    nome: "Problema na hidratação",
    icone: "💧",
    passos: [
      "Verificar estoque de água/isotônico disponível",
      "Redistribuir reservas entre os pontos de hidratação",
      "Acionar apoio para reposição emergencial, se necessário",
      "Avisar staff dos pontos afetados",
      "Informar coordenação sobre a situação e prazo de solução"
    ]
  },
  {
    id: "cancelamento",
    nome: "Cancelamento",
    icone: "⛔",
    passos: [
      "Coordenação geral formaliza a decisão de cancelamento",
      "Comunicar imediatamente locutor e equipe de som",
      "Avisar segurança, trânsito e ambulância sobre a mudança",
      "Publicar aviso oficial nos canais de comunicação do evento",
      "Orientar staff sobre desmontagem e liberação dos atletas",
      "Organizar devolução/reagendamento de kits e premiação, se aplicável"
    ]
  }
];
