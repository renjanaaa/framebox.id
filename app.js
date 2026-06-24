// ─── ELEMENT REFS ────────────────────────────────────────────────────────────
const video = document.getElementById('video');
const noCamEl = document.getElementById('noCam');
const countdownEl = document.getElementById('countdown');
const flashEl = document.getElementById('flash');
const timerSelect = document.getElementById('timerSelect');
const stripProgress = document.getElementById('stripProgress');
const stripNumEl = document.getElementById('stripNum');

// Step panels
const panelCapture = document.getElementById('panel-capture');
const panelFilter = document.getElementById('panel-filter');
const panelFrame = document.getElementById('panel-frame');

// Step indicators
const indicatorStep1 = document.getElementById('indicator-step1');
const indicatorStep2 = document.getElementById('indicator-step2');
const indicatorStep3 = document.getElementById('indicator-step3');

// Action buttons
const btnStartCapture = document.getElementById('btnStartCapture');
const btnGoToFrame = document.getElementById('btnGoToFrame');
const btnDownloadStrip = document.getElementById('btnDownloadStrip');
const btnNewSession = document.getElementById('btnNewSession');

// Landing Overlay
const landingOverlay = document.getElementById('landingOverlay');
const btnStartSession = document.getElementById('btnStartSession');

// Mode buttons
const btnModeStrip = document.getElementById('btnModeStrip');
const btnModeNewspaper = document.getElementById('btnModeNewspaper');
const frameSelectionSection = document.getElementById('frameSelectionSection');

// Drawer elements
const btnSettingsToggle = document.getElementById('btnSettingsToggle');
const btnCloseDrawer = document.getElementById('btnCloseDrawer');
const drawerOverlay = document.getElementById('drawerOverlay');
const settingsDrawer = document.getElementById('settingsDrawer');
const btnAddSlot = document.getElementById('btnAddSlot');
const customSlotsList = document.getElementById('customSlotsList');

// ─── STATE ────────────────────────────────────────────────────────────────────
let currentStep = 1;
let rawPhotos = [];      // Array of 3 base64 raw photos
let currentFilter = 'none';
let currentFrame = 'none';
let isBusy = false;
let customFrames = [];   // Array of custom frames: { id, label, src, type, isEditing, imgObj }
let sessionSerialNumber = generateSerialNumber();
let layoutMode = 'strip'; // 'strip' atau 'newspaper'

function generateSerialNumber() {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `#FB-${result}`;
}

// ─── FILTER DEFINITIONS ───────────────────────────────────────────────────────
const FILTERS = [
  { id: 'none', label: 'Normal', fn: null },
  { id: 'bw', label: 'B&W', fn: applyBW },
  { id: 'sepia', label: 'Sepia', fn: applySepia },
  { id: 'vivid', label: 'Vivid', fn: applyVivid },
  { id: 'cool', label: 'Cool', fn: applyCool },
  { id: 'warm', label: 'Warm', fn: applyWarm },
  { id: 'retro', label: 'Retro', fn: applyRetro },
  { id: 'fade', label: 'Fade', fn: applyFade },
  { id: 'invert', label: 'Invert', fn: applyInvert },
];

