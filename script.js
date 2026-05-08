/* ═══════════════════════════════════════════════════
   MOTHER'S DAY CARD — SCRIPT
   ═══════════════════════════════════════════════════ */

'use strict';

const IS_MOBILE = window.innerWidth < 768;
const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ─────────────────────────────────────────
   1. SAKURA CANVAS
───────────────────────────────────────── */
(function initSakura() {
  const canvas = document.getElementById('sakura-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const MAX_PETALS = IS_MOBILE ? 28 : 55;
  const petals = [];

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  const PETAL_COLORS = [
    'hsl(345,70%,85%)',
    'hsl(350,60%,88%)',
    'hsl(340,55%,90%)',
    'hsl(355,65%,87%)',
    'hsl(10,50%,90%)',
  ];

  function createPetal(startAtTop) {
    return {
      x: Math.random() * canvas.width,
      y: startAtTop ? -15 : Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.6,
      vy: Math.random() * 1.2 + 0.4,
      size: Math.random() * 7 + 3,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.04,
      opacity: Math.random() * 0.55 + 0.2,
      color: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: Math.random() * 0.025 + 0.008,
    };
  }

  for (let i = 0; i < MAX_PETALS; i++) {
    petals.push(createPetal(false));
  }

  function drawPetal(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.globalAlpha = p.opacity;
    ctx.fillStyle = p.color;

    ctx.beginPath();
    ctx.ellipse(0, 0, p.size, p.size * 0.48, 0, 0, Math.PI * 2);
    ctx.fill();

    // Subtle highlight
    ctx.beginPath();
    ctx.ellipse(-p.size * 0.2, -p.size * 0.1, p.size * 0.35, p.size * 0.18, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fill();

    ctx.restore();
  }

  let lastTime = 0;
  function animate(timestamp) {
    if (REDUCED_MOTION) return;

    const dt = Math.min((timestamp - lastTime) / 16.67, 3);
    lastTime = timestamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    petals.forEach(p => {
      p.wobble += p.wobbleSpeed * dt;
      p.x += (p.vx + Math.sin(p.wobble) * 0.4) * dt;
      p.y += p.vy * dt;
      p.rotation += p.rotSpeed * dt;

      if (p.y > canvas.height + 20 || p.x < -30 || p.x > canvas.width + 30) {
        Object.assign(p, createPetal(true));
        p.x = Math.random() * canvas.width;
      }

      drawPetal(p);
    });

    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
})();


/* ─────────────────────────────────────────
   2. HERO TYPEWRITER
───────────────────────────────────────── */
(function initTypewriter() {
  const el = document.getElementById('hero-title');
  if (!el) return;

  const TEXT = 'お母さんへ';
  const DELAY_START = 800;
  const CHAR_SPEED = 200;

  if (REDUCED_MOTION) {
    el.textContent = TEXT;
    return;
  }

  let i = 0;
  const cursor = document.createElement('span');
  cursor.className = 'cursor-char';
  el.appendChild(cursor);

  function type() {
    if (i < TEXT.length) {
      el.insertBefore(document.createTextNode(TEXT[i]), cursor);
      i++;
      setTimeout(type, CHAR_SPEED + Math.random() * 60);
    } else {
      // Blink for 2s then fade cursor
      setTimeout(() => {
        cursor.style.transition = 'opacity 0.6s ease';
        cursor.style.opacity = '0';
        setTimeout(() => cursor.remove(), 700);
      }, 2000);
    }
  }

  setTimeout(type, DELAY_START);
})();


/* ─────────────────────────────────────────
   3. INTERSECTION OBSERVER — SECTION REVEALS
───────────────────────────────────────── */
(function initReveal() {
  if (REDUCED_MOTION) {
    document.querySelectorAll(
      '.reveal-wrap, .letter-header, .letter-stanza p, .letter-signature, .closing-kanji'
    ).forEach(el => {
      el.classList.add('revealed');
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    return;
  }

  // General reveal elements
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal-wrap').forEach(el => revealObs.observe(el));

  // Letter header
  const letterHeaderObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        letterHeaderObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  const letterHeader = document.querySelector('.letter-header');
  if (letterHeader) letterHeaderObs.observe(letterHeader);

  // Letter stanza lines — stagger each <p> within a stanza
  const stanzaObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const lines = entry.target.querySelectorAll('p');
        lines.forEach((line, idx) => {
          setTimeout(() => line.classList.add('revealed'), idx * 140);
        });
        stanzaObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -20px 0px' });

  document.querySelectorAll('.letter-stanza').forEach(el => stanzaObs.observe(el));

  // Letter signature
  const sigObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        sigObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  const sig = document.querySelector('.letter-signature');
  if (sig) sigObs.observe(sig);

  // Closing kanji — triggers heart burst
  const closingObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        spawnHearts();
        closingObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  const kanji = document.getElementById('closingKanji');
  if (kanji) closingObs.observe(kanji);

  // Gallery cards — stagger
  const galleryObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const cards = document.querySelectorAll('.gallery-card');
        cards.forEach((card, idx) => {
          setTimeout(() => card.classList.add('revealed'), idx * 180);
        });
        galleryObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  const gallerySection = document.getElementById('gallery');
  if (gallerySection) galleryObs.observe(gallerySection);
})();


/* ─────────────────────────────────────────
   4. TENNIS BALL ANIMATION
───────────────────────────────────────── */
(function initTennisBall() {
  const ball = document.getElementById('tennisBall');
  if (!ball || REDUCED_MOTION) return;

  const section = document.getElementById('tennis');
  if (!section) return;

  let fired = false;
  const obs = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !fired) {
      fired = true;
      ball.classList.add('bouncing');
      obs.disconnect();
    }
  }, { threshold: 0.3 });

  obs.observe(section);
})();


/* ─────────────────────────────────────────
   5. HEART BURST (closing section)
───────────────────────────────────────── */
function spawnHearts() {
  if (REDUCED_MOTION) return;
  const container = document.getElementById('heartsContainer');
  if (!container) return;

  const HEARTS = ['❤️','🩷','💕','🌸','✨','💗'];
  const count = IS_MOBILE ? 16 : 28;

  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const heart = document.createElement('span');
      heart.className = 'heart-particle';
      heart.textContent = HEARTS[Math.floor(Math.random() * HEARTS.length)];
      heart.style.cssText = `
        left: ${15 + Math.random() * 70}%;
        bottom: ${10 + Math.random() * 40}%;
        font-size: ${12 + Math.random() * 16}px;
        animation-delay: ${Math.random() * 0.3}s;
        animation-duration: ${2.5 + Math.random() * 1.5}s;
      `;
      container.appendChild(heart);
      setTimeout(() => heart.remove(), 4500);
    }, i * 80);
  }

  // Re-trigger on tap/click for fun
  const section = document.getElementById('closing');
  if (section && !section._heartListener) {
    section._heartListener = true;
    section.addEventListener('click', () => {
      spawnHearts();
    }, { passive: true });
  }
}


