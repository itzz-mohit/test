// Tell the voice agent which email it is calling about.
//
// For a lead that was emailed, 'Fetch Initial Email' hands us the real message from Gmail,
// so the agent sees exactly what the client received. For a lead with no email address there
// is nothing to fetch, so it gets the category brief below and email_sent = 'no' instead,
// which stops it from claiming to have sent an email that never existed.
const MAX_EMAIL_CHARS = 3000; // keep the agent's prompt from being swamped

// Used when the Category does not match anything below, e.g. a typo in the sheet. The email
// branch throws on an unknown category, but a no-email lead would otherwise reach the agent
// with no context at all.
const GENERIC_BRIEF = [
  "Industry: not recorded for this lead, so ask what the business does before pitching.",
  "Opening question you can ask: how much of your team's week goes into manual admin and paperwork instead of the work that actually makes money?",
  "Busy work that quietly eats most teams: chasing documents, re-keying data between systems, rebuilding the same reports.",
  "The offer: a free assessment of their operations, then we build the fix for their biggest problem free. If it works, we talk pricing.",
].join("\n");

// Generated from the templates in 'Get Initial Email Content'. Used only when there is no
// real email to show, so regenerate it if you reword those templates.
const PAIN_POINTS = {
  "Manuf-Electrical-Electronic":
    "Industry: electrical and electronic manufacturing.\nOpening question you can ask: how much revenue is your factory losing because your workforce spends more time on QC documentation and compliance paperwork than on production?\nBusy work that quietly eats their team: supplier certificate chasing, rework and scrap logging, month end production reporting.\nThey would rather have those people on: the line, the order book and the customer.\nCompetitors who already fixed this are: shipping more orders with the headcount they already have.",
  "Manuf-Machinery":
    "Industry: industrial machinery and equipment manufacturing.\nOpening question you can ask: how many engineering hours go into producing quotes, BOMs and service documentation instead of building and shipping machines?\nBusy work that quietly eats their team: spec clarification emails, hunting old drawings, spare parts lookups.\nThey would rather have those people on: designing, building and shipping machines.\nCompetitors who already fixed this are: returning quotes in hours while the rest of the market still takes days.",
  "Manuf-Semiconductor":
    "Industry: semiconductor and photonics.\nOpening question you can ask: how much engineering time disappears into test data wrangling, yield reporting and customer qualification paperwork instead of device work?\nBusy work that quietly eats their team: manual data pulls, rebuilding the same charts, reformatting customer reports.\nThey would rather have those people on: yield, reliability and the next process node.\nCompetitors who already fixed this are: answering a customer qualification question in hours instead of weeks.",
  "Manuf-Industrial Automation":
    "Industry: industrial automation and robotics.\nOpening question you can ask: how much of your team's time goes into project documentation, commissioning reports and support tickets instead of deploying systems?\nBusy work that quietly eats their team: as built documentation, repeat support answers, scope clarification threads.\nThey would rather have those people on: deployments and new installations.\nCompetitors who already fixed this are: commissioning more systems per engineer than you can.",
  "Manuf-Consumer Electronics":
    "Industry: consumer electronics.\nOpening question you can ask: how much margin goes into handling returns, warranty claims and support tickets rather than into product?\nBusy work that quietly eats their team: warranty triage, marketplace message handling, review monitoring.\nThey would rather have those people on: product, channel growth and margin.\nCompetitors who already fixed this are: scaling sales without scaling support headcount.",
  "HC-Medical devices":
    "Industry: medical device.\nOpening question you can ask: how many hours a week does your team lose to regulatory documentation, complaint handling and post market surveillance instead of product work?\nBusy work that quietly eats their team: document version control, audit preparation, supplier quality correspondence.\nThey would rather have those people on: product development and market access.\nCompetitors who already fixed this are: moving through submission and audit faster with the same quality team.",
  "HC-Hospital & care":
    "Industry: hospital and care.\nOpening question you can ask: how much clinical and administrative time goes into intake, prior authorisation, scheduling and documentation rather than into patient care?\nBusy work that quietly eats their team: chasing missing information, referral follow ups, roster and cover admin.\nThey would rather have those people on: patients and clinical care.\nCompetitors who already fixed this are: seeing more patients with the staff they already have.",
  "HC-Health and wellness":
    "Industry: health and wellness.\nOpening question you can ask: how much of your team's week goes into onboarding, scheduling and content admin rather than into serving clients?\nBusy work that quietly eats their team: rescheduling, reminder chasing, answering the same questions.\nThey would rather have those people on: clients, retention and programme quality.\nCompetitors who already fixed this are: growing their client base without growing their admin team.",
  "HC-Biotechnology":
    "Industry: biotechnology and life sciences.\nOpening question you can ask: how much scientist time goes into experiment documentation, data cleanup and reporting instead of into actual science?\nBusy work that quietly eats their team: reformatting instrument exports, rebuilding figures, chasing collaborators for data.\nThey would rather have those people on: experiments and the pipeline.\nCompetitors who already fixed this are: getting from data to decision in days rather than weeks.",
  "HC-Pharmacutical":
    "Industry: pharmaceutical.\nOpening question you can ask: how much time does your team spend assembling regulatory documentation, batch records and safety reports instead of moving product forward?\nBusy work that quietly eats their team: document formatting, cross referencing dossiers, drafting query responses.\nThey would rather have those people on: programmes, submissions and market access.\nCompetitors who already fixed this are: filing sooner with the team they already have.",
  "HC-Mental care":
    "Industry: mental health and behavioural care.\nOpening question you can ask: how much clinician time goes into notes, intake and insurance paperwork instead of into sessions?\nBusy work that quietly eats their team: insurance verification calls, no show follow ups, referral coordination.\nThey would rather have those people on: client sessions and the waitlist.\nCompetitors who already fixed this are: seeing more clients per clinician without longer days.",
  "HC-Medical practice":
    "Industry: medical and dental practice.\nOpening question you can ask: how much front desk and clinician time goes into scheduling, recalls, insurance and notes instead of into patients?\nBusy work that quietly eats their team: eligibility checks, recall lists, chasing patient forms.\nThey would rather have those people on: chair time and patients.\nCompetitors who already fixed this are: filling their schedule while yours still has gaps.",
  Retail:
    "Industry: retail.\nOpening question you can ask: how much margin goes into manual product data, order issues and customer service instead of into selling?\nBusy work that quietly eats their team: fixing channel data, answering stock questions, setting up promotions.\nThey would rather have those people on: range, merchandising and demand.\nCompetitors who already fixed this are: launching and repricing faster than you can.",
  "RET-Apparal & fashion":
    "Industry: apparel and fashion.\nOpening question you can ask: how much time does your team spend on product copy, sizing queries and marketplace listings instead of on design and sales?\nBusy work that quietly eats their team: sample and lookbook admin, size chart questions, channel messaging.\nThey would rather have those people on: design, marketing and sell through.\nCompetitors who already fixed this are: getting a drop live across every channel in a day.",
  "RET-Consumer goods":
    "Industry: consumer goods.\nOpening question you can ask: how much time goes into retailer paperwork, product data and customer queries rather than into product and distribution?\nBusy work that quietly eats their team: retailer portal updates, deduction disputes, spec and sample requests.\nThey would rather have those people on: accounts, distribution and margin.\nCompetitors who already fixed this are: onboarding retail accounts in days rather than weeks.",
  "LOG-Logistics & supply chain":
    "Industry: logistics and supply chain.\nOpening question you can ask: how many hours a day does your team spend chasing status updates, quoting rates and reconciling paperwork instead of moving freight?\nBusy work that quietly eats their team: where is my order emails, chasing proof of delivery, rate sheet updates.\nThey would rather have those people on: capacity, margin and customer growth.\nCompetitors who already fixed this are: answering customers instantly while yours wait for someone to look it up.",
  "LOG-Transport":
    "Industry: transport.\nOpening question you can ask: how much dispatch and back office time goes into scheduling, driver paperwork and customer calls instead of into moving people and vehicles?\nBusy work that quietly eats their team: job confirmations, chasing driver documents, customer callbacks.\nThey would rather have those people on: utilisation, routes and new contracts.\nCompetitors who already fixed this are: running more jobs per dispatcher than you can.",
  "LOG-Packaging frieght":
    "Industry: freight and shipping services.\nOpening question you can ask: how much of your team's day goes into quoting, customs paperwork and documentation instead of into actually shipping?\nBusy work that quietly eats their team: rate lookups, document corrections, status callbacks.\nThey would rather have those people on: bookings and volume.\nCompetitors who already fixed this are: quoting the same hour a request lands.",
  "LOG-Warehouse":
    "Industry: warehousing and storage.\nOpening question you can ask: how much time goes into inventory reconciliation, customer enquiries and billing admin rather than into throughput?\nBusy work that quietly eats their team: cycle count investigations, client report building, billing queries.\nThey would rather have those people on: throughput and client capacity.\nCompetitors who already fixed this are: taking on new clients without adding admin staff.",
  "FIN-Insurance":
    "Industry: insurance.\nOpening question you can ask: how much of your team's capacity goes into submission intake, document review and claims admin rather than into underwriting and client work?\nBusy work that quietly eats their team: rekeying submissions, chasing missing information, status update emails.\nThey would rather have those people on: underwriting, broking and client relationships.\nCompetitors who already fixed this are: quoting first and winning the business they see first.",
  "FIN-Banking":
    "Industry: banking and credit union.\nOpening question you can ask: how much staff time goes into onboarding, document review and member service rather than into lending and relationships?\nBusy work that quietly eats their team: document collection, exception follow ups, repeat member queries.\nThey would rather have those people on: lending, deposits and relationships.\nCompetitors who already fixed this are: approving files faster with the same staff.",
  "CRE-construction":
    "Industry: construction and contracting.\nOpening question you can ask: how much time does your team spend on RFIs, submittals, compliance paperwork and progress reporting instead of on building?\nBusy work that quietly eats their team: chasing subcontractor documents, rebuilding progress reports, filing site records.\nThey would rather have those people on: programme, productivity and margin.\nCompetitors who already fixed this are: closing out RFIs and variations before you have even found the file.",
  "CRE-Real estate":
    "Industry: real estate.\nOpening question you can ask: how much of your team's week goes into listing admin, buyer and tenant enquiries and document handling rather than into deals?\nBusy work that quietly eats their team: enquiry triage, appointment coordination, listing document preparation.\nThey would rather have those people on: listings, viewings and deals.\nCompetitors who already fixed this are: answering every enquiry in minutes while yours wait hours.",
  "CRE-Building materials":
    "Industry: building materials.\nOpening question you can ask: how much time goes into quoting, takeoffs, product data and order queries instead of into selling and delivering?\nBusy work that quietly eats their team: spec and stock lookups, takeoff checking, price list updates.\nThey would rather have those people on: quotes, orders and deliveries.\nCompetitors who already fixed this are: getting a priced quote back before the competition has opened the drawing.",
  "CRE-Architecture":
    "Industry: architecture and design.\nOpening question you can ask: how much studio time goes into specifications, compliance checks and reporting instead of into design?\nBusy work that quietly eats their team: consultant coordination, drawing issue tracking, fee and scope correspondence.\nThey would rather have those people on: design, pursuits and delivery.\nCompetitors who already fixed this are: turning around pursuits without pulling designers off live projects.",
  "CRE-commercial RE":
    "Industry: commercial real estate.\nOpening question you can ask: how much time goes into lease abstraction, tenant requests and reporting rather than into assets and tenants?\nBusy work that quietly eats their team: lease clause lookups, routing tenant requests, rebuilding rent roll reports.\nThey would rather have those people on: assets, tenants and net operating income.\nCompetitors who already fixed this are: answering an owner question in minutes instead of a day.",
  "HOSP-Hospitality":
    "Industry: hotel and hospitality.\nOpening question you can ask: how much of your team's day goes into guest messages, booking admin and reporting instead of into guest experience?\nBusy work that quietly eats their team: channel message handling, group and event enquiries, shift report building.\nThey would rather have those people on: guest experience, occupancy and rate.\nCompetitors who already fixed this are: answering every guest and every enquiry instantly, at any hour.",
  "HOSP-Travel & Lesiure":
    "Industry: travel and leisure.\nOpening question you can ask: how much of your team's capacity goes into itinerary building, quotes and traveller queries rather than into selling trips?\nBusy work that quietly eats their team: supplier availability checks, itinerary reformatting, change and refund handling.\nThey would rather have those people on: bookings, upsells and repeat travellers.\nCompetitors who already fixed this are: sending a tailored itinerary the same day an enquiry lands.",
  "AUTO-Automotive":
    "Industry: automotive.\nOpening question you can ask: how much revenue is lost to slow enquiry response, service scheduling and warranty paperwork instead of going into sales and service?\nBusy work that quietly eats their team: enquiry follow ups, service reminders, chasing warranty documents.\nThey would rather have those people on: sales, service bays and parts.\nCompetitors who already fixed this are: responding first and taking the sale before you have opened the email.",
  "ENE-Renewables":
    "Industry: renewable energy and clean technology.\nOpening question you can ask: how much of your team's time goes into permitting, incentive paperwork, proposals and performance reporting instead of into building projects?\nBusy work that quietly eats their team: collecting documents for permits, rebuilding proposals, monthly performance reporting.\nThey would rather have those people on: projects, pipeline and generation.\nCompetitors who already fixed this are: getting projects through approval and into build faster.",
  "ENE-Oil & Energy":
    "Industry: energy and industrial services.\nOpening question you can ask: how much engineering and back office time goes into compliance reporting, tender documentation and field paperwork instead of into operations?\nBusy work that quietly eats their team: transcribing field reports, gathering compliance evidence, assembling bid documents.\nThey would rather have those people on: operations, uptime and new contracts.\nCompetitors who already fixed this are: bidding on more work without more nights.",
  "ENE-Utilities":
    "Industry: utility.\nOpening question you can ask: how much of your team's capacity goes into customer enquiries, billing exceptions and regulatory reporting rather than into service delivery?\nBusy work that quietly eats their team: repeat customer queries, billing exception investigation, report assembly.\nThey would rather have those people on: network, service and customers.\nCompetitors who already fixed this are: absorbing volume spikes without a queue forming.",
};

