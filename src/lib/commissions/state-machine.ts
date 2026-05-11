import { SupabaseClient } from "@supabase/supabase-js";
import type { CommissionState } from "@/types/database";

/**
 * Commission state machine:
 *
 *   pending  → earned    (30-day refund window passed)
 *   earned   → payable   (batched into a payout run)
 *   payable  → paid      (admin marks payout as sent)
 *
 *   pending  → voided    (refund received before earned)
 *   earned   → voided    (late refund — rare, needs admin action)
 *
 * Any other transition is invalid.
 */

const VALID_TRANSITIONS: Record<CommissionState, CommissionState[]> = {
  pending: ["earned", "voided"],
  earned: ["payable", "voided"],
  payable: ["paid"],
  paid: [],
  voided: [],
};

export function canTransition(from: CommissionState, to: CommissionState): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Transition a single commission to a new state.
 * Returns true if the transition was applied, false if invalid.
 */
export async function transitionCommission(
  supabase: SupabaseClient,
  commissionId: string,
  currentState: CommissionState,
  newState: CommissionState,
  meta?: { payout_id?: string; voided_reason?: string }
): Promise<boolean> {
  if (!canTransition(currentState, newState)) {
    console.warn(
      `[commission] Invalid transition: ${currentState} → ${newState} for ${commissionId}`
    );
    return false;
  }

  const now = new Date().toISOString();
  const updates: Record<string, unknown> = { state: newState };

  switch (newState) {
    case "earned":
      updates.earned_at = now;
      break;
    case "payable":
      updates.payable_at = now;
      break;
    case "paid":
      updates.paid_at = now;
      if (meta?.payout_id) updates.payout_id = meta.payout_id;
      break;
    case "voided":
      updates.voided_reason = meta?.voided_reason ?? "refund";
      break;
  }

  const { error } = await supabase
    .from("commissions")
    .update(updates)
    .eq("id", commissionId)
    .eq("state", currentState); // Optimistic lock: only update if state hasn't changed

  if (error) {
    console.error(`[commission] Failed to transition ${commissionId}:`, error);
    return false;
  }

  return true;
}

/**
 * Batch-transition multiple commissions.
 * Returns count of successfully transitioned records.
 */
export async function batchTransition(
  supabase: SupabaseClient,
  commissionIds: string[],
  fromState: CommissionState,
  toState: CommissionState,
  meta?: { payout_id?: string }
): Promise<number> {
  if (!canTransition(fromState, toState)) return 0;

  const now = new Date().toISOString();
  const updates: Record<string, unknown> = { state: toState };

  switch (toState) {
    case "earned":
      updates.earned_at = now;
      break;
    case "payable":
      updates.payable_at = now;
      break;
    case "paid":
      updates.paid_at = now;
      if (meta?.payout_id) updates.payout_id = meta.payout_id;
      break;
  }

  const { data, error } = await supabase
    .from("commissions")
    .update(updates)
    .in("id", commissionIds)
    .eq("state", fromState)
    .select("id");

  if (error) {
    console.error(`[commission] Batch transition failed:`, error);
    return 0;
  }

  return data?.length ?? 0;
}
