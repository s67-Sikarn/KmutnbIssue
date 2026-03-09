/* ── DATA ข้อมูลเบื้องต้น ───────────────────────────────────────── */
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

// ข้อมูลสถานะ เปลี่ยน label ให้เป็นภาษาไทย
const STATUS = {
  pending: { label: 'Pending', color: '#10B981' }, // สีเขียวมิ้นต์เหมือนในภาพ
  progress: { label: 'In Progress', color: '#10B981' },
  hold: { label: 'On Hold', color: '#F59E0B' }, // สีส้ม
  resolved: { label: 'Resolved', color: '#10B981' },
  rejected: { label: 'Rejected', color: '#EF4444' }, // สีแดง
};

// ฟังก์ชันปรับแต่งชื่อสถานที่
const BLDLBL = v => v === 'IT' ? 'IT Building' : v ? 'Building ' + v : '';
const FLRLBL = v => ({ B: 'Basement', G: 'Ground Floor' }[v] || (v ? 'Floor ' + v : ''));
const RMLBL = v => v ? 'Room ' + v : '';

let issues = [];
try {
  // ดึงข้อมูลปัญหาจาก <script id="issues-data">
  const dataEl = document.getElementById('issues-data');
  if (dataEl && dataEl.textContent.trim()) {
    issues = JSON.parse(dataEl.textContent);
  }
} catch (e) {
  console.error("Error parsing backend issues:", e);
}

