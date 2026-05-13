#!/bin/bash
# Comprehensive end-to-end test for GHL pipeline integration
# Tests all referral scenarios against the webhooks and verifies DB state

source /c/Users/Lenny/yourcreditpartner/.env.local

APIKEY="$SUPABASE_SERVICE_ROLE_KEY"
SUPA_URL="$NEXT_PUBLIC_SUPABASE_URL"
WEBHOOK_BASE="http://localhost:3000/api/webhooks/ghl"
PID="0583d8cd-df1d-4f34-872c-03469b154b8e"  # support@opulentcreditconsulting.com partner

# Helper: query a referral by ghl_contact_id and print key fields
verify() {
  local label="$1"
  local contact_id="$2"
  local expected_stage="$3"
  local expected_appt_status="$4"

  echo ""
  echo "  → Verifying: $label"
  result=$(curl -s "$SUPA_URL/rest/v1/referrals?ghl_contact_id=eq.$contact_id&select=stage,appointment_status,booked_at,consulted_at,closed_won_at,appointment_at,ghl_opportunity_id" \
    -H "apikey: $APIKEY" -H "Authorization: Bearer $APIKEY")

  echo "    DB state: $result"

  actual_stage=$(echo "$result" | grep -oE '"stage":"[^"]*"' | head -1 | cut -d'"' -f4)
  actual_appt=$(echo "$result" | grep -oE '"appointment_status":"[^"]*"' | head -1 | cut -d'"' -f4)

  if [ -n "$expected_stage" ] && [ "$actual_stage" != "$expected_stage" ]; then
    echo "    ❌ FAIL: expected stage='$expected_stage', got='$actual_stage'"
    return 1
  fi
  if [ -n "$expected_appt_status" ] && [ "$actual_appt" != "$expected_appt_status" ]; then
    echo "    ❌ FAIL: expected appointment_status='$expected_appt_status', got='$actual_appt'"
    return 1
  fi
  echo "    ✓ PASS"
}

