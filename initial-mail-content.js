const CONTENT_MAP = {
  Machinery: {
    subject: "Quoting time at {{Company}}",
    message:
      '<p>Hi {{Name}},</p>\n\n<p>I came across {{Company}} while looking at industrial machinery and equipment manufacturing businesses in {{City}}.</p>\n\n<p>Quick question: how many engineering hours go into producing quotes, BOMs and service documentation instead of building and shipping machines?</p>\n\n<p>And that is rarely the whole of it. In most industrial machinery and equipment manufacturing businesses there are three or four processes hiding in plain sight, things like spec clarification emails, hunting old drawings, spare parts lookups, that consume the same people you would rather have on designing, building and shipping machines.</p>\n\n<p>We\u2019re a team of AI engineers who normally build this kind of system for large companies. We\u2019re now bringing it to businesses like yours at a price that makes sense.</p>\n\n<p>We\u2019re not selling software. For every $1 spent on software, businesses spend around $6 on the people to run it. We do the opposite: you tell us the problem, we build it, we run it, you get the outcome. No platform to learn, no new process for your team to maintain, nobody new to hire. You don\u2019t adopt the technology, you adopt the result.</p>\n\n<p>Recent example: for an Australian compliance company, we built an AI system that automated their rebate paperwork end to end so their team could focus on growing revenue instead of running operations.</p>\n\n<p>This is the part worth thinking about: the businesses in your space that have already done this are not just cutting cost, they are returning quotes in hours while the rest of the market still takes days. That advantage compounds every quarter, and it does not close on its own.</p>\n\n<p>The offer: a free assessment of your operations, a monthly cost on the busy work, then we build the fix for your biggest problem, free. If it works, we talk about pricing. If not, you owe nothing.</p>\n\n<p>If you\u2019re curious, you can grab a time that works best for you here: <a href="https://uniligence.com/discovery-call">Grab a slot</a></p>\n\n<p>Best,<br>Mahidhar<br>Growth &amp; Operations<br><a href="https://uniligence.com/">Uniligence</a></p>\n',
  },
  Electric: {
    subject: "QC paperwork at {{Company}}",
    message:
      '<p>Hi {{Name}},</p>\n\n<p>I came across {{Company}} while looking at electrical and electronic manufacturing businesses in {{City}}.</p>\n\n<p>Quick question: how much revenue is your factory losing because your workforce spends more time on QC documentation and compliance paperwork than on production?</p>\n\n<p>And that is rarely the whole of it. In most electrical and electronic manufacturing businesses there are three or four processes hiding in plain sight, things like supplier certificate chasing, rework and scrap logging, month-end production reporting, that consume the same people you would rather have on the line, the order book and the customer.</p>\n\n<p>We\u2019re a team of AI engineers who normally build this kind of system for large companies. We\u2019re now bringing it to businesses like yours at a price that makes sense.</p>\n\n<p>We\u2019re not selling software. For every $1 spent on software, businesses spend around $6 on the people to run it. We do the opposite: you tell us the problem, we build it, we run it, you get the outcome. No platform to learn, no new process for your team to maintain, nobody new to hire. You don\u2019t adopt the technology, you adopt the result.</p>\n\n<p>Recent example: for an Australian compliance company, we built an AI system that automated their rebate paperwork end to end so their team could focus on growing revenue instead of running operations.</p>\n\n<p>This is the part worth thinking about: the businesses in your space that have already done this are not just cutting cost, they are shipping more orders with the headcount they already have. That advantage compounds every quarter, and it does not close on its own.</p>\n\n<p>The offer: a free assessment of your operations, a monthly cost on the busy work, then we build the fix for your biggest problem, free. If it works, we talk about pricing. If not, you owe nothing.</p>\n\n<p>If you\u2019re curious, you can grab a time that works best for you here: <a href="https://uniligence.com/discovery-call">Grab a slot</a></p>\n\n<p>Best,<br>Mahidhar<br>Growth &amp; Operations<br><a href="https://uniligence.com/">Uniligence</a></p>\n',
  },
  Medical: {
    subject: "Regulatory paperwork at {{Company}}",
    message:
      '<p>Hi {{Name}},</p>\n\n<p>I came across {{Company}} while looking at medical device and equipment manufacturing businesses in {{City}}.</p>\n\n<p>Quick question: how many engineering and quality hours go into DHR, DHF and CAPA documentation instead of design, validation and production?</p>\n\n<p>And that is rarely the whole of it. In most medical device manufacturing businesses there are three or four processes hiding in plain sight, things like batch record review, complaint and CAPA logging, audit evidence gathering, that consume the same people you would rather have on design controls and product quality.</p>\n\n<p>We\u2019re a team of AI engineers who normally build this kind of system for large companies. We\u2019re now bringing it to businesses like yours at a price that makes sense.</p>\n\n<p>We\u2019re not selling software. For every $1 spent on software, businesses spend around $6 on the people to run it. We do the opposite: you tell us the problem, we build it, we run it, you get the outcome. No platform to learn, no new process for your team to maintain, nobody new to hire. You don\u2019t adopt the technology, you adopt the result.</p>\n\n<p>Recent example: for an Australian compliance company, we built an AI system that automated their rebate paperwork end to end so their team could focus on growing revenue instead of running operations.</p>\n\n<p>This is the part worth thinking about: the businesses in your space that have already done this are not just cutting cost, they are clearing audits and releasing batches faster while the rest of the market is still buried in paperwork. That advantage compounds every quarter, and it does not close on its own.</p>\n\n<p>The offer: a free assessment of your operations, a monthly cost on the busy work, then we build the fix for your biggest problem, free. If it works, we talk about pricing. If not, you owe nothing.</p>\n\n<p>If you\u2019re curious, you can grab a time that works best for you here: <a href="https://uniligence.com/discovery-call">Grab a slot</a></p>\n\n<p>Best,<br>Mahidhar<br>Growth &amp; Operations<br><a href="https://uniligence.com/">Uniligence</a></p>\n',
  },
};

// Fallback used if a row's Category doesn't match anything above (e.g. blank or a typo).
// Change this to whichever category should be the safe default.
// const DEFAULT_CATEGORY = 'Machinery';

const results = [];
for (const item of $input.all()) {
  const d = item.json;
  const category = (d["Category"] || "").trim();
  const template = CONTENT_MAP[category];

  let subject = template.subject.replace(/{{Company}}/g, d["Company"] || "");
  let message = template.message
    .replace(/{{Name}}/g, d["Name"] || "")
    .replace(/{{Company}}/g, d["Company"] || "")
    .replace(/{{City}}/g, d["City"] || "");

  results.push({ json: { ...d, subject, message } });
}

return results;
