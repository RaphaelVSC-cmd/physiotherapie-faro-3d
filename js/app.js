// ═══════════════════════════════════════════════════════════════════════════
// PHYSIOTHERAPIE FARO - Main Interaction, Lenis, GSAP & UI Logic
// ═══════════════════════════════════════════════════════════════════════════

import { initAllThreeScenes } from './three-scenes.js';

gsap.registerPlugin(ScrollTrigger);
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Boot 3D WebGL Engine
initAllThreeScenes();

// ─── SMOOTH SCROLL (Lenis, Touchpad-Safe) ─────────────────────────────────
let lenis = null;
if (typeof Lenis !== 'undefined' && !prefersReducedMotion) {
  lenis = new Lenis({
    duration: 0.9,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1.0,
    touchMultiplier: 1.4,
    syncTouch: false,
    autoResize: true,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

// Smooth Anchor Navigation
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (e) => {
    const id = anchor.getAttribute('href');
    if (!id || id === '#' || id.startsWith('#modal-')) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    if (lenis) {
      lenis.scrollTo(target, { offset: -88, duration: 0.95 });
    } else {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ─── THEME TOGGLE (Light Editorial Default / Deep Clinical Dark) ───────────
const themeToggle = document.getElementById('themeToggle');
const savedTheme = localStorage.getItem('faro-theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);

function updateThemeIcons(theme) {
  const sun = document.getElementById('icon-sun');
  const moon = document.getElementById('icon-moon');
  if (sun && moon) {
    sun.classList.toggle('hidden', theme === 'light');
    moon.classList.toggle('hidden', theme === 'dark');
  }
}
updateThemeIcons(savedTheme);

themeToggle?.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('faro-theme', next);
  updateThemeIcons(next);
});

// ─── NAVBAR SCROLL STATE & ACTIVE PILL TRACKING ──────────────────────────
const mainNav = document.getElementById('mainNav');
ScrollTrigger.create({
  start: 'top -56',
  onUpdate: (self) => mainNav?.classList.toggle('scrolled', self.progress > 0),
});

const navLinks = Array.from(document.querySelectorAll('.nav-pill-center a'));
['leistungen', 'explorer', 'praxis', 'kontakt'].forEach((secId) => {
  const sec = document.getElementById(secId);
  if (!sec) return;
  ScrollTrigger.create({
    trigger: sec,
    start: 'top 45%',
    end: 'bottom 45%',
    onEnter: () => setActiveNav(secId),
    onEnterBack: () => setActiveNav(secId),
  });
});
function setActiveNav(id) {
  navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${id}`));
}

// ─── MOBILE HAMBURGER (Single X-Mechanism) ────────────────────────────────
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

function openMenu() {
  hamburger?.classList.add('open');
  hamburger?.setAttribute('aria-expanded', 'true');
  mobileMenu?.classList.add('open');
  mobileMenu?.removeAttribute('aria-hidden');
  document.body.style.overflow = 'hidden';
}
function closeMenu() {
  hamburger?.classList.remove('open');
  hamburger?.setAttribute('aria-expanded', 'false');
  mobileMenu?.classList.remove('open');
  mobileMenu?.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}
hamburger?.addEventListener('click', () => {
  mobileMenu?.classList.contains('open') ? closeMenu() : openMenu();
});
mobileMenu?.addEventListener('click', (e) => {
  if (e.target === mobileMenu) closeMenu();
});
mobileMenu?.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMenu));

// ─── KINETIC TEXT & SCROLL REVEAL ─────────────────────────────────────────
if (!prefersReducedMotion) {
  if (typeof SplitType !== 'undefined') {
    const heroTitle = new SplitType('.hero-title', { types: 'words,chars' });
    if (heroTitle.chars) {
      gsap.from(heroTitle.chars, {
        opacity: 0,
        y: 36,
        stagger: 0.014,
        duration: 0.72,
        ease: 'power3.out',
        delay: 0.15,
      });
    }
  }

  gsap.from('.hero-stagger', {
    opacity: 0,
    y: 26,
    stagger: 0.09,
    duration: 0.75,
    ease: 'power3.out',
    delay: 0.3,
  });

  gsap.utils.toArray('[data-reveal]').forEach((el) => {
    gsap.from(el, {
      y: 22,
      duration: 0.75,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 96%',
        toggleActions: 'play none none none',
      },
    });
  });
}

// ─── TREATMENT CARD CLICK -> SYNC TO 3D EXPLORER ──────────────────────────
document.querySelectorAll('.treatment-card[data-jump-zone]').forEach((card) => {
  card.addEventListener('click', () => {
    const zone = card.dataset.jumpZone;
    window.__faroExplorer?.selectZone(zone);
    const explorer = document.getElementById('explorer');
    if (explorer) {
      if (lenis) lenis.scrollTo(explorer, { offset: -80, duration: 0.9 });
      else explorer.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// ─── THERAPY PATHWAY & INTERACTIVE ASSESSMENT CALCULATOR ──────────────────
const goalButtons = document.querySelectorAll('.goal-chip');
const intensityInput = document.getElementById('painRange');
const intensityVal = document.getElementById('painVal');
const insuranceButtons = document.querySelectorAll('.insurance-chip');
const calcTitle = document.getElementById('calc-rec-title');
const calcNote = document.getElementById('calc-rec-note');

const GOAL_MAP = {
  ruecken: {
    title: 'Manuelle Therapie & Krankengymnastik',
    note: 'Fokus auf segmentale Mobilisation der Wirbelsäule und gezielten Aufbau der tiefen Rumpfmuskulatur.',
  },
  kiefer: {
    title: 'Kiefergelenktherapie (CMD)',
    note: 'Präzise Entlastung von Kiefergelenk, Kaumuskulatur und oberer Halswirbelsäule, abgestimmt auf zahnärztliche Befunde.',
  },
  sport: {
    title: 'Postoperative Sportrehabilitation',
    note: 'Strukturierter Kraft- und Belastungsaufbau nach Operationen oder Sportverletzungen inklusive Beweglichkeitskontrolle.',
  },
  lymphe: {
    title: 'Manuelle Lymphdrainage & Faszientherapie',
    note: 'Sanfte Entstauungstherapie nach Eingriffen oder bei Schwellungen, kombiniert mit faszialer Gewebelösung.',
  },
};

let currentGoal = 'ruecken';
let currentInsurance = 'gesetzlich';

function updateRecommendation() {
  const g = GOAL_MAP[currentGoal] || GOAL_MAP.ruecken;
  const level = Number(intensityInput?.value || 5);
  if (intensityVal) intensityVal.textContent = `${level} / 10`;
  if (calcTitle) calcTitle.textContent = g.title;

  const urgency =
    level >= 7
      ? 'Bei starker Einschränkung empfehlen wir eine direkte telefonische Terminabstimmung unter +49 89 18914161.'
      : 'Ideal für einen planbaren Therapiebeginn mit ausführlichem Erstbefund in der Nymphenburger Str. 20a.';
  const insText =
    currentInsurance === 'privat'
      ? 'Geeignet für Privatpatienten und Selbstzahler.'
      : 'Für alle gesetzlichen Krankenkassen mit ärztlicher Verordnung.';

  if (calcNote) calcNote.textContent = `${g.note} ${insText} ${urgency}`;
}

goalButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    currentGoal = btn.dataset.goal;
    goalButtons.forEach((b) => {
      const active = b.dataset.goal === currentGoal;
      b.classList.toggle('bg-[#0b231c]', active);
      b.classList.toggle('text-white', active);
      b.classList.toggle('border-[#0b231c]', active);
    });
    updateRecommendation();
  });
});

insuranceButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    currentInsurance = btn.dataset.ins;
    insuranceButtons.forEach((b) => {
      const active = b.dataset.ins === currentInsurance;
      b.classList.toggle('bg-[#0b231c]', active);
      b.classList.toggle('text-white', active);
    });
    updateRecommendation();
  });
});

intensityInput?.addEventListener('input', updateRecommendation);
updateRecommendation();

// ─── FAQ ACCORDION ────────────────────────────────────────────────────────
const faqItems = Array.from(document.querySelectorAll('.faq-item'));
faqItems.forEach((item, idx) => {
  const trigger = item.querySelector('.faq-trigger');
  trigger?.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    faqItems.forEach((el) => {
      el.classList.remove('open');
      el.querySelector('.faq-trigger')?.setAttribute('aria-expanded', 'false');
    });
    if (!isOpen) {
      item.classList.add('open');
      trigger.setAttribute('aria-expanded', 'true');
    }
  });
  trigger?.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      faqItems[(idx + 1) % faqItems.length].querySelector('.faq-trigger')?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      faqItems[(idx - 1 + faqItems.length) % faqItems.length].querySelector('.faq-trigger')?.focus();
    }
  });
});

// ─── APPOINTMENT REQUEST FORM (Interactive Client Confirmation) ────────────
const bookingForm = document.getElementById('bookingForm');
const formStatus = document.getElementById('formStatus');
bookingForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = bookingForm.querySelector('[name="name"]')?.value.trim();
  const phone = bookingForm.querySelector('[name="phone"]')?.value.trim();
  if (!name || !phone) return;
  if (formStatus) {
    formStatus.textContent = `Vielen Dank, ${name}. Ihre unverbindliche Terminanfrage wurde vorbereitet. Für die direkte Terminvergabe erreichen Sie uns telefonisch unter +49 89 18914161.`;
    formStatus.classList.remove('hidden');
  }
});

// ─── TWO-CLICK MAPS CONSENT ───────────────────────────────────────────────
const loadMapBtn = document.getElementById('loadMapBtn');
const mapIframe = document.getElementById('gmapsIframe');
const mapPlaceholder = document.getElementById('mapPlaceholder');
loadMapBtn?.addEventListener('click', () => {
  if (mapIframe && mapIframe.dataset.src) {
    mapIframe.src = mapIframe.dataset.src;
    mapIframe.classList.remove('hidden');
    mapPlaceholder?.classList.add('hidden');
  }
});

// ─── LEGAL MODALS (Impressum & Datenschutz) ───────────────────────────────
function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add('open');
  modal.removeAttribute('aria-hidden');
  document.body.style.overflow = 'hidden';
}
function closeAllModals() {
  document.querySelectorAll('.legal-modal.open').forEach((m) => {
    m.classList.remove('open');
    m.setAttribute('aria-hidden', 'true');
  });
  document.body.style.overflow = '';
}

document.querySelectorAll('[data-open-modal]').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    openModal(btn.dataset.openModal);
  });
});
document.querySelectorAll('[data-close-modal]').forEach((btn) => {
  btn.addEventListener('click', closeAllModals);
});
document.querySelectorAll('.legal-modal').forEach((modal) => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeAllModals();
  });
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeMenu();
    closeAllModals();
  }
});
