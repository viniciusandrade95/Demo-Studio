export type DemoMessageDirection = "inbound" | "outbound";

export type DemoChannel = "whatsapp" | "web_chat";

export type DemoMode = "guided" | "autoplay" | "sandbox";

export type SimulationIntensity = "low" | "medium" | "high";

export type DemoSafetyStatus =
  | "simulated_only"
  | "mocked_connector"
  | "blocked_external_write";

export type DemoTenant = {
  id: string;
  name: string;
  slug: string;
  region: string;
  safetyStatus: DemoSafetyStatus;
  simulatedLabel: string;
};

export type BusinessProfile = {
  slug: string;
  name: string;
  vertical: "beauty_salon" | "barbershop" | "nail_studio";
  city: string;
  timezone: string;
  services: string[];
  tone: "premium" | "warm" | "efficient";
  simulatedLabel: string;
};

export type ScenarioPreset = {
  slug: string;
  title: string;
  description: string;
  intensity: "calm" | "busy" | "chaotic";
  commercialStory: string;
  suggestedProfileSlugs: BusinessProfile["slug"][];
  durationDays: number;
};

export type SimulationRequest = {
  profileSlug: BusinessProfile["slug"];
  scenarioSlug: ScenarioPreset["slug"];
  seed: string;
  simulatedDays: number;
  appointmentsPerDay: number;
  startDate: string;
  intensity: SimulationIntensity;
  id?: string;
  tenant?: DemoTenant;
  mode?: DemoMode;
  startsAt?: string;
  requestedBy?: string;
};

export type SimulationEventCounts = Record<DemoEventKind, number>;

export type SimulationSummary = {
  headline: string;
  highlights: string[];
  metrics: DemoKpiSnapshot;
  eventCounts: SimulationEventCounts;
  totalEvents: number;
  safetyStatus: DemoSafetyStatus;
  simulatedLabel: string;
};

export type SimulationRun = {
  runId: string;
  id: string;
  request: SimulationRequest;
  createdAt: string;
  startedAt: string;
  finishedAt: string;
  simulatedLabel: string;
  events: DemoEvent[];
  session: DemoSession;
  summary: SimulationSummary;
};

export type SimulationEventCategory =
  | "customer"
  | "message"
  | "booking"
  | "kpi"
  | "lifecycle"
  | "summary"
  | "warning";

export type DemoBookingStatus =
  | "requested"
  | "confirmed"
  | "rescheduled"
  | "cancelled"
  | "no_show"
  | "completed";

export type DemoEventKind =
  | "customer_created"
  | "customer_message"
  | "assistant_reply"
  | "booking_created"
  | "booking_updated"
  | "kpi_marker"
  | "simulation_started"
  | "simulation_finished"
  | "day_summary"
  | "warning_generated";

type DemoEventBase = {
  id: string;
  at: string;
  note?: string;
};

export type DemoCustomerCreatedEvent = DemoEventBase & {
  kind: "customer_created";
  customerId: string;
  customerName: string;
  source: DemoChannel | "walk_in" | "imported";
};

export type DemoCustomerMessageEvent = DemoEventBase & {
  kind: "customer_message";
  customerName: string;
  channel: DemoChannel;
  direction: "inbound";
  message: string;
};

export type DemoAssistantReplyEvent = DemoEventBase & {
  kind: "assistant_reply";
  customerName: string;
  channel: DemoChannel;
  direction: "outbound";
  message: string;
};

export type DemoBookingCreatedEvent = DemoEventBase & {
  kind: "booking_created";
  bookingId: string;
  customerName: string;
  serviceName: string;
  scheduledFor: string;
  status: "requested" | "confirmed";
};

export type DemoBookingUpdatedEvent = DemoEventBase & {
  kind: "booking_updated";
  bookingId: string;
  customerName: string;
  serviceName: string;
  scheduledFor: string;
  status: Exclude<DemoBookingStatus, "requested">;
};

export type DemoKpiMarkerEvent = DemoEventBase & {
  kind: "kpi_marker";
  label: string;
  value: string;
  tone: "accent" | "warning" | "neutral";
};

export type DemoSimulationStartedEvent = DemoEventBase & {
  kind: "simulation_started";
  profileSlug: BusinessProfile["slug"];
  scenarioSlug: ScenarioPreset["slug"];
  mode: DemoMode;
};

export type DemoSimulationFinishedEvent = DemoEventBase & {
  kind: "simulation_finished";
  summary: string;
  safetyStatus: DemoSafetyStatus;
};

export type DemoDaySummaryEvent = DemoEventBase & {
  kind: "day_summary";
  summaryDate: string;
  headline: string;
  highlights: string[];
};

export type DemoWarningGeneratedEvent = DemoEventBase & {
  kind: "warning_generated";
  severity: "low" | "medium" | "high";
  title: string;
  message: string;
};

export type DemoEvent =
  | DemoCustomerCreatedEvent
  | DemoCustomerMessageEvent
  | DemoAssistantReplyEvent
  | DemoBookingCreatedEvent
  | DemoBookingUpdatedEvent
  | DemoKpiMarkerEvent
  | DemoSimulationStartedEvent
  | DemoSimulationFinishedEvent
  | DemoDaySummaryEvent
  | DemoWarningGeneratedEvent;

export type DemoSession = {
  id: string;
  title: string;
  businessName: string;
  vertical: string;
  city: string;
  scenario: string;
  operatorSummary: string;
  simulatedLabel: string;
  events: DemoEvent[];
  tenant?: DemoTenant;
  profileSlug?: BusinessProfile["slug"];
  scenarioSlug?: ScenarioPreset["slug"];
  mode?: DemoMode;
  safetyStatus?: DemoSafetyStatus;
};

export type DemoKpiSnapshot = {
  inboundMessages: number;
  assistantReplies: number;
  bookingsTouched: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  noShowBookings: number;
  rescheduledBookings: number;
};
