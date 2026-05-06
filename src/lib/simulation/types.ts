export type DemoMessageDirection = "inbound" | "outbound";

export type DemoBookingStatus =
  | "requested"
  | "confirmed"
  | "rescheduled"
  | "cancelled"
  | "no_show"
  | "completed";

export type DemoEventKind =
  | "customer_message"
  | "assistant_reply"
  | "booking_created"
  | "booking_updated"
  | "kpi_marker";

type DemoEventBase = {
  id: string;
  at: string;
  note?: string;
};

export type DemoCustomerMessageEvent = DemoEventBase & {
  kind: "customer_message";
  customerName: string;
  channel: "whatsapp" | "web_chat";
  direction: "inbound";
  message: string;
};

export type DemoAssistantReplyEvent = DemoEventBase & {
  kind: "assistant_reply";
  customerName: string;
  channel: "whatsapp" | "web_chat";
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

export type DemoEvent =
  | DemoCustomerMessageEvent
  | DemoAssistantReplyEvent
  | DemoBookingCreatedEvent
  | DemoBookingUpdatedEvent
  | DemoKpiMarkerEvent;

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
