(function () {
  'use strict';

  var header = document.getElementById('siteHeader');
  var navToggle = document.getElementById('navToggle');
  var mainNav = document.getElementById('mainNav');
  var scrollProgress = document.getElementById('scrollProgress');
  var backToTop = document.getElementById('backToTop');
  var yearEl = document.getElementById('year');
  var navLinks = document.querySelectorAll('.nav-link');
  var sections = document.querySelectorAll('main section[id]');

  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------- header on scroll + progress bar ---------------- */
  function onScroll() {
    var scrollY = window.scrollY || window.pageYOffset;

    if (header) header.classList.toggle('is-scrolled', scrollY > 40);
    if (backToTop) backToTop.classList.toggle('is-visible', scrollY > 600);

    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    var progress = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;
    if (scrollProgress) scrollProgress.style.width = progress + '%';

    updateActiveNav(scrollY);
  }

  function updateActiveNav(scrollY) {
    var current = '';
    sections.forEach(function (section) {
      var top = section.offsetTop - 140;
      if (scrollY >= top) current = section.id;
    });
    navLinks.forEach(function (link) {
      var match = link.getAttribute('href') === '#' + current;
      link.classList.toggle('active-link', match);
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
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

    function scrollToSlide(index) {
      var slide = carouselSlides[index];
      if (slide) carouselTrack.scrollTo({ left: slide.offsetLeft, behavior: 'smooth' });
    }

    if (carouselPrev) carouselPrev.addEventListener('click', function () {
      scrollToSlide(Math.max(getActiveSlideIndex() - 1, 0));
    });
    if (carouselNext) carouselNext.addEventListener('click', function () {
      scrollToSlide(Math.min(getActiveSlideIndex() + 1, carouselSlides.length - 1));
    });
    carouselDots.forEach(function (dot, i) {
      dot.addEventListener('click', function () { scrollToSlide(i); });
    });

    var carouselScrollTimeout;
    carouselTrack.addEventListener('scroll', function () {
      clearTimeout(carouselScrollTimeout);
      carouselScrollTimeout = setTimeout(function () {
        setActiveDot(getActiveSlideIndex());
      }, 100);
    }, { passive: true });
  }

})();