function applyBW(d) {
  for (let i = 0; i < d.length; i += 4) {
    const g = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
    d[i] = d[i + 1] = d[i + 2] = g;
  }
}
function applySepia(d) {
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    d[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
    d[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
    d[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
  }
}
function applyVivid(d) {
  for (let i = 0; i < d.length; i += 4) {
    d[i] = Math.min(255, d[i] * 1.3);
    d[i + 1] = Math.min(255, d[i + 1] * 1.1);
    d[i + 2] = Math.min(255, d[i + 2] * 0.9);
  }
}
function applyCool(d) {
  for (let i = 0; i < d.length; i += 4) {
    d[i] = Math.max(0, d[i] - 20);
    d[i + 2] = Math.min(255, d[i + 2] + 40);
  }
}
function applyWarm(d) {
  for (let i = 0; i < d.length; i += 4) {
    d[i] = Math.min(255, d[i] + 30);
    d[i + 1] = Math.min(255, d[i + 1] + 10);
    d[i + 2] = Math.max(0, d[i + 2] - 20);
  }
}
function applyRetro(d) {
  for (let i = 0; i < d.length; i += 4) {
    const gray = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11;
    d[i] = Math.min(255, gray * 1.1 + 40);
    d[i + 1] = Math.min(255, gray * 0.9 + 20);
    d[i + 2] = Math.min(255, gray * 0.7 + 10);
  }
}
function applyFade(d) {
  for (let i = 0; i < d.length; i += 4) {
    d[i] = d[i] * 0.8 + 50;
    d[i + 1] = d[i + 1] * 0.8 + 50;
    d[i + 2] = d[i + 2] * 0.8 + 50;
  }
}
function applyInvert(d) {
  for (let i = 0; i < d.length; i += 4) {
    d[i] = 255 - d[i];
    d[i + 1] = 255 - d[i + 1];
    d[i + 2] = 255 - d[i + 2];
  }
}

// ─── FRAME DEFINITIONS ────────────────────────────────────────────────────────
const FRAMES = [
  { id: 'none', label: 'Tanpa Frame' }
];

// ─── STEP NAVIGATION STATE MACHINE ────────────────────────────────────────────
function goToStep(stepNum) {
  currentStep = stepNum;
  
  // Hide all panels
  panelCapture.classList.remove('active');
  panelFilter.classList.remove('active');
  panelFrame.classList.remove('active');
  
  // Update step indicator classes
  indicatorStep1.classList.remove('active');
  indicatorStep2.classList.remove('active');
  indicatorStep3.classList.remove('active');
  
  if (stepNum === 1) {
    panelCapture.classList.add('active');
    indicatorStep1.classList.add('active');
    startCamera();
  } else if (stepNum === 2) {
    panelFilter.classList.add('active');
    indicatorStep2.classList.add('active');
    stopCamera();
    updateFilterPreviews();
  } else if (stepNum === 3) {
    panelFrame.classList.add('active');
    indicatorStep3.classList.add('active');
    stopCamera();
    updateFinalPreview();
  }
}

// ─── CAMERA SERVICES ─────────────────────────────────────────────────────────
async function startCamera() {
  if (video.srcObject) return; // already active
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
      audio: false
    });
    video.srcObject = stream;
    noCamEl.style.display = 'none';
    btnStartCapture.disabled = false;
  } catch (e) {
    console.error('Kamera gagal diakses:', e);
    noCamEl.style.display = 'flex';
    btnStartCapture.disabled = true;
  }
}

function stopCamera() {
  if (video.srcObject) {
    const tracks = video.srcObject.getTracks();
    tracks.forEach(track => track.stop());
    video.srcObject = null;
  }
}

// ─── IMAGE CAPTURING ─────────────────────────────────────────────────────────
function captureRawFrame() {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');
  
  const videoW = video.videoWidth || 640;
  const videoH = video.videoHeight || 480;
  
  // Calculate center-cropped 4:3 bounds
  let cropW = videoW;
  let cropH = videoH;
  if (videoW / videoH > 4/3) {
    cropW = videoH * (4/3);
  } else {
    cropH = videoW * (3/4);
  }
  
  const startX = (videoW - cropW) / 2;
  const startY = (videoH - cropH) / 2;
  
  ctx.save();
  ctx.translate(640, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, startX, startY, cropW, cropH, 0, 0, 640, 480);
  ctx.restore();
  
  return canvas.toDataURL('image/jpeg', 0.95);
}

// ─── COUNTDOWN & FLASH EFFECT ────────────────────────────────────────────────
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function doFlash() {
  flashEl.style.opacity = '0.85';
  await sleep(120);
  flashEl.style.opacity = '0';
}

async function runCountdownThenCapture() {
  const delay = parseInt(timerSelect.value) || 5;
  if (delay > 0) {
    for (let i = delay; i >= 1; i--) {
      countdownEl.textContent = i;
      countdownEl.style.opacity = '1';
      await sleep(1000);
    }
    countdownEl.style.opacity = '0';
    countdownEl.textContent = '';
  }
  await doFlash();
  await sleep(60);
  return captureRawFrame();
}

// ─── STEP 1 LISTENERS ────────────────────────────────────────────────────────
btnStartCapture.addEventListener('click', async () => {
  if (isBusy) return;
  isBusy = true;
  btnStartCapture.disabled = true;
  
  stripProgress.style.display = 'flex';
  rawPhotos = [];
  
  ['dot0', 'dot1', 'dot2'].forEach(id => {
    document.getElementById(id).className = 'dot';
  });
  
  for (let i = 0; i < 3; i++) {
    ['dot0', 'dot1', 'dot2'].forEach((id, j) => {
      const d = document.getElementById(id);
      if (j < i) {
        d.className = 'dot done';
      } else if (j === i) {
        d.className = 'dot active';
      } else {
        d.className = 'dot';
      }
    });
    
    stripNumEl.textContent = i + 1;
    
    const imgUrl = await runCountdownThenCapture();
    rawPhotos.push(imgUrl);
    
    document.getElementById('dot' + i).className = 'dot done';
    
    if (i < 2) await sleep(600);
  }
  
  stripProgress.style.display = 'none';
  btnStartCapture.disabled = false;
  isBusy = false;
  
  goToStep(2);
});