const lead = $("Is Call Due?").first().json;

const normalizeKey = (s) =>
  (s || "").toString().trim().toLowerCase().replace(/\s+/g, "");
const NORMALIZED_PAIN = {};
for (const [key, value] of Object.entries(PAIN_POINTS)) {
  NORMALIZED_PAIN[normalizeKey(key)] = value;
}

// Empty for no-email leads, and for anything Gmail could not return.
const fetched = $json && !$json.error ? $json : {};

const decode = (s) =>
  s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'");

// The agent must never read markup or a raw URL out loud, so links keep only their label.
const htmlToText = (html) =>
  decode(
    html
      .replace(/<a\b[^>]*>(.*?)<\/a>/gis, "$1")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|tr|h[1-6])>/gi, "\n")
      .replace(/<li\b[^>]*>/gi, "- ")
      .replace(/<[^>]+>/g, ""),
  )
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const looksLikeHtml = (s) => /<[a-z][\s\S]*>/i.test(s);
const toPlain = (s) => (looksLikeHtml(s) ? htmlToText(s) : decode(s).trim());

let emailBody = "";
for (const candidate of [
  fetched.text,
  fetched.html,
  fetched.textAsHtml,
  fetched.snippet,
]) {
  const value = (candidate || "").toString();
  if (value.trim()) {
    emailBody = toPlain(value);
    if (emailBody) break;
  }
}

