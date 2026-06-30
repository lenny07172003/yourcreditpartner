export const INTEGRATION_EVENT_TYPES = [
  "partner.created",
  "referral.submitted",
  "referral.booked",
  "referral.consulted",
  "referral.closed_won",
  "referral.refunded",
  "sms.inbound_received",
] as const;

export type IntegrationEventType = (typeof INTEGRATION_EVENT_TYPES)[number];

export function isIntegrationEventType(value: string): value is IntegrationEventType {
  return INTEGRATION_EVENT_TYPES.includes(value as IntegrationEventType);
}

