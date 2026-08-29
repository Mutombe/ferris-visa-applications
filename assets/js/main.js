/* Ferris Visa Consultants — site behaviour */
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
    uae: ['ae', 'Dubai and the UAE'],
    australia: ['au', 'Australia'],
    china: ['cn', 'China'],
    indonesia: ['id', 'Indonesia'],
    india: ['in', 'India'],
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

  /* ---------- hero carousel: image and copy advance together ---------- */
  var heroMedia = document.querySelector('[data-hero-media]');
  var heroCopy = document.querySelector('[data-hero-copy]');
  if (heroMedia && heroCopy) {
    var slides = heroMedia.querySelectorAll('.hero-slide');
    var copies = heroCopy.querySelectorAll('.hero-copy');
    var dots = document.querySelectorAll('.hero-dot');
    var count = slides.length;
    var index = 0;
    var timer = null;
    var DWELL = 6500;
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var show = function (next) {
      index = (next + count) % count;
      for (var i = 0; i < count; i++) {
        var on = i === index;
        slides[i].classList.toggle('is-active', on);
        copies[i].classList.toggle('is-active', on);
        if (on) copies[i].removeAttribute('aria-hidden');
        else copies[i].setAttribute('aria-hidden', 'true');
        if (dots[i]) {
          dots[i].classList.toggle('is-active', on);
          if (on) dots[i].setAttribute('aria-current', 'true');
          else dots[i].removeAttribute('aria-current');
        }
      }
    };

    var start = function () {
      if (reduced || count < 2) return;
      stop();
      timer = setInterval(function () { show(index + 1); }, DWELL);
    };
    var stop = function () { if (timer) { clearInterval(timer); timer = null; } };

    dots.forEach(function (d) {
      d.addEventListener('click', function () {
        show(parseInt(d.dataset.goto, 10));
        start(); // restart the dwell so a manual pick gets a full turn
      });
    });

    // don't animate a hero nobody is looking at
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { e.isIntersecting ? start() : stop(); });
      }, { threshold: 0.2 }).observe(heroMedia);
    } else {
      start();
    }
    document.addEventListener('visibilitychange', function () {
      document.hidden ? stop() : start();
    });
  }

  /* ---------- form handoff: compose the answers, then WhatsApp or email ----------
     There is no back end. The form is turned into a readable message and the
     sender chooses where it goes, so an enquiry is never silently lost. */
  var WHATSAPP_NUMBER = '442038900190';         // digits only, no + or spaces
  var ENQUIRY_EMAIL = 'hello@ferrisvisa.com';

  function labelFor(field, form) {
    if (field.id) {
      var l = form.querySelector('label[for="' + field.id + '"]');
      if (l) return l.textContent.trim();
    }
    var wrap = field.closest('.field');
    if (wrap) {
      var wl = wrap.querySelector('label');
      if (wl) return wl.textContent.trim();
    }
    return field.name;
  }

  function readableValue(field) {
    if (field.tagName === 'SELECT') {
      // an unchosen placeholder has a label but no value; treat it as blank
      // so the message does not read "Visa type: Select a type"
      if (!field.value) return '';
      var opt = field.options[field.selectedIndex];
      return opt ? opt.textContent.trim() : '';
    }
    return (field.value || '').trim();
  }

  function composeMessage(form) {
    var title = form.dataset.apply !== undefined
      ? 'New visa application enquiry'
      : 'New enquiry from the Ferris website';
    var lines = [title, ''];
    var notes = null;

    form.querySelectorAll('input, select, textarea').forEach(function (field) {
      if (!field.name || field.type === 'submit' || field.type === 'button') return;
      var val = readableValue(field);
      if (!val) return;
      if (field.tagName === 'TEXTAREA') { notes = { label: labelFor(field, form), val: val }; return; }
      lines.push(labelFor(field, form) + ': ' + val);
    });

    if (notes) { lines.push('', notes.label + ':', notes.val); }
    lines.push('', 'Sent from ' + window.location.host + window.location.pathname);
    return lines.join('\n');
  }

  document.querySelectorAll('form[data-handoff]').forEach(function (form) {
    var panel = form.querySelector('[data-handoff-panel]');
    var preview = form.querySelector('[data-handoff-preview]');
    var back = form.querySelector('[data-handoff-back]');
    var submit = form.querySelector('button[type="submit"]');
    if (!panel) return;
    var message = '';

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      message = composeMessage(form);
      if (preview) preview.textContent = message;
      panel.classList.add('is-shown');
      if (submit) submit.style.display = 'none';
      panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    if (back) {
      back.addEventListener('click', function () {
        panel.classList.remove('is-shown');
        if (submit) submit.style.display = '';
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    // The choices are real links, with the href written in when the panel
    // opens. A link survives popup blockers and is reachable by keyboard,
    // which window.open() is not.
    var waLink = panel.querySelector('[data-send="whatsapp"]');
    var mailLink = panel.querySelector('[data-send="email"]');

    function wireLinks() {
      if (!message) message = composeMessage(form);
      if (waLink) {
        waLink.href = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(message);
      }
      if (mailLink) {
        var subject = form.dataset.apply !== undefined
          ? 'Visa application enquiry' : 'Website enquiry';
        mailLink.href = 'mailto:' + ENQUIRY_EMAIL +
          '?subject=' + encodeURIComponent(subject) +
          '&body=' + encodeURIComponent(message);
      }
    }
    form.addEventListener('submit', wireLinks);
  });

  /* ---------- footer year ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
