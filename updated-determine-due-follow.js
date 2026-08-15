const DAYS_BEFORE_FOLLOWUP_1 = 3;
const DAYS_BEFORE_FOLLOWUP_2 = 4;
const DAYS_BEFORE_FOLLOWUP_3 = 7;

const fmt = 'dd MMM yyyy HH:mm:ss' // <-- has seconds
const parse = (str) => (str ? DateTime.fromFormat(String(str), fmt) : null);

const results = [];
const now = DateTime.now();

for (const [index, item] of $input.all().entries()) {
  const d = item.json;

  const status = parse(d['Status']);
  const f1 = parse(d['Follow up 1']);
  const f2 = parse(d['Follow up 2']);
  const f3 = parse(d['Follow up 3']);

  let due = null;

  if (status && status.isValid && !d['Follow up 1'] && now.diff(status, 'days').days >= DAYS_BEFORE_FOLLOWUP_1) {
    due = 1;
  } else if (f1 && f1.isValid && !d['Follow up 2'] && now.diff(f1, 'days').days >= DAYS_BEFORE_FOLLOWUP_2) {
    due = 2;
  } else if (f2 && f2.isValid && !d['Follow up 3'] && now.diff(f2, 'days').days >= DAYS_BEFORE_FOLLOWUP_3) {
    due = 3;
  } 

  if (due) {
    results.push({ json: { ...d, nextFollowUp: due }, pairedItem: index });
  }
}

return results;