/* ═══════════════════════════════════════════════════
   MOTHER'S DAY CARD — SCRIPT
   ═══════════════════════════════════════════════════ */

'use strict';

const IS_MOBILE = window.innerWidth < 768;
const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ─────────────────────────────────────────
   1. SCROLL PROGRESS BAR
───────────────────────────────────────── */
(function initScrollProgress() {
  const bar = document.getElementById('scroll-progress');
  if (!bar || REDUCED_MOTION) return;

  let ticking = false;
  function update() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;
    bar.style.width = pct + '%';
    if (pct >= 99.5) {
      bar.classList.add('done');
    } else {
      bar.classList.remove('done');
    }
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
})();


/* ─────────────────────────────────────────
   2. ENHANCED SAKURA CANVAS
───────────────────────────────────────── */
(function initSakura() {
  const canvas = document.getElementById('sakura-canvas');
  if (!canvas || REDUCED_MOTION) return;
  const ctx = canvas.getContext('2d');

  const MAX_PETALS = IS_MOBILE ? 32 : 60;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  const PETAL_COLORS = [
    'hsl(345,70%,85%)', 'hsl(350,60%,88%)',
    'hsl(340,55%,90%)', 'hsl(355,65%,87%)',
    'hsl(10,50%,90%)',  'hsl(330,75%,93%)',
  ];

  // Wind gust state
  let windX = 0;
  let gustTarget = 0;
  let nextGust = 6000;
  let lastGustTime = 0;

  function createPetal(startAtTop) {
    const tier = Math.random(); // 0=far/small, 1=close/large
    const size = tier < 0.4 ? Math.random() * 4 + 2
               : tier < 0.75 ? Math.random() * 6 + 5
               : Math.random() * 9 + 9;
    const speed = size * 0.08 + 0.3;
    return {
      x: Math.random() * canvas.width,
      y: startAtTop ? -20 : Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: speed,
      size,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.05,
      opacity: tier < 0.4 ? Math.random() * 0.3 + 0.15
             : tier < 0.75 ? Math.random() * 0.4 + 0.3
             : Math.random() * 0.35 + 0.45,
      color: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: Math.random() * 0.03 + 0.008,
      swirl: Math.random() < 0.12, // occasionally spirals
      swirlAngle: 0,
    };
  }

  const petals = Array.from({ length: MAX_PETALS }, () => createPetal(false));

  function drawPetal(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.globalAlpha = p.opacity;

    // Petal shape: two bezier curves forming a teardrop/petal
    const s = p.size;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.bezierCurveTo( s * 0.8, -s * 0.5,  s * 0.9,  s * 0.4,  0,  s);
    ctx.bezierCurveTo(-s * 0.9,  s * 0.4, -s * 0.8, -s * 0.5,  0, -s);

    const grad = ctx.createRadialGradient(0, -s * 0.2, 0, 0, 0, s);
    grad.addColorStop(0, 'rgba(255,240,245,0.9)');
    grad.addColorStop(0.5, p.color);
    grad.addColorStop(1, 'rgba(220,140,160,0.4)');
    ctx.fillStyle = grad;
    ctx.fill();

    // Vein
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.8);
    ctx.lineTo(0, s * 0.7);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    ctx.restore();
  }

  let lastTime = 0;
  function animate(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 16.67, 3);
    lastTime = timestamp;

    // Wind gust logic
    if (timestamp - lastGustTime > nextGust) {
      lastGustTime = timestamp;
      nextGust = 7000 + Math.random() * 6000;
      gustTarget = (Math.random() - 0.5) * 3.5;
      setTimeout(() => { gustTarget = 0; }, 2000);
    }
    windX += (gustTarget - windX) * 0.02 * dt;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    petals.forEach(p => {
      p.wobble += p.wobbleSpeed * dt;
      if (p.swirl) {
        p.swirlAngle += 0.03 * dt;
        p.x += (Math.cos(p.swirlAngle) * 1.2 + windX + Math.sin(p.wobble) * 0.3) * dt;
      } else {
        p.x += (p.vx + windX + Math.sin(p.wobble) * 0.5) * dt;
      }
      p.y += p.vy * dt;
      p.rotation += p.rotSpeed * dt;

      if (p.y > canvas.height + 20 || p.x < -40 || p.x > canvas.width + 40) {
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
   3. HERO SPARKLE / FIREFLY CANVAS
───────────────────────────────────────── */
(function initSparkles() {
  const canvas = document.getElementById('sparkle-canvas');
  if (!canvas || REDUCED_MOTION) return;
  const ctx = canvas.getContext('2d');
  const hero = document.getElementById('hero');

  function resize() {
    canvas.width  = hero.offsetWidth;
    canvas.height = hero.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  const COUNT = IS_MOBILE ? 22 : 38;

  const SPARKLE_COLORS = [
    'rgba(232,192,128,', // gold
    'rgba(255,240,200,', // warm white
    'rgba(240,192,204,', // rose
    'rgba(255,255,220,', // pale yellow
  ];

  function createSparkle() {
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 3 + 1,
      opacity: 0,
      targetOpacity: Math.random() * 0.7 + 0.2,
      fadeSpeed: Math.random() * 0.008 + 0.003,
      fadeDir: 1,
      color: SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)],
      drift: { x: (Math.random() - 0.5) * 0.2, y: -Math.random() * 0.15 - 0.05 },
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleSpeed: Math.random() * 0.04 + 0.01,
    };
  }

  const sparkles = Array.from({ length: COUNT }, createSparkle);

  function drawStar(ctx, x, y, size, opacity, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = opacity;

    // 4-point star via diamond path
    const r1 = size * 2.4; // outer spike
    const r2 = size * 0.3; // inner notch
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4 - Math.PI / 2;
      const r = i % 2 === 0 ? r1 : r2;
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();

    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r1);
    grad.addColorStop(0, color + '1)');
    grad.addColorStop(0.4, color + '0.6)');
    grad.addColorStop(1, color + '0)');
    ctx.fillStyle = grad;
    ctx.fill();

    // Center glow
    ctx.globalAlpha = opacity * 0.9;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = color + '1)';
    ctx.fill();

    ctx.restore();
  }

  let lastTime = 0;
  function animate(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 16.67, 3);
    lastTime = timestamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    sparkles.forEach(s => {
      s.twinklePhase += s.twinkleSpeed * dt;
      const twinkle = (Math.sin(s.twinklePhase) + 1) * 0.5;
      s.opacity += s.fadeSpeed * s.fadeDir * dt;

      if (s.opacity >= s.targetOpacity) { s.fadeDir = -1; }
      if (s.opacity <= 0) {
        // respawn
        Object.assign(s, createSparkle());
        s.opacity = 0;
        return;
      }

      s.x += s.drift.x * dt;
      s.y += s.drift.y * dt;

      if (s.y < -10) { s.y = canvas.height + 10; }
      if (s.x < -10) { s.x = canvas.width + 10; }
      if (s.x > canvas.width + 10) { s.x = -10; }

      const displayOpacity = s.opacity * (0.5 + 0.5 * twinkle);
      drawStar(ctx, s.x, s.y, s.size, displayOpacity, s.color);
    });

    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
})();


/* ─────────────────────────────────────────
   4. HERO TYPEWRITER
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
      setTimeout(() => {
        cursor.style.transition = 'opacity 0.6s ease';
        cursor.style.opacity = '0';
        setTimeout(() => {
          cursor.remove();
          // Trigger shimmer after typewriter
          el.classList.add('shimmer');
        }, 700);
      }, 2000);
    }
  }

  setTimeout(type, DELAY_START);
})();


/* ─────────────────────────────────────────
   5. INTERSECTION OBSERVER — SECTION REVEALS
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

  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal-wrap').forEach(el => revealObs.observe(el));

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

  const closingObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        spawnCelebration();
        closingObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  const kanji = document.getElementById('closingKanji');
  if (kanji) closingObs.observe(kanji);

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
   6. TENNIS BALL ANIMATION
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
   7. CELEBRATION BURST (hearts + confetti)
───────────────────────────────────────── */
const CONFETTI_COLORS = [
  '#d4748a', '#e8a4b8', '#f0c0cc', '#c9923a',
  '#e8c080', '#f7e8ed', '#f4c8d0', '#a07888',
];

function spawnCelebration() {
  if (REDUCED_MOTION) return;

  if (navigator.vibrate) navigator.vibrate([15, 10, 15]);

  const container = document.getElementById('heartsContainer');
  if (!container) return;

  // Hearts
  const HEARTS = ['❤️','🩷','💕','🌸','✨','💗'];
  const heartCount = IS_MOBILE ? 16 : 28;
  for (let i = 0; i < heartCount; i++) {
    setTimeout(() => {
      const heart = document.createElement('span');
      heart.className = 'heart-particle';
      heart.textContent = HEARTS[Math.floor(Math.random() * HEARTS.length)];
      heart.style.cssText = `
        left: ${10 + Math.random() * 80}%;
        bottom: ${5 + Math.random() * 50}%;
        font-size: ${12 + Math.random() * 18}px;
        animation-delay: ${Math.random() * 0.4}s;
        animation-duration: ${2.5 + Math.random() * 2}s;
      `;
      container.appendChild(heart);
      setTimeout(() => heart.remove(), 5000);
    }, i * 60);
  }

  // Confetti
  const confettiCount = IS_MOBILE ? 30 : 50;
  for (let i = 0; i < confettiCount; i++) {
    setTimeout(() => {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      const spin = (Math.random() - 0.5) * 720;
      piece.style.cssText = `
        left: ${5 + Math.random() * 90}%;
        bottom: ${5 + Math.random() * 30}%;
        background: ${CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]};
        --confetti-spin: ${spin}deg;
        --confetti-dur: ${2 + Math.random() * 2}s;
        animation-delay: ${Math.random() * 0.5}s;
        width: ${4 + Math.random() * 7}px;
        height: ${4 + Math.random() * 7}px;
        border-radius: ${Math.random() > 0.5 ? '50%' : '1px'};
      `;
      container.appendChild(piece);
      setTimeout(() => piece.remove(), 4500);
    }, i * 30);
  }

  // Re-trigger on tap
  const section = document.getElementById('closing');
  if (section && !section._celebListener) {
    section._celebListener = true;
    section.addEventListener('click', () => spawnCelebration(), { passive: true });
  }
}


/* ─────────────────────────────────────────
   8. PHOTO LIGHTBOX
───────────────────────────────────────── */
(function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  const lbImg    = document.getElementById('lightbox-img');
  const lbClose  = lightbox && lightbox.querySelector('.lightbox-close');
  const backdrop = lightbox && lightbox.querySelector('.lightbox-backdrop');
  if (!lightbox || !lbImg) return;

  function openLightbox(src, alt) {
    lbImg.src = src;
    lbImg.alt = alt || '';
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => lightbox.classList.add('open'));
    });
    if (navigator.vibrate) navigator.vibrate(8);
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    if (navigator.vibrate) navigator.vibrate(5);
    setTimeout(() => {
      lightbox.hidden = true;
      lbImg.src = '';
      document.body.style.overflow = '';
    }, 350);
  }

  // Wire up all clickable photos
  document.querySelectorAll('.photo-img, .gallery-photo-wrap img').forEach(img => {
    img.addEventListener('click', (e) => {
      e.stopPropagation();
      if (img.naturalWidth === 0) return; // broken/missing image
      openLightbox(img.src, img.alt);
    }, { passive: true });
  });

  // Also wire gallery-photo-wrap itself (in case img doesn't catch)
  document.querySelectorAll('.gallery-photo-wrap').forEach(wrap => {
    wrap.addEventListener('click', () => {
      const img = wrap.querySelector('img');
      if (img && img.naturalWidth > 0) openLightbox(img.src, img.alt);
    }, { passive: true });
  });

  if (backdrop) backdrop.addEventListener('click', closeLightbox, { passive: true });
  if (lbClose) lbClose.addEventListener('click', closeLightbox, { passive: true });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !lightbox.hidden) closeLightbox();
  });

  // Swipe-down to close on mobile
  let touchStartY = 0;
  lightbox.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });
  lightbox.addEventListener('touchend', (e) => {
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (dy > 80) closeLightbox();
  }, { passive: true });
})();


