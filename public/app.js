/**
 * 4º ANIVERSÁRIO DA MICAELLA — MOTOR DO CONVITE CINEMATOGRÁFICO MOANA
 */

let currentEvent = null;
let bgAudio = null;
let isAudioPlaying = false;
let currentLightboxIndex = 0;
let galleryImages = [
  { url: 'assets/fotos/aniversariante.jpg', title: 'Micaella 4 Aninhos', caption: 'Nossa linda aventureira pronta para comemorar!' },
  { url: 'assets/fotos/foto1.jpg', title: 'Momentos da Micaella', caption: 'Sorriso radiante que ilumina todos ao redor.' },
  { url: 'assets/fotos/foto2.jpg', title: 'Alegria e Encanto', caption: 'Cada descoberta é uma nova aventura cheia de magia.' },
  { url: 'assets/fotos/foto3.jpg', title: 'Crescendo com Amor', caption: 'Momentos inesquecíveis da nossa princesinha.' },
  { url: 'assets/fotos/foto4.jpg', title: 'Sorriso Doce', caption: 'Pura doçura e alegria em cada olhar.' },
  { url: 'assets/fotos/foto5.jpg', title: 'Pequena Exploradora', caption: 'Pronta para desbravar os mares da diversão.' },
  { url: 'assets/fotos/foto6.jpg', title: 'Brincadeiras e Risadas', caption: 'Momentos felizes que marcam a infância.' },
  { url: 'assets/fotos/foto7.jpg', title: 'Doce Micaella', caption: 'Comemorando cada instante com a família e amigos.' },
  { url: 'assets/fotos/foto8.jpg', title: 'Princesa Moana', caption: 'O mar chama e o coração se enche de gratidão.' },
  { url: 'assets/fotos/foto9.jpg', title: 'Pura Magia', caption: 'Um mar de aventuras espera por você!' },
  { url: 'assets/fotos/foto10.jpg', title: 'Família & Amor', caption: 'Celebrando 4 anos de muito amor e bênçãos!' }
];

document.addEventListener('DOMContentLoaded', async () => {
  bgAudio = document.getElementById('audio-theme');

  initIntroCanvas();
  initAmbientCanvas();

  await loadEventData();
  setupEventListeners();
  startCountdown();
  initQrCode();
});

// ==============================================================
// 1. CARREGAR DADOS DO EVENTO
// ==============================================================
async function loadEventData() {
  try {
    const res = await fetch('/api/event');
    if (res.ok) {
      currentEvent = await res.json();
      if (currentEvent.gallery && currentEvent.gallery.length) {
        galleryImages = currentEvent.gallery;
      }
    }
  } catch (err) {
    console.warn('Usando dados locais de fallback.');
  }

  populateUI(currentEvent);
}