if (emailBody.length > MAX_EMAIL_CHARS) {
  emailBody = emailBody.slice(0, MAX_EMAIL_CHARS).trim() + "...";
}

const emailSubject = (fetched.subject || "").toString().trim();

// The stored message id is the proof an initial email actually went out.
const wasEmailed =
  (lead["Id "] || "").toString().trim() !== "" ||
  (lead["Thread Id"] || "").toString().trim() !== "";

// Only used when there is no email text to give the agent.
const painPoints = emailBody
  ? ""
  : NORMALIZED_PAIN[normalizeKey(lead["Category"])] || GENERIC_BRIEF;

const name = String(lead.Name ?? lead.client_name ?? "").trim();
const company = String(lead.Company ?? lead.company ?? "").trim();
const emailSent = wasEmailed;

let first_message = "";

if (name) {
  if (emailSent) {
    first_message =
      `Hi ${name}, my name is Monika and I'm calling from Uniligence. ` +
      `We recently sent you an email about how we're helping businesses ` +
      `bring practical AI automation into their operations. ` +
      `I'm just following up on that email to see if it caught your attention. ` +
      `Did you get a chance to have a look?`;
  } else {
    first_message =
      `Hi ${name}, my name is Monika and I'm calling from Uniligence. ` +
      `We're a small team of AI engineers who build practical automation ` +
      `systems for businesses, helping them reduce repetitive work and ` +
      `improve their operations. ` +
      `I wanted to quickly understand if this is something that could be ` +
      `useful for your business. Do you have a minute?`;
  }
} else if (company) {
  if (emailSent) {
    first_message =
      `Hi, my name is Monika and I'm calling from Uniligence. ` +
      `Am I speaking with someone from ${company}? ` +
      `We recently sent your company an email about how we're helping ` +
      `businesses bring practical AI automation into their operations. ` +
      `I'm just following up to see if you had a chance to have a look.`;
  } else {
    first_message =
      `Hi, my name is Monika and I'm calling from Uniligence. ` +
      `Am I speaking with someone from ${company}? ` +
      `We're a small team of AI engineers who build practical automation ` +
      `systems for businesses, helping them reduce repetitive work and ` +
      `improve their operations. ` +
      `I wanted to quickly understand if this could be useful for your business. ` +
      `Do you have a minute?`;
  }
} else if (emailSent) {
  first_message =
    `Hi, my name is Monika and I'm calling from Uniligence. ` +
    `We recently sent you an email about how we're helping businesses ` +
    `bring practical AI automation into their operations. ` +
    `I'm just following up on that email to see if it caught your attention. ` +
    `Did you get a chance to have a look?`;
} else {
  first_message =
    `Hi, my name is Monika and I'm calling from Uniligence. ` +
    `We're a small team of AI engineers who build practical automation ` +
    `systems for businesses, helping them reduce repetitive work and ` +
    `improve their operations. ` +
    `I wanted to quickly understand if this is something that could be ` +
    `useful for your business. Do you have a minute?`;
}

return [
  {
    json: {
      ...lead,
      email_sent: wasEmailed ? "yes" : "no",
      email_subject: emailSubject,
      email_body: emailBody,
      industry_pain_points: painPoints,
      first_message,
    },
    pairedItem: { item: 0 },
  },
];