# Helper: create a fresh referral with a unique GHL contact ID
make_referral() {
  local contact_id="$1"
  local first="$2"
  local last="$3"
  local email="$4"

  curl -s -X POST "$SUPA_URL/rest/v1/referrals" \
    -H "apikey: $APIKEY" -H "Authorization: Bearer $APIKEY" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=minimal" \
    -d "{\"partner_id\":\"$PID\",\"partner_type\":\"mlo\",\"client_first_name\":\"$first\",\"client_last_name\":\"$last\",\"client_email\":\"$email\",\"client_phone\":\"555-000-0000\",\"ghl_contact_id\":\"$contact_id\",\"stage\":\"submitted\",\"nurture_status\":\"active\",\"nurture_stage\":\"submitted_to_booked\",\"consult_no_show\":false}"
}

# Helper: fire a webhook
fire() {
  local endpoint="$1"
  local body="$2"
  curl -s -X POST "$WEBHOOK_BASE/$endpoint" \
    -H "Content-Type: application/json" \
    -d "$body"
}

# ====================================================================
echo "================================================================"
echo "SCENARIO 1: Submit → Immediate book → Consulted → Closed"
echo "================================================================"
CID="test-flow-001"
make_referral "$CID" "Alice" "Anderson" "alice-test-001@example.com"
verify "After submit" "$CID" "submitted" ""

fire "booked" "{\"contactId\":\"$CID\",\"appointmentId\":\"appt-001\",\"calendarId\":\"$GHL_CALENDAR_ID\",\"startTime\":\"2026-05-20T15:00:00-04:00\",\"endTime\":\"2026-05-20T15:30:00-04:00\",\"status\":\"confirmed\"}"
verify "After booking" "$CID" "booked" "scheduled"

fire "consulted" "{\"contactId\":\"$CID\"}"
verify "After consultation" "$CID" "consulted" "scheduled"

fire "closed-won" "{\"contactId\":\"$CID\",\"monetaryValue\":1500}"
verify "After closed won" "$CID" "closed_won" "scheduled"

# ====================================================================
echo ""
echo "================================================================"
echo "SCENARIO 2: Submit → Wait → Email follow-up → Book later"
echo "================================================================"
CID="test-flow-002"
make_referral "$CID" "Bob" "Brown" "bob-test-002@example.com"
verify "After submit (waiting for client to book)" "$CID" "submitted" ""

# Simulate client clicks email link days later and books
fire "booked" "{\"contactId\":\"$CID\",\"appointmentId\":\"appt-002\",\"calendarId\":\"$GHL_CALENDAR_ID\",\"startTime\":\"2026-05-25T10:00:00-04:00\",\"endTime\":\"2026-05-25T10:30:00-04:00\",\"status\":\"confirmed\"}"
verify "After delayed booking" "$CID" "booked" "scheduled"

# ====================================================================
echo ""
echo "================================================================"
echo "SCENARIO 3: Submit → Book → Cancel → Rebook"
echo "================================================================"
CID="test-flow-003"
make_referral "$CID" "Carol" "Chen" "carol-test-003@example.com"
verify "After submit" "$CID" "submitted" ""

fire "booked" "{\"contactId\":\"$CID\",\"appointmentId\":\"appt-003a\",\"calendarId\":\"$GHL_CALENDAR_ID\",\"startTime\":\"2026-05-22T14:00:00-04:00\",\"endTime\":\"2026-05-22T14:30:00-04:00\",\"status\":\"confirmed\"}"
verify "After first booking" "$CID" "booked" "scheduled"

fire "appointment-cancelled" "{\"contactId\":\"$CID\",\"appointmentId\":\"appt-003a\",\"status\":\"cancelled\"}"
verify "After cancellation" "$CID" "booked" "cancelled"

fire "booked" "{\"contactId\":\"$CID\",\"appointmentId\":\"appt-003b\",\"calendarId\":\"$GHL_CALENDAR_ID\",\"startTime\":\"2026-05-28T11:00:00-04:00\",\"endTime\":\"2026-05-28T11:30:00-04:00\",\"status\":\"confirmed\"}"
verify "After rebook" "$CID" "booked" "scheduled"

# ====================================================================
echo ""
echo "================================================================"
echo "SCENARIO 4: Submit → Book → No Show"
echo "================================================================"
CID="test-flow-004"
make_referral "$CID" "Derek" "Davis" "derek-test-004@example.com"

fire "booked" "{\"contactId\":\"$CID\",\"appointmentId\":\"appt-004\",\"calendarId\":\"$GHL_CALENDAR_ID\",\"startTime\":\"2026-05-19T09:00:00-04:00\",\"endTime\":\"2026-05-19T09:30:00-04:00\",\"status\":\"confirmed\"}"
verify "After booking" "$CID" "booked" "scheduled"

fire "no-show" "{\"contactId\":\"$CID\",\"appointmentId\":\"appt-004\",\"status\":\"no_show\"}"
verify "After no-show" "$CID" "booked" "no_show"

# ====================================================================
echo ""
echo "================================================================"
echo "SCENARIO 5: Submit → Book → Consult → Closed → Refunded"
echo "================================================================"
CID="test-flow-005"
make_referral "$CID" "Eve" "Edwards" "eve-test-005@example.com"

fire "booked" "{\"contactId\":\"$CID\",\"appointmentId\":\"appt-005\",\"calendarId\":\"$GHL_CALENDAR_ID\",\"startTime\":\"2026-05-21T13:00:00-04:00\",\"endTime\":\"2026-05-21T13:30:00-04:00\",\"status\":\"confirmed\"}"
fire "consulted" "{\"contactId\":\"$CID\"}"
fire "closed-won" "{\"contactId\":\"$CID\",\"monetaryValue\":2000}"
verify "After closed won" "$CID" "closed_won" "scheduled"

fire "refunded" "{\"contactId\":\"$CID\"}"
verify "After refund" "$CID" "refunded" "scheduled"

# ====================================================================
echo ""
echo "================================================================"
echo "SCENARIO 6: Webhook for unknown contact (graceful failure)"
echo "================================================================"
RESULT=$(fire "booked" "{\"contactId\":\"nonexistent-contact-xyz\",\"appointmentId\":\"appt-x\",\"startTime\":\"2026-05-30T10:00:00Z\",\"endTime\":\"2026-05-30T10:30:00Z\"}")
echo "  Result: $RESULT"
if echo "$RESULT" | grep -q '"matched":false'; then
  echo "  ✓ PASS: Unknown contact returns matched:false without error"
else
  echo "  ❌ FAIL: Expected matched:false"
fi

# ====================================================================
echo ""
echo "================================================================"
echo "ALL SCENARIOS COMPLETE"
echo "================================================================"