function populateUI(event) {
  if (!event) {
    renderGallery(galleryImages);
    return;
  }

  if (event.childName) document.getElementById('intro-title').textContent = event.childName;
  if (event.age) {
    document.getElementById('intro-age').textContent = `FAZ ${event.age.toUpperCase()}`;
    document.getElementById('event-age-badge').textContent = `🌺 ${event.age} de Pura Alegria 🌺`;
  }
  if (event.openingQuote) document.getElementById('intro-quote').textContent = event.openingQuote;

  if (event.title) document.getElementById('event-title').textContent = event.title;
  if (event.subtitle) document.getElementById('event-subtitle').textContent = event.subtitle;
  if (event.description) document.getElementById('event-description-display').textContent = event.description;
  if (event.locationName) document.getElementById('event-location-name').textContent = event.locationName;
  if (event.address) document.getElementById('event-address-display').textContent = event.address;

  if (event.date) {
    const [y, m, d] = event.date.split('-');
    const dateObj = new Date(y, m - 1, d);
    document.getElementById('event-date-display').textContent = dateObj.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  if (event.time && event.endTime) {
    document.getElementById('event-time-display').textContent = `${event.time} às ${event.endTime}`;
    const featTime = document.getElementById('feature-time-display');
    if (featTime) featTime.textContent = `${event.time} às ${event.endTime}`;
  }
  if (event.cakeTime) {
    document.getElementById('event-cake-display').textContent = `Às ${event.cakeTime} da tarde`;
    const featCake = document.getElementById('feature-cake-display');
    if (featCake) featCake.textContent = `${event.cakeTime} da tarde`;
  }
  if (event.rsvpDeadline) {
    document.getElementById('rsvp-deadline-text').textContent = event.rsvpDeadline;
  }

  if (event.mapsUrl) document.getElementById('btn-google-maps').href = event.mapsUrl;
  if (event.wazeUrl) document.getElementById('btn-waze').href = event.wazeUrl;
  if (event.whatsappGroupUrl) document.getElementById('btn-wa-group').href = event.whatsappGroupUrl;

  renderGallery(galleryImages);
}

// ==============================================================
// 2. ABERTURA E ÁUDIO DA MOANA
// ==============================================================
function setupEventListeners() {
  const btnEnter = document.getElementById('btn-enter-experience');
  const btnSkip = document.getElementById('btn-skip-intro');
  const btnMusicToggle = document.getElementById('btn-music-toggle');
  const btnTouchPhoto = document.getElementById('btn-touch-photo');
  const portraitFrame = document.getElementById('portrait-frame');

  if (btnEnter) {
    btnEnter.addEventListener('click', () => {
      startAudioPlayback();
      dismissIntro();
      triggerWelcomeConfetti();
    });
  }

  if (btnSkip) {
    btnSkip.addEventListener('click', () => {
      dismissIntro();
    });
  }

  if (btnMusicToggle) {
    btnMusicToggle.addEventListener('click', toggleAudio);
  }

  if (btnTouchPhoto) {
    btnTouchPhoto.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleAudio();
    });
  }

  if (portraitFrame) {
    portraitFrame.addEventListener('click', toggleAudio);
  }
}

function dismissIntro() {
  const curtain = document.getElementById('cinematic-curtain');
  if (curtain) curtain.classList.add('dismissed');
}

function startAudioPlayback() {
  if (!bgAudio) return;
  bgAudio.play().then(() => {
    isAudioPlaying = true;
    updateAudioUI(true);
  }).catch(err => {
    console.warn('Autoplay bloqueado pelo navegador:', err);
    updateAudioUI(false);
  });
}

function toggleAudio() {
  if (!bgAudio) return;
  if (bgAudio.paused) {
    bgAudio.play().then(() => {
      isAudioPlaying = true;
      updateAudioUI(true);
    }).catch(err => console.error(err));
  } else {
    bgAudio.pause();
    isAudioPlaying = false;
    updateAudioUI(false);
  }
}

function updateAudioUI(playing) {
  const btn = document.getElementById('btn-music-toggle');
  const label = document.getElementById('music-label');
  const icon = document.getElementById('music-icon');

  if (playing) {
    btn?.classList.add('playing');
    if (label) label.textContent = 'Pausar Música';
    if (icon) icon.textContent = '🔊';
  } else {
    btn?.classList.remove('playing');
    if (label) label.textContent = 'Música da Moana 🌺';
    if (icon) icon.textContent = '🎵';
  }
}

// ==============================================================
// 3. CONTAGEM REGRESSIVA
// ==============================================================
function startCountdown() {
  const daysEl = document.getElementById('days');
  const hoursEl = document.getElementById('hours');
  const minsEl = document.getElementById('minutes');
  const secsEl = document.getElementById('seconds');

  function update() {
    const targetDate = new Date('2026-12-19T10:00:00-03:00').getTime();
    const now = new Date().getTime();
    const diff = targetDate - now;

    if (diff <= 0) {
      if (daysEl) daysEl.textContent = '00';
      if (hoursEl) hoursEl.textContent = '00';
      if (minsEl) minsEl.textContent = '00';
      if (secsEl) secsEl.textContent = '00';
      return;
    }

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);

    if (daysEl) daysEl.textContent = d < 10 ? `0${d}` : d;
    if (hoursEl) hoursEl.textContent = h < 10 ? `0${h}` : h;
    if (minsEl) minsEl.textContent = m < 10 ? `0${m}` : m;
    if (secsEl) secsEl.textContent = s < 10 ? `0${s}` : s;
  }

  update();
  setInterval(update, 1000);
}

