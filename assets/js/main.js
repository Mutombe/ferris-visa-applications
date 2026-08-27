/* Ferris Visa Applications — site behaviour */
(function () {
  'use strict';

  /* ---------- sticky nav state ---------- */
  var nav = document.querySelector('.nav');
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle('is-stuck', window.scrollY > 40);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- mobile menu ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links && nav) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('is-open');
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        links.classList.remove('is-open');
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- reveal on scroll ---------- */
  var revealables = document.querySelectorAll('.reveal');
  if (revealables.length) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      revealables.forEach(function (el) { io.observe(el); });
    } else {
      revealables.forEach(function (el) { el.classList.add('is-in'); });
    }
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq-item').forEach(function (item) {
    var q = item.querySelector('.faq-q');
    var a = item.querySelector('.faq-a');
    if (!q || !a) return;
    q.addEventListener('click', function () {
      var isOpen = item.classList.contains('is-open');
      item.parentElement.querySelectorAll('.faq-item.is-open').forEach(function (other) {
        other.classList.remove('is-open');
        other.querySelector('.faq-a').style.maxHeight = null;
        other.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('is-open');
        a.style.maxHeight = a.scrollHeight + 'px';
        q.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ---------- counters in the trust strip ---------- */
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length && 'IntersectionObserver' in window) {
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        cio.unobserve(el);
        var target = parseFloat(el.dataset.count);
        var suffix = el.dataset.suffix || '';
        if (reduced) { el.textContent = format(target) + suffix; return; }
        var start = performance.now();
        var dur = 1500;
        var tick = function (now) {
          var p = Math.min((now - start) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = format(target * eased) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  function format(n) {
    if (n >= 1000) return Math.round(n).toLocaleString('en-US');
    return n % 1 === 0 ? String(Math.round(n)) : n.toFixed(1);
  }

  /* ---------- forms (front-end only, no back end wired up) ---------- */
  document.querySelectorAll('form[data-demo]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var ok = form.querySelector('.form-ok');
      if (ok) {
        ok.classList.add('is-shown');
        ok.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      form.reset();
    });
  });

  /* ---------- hero eligibility finder ---------- */
  var finder = document.querySelector('[data-finder]');
  if (finder) {
    finder.addEventListener('submit', function (e) {
      e.preventDefault();
      var dest = finder.querySelector('[name="destination"]');
      var type = finder.querySelector('[name="visaType"]');
      var params = new URLSearchParams();
      if (dest && dest.value) params.set('destination', dest.value);
      if (type && type.value) params.set('type', type.value);
      window.location.href = 'apply.html' + (params.toString() ? '?' + params : '');
    });
  }

  /* ---------- prefill the application form from the query string ---------- */
  var applyForm = document.querySelector('[data-apply]');
  if (applyForm) {
    var qs = new URLSearchParams(window.location.search);
    ['destination', 'type'].forEach(function (key) {
      var val = qs.get(key);
      if (!val) return;
      var field = applyForm.querySelector('[name="' + key + '"]');
      if (!field) return;
      var match = Array.prototype.find.call(field.options || [], function (o) { return o.value === val; });
      if (match) field.value = val;
    });
  }

  /* ---------- live flag preview on the destination selects ----------
     Native <option> cannot hold an image, so the flag is rendered
     alongside the select and swapped as the value changes. */
  var FLAG_BY_VALUE = {
    uk: ['gb', 'United Kingdom'],
    schengen: ['eu', 'the Schengen Area'],
    usa: ['us', 'the United States'],
    canada: ['ca', 'Canada'],
    uae: ['ae', 'the United Arab Emirates'],
    australia: ['au', 'Australia'],
    china: ['cn', 'China'],
    japan: ['jp', 'Japan']
  };

  document.querySelectorAll('[data-flag-select]').forEach(function (select) {
    var key = select.dataset.flagSelect;
    var target = document.querySelector('[data-flag-target="' + key + '"]');
    if (!target) return;
    var fallback = target.innerHTML;
    var onDark = target.classList.contains('finder-ic');

    var render = function () {
      var entry = FLAG_BY_VALUE[select.value];
      if (!entry) { target.innerHTML = fallback; return; }
      var frame = document.createElement('span');
      frame.className = 'flag-frame';
      var img = document.createElement('img');
      img.className = 'flag';
      img.src = 'assets/flags/4x3/' + entry[0] + '.svg';
      img.alt = '';
      img.width = 40; img.height = 30; img.decoding = 'async';
      frame.appendChild(img);
      target.innerHTML = '';
      target.appendChild(frame);
      if (!onDark) {
        var label = document.createElement('span');
        label.textContent = 'Applying for ' + entry[1];
        target.appendChild(label);
      }
    };

    select.addEventListener('change', render);
    render(); // honour a value restored by the browser or the query string
  });

  /* ---------- legal page: highlight the section you are reading ---------- */
  var toc = document.querySelector('.legal-toc');
  if (toc && 'IntersectionObserver' in window) {
    var tocLinks = {};
    toc.querySelectorAll('a[href^="#"]').forEach(function (a) {
      tocLinks[a.getAttribute('href').slice(1)] = a;
    });
    var sections = document.querySelectorAll('.legal-body section[id]');
    var visible = new Set();
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) visible.add(e.target.id); else visible.delete(e.target.id);
      });
      var first = null;
      sections.forEach(function (s) { if (!first && visible.has(s.id)) first = s.id; });
      Object.keys(tocLinks).forEach(function (id) {
        tocLinks[id].classList.toggle('is-current', id === first);
      });
    }, { rootMargin: '-120px 0px -55% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- footer year ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
