/**
 * GoHighLevel API v2 client.
 * Docs: https://highlevel.stoplight.io/docs/integrations
 *
 * All methods use the Location API Key (pit-…) which scopes
 * every call to the correct GHL sub-account automatically.
 */

const BASE_URL = "https://services.leadconnectorhq.com";
const API_VERSION = "2021-07-28";

function getHeaders(): Record<string, string> {
  const apiKey = process.env.GHL_API_KEY;
  if (!apiKey) throw new Error("[ghl] GHL_API_KEY is not set");
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    Version: API_VERSION,
  };
}

function locationId(): string {
  const id = process.env.GHL_LOCATION_ID;
  if (!id) throw new Error("[ghl] GHL_LOCATION_ID is not set");
  return id;
}

export function getBookingUrl(): string {
  const calId = process.env.GHL_CALENDAR_ID;
  if (!calId) throw new Error("[ghl] GHL_CALENDAR_ID is not set");
  return `https://api.leadconnectorhq.com/widget/booking/${calId}`;
}

// ============================================================
// CONTACTS
// ============================================================

export interface GhlContactInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  tags?: string[];
  source?: string;
  customFields?: { id: string; value: string }[];
}

export interface GhlContact {
  id: string;
  locationId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  tags: string[];
}

export async function createContact(input: GhlContactInput): Promise<GhlContact> {
  const res = await fetch(`${BASE_URL}/contacts/`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      locationId: locationId(),
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone ?? undefined,
      tags: input.tags ?? [],
      source: input.source ?? "YourCreditPartner",
      customFields: input.customFields ?? [],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[ghl] createContact failed (${res.status}):`, text);

    // Handle duplicate contact — GHL returns the existing contactId in meta
    if (res.status === 400) {
      try {
        const errBody = JSON.parse(text);
        if (errBody.meta?.contactId) {
          const dupErr = new Error(`GHL createContact failed: 400`) as any;
          dupErr.duplicateContactId = errBody.meta.contactId;
          throw dupErr;
        }
      } catch (e: any) {
        if (e.duplicateContactId) throw e;
      }
    }

    throw new Error(`GHL createContact failed: ${res.status}`);
  }

  const json = await res.json();
  return json.contact as GhlContact;
}

export async function updateContact(
  contactId: string,
  updates: Partial<GhlContactInput>
): Promise<GhlContact> {
  const res = await fetch(`${BASE_URL}/contacts/${contactId}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(updates),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[ghl] updateContact failed (${res.status}):`, text);
    throw new Error(`GHL updateContact failed: ${res.status}`);
  }

  const json = await res.json();
  return json.contact as GhlContact;
}

export async function addContactTags(
  contactId: string,
  tags: string[]
): Promise<void> {
  const res = await fetch(`${BASE_URL}/contacts/${contactId}/tags`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ tags }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[ghl] addContactTags failed (${res.status}):`, text);
    throw new Error(`GHL addContactTags failed: ${res.status}`);
  }
}

/**
 * Find an existing contact by email. Returns null if not found.
 */
export async function findContactByEmail(email: string): Promise<GhlContact | null> {
  const res = await fetch(
    `${BASE_URL}/contacts/search/duplicate?locationId=${locationId()}&email=${encodeURIComponent(email)}`,
    { method: "GET", headers: getHeaders() }
  );

  if (!res.ok) return null;

  const json = await res.json();
  return json.contact ?? null;
}

// ============================================================
// OPPORTUNITIES
// ============================================================

export interface GhlOpportunityInput {
  pipelineId: string;
  pipelineStageId: string;
  contactId: string;
  name: string;
  monetaryValue?: number;
}

export interface GhlOpportunity {
  id: string;
  name: string;
  pipelineId: string;
  pipelineStageId: string;
  contactId: string;
}

export async function createOpportunity(
  input: GhlOpportunityInput
): Promise<GhlOpportunity> {
  const res = await fetch(`${BASE_URL}/opportunities/`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      locationId: locationId(),
      ...input,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[ghl] createOpportunity failed (${res.status}):`, text);
    throw new Error(`GHL createOpportunity failed: ${res.status}`);
  }

  const json = await res.json();
  return json.opportunity as GhlOpportunity;
}
