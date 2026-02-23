#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${AGENT_BASE_URL:-http://127.0.0.1:3000/api/agent}"
MAX_CASES_RAW="${AGENT_CANARY_CASES:-3}"

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required"
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required"
  exit 1
fi

if ! [[ "$MAX_CASES_RAW" =~ ^[0-9]+$ ]]; then
  echo "AGENT_CANARY_CASES must be a positive integer"
  exit 1
fi

MAX_CASES="$MAX_CASES_RAW"
if [ "$MAX_CASES" -lt 1 ]; then
  MAX_CASES=1
fi
if [ "$MAX_CASES" -gt 6 ]; then
  MAX_CASES=6
fi

tmp_req="$(mktemp)"
tmp_body="$(mktemp)"
cleanup() {
  rm -f "$tmp_req" "$tmp_body"
}
trap cleanup EXIT

pass_count=0
fail_count=0
run_count=0

run_case() {
  local id="$1"
  local prompt="$2"
  local ip="$3"

  if [ "$run_count" -ge "$MAX_CASES" ]; then
    return
  fi
  run_count=$((run_count + 1))

  jq -n --arg p "$prompt" '{messages:[{role:"user",content:$p}]}' > "$tmp_req"

  local code
  code="$(curl -s -o "$tmp_body" -w "%{http_code}" \
    -H "Content-Type: application/json" \
    -H "x-forwarded-for: $ip" \
    --data-binary @"$tmp_req" \
    "$BASE_URL")"

  local reply
  reply="$(jq -r '.reply // ""' "$tmp_body")"
  local words
  words="$(printf "%s" "$reply" | wc -w | tr -d ' ')"

  local ok=1
  local reasons=""

  if [ "$code" != "200" ]; then
    ok=0
    reasons+="http=$code; "
  fi

  if [ -z "$reply" ]; then
    ok=0
    reasons+="empty-reply; "
  fi

  if [ "$words" -lt 8 ]; then
    ok=0
    reasons+="too-short($words words); "
  fi

  if printf "%s" "$reply" | rg -qi \
    "assistant setup incomplete|temporarily unavailable|^I can still help you get started\\."; then
    ok=0
    reasons+="provider-fallback; "
  fi

  # Detect accidental static-path hits; these can mask provider regressions.
  if printf "%s" "$reply" | rg -qi \
    "^Contact: manager@nathansomevi\\.com|^Pricing guide:|^Typical timelines:|^We build websites \\(React/Next\\.js\\)|^For an upper-range quote, please share:|^That is internal tool syntax|^This assistant does not do coding work directly\\."; then
    ok=0
    reasons+="static-path-response; "
  fi

  if printf "%s" "$reply" | rg -qi "use contact|calendar\\.google\\.com/calendar/u/0\\?cid="; then
    ok=0
    reasons+="legacy-copy(contact/calendar-link); "
  fi

  if [ "$ok" -eq 1 ]; then
    echo "PASS: $id"
    pass_count=$((pass_count + 1))
  else
    echo "FAIL: $id"
    echo "  reasons: $reasons"
    echo "  prompt: $prompt"
    echo "  reply: $reply"
    fail_count=$((fail_count + 1))
  fi
}

# Prompts intentionally avoid static-keyword routes so responses exercise the provider path.
run_case \
  "kickoff-checklist" \
  "I run a neighborhood bakery and need a new web presence. Give me a concise project kickoff checklist." \
  "198.51.100.231"

run_case \
  "clarifier-question" \
  "I only have rough notes for an app idea. Ask one clarifying question that matters most right now." \
  "198.51.100.232"

run_case \
  "phased-plan" \
  "Draft a short phased plan for launching an MVP from discovery through release." \
  "198.51.100.233"

run_case \
  "scope-constraints" \
  "Suggest a practical way to define scope boundaries for a first delivery milestone." \
  "198.51.100.234"

run_case \
  "risk-reduction" \
  "What are the top risks to resolve early before implementation starts?" \
  "198.51.100.235"

run_case \
  "stakeholder-alignment" \
  "Give a compact checklist to align stakeholders before build work begins." \
  "198.51.100.236"

echo
echo "Canary result: $pass_count passed, $fail_count failed, $run_count calls"

if [ "$fail_count" -gt 0 ]; then
  exit 1
fi
