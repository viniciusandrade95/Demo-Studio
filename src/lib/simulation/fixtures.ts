import type {
  BusinessProfile,
  DemoSession,
  ScenarioPreset,
} from "@/lib/simulation/types";

export const businessProfiles: BusinessProfile[] = [
  {
    slug: "beauty_salon",
    name: "Atelier Lumina Beauty",
    vertical: "beauty_salon",
    city: "Lisbon",
    timezone: "Europe/Lisbon",
    services: ["Blowout", "Color consultation", "Facial treatment"],
    tone: "premium",
    simulatedLabel: "Simulated beauty salon profile for demo storytelling.",
  },
  {
    slug: "barbershop",
    name: "Marqo Demo Barbers",
    vertical: "barbershop",
    city: "Lisbon",
    timezone: "Europe/Lisbon",
    services: ["Haircut", "Beard Trim", "Haircut + Beard"],
    tone: "efficient",
    simulatedLabel: "Simulated barbershop profile for demo storytelling.",
  },
  {
    slug: "nail_studio",
    name: "North Star Nails",
    vertical: "nail_studio",
    city: "Porto",
    timezone: "Europe/Lisbon",
    services: ["Gel manicure", "Nail art", "Pedicure"],
    tone: "warm",
    simulatedLabel: "Simulated nail studio profile for demo storytelling.",
  },
];

export const scenarioPresets: ScenarioPreset[] = [
  {
    slug: "calm_week",
    title: "Calm Week",
    description:
      "A steady week with enough demand to show reliable assistant handling without disruption.",
    intensity: "calm",
    commercialStory:
      "Shows dependable conversion and tidy operator visibility.",
    suggestedProfileSlugs: ["beauty_salon", "barbershop", "nail_studio"],
    durationDays: 5,
  },
  {
    slug: "busy_weekend",
    title: "Busy Weekend",
    description:
      "Weekend demand rises while the assistant protects high-value slots.",
    intensity: "busy",
    commercialStory:
      "Frames Marqo as a revenue capture layer during peak demand.",
    suggestedProfileSlugs: ["barbershop", "nail_studio"],
    durationDays: 3,
  },
  {
    slug: "chaotic_day",
    title: "Chaotic Day",
    description:
      "Same-day cancellations, late arrivals, and urgent customer questions arrive together.",
    intensity: "chaotic",
    commercialStory:
      "Creates a crisp disruption story without claiming production activity.",
    suggestedProfileSlugs: ["beauty_salon", "barbershop"],
    durationDays: 1,
  },
  {
    slug: "new_business",
    title: "New Business",
    description:
      "A young business builds its first customer rhythm and needs clear follow-up.",
    intensity: "calm",
    commercialStory:
      "Highlights setup speed, pipeline visibility, and safe simulated onboarding.",
    suggestedProfileSlugs: ["nail_studio", "beauty_salon"],
    durationDays: 7,
  },
  {
    slug: "mature_business",
    title: "Mature Business",
    description:
      "A booked-out operator needs prioritization, reschedules, and KPI clarity.",
    intensity: "busy",
    commercialStory:
      "Shows control-room value for an established team with real operating pressure.",
    suggestedProfileSlugs: ["barbershop", "beauty_salon"],
    durationDays: 7,
  },
  {
    slug: "promo_campaign",
    title: "Promo Campaign",
    description:
      "A limited promotion creates a burst of leads, replies, and booking movement.",
    intensity: "busy",
    commercialStory:
      "Connects marketing activity to bookings and assistant-led response quality.",
    suggestedProfileSlugs: ["beauty_salon", "nail_studio"],
    durationDays: 4,
  },
];

