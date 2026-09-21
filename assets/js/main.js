/* Tooth Care Centre - site interactions (vanilla JS, no dependencies) */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var CFG = window.TCC_CONFIG || {};
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var CLINIC = { tz: 'Asia/Kolkata', open: 10, close: 20 };

  /* ---------- Header, menus ---------- */
  var header = $('.site-header');
  function onScroll() { if (header) header.classList.toggle('scrolled', window.scrollY > 8); }
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

  var menuBtn = $('.menu-btn'), mnav = $('.mobile-nav');
  function setMenu(open) {
    if (!menuBtn || !mnav) return;
    mnav.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
    menuBtn.innerHTML = '<svg class="ic"><use href="#i-' + (open ? 'x' : 'menu') + '"/></svg>';
  }
  if (menuBtn) {
    menuBtn.addEventListener('click', function () { setMenu(!mnav.classList.contains('open')); });
    $$('a', mnav).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    window.addEventListener('resize', function () { if (window.innerWidth >= 1040) setMenu(false); });
  }
  $$('.dd > button').forEach(function (b) {
    b.addEventListener('click', function (e) { e.stopPropagation(); var dd = b.parentElement; var o = dd.classList.toggle('open'); b.setAttribute('aria-expanded', String(o)); });
  });
  document.addEventListener('click', function () { $$('.dd.open').forEach(function (d) { d.classList.remove('open'); }); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { setMenu(false); $$('.dd.open').forEach(function (d) { d.classList.remove('open'); }); }
  });

  /* ---------- Config: social, WhatsApp, year ---------- */
  $$('[data-social]').forEach(function (a) {
    var url = (CFG.social || {})[a.dataset.social];
    if (url) { a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    else { a.href = '#'; a.setAttribute('aria-disabled', 'true'); a.title = a.getAttribute('aria-label') + ' (link not added yet)'; a.addEventListener('click', function (e) { e.preventDefault(); }); }
  });
  var waHref = CFG.whatsappNumber ? 'https://wa.me/' + String(CFG.whatsappNumber).replace(/\D/g, '') + '?text=' + encodeURIComponent(CFG.whatsappMessage || '') : '';
  $$('[data-wa]').forEach(function (a) { if (waHref) { a.href = waHref; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.hidden = false; a.classList.add('on'); } });
  $$('[data-reviews]').forEach(function (a) { if (CFG.reviewsUrl) { a.href = CFG.reviewsUrl; a.target = '_blank'; a.rel = 'noopener noreferrer'; } });
  $$('[data-year]').forEach(function (n) { n.textContent = new Date().getFullYear(); });

  /* ---------- Open now (clinic time, Asia/Kolkata) ---------- */
  function clinicNow() {
    try {
      var p = new Intl.DateTimeFormat('en-GB', { timeZone: CLINIC.tz, weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
      var o = {}; p.forEach(function (x) { o[x.type] = x.value; });
      return { day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(o.weekday), h: parseInt(o.hour, 10) % 24, m: parseInt(o.minute, 10) };
    } catch (e) { var d = new Date(); return { day: d.getDay(), h: d.getHours(), m: d.getMinutes() }; }
  }
  var now = clinicNow();
  $$('[data-open-now]').forEach(function (el) {
    var open = now.day !== 0 && now.h >= CLINIC.open && now.h < CLINIC.close;
    el.classList.add(open ? 'yes' : 'no');
    el.textContent = now.day === 0 ? 'Sunday: by appointment' : (open ? 'Open now' : 'Closed now');
  });
  $$('.hours tr[data-day]').forEach(function (tr) { if (parseInt(tr.dataset.day, 10) === now.day) tr.classList.add('today'); });

  /* ---------- Hero: 3D tooth ---------- */
  var stage = $('#stage');
  if (stage) {
    var scene = null;
    try {
      if (window.ToothScene && window.THREE) {
        scene = window.ToothScene.init({
          container: stage.querySelector('.stage-canvas'),
          dots: $$('.marker', stage),
          onInteract: function () { stage.classList.add('touched'); }
        });
        if (scene) stage.classList.add('ready');
      }
    } catch (err) { scene = null; if (window.console) console.warn('3D tooth unavailable, showing illustration', err); }
    var caps = {
      enamel: ['Enamel', 'The hard outer shell of the crown. It is the hardest tissue in the body, yet acid from plaque and sugary drinks can slowly wear it down.'],
      gum: ['Gum line', 'Where the crown meets the gum. Plaque left here is the main cause of bleeding, swollen gums.'],
      roots: ['Roots', 'Roots anchor the tooth in the jawbone. A root canal cleans an infected root from the inside so the tooth can be saved.']
    };
    var tabs = $$('.stage-tabs .chip'), cap = $('.stage-caption');
    function pick(name) {
      tabs.forEach(function (t) { t.setAttribute('aria-pressed', String(t.dataset.anchor === name)); });
      $$('.marker', stage).forEach(function (m) { m.classList.toggle('on', m.dataset.anchor === name); });
      if (cap && caps[name]) cap.innerHTML = '<strong>' + caps[name][0] + '.</strong> ' + caps[name][1];
      if (scene) scene.focusOn(name);
    }
    tabs.forEach(function (t) { t.addEventListener('click', function () { pick(t.dataset.anchor); }); });
    if (tabs.length) pick('enamel');
  }

  /* ---------- Treatment finder ---------- */
  var finderData = $('#finder-data');
  if (finderData) {
    var items = JSON.parse(finderData.textContent), out = $('#finder-out'), chips = $$('#finder-chips .chip');
    var show = function (i) {
      var it = items[i];
      chips.forEach(function (c, n) { c.setAttribute('aria-pressed', String(n === i)); });
      out.innerHTML = '<h3></h3><p></p><div class="actions"><a class="btn btn-light btn-sm"></a><a class="link-arrow"></a></div><small>A guide only. A dentist has to examine you to diagnose.</small>';
      $('h3', out).textContent = it.title; $('p', out).textContent = it.text;
      var b = $('.btn', out); b.textContent = 'Book a check-up'; b.href = 'contact.html?service=' + it.book + '#book';
      var l = $('.link-arrow', out); l.href = it.url; l.innerHTML = 'Read about ' + it.name + ' <svg class="ic"><use href="#i-arrow"/></svg>';
    };
    chips.forEach(function (c, i) { c.addEventListener('click', function () { show(i); }); });
    show(0);
  }

  /* ---------- Testimonial carousel ---------- */
  var track = $('#track');
  if (track) {
    var qs = $$('.quote', track), dotsBox = $('#dots'), idx = 0, timer = null, paused = false;
    var step = function () { return qs.length > 1 ? qs[1].offsetLeft - qs[0].offsetLeft : track.clientWidth; };
    qs.forEach(function (_, i) {
      var b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', 'Go to review ' + (i + 1));
      b.addEventListener('click', function () { go(i); pause(); }); dotsBox.appendChild(b);
    });
    function mark() {
      idx = Math.max(0, Math.min(qs.length - 1, Math.round(track.scrollLeft / step())));
      $$('button', dotsBox).forEach(function (b, i) { b.setAttribute('aria-current', String(i === idx)); });
    }
    function go(i) { i = (i + qs.length) % qs.length; track.scrollTo({ left: i * step(), behavior: reduce ? 'auto' : 'smooth' }); }
    function pause() { paused = true; clearInterval(timer); }
    track.addEventListener('scroll', function () { window.requestAnimationFrame(mark); }, { passive: true });
    $('#prev').addEventListener('click', function () { go(idx - 1); pause(); });
    $('#next').addEventListener('click', function () { go(idx + 1); pause(); });
    ['pointerdown', 'focusin', 'mouseenter'].forEach(function (ev) { track.addEventListener(ev, pause); });
    if (!reduce) timer = setInterval(function () { if (!paused && !document.hidden) go(idx + 1); }, 7000);
    mark();
  }

  /* ---------- Before / after smile illustration ---------- */
  function smile(after) {
    var w = [46, 50, 54, 68, 68, 54, 50, 46], h = [84, 92, 100, 116, 116, 100, 92, 84], gap = 4;
    var total = w.reduce(function (a, b) { return a + b; }, 0) + gap * 7, x = (600 - total) / 2, teeth = '', tops = [];
    var id = after ? 'a' : 'b';
    for (var i = 0; i < 8; i++) {
      var cx = x + w[i] / 2, dy = 0.0009 * Math.pow(cx - 300, 2), bottom = 238 - dy, hh = h[i], ww = w[i], rot = 0, sx = 0, ex = 0;
      if (!after) {
        if (i === 3) sx = -7; if (i === 4) sx = 7; if (i === 2) hh -= 14; if (i === 5) { rot = 11; ex = 5; bottom += 6; } if (i === 6) hh += 6;
      }
      var top = bottom - hh, tcx = cx + sx + ex;
      tops.push([tcx, top]);
      teeth += '<g transform="rotate(' + rot + ' ' + tcx + ' ' + (top + hh / 2) + ')"><rect x="' + (tcx - ww / 2) + '" y="' + top + '" width="' + ww + '" height="' + hh + '" rx="' + (ww * 0.36) + '" fill="url(#t' + id + ')"/>' +
        '<ellipse cx="' + (tcx - ww * 0.16) + '" cy="' + (top + hh * 0.38) + '" rx="' + (ww * 0.12) + '" ry="' + (hh * 0.22) + '" fill="#fff" opacity="' + (after ? 0.55 : 0.18) + '"/></g>';
      x += w[i] + gap;
    }
    var gum = 'M0,0 V' + (tops[0][1] + 6);
    tops.forEach(function (t) { gum += ' L' + t[0] + ',' + (t[1] + 10); });
    gum += ' L600,' + (tops[7][1] + 6) + ' V0Z';
    var c1 = after ? '#FFFFFF' : '#DDC47E', c2 = after ? '#E9F1F0' : '#EFE1AE';
    return '<svg viewBox="0 0 600 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="t' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c2 + '"/><stop offset="0.5" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient></defs>' +
      '<rect width="600" height="300" fill="#3A181C"/>' + teeth + '<path d="' + gum + '" fill="#E5868D"/><path d="M0,300 V270 Q300 236 600 270 V300Z" fill="#C85F68"/></svg>';
  }
  var ba = $('#ba');
  if (ba) {
    ba.insertAdjacentHTML('afterbegin', '<div class="after">' + smile(true) + '</div><div class="before">' + smile(false) + '</div>');
    var range = $('input', ba);
    var set = function () { ba.style.setProperty('--pos', range.value + '%'); };
    range.addEventListener('input', set); set();
  }

  /* ---------- Gallery filter + lightbox ---------- */
  var gal = $('#gallery-grid');
  if (gal) {
    var gitems = $$('.g-item', gal), fchips = $$('[data-filter]');
    fchips.forEach(function (c) {
      c.addEventListener('click', function () {
        fchips.forEach(function (x) { x.setAttribute('aria-pressed', String(x === c)); });
        gitems.forEach(function (g) { g.hidden = !(c.dataset.filter === 'all' || g.dataset.cat === c.dataset.filter); });
      });
    });
    var lb = $('#lightbox'), lbImg = $('img', lb), lbCap = $('p', lb), cur = 0, vis = [];
    var render = function () { var g = vis[cur], im = $('img', g); lbImg.src = im.currentSrc || im.src; lbImg.alt = im.alt; lbCap.textContent = g.dataset.caption || im.alt; };
    gitems.forEach(function (g) {
      g.addEventListener('click', function () {
        vis = gitems.filter(function (x) { return !x.hidden; }); cur = vis.indexOf(g);
        render(); if (lb.showModal) lb.showModal(); else lb.setAttribute('open', '');
      });
    });
    var move = function (d) { cur = (cur + d + vis.length) % vis.length; render(); };
    $('.lb-prev', lb).addEventListener('click', function () { move(-1); });
    $('.lb-next', lb).addEventListener('click', function () { move(1); });
    $('.lb-close', lb).addEventListener('click', function () { lb.close(); });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('lb-inner')) lb.close(); });
    lb.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') move(-1); if (e.key === 'ArrowRight') move(1); });
  }

  /* ---------- Blog filter + search ---------- */
  var plist = $('#post-list');
  if (plist) {
    var cards = $$('.post-card', plist), cchips = $$('[data-cat-filter]'), q = $('#post-search'), empty = $('#post-empty'), catNow = 'all';
    var apply = function () {
      var term = (q.value || '').toLowerCase().trim(), n = 0;
      cards.forEach(function (c) {
        var ok = (catNow === 'all' || c.dataset.cat === catNow) && (!term || c.dataset.text.indexOf(term) > -1);
        c.hidden = !ok; if (ok) n++;
      });
      empty.hidden = n > 0;
    };
    cchips.forEach(function (c) { c.addEventListener('click', function () { catNow = c.dataset.catFilter; cchips.forEach(function (x) { x.setAttribute('aria-pressed', String(x === c)); }); apply(); }); });
    q.addEventListener('input', apply);
  }

  /* ---------- Reading progress ---------- */
  var prog = $('.progress');
  if (prog) window.addEventListener('scroll', function () {
    var h = document.documentElement; var p = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight);
    prog.style.width = Math.min(100, p * 100) + '%';
  }, { passive: true });

  /* ---------- Booking form ---------- */
  var form = $('#booking');
  if (form) {
    var dateEl = $('#b-date'), slotsBox = $('#slots'), sundayMsg = $('#sunday-msg'), slotVal = '', slotLabel = '';
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var iso = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
    var t = new Date(), max = new Date(); max.setDate(max.getDate() + 60);
    dateEl.min = iso(t); dateEl.max = iso(max);

    var groups = [['Morning', [10, 10.5, 11, 11.5]], ['Afternoon', [12, 12.5, 13, 13.5, 14, 14.5, 15, 15.5]], ['Evening', [16, 16.5, 17, 17.5, 18, 18.5, 19, 19.5]]];
    var lab = function (v) { var h = Math.floor(v), m = v % 1 ? '30' : '00', ap = h >= 12 ? 'pm' : 'am', hh = h > 12 ? h - 12 : h; return hh + ':' + m + ' ' + ap; };
    function buildSlots() {
      slotsBox.innerHTML = ''; slotVal = ''; slotLabel = '';
      var d = dateEl.value ? new Date(dateEl.value + 'T00:00:00') : null;
      var sunday = d && d.getDay() === 0;
      sundayMsg.hidden = !sunday; slotsBox.hidden = !d || sunday;
      var hint = $('#slot-hint'); if (hint) hint.hidden = !!d;
      if (!d || sunday) return;
      var nowC = clinicNow(), isToday = dateEl.value === iso(t), cutoff = nowC.h + nowC.m / 60 + 1;
      groups.forEach(function (g) {
        var box = document.createElement('div'); box.className = 'slot-group'; box.innerHTML = '<div class="label">' + g[0] + '</div><div class="slots"></div>';
        g[1].forEach(function (v) {
          var b = document.createElement('button'); b.type = 'button'; b.className = 'slot'; b.textContent = lab(v); b.setAttribute('aria-pressed', 'false');
          if (isToday && v < cutoff) b.disabled = true;
          b.addEventListener('click', function () {
            $$('.slot', slotsBox).forEach(function (x) { x.setAttribute('aria-pressed', 'false'); }); b.setAttribute('aria-pressed', 'true');
            slotVal = String(v); slotLabel = lab(v); $('#f-slot').classList.remove('invalid');
          });
          $('.slots', box).appendChild(b);
        });
        slotsBox.appendChild(box);
      });
    }
    dateEl.addEventListener('change', function () { $('#f-date').classList.remove('invalid'); buildSlots(); });

    var params = new URLSearchParams(location.search), pre = params.get('service');
    if (pre) { var opt = $('#b-service option[value="' + pre + '"]'); if (opt) $('#b-service').value = pre; }
    try { var saved = JSON.parse(localStorage.getItem('tcc_contact') || 'null'); if (saved) { $('#b-name').value = saved.name || ''; $('#b-phone').value = saved.phone || ''; } } catch (e) { /* storage blocked */ }

    var setBad = function (id, bad) { $('#' + id).classList.toggle('invalid', bad); return bad; };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if ($('#b-website').value) { showDone({ name: 'Guest', phone: '', delivered: true, fake: true }); return; }   // honeypot
      var name = $('#b-name').value.trim(), phone = $('#b-phone').value.replace(/[\s-]/g, ''), svc = $('#b-service').value, date = dateEl.value;
      var sunday = date && new Date(date + 'T00:00:00').getDay() === 0;
      var bad = [
        setBad('f-name', name.length < 2),
        setBad('f-phone', !/^(\+?91)?[6-9]\d{9}$/.test(phone)),
        setBad('f-service', !svc),
        setBad('f-date', !date),
        setBad('f-slot', !!date && !sunday && !slotVal)
      ];
      var firstBad = ['b-name', 'b-phone', 'b-service', 'b-date', 'slots'].filter(function (id, i) { return bad[i]; })[0];
      if (firstBad) { var el = $('#' + firstBad); (el.focus ? el : $('button', el)).focus(); return; }

      var d = new Date(date + 'T00:00:00');
      var payload = {
        name: name, phone: phone, service: svc, serviceLabel: $('#b-service').selectedOptions[0].textContent,
        date: date, dateLabel: d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
        slot: sunday ? 'Sunday (clinic will call to fix a time)' : slotVal, slotLabel: sunday ? 'To be confirmed by phone' : slotLabel,
        note: $('#b-note').value.trim(), pageUrl: location.href, createdAt: new Date().toISOString()
      };
      try { localStorage.setItem('tcc_contact', JSON.stringify({ name: name, phone: phone })); } catch (er) { /* ignore */ }
      var btn = $('button[type="submit"]', form); btn.disabled = true; btn.textContent = 'Sending request...';
      Promise.resolve(CFG.submitBooking ? CFG.submitBooking(payload) : { ok: true, delivered: false }).then(function (res) {
        btn.disabled = false; btn.textContent = 'Request appointment';
        if (res && res.ok === false) { $('#form-error').hidden = false; return; }
        $('#form-error').hidden = true; showDone(Object.assign({ delivered: !!(res && res.delivered) }, payload));
      });
    });

    function showDone(p) {
      var wrap = $('#booking-wrap'), waText = '';
      if (waHref) waText = waHref.split('?')[0] + '?text=' + encodeURIComponent('Hello Tooth Care Centre, I would like to book: ' + p.serviceLabel + ' on ' + p.dateLabel + ' (' + p.slotLabel + '). Name: ' + p.name + ', phone: ' + p.phone + '.');
      var msg = p.delivered
        ? '<p>We have your request and will call <strong>' + p.phone + '</strong> to confirm the time.</p>'
        : '<p><strong>Your request is not confirmed yet.</strong> Please call us on <a href="tel:+917509999033">075099 99033</a> so we can confirm your slot.</p>';
      wrap.innerHTML = '<div class="confirm" role="status"><div class="tick"><svg class="ic" style="width:30px;height:30px"><use href="#i-check"/></svg></div>' +
        '<h2 style="font-size:1.8rem">' + (p.delivered ? 'Request received' : 'One last step') + '</h2>' + msg +
        '<dl class="summary"><div><dt>Name</dt><dd></dd></div><div><dt>Treatment</dt><dd></dd></div><div><dt>Date</dt><dd></dd></div><div><dt>Time</dt><dd></dd></div></dl>' +
        '<div style="display:flex;flex-wrap:wrap;gap:.7rem"><a class="btn btn-primary" href="tel:+917509999033"><svg class="ic"><use href="#i-phone"/></svg> Call to confirm</a>' +
        (waText ? '<a class="btn btn-ghost" target="_blank" rel="noopener noreferrer" href="' + waText + '"><svg class="ic"><use href="#i-whatsapp"/></svg> Send on WhatsApp</a>' : '') +
        '<button class="btn btn-ghost" type="button" id="again">Make another request</button></div></div>';
      var dd = $$('dd', wrap); [p.name, p.serviceLabel || '', p.dateLabel || '', p.slotLabel || ''].forEach(function (v, i) { dd[i].textContent = v; });
      $('#again').addEventListener('click', function () { location.reload(); });
      wrap.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    }
  }
})();
