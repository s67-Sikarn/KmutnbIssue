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

// ข้อมูลสถานะ
const STATUS = {
  pending: { label: 'Pending', color: '#10B981' },
  progress: { label: 'In Progress', color: '#10B981' },
  hold: { label: 'On Hold', color: '#F59E0B' },
  resolved: { label: 'Resolved', color: '#10B981' },
  rejected: { label: 'Rejected', color: '#EF4444' },
};

// ฟังก์ชันปรับแต่งชื่อสถานที่
const BLDLBL = v => v === 'IT' ? 'IT Building' : v ? 'Building ' + v : '';
const FLRLBL = v => ({ B: 'Basement', G: 'Ground Floor' }[v] || (v ? 'Floor ' + v : ''));
const RMLBL = v => v ? 'Room ' + v : '';

let issues = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 5;

try {
  const dataEl = document.getElementById('issues-data');
  if (dataEl && dataEl.textContent.trim()) {
    issues = JSON.parse(dataEl.textContent);
  }
} catch (e) {
  console.error("Error parsing backend issues:", e);
}

// Escape a string for safe embedding
function escapeJs(unsafe) {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

// Global modal controller
function openImageModal(imgUrl, title) {
  const imgEl = document.getElementById('imageModalImg');
  const titleEl = document.getElementById('imageModalLabel');
  if (imgEl) imgEl.src = imgUrl || '';
  if (titleEl) titleEl.textContent = title || 'Issue Image';

  const modalEl = document.getElementById('imageModal');
  if (modalEl && window.bootstrap && typeof bootstrap.Modal === 'function') {
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  } else {
    createFallbackModal(imgUrl, title);
  }
}

function closeImageModal() {
  const modalEl = document.getElementById('imageModal');
  if (modalEl && window.bootstrap && typeof bootstrap.Modal === 'function') {
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();
  }
  const fb = document.getElementById('feed-image-backdrop');
  if (fb) fb.remove();
  const fmod = document.getElementById('feed-image-modal');
  if (fmod) fmod.remove();
}

function createFallbackModal(imgUrl, title) {
  if (document.getElementById('feed-image-modal')) return;
  const backdrop = document.createElement('div');
  backdrop.id = 'feed-image-backdrop';
  backdrop.style.position = 'fixed';
  backdrop.style.inset = '0';
  backdrop.style.background = 'rgba(0,0,0,0.8)';
  backdrop.style.zIndex = '1050';

  const modal = document.createElement('div');
  modal.id = 'feed-image-modal';
  modal.style.position = 'fixed';
  modal.style.left = '50%';
  modal.style.top = '50%';
  modal.style.transform = 'translate(-50%, -50%)';
  modal.style.zIndex = '1060';
  modal.style.maxWidth = '90%';
  modal.style.maxHeight = '90%';
  modal.style.display = 'flex';
  modal.style.flexDirection = 'column';
  modal.style.alignItems = 'center';

  const img = document.createElement('img');
  img.src = imgUrl || '';
  img.style.maxHeight = '80vh';
  img.style.width = 'auto';
  img.style.borderRadius = '8px';

  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Close';
  closeBtn.className = 'btn btn-secondary';
  closeBtn.style.marginTop = '10px';
  closeBtn.onclick = () => { backdrop.remove(); modal.remove(); };

  modal.appendChild(img);
  modal.appendChild(closeBtn);
  document.body.appendChild(backdrop);
  document.body.appendChild(modal);
}

/* ── ฟังก์ชันสร้าง UI สถานะ (TIMELINE) ───────────────────── */
function getTimelineHTML(issue) {
  const statusVal = issue.status;
  let step = 1;
  let sColor = '#9CA3AF';

  let step3Label = 'Resolved';
  let step3StatusClass = 'status-resolved';
  let step3Time = issue.resolved_at_time || '';

  if (statusVal === 'progress') {
    step = 2;
    sColor = '#3B82F6';
  }
  else if (statusVal === 'resolved') {
    step = 3;
    sColor = '#10B981';
  }
  else if (statusVal === 'rejected') {
    step = 3;
    sColor = '#EF4444';
    step3Label = 'Rejected';
    step3StatusClass = 'status-rejected';
  }
  else if (statusVal === 'hold') {
    step = 2;
    sColor = '#F59E0B';
  }

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

function cardHTML(issue, idx) {
  const cat = CAT[issue.category] || CAT.other;
  const statusVal = issue.status;
  const isRejected = statusVal === 'rejected';

  let sColor = '#9CA3AF';
  let statusLabel = 'Pending';

  if (statusVal === 'progress') { sColor = '#3B82F6'; statusLabel = 'In Progress'; }
  else if (statusVal === 'resolved') { sColor = '#10B981'; statusLabel = 'Resolved'; }
  else if (statusVal === 'rejected') { sColor = '#EF4444'; statusLabel = 'Rejected'; }
  else if (statusVal === 'hold') { sColor = '#F59E0B'; statusLabel = 'On Hold'; }

  function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  return `
    <div class="ic group cursor-pointer" style="--_cc:${cat.color}; animation: sUp .35s ${idx * 0.055}s both;" onclick="this.classList.toggle('expanded')">
      <div class="ic-head">
        <div class="ic-title">${cat.icon} ${escapeHtml(issue.title)}</div>
        <div class="cat-badge"><div class="cdot"></div>${cat.label}</div>
      </div>
      <p class="ic-desc">${escapeHtml(issue.desc)}</p>
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
                <div class="mb-4 w-full flex justify-center">
                  ${(issue.image_url || issue.image) ? `
                    <button type="button" class="view-photo-btn inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm shadow-md" onclick="event.stopPropagation();openImageModal('${escapeJs(issue.image_url || issue.image)}','${escapeJs(issue.title || '')}')">
                      <i class='fas fa-image mr-2'></i> View Photo
                    </button>
                  ` : `<div class='text-gray-400 italic text-sm'>No photo provided</div>`}
                </div>
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

/* ── RENDER FEED (แก้ไขจุดที่มีปัญหา ReferenceError: body is not defined) ────────────────────────── */
function renderFeed(list, isFiltered) {
  const feedCountEl = document.getElementById('feed-count');
  const feedBody = document.getElementById('feed-body');
  if (!feedCountEl || !feedBody) return;

  feedCountEl.textContent = list.length;
  const feedTitleEl = document.getElementById('feed-title');
  if (feedTitleEl) feedTitleEl.textContent = isFiltered ? 'Issues at Selected Location' : 'All Reported Issues';

  const bldEl = document.getElementById('bld');
  const flrEl = document.getElementById('flr');
  const rmEl = document.getElementById('rm');
  const bld = bldEl ? bldEl.value : '';
  const flr = flrEl ? flrEl.value : '';
  const rm = rmEl ? rmEl.value : '';

  const feedLocEl = document.getElementById('feed-loc-text');
  if (!isFiltered) {
    if (feedLocEl) feedLocEl.textContent = 'All Locations';
  } else {
    const parts = [bld && BLDLBL(bld), flr && FLRLBL(flr), rm && RMLBL(rm)].filter(Boolean);
    if (feedLocEl) feedLocEl.textContent = parts.join(' · ') || 'All Locations';
  }

  // แก้ไขจุดที่ 1: เปลี่ยนจาก body.innerHTML เป็น feedBody.innerHTML
  if (list.length === 0) {
    feedBody.innerHTML = `
      <div class="empty">
        <div class="empty-orb">✅</div>
        <div class="empty-ttl">No Issues Found Here</div>
        <p class="empty-sub">This location looks clear — you may be the first to report an issue here.</p>
      </div>`;
    return;
  }

  const totalPages = Math.ceil(list.length / ITEMS_PER_PAGE);
  if (currentPage > totalPages) currentPage = totalPages || 1;
  if (currentPage < 1) currentPage = 1;

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const pageItems = list.slice(startIndex, endIndex);

  let htmlContent = pageItems
    .map((issue, i) => cardHTML(issue, i))
    .join('<div class="feed-divider"></div>');

  if (totalPages > 1) {
    htmlContent += `
      <div class="pagination-controls" style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #e0e0e0;">
        <button onclick="changePage(-1)" class="btn-pagination" style="background: var(--surface); border: none; padding: 8px 16px; border-radius: 8px; box-shadow: var(--neu-sm); cursor: pointer; color: var(--navy); font-weight: 600; font-size: 14px;" ${currentPage === 1 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
          <i class="fas fa-chevron-left"></i> Prev
        </button>
        <span class="page-info" style="font-size: 14px; color: var(--muted); font-weight: 500;">Page ${currentPage} of ${totalPages}</span>
        <button onclick="changePage(1)" class="btn-pagination" style="background: var(--surface); border: none; padding: 8px 16px; border-radius: 8px; box-shadow: var(--neu-sm); cursor: pointer; color: var(--navy); font-weight: 600; font-size: 14px;" ${currentPage === totalPages ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
          Next <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    `;
  }

  // แก้ไขจุดที่ 2: เปลี่ยนจาก body.innerHTML เป็น feedBody.innerHTML (บรรทัดที่ 336)
  feedBody.innerHTML = htmlContent;
}

window.changePage = function(delta) {
  currentPage += delta;
  onLocChange();
}

function onLocChange() {
  const bldEl = document.getElementById('bld');
  const flrEl = document.getElementById('flr');
  const rmEl = document.getElementById('rm');
  const bld = bldEl ? bldEl.value : '';
  const flr = flrEl ? flrEl.value : '';
  const rm = rmEl ? rmEl.value : '';
  const searchInput = document.getElementById('search-issue');
  const term = searchInput ? searchInput.value.toLowerCase() : '';

  const filtered = issues.filter(i => {
    const matchLoc = (!bld || i.bld === bld) && (!flr || i.flr === flr) && (!rm || i.rm === rm);
    const matchTerm = !term || (i.title && i.title.toLowerCase().includes(term)) || (i.desc && String(i.desc).toLowerCase().includes(term));
    return matchLoc && matchTerm;
  });

  const isFiltered = !!(bld || flr || rm || term);
  renderFeed(filtered, isFiltered);
}

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

renderFeed(issues, false);

const issueForm = document.getElementById('issue-form');
if (issueForm) {
  issueForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    try {
      const response = await fetch('', {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest', 'X-CSRFToken': csrfToken },
        body: formData
      });
      const data = await response.json();
      if (data.success) {
        issues.unshift(data.issue);
        this.reset();
        showToast('✅', 'Issue submitted successfully!');
        onLocChange();
      } else {
        showToast('⚠️', data.error || 'An error occurred.');
      }
    } catch (error) {
      showToast('⚠️', 'Network error.');
    }
  });
}

const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const issueSocket = new WebSocket(wsProtocol + '//' + window.location.host + '/ws/issues/');

issueSocket.onmessage = function (e) {
  const data = JSON.parse(e.data);
  const msg = data.message;
  if (msg.action === 'created') {
    if (issues.findIndex(i => i.id === msg.issue.id) === -1) issues.unshift(msg.issue);
  } else if (msg.action === 'updated') {
    const idx = issues.findIndex(i => i.id === msg.issue.id);
    if (idx !== -1) issues[idx] = msg.issue;
  }
  onLocChange();
};