import type { SalesDemoScript } from "@/lib/demoScripts/types";

export const salesDemoScripts: SalesDemoScript[] = [
  {
    id: "first-reply-wins",
    title: "Quem responde primeiro, marca primeiro",
    targetBusinessType: "Serviços com procura por disponibilidade",
    painPoint:
      "Clientes escolhem quem responde primeiro quando estão prontos para marcar.",
    storyBeats: [
      "Lead chega",
      "Assistente responde",
      "Reserva é criada",
      "KPIs mexem",
    ],
    recommendedProfileSlug: "beauty_salon",
    recommendedScenarioSlug: "calm_week",
    suggestedSeed: "first-reply-wins",
    suggestedSimulatedDays: 2,
    suggestedAppointmentsPerDay: 3,
    suggestedIntensity: "medium",
    talkingPoints: [
      "Mostre velocidade de resposta sem prometer produção real.",
      "Enquadre cada resposta como dado demo simulado.",
    ],
    expectedImpactHighlights: [
      "Mais mensagens cobertas",
      "Menos trabalho manual estimado",
    ],
  },
  {
    id: "friday-barbershop",
    title: "Sexta-feira cheia na barbearia",
    targetBusinessType: "Barbearia",
    painPoint:
      "Picos de sexta criam pressão no balcão e deixam leads sem resposta.",
    storyBeats: [
      "Procura sobe",
      "Horários esgotam",
      "Remarcações aparecem",
      "Resumo fecha o dia",
    ],
    recommendedProfileSlug: "barbershop",
    recommendedScenarioSlug: "busy_weekend",
    suggestedSeed: "friday-barber",
    suggestedSimulatedDays: 2,
    suggestedAppointmentsPerDay: 4,
    suggestedIntensity: "high",
    talkingPoints: [
      "Aponte para a agenda viva.",
      "Use cancelamentos como momento de controlo, não falha.",
    ],
    expectedImpactHighlights: [
      "Ocupação simulada maior",
      "Pressão operacional visível",
    ],
  },
  {
    id: "manicure-campaign",
    title: "Campanha de manicure",
    targetBusinessType: "Nail studio",
    painPoint: "Campanhas geram leads rápidos que precisam de triagem clara.",
    storyBeats: [
      "Promoção ativa",
      "Mensagens chegam",
      "Assistente qualifica",
      "Bookings convertem",
    ],
    recommendedProfileSlug: "nail_studio",
    recommendedScenarioSlug: "promo_campaign",
    suggestedSeed: "manicure-campaign",
    suggestedSimulatedDays: 3,
    suggestedAppointmentsPerDay: 3,
    suggestedIntensity: "high",
    talkingPoints: [
      "Mostre ligação entre campanha e agenda.",
      "Reforce que impacto é estimativa simulada.",
    ],
    expectedImpactHighlights: [
      "Novos clientes simulados",
      "Conversas capturadas",
    ],
  },
  {
    id: "chaotic-cancellations",
    title: "Dia caótico com cancelamentos",
    targetBusinessType: "Negócio com agenda cheia",
    painPoint:
      "Cancelamentos e no-shows escondem oportunidades de recuperação.",
    storyBeats: [
      "Dia começa normal",
      "Disrupções surgem",
      "Assistente mantém contexto",
      "Resumo explica pressão",
    ],
    recommendedProfileSlug: "barbershop",
    recommendedScenarioSlug: "chaotic_day",
    suggestedSeed: "chaotic-cancel",
    suggestedSimulatedDays: 1,
    suggestedAppointmentsPerDay: 5,
    suggestedIntensity: "high",
    talkingPoints: [
      "Use filtros de disrupção.",
      "Mostre segurança: sem envios externos.",
    ],
    expectedImpactHighlights: [
      "Pressão cancelamento/no-show",
      "Disrupções contadas",
    ],
  },
  {
    id: "before-after-assistant",
    title: "Antes e depois do assistente",
    targetBusinessType: "Operação madura",
    painPoint:
      "Equipa perde tempo em respostas repetitivas e perde visibilidade comercial.",
    storyBeats: [
      "Mensagens repetem padrões",
      "Assistente cobre respostas",
      "Reservas avançam",
      "Impacto resume diferença",
    ],
    recommendedProfileSlug: "beauty_salon",
    recommendedScenarioSlug: "mature_business",
    suggestedSeed: "before-after",
    suggestedSimulatedDays: 3,
    suggestedAppointmentsPerDay: 4,
    suggestedIntensity: "medium",
    talkingPoints: [
      "Compare trabalho manual estimado.",
      "Evite prometer performance real.",
    ],
    expectedImpactHighlights: [
      "Respostas manuais poupadas",
      "Bookings tocados",
    ],
  },
];

export function getSalesDemoScriptById(id: string) {
  return salesDemoScripts.find((script) => script.id === id);
}