// ─── STEP 2 FILTER GENERATION & EVENTS ───────────────────────────────────────
async function applyFilterToImage(rawSrc, filterId) {
  if (filterId === 'none') return rawSrc;
  
  const img = await loadImg(rawSrc);
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, 640, 480);
  
  const imageData = ctx.getImageData(0, 0, 640, 480);
  const filterDef = FILTERS.find(f => f.id === filterId);
  if (filterDef && filterDef.fn) {
    filterDef.fn(imageData.data);
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.95);
}

function loadImg(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

function drawSampleFilter(canvas, fn) {
  const ctx = canvas.getContext('2d');
  const grd = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grd.addColorStop(0, '#c87050');
  grd.addColorStop(0.5, '#5090c0');
  grd.addColorStop(1, '#60b060');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (fn) {
    const id = ctx.getImageData(0, 0, canvas.width, canvas.height);
    fn(id.data);
    ctx.putImageData(id, 0, 0);
  }
}

function buildFilters() {
  const grid = document.getElementById('filterGrid');
  grid.innerHTML = '';
  
  FILTERS.forEach(f => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn' + (f.id === currentFilter ? ' active' : '');
    btn.dataset.id = f.id;
    
    const canvas = document.createElement('canvas');
    canvas.width = 60;
    canvas.height = 45;
    drawSampleFilter(canvas, f.fn);
    btn.appendChild(canvas);
    
    const label = document.createElement('span');
    label.textContent = f.label;
    btn.appendChild(label);
    
    btn.addEventListener('click', async () => {
      if (isBusy) return;
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = f.id;
      
      isBusy = true;
      await updateFilterPreviews();
      isBusy = false;
    });
    grid.appendChild(btn);
  });
}

async function updateFilterPreviews() {
  for (let i = 0; i < 3; i++) {
    if (rawPhotos[i]) {
      const filteredUrl = await applyFilterToImage(rawPhotos[i], currentFilter);
      document.getElementById(`filterPreview${i}`).src = filteredUrl;
    }
  }
}

btnGoToFrame.addEventListener('click', () => {
  goToStep(3);
});

// ─── STEP 3 STITCHING, FRAMES, DOWNLOAD & RESET ──────────────────────────────
async function generateStitchedStrip() {
  if (rawPhotos.length < 3) return null;
  
  const filteredShots = [];
  for (let i = 0; i < 3; i++) {
    const url = await applyFilterToImage(rawPhotos[i], currentFilter);
    filteredShots.push(url);
  }
  
  const cW = 676;
  const cH = 1730;
  const canvas = document.createElement('canvas');
  canvas.width = cW;
  canvas.height = cH;
  const ctx = canvas.getContext('2d');
  
  // Fill background with white
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, cW, cH);
  
  // Draw 3 photos in vertical strip slots
  const yOffsets = [100, 583, 1066];
  for (let i = 0; i < 3; i++) {
    const img = await loadImg(filteredShots[i]);
    ctx.drawImage(img, 28, yOffsets[i], 620, 465);
  }
  
  // Overlay frame
  const customDef = customFrames.find(f => f.id === currentFrame);
  if (customDef && customDef.imgObj && customDef.src) {
    if (customDef.type === 'strip') {
      ctx.drawImage(customDef.imgObj, 0, 0, cW, cH);
    } else {
      // Draw single frame on top of each individual photo
      for (let i = 0; i < 3; i++) {
        ctx.drawImage(customDef.imgObj, 28, yOffsets[i], 620, 465);
      }
    }
  } else {
    // Default brand header watermark
    ctx.fillStyle = '#44566C';
    ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('framebox.id', cW / 2, 60);
    
    // Default brand footer text
    ctx.font = '15px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#8fa3b3';
    ctx.fillText('Where Smiles Become Memories', cW / 2, 1640);
  }
  
  // Draw the serial number ON TOP of everything (so it displays even with custom frames!)
  ctx.save();
  ctx.fillStyle = 'rgba(68, 86, 108, 0.65)'; // user palette text color with 65% opacity
  ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(sessionSerialNumber, cW - 28, cH - 20);
  ctx.restore();
  
  return canvas.toDataURL('image/jpeg', 0.95);
}

// ─── NEWSPAPER LAYOUT DRAWING & HELPERS ───────────────────────────────────────
function drawCenterCroppedImage(ctx, img, dx, dy, dWidth, dHeight) {
  const imgW = img.width;
  const imgH = img.height;
  const targetRatio = dWidth / dHeight;
  
  let sWidth = imgW;
  let sHeight = imgH;
  if (imgW / imgH > targetRatio) {
    sWidth = imgH * targetRatio;
  } else {
    sHeight = imgW / targetRatio;
  }
  
  const sx = (imgW - sWidth) / 2;
  const sy = (imgH - sHeight) / 2;
  
  ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, font, color) {
  ctx.fillStyle = color;
  ctx.font = font;
  const words = text.split(' ');
  let line = '';
  let currentY = y;
  
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
  return currentY + lineHeight;
}