/* ─────────────────────────────────────────
   9. 3D CARD TILT
───────────────────────────────────────── */
(function initCardTilt() {
  if (REDUCED_MOTION) return;

  const cards = document.querySelectorAll('.photo-card');

  if (!IS_MOBILE) {
    // Desktop: mouse-based tilt
    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) / (rect.width / 2);
        const dy = (e.clientY - cy) / (rect.height / 2);
        card.style.setProperty('--rx', `${-dy * 10}deg`);
        card.style.setProperty('--ry', `${dx * 10}deg`);
      }, { passive: true });

      card.addEventListener('mouseleave', () => {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      }, { passive: true });
    });
  } else {
    // Mobile: gyroscope tilt
    const handleOrientation = (e) => {
      const gamma = Math.max(-25, Math.min(25, e.gamma || 0)); // left-right
      const beta  = Math.max(-25, Math.min(25, (e.beta || 0) - 45)); // front-back
      const rx = (beta  / 25) * 8;
      const ry = (gamma / 25) * 8;
      cards.forEach(card => {
        card.style.setProperty('--rx', `${-rx}deg`);
        card.style.setProperty('--ry', `${ry}deg`);
      });
    };

    if (typeof DeviceOrientationEvent !== 'undefined') {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        // iOS 13+ requires permission — attach to first user interaction
        document.addEventListener('touchend', function askPerm() {
          DeviceOrientationEvent.requestPermission().then(state => {
            if (state === 'granted') {
              window.addEventListener('deviceorientation', handleOrientation, { passive: true });
            }
          }).catch(() => {});
          document.removeEventListener('touchend', askPerm);
        }, { passive: true, once: true });
      } else {
        window.addEventListener('deviceorientation', handleOrientation, { passive: true });
      }
    }
  }
})();


