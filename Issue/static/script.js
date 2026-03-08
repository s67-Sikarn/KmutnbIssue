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
function getTimelineHTML(statusVal) {
  let step = 1;
  let sColor = '#10B981'; // เขียวแบบในรูป

  if (statusVal === 'progress') { step = 2; }
  else if (statusVal === 'resolved') { step = 3; }
  else if (statusVal === 'hold' || statusVal === 'rejected') {
    // กรณี Hold หรือ Rejected โชว์ป้ายสถานะธรรมดา
    sColor = (statusVal === 'rejected') ? '#EF4444' : '#F59E0B';
    return `
      <div class="text-[10.5px] font-semibold flex items-center justify-center gap-1.5 py-1 px-3 rounded-full border" style="color: ${sColor}; border-color: ${sColor}50; background: ${sColor}15; min-width: 80px;">
        <i class="fas ${statusVal === 'rejected' ? 'fa-times-circle' : 'fa-pause-circle'}"></i> 
        ${STATUS[statusVal].label}
      </div>
     `;
  }

  // คำนวณความกว้างของขีดความคืบหน้า
  const wPercent = (step === 1) ? '0%' : (step === 2) ? '50%' : '100%';

  return `
    <div class="tl-wrapper w-full" style="color: ${sColor}">
      <div class="tl-track-bg"></div>
      <div class="tl-track-fill" style="width: ${wPercent}; background: currentColor;"></div>
      <div class="tl-steps-row">
        
        <div class="tl-step ${step >= 1 ? 'active' : ''}">
          <div class="tl-icon-box" style="${step >= 1 ? 'background:currentColor; border-color:currentColor; color:#fff;' : ''}">
          </div>
          <div class="tl-label">Pending</div>
        </div>
        
        <div class="tl-step ${step >= 2 ? 'active' : ''}">
          <div class="tl-icon-box" style="${step >= 2 ? 'background:currentColor; border-color:currentColor; color:#fff;' : ''}">
          </div>
          <div class="tl-label">In Progress</div>
        </div>
        
        <div class="tl-step ${step >= 3 ? 'active' : ''}">
          <div class="tl-icon-box" style="${step >= 3 ? 'background:currentColor; border-color:currentColor; color:#fff;' : ''}">
          </div>
          <div class="tl-label">Resolved</div>
        </div>

      </div>
    </div>
  `;
}
// ฟังก์ชันสร้าง UI สำหรับแต่ละปัญหา
function cardHTML(issue, idx) {
  const cat = CAT[issue.category] || CAT.other;

  // Check if rejected to display it in place of timeline
  const isRejected = issue.status === 'rejected';

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
    <div class="ic" style="--_cc:${cat.color}; animation: sUp .35s ${idx * 0.055}s both;">
      <div class="ic-head">
        <div class="ic-title">${cat.icon} ${escapeHtml(issue.title)}</div>
        <div class="cat-badge"><div class="cdot"></div>${cat.label}</div>
      </div>
      <p class="ic-desc">${escapeHtml(issue.desc)}</p>
      <!-- ตำแหน่งข้อมูลด้านล่าง พร้อม Timeline ชิดขวา -->
      <div class="ic-foot flex-col !items-start gap-3 mt-4">
        <div class="w-full flex justify-between items-end gap-3">
            <div class="flex flex-col gap-1.5 min-w-0 text-xs text-gray-500">
                <span class="truncate"><i class="fas fa-map-marker-alt text-red-500 mr-1"></i> Bld ${escapeHtml(issue.bld)} | Flr ${escapeHtml(issue.flr)} | Rm ${escapeHtml(issue.rm)}</span>
                <span class="truncate text-gray-400"><i class="far fa-clock mr-1"></i> ${escapeHtml(issue.time)}</span>
            </div>
            <!-- Timeline แสดงด้านขวาแทนที่สถานะแบบเก่า หรือแสดงเหตุผลถ้าถูกแคนเซิล -->
            <div class="flex-shrink-0 pb-1 w-[260px] flex justify-end">
                ${isRejected
      ? `<div class="bg-red-50 border border-red-200 p-3 rounded-md text-sm text-red-700 w-full text-right leading-tight shadow-sm shrink-0">
                      <strong><i class="fas fa-ban mr-1"></i> Rejected</strong><br>
                      <span class="opacity-90 mt-1 block font-medium break-words whitespace-normal">${escapeHtml(issue.rejection_reason || 'No reason provided')}</span>
                     </div>`
      : getTimelineHTML(issue.status)}
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