async function generateNewspaperLayout() {
  if (rawPhotos.length < 3) return null;
  
  const filteredShots = [];
  for (let i = 0; i < 3; i++) {
    const url = await applyFilterToImage(rawPhotos[i], currentFilter);
    filteredShots.push(url);
  }
  
  const cW = 1200;
  const cH = 1600;
  const canvas = document.createElement('canvas');
  canvas.width = cW;
  canvas.height = cH;
  const ctx = canvas.getContext('2d');
  
  // Fill background with warm vintage cream (palette secondary)
  ctx.fillStyle = '#FAF6EF';
  ctx.fillRect(0, 0, cW, cH);
  
  const txtColor = '#44566C'; // palette text color
  const accentColor = '#8fa3b3';
  
  // ─── DRAW HEADER ───
  ctx.fillStyle = txtColor;
  ctx.font = 'bold 14px "Georgia", serif';
  ctx.textAlign = 'left';
  ctx.fillText('WHERE SMILE BECOME MEMORIES', 60, 60);
  
  ctx.textAlign = 'center';
  ctx.fillText('NEWSPAPER', cW / 2, 60);
  
  ctx.textAlign = 'right';
  ctx.fillText('FRAMEBOX.ID', cW - 60, 60);
  
  ctx.strokeStyle = txtColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(60, 80);
  ctx.lineTo(cW - 60, 80);
  ctx.stroke();
  
  ctx.fillStyle = txtColor;
  ctx.font = 'bold 84px "Georgia", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('PICTURE MEMORIES', cW / 2, 95);
  
  ctx.font = 'bold 28px "Georgia", serif';
  ctx.fillText('NEWSPAPER BY FRAMEBOX.ID', cW / 2, 195);
  
  ctx.strokeStyle = txtColor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(60, 240);
  ctx.lineTo(cW - 60, 240);
  ctx.stroke();
  
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(60, 248);
  ctx.lineTo(cW - 60, 248);
  ctx.stroke();
  
  // ─── DRAW CONTENT ───
  const img1 = await loadImg(filteredShots[0]);
  drawCenterCroppedImage(ctx, img1, 60, 270, 1080, 500);
  
  ctx.strokeStyle = 'rgba(68, 86, 108, 0.3)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(60, 790);
  ctx.lineTo(cW - 60, 790);
  ctx.stroke();
  
  // Row 2
  const leftColX = 60;
  const leftColY = 810;
  const leftColWidth = 440;
  
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  
  const nextY = drawWrappedText(
    ctx,
    'WHAT A GREAT DAY TO CAPTURE YOUR MEMORIES',
    leftColX,
    leftColY,
    leftColWidth,
    30,
    'bold 24px "Georgia", serif',
    txtColor
  );
  
  const article1 = 'Memories are recollections of past experiences and information, created through the brain\'s processes of encoding, storing, and retrieving. They are fundamental to a sense of self and can be happy or sad, and may be shared through stories or photos. The term "Memories" also refers to a 2019 song. People often share memories by telling stories, looking at old photos, or watching home movies. Memory is the process of encoding, storing, and retrieving experiences and knowledge, and its many guises are even more important than you think. It is hard to overstate the importance of memory. It is what makes us who we are.';
  drawWrappedText(
    ctx,
    article1,
    leftColX,
    nextY + 15,
    leftColWidth,
    20,
    '500 13px "Georgia", serif',
    txtColor
  );
  
  const img2 = await loadImg(filteredShots[1]);
  drawCenterCroppedImage(ctx, img2, 560, 810, 580, 435);
  
  ctx.beginPath();
  ctx.moveTo(60, 1265);
  ctx.lineTo(cW - 60, 1265);
  ctx.stroke();
  
  // Row 3
  const img3 = await loadImg(filteredShots[2]);
  drawCenterCroppedImage(ctx, img3, 60, 1285, 460, 345);
  
  const rightColX = 560;
  const rightColY = 1285;
  const rightColWidth = 580;
  
  const nextY2 = drawWrappedText(
    ctx,
    'BACK TO MEMORIES',
    rightColX,
    rightColY,
    rightColWidth,
    34,
    'bold 28px "Georgia", serif',
    txtColor
  );
  
  const subHeading = 'ORDINARY DAYS INTO LASTING TREASURES.';
  const nextY3 = drawWrappedText(
    ctx,
    subHeading,
    rightColX,
    nextY2 + 5,
    rightColWidth,
    20,
    'bold 14px "Georgia", serif',
    accentColor
  );
  
  const article2 = 'Capturing memories is about freezing moments that tell a story. Every smile, laugh, or glance holds meaning. Photos let us revisit these feelings, keeping small details alive long after the moment passes. Each snapshot becomes a piece of our personal history. Memories gain more value when shared. Taking a photo together creates connection and joy. It reminds us of bonds with friends, family, and loved ones.';
  drawWrappedText(
    ctx,
    article2,
    rightColX,
    nextY3 + 15,
    rightColWidth,
    20,
    '500 13px "Georgia", serif',
    txtColor
  );
  
  // ─── DRAW FOOTER ───
  ctx.strokeStyle = txtColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(60, 1650);
  ctx.lineTo(cW - 60, 1650);
  ctx.stroke();
  
  ctx.textBaseline = 'middle';
  ctx.fillStyle = txtColor;
  ctx.font = 'bold 14px "Georgia", serif';
  
  ctx.textAlign = 'left';
  ctx.fillText('NEWSBOOTH', 60, 1670);
  
  ctx.textAlign = 'center';
  ctx.fillText(`@FRAMEBOX.ID - ${sessionSerialNumber}`, cW / 2, 1670);
  
  ctx.textAlign = 'right';
  ctx.fillText('01', cW - 60, 1670);
  
  return canvas.toDataURL('image/jpeg', 0.95);
}