/* ─────────────────────────────────────────
   6. PHOTO PARALLAX (subtle, mobile-off)
───────────────────────────────────────── */
(function initParallax() {
  if (IS_MOBILE || REDUCED_MOTION) return;

  const photos = document.querySelectorAll('.photo-img');
  let ticking = false;

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        photos.forEach(img => {
          const rect = img.closest('.photo-inner').getBoundingClientRect();
          const viewH = window.innerHeight;
          const progress = (viewH - rect.top) / (viewH + rect.height);
          const shift = (progress - 0.5) * 30;
          img.style.transform = `translateY(${shift}px) scale(1.08)`;
        });
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
})();


/* ─────────────────────────────────────────
   7. SMOOTH SECTION BACKGROUND TINTING
   (adds subtle colored glow as section enters viewport)
───────────────────────────────────────── */
(function initSectionGlow() {
  if (REDUCED_MOTION) return;

  const sections = document.querySelectorAll('section');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.transition = 'box-shadow 1s ease';
      }
    });
  }, { threshold: 0.1 });

  sections.forEach(s => obs.observe(s));
})();


/* ─────────────────────────────────────────
   8. ACCESSIBILITY — keyboard nav hint removal
───────────────────────────────────────── */
document.addEventListener('keydown', () => {
  document.body.classList.add('keyboard-nav');
}, { once: true });
