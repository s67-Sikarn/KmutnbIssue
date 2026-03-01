/* ── DATA ───────────────────────────────────────────────── */
const CAT = {
  electrical:  { label:'Electrical',   color:'#F59E0B', icon:'⚡' },
  plumbing:    { label:'Plumbing',     color:'#06B6D4', icon:'🚰' },
  internet:    { label:'Internet',     color:'#3B82F6', icon:'🌐' },
  hvac:        { label:'Air Con',      color:'#10B981', icon:'❄️' },
  furniture:   { label:'Furniture',    color:'#8B5CF6', icon:'🪑' },
  security:    { label:'Security',     color:'#EF4444', icon:'🔐' },
  cleanliness: { label:'Cleanliness',  color:'#22C55E', icon:'🧹' },
  other:       { label:'Other',        color:'#94A3B8', icon:'📌' },
};

const STATUS = {
  open:     { label:'Open',        color:'#F59E0B' },
  progress: { label:'In Progress', color:'#3B82F6' },
  resolved: { label:'Resolved',    color:'#10B981' },
};

const BLDLBL = v => v === 'IT' ? 'IT Building' : v ? 'Building ' + v : '';
const FLRLBL = v => ({B:'Basement',G:'Ground Floor'}[v] || (v ? 'Floor ' + v : ''));
const RMLBL  = v => v ? 'Room ' + v : '';

let issues = [
  { id:1,  bld:'61',  flr:'3',  rm:'301',     category:'electrical',  title:'Flickering fluorescent light',      desc:'The main ceiling light has been flickering for 3 days, causing eye strain during class.',        status:'open',     time:'2 hours ago'  },
  { id:2,  bld:'61',  flr:'3',  rm:'301',     category:'hvac',        title:'Air conditioner not cooling',       desc:'The AC unit runs but cannot lower room temperature, and emits a loud rattling sound.',           status:'progress', time:'1 day ago'    },
  { id:3,  bld:'63',  flr:'2',  rm:'201',     category:'plumbing',    title:'Water leaking from ceiling',        desc:'Slow drip near the back wall — possibly from the bathroom directly above.',                     status:'open',     time:'3 hours ago'  },
  { id:4,  bld:'63',  flr:'2',  rm:'201',     category:'furniture',   title:'Broken projector mount',            desc:'The projector mount is loose and the unit is visibly tilting — a fall risk.',                   status:'progress', time:'5 hours ago'  },
  { id:5,  bld:'IT',  flr:'1',  rm:'Lab1',    category:'internet',    title:'No internet in Lab 1',              desc:'All workstations lost connectivity this morning. Ethernet ports seem unresponsive.',              status:'open',     time:'30 min ago'   },
  { id:6,  bld:'IT',  flr:'1',  rm:'Lab1',    category:'furniture',   title:'Three chairs broken',               desc:'Broken armrests and one cracked seat — safety hazard for students.',                           status:'resolved', time:'2 days ago'   },
  { id:7,  bld:'65',  flr:'G',  rm:'Hallway', category:'security',    title:'Card reader malfunction',           desc:'The card reader at the main entrance inconsistently reads student ID cards.',                   status:'open',     time:'6 hours ago'  },
  { id:8,  bld:'71',  flr:'4',  rm:'Lab2',    category:'cleanliness', title:'Strong mildew smell in storage',    desc:'Persistent mildew odour from the storage corner — likely a hidden water leak.',                 status:'progress', time:'4 hours ago'  },
  { id:9,  bld:'67',  flr:'5',  rm:'Office',  category:'electrical',  title:'Power outlet sparking',             desc:'Wall outlet near the window sparks when a plug is inserted. Urgent safety concern.',             status:'open',     time:'20 min ago'   },
  { id:10, bld:'72',  flr:'2',  rm:'102',     category:'plumbing',    title:'Blocked sink in washroom',          desc:'Washroom sink drains extremely slowly and has been overflowing during peak hours.',               status:'open',     time:'1 hour ago'   },
  { id:11, bld:'69',  flr:'3',  rm:'301',     category:'internet',    title:'Wi-Fi dead zone near lecture hall', desc:'Devices cannot connect to campus Wi-Fi in the corridor outside Room 301.',                      status:'progress', time:'3 hours ago'  },
  { id:12, bld:'63',  flr:'1',  rm:'101',     category:'cleanliness', title:'Rubbish bins overflowing',          desc:'All bins on floor 1 have been overflowing since yesterday morning.',                           status:'open',     time:'5 hours ago'  },
];

/* ── SVG HELPERS ────────────────────────────────────────── */
const SVG = {
  building: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  floor:    `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  room:     `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></svg>`,
  clock:    `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
};