export const demoSessions: DemoSession[] = [
  {
    id: "session-alpha",
    title: "Barbershop Weekday Lift",
    businessName: "Marqo Demo Barbers",
    vertical: "Barbershop",
    city: "Lisbon",
    scenario: "After-work demand spike",
    operatorSummary:
      "A weekday session designed for commercial demos: messages arrive, the assistant converts demand into bookings, and schedule friction creates realistic KPI movement.",
    simulatedLabel: "All activity in this session is simulated demo data.",
    profileSlug: "barbershop",
    scenarioSlug: "busy_weekend",
    mode: "guided",
    safetyStatus: "simulated_only",
    events: [
      {
        id: "evt-001",
        kind: "customer_message",
        at: "2026-05-06T09:12:00Z",
        customerName: "Miguel Costa",
        channel: "whatsapp",
        direction: "inbound",
        message: "Bom dia, têm corte depois das 18h?",
      },
      {
        id: "evt-002",
        kind: "assistant_reply",
        at: "2026-05-06T09:13:00Z",
        customerName: "Miguel Costa",
        channel: "whatsapp",
        direction: "outbound",
        message: "Temos 18:10 e 18:40. Posso reservar um deles para si.",
      },
      {
        id: "evt-003",
        kind: "booking_created",
        at: "2026-05-06T09:18:00Z",
        bookingId: "BK-1001",
        customerName: "Miguel Costa",
        serviceName: "Haircut",
        scheduledFor: "2026-05-06T18:10:00Z",
        status: "confirmed",
      },
      {
        id: "evt-004",
        kind: "customer_message",
        at: "2026-05-06T09:22:00Z",
        customerName: "Ana Ribeiro",
        channel: "web_chat",
        direction: "inbound",
        message: "Queria marcar barba e corte amanhã ao almoço.",
      },
      {
        id: "evt-005",
        kind: "assistant_reply",
        at: "2026-05-06T09:23:00Z",
        customerName: "Ana Ribeiro",
        channel: "web_chat",
        direction: "outbound",
        message: "Consigo propor 12:30 amanhã para corte + barba. Confirmo?",
      },
      {
        id: "evt-006",
        kind: "booking_created",
        at: "2026-05-06T09:26:00Z",
        bookingId: "BK-1002",
        customerName: "Ana Ribeiro",
        serviceName: "Haircut + Beard",
        scheduledFor: "2026-05-07T12:30:00Z",
        status: "requested",
      },
      {
        id: "evt-007",
        kind: "kpi_marker",
        at: "2026-05-06T09:27:00Z",
        label: "Lead-to-booking momentum",
        value: "+18%",
        tone: "accent",
      },
      {
        id: "evt-008",
        kind: "booking_updated",
        at: "2026-05-06T11:40:00Z",
        bookingId: "BK-1002",
        customerName: "Ana Ribeiro",
        serviceName: "Haircut + Beard",
        scheduledFor: "2026-05-07T13:00:00Z",
        status: "rescheduled",
      },
      {
        id: "evt-009",
        kind: "customer_message",
        at: "2026-05-06T12:08:00Z",
        customerName: "Luis Matos",
        channel: "whatsapp",
        direction: "inbound",
        message: "Afinal hoje não vou conseguir aparecer.",
      },
      {
        id: "evt-010",
        kind: "booking_updated",
        at: "2026-05-06T12:09:00Z",
        bookingId: "BK-0998",
        customerName: "Luis Matos",
        serviceName: "Beard Trim",
        scheduledFor: "2026-05-06T12:30:00Z",
        status: "cancelled",
      },
      {
        id: "evt-011",
        kind: "kpi_marker",
        at: "2026-05-06T12:10:00Z",
        label: "Same-day churn pressure",
        value: "1 cancellation",
        tone: "warning",
      },
      {
        id: "evt-012",
        kind: "booking_updated",
        at: "2026-05-06T18:55:00Z",
        bookingId: "BK-1001",
        customerName: "Miguel Costa",
        serviceName: "Haircut",
        scheduledFor: "2026-05-06T18:10:00Z",
        status: "completed",
      },
      {
        id: "evt-013",
        kind: "booking_updated",
        at: "2026-05-07T13:25:00Z",
        bookingId: "BK-1002",
        customerName: "Ana Ribeiro",
        serviceName: "Haircut + Beard",
        scheduledFor: "2026-05-07T13:00:00Z",
        status: "no_show",
      },
    ],
  },
];

export function getBusinessProfileBySlug(
  slug: string,
): BusinessProfile | undefined {
  return businessProfiles.find((profile) => profile.slug === slug);
}

export function getScenarioPresetBySlug(
  slug: string,
): ScenarioPreset | undefined {
  return scenarioPresets.find((scenario) => scenario.slug === slug);
}

export function getDemoSessionById(sessionId: string): DemoSession | undefined {
  return demoSessions.find((session) => session.id === sessionId);
}