/* ─────────────────────────────────────────
   10. PHOTO PARALLAX (subtle, mobile-off)
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
   11. SECTION AMBIENT COLOR SHIFT
───────────────────────────────────────── */
(function initAmbientColor() {
  if (REDUCED_MOTION) return;

  const SECTION_HUES = {
    'hero':    '345',
    'family':  '340',
    'letter':  '310',
    'tennis':  '120',
    'chosen':  '220',
    'gallery': '330',
    'closing': '345',
  };

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const hue = SECTION_HUES[entry.target.id] || '345';
        document.body.style.setProperty('--ambient-hue', hue);
      }
    });
  }, { threshold: 0.4 });

  document.querySelectorAll('section[id]').forEach(s => obs.observe(s));
})();


/* ─────────────────────────────────────────
   12. GALLERY SWIPE DOTS (mobile)
───────────────────────────────────────── */
(function initGalleryDots() {
  if (!IS_MOBILE) return;

  const grid = document.querySelector('.gallery-grid');
  const dots = document.querySelectorAll('.gallery-dot');
  if (!grid || !dots.length) return;

  const cards = document.querySelectorAll('.gallery-card');

  grid.addEventListener('scroll', () => {
    const scrollLeft = grid.scrollLeft;
    const cardWidth  = grid.offsetWidth * 0.8 + 16; // 80vw + gap
    const idx = Math.round(scrollLeft / cardWidth);
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === idx);
    });
  }, { passive: true });

  // Dot click scrolls to card
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      const cardWidth = grid.offsetWidth * 0.8 + 16;
      grid.scrollTo({ left: i * cardWidth, behavior: 'smooth' });
    }, { passive: true });
  });
})();


/* ─────────────────────────────────────────
   13. ACCESSIBILITY — keyboard nav hint
───────────────────────────────────────── */
document.addEventListener('keydown', () => {
  document.body.classList.add('keyboard-nav');
}, { once: true });
