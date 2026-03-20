// ══════════════════════════════════
//  MARKS — fetches /mark-details (DataTable AJAX)
//  Fields: course_code, course_name
// ══════════════════════════════════
async function loadMarks() {
  window._marksLoaded = true;
  const list = document.getElementById('marks-list');
  list.innerHTML = `<div class="empty-state"><div class="empty-icon">⏳</div><div class="empty-text">Loading marks…</div></div>`;

  try {
    const resp = await fetch(
      `${base()}/mark-details?draw=1&start=0&length=100`,
      { headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' } }
    );
    const json = await resp.json();
    console.log('Marks JSON:', json);

    const marks = (json.data || []).map(r => ({
      name: r.course_name || '',
      code: r.course_code || '',
    })).filter(m => m.name);

    const result = { marks, fetchedAt: Date.now() };
    localStorage.setItem('sis_marks_cache', JSON.stringify(result));
    renderMarks(result);
  } catch(err) {
    console.error('Marks error:', err);
    const c = localStorage.getItem('sis_marks_cache');
    if (c) renderMarks(JSON.parse(c));
    else list.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-text">Could not load marks.<br>Check proxy is running.</div></div>`;
  }
}

function renderMarks({ marks, fetchedAt }) {
  document.getElementById('marks-sem-label').textContent = 'Current Sem';
  document.getElementById('marks-sub-count').textContent = marks.length;
  document.getElementById('marks-avg').textContent = marks.length;

  // Tweak card label since we only have subject list
  document.querySelector('#card-marks-avg .stat-label').textContent = 'Subjects';
  document.querySelector('#card-marks-avg .stat-sub').textContent   = 'enrolled this sem';
  document.querySelector('#card-marks-sub .stat-label').textContent = 'Source';
  document.getElementById('marks-sub-count').textContent            = 'KARE SIS';
  document.getElementById('card-marks-sub').className = 'stat-card d2 indigo';

  const list = document.getElementById('marks-list');
  list.innerHTML = '';

  if (!marks.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">📝</div><div class="empty-text">No marks data found.</div></div>`;
    return;
  }

  marks.forEach((m, i) => {
    const el = document.createElement('div');
    el.className = `mark-card d${Math.min(i+1,8)}`;
    el.innerHTML = `
      <div class="mark-top">
        <div>
          <div class="mark-name">${m.name}</div>
          ${m.code ? `<div class="mark-code">${m.code}</div>` : ''}
        </div>
        <div class="mark-grade-badge grade-NA" style="font-size:11px;width:auto;padding:0 10px">Enrolled</div>
      </div>
      <div style="font-size:11px;font-family:var(--mono);color:var(--text-3);margin-top:4px">
        Tap the portal to view detailed exam marks
      </div>`;
    list.appendChild(el);
  });

  const d = new Date(fetchedAt);
  document.getElementById('marks-updated').textContent = `Updated ${d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}`;
}

async function refreshMarks() {
  const btn = document.getElementById('btn-refresh-marks');
  const lbl = document.getElementById('lbl-refresh-marks');
  btn.classList.add('spinning'); lbl.textContent = 'Refreshing…';
  window._marksLoaded = false;
  try { await loadMarks(); }
  finally { btn.classList.remove('spinning'); lbl.textContent = 'Refresh'; }
}

// ══════════════════════════════════
//  CGPA — parses /grade HTML page
//
//  Page structure (confirmed):
//  Table 1: Grade Details — cols: Semester(0), Course Code(1), Course Name(2),
//           Credits(3), Att.Code(4), Grade(5), Category(6), Year of Passing(7)
//  Table 2 (#s-table): CGPA(0), Earned Credits(1), No of Arrears(2)
// ══════════════════════════════════
async function loadCgpa() {
  window._cgpaLoaded = true;
  document.getElementById('cgpa-value').textContent = '…';
  document.getElementById('sem-history').innerHTML = '';

  try {
    const resp = await fetch(`${base()}${GRADE_PAGE}`, {
      headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'text/html,*/*' }
    });
    const html = await resp.text();
    const doc  = new DOMParser().parseFromString(html, 'text/html');
    const result = { ...parseCgpaHtml(doc), fetchedAt: Date.now() };
    localStorage.setItem('sis_cgpa_cache', JSON.stringify(result));
    renderCgpa(result);
  } catch(err) {
    console.error('CGPA error:', err);
    const c = localStorage.getItem('sis_cgpa_cache');
    if (c) renderCgpa(JSON.parse(c));
    else {
      document.getElementById('cgpa-value').textContent = '—';
      document.getElementById('cgpa-sub').textContent = 'Could not load. Check proxy.';
    }
  }
}

