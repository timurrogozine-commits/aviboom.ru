// Form submission for Spru Forms + Telegram notification
(function () {
  const form = document.querySelector('[data-form="contact"]');
  if (!form) return;

  const status = form.querySelector('[data-form-status]');
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalLabel = submitBtn ? submitBtn.textContent : '';

  // Telegram notification (in parallel with Spru Forms)
  function notifyTelegram(dataObj) {
    var token = '8908881437:AAEd9Wy6h6i7iJrgf0Zm47wCHvFKucZbl3Q';
    var chatId = '-5244833486';
    var lines = ['🆕 *Новая заявка с сайта AVIBOOM*', ''];
    for (var k in dataObj) {
      if (!dataObj[k]) continue;
      var label = ({name:'👤 Имя', phone:'📞 Телефон', message:'💬 Комментарий', email:'✉️ Email', tariff:'🎯 Тариф'})[k] || k;
      lines.push(label + ': ' + dataObj[k]);
    }
    lines.push('', '⏰ ' + new Date().toLocaleString('ru-RU'));
    lines.push('🔗 ' + location.href);
    var text = lines.join('\n');
    var url = 'https://api.telegram.org/bot' + token + '/sendMessage';
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'Markdown' })
    }).catch(function () {});
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (status) {
      status.hidden = false;
      status.textContent = 'Отправляем...';
    }
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Отправляем...';
    }

    var data = new FormData(form);
    var dataObj = {};
    data.forEach(function (v, k) { dataObj[k] = v; });
    notifyTelegram(dataObj);

    var emailForm = new FormData();
    for (var k2 in dataObj) emailForm.append(k2, dataObj[k2]);
    emailForm.append('_subject', 'Новая заявка с сайта AVIBOOM');
    emailForm.append('_template', 'table');
    emailForm.append('_captcha', 'false');
    fetch('https://formsubmit.co/ajax/timurrogozine@gmail.com', {
      method: 'POST',
      body: emailForm,
      headers: { 'Accept': 'application/json' }
    }).catch(function () {});

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
      });

      if (!res.ok) throw new Error('HTTP ' + res.status);

      if (status) {
        status.textContent = 'Заявка отправлена. Свяжемся в течение 1–2 дней.';
      }
      form.reset();
    } catch (err) {
      if (status) {
        status.textContent = 'Заявка получена. Если не перезвоним — напишите в Telegram.';
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel;
      }
    }
  });
})();

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(function (a) {
  a.addEventListener('click', function (e) {
    const id = a.getAttribute('href');
    if (id.length <= 1) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

// === Yandex.Metrika: visit params for segments ===
// Tracks time-on-page and scroll depth as session params.
// Create segments in Metrika: "Hot leads" (timeOnSite >= 60s + click on contact), "Warm leads" (>= 30s + scroll > 50%), etc.
(function () {
  if (typeof ym !== 'function') return;
  var METRIKA_ID = 112243872;
  var startTime = Date.now();
  var maxScroll = 0;
  var docHeight = document.documentElement.scrollHeight;
  var reachedTariffs = false;
  var reachedContact = false;
  var clickedContact = false;

  // Scroll depth (every 1.5s, sample max)
  setInterval(function () {
    var scrolled = window.scrollY + window.innerHeight;
    var pct = docHeight > 0 ? (scrolled / docHeight) * 100 : 0;
    if (pct > maxScroll) maxScroll = pct;
  }, 1500);

  // Mark tariff view
  var tariffsEl = document.getElementById('tariffs');
  if (tariffsEl) {
    var obsT = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && e.intersectionRatio > 0.3) {
          reachedTariffs = true;
          obsT.disconnect();
        }
      });
    }, { threshold: 0.3 });
    obsT.observe(tariffsEl);
  }

  // Mark contact form view
  var contactEl = document.getElementById('contact');
  if (contactEl) {
    var obsC = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && e.intersectionRatio > 0.3) {
          reachedContact = true;
          obsC.disconnect();
        }
      });
    }, { threshold: 0.3 });
    obsC.observe(contactEl);
  }

  // Track any click on a contact link
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a');
    if (!a) return;
    var href = (a.getAttribute('href') || '').toLowerCase();
    if (
      href.indexOf('t.me/') !== -1 ||
      href.indexOf('telegram') !== -1 ||
      href.indexOf('max.ru') !== -1 ||
      href.indexOf('tel:') !== -1 ||
      href === '#contact'
    ) {
      clickedContact = true;
    }
  }, true);

  // On page hide, send session params
  function sendParams() {
    var timeOnSite = Math.round((Date.now() - startTime) / 1000);
    var scrollDepth = Math.round(maxScroll);
    var hotLead = timeOnSite >= 60 && (clickedContact || window.__formSubmitted);
    var warmLead = timeOnSite >= 30 && (scrollDepth >= 50 || reachedTariffs);
    try {
      ym(METRIKA_ID, 'params', {
        time_on_site: timeOnSite,
        scroll_depth: scrollDepth,
        reached_tariffs: reachedTariffs ? 1 : 0,
        reached_contact: reachedContact ? 1 : 0,
        clicked_contact: clickedContact ? 1 : 0,
        hot_lead: hotLead ? 1 : 0,
        warm_lead: warmLead ? 1 : 0
      });
    } catch (err) { /* metrika not loaded */ }
  }

  window.addEventListener('pagehide', sendParams);
  window.addEventListener('beforeunload', sendParams);
  // Also send after 5s as fallback (mobile browsers don't fire pagehide reliably)
  setTimeout(sendParams, 5000);
})();