async function updateFinalPreview() {
  const finalPreview = document.getElementById('finalStripPreview');
  
  if (layoutMode === 'newspaper') {
    finalPreview.style.width = '420px';
    finalPreview.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="250" height="333" viewBox="0 0 250 333"><rect width="100%" height="100%" fill="%23FAF6EF"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%2344566C">Sedang memproses...</text></svg>';
    
    const stripDataUrl = await generateNewspaperLayout();
    if (stripDataUrl) {
      finalPreview.src = stripDataUrl;
    }
  } else {
    finalPreview.style.width = '250px';
    finalPreview.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="250" height="640" viewBox="0 0 250 640"><rect width="100%" height="100%" fill="%23FAF6EF"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%2344566C">Sedang memproses...</text></svg>';
    
    const stripDataUrl = await generateStitchedStrip();
    if (stripDataUrl) {
      finalPreview.src = stripDataUrl;
    }
  }
}

function buildFrames() {
  const grid = document.getElementById('frameGrid');
  grid.innerHTML = '';
  
  // 1. Tanpa Frame
  FRAMES.forEach(f => {
    const btn = document.createElement('button');
    btn.className = 'frame-btn' + (f.id === currentFrame ? ' active' : '');
    btn.dataset.id = f.id;
    btn.textContent = f.label;
    btn.addEventListener('click', async () => {
      document.querySelectorAll('.frame-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFrame = f.id;
      await updateFinalPreview();
    });
    grid.appendChild(btn);
  });
  
  // 2. Custom Frames
  customFrames.forEach(f => {
    if (!f.src) return;
    const btn = document.createElement('button');
    btn.className = 'frame-btn' + (f.id === currentFrame ? ' active' : '');
    btn.dataset.id = f.id;
    btn.textContent = f.label || 'Custom';
    btn.addEventListener('click', async () => {
      document.querySelectorAll('.frame-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFrame = f.id;
      await updateFinalPreview();
    });
    
    // Right click option to delete
    btn.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      showDeleteContextMenu(e, f.id, f.label);
    });
    
    grid.appendChild(btn);
  });
}

btnDownloadStrip.addEventListener('click', () => {
  const finalPreview = document.getElementById('finalStripPreview');
  if (!finalPreview.src || finalPreview.src.startsWith('data:image/svg')) {
    alert('Tunggu pratinjau selesai dimuat.');
    return;
  }
  const a = document.createElement('a');
  a.href = finalPreview.src;
  a.download = 'framebox-id-' + Date.now() + '.jpg';
  a.click();
});

btnNewSession.addEventListener('click', () => {
  rawPhotos = [];
  currentFilter = 'none';
  currentFrame = 'none';
  sessionSerialNumber = generateSerialNumber();
  layoutMode = 'strip';
  
  if (btnModeStrip && btnModeNewspaper) {
    btnModeStrip.classList.add('active');
    btnModeNewspaper.classList.remove('active');
  }
  if (frameSelectionSection) {
    frameSelectionSection.style.display = 'block';
  }
  
  // Reset filter grid visual active state
  document.querySelectorAll('.filter-btn').forEach(b => {
    if (b.dataset.id === 'none') b.classList.add('active');
    else b.classList.remove('active');
  });
  
  // Reset frame grid visual active state
  buildFrames();
  
  stopCamera();
  
  if (landingOverlay) {
    landingOverlay.classList.remove('fade-out');
  }
  
  currentStep = 1;
});