function parseCgpaHtml(doc) {
  // ── Step 1: Get CGPA, Earned Credits, Arrears from #s-table ──
  let cgpa = null, earnedCredits = null, arrears = null;
  const sTable = doc.querySelector('#s-table');
  if (sTable) {
    const row = sTable.querySelector('tbody tr');
    if (row) {
      const cells = [...row.querySelectorAll('td')].map(c => c.textContent.trim());
      cgpa          = cells[0] || null;
      earnedCredits = cells[1] || null;
      arrears       = cells[2] || null;
    }
  }

  // ── Step 2: Parse grade history from first big table ──
  // Cols: 0=Semester, 1=CourseCode, 2=CourseName, 3=Credits, 4=AttCode, 5=Grade, 6=Category, 7=YearOfPassing
  const semMap = {};
  const tables = doc.querySelectorAll('table');
  tables.forEach(table => {
    if (table.id === 's-table') return; // skip CGPA summary table
    const headers = [...table.querySelectorAll('thead th')].map(th => th.textContent.trim().toLowerCase());
    // Confirm this is the grade details table by checking for 'semester' and 'grade' columns
    if (!headers.some(h => h.includes('semester')) || !headers.some(h => h.includes('grade'))) return;

    table.querySelectorAll('tbody tr').forEach(row => {
      const cells = [...row.querySelectorAll('td')].map(c => c.textContent.trim());
      if (cells.length < 6) return;
      const semNum  = cells[0];
      const code    = cells[1];
      const name    = cells[2];
      const credits = cells[3];
      const grade   = cells[5];
      const year    = cells[7] || '';

      if (!semNum || !name) return;
      const semKey = `Semester ${semNum}`;
      if (!semMap[semKey]) semMap[semKey] = { sem: semKey, year, subjects: [] };
      semMap[semKey].subjects.push({ name, code, credits, grade });
      if (year && !semMap[semKey].year) semMap[semKey].year = year;
    });
  });

  const semesters = Object.values(semMap).sort((a, b) => {
    const na = parseInt(a.sem.replace('Semester ',''));
    const nb = parseInt(b.sem.replace('Semester ',''));
    return na - nb;
  });

  return { cgpa, earnedCredits, arrears, semesters };
}

function renderCgpa({ cgpa, earnedCredits, arrears, semesters, fetchedAt }) {
  document.getElementById('cgpa-value').textContent = cgpa || '—';
  document.getElementById('cgpa-sub').textContent   = earnedCredits
    ? `${earnedCredits} credits earned · ${arrears || 0} arrears`
    : `${semesters.length} semester${semesters.length !== 1 ? 's' : ''}`;
  document.getElementById('cgpa-sem-count').textContent = `${semesters.length} sems`;

  const history = document.getElementById('sem-history');
  history.innerHTML = '';

  if (!semesters.length) {
    history.innerHTML = `<div class="empty-state"><div class="empty-icon">🎯</div><div class="empty-text">No grade history found.</div></div>`;
    return;
  }

  semesters.forEach((sem, i) => {
    const el = document.createElement('div');
    el.className = `sem-card d${Math.min(i+1,8)}`;
    const subRows = sem.subjects.map(s => `
      <div class="sem-subject-row">
        <span class="sem-sub-name">${s.name}</span>
        <div class="sem-sub-right">
          ${s.credits ? `<span class="sem-sub-pts">${s.credits}cr</span>` : ''}
          <span style="font-family:var(--mono);font-size:12px;font-weight:600;color:${gradeColor(s.grade)}">${s.grade || '—'}</span>
        </div>
      </div>`).join('');
    el.innerHTML = `
      <div class="sem-header">
        <div>
          <span class="sem-title">${sem.sem}</span>
          ${sem.year ? `<div style="font-size:10px;font-family:var(--mono);color:var(--text-3);margin-top:2px">${sem.year}</div>` : ''}
        </div>
        <span class="sem-gpa">${sem.subjects.length} subjects</span>
      </div>
      <div class="sem-subjects">${subRows}</div>`;
    history.appendChild(el);
  });

  const d = new Date(fetchedAt);
  document.getElementById('cgpa-updated').textContent = `Updated ${d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}`;
}

function gradeColor(g) {
  if (!g) return 'var(--text-2)';
  const s = g.trim().toUpperCase();
  if (s === 'O')                return 'var(--green)';
  if (s === 'A+' || s === 'A') return 'var(--accent2)';
  if (s === 'B+' || s === 'B') return 'var(--cyan)';
  if (s === 'C')                return 'var(--amber)';
  if (s === 'F'  || s === 'U') return 'var(--red)';
  return 'var(--text-2)';
}

async function refreshCgpa() {
  const btn = document.getElementById('btn-refresh-cgpa');
  const lbl = document.getElementById('lbl-refresh-cgpa');
  btn.classList.add('spinning'); lbl.textContent = 'Refreshing…';
  window._cgpaLoaded = false;
  try { await loadCgpa(); }
  finally { btn.classList.remove('spinning'); lbl.textContent = 'Refresh'; }
}