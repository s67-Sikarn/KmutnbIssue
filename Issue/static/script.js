/* ── DATA ───────────────────────────────────────────────── */
const CAT = {
  electrical: { label: 'Electrical', color: '#F59E0B', icon: '⚡' },
  plumbing: { label: 'Plumbing', color: '#06B6D4', icon: '🚰' },
  internet: { label: 'Internet', color: '#3B82F6', icon: '🌐' },
  hvac: { label: 'Air Con', color: '#10B981', icon: '❄️' },
  furniture: { label: 'Furniture', color: '#8B5CF6', icon: '🪑' },
  security: { label: 'Security', color: '#EF4444', icon: '🔐' },
  cleanliness: { label: 'Cleanliness', color: '#22C55E', icon: '🧹' },
  other: { label: 'Other', color: '#94A3B8', icon: '📌' },
};

const STATUS = {
  pending: { label: 'Pending', color: '#EF4444' }, // Red for Pending
  progress: { label: 'In Progress', color: '#3B82F6' }, // Blue for In Progress
  hold: { label: 'On Hold', color: '#F59E0B' }, // Amber/Yellow for On Hold
  resolved: { label: 'Resolved', color: '#10B981' }, // Green for Resolved
  rejected: { label: 'Rejected', color: '#6B7280' }, // Gray for Rejected
};

const BLDLBL = v => v === 'IT' ? 'IT Building' : v ? 'Building ' + v : '';
const FLRLBL = v => ({ B: 'Basement', G: 'Ground Floor' }[v] || (v ? 'Floor ' + v : ''));
const RMLBL = v => v ? 'Room ' + v : '';

let issues = [];
try {
  const dataEl = document.getElementById('issues-data');
  if (dataEl && dataEl.textContent.trim()) {
    issues = JSON.parse(dataEl.textContent);
  }
} catch (e) {
  console.error("Error parsing backend issues:", e);
}

/* ── SVG HELPERS ────────────────────────────────────────── */
const SVG = {
  building: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  floor: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  room: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></svg>`,
  clock: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
};

/* ── CARD HTML ──────────────────────────────────────────── */
function cardHTML(issue, idx) {
  const cat = CAT[issue.category] || CAT.other;
  const st = STATUS[issue.status] || STATUS.pending;

  let rejectionHtml = '';
  if (issue.status === 'rejected' && issue.rejection_reason) {
    rejectionHtml = `
      <div class="mt-3 bg-red-50 border border-red-200 p-3 rounded-md text-sm text-red-700">
          <strong><i class="fas fa-ban mr-1"></i> Rejected:</strong> ${escapeHtml(issue.rejection_reason)}
      </div>`;
  }

  // Basic HTML escape to prevent XSS in rendering
  function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  return `
    <div class="ic" style="--_cc:${cat.color}; animation: sUp .35s ${idx * 0.055}s both;">
      <div class="ic-head">
        <div class="ic-title">${cat.icon} ${escapeHtml(issue.title)}</div>
        <div class="cat-badge"><div class="cdot"></div>${cat.label}</div>
      </div>
      <p class="ic-desc">${escapeHtml(issue.desc)}</p>
      <div class="ic-foot flex-col !items-start gap-2">
        <div class="w-full flex justify-between items-center text-xs text-gray-500">
            <span><i class="fas fa-map-marker-alt text-red-500 mr-1"></i> Bld ${escapeHtml(issue.bld)} | Flr ${escapeHtml(issue.flr)} | Rm ${escapeHtml(issue.rm)}</span>
            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium" style="background-color: ${st.color}20; color: ${st.color}">
                <span class="w-2 h-2 rounded-full mr-1.5" style="background-color: ${st.color}"></span>
                ${st.label}
            </span>
        </div>
        <div class="w-full flex justify-between items-center text-xs text-gray-400 mt-1">
            <span><i class="far fa-clock mr-1"></i> ${escapeHtml(issue.time)}</span>
        </div>
        ${rejectionHtml}
      </div>
    </div>`;
}

/* ── RENDER FEED ────────────────────────────────────────── */
function renderFeed(list, isFiltered) {
  document.getElementById('feed-count').textContent = list.length;
  document.getElementById('feed-title').textContent = isFiltered ? 'Issues at Selected Location' : 'All Reported Issues';

  const bld = document.getElementById('bld').value;
  const flr = document.getElementById('flr').value;
  const rm = document.getElementById('rm').value;

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
  const rm = document.getElementById('rm').value;

  // Nothing selected → show ALL issues
  if (!bld && !flr && !rm) {
    renderFeed(issues, false);
    return;
  }

  // Filter by whichever dropdowns are filled in
  const filtered = issues.filter(i =>
    (!bld || i.bld === bld) &&
    (!flr || i.flr === flr) &&
    (!rm || i.rm === rm)
  );

  renderFeed(filtered, true);
}

/* ── TOAST ──────────────────────────────────────────────── */
let _toastTimer;
function showToast(ico, msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  document.getElementById('toast-ico').textContent = ico;
  document.getElementById('toast-msg').textContent = msg;
  el.classList.add('on');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('on'), 3500);
}

/* ── INIT: show all issues immediately on page load ──────── */
renderFeed(issues, false);