// ─── LAYOUT MODE TOGGLER EVENTS ───────────────────────────────────────────────
if (btnModeStrip && btnModeNewspaper) {
  btnModeStrip.addEventListener('click', async () => {
    if (layoutMode === 'strip') return;
    btnModeStrip.classList.add('active');
    btnModeNewspaper.classList.remove('active');
    layoutMode = 'strip';
    if (frameSelectionSection) {
      frameSelectionSection.style.display = 'block';
    }
    await updateFinalPreview();
  });

  btnModeNewspaper.addEventListener('click', async () => {
    if (layoutMode === 'newspaper') return;
    btnModeNewspaper.classList.add('active');
    btnModeStrip.classList.remove('active');
    layoutMode = 'newspaper';
    if (frameSelectionSection) {
      frameSelectionSection.style.display = 'none';
    }
    await updateFinalPreview();
  });
}

// ─── DRAWER CONTROL EVENTS ────────────────────────────────────────────────────
if (btnSettingsToggle && btnCloseDrawer && drawerOverlay && settingsDrawer) {
  btnSettingsToggle.addEventListener('click', () => {
    settingsDrawer.classList.add('open');
    drawerOverlay.classList.add('open');
  });
  
  const closeDrawer = () => {
    settingsDrawer.classList.remove('open');
    drawerOverlay.classList.remove('open');
  };
  
  btnCloseDrawer.addEventListener('click', closeDrawer);
  drawerOverlay.addEventListener('click', closeDrawer);
}

// ─── CUSTOM FRAME STORAGE & CRUD ──────────────────────────────────────────────
function loadCustomFramesFromStorage() {
  try {
    const saved = localStorage.getItem('framebox_custom_frames');
    if (saved) {
      const parsed = JSON.parse(saved);
      customFrames = parsed.map(f => {
        const imgObj = new Image();
        if (f.src) {
          imgObj.src = f.src;
        }
        return {
          id: f.id,
          label: f.label || 'Frame Custom',
          src: f.src || '',
          type: f.type || 'single',
          isEditing: false, // Collapsed by default on reload
          imgObj: imgObj
        };
      });
    }
  } catch (e) {
    console.error('Error loading custom frames from storage', e);
  }
}

function saveCustomFramesToStorage() {
  try {
    const toSave = customFrames.map(f => ({
      id: f.id,
      label: f.label,
      src: f.src,
      type: f.type || 'single'
    }));
    localStorage.setItem('framebox_custom_frames', JSON.stringify(toSave));
  } catch (e) {
    console.error('Error saving custom frames to storage', e);
  }
}

function addCustomFrameSlot() {
  const slotId = 'custom_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  const newSlot = {
    id: slotId,
    label: '',
    src: '',
    type: 'single',
    isEditing: true, // Expanded by default for new slots
    imgObj: new Image()
  };
  customFrames.push(newSlot);
  saveCustomFramesToStorage();
  renderCustomSlots();
  buildFrames();
}

