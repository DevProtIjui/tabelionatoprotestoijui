(function () {
  'use strict';

  var header = document.getElementById('siteHeader');
  var navToggle = document.getElementById('navToggle');
  var mainNav = document.getElementById('mainNav');
  var scrollProgress = document.getElementById('scrollProgress');
  var backToTop = document.getElementById('backToTop');
  var backToTopRing = document.getElementById('backToTopRing');
  var RING_CIRCUMFERENCE = 131.9;
  var yearEl = document.getElementById('year');
  var navLinks = document.querySelectorAll('.nav-link');
  var sections = document.querySelectorAll('main section[id]');

  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------- open <details> targeted by URL hash ---------------- */
  function openHashTargetDetails() {
    if (!location.hash) return;
    var target = document.querySelector(location.hash);
    if (target && target.tagName === 'DETAILS' && !target.open) {
      target.open = true;
      target.scrollIntoView({ block: 'start' });
    }
  }
  openHashTargetDetails();
  window.addEventListener('hashchange', openHashTargetDetails);

  /* ---------------- header on scroll + progress bar ---------------- */
  // Section offsets and document height are cached (read once, not per scroll
  // tick) so scrolling never forces a synchronous layout reflow.
  var sectionOffsets = [];
  var docHeight = 0;

  function measureLayout() {
    sectionOffsets = Array.prototype.map.call(sections, function (section) {
      return { id: section.id, top: section.offsetTop };
    });
    docHeight = document.documentElement.scrollHeight - window.innerHeight;
  }

  function updateActiveNav(scrollY) {
    var current = '';
    sectionOffsets.forEach(function (section) {
      if (scrollY >= section.top - 140) current = section.id;
    });
    navLinks.forEach(function (link) {
      var match = link.getAttribute('href') === '#' + current;
      link.classList.toggle('active-link', match);
    });
  }

  function onScroll() {
    var scrollY = window.scrollY || window.pageYOffset;

    if (header) header.classList.toggle('is-scrolled', scrollY > 40);
    if (backToTop) backToTop.classList.toggle('is-visible', scrollY > 600);

    var progress = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;
    if (scrollProgress) scrollProgress.style.width = progress + '%';
    if (backToTopRing) {
      backToTopRing.style.strokeDashoffset = RING_CIRCUMFERENCE * (1 - progress / 100);
    }

    updateActiveNav(scrollY);
  }

  var scrollTicking = false;
  function requestScrollUpdate() {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(function () {
      onScroll();
      scrollTicking = false;
    });
  }

  measureLayout();
  window.addEventListener('scroll', requestScrollUpdate, { passive: true });
  window.addEventListener('resize', measureLayout);
  // Re-measure once everything (web fonts, images) has settled, since font
  // swaps and late-loading media reflow the page after the initial measurement.
  window.addEventListener('load', function () {
    measureLayout();
    onScroll();
  });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      measureLayout();
      onScroll();
    });
  }
  onScroll();

  /* ---------------- mobile nav ---------------- */
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', function () {
      var open = mainNav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      navToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
      document.body.style.overflow = open ? 'hidden' : '';
    });

    navLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        mainNav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  /* ---------------- back to top ---------------- */
  if (backToTop) {
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------------- magnetic buttons ---------------- */
  // Subtle cursor-follow effect on primary buttons. Skipped for
  // touch devices (no real cursor) and prefers-reduced-motion.
  var allowMotion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (allowMotion && hasFinePointer) {
    var MAGNETIC_STRENGTH = 0.25;
    var MAGNETIC_MAX = 8;
    document.querySelectorAll('.btn').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var rect = btn.getBoundingClientRect();
        var relX = e.clientX - rect.left - rect.width / 2;
        var relY = e.clientY - rect.top - rect.height / 2;
        var mx = Math.max(-MAGNETIC_MAX, Math.min(MAGNETIC_MAX, relX * MAGNETIC_STRENGTH));
        var my = Math.max(-MAGNETIC_MAX, Math.min(MAGNETIC_MAX, relY * MAGNETIC_STRENGTH));
        btn.style.setProperty('--mx', mx.toFixed(1) + 'px');
        btn.style.setProperty('--my', my.toFixed(1) + 'px');
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.setProperty('--mx', '0px');
        btn.style.setProperty('--my', '0px');
      });
    });
  }

  /* ---------------- scroll reveal ---------------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;

        var siblings = el.parentElement ? el.parentElement.querySelectorAll(':scope > .reveal') : [el];
        var delayIndex = Array.prototype.indexOf.call(siblings, el);
        el.style.transitionDelay = Math.max(delayIndex, 0) * 90 + 'ms';

        el.classList.add('in-view');
        observer.unobserve(el);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in-view'); });
  }

  /* ---------------- lightbox gallery (images only; videos use native controls) ---------------- */
  var galleryItems = Array.prototype.slice.call(document.querySelectorAll('.gallery-item')).filter(function (el) {
    return !!el.querySelector('img');
  });
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightboxImg');
  var lightboxClose = document.getElementById('lightboxClose');
  var lightboxPrev = document.getElementById('lightboxPrev');
  var lightboxNext = document.getElementById('lightboxNext');
  var currentIndex = 0;
  var lastFocusedEl = null;

  function openLightbox(index) {
    if (!lightbox || !galleryItems.length) return;
    currentIndex = (index + galleryItems.length) % galleryItems.length;
    var img = galleryItems[currentIndex].querySelector('img');
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt || '';
    lastFocusedEl = document.activeElement;
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    lightboxClose.focus();
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.hidden = true;
    document.body.style.overflow = '';
    if (lastFocusedEl) lastFocusedEl.focus();
  }

  function showRelative(offset) {
    openLightbox(currentIndex + offset);
  }

  galleryItems.forEach(function (item, index) {
    item.addEventListener('click', function () { openLightbox(index); });
    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'button');
    item.setAttribute('aria-label', 'Ampliar imagem ' + (index + 1));
    item.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(index);
      }
    });
  });

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxPrev) lightboxPrev.addEventListener('click', function () { showRelative(-1); });
  if (lightboxNext) lightboxNext.addEventListener('click', function () { showRelative(1); });

  if (lightbox) {
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });
  }

  document.addEventListener('keydown', function (e) {
    if (!lightbox || lightbox.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showRelative(-1);
    if (e.key === 'ArrowRight') showRelative(1);
  });

  /* ---------------- gallery carousel ---------------- */
  var carouselTrack = document.getElementById('carouselTrack');
  var carouselPrev = document.getElementById('carouselPrev');
  var carouselNext = document.getElementById('carouselNext');
  var carouselDots = Array.prototype.slice.call(document.querySelectorAll('.carousel-dot'));
  var carouselSlides = Array.prototype.slice.call(document.querySelectorAll('.carousel-slide'));

  if (carouselTrack && carouselSlides.length) {
    function getActiveSlideIndex() {
      var trackCenter = carouselTrack.scrollLeft + carouselTrack.clientWidth / 2;
      var closest = 0;
      var closestDist = Infinity;
      carouselSlides.forEach(function (slide, i) {
        var center = slide.offsetLeft + slide.clientWidth / 2;
        var dist = Math.abs(center - trackCenter);
        if (dist < closestDist) { closestDist = dist; closest = i; }
      });
      return closest;
    }

    function setActiveDot(index) {
      carouselDots.forEach(function (dot, i) {
        var active = i === index;
        dot.classList.toggle('is-active', active);
        dot.setAttribute('aria-selected', active ? 'true' : 'false');
      });
    }

    function syncActiveVideo(index) {
      carouselSlides.forEach(function (slide, i) {
        var video = slide.querySelector('video');
        if (!video) return;
        if (i === index) {
          video.currentTime = 0;
          video.play().catch(function () {});
        } else {
          video.pause();
        }
      });
    }

    function scrollToSlide(index) {
      var slide = carouselSlides[index];
      if (slide) carouselTrack.scrollTo({ left: slide.offsetLeft, behavior: 'smooth' });
    }

    if (carouselPrev) carouselPrev.addEventListener('click', function () {
      var i = getActiveSlideIndex();
      scrollToSlide(i === 0 ? carouselSlides.length - 1 : i - 1);
    });
    if (carouselNext) carouselNext.addEventListener('click', function () {
      var i = getActiveSlideIndex();
      scrollToSlide(i === carouselSlides.length - 1 ? 0 : i + 1);
    });
    carouselDots.forEach(function (dot, i) {
      dot.addEventListener('click', function () { scrollToSlide(i); });
    });

    var carouselScrollTimeout;
    carouselTrack.addEventListener('scroll', function () {
      clearTimeout(carouselScrollTimeout);
      carouselScrollTimeout = setTimeout(function () {
        var index = getActiveSlideIndex();
        setActiveDot(index);
        syncActiveVideo(index);
      }, 100);
    }, { passive: true });
  }

  /* ---------------- cookie banner ---------------- */
  // Shown on every visit (not remembered across visits), as requested.
  var cookieBanner = document.getElementById('cookieBanner');
  var cookieAccept = document.getElementById('cookieAccept');
  if (cookieBanner && cookieAccept) {
    setTimeout(function () { cookieBanner.classList.add('is-visible'); }, 800);

    cookieAccept.addEventListener('click', function () {
      cookieBanner.classList.remove('is-visible');
    });
  }

})();
