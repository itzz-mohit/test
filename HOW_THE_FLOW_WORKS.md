# How the flow works

This is the automated lead outreach system built in n8n. It sends emails, makes AI phone calls via ElevenLabs + Exotel, and tracks everything in a Google Sheet.

---

## What it does in one line

A new lead is added to the Google Sheet → the system emails them (if they have an email), follows up 3 times, then calls them using an AI voice agent — one lead at a time, never more than one call running at once.

---

## The two paths

### Path 1: Lead has an email address

1. Lead is added to the **Leads** sheet.
2. An **initial email** is sent based on their industry category.
3. Over the next few days, **3 follow-up emails** are sent automatically (Follow up 1, 2, 3).
4. After Follow up 3, the lead is marked **Pending Call**.
5. The scheduler picks it up and the AI agent **calls them**.

### Path 2: Lead has no email address

1. Lead is added to the **Leads** sheet.
2. Immediately marked **Pending Call** (no emails sent).
3. The scheduler picks it up and the AI agent **calls them**.

---

## How calls work

- A **scheduler runs every 1 minute**, checks all leads, and decides who needs a call or email next.
- **Only one call happens at a time.** Even if 20 leads are waiting, they are dialled one by one. This keeps us within the ElevenLabs Starter plan limit of 3 simultaneous calls.
- When a call is placed, the lead's status becomes **Calling** and acts as a lock — no other lead is called until this one finishes.
- If a call gets stuck (no result after 15 minutes in production), the lock is released automatically so the queue keeps moving.

### What the agent knows before calling

- For **email leads**: the agent receives the actual email that was sent (pulled from Gmail), so it can reference the pitch naturally.
- For **no-email leads**: the agent receives a short industry brief (key pain points, opening question) so it has context, plus a flag saying no email was sent — so it never claims to have emailed them.

---

## What happens after the call

Every call result is classified and the sheet is updated. Here's every scenario:

| What happened | Call Status in sheet | What happens next |
|---|---|---|
| Client **picked up** and had a conversation | `Completed` | Done. Outcome fields are filled in. |
| Client said **"call me later"** | `Callback Scheduled` | The agent calls again at the requested time. |
| Client **booked a meeting or assessment** | `Meeting Scheduled - Human Follow-up` | A **real person** calls them. The agent never dials again. |
| Client **didn't pick up** | `Didn't Pick - Retry Scheduled` | One retry after 24 hours. If they don't pick again → `Retry Exhausted`. |
| Client **declined / busy** | `Declined - Retry Scheduled` | One retry after 24 hours. If declined again → `Retry Exhausted`. |
| Phone **switched off / out of network** | `Unreachable - Retry Scheduled` | One retry after 24 hours. |
| **Number doesn't exist** (carrier says so) | `Invalid Number - No Retry` | Never called again. No retry wasted. |
| Call answered but **nobody spoke** (voicemail / dead air, under 20 seconds) | `No Response - Retry Scheduled` | One retry. |
| Carrier **plays a recording** saying "number does not exist" | `Invalid Number - No Retry` | Detected from the transcript. Never called again. |
| Client keeps saying **"call me later"** (more than 3 times) | `Callback Limit Reached - Human Follow-up` | A real person takes over. |
| Agent returns a **time we can't parse** (e.g. "tomorrow afternoon") | `... - Needs Review` | A human must set the correct time. |

---

## What is stored in the Google Sheet

### Leads tab (one row per lead)

| Column | What it holds |
|---|---|
| Serial No, Name, Company, Email, phone_number, City, Category | Lead info (you fill this in) |
| Status | When the initial email was sent |
| Follow up 1 / 2 / 3 | When each follow-up email was sent |
| Id, Thread Id | Gmail message and thread IDs (used to fetch the sent email for the agent) |
| Call Status | Current state of the call (see table above) |
| conversation_id | ElevenLabs conversation ID |
| call_attempt_count | How many times the agent has dialled (1 = first call, 2 = retry) |
| call_started_at | When the current call was placed (this is the queue lock) |
| call_retry_at | When the next retry or callback is due |
| last_call_outcome | What happened on the last call (e.g. Didn't Pick, Declined, Callback Requested) |
| callback_datetime | When the client asked to be called back |
| callback_count | How many times the client has asked to be called back |
| meeting_datetime | When a booked meeting / assessment is scheduled |
| meeting_type | Meeting, Assessment, or Demo |
| lead_outcome, prospect_interest_level, business_challenge_identified, next_action | Filled in by the AI agent after a real conversation |

### Transcripts tab (one row per call)

Every answered call gets a new row here, including retries and callbacks.

| Column | What it holds |
|---|---|
| Serial No | Links back to the lead |
| Name | Client name |
| conversation_id | Which conversation this was |
| call_attempt | Which attempt (1, 2, ...) |
| call_status | Outcome of this call |
| timestamp | When it happened (IST) |
| duration_seconds | How long the call lasted |
| transcript | Full conversation: `Agent: ... / Client: ...` |

---

## Key rules

- **One call at a time.** The queue is strictly serial.
- **One retry only.** If a call fails twice, it stops. No infinite loops.
- **Callbacks reset the attempt counter.** When a client says "call me later", that's a fresh call, not a failed retry.
- **Meetings are never robo-dialled.** A booked meeting or assessment is always handed to a human.
- **No phone number length checks.** We call global clients, so only the carrier can say a number is wrong.
- **The agent always knows the context.** It receives the actual email or the industry brief before calling.
- **Everything is logged.** Call status, outcomes, timestamps, and full transcripts are all in the sheet.

---

## Timing

| What | Testing mode | Production mode |
|---|---|---|
| Follow-up emails | 10 / 20 / 30 / 40 seconds | 2 / 4 / 6 days, then call 2 days later |
| Call retry (didn't pick / declined) | 60 seconds | 24 hours |
| Queue lock timeout (stuck call) | 3 minutes | 15 minutes |

To switch: set `TESTING = false` in **four** Code nodes: `Determine Due Follow-ups`, `Merge Call Info`, `Prepare Call Failure Update`, and `Classify Call Result`.

---

## What needs to be set up outside n8n

1. **ElevenLabs agent**: add `meeting_datetime` and `meeting_type` to data collection fields, and update the prompt to distinguish callbacks from bookings.
2. **ElevenLabs webhooks**: subscribe to `call_initiation_failure` at `/webhook/elevenlabs/call-initiation-failure`.
3. **Google Sheet**: create the `Transcripts` tab with the columns listed above.
4. **API key**: the ElevenLabs key is hardcoded in the workflow. Move it to an n8n credential and rotate it before production.