// ==============================================================
// 4. GALERIA DE FOTOS DA MICAELLA (LIGHTBOX)
// ==============================================================
function renderGallery(images) {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;
  grid.innerHTML = '';

  images.forEach((imgData, index) => {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.setAttribute('aria-label', `Ampliar foto: ${imgData.title}`);

    item.innerHTML = `
      <img src="${imgData.url}" alt="${imgData.title}" class="gallery-thumb" loading="lazy">
      <div class="gallery-overlay-badge">
        <span>${imgData.title}</span>
        <span>🔍 Ampliar</span>
      </div>
    `;

    item.addEventListener('click', () => openLightbox(index));
    grid.appendChild(item);
  });
}

function openLightbox(index) {
  currentLightboxIndex = index;
  const modal = document.getElementById('lightbox-modal');
  const imgEl = document.getElementById('lightbox-img');
  const titleEl = document.getElementById('lightbox-title');
  const descEl = document.getElementById('lightbox-desc');

  const photo = galleryImages[index];
  if (!photo) return;

  imgEl.src = photo.url;
  titleEl.textContent = photo.title;
  descEl.textContent = photo.caption;

  modal.classList.add('open');
}

function closeLightbox(e) {
  if (e && e.target !== e.currentTarget && !e.target.classList.contains('modal-close-btn')) return;
  document.getElementById('lightbox-modal').classList.remove('open');
}

function navigateLightbox(direction) {
  if (!galleryImages.length) return;
  currentLightboxIndex = (currentLightboxIndex + direction + galleryImages.length) % galleryImages.length;
  openLightbox(currentLightboxIndex);
}

document.addEventListener('keydown', (e) => {
  const modal = document.getElementById('lightbox-modal');
  if (!modal || !modal.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowRight') navigateLightbox(1);
  if (e.key === 'ArrowLeft') navigateLightbox(-1);
});

// ==============================================================
// 5. CONFIRMAÇÃO DE PRESENÇA (RSVP)
// ==============================================================
function updateAttendanceChoice(isAttending) {
  const pillYes = document.getElementById('pill-attending-yes');
  const pillNo = document.getElementById('pill-attending-no');
  const detailsFields = document.getElementById('attending-details-fields');

  if (isAttending) {
    pillYes.classList.add('active');
    pillNo.classList.remove('active', 'declined');
    detailsFields.style.display = 'block';
  } else {
    pillNo.classList.add('active', 'declined');
    pillYes.classList.remove('active');
    detailsFields.style.display = 'none';
  }
}

function adjustCount(inputId, delta) {
  const input = document.getElementById(inputId);
  if (!input) return;
  let val = parseInt(input.value, 10) || 0;
  const min = parseInt(input.min, 10) || 0;
  const max = parseInt(input.max, 10) || 15;
  val = Math.max(min, Math.min(max, val + delta));
  input.value = val;
}

async function handleRsvpSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const btnSubmit = document.getElementById('btn-submit-rsvp');
  const textSpan = btnSubmit.querySelector('.btn-text');
  const loaderSpan = btnSubmit.querySelector('.btn-loader');

  const formData = new FormData(form);
  const attendingChoice = formData.get('attending') === 'yes';

  const payload = {
    name: formData.get('name'),
    attending: attendingChoice,
    adults: attendingChoice ? formData.get('adults') : 0,
    children: attendingChoice ? formData.get('children') : 0,
    companionNames: formData.get('companionNames') || '',
    message: formData.get('message') || ''
  };

  btnSubmit.disabled = true;
  textSpan.style.display = 'none';
  loaderSpan.style.display = 'inline';

  try {
    const res = await fetch('/api/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (res.ok) {
      triggerWelcomeConfetti();
      openSuccessModal(
        attendingChoice ? 'Presença Confirmada com Sucesso! 🌺' : 'Agradecemos o Aviso! ❤️',
        data.message || 'Sua confirmação foi registrada com sucesso!'
      );
      form.reset();
      updateAttendanceChoice(true);
    } else {
      alert(data.error || 'Erro ao registrar sua confirmação.');
    }
  } catch (err) {
    alert('Erro de conexão ao enviar. Tente novamente.');
  } finally {
    btnSubmit.disabled = false;
    textSpan.style.display = 'inline';
    loaderSpan.style.display = 'none';
  }
}