/* ── ฟังก์ชันสร้าง UI สถานะ (TIMELINE) ───────────────────── */
function getTimelineHTML(issue) {
  const statusVal = issue.status;
  let step = 1;
  let sColor = '#9CA3AF'; // Pending/Neutral color

  let step3Label = 'Resolved';
  let step3StatusClass = 'status-resolved';
  let step3Time = issue.resolved_at_time || '';

  if (statusVal === 'progress') {
    step = 2;
    sColor = '#3B82F6'; // In Progress
  }
  else if (statusVal === 'resolved') {
    step = 3;
    sColor = '#10B981'; // Done
  }
  else if (statusVal === 'rejected') {
    step = 3;
    sColor = '#EF4444'; // Red for Rejected
    step3Label = 'Rejected';
    step3StatusClass = 'status-rejected';
  }
  else if (statusVal === 'hold') {
    // Keep hold standard or orange
    step = 2;
    sColor = '#F59E0B';
  }

  // คำนวณความกว้างของขีดความคืบหน้า
  const wPercent = (step === 1) ? '0%' : (step === 2) ? '50%' : '100%';

  return `
    <div class="tl-wrapper w-full" style="color: ${sColor}">
      <div class="tl-track-bg"></div>
      <div class="tl-track-fill" style="width: ${wPercent}; background: currentColor;"></div>
      <div class="tl-steps-row">
        
        <div class="tl-step status-pending ${step >= 1 ? 'active' : ''}">
          <div class="tl-icon-box" style="${step >= 1 ? 'background:currentColor; border-color:currentColor; color:#fff;' : ''}">
             ${step >= 1 ? '<i class="fas fa-circle" style="font-size: 6px;"></i>' : ''}
          </div>
          <div class="tl-label">Pending</div>
          <div class="tl-timestamp">${issue.created_at_time || '-'}</div>
        </div>
        
        <div class="tl-step status-progress ${step >= 2 ? 'active' : ''}">
          <div class="tl-icon-box" style="${step >= 2 ? 'background:currentColor; border-color:currentColor; color:#fff;' : ''}">
              ${step >= 2 && statusVal !== 'hold' ? '<i class="fas fa-spinner" style="font-size: 8px;"></i>' : ''}
              ${step >= 2 && statusVal === 'hold' ? '<i class="fas fa-pause" style="font-size: 8px;"></i>' : ''}
          </div>
          <div class="tl-label">${statusVal === 'hold' ? 'On Hold' : 'In Progress'}</div>
          <div class="tl-timestamp">${issue.in_progress_at_time || '-'}</div>
        </div>
        
        <div class="tl-step ${step3StatusClass} ${step >= 3 ? 'active' : ''}">
          <div class="tl-icon-box" style="${step >= 3 ? 'background:currentColor; border-color:currentColor; color:#fff;' : ''}">
              ${step >= 3 && statusVal === 'resolved' ? '<i class="fas fa-check" style="font-size: 9px;"></i>' : ''}
              ${step >= 3 && statusVal === 'rejected' ? '<i class="fas fa-times" style="font-size: 9px;"></i>' : ''}
          </div>
          <div class="tl-label">${step3Label}</div>
          <div class="tl-timestamp">${step3Time || '-'}</div>
        </div>

      </div>
    </div>
  `;
}
// ฟังก์ชันสร้าง UI สำหรับแต่ละปัญหา
function cardHTML(issue, idx) {
  const cat = CAT[issue.category] || CAT.other;

  // Check if rejected to display it in place of timeline
  const statusVal = issue.status;
  const isRejected = statusVal === 'rejected';

  let sColor = '#9CA3AF';
  let statusLabel = 'Pending';

  if (statusVal === 'progress') { sColor = '#3B82F6'; statusLabel = 'In Progress'; }
  else if (statusVal === 'resolved') { sColor = '#10B981'; statusLabel = 'Resolved'; }
  else if (statusVal === 'rejected') { sColor = '#EF4444'; statusLabel = 'Rejected'; }
  else if (statusVal === 'hold') { sColor = '#F59E0B'; statusLabel = 'On Hold'; }

  // ป้องกัน XSS
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
    <div class="ic group cursor-pointer" style="--_cc:${cat.color}; animation: sUp .35s ${idx * 0.055}s both;" onclick="this.classList.toggle('expanded')">
      <div class="ic-head">
        <div class="ic-title">${cat.icon} ${escapeHtml(issue.title)}</div>
        <div class="cat-badge"><div class="cdot"></div>${cat.label}</div>
      </div>
      <p class="ic-desc">${escapeHtml(issue.desc)}</p>
      <!-- ตำแหน่งข้อมูลด้านล่าง พร้อม Timeline ชิดขวา -->
      <div class="ic-foot flex-col !items-start gap-3 mt-4">
        <div class="w-full flex justify-between items-center gap-3">
            <div class="flex flex-col gap-1.5 min-w-0 text-xs text-gray-500">
                <span class="truncate"><i class="fas fa-map-marker-alt text-red-500 mr-1"></i> Bld ${escapeHtml(issue.bld)} | Flr ${escapeHtml(issue.flr)} | Rm ${escapeHtml(issue.rm)}</span>
                <span class="truncate text-gray-400"><i class="far fa-clock mr-1"></i> ${escapeHtml(issue.time)}</span>
            </div>
            
            <div class="flex items-center gap-2 shrink-0">
                <div class="text-[11px] font-semibold flex items-center justify-center gap-1.5 py-1 px-3 rounded-full border" style="color: ${sColor}; border-color: ${sColor}50; background: ${sColor}15; min-width: 80px;">
                    ${statusLabel}
                </div>
                <div class="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 transition-colors group-hover:bg-gray-100">
                    <i class="fas fa-chevron-down text-gray-400 text-[10px] ic-chevron transition-transform duration-300"></i>
                </div>
            </div>
        </div>

        <div class="ic-timeline-container w-full overflow-hidden transition-all duration-300 max-h-0 opacity-0">
            <div class="pt-4 border-t border-gray-100 mt-2">
                <div class="flex justify-center w-full px-2">
                    ${getTimelineHTML(issue)}
                </div>
                ${isRejected ? `
                 <div class="bg-red-50 border border-red-200 p-2 mt-4 rounded-md text-[11px] text-red-700 w-full text-center leading-tight shadow-sm">
                  <strong><i class="fas fa-ban mr-1"></i> Reason:</strong>
                  <span class="opacity-90 font-medium break-words whitespace-normal">${escapeHtml(issue.rejection_reason || 'No reason provided')}</span>
                 </div>` : ''}
            </div>
        </div>
      </div>
    </div>`;
}

/* ── RENDER FEED (ดึงข้อมูลแสดงผล) ────────────────────────── */
function renderFeed(list, isFiltered) {
  document.getElementById('feed-count').textContent = list.length;
  // แปลส่วนหัวเป็นภาษาไทย
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

/* ── ฟังก์ชันตอบสนองการค้นหา / เลือกสถานที่ ─────────────────── */
function onLocChange() {
  const bld = document.getElementById('bld').value;
  const flr = document.getElementById('flr').value;
  const rm = document.getElementById('rm').value;
  const searchInput = document.getElementById('search-issue');
  const term = searchInput ? searchInput.value.toLowerCase() : '';

  // กรองปัญหาตาม โลเคชั่น และ คำค้นหา
  const filtered = issues.filter(i => {
    const matchLoc = (!bld || i.bld === bld) &&
      (!flr || i.flr === flr) &&
      (!rm || i.rm === rm);

    const matchTerm = !term ||
      (i.title && i.title.toLowerCase().includes(term)) ||
      (i.desc && String(i.desc).toLowerCase().includes(term));

    return matchLoc && matchTerm;
  });

  const isFiltered = !!(bld || flr || rm || term);
  renderFeed(filtered, isFiltered);
}

/* ── TOAST แจ้งเตือน ─────────────────────────────────────── */
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

/* ── INIT: ดึงข้อมูลตอนเปิดหน้า ───────────────────────────────── */
renderFeed(issues, false);

/* ── WEBSOCKET: Real-time Updates ───────────────────────────────────────── */
const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const issueSocket = new WebSocket(wsProtocol + '//' + window.location.host + '/ws/issues/');

issueSocket.onmessage = function (e) {
  const data = JSON.parse(e.data);
  const msg = data.message;

  if (msg.action === 'created') {
    issues.unshift(msg.issue); // Add to beginning
  } else if (msg.action === 'updated') {
    const idx = issues.findIndex(i => i.id === msg.issue.id);
    if (idx !== -1) {
      issues[idx] = msg.issue;
    }
  }

  // Re-render and apply seamless update logic
  onLocChange();
};

issueSocket.onclose = function (e) {
  console.error('Issue socket closed unexpectedly');
};