function renderCustomSlots() {
  customSlotsList.innerHTML = '';
  
  if (customFrames.length === 0) {
    const emptyMsg = document.createElement('p');
    emptyMsg.className = 'slots-empty-msg';
    emptyMsg.textContent = 'Belum ada slot frame custom. Tambah slot untuk mengunggah desain.';
    customSlotsList.appendChild(emptyMsg);
    return;
  }
  
  customFrames.forEach((f, idx) => {
    const slotCard = document.createElement('div');
    slotCard.className = 'slot-card' + (f.src ? ' has-file' : '') + (f.isEditing ? ' editing' : ' collapsed');
    
    if (f.isEditing) {
      // Edit Mode
      const slotHeader = document.createElement('div');
      slotHeader.className = 'slot-header';
      
      const labelInput = document.createElement('input');
      labelInput.type = 'text';
      labelInput.className = 'slot-label-input';
      labelInput.placeholder = `Nama Frame ${idx + 1}`;
      labelInput.value = f.label;
      labelInput.addEventListener('input', (e) => {
        f.label = e.target.value;
        saveCustomFramesToStorage();
        buildFrames();
      });
      
      const typeLabel = document.createElement('label');
      typeLabel.className = 'slot-type-label';
      typeLabel.textContent = 'Tipe:';
      
      const typeSelect = document.createElement('select');
      typeSelect.className = 'slot-type-select';
      
      const optSingle = document.createElement('option');
      optSingle.value = 'single';
      optSingle.textContent = 'Single';
      optSingle.selected = f.type !== 'strip';
      
      const optStrip = document.createElement('option');
      optStrip.value = 'strip';
      optStrip.textContent = 'Strip';
      optStrip.selected = f.type === 'strip';
      
      typeSelect.appendChild(optSingle);
      typeSelect.appendChild(optStrip);
      
      typeSelect.addEventListener('change', (e) => {
        f.type = e.target.value;
        saveCustomFramesToStorage();
        buildFrames();
        renderCustomSlots();
      });
      
      typeLabel.appendChild(typeSelect);
      
      const btnOk = document.createElement('button');
      btnOk.type = 'button';
      btnOk.className = 'btn-slot-ok';
      btnOk.textContent = 'Oke';
      btnOk.addEventListener('click', () => {
        if (!f.label) {
          f.label = f.src ? `Frame ${idx + 1}` : 'Slot Kosong';
        }
        f.isEditing = false;
        saveCustomFramesToStorage();
        renderCustomSlots();
        buildFrames();
      });
      
      const btnDelSlot = document.createElement('button');
      btnDelSlot.type = 'button';
      btnDelSlot.className = 'btn-del-slot';
      btnDelSlot.innerHTML = '✕';
      btnDelSlot.title = 'Hapus Slot';
      btnDelSlot.addEventListener('click', () => {
        removeCustomFrameSlot(f.id);
      });
      
      slotHeader.appendChild(labelInput);
      slotHeader.appendChild(typeLabel);
      slotHeader.appendChild(btnOk);
      slotHeader.appendChild(btnDelSlot);
      slotCard.appendChild(slotHeader);
      
      // Upload/Preview Zone
      const slotBody = document.createElement('div');
      slotBody.className = 'slot-body';
      
      if (f.src) {
        const previewImg = document.createElement('img');
        previewImg.src = f.src;
        previewImg.className = 'slot-preview-img';
        
        const fileInfo = document.createElement('div');
        fileInfo.className = 'slot-file-info';
        
        const changeBtn = document.createElement('label');
        changeBtn.className = 'btn-change-file';
        changeBtn.textContent = 'Ganti PNG';
        
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/png';
        fileInput.style.display = 'none';
        fileInput.addEventListener('change', (e) => {
          if (e.target.files[0]) {
            handleSlotFileUpload(f.id, e.target.files[0]);
          }
        });
        
        changeBtn.appendChild(fileInput);
        fileInfo.appendChild(changeBtn);
        
        slotBody.appendChild(previewImg);
        slotBody.appendChild(fileInfo);
      } else {
        const dropZone = document.createElement('div');
        dropZone.className = 'slot-drop-zone';
        dropZone.innerHTML = `<span>Drag & drop / Klik untuk upload PNG</span>`;
        
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/png';
        fileInput.className = 'slot-file-input';
        fileInput.addEventListener('change', (e) => {
          if (e.target.files[0]) {
            handleSlotFileUpload(f.id, e.target.files[0]);
          }
        });
        
        dropZone.appendChild(fileInput);
        
        dropZone.addEventListener('dragover', (e) => {
          e.preventDefault();
          dropZone.classList.add('drag-over');
        });
        dropZone.addEventListener('dragleave', () => {
          dropZone.classList.remove('drag-over');
        });
        dropZone.addEventListener('drop', (e) => {
          e.preventDefault();
          dropZone.classList.remove('drag-over');
          if (e.dataTransfer.files[0]) {
            handleSlotFileUpload(f.id, e.dataTransfer.files[0]);
          }
        });
        
        slotBody.appendChild(dropZone);
      }
      
      slotCard.appendChild(slotBody);
      
      if (f.type === 'strip') {
        const infoBox = document.createElement('div');
        infoBox.className = 'slot-info-box';
        infoBox.innerHTML = `
          <strong>Panduan Frame Strip (1:2.56):</strong><br>
          • Gunakan file PNG transparan rek. <strong>676 x 1730 px</strong>.<br>
          • Area lubang transparan untuk 3 foto:<br>
          &nbsp;&nbsp;1. Atas: x=28, y=100 (620x465)<br>
          &nbsp;&nbsp;2. Tengah: x=28, y=583 (620x465)<br>
          &nbsp;&nbsp;3. Bawah: x=28, y=1066 (620x465)
        `;
        slotCard.appendChild(infoBox);
      }
    } else {
      // Collapsed Mode
      const slotCollapsedWrap = document.createElement('div');
      slotCollapsedWrap.className = 'slot-collapsed-wrap';
      
      const previewImg = document.createElement('img');
      previewImg.src = f.src || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%23B7D7EE" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>';
      previewImg.className = 'slot-mini-preview';
      
      const titleSpan = document.createElement('span');
      titleSpan.className = 'slot-collapsed-title';
      titleSpan.textContent = f.label || `Frame Custom ${idx + 1}`;
      
      const typeBadge = document.createElement('span');
      typeBadge.className = 'slot-type-badge';
      typeBadge.textContent = f.type === 'strip' ? 'Strip' : 'Single';
      
      const btnEdit = document.createElement('button');
      btnEdit.type = 'button';
      btnEdit.className = 'btn-slot-edit';
      btnEdit.textContent = '✏️ Edit';
      btnEdit.addEventListener('click', () => {
        f.isEditing = true;
        renderCustomSlots();
      });
      
      const btnDelSlot = document.createElement('button');
      btnDelSlot.type = 'button';
      btnDelSlot.className = 'btn-del-slot';
      btnDelSlot.innerHTML = '✕';
      btnDelSlot.title = 'Hapus Slot';
      btnDelSlot.addEventListener('click', () => {
        removeCustomFrameSlot(f.id);
      });
      
      slotCollapsedWrap.appendChild(previewImg);
      slotCollapsedWrap.appendChild(titleSpan);
      slotCollapsedWrap.appendChild(typeBadge);
      slotCollapsedWrap.appendChild(btnEdit);
      slotCollapsedWrap.appendChild(btnDelSlot);
      slotCard.appendChild(slotCollapsedWrap);
    }
    customSlotsList.appendChild(slotCard);
  });
}