function openSuccessModal(title, msg) {
  document.getElementById('success-modal-title').textContent = title;
  document.getElementById('success-modal-message').textContent = msg;
  document.getElementById('success-modal').classList.add('open');
}

function closeSuccessModal() {
  document.getElementById('success-modal').classList.remove('open');
}

// ==============================================================
// 6. UTILITÁRIOS: CALENDÁRIO, WHATSAPP & QR CODE
// ==============================================================
function addToCalendar() {
  const title = encodeURIComponent('4º Aniversário da Micaella! 🌺🌊');
  const details = encodeURIComponent('Venha comemorar os 4 aninhos da Micaella em uma grande aventura tropical com piscina e sol! Endereço: Rua Ouro Velho, 116 - Jardim das Cerejeiras, Cotia - SP.');
  const location = encodeURIComponent('Rua Ouro Velho, 116 - Jardim das Cerejeiras, Cotia - SP, 06724-810');
  const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=20261219T130000Z/20261219T210000Z&details=${details}&location=${location}`;
  window.open(gcalUrl, '_blank');
}

function shareOnWhatsApp() {
  const text = encodeURIComponent(
    `🌺🌊 Olá! Dá uma olhada no convite do 4º Aniversário da Micaella! Venha comemorar com a gente nessa grande aventura tropical: ${window.location.href}`
  );
  window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
}

function initQrCode() {
  const canvas = document.getElementById('qr-code-canvas');
  const linkDisplay = document.getElementById('qr-link-display');
  const currentUrl = window.location.href;

  if (linkDisplay) linkDisplay.textContent = currentUrl;

  if (canvas && window.QRCode) {
    QRCode.toCanvas(canvas, currentUrl, {
      width: 200,
      margin: 1,
      color: { dark: '#06192e', light: '#ffffff' }
    }, (err) => {
      if (err) console.error(err);
    });
  }
}

function openQrModal() {
  initQrCode();
  document.getElementById('qr-modal').classList.add('open');
}

function closeQrModal(e) {
  if (e && e.target !== e.currentTarget && !e.target.classList.contains('modal-close-btn')) return;
  document.getElementById('qr-modal').classList.remove('open');
}

function copyInviteLink() {
  navigator.clipboard.writeText(window.location.href).then(() => {
    alert('Link copiado com sucesso! 📋');
  });
}

function triggerWelcomeConfetti() {
  if (typeof confetti !== 'function') return;

  const count = 200;
  const defaults = { origin: { y: 0.7 } };

  function fire(particleRatio, opts) {
    confetti(Object.assign({}, defaults, opts, {
      particleCount: Math.floor(count * particleRatio)
    }));
  }

  fire(0.25, { spread: 26, startVelocity: 55, colors: ['#ffd166', '#06d6a0', '#ff477e'] });
  fire(0.2, { spread: 60, colors: ['#ffd166', '#f8961e', '#ffffff'] });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, colors: ['#06d6a0', '#ffd166', '#33ccff'] });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
}

// Canvases
function initIntroCanvas() {
  const canvas = document.getElementById('intro-particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = [];
  const count = Math.min(70, Math.floor(width / 16));

  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.8 + 0.8,
      speedY: -(Math.random() * 0.8 + 0.2),
      speedX: (Math.random() - 0.5) * 0.5,
      alpha: Math.random() * 0.8 + 0.2,
      color: Math.random() > 0.4 ? '#ffd166' : '#06d6a0'
    });
  }

  function loop() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => {
      p.y += p.speedY;
      p.x += p.speedX;
      if (p.y < -10) { p.y = height + 10; p.x = Math.random() * width; }
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(loop);
  }
  loop();
}

function initAmbientCanvas() {
  const canvas = document.getElementById('ambient-particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const sparkles = [];
  for (let i = 0; i < 35; i++) {
    sparkles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2 + 1,
      vy: -(Math.random() * 0.4 + 0.1),
      vx: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.5 + 0.1
    });
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    sparkles.forEach(s => {
      s.y += s.vy;
      s.x += s.vx;
      if (s.y < 0) s.y = height;
      if (s.x < 0) s.x = width;
      if (s.x > width) s.x = 0;
      ctx.fillStyle = '#ffd166';
      ctx.globalAlpha = s.alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(animate);
  }
  animate();
}
