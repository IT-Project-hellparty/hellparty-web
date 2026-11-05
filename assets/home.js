(function () {
  'use strict';

  var ua = navigator.userAgent || '';
  // iPadOS reports itself as a Mac; the touch points tell them apart.
  var isIOS = /iPhone|iPad|iPod/.test(ua) ||
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  var isAndroid = /Android/.test(ua);

  // One button for the visitor's own store when we can tell; both on desktop.
  document.querySelectorAll('.store').forEach(function (button) {
    var store = button.getAttribute('data-store');
    if (isIOS && store === 'android') button.hidden = true;
    if (isAndroid && store === 'ios') button.hidden = true;
    if ((isIOS && store === 'ios') || (isAndroid && store === 'android')) {
      button.classList.remove('alt');
      button.classList.add('pri');
    }
  });
})();

(function () {
  'use strict';

  var section = document.getElementById('day');
  var pin = document.getElementById('day-pin');
  if (!section || !pin) return;
  var slots = pin.querySelectorAll('.day-slot');
  var visuals = pin.querySelectorAll('.dv');
  var dots = pin.querySelectorAll('.day-dots button');
  var clock = document.getElementById('day-clock');
  var sun = document.getElementById('day-sun');

  // Minutes after midnight for each slot, in the same order as the markup.
  var TIMES = [450, 600, 760, 1140, 1230, 1320];
  var DAY_START = 360;
  var DAY_END = 1440;
  var n = TIMES.length;
  var current = -1;
  var ticking = false;

  function pad(v) { return (v < 10 ? '0' : '') + v; }

  function phaseOf(minutes) {
    if (minutes < 630) return 'morning';
    if (minutes < 1020) return 'noon';
    if (minutes < 1260) return 'evening';
    return 'night';
  }

  function scrollable() { return section.offsetHeight - pin.offsetHeight; }
  // offsetTop of a stuck element moves with the scroll, so read the sticky offset instead.
  function stick() { return parseFloat(getComputedStyle(pin).top) || 0; }

  function progress() {
    var top = section.getBoundingClientRect().top - stick();
    return Math.min(1, Math.max(0, -top / Math.max(1, scrollable())));
  }

  function show(index) {
    if (index === current) return;
    current = index;
    slots.forEach(function (el, i) { el.classList.toggle('is-on', i === index); });
    visuals.forEach(function (el, i) { el.classList.toggle('is-on', i === index); });
    dots.forEach(function (el, i) {
      el.classList.toggle('is-on', i === index);
      el.setAttribute('aria-current', i === index ? 'true' : 'false');
    });
  }

  function update() {
    ticking = false;
    var p = progress() * n;
    var index = Math.min(n - 1, Math.floor(p));
    // Hold each slot's time for the first half of its stretch, then let the
    // clock run on to the next slot's time so the switch lands on it.
    var minutes = TIMES[index];
    if (index < n - 1) {
      var run = Math.max(0, (p - index - 0.55) / 0.45);
      minutes += (TIMES[index + 1] - TIMES[index]) * run;
    }
    minutes = Math.round(minutes / 10) * 10;
    clock.textContent = pad(Math.floor(minutes / 60) % 24) + ':' + pad(minutes % 60);
    sun.style.left = ((minutes - DAY_START) / (DAY_END - DAY_START) * 100) + '%';
    pin.setAttribute('data-phase', phaseOf(minutes));
    show(index);
  }

  function request() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  dots.forEach(function (dot, i) {
    dot.addEventListener('click', function () {
      var target = window.scrollY + section.getBoundingClientRect().top - stick() +
        scrollable() * (i + 0.2) / n;
      window.scrollTo({ top: target, behavior: 'smooth' });
    });
  });

  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  update();
})();

