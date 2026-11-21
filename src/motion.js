(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;

  if (!gsap || reducedMotion) return;

  if (ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  // 1. Top Scroll Progress Hairline
  if (ScrollTrigger) {
    gsap.to('.scroll-progress', {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: document.body,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.2
      }
    });
  }

  // 2. Hero Awwwards Masked Entrance Choreography
  const heroTl = gsap.timeline({ defaults: { ease: 'power4.out' } });

  heroTl
    .from('.nav-anim', {
      y: -18,
      opacity: 0,
      duration: 0.7,
      stagger: 0.06,
      clearProps: 'transform,opacity'
    })
    .from(
      '.reveal-line',
      {
        yPercent: 115,
        opacity: 0,
        duration: 1.05,
        stagger: 0.12,
        clearProps: 'transform,opacity'
      },
      '-=0.45'
    )
    .from(
      '.hero-cta',
      {
        y: 26,
        opacity: 0,
        duration: 0.75,
        stagger: 0.1,
        clearProps: 'transform,opacity'
      },
      '-=0.65'
    )
    .from(
      '.hero-art-frame',
      {
        scale: 0.94,
        y: 28,
        opacity: 0,
        duration: 1.1,
        ease: 'power3.out',
        clearProps: 'transform,opacity'
      },
      '-=0.85'
    )
    .from(
      '.hero-art-img',
      {
        scale: 1.12,
        duration: 1.35,
        ease: 'power3.out',
        clearProps: 'transform'
      },
      '<'
    );

  // 3. Continuous Idle Animations (Living Solar Canvas)
  gsap.to('.ambient-orb-1', {
    x: 48,
    y: 34,
    scale: 1.08,
    duration: 9,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  });

  gsap.to('.ambient-orb-2', {
    x: -54,
    y: -36,
    scale: 1.12,
    duration: 11,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  });

  gsap.to('.ambient-orb-3', {
    x: 36,
    y: -28,
    scale: 1.06,
    duration: 10,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  });

  // Subtle idle breathing on hero art frame & section cards
  gsap.to('.hero-art-float', {
    y: -7,
    duration: 3.8,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  });

  const idleCardTweens = [];
  document.querySelectorAll('.idle-float').forEach((el, idx) => {
    const tween = gsap.to(el, {
      y: idx % 2 === 0 ? -5 : 5,
      duration: 3.4 + idx * 0.55,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
    idleCardTweens.push({ el, tween });
  });

  // Infinite GSAP Marquee Ticker
  const marqueeTrack = document.querySelector('.marquee-track');
  if (marqueeTrack) {
    const marqueeTween = gsap.to(marqueeTrack, {
      xPercent: -50,
      duration: 24,
      ease: 'none',
      repeat: -1
    });
    marqueeTrack.addEventListener('pointerenter', () => {
      gsap.to(marqueeTween, { timeScale: 0.25, duration: 0.4 });
    });
    marqueeTrack.addEventListener('pointerleave', () => {
      gsap.to(marqueeTween, { timeScale: 1, duration: 0.4 });
    });
  }

  // 4. ScrollTrigger Choreography for Sections & Bento Cards
  if (ScrollTrigger) {
    document.querySelectorAll('.scroll-heading').forEach((heading) => {
      gsap.from(heading, {
        y: 34,
        opacity: 0,
        duration: 0.85,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
        scrollTrigger: {
          trigger: heading,
          start: 'top 88%',
          once: true
        }
      });
    });

    gsap.from('.bento-card', {
      y: 44,
      scale: 0.96,
      opacity: 0,
      duration: 0.85,
      stagger: 0.12,
      ease: 'power4.out',
      clearProps: 'transform,opacity',
      scrollTrigger: {
        trigger: '#motion',
        start: 'top 82%',
        once: true
      }
    });

    gsap.from('.scroll-reveal', {
      y: 38,
      opacity: 0,
      duration: 0.9,
      ease: 'power3.out',
      clearProps: 'transform,opacity',
      scrollTrigger: {
        trigger: '#activity',
        start: 'top 86%',
        once: true
      }
    });

    gsap.from('.arcade-reveal', {
      y: 40,
      opacity: 0,
      duration: 0.9,
      ease: 'power3.out',
      clearProps: 'transform,opacity',
      scrollTrigger: {
        trigger: '#arcade',
        start: 'top 86%',
        once: true
      }
    });

    // Subtle scroll-linked parallax on hero artwork
    gsap.to('.hero-art-img', {
      yPercent: 7,
      ease: 'none',
      scrollTrigger: {
        trigger: '#bio',
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    });
  }

  // 5. Magnetic Buttons (Awwwards Interactive Feel)
  document.querySelectorAll('.magnetic-btn').forEach((btn) => {
    const xTo = gsap.quickTo(btn, 'x', { duration: 0.35, ease: 'power3.out' });
    const yTo = gsap.quickTo(btn, 'y', { duration: 0.35, ease: 'power3.out' });

    btn.addEventListener('pointermove', (e) => {
      const rect = btn.getBoundingClientRect();
      const relX = (e.clientX - rect.left - rect.width / 2) * 0.22;
      const relY = (e.clientY - rect.top - rect.height / 2) * 0.22;
      xTo(relX);
      yTo(relY);
    });

    btn.addEventListener('pointerleave', () => {
      gsap.to(btn, {
        x: 0,
        y: 0,
        duration: 0.6,
        ease: 'elastic.out(1, 0.45)'
      });
    });
  });

  // 6. Smooth 3D Tilt on Cards & Hero Frame
  document.querySelectorAll('.tilt-card').forEach((card) => {
    const rxTo = gsap.quickTo(card, 'rotationX', { duration: 0.4, ease: 'power3.out' });
    const ryTo = gsap.quickTo(card, 'rotationY', { duration: 0.4, ease: 'power3.out' });
    const matchedIdle = idleCardTweens.find((item) => item.el === card);

    card.addEventListener('pointerenter', () => {
      if (matchedIdle) matchedIdle.tween.pause();
    });

    card.addEventListener('pointermove', (e) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      rxTo(-py * 6);
      ryTo(px * 6);
    });

    card.addEventListener('pointerleave', () => {
      rxTo(0);
      ryTo(0);
      if (matchedIdle) matchedIdle.tween.resume();
    });
  });
})();
