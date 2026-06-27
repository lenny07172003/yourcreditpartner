import crypto from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

type TenantProvider = "twilio" | "stripe" | "resend" | "ghl" | "cal_com";

type TenantIntegrationRow = {
  credentials_ciphertext: string | null;
  credentials_iv: string | null;
  credentials_tag: string | null;
};

function getTenantSecretsKey() {
  const raw = process.env.TENANT_SECRETS_KEY;
  if (!raw) throw new Error("TENANT_SECRETS_KEY is not configured.");

  const key = /^[a-f0-9]{64}$/i.test(raw)
    ? Buffer.from(raw, "hex")
    : Buffer.from(raw, "base64");

  if (key.length !== 32) {
    throw new Error("TENANT_SECRETS_KEY must be 32 bytes as hex or base64.");
  }

  return key;
}

export function encryptTenantCredentials(credentials: Record<string, unknown>) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getTenantSecretsKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(credentials), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return {
    credentials_ciphertext: ciphertext.toString("base64"),
    credentials_iv: iv.toString("base64"),
    credentials_tag: tag.toString("base64"),
  };
}

export function decryptTenantCredentials<T extends Record<string, unknown> = Record<string, unknown>>(
  row: TenantIntegrationRow
): T | null {
  if (!row.credentials_ciphertext || !row.credentials_iv || !row.credentials_tag) return null;

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getTenantSecretsKey(),
    Buffer.from(row.credentials_iv, "base64")
  );
  decipher.setAuthTag(Buffer.from(row.credentials_tag, "base64"));

  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(row.credentials_ciphertext, "base64")),
    decipher.final(),
  ]).toString("utf8");

  return JSON.parse(plaintext) as T;
}

export async function getTenantCredentials<T extends Record<string, unknown> = Record<string, unknown>>(
  supabase: SupabaseClient,
  orgId: string,
  provider: TenantProvider
): Promise<T | null> {
  const { data, error } = await supabase
    .from("tenant_integrations")
    .select("credentials_ciphertext, credentials_iv, credentials_tag")
    .eq("org_id", orgId)
    .eq("provider", provider)
    .eq("enabled", true)
    .maybeSingle();

  if (error || !data) return null;
  return decryptTenantCredentials<T>(data as TenantIntegrationRow);
}

