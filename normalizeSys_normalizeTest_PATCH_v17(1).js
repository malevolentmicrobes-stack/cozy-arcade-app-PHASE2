// ============================================================
// COZY ARCADE — JS FUNCTION PATCHES
// Generated from: 5_19_2026_SOURCE_ABIM_DATABASE_...v17.xlsx
// Date: 2026-05-21
// Replace the existing normalizeSys() and add normalizeTest()
// in index.html
// ============================================================

// CANONICAL normalizeSys() — covers ALL 42 raw sys values in v17 source
// Replaces the prior version (which missed: Allergy, Biostats, Emergency,
// HemOnc, Repro, PUML/CC typo, Urology, OB/GYN variants)
function normalizeSys(raw) {
  if (!raw) return 'UNKNOWN';
  const v = String(raw).trim().toLowerCase();
  const MAP = {
    'allergy':    'ALLERGY',
    'biostats':   'STATS',
    'stats':      'STATS',
    'cv':         'CV',
    'derm':       'DERM',
    'endo':       'ENDO',
    'ent':        'ENT',
    'ethics':     'ETHICS',
    'emergency':  'EMERGENCY',
    'gi':         'GI',
    'hem/onc':    'HEM/ONC',
    'heme/onc':   'HEM/ONC',
    'heme':       'HEM/ONC',
    'hemonc':     'HEM/ONC',
    'id':         'ID',
    'id; pulm':   'ID',
    'neuro':      'NEURO',
    'ob':         'OB/GYN',
    'ob/gyn':     'OB/GYN',
    'repro':      'OB/GYN',
    'ophtho':     'OPHTHO',
    'psych':      'PSYCH',
    'pulm':       'PULM',
    'pulm/cc':    'PULM',
    'puml/cc':    'PULM',  // typo preserved from source
    'renal':      'RENAL',
    'rheum':      'RHEUM',
    'tox':        'TOX',
    'urology':    'UROLOGY',
  };
  return MAP[v] || raw.trim().toUpperCase();
}

// normalizeTest() — standardizes inconsistent test field formatting
// "Test: 95" / "Test 97" / "TEST 3" → always "TEST N"
// Add a call to this inside normalizeCard() when assigning card.test
function normalizeTest(raw) {
  if (!raw) return '';
  return String(raw).trim().replace(/^[Tt]est[:\s]+(\d+)$/, 'TEST $1');
}

// ============================================================
// CSV IMPORT IMPLEMENTATION (replaces stub in importDeck())
// Drop this block in place of the CSV toast in importDeck()
// ============================================================
/*
if (/\.csv$/i.test(file.name)) {
  // Robust CSV parser: handles quoted fields with embedded commas/newlines
  function parseCSV(text) {
    const rows = [];
    let row = [], field = '', inQ = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i], next = text[i+1];
      if (inQ) {
        if (ch === '"' && next === '"') { field += '"'; i++; }
        else if (ch === '"') { inQ = false; }
        else { field += ch; }
      } else {
        if (ch === '"') { inQ = true; }
        else if (ch === ',') { row.push(field); field = ''; }
        else if (ch === '\n' || (ch === '\r' && next === '\n')) {
          if (ch === '\r') i++;
          row.push(field); field = '';
          if (row.some(c => c !== '')) rows.push(row);
          row = [];
        } else { field += ch; }
      }
    }
    if (field || row.length) { row.push(field); if (row.some(c => c !== '')) rows.push(row); }
    return rows;
  }

  const rows = parseCSV(text);
  const headers = rows[0].map(h => h.trim());
  rawCards = rows.slice(1)
    .filter(r => r.length > 1 && r.some(c => c.trim()))
    .map(row => {
      const card = {};
      headers.forEach((h, i) => { card[h] = (row[i] || '').trim(); });
      // Coerce empty why_not_others to null so parseJsonLoose pattern is consistent
      if (card.why_not_others === '' || card.why_not_others === 'nan') card.why_not_others = null;
      if (card.board_trigger === '') card.board_trigger = null;
      return card;
    });
}
*/

// ============================================================
// FIELD ORDER for normalizeCard() — canonical for display + export
// ============================================================
// const CARD_FIELDS = [
//   'qid_unique', 'qid', 'sys', 'test',
//   'presentation', 'diagnosis', 'educational_objective',
//   'board_trigger', 'one_thing', 'quick_recall',
//   'explanation', 'why_not_others',
//   'cloze_source_text', 'cloze_enabled'
// ];