(function () {
  'use strict';

  var fig = document.getElementById('closet-fig');
  var rails = document.getElementById('closet-rails');
  if (!fig || !rails) return;
  var sum = document.getElementById('closet-sum');

  // Bottom to top, the app's stacking order. Body and eyebrows are always worn.
  var ORDER = ['body', 'hair', 'shoes', 'bottom', 'top', 'acs', 'eyebrow'];
  // Names and prices as the shop sells them (migrations 000043, 000051).
  var CATALOG = [
    { slot: 'hair', title: '헤어', items: [
      ['default_hair', '기본 헤어', 0], ['hair1', '헤어 01', 150], ['hair2', '헤어 02', 150], ['hair3', '헤어 03', 150],
      ['hair4', '헤어 04', 150], ['hair5', '헤어 05', 150], ['hair6', '헤어 06', 150], ['hair7', '헤어 07', 150],
      ['hair8', '헤어 08', 150], ['hair9', '헤어 09', 150], ['hair10', '헤어 10', 150], ['hair11', '헤어 11', 150]] },
    { slot: 'top', title: '상의', items: [
      ['default_top', '기본 상의', 0], ['hoodie1', '후드티', 300], ['top1', '바람막이', 300], ['top2', '니트 가디건', 300],
      ['top3', '샴브레이 셔츠', 300], ['top4', '데님 셔츠', 300], ['top5', '화이트 셔츠', 300]] },
    { slot: 'bottom', title: '하의', items: [
      ['default_bottom', '기본 하의', 0], ['jeans1', '청바지', 250], ['bottom1', '베이지 와이드 팬츠', 250], ['bottom2', '흑청 와이드 진', 250]] },
    { slot: 'shoes', title: '신발', items: [
      ['default_shoes', '기본 신발', 0], ['sneakers1', '운동화', 200]] },
    { slot: 'acs', title: '액세서리', items: [
      [null, '없음', 0], ['acs1', '안경', 120], ['acs2', '반지', 100], ['acs3', '귀걸이', 100], ['acs4', '손목 밴드', 80],
      ['acs5', '손목시계', 150], ['acs6', '헤드폰', 120], ['acs7', '목걸이', 120], ['acs8', '유선 이어폰', 100]] }
  ];
  var DEFAULTS = { hair: 'default_hair', top: 'default_top', bottom: 'default_bottom', shoes: 'default_shoes', acs: null };

  var state = { gender: 'm', body: 'normal', pick: copy(DEFAULTS) };
  var layers = {};

  function copy(o) { var r = {}; for (var k in o) r[k] = o[k]; return r; }
  function dir() { return 'assets/img/closet/' + state.gender + '_' + state.body + '/'; }
  function itemOf(slot, key) {
    var group = CATALOG.filter(function (g) { return g.slot === slot; })[0];
    return group.items.filter(function (it) { return it[0] === key; })[0];
  }

  ORDER.forEach(function (slot, i) {
    var img = document.createElement('img');
    img.alt = '';
    img.style.zIndex = String(i + 1);
    img.hidden = true;
    fig.appendChild(img);
    layers[slot] = img;
  });

  function keyFor(slot) {
    if (slot === 'body') return 'body';
    if (slot === 'eyebrow') return 'default_eyebrow';
    return state.pick[slot];
  }

  // Swap only after the new file has loaded, so a layer never blinks empty.
  function paint() {
    ORDER.forEach(function (slot) {
      var key = keyFor(slot);
      var img = layers[slot];
      if (!key) { img.hidden = true; img.removeAttribute('data-src'); return; }
      var src = dir() + key + '.webp';
      if (img.getAttribute('data-src') === src) return;
      img.setAttribute('data-src', src);
      var next = new Image();
      next.onload = function () {
        if (img.getAttribute('data-src') !== src) return;
        img.src = src;
        img.hidden = false;
      };
      next.src = src;
    });

    var total = 0;
    var names = [];
    CATALOG.forEach(function (g) {
      var it = itemOf(g.slot, state.pick[g.slot]);
      if (it && it[2]) { total += it[2]; names.push(it[1]); }
    });
    sum.textContent = '';
    if (!names.length) {
      sum.textContent = '기본 옷 · 0 코인';
    } else {
      var b = document.createElement('b');
      b.textContent = total.toLocaleString('ko-KR') + ' 코인';
      sum.appendChild(document.createTextNode(names.join(', ') + ' · '));
      sum.appendChild(b);
    }

    rails.querySelectorAll('.chip').forEach(function (chip) {
      var slot = chip.getAttribute('data-slot');
      var key = chip.getAttribute('data-key') || null;
      chip.setAttribute('aria-pressed', state.pick[slot] === key ? 'true' : 'false');
      var thumb = chip.querySelector('img');
      if (thumb) thumb.src = 'assets/img/closet/thumb/' + key + '_' + state.gender + '.webp';
    });
  }

  CATALOG.forEach(function (group) {
    var rail = document.createElement('section');
    rail.className = 'rail';
    var h = document.createElement('h3');
    h.textContent = group.title + ' ';
    var count = document.createElement('small');
    count.textContent = group.items.filter(function (it) { return it[2]; }).length + '개 판매 중';
    h.appendChild(count);
    var box = document.createElement('div');
    box.className = 'chips';
    group.items.forEach(function (it) {
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      chip.setAttribute('data-slot', group.slot);
      if (it[0]) chip.setAttribute('data-key', it[0]);
      if (it[0]) {
        var thumb = document.createElement('img');
        thumb.alt = '';
        thumb.width = 177;
        thumb.height = 177;
        thumb.loading = 'lazy';
        chip.appendChild(thumb);
      } else {
        var none = document.createElement('span');
        none.className = 'none';
        none.textContent = '안 씀';
        chip.appendChild(none);
      }
      var name = document.createElement('span');
      name.textContent = it[1];
      var price = document.createElement('em');
      price.textContent = it[2] ? it[2] + ' 코인' : '기본';
      chip.appendChild(name);
      chip.appendChild(price);
      chip.addEventListener('click', function () {
        state.pick[group.slot] = it[0];
        paint();
      });
      box.appendChild(chip);
    });
    rail.appendChild(h);
    rail.appendChild(box);
    rails.appendChild(rail);
  });

  document.querySelectorAll('[data-gender]').forEach(function (button) {
    button.addEventListener('click', function () {
      state.gender = button.getAttribute('data-gender');
      document.querySelectorAll('[data-gender]').forEach(function (b) {
        b.setAttribute('aria-pressed', b === button ? 'true' : 'false');
      });
      paint();
    });
  });
  document.querySelectorAll('[data-body]').forEach(function (button) {
    button.addEventListener('click', function () {
      state.body = button.getAttribute('data-body');
      document.querySelectorAll('[data-body]').forEach(function (b) {
        b.setAttribute('aria-pressed', b === button ? 'true' : 'false');
      });
      paint();
    });
  });
  document.getElementById('closet-reset').addEventListener('click', function () {
    state.pick = copy(DEFAULTS);
    paint();
  });
  document.getElementById('closet-rand').addEventListener('click', function () {
    CATALOG.forEach(function (g) {
      var sold = g.items.filter(function (it) { return it[2]; });
      state.pick[g.slot] = sold[Math.floor(Math.random() * sold.length)][0];
    });
    paint();
  });

  paint();
})();