function handleSlotFileUpload(slotId, file) {
  if (!file || file.type !== 'image/png') {
    alert('Gunakan file PNG (dengan background transparan).');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (e) => {
    const f = customFrames.find(item => item.id === slotId);
    if (f) {
      f.src = e.target.result;
      if (!f.label) {
        const idx = customFrames.indexOf(f);
        f.label = `Frame ${idx + 1}`;
      }
      f.imgObj = new Image();
      f.imgObj.onload = () => {
        saveCustomFramesToStorage();
        renderCustomSlots();
        buildFrames();
        if (currentFrame === slotId && currentStep === 3) {
          updateFinalPreview();
        }
      };
      f.imgObj.src = e.target.result;
    }
  };
  reader.readAsDataURL(file);
}

function removeCustomFrameSlot(slotId) {
  const index = customFrames.findIndex(f => f.id === slotId);
  if (index !== -1) {
    if (currentFrame === slotId) {
      currentFrame = 'none';
      if (currentStep === 3) {
        updateFinalPreview();
      }
    }
    customFrames.splice(index, 1);
    saveCustomFramesToStorage();
    renderCustomSlots();
    buildFrames();
  }
}

btnAddSlot.addEventListener('click', addCustomFrameSlot);

// ─── CONTEXT MENU (RIGHT CLICK DELETE FRAME IN STEP 3) ────────────────────────
let activeContextMenu = null;

function showDeleteContextMenu(e, frameId, frameLabel) {
  hideDeleteContextMenu();
  
  const menu = document.createElement('div');
  menu.className = 'custom-context-menu';
  menu.style.left = e.pageX + 'px';
  menu.style.top = e.pageY + 'px';
  
  const title = document.createElement('div');
  title.className = 'context-menu-title';
  title.textContent = frameLabel || 'Frame Custom';
  
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'context-menu-btn';
  deleteBtn.innerHTML = '🗑️ Hapus Frame';
  deleteBtn.addEventListener('click', () => {
    if (confirm(`Hapus frame "${frameLabel || 'Frame Custom'}"?`)) {
      removeCustomFrameSlot(frameId);
    }
    hideDeleteContextMenu();
  });
  
  menu.appendChild(title);
  menu.appendChild(deleteBtn);
  document.body.appendChild(menu);
  activeContextMenu = menu;
  
  menu.addEventListener('click', (ev) => ev.stopPropagation());
}

function hideDeleteContextMenu() {
  if (activeContextMenu) {
    activeContextMenu.remove();
    activeContextMenu = null;
  }
}

document.addEventListener('click', hideDeleteContextMenu);
window.addEventListener('scroll', hideDeleteContextMenu);
window.addEventListener('resize', hideDeleteContextMenu);

// ─── INITIALIZATION ───────────────────────────────────────────────────────────
loadCustomFramesFromStorage();
buildFilters();
buildFrames();
renderCustomSlots();

if (landingOverlay && btnStartSession) {
  btnStartSession.addEventListener('click', () => {
    landingOverlay.classList.add('fade-out');
    sessionSerialNumber = generateSerialNumber();
    goToStep(1); // Set step and start camera
  });
} else {
  sessionSerialNumber = generateSerialNumber();
  goToStep(1);
}
