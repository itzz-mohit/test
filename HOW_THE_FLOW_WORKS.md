# Lead outreach flow (n8n)

Google Sheet leads → optional emails → AI phone calls (ElevenLabs + Exotel) → Leads + Transcripts updated.

Workflow file: `voice plus email (3).json`

---

## Two paths

| Lead has email? | What happens |
|---|---|
| **Yes** | Initial email → Follow up 1 → Follow up 2 → mark **Pending Call** → call **2 days after FU2**. Follow up 3 still sends later on its own schedule. |
| **No** | Mark **Pending Call** immediately → scheduler calls when allowed. |

---

## Calling rules

- **Timezone:** column `time zone`, e.g. `Europe/Rome (UTC+02:00)`. Bad/empty → `Asia/Kolkata`.
- **Window (client local):** Tue–Thu 13:00–16:00, Fri 12:00–16:00. No calls Mon / Sat / Sun.
- **Parallel:** up to **6** calls at once. **Attempts:** max **3** (first + 2 retries).
- **Phone:** normalised to E.164 (`+` + digits). No length checks (global numbers).
- **Callbacks** (“call me later”): dial at the time they asked — **window does not apply**.
- **Meetings / assessments:** human follow-up only — agent never dials again.

Scheduler runs every **2 minutes**.

---

## Scenarios → sheet

| What happened | Call Status | Next |
|---|---|---|
| Real conversation / not interested | `Completed` | Stop. `lead_outcome` filled (e.g. `not_interested`). |
| “Call me later” + usable time | `Callback Scheduled` | Agent redials at that time (any day/hour). |
| “Call me later” + no usable time | `Callback Scheduled` | Agent redials **+24h** (client clock). |
| Meeting / assessment / demo booked | `… Scheduled - Human Follow-up` | Human only. Time kept as client said. |
| Didn’t pick | `Didn't Pick - Retry Scheduled` | Retry in ~24h, inside calling window. Max 3 attempts. |
| Declined / busy | `Declined - Retry Scheduled` | Same. |
| Unreachable / switched off | `Unreachable - Retry Scheduled` | Same. |
| Number doesn’t exist (carrier) | `Invalid Number - No Retry` | Never again. |
| Answered but silent / very short | `No Response - Retry Scheduled` | Retry (windowed). |
| Client hangs up before agent updates sheet | Still `Calling` briefly | `post_call_transcription` recovers: classifies + updates Leads (same outcomes as above). Transcript always saved. |
| Stuck `Calling` too long | Recovered / re-queued | Stale lock (15 min prod / 3 min test). |

---

## Sheet fields that matter

**Leads**

- `time zone` — when they may be called  
- `Call Status` — current state (table above)  
- `call_attempt_count`, `call_started_at`, `call_retry_at`  
- `callback_datetime`, `callback_count`  
- `meeting_datetime`, `meeting_type`  
- `lead_outcome`, interest / next_action fields (from agent)

**Transcripts** — one row per ended call (full Agent/Client text).

---

## Testing vs production

In these Code nodes set the same flags:  
`Determine Due Follow-ups`, `Merge Call Info`, `Prepare Call Failure Update`, `Classify Call Result`, `Classify From Post Call`

| Flag | Prod | Meaning |
|---|---|---|
| `TESTING` | `false` | Email/call delays in days; retry = 24h. `true` = seconds (for tests). |
| `ENFORCE_CALL_WINDOW` | `true` | Respect Tue–Fri hours. Set `false` only while testing outside the window. |

Turn **First message override** ON in ElevenLabs, or the custom opening line is ignored.