(function () {
  'use strict';

  var battle = document.getElementById('battle');
  var monster = document.getElementById('monster');
  var img = document.getElementById('monster-img');
  var nameEl = document.getElementById('battle-name');
  var hpBar = document.getElementById('hp');
  var hpFill = document.getElementById('hp-fill');
  var msg = document.getElementById('battle-msg');
  var retry = document.getElementById('battle-retry');

  var LV1 = { name: '1단계 지방', idle: 'assets/img/fat_lv1.webp', hit: 'assets/img/fat_lv1_hit.webp' };
  var LV2 = { name: '2단계 지방', idle: 'assets/img/fat_lv2.webp', hit: 'assets/img/fat_lv2_hit.webp' };
  var MAX_HP = 100;
  var CHEERS = ['좋아요!', '조금만 더!', '지방이 녹고 있어요', '거의 다 왔어요!'];
  var LV2_LINES = ['어라, 꿈쩍도 안 해요', '말랑해서 다 튕겨내요...', '지방이 화가 났어요!'];

  // Swapping src on the first hit would flash an empty frame while it loads.
  [LV1.hit, LV2.idle, LV2.hit].forEach(function (src) { new Image().src = src; });

  var hp, state, hitTimer, hits, level, lv2Limit;

  function setHp(value) {
    hp = Math.max(0, value);
    hpFill.style.width = (hp / MAX_HP * 100) + '%';
    hpBar.setAttribute('aria-valuenow', String(Math.round(hp)));
  }

  function replay(className) {
    monster.classList.remove('is-hit', 'is-dead', 'is-appear', 'is-nudge', 'is-attack');
    // Reading layout restarts the animation when the same class is added again.
    void monster.offsetWidth;
    monster.classList.add(className);
  }

  function showDamage(amount, crit, event) {
    var label = document.createElement('span');
    label.className = crit ? 'damage is-crit' : 'damage';
    label.textContent = crit ? '-' + amount + ' CRIT' : '-' + amount;
    var box = battle.getBoundingClientRect();
    if (event && event.clientX) {
      label.style.left = (event.clientX - box.left) + 'px';
      label.style.top = (event.clientY - box.top - 20) + 'px';
    }
    battle.appendChild(label);
    setTimeout(function () { label.remove(); }, 800);
  }

  function setMessage(text, tone) {
    msg.textContent = text;
    msg.classList.toggle('is-win', tone === 'win');
    msg.classList.toggle('is-lose', tone === 'lose');
  }

  function start() {
    state = 'fight';
    level = LV1;
    hits = 0;
    nameEl.textContent = LV1.name;
    img.src = LV1.idle;
    setHp(MAX_HP);
    battle.classList.remove('is-lost');
    monster.setAttribute('aria-label', '지방 몬스터 때리기');
    setMessage('눌러서 공격!');
    retry.hidden = true;
    replay('is-appear');
  }

  function hit(event) {
    hits += 1;
    var crit = Math.random() < 0.2;
    var amount = level === LV1
      ? Math.round((14 + Math.random() * 10) * (crit ? 2 : 1))
      : Math.round((2 + Math.random() * 3) * (crit ? 2 : 1));
    setHp(hp - amount);
    showDamage(amount, crit, event);
    if (navigator.vibrate) navigator.vibrate(crit ? 40 : 15);

    clearTimeout(hitTimer);
    img.src = level.hit;

    if (level === LV1 && hp <= 0) {
      state = 'busy';
      setMessage(hits + '번 만에 1단계 지방 처치!', 'win');
      replay('is-dead');
      setTimeout(showLv2, 900);
      return;
    }
    replay('is-hit');
    if (level === LV1) {
      setMessage(CHEERS[Math.min(hits - 1, CHEERS.length - 1)]);
    } else {
      setMessage(LV2_LINES[Math.min(hits - 1, LV2_LINES.length - 1)]);
    }
    hitTimer = setTimeout(function () {
      img.src = level.idle;
      if (level === LV2 && hits >= lv2Limit) {
        state = 'busy';
        setTimeout(counterAttack, 250);
      }
    }, 260);
  }

  function showLv2() {
    state = 'fight';
    level = LV2;
    hits = 0;
    lv2Limit = 3 + Math.floor(Math.random() * 3);
    nameEl.textContent = LV2.name;
    img.src = LV2.idle;
    setHp(MAX_HP);
    monster.setAttribute('aria-label', '2단계 지방 몬스터 때리기');
    setMessage('2단계 지방이 나타났어요! 계속 공격!');
    replay('is-appear');
  }

  function counterAttack() {
    replay('is-attack');
    if (navigator.vibrate) navigator.vibrate([60, 40, 120]);
    setTimeout(function () {
      state = 'lost';
      battle.classList.add('is-lost');
      monster.setAttribute('aria-label', '2단계 지방 몬스터');
      setMessage('2단계 지방한테 졌어요! 물리치려면 앱에서 만나요', 'lose');
      retry.hidden = false;
    }, 450);
  }

  monster.addEventListener('click', function (event) {
    if (state === 'fight') {
      hit(event);
    } else if (state === 'lost') {
      replay('is-nudge');
    }
  });
  retry.addEventListener('click', start);

  start();
})();