// Form submit flag for hot_lead segment
document.addEventListener('DOMContentLoaded', function () {
  var form = document.querySelector('[data-form="contact"]');
  if (!form) return;
  form.addEventListener('submit', function () {
    window.__formSubmitted = true;
  });
});

// Hide floating CTA when near contact section
(function () {
  var btns = document.querySelectorAll('.floating-cta, .mobile-sticky-cta');
  var target = document.querySelector('#contact');
  if (!btns.length || !target) return;
  if (!('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      btns.forEach(function (btn) {
        btn.classList.toggle('is-hidden', e.isIntersecting);
      });
    });
  }, { rootMargin: '-30% 0px -30% 0px' });
  io.observe(target);
})();

// Mobile burger menu drawer
(function () {
  var burger = document.querySelector('.nav__burger');
  var drawer = document.querySelector('.nav__drawer');
  var closeBtn = document.querySelector('.nav__drawer-close');
  if (!burger || !drawer) return;

  function open() {
    burger.classList.add('is-active');
    burger.setAttribute('aria-expanded', 'true');
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('nav-open');
  }
  function close() {
    burger.classList.remove('is-active');
    burger.setAttribute('aria-expanded', 'false');
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('nav-open');
  }
  burger.addEventListener('click', function () {
    if (drawer.classList.contains('is-open')) close();
    else open();
  });
  if (closeBtn) {
    closeBtn.addEventListener('click', function () { close(); });
  }
  drawer.addEventListener('click', function (e) {
    if (e.target === drawer) close();
  });
  drawer.querySelectorAll('[data-nav-link]').forEach(function (link) {
    link.addEventListener('click', function () { close(); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) close();
  });
})();

// Cases horizontal scroll
(function () {
  var grid = document.querySelector('.cases__grid');
  var btns = document.querySelectorAll('.cases__nav-btn');
  if (!grid || !btns.length) return;

  function update() {
    btns.forEach(function (btn) {
      var dir = parseInt(btn.getAttribute('data-dir'), 10);
      if (dir === -1) {
        btn.disabled = grid.scrollLeft <= 5;
      } else {
        btn.disabled = grid.scrollLeft + grid.clientWidth >= grid.scrollWidth - 5;
      }
    });
  }

  function scroll(dir) {
    var card = grid.querySelector('.case');
    if (!card) return;
    var cardWidth = card.offsetWidth + 14;
    grid.scrollBy({ left: cardWidth * dir, behavior: 'smooth' });
  }

  btns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var dir = parseInt(btn.getAttribute('data-dir'), 10);
      scroll(dir);
    });
  });

  grid.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();