/* ── CARD HTML ──────────────────────────────────────────── */
function cardHTML(issue, idx) {
  const cat = CAT[issue.category] || CAT.other;
  const st  = STATUS[issue.status] || STATUS.open;
  return `
    <div class="ic" style="--_cc:${cat.color}; animation: sUp .35s ${idx * 0.055}s both;">
      <div class="ic-head">
        <div class="ic-title">${cat.icon} ${issue.title}</div>
        <div class="cat-badge"><div class="cdot"></div>${cat.label}</div>
      </div>
      <p class="ic-desc">${issue.desc}</p>
      <div class="ic-foot">
        <span class="tag">${SVG.building} ${BLDLBL(issue.bld)}</span>
        <span class="tag">${SVG.floor} ${FLRLBL(issue.flr)}</span>
        <span class="tag">${SVG.room} ${RMLBL(issue.rm)}</span>
        <span class="spacer"></span>
        <span class="stag">
          <span class="sdot" style="background:${st.color}"></span>
          <span style="color:${st.color}">${st.label}</span>
        </span>
        <span class="tag">${SVG.clock} ${issue.time}</span>
      </div>
    </div>`;
}

/* ── RENDER FEED ────────────────────────────────────────── */
function renderFeed(list, isFiltered) {
  document.getElementById('feed-count').textContent = list.length;
  document.getElementById('feed-title').textContent = isFiltered ? 'Issues at Selected Location' : 'All Reported Issues';

  const bld = document.getElementById('bld').value;
  const flr = document.getElementById('flr').value;
  const rm  = document.getElementById('rm').value;

  if (!isFiltered) {
    document.getElementById('feed-loc-text').textContent = 'All Locations';
  } else {
    const parts = [bld && BLDLBL(bld), flr && FLRLBL(flr), rm && RMLBL(rm)].filter(Boolean);
    document.getElementById('feed-loc-text').textContent = parts.join(' · ') || 'All Locations';
  }

  const body = document.getElementById('feed-body');

  if (list.length === 0) {
    body.innerHTML = `
      <div class="empty">
        <div class="empty-orb">✅</div>
        <div class="empty-ttl">No Issues Found Here</div>
        <p class="empty-sub">This location looks clear — you may be the first to report an issue here.</p>
      </div>`;
    return;
  }

  body.innerHTML = list
    .map((issue, i) => cardHTML(issue, i))
    .join('<div class="feed-divider"></div>');
}

/* ── LOCATION CHANGE ────────────────────────────────────── */
function onLocChange() {
  const bld = document.getElementById('bld').value;
  const flr = document.getElementById('flr').value;
  const rm  = document.getElementById('rm').value;

  // Nothing selected → show ALL issues
  if (!bld && !flr && !rm) {
    renderFeed(issues, false);
    return;
  }

  // Filter by whichever dropdowns are filled in
  const filtered = issues.filter(i =>
    (!bld || i.bld === bld) &&
    (!flr || i.flr === flr) &&
    (!rm  || i.rm  === rm)
  );

  renderFeed(filtered, true);
}

/* ── SUBMIT ─────────────────────────────────────────────── */
function submitIssue() {
  const cat  = document.getElementById('cat').value;
  const desc = document.getElementById('desc').value.trim();
  const bld  = document.getElementById('bld').value;
  const flr  = document.getElementById('flr').value;
  const rm   = document.getElementById('rm').value;

  let ok = true;
  [['f-cat', cat], ['f-desc', desc], ['f-bld', bld], ['f-flr', flr], ['f-rm', rm]].forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) { val ? el.classList.remove('verr') : (el.classList.add('verr'), ok = false); }
  });

  if (!ok) { showToast('⚠️', 'Please fill in all fields.'); return; }

  const words = desc.split(/\s+/);
  const title = words.slice(0, 6).join(' ') + (words.length > 6 ? '…' : '');

  issues.unshift({ id: Date.now(), bld, flr, rm, category: cat, title, desc, status: 'open', time: 'Just now' });

  // Reset all fields
  ['cat','desc','bld','flr','rm'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
    const wrap = document.getElementById('f-' + id);
    if (wrap) wrap.classList.remove('verr');
  });

  // After reset, all location fields are blank → show all issues
  renderFeed(issues, false);
  showToast('✅', 'Issue submitted successfully!');
}

/* ── TOAST ──────────────────────────────────────────────── */
let _toastTimer;
function showToast(ico, msg) {
  const el = document.getElementById('toast');
  document.getElementById('toast-ico').textContent = ico;
  document.getElementById('toast-msg').textContent = msg;
  el.classList.add('on');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('on'), 3500);
}

/* ── INIT: show all issues immediately on page load ──────── */
renderFeed(issues, false);