(function () {
  'use strict';

  var dresser = document.getElementById('dresser');
  var caption = document.getElementById('dress-caption');
  var slider = document.getElementById('body-slider');
  var thumb = document.getElementById('bs-thumb');
  var labels = slider.querySelectorAll('[data-stop]');
  var toast = document.getElementById('body-toast');

  // Bottom to top, the same stacking order the app uses (hair under the
  // clothes, shoes over the bottom, eyebrows last). The body sits under everything.
  var SLOTS = ['body', 'hair', 'shoes', 'bottom', 'top', 'acs', 'eyebrow'];
  var BASIC = { body: 'body', shoes: 'default_shoes', bottom: 'default_bottom', top: 'default_top',
    eyebrow: 'default_eyebrow', hair: 'default_hair' };
  // Each character alternates rounds; its two looks get mixed per slot.
  var CHARACTERS = [
    {
      dir: 'assets/img/dress/m/',
      looks: [
        { body: 'body', shoes: 'sneakers1', bottom: 'bottom1', top: 'top1', eyebrow: 'default_eyebrow', hair: 'hair9', acs: 'acs1' },
        { body: 'body', shoes: 'sneakers1', bottom: 'jeans1', top: 'hoodie1', eyebrow: 'default_eyebrow', hair: 'hair4', acs: 'acs7' }
      ]
    },
    {
      dir: 'assets/img/dress/f/',
      looks: [
        { body: 'body', shoes: 'sneakers1', bottom: 'bottom2', top: 'top2', eyebrow: 'default_eyebrow', hair: 'hair3', acs: 'acs5' },
        { body: 'body', shoes: 'sneakers1', bottom: 'jeans1', top: 'hoodie1', eyebrow: 'default_eyebrow', hair: 'hair1', acs: 'acs3' }
      ]
    }
  ];

  // Slider stops, top to bottom. A new character starts at normal (stat sum
  // 400), so only normal and chubby have art here; the rest point to the app.
  var STOPS = [
    { label: '근육' },
    { label: '마름' },
    { label: '보통', body: 'normal' },
    { label: '통통', body: 'chubby' },
    { label: '뚱뚱' }
  ];

  var STEP_GAP = 360;
  var HOLD = 2600;

  var body = 'normal';
  var stop = 2;
  var current = {};
  var layers = {};

  function srcOf(character, outfit) {
    var out = {};
    SLOTS.forEach(function (slot) {
      out[slot] = outfit[slot] ? character.dir + body + '/' + outfit[slot] + '.webp' : null;
    });
    return out;
  }

  // Slots that may also come up bare (nothing worn) or in the default piece,
  // for more variety. Body and eyebrows always stay.
  var OPEN_SLOTS = ['shoes', 'bottom', 'top', 'hair', 'acs'];

  // Each open slot takes either look's piece, the default piece or nothing.
  // Rerolled until it differs from this character's last round and still
  // wears at least two shop items, so it reads as dressing up.
  function mixLook(character) {
    var mix, same, shopItems;
    do {
      mix = { body: 'body', eyebrow: 'default_eyebrow' };
      same = !!character.last;
      shopItems = 0;
      OPEN_SLOTS.forEach(function (slot) {
        var options = character.looks.map(function (look) { return look[slot]; })
          .concat([BASIC[slot] || null, null]);
        mix[slot] = options[Math.floor(Math.random() * options.length)];
        if (mix[slot] && mix[slot] !== BASIC[slot]) shopItems += 1;
        if (character.last && character.last[slot] !== mix[slot]) same = false;
      });
    } while (same || shopItems < 2);
    character.last = mix;
    return mix;
  }

  function swap(slot, src) {
    if (current[slot] === src) return;
    current[slot] = src;
    var old = layers[slot];
    if (old) {
      old.classList.add('is-leaving');
      setTimeout(function () { old.remove(); }, 320);
    }
    layers[slot] = null;
    if (!src) return;
    var img = document.createElement('img');
    img.className = 'dress-layer';
    img.alt = '';
    img.src = src;
    img.style.zIndex = String(SLOTS.indexOf(slot) + 1);
    dresser.appendChild(img);
    layers[slot] = img;
    if (slot === 'body') {
      shown = src.indexOf('/dress/f/') >= 0 ? 'f' : 'm';
      renderBumps(false);
    }
  }

  // Dressing goes bottom up, one piece at a time. A character switch swaps every
  // layer at once, so one character's hair never shows on the other's body.
  var DRESS_ORDER = [['body'], ['hair'], ['shoes'], ['bottom'], ['top'], ['acs'], ['eyebrow']];
  var SWITCH_ORDER = [SLOTS];

  // Outfits are resolved when each step runs, so a body change mid-round
  // applies to the pieces still to come.
  function wear(character, outfit, label, order, done) {
    caption.textContent = label;
    var delay = 0;
    order.forEach(function (group) {
      var target = srcOf(character, outfit);
      var changed = group.filter(function (slot) { return current[slot] !== target[slot]; });
      if (!changed.length) return;
      setTimeout(function () {
        var now = srcOf(character, outfit);
        changed.forEach(function (slot) { swap(slot, now[slot]); });
        if (changed.indexOf('hair') >= 0) renderBumps(false);
      }, delay);
      delay += STEP_GAP;
    });
    setTimeout(done, delay + HOLD);
  }

  // Characters start in the default outfit, as in the app, then dress up.
  var round = 0;
  var stage = 0;

  function loop() {
    var character = CHARACTERS[round % CHARACTERS.length];
    var next = function () {
      stage = (stage + 1) % 2;
      if (stage === 0) round += 1;
      loop();
    };
    if (stage === 0) wear(character, BASIC, '처음엔 기본 옷으로 시작해요', SWITCH_ORDER, next);
    if (stage === 1) wear(character, mixLook(character), '상점 아이템으로 꾸며요', DRESS_ORDER, next);
  }

  function replay(el, className) {
    el.classList.remove(className);
    // Reading layout restarts the animation when the same class is added again.
    void el.offsetWidth;
    el.classList.add(className);
  }

  // --- Body slider ---

  function setBody(next) {
    if (next === body) return;
    var from = '/' + body + '/';
    var to = '/' + next + '/';
    body = next;
    SLOTS.forEach(function (slot) {
      if (!current[slot]) return;
      current[slot] = current[slot].replace(from, to);
      if (layers[slot]) layers[slot].src = current[slot];
    });
    replay(dresser, 'is-reshape');
    renderBumps(false);
    if (next === 'chubby') {
      showToast('인증을 안 하면 통통해져요', '꾸준히 인증해서 보통을 지켜요', true);
    } else {
      showToast('인증하면 다시 보통으로!', '몸이 한결 가벼워졌어요', true);
    }
  }

  function placeThumb(fraction) {
    thumb.style.top = (fraction * 100) + '%';
  }

  function markCurrent() {
    labels.forEach(function (li) {
      li.classList.toggle('is-current', Number(li.getAttribute('data-stop')) === stop);
    });
    slider.setAttribute('aria-valuenow', String(stop));
    slider.setAttribute('aria-valuetext', STOPS[stop].label);
  }

  var toastTimer;
  function showToast(title, detail, quiet) {
    toast.textContent = '';
    var strong = document.createElement('strong');
    strong.textContent = title;
    var small = document.createElement('span');
    small.textContent = detail;
    toast.appendChild(strong);
    toast.appendChild(small);
    toast.hidden = true;
    void toast.offsetWidth;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.hidden = true; }, 2000);
    if (!quiet && navigator.vibrate) navigator.vibrate([40, 30, 40]);
  }

  function fail(up) {
    slider.classList.remove('is-over-locked');
    replay(slider, 'is-fail');
    showToast(up ? '인증할수록 근육이 생겨요!' : '인증을 하지 않을수록 뚱뚱해져요!', '앱에서 확인해주세요');
  }

  function goTo(index) {
    if (STOPS[index].body) {
      stop = index;
      setBody(STOPS[index].body);
    } else {
      // Spring back to the closest stop with art.
      stop = index < 2 ? 2 : 3;
      setBody(STOPS[stop].body);
      fail(index < 2);
    }
    placeThumb(stop / (STOPS.length - 1));
    markCurrent();
  }

  function fractionAt(event) {
    var track = thumb.parentNode.getBoundingClientRect();
    return Math.min(1, Math.max(0, (event.clientY - track.top) / track.height));
  }

  var dragging = false;
  slider.addEventListener('pointerdown', function (event) {
    var li = event.target.closest('[data-stop]');
    if (li) {
      goTo(Number(li.getAttribute('data-stop')));
      return;
    }
    dragging = true;
    slider.setPointerCapture(event.pointerId);
    slider.classList.add('is-dragging');
    onDrag(event);
  });

  function onDrag(event) {
    var fraction = fractionAt(event);
    placeThumb(fraction);
    var index = Math.round(fraction * (STOPS.length - 1));
    slider.classList.toggle('is-over-locked', !STOPS[index].body);
    if (STOPS[index].body) {
      stop = index;
      setBody(STOPS[index].body);
      markCurrent();
    }
  }

  slider.addEventListener('pointermove', function (event) {
    if (dragging) onDrag(event);
  });

  function endDrag(event) {
    if (!dragging) return;
    dragging = false;
    slider.classList.remove('is-dragging');
    goTo(Math.round(fractionAt(event) * (STOPS.length - 1)));
  }
  slider.addEventListener('pointerup', endDrag);
  slider.addEventListener('pointercancel', endDrag);

  slider.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowUp' || event.key === 'ArrowRight') {
      event.preventDefault();
      goTo(Math.max(0, stop - 1));
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') {
      event.preventDefault();
      goTo(Math.min(STOPS.length - 1, stop + 1));
    }
  });

  // --- Kkulbam bumps: a port of the app's KkulbamBumpTower (#281) ---

  var wrap = dresser.parentNode;
  var tower = document.createElement('div');
  tower.className = 'bump-tower';
  tower.setAttribute('aria-hidden', 'true');
  wrap.appendChild(tower);
  var bumps = 0;
  var shown = 'm';

  // Measured in the app: the hero draws the 1050-tall canvas 335 tall with
  // 44-wide bumps, sunk 26 into the hair top and shifted 22 right of centre.
  var CANVAS_H = 1050;
  var APP_FIGURE_H = 335;
  // Head top on the canvas: the hair when worn, else the bald scalp
  // (CharacterFigure.headTopOf in the app).
  var HAIR_TOP = { m: 60, f: 34 };
  var SCALP_TOP = { m: { normal: 108, chubby: 116 }, f: { normal: 114, chubby: 112 } };
  var MAX_VISIBLE = 5;
  var SHRINK = 0.82;
  var MIN_SCALE = 0.55;
  var ASPECT = 0.81;
  var OVERLAP = 0.18;
  var LEAN = [0, 0.13, 0.33, 0.2, 0.06];
  var DOTS = [[0.185, 0.27], [0.67, 0.185], [0.466, 0.43], [0.8, 0.4],
    [0.085, 0.61], [0.308, 0.665], [0.714, 0.68], [0.535, 0.857]];
  var SVG_NS = 'http://www.w3.org/2000/svg';

  function bumpSvg() {
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 100 81');
    svg.setAttribute('preserveAspectRatio', 'none');
    var oval = document.createElementNS(SVG_NS, 'ellipse');
    oval.setAttribute('cx', '50');
    oval.setAttribute('cy', '40.5');
    oval.setAttribute('rx', '48.25');
    oval.setAttribute('ry', '38.75');
    oval.setAttribute('fill', '#EBA684');
    oval.setAttribute('stroke', '#2D1915');
    oval.setAttribute('stroke-width', '3.5');
    svg.appendChild(oval);
    DOTS.forEach(function (d) {
      var dot = document.createElementNS(SVG_NS, 'circle');
      dot.setAttribute('cx', String(d[0] * 100));
      dot.setAttribute('cy', String(d[1] * 81));
      dot.setAttribute('r', '2.2');
      dot.setAttribute('fill', '#2D1915');
      svg.appendChild(dot);
    });
    return svg;
  }

  function renderBumps(pop) {
    tower.textContent = '';
    var count = bumps;
    if (count <= 0) return;
    var figureH = dresser.offsetHeight;
    var k = figureH / APP_FIGURE_H;
    var base = 44 * k;
    var headTop = current.hair ? HAIR_TOP[shown] : SCALP_TOP[shown][body];
    var anchor = dresser.offsetTop + headTop / CANVAS_H * figureH + 26 * k;
    var maxHeight = anchor + 24;

    var visible = Math.min(count, MAX_VISIBLE);
    var overflow = count > MAX_VISIBLE;
    var sizes = [];
    var i;
    for (i = 0; i < visible; i++) sizes.push(base * Math.max(Math.pow(SHRINK, i), MIN_SCALE));
    var heights = sizes.map(function (w) { return w * ASPECT; });
    var below = heights.slice(0, -1).reduce(function (a, h) { return a + h; }, 0);
    var topH = heights[heights.length - 1];
    var overlap = OVERLAP;
    if (below > 0 && below * (1 - overlap) + topH > maxHeight) {
      overlap = Math.min(0.7, Math.max(OVERLAP, 1 - (maxHeight - topH) / below));
    }
    var rects = [];
    var bottom = 0;
    for (i = 0; i < visible; i++) {
      if (i > 0) bottom += heights[i - 1] * (1 - overlap);
      var cx = base * LEAN[i % LEAN.length];
      rects.push({ left: cx - sizes[i] / 2, bottom: bottom, w: sizes[i], h: heights[i] });
    }
    var last = rects[rects.length - 1];
    var height = last.bottom + last.h;

    tower.style.width = (base * 2) + 'px';
    tower.style.height = height + 'px';
    tower.style.left = (dresser.offsetLeft + dresser.offsetWidth / 2 + 22 * k - base) + 'px';
    tower.style.top = (anchor - height) + 'px';

    // Top first so lower bumps are drawn over the ones above.
    for (i = visible - 1; i >= 0; i--) {
      var r = rects[i];
      var el = document.createElement('div');
      el.className = 'bump';
      el.style.left = (base + r.left) + 'px';
      el.style.top = (height - r.bottom - r.h) + 'px';
      el.style.width = r.w + 'px';
      el.style.height = r.h + 'px';
      if (pop && !overflow && i === visible - 1) el.classList.add('is-pop');
      el.appendChild(bumpSvg());
      tower.appendChild(el);
    }
    if (overflow) {
      var tag = document.createElement('span');
      tag.className = 'bump-count' + (pop ? ' is-pop' : '');
      tag.textContent = '×' + count;
      tag.style.height = (base * 0.42) + 'px';
      tag.style.fontSize = (base * 0.42 * 0.6) + 'px';
      tag.style.padding = '0 ' + (base * 0.42 * 0.3) + 'px';
      tower.appendChild(tag);
    }
  }

  window.addEventListener('resize', function () { renderBumps(false); });

  // --- Kkulbam: a port of the app's KkulbamHitEffect (#281) ---

  var KK_WORDS = ['콰곽', '콰광', '콱!', '꽈광'];
  var KK_PALETTES = {
    sunburst: [
      ['#FF7417', '#FFB238', '#17110E', '#FFF4E0'],
      ['#2361D8', '#5AA6FF', '#101828', '#E6F1FF'],
      ['#FFCC12', '#FFF27A', '#22A845', '#0E2A14'],
      ['#F07C74', '#FFD3C8', '#1C1414', '#FFF4EE']
    ],
    burst: [
      ['#FF8A3D', '#FFE04A', '#E3261B', '#1B2C7A'],
      ['#E8402A', '#FFC23D', '#17110E', '#FFF4E0']
    ],
    lightning: [
      ['#5B1FAF', '#FFE8FF', '#151018', '#FFF4E0'],
      ['#9E1B32', '#FFE6C2', '#151018', '#FFE9A8']
    ],
    beams: [
      ['#0E0D12', '#F4E8FF', '#FFFFFF', '#0E0D12']
    ]
  };
  var KK_DURATION = 1100;
  var KK_REDUCED = 700;
  var KK_SECOND = 150;
  var reducedMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function seeded(seed) {
    return function () {
      seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function elasticOut(t) {
    if (t <= 0 || t >= 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t - 0.1) * 2 * Math.PI / 0.4) + 1;
  }

  function kick(since, strength) {
    if (since < 0 || since > 420) return [0, 0];
    var decay = Math.exp(-since / 110);
    var phase = since / 1000 * 2 * Math.PI * 11;
    return [Math.sin(phase) * strength * decay, Math.cos(phase * 1.37) * strength * 0.6 * decay];
  }

  function randomHit() {
    var backdrops = Object.keys(KK_PALETTES);
    var backdrop = backdrops[Math.floor(Math.random() * backdrops.length)];
    var palettes = KK_PALETTES[backdrop];
    var pal = palettes[Math.floor(Math.random() * palettes.length)];
    var word = KK_WORDS[Math.floor(Math.random() * KK_WORDS.length)];
    var syllables = word.split('').filter(function (c) { return c >= '가' && c <= '힣'; }).length;
    return {
      word: word,
      backdrop: backdrop,
      back: pal[0], front: pal[1], fill: pal[2], stroke: pal[3],
      seed: Math.floor(Math.random() * 1073741824),
      doubleStrike: syllables >= 2
    };
  }

  function drawBackdrop(ctx, hit, w, h, spin, flicker) {
    var cx = w / 2;
    var cy = h / 2;
    var reach = Math.max(w, h);
    ctx.fillStyle = hit.back;
    ctx.fillRect(0, 0, w, h);
    var rnd, i;
    if (hit.backdrop === 'sunburst') {
      var rays = 18;
      var turn = spin * 0.35;
      ctx.fillStyle = hit.front;
      for (i = 0; i < rays; i += 2) {
        var a0 = turn + i / rays * 2 * Math.PI;
        var a1 = turn + (i + 1) / rays * 2 * Math.PI;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a0) * reach, cy + Math.sin(a0) * reach);
        ctx.lineTo(cx + Math.cos(a1) * reach, cy + Math.sin(a1) * reach);
        ctx.closePath();
        ctx.fill();
      }
    } else if (hit.backdrop === 'burst') {
      rnd = seeded(hit.seed);
      var short = Math.min(w, h);
      var pulse = 1 + 0.04 * Math.sin(spin * 2 * Math.PI * 3);
      var star = function (outer, inner, spikes, rot, color) {
        ctx.beginPath();
        for (var k = 0; k < spikes * 2; k++) {
          var r = k % 2 === 0 ? outer * (0.8 + rnd() * 0.4) : inner;
          var a = rot + k / (spikes * 2) * 2 * Math.PI;
          var x = cx + Math.cos(a) * r;
          var y = cy + Math.sin(a) * r;
          if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
      };
      star(short * 0.95 * pulse, short * 0.55, 14, spin * 0.2, mix(hit.back, hit.front, 0.45));
      star(short * 0.62 * pulse, short * 0.36, 12, -spin * 0.3, hit.front);
    } else if (hit.backdrop === 'lightning') {
      var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, reach * 0.8 * 0.71);
      g.addColorStop(0, mix(hit.back, '#FFFFFF', 0.3));
      g.addColorStop(1, hit.back);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      rnd = seeded(hit.seed * 31 + flicker);
      ctx.lineJoin = 'round';
      for (i = 0; i < 9; i++) {
        var angle = i / 9 * 2 * Math.PI + (rnd() - 0.5) * 0.5;
        var px = cx + Math.cos(angle) * Math.min(w, h) * 0.1;
        var py = cy + Math.sin(angle) * Math.min(w, h) * 0.1;
        var pts = [[px, py]];
        var travelled = 0;
        while (travelled < reach * 0.8) {
          var step = 24 + rnd() * 40;
          var dir = angle + (rnd() - 0.5) * 1.2;
          px += Math.cos(dir) * step;
          py += Math.sin(dir) * step;
          pts.push([px, py]);
          travelled += step;
        }
        strokePath(ctx, pts, hit.front, 10, 0.55, 8);
        strokePath(ctx, pts, hit.front, 2.5, 1, 0);
      }
    } else {
      rnd = seeded(hit.seed);
      for (i = 0; i < 7; i++) {
        var drift = Math.sin(spin * 2 + i) * w * 0.05;
        var x0 = (i / 6) * w * 1.6 - w * 0.3 + drift;
        var tilt = w * (0.5 + rnd() * 0.3);
        [1, -1].forEach(function (d) {
          var line = [[x0, 0], [x0 + d * tilt, h]];
          strokePath(ctx, line, hit.front, 14, 0.35, 10);
          strokePath(ctx, line, hit.front, 3, 1, 0);
        });
      }
    }
    // Vignette pulls the eye to the word.
    var v = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.hypot(w, h) / 2 * 0.85);
    v.addColorStop(0.55, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,0.16)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, w, h);
  }

  function strokePath(ctx, pts, color, width, alpha, blur) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    if (blur) {
      ctx.shadowColor = color;
      ctx.shadowBlur = blur * 2;
    }
    ctx.beginPath();
    pts.forEach(function (pt, k) { if (k === 0) ctx.moveTo(pt[0], pt[1]); else ctx.lineTo(pt[0], pt[1]); });
    ctx.stroke();
    ctx.restore();
  }

  function mix(a, b, t) {
    var pa = parseInt(a.slice(1), 16);
    var pb = parseInt(b.slice(1), 16);
    var out = [16, 8, 0].map(function (shift) {
      var ca = (pa >> shift) & 255;
      var cb = (pb >> shift) & 255;
      return Math.round(ca + (cb - ca) * t);
    });
    return 'rgb(' + out.join(',') + ')';
  }

  var fontFamily = getComputedStyle(document.body).fontFamily;
  var playing = null;

  // Both characters share these couple of hits; the rest is for friends
  // in the app.
  var MAX_BUMPS = 2;

  function playKkulbam() {
    if (playing) playing.close();
    if (bumps >= MAX_BUMPS) {
      replay(dresser, 'is-nudge');
      showToast('꿀밤은 여기까지!', '앱에서 친구들한테 더 많이 때려보세요');
      return;
    }
    var hit = randomHit();
    var duration = reducedMotion ? KK_REDUCED : KK_DURATION;
    // Unlike the app, the effect stays inside the character card: the backdrop
    // goes behind the character, the word and flash in front of it.
    var card = dresser.closest('.demo-card');
    var box = card.getBoundingClientRect();
    var w = box.width;
    var h = box.height;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    function layer(className) {
      var c = document.createElement('canvas');
      c.className = 'kkulbam-fx ' + className;
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      return c;
    }
    var back = layer('kk-back');
    var front = layer('kk-front');
    front.setAttribute('role', 'img');
    front.setAttribute('aria-label', hit.word);
    card.insertBefore(back, card.firstChild);
    card.appendChild(front);
    var bctx = back.getContext('2d');
    var ctx = front.getContext('2d');
    // The word sits over the character's head.
    var wordY = h * 0.3;

    var rnd = seeded(hit.seed);
    var chars = Array.from(hit.word);
    var size = w * 0.3 * Math.min(1, 2.6 / chars.length);
    var wordTilt = (rnd() - 0.5) * 0.18;
    var glyphs = chars.map(function (c) {
      var g = { c: c, angle: (rnd() - 0.5) * 0.35, dy: (rnd() - 0.5) * size * 0.18 };
      var grow = 0.9 + rnd() * 0.25;
      g.font = '700 ' + (size * grow) + 'px ' + fontFamily;
      ctx.font = g.font;
      g.width = ctx.measureText(c).width;
      return g;
    });

    var start = performance.now();
    var raf;
    var state = {
      close: function () {
        if (state.closed) return;
        state.closed = true;
        cancelAnimationFrame(raf);
        back.remove();
        front.remove();
        if (playing === state) playing = null;
        // Like the app, the new bump pops onto the head once the hit is over.
        bumps += 1;
        renderBumps(true);
      }
    };
    playing = state;
    if (!reducedMotion) replay(dresser, 'is-bonk');

    if (navigator.vibrate) navigator.vibrate(hit.doubleStrike ? [30, KK_SECOND - 30, 30] : 30);

    function frame(now) {
      var ms = now - start;
      var t = ms / duration;
      if (t >= 1) { state.close(); return; }
      var fade = String(t > 0.84 ? Math.max(0, (1 - t) / 0.16) : 1);
      back.style.opacity = fade;
      front.style.opacity = fade;
      var shake = [0, 0];
      if (!reducedMotion) {
        shake = kick(ms, 22);
        if (hit.doubleStrike) {
          var second = kick(ms - KK_SECOND, 26);
          shake = [shake[0] + second[0], shake[1] + second[1]];
        }
      }
      var zoom = reducedMotion ? 1 : 1 + 0.12 * Math.exp(-ms / 90);
      var lightning = hit.backdrop === 'lightning';

      bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      bctx.save();
      bctx.translate(w / 2 + shake[0], h / 2 + shake[1]);
      bctx.scale(zoom, zoom);
      bctx.translate(-w / 2, -h / 2);
      drawBackdrop(bctx, hit, w, h,
        reducedMotion || lightning ? 0 : ms / 1000,
        reducedMotion || !lightning ? 0 : Math.floor(ms / 70));
      bctx.restore();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Each glyph slams in a beat after the previous one; until then it only
      // holds its place in the row.
      var elapsed = reducedMotion ? 10000 : ms;
      var widths = glyphs.map(function (g, k) {
        return elapsed - k * KK_SECOND * 0.8 > 0 ? g.width : size * 0.9;
      });
      var total = widths.reduce(function (a, b) { return a + b; }, 0);
      ctx.save();
      ctx.translate(w / 2 + shake[0] * 1.4, wordY + shake[1] * 1.4);
      ctx.rotate(wordTilt);
      var x = -total / 2;
      glyphs.forEach(function (g, k) {
        var p = Math.min(1, Math.max(0, (elapsed - k * KK_SECOND * 0.8) / 260));
        var slot = widths[k];
        if (p > 0) {
          var scale = 3.2 + (1 - 3.2) * elasticOut(p);
          ctx.save();
          ctx.translate(x + slot / 2, g.dy);
          ctx.rotate(g.angle);
          ctx.scale(scale, scale);
          ctx.font = g.font;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.lineJoin = 'round';
          ctx.lineWidth = size * 0.16;
          ctx.globalAlpha = 0.35;
          ctx.strokeStyle = hit.stroke;
          ctx.strokeText(g.c, size * 0.05, size * 0.06);
          ctx.globalAlpha = 1;
          ctx.strokeText(g.c, 0, 0);
          ctx.fillStyle = hit.fill;
          ctx.fillText(g.c, 0, 0);
          ctx.restore();
        }
        x += slot;
      });
      ctx.restore();

      var flash = reducedMotion ? 0 : Math.max(0, 1 - ms / 110);
      if (flash > 0) {
        ctx.fillStyle = 'rgba(255,255,255,' + flash + ')';
        ctx.fillRect(0, 0, w, h);
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
  }

  dresser.addEventListener('click', playKkulbam);

  goTo(2);

  // Wait for every layer so the first swaps don't slide in blank frames.
  var srcs = [];
  ['normal', 'chubby'].forEach(function (shape) {
    CHARACTERS.forEach(function (character) {
      [BASIC].concat(character.looks).forEach(function (outfit) {
        SLOTS.forEach(function (slot) {
          var src = outfit[slot] && character.dir + shape + '/' + outfit[slot] + '.webp';
          if (src && srcs.indexOf(src) < 0) srcs.push(src);
        });
      });
    });
  });
  var pending = srcs.length;
  function ready() { if (--pending === 0) loop(); }
  srcs.forEach(function (src) {
    var preload = new Image();
    preload.onload = ready;
    preload.onerror = ready;
    preload.src = src;
  });
})();

(function () {
  'use strict';

  var cards = document.querySelectorAll('.dex-card');
  var hint = document.getElementById('dex-hint');

  cards.forEach(function (card) {
    card.addEventListener('click', function () {
      cards.forEach(function (c) { c.classList.remove('is-picked'); });
      card.classList.add('is-picked');
      var locked = card.classList.contains('is-locked');
      if (locked) {
        card.classList.remove('is-shake');
        void card.offsetWidth;
        card.classList.add('is-shake');
      }
      hint.textContent = '';
      var line = document.createElement('span');
      line.textContent = '"' + card.getAttribute('data-hint') + '"';
      var sub = document.createElement('small');
      sub.textContent = locked ? '정체는 앱에서 확인해요' : '직접 때려 보기 탭의 그 녀석이에요';
      hint.appendChild(line);
      hint.appendChild(sub);
    });
  });
})();

(function () {
  'use strict';

  var tabs = document.querySelectorAll('.demo-tab');

  function select(tab) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.classList.toggle('is-current', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { select(tab); });
    tab.addEventListener('keydown', function (event) {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      var next = tabs[(i + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      select(next);
      next.focus();
    });
  });
})();
