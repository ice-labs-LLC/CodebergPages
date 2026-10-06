(function () {
  'use strict';

  var STORAGE_GLASS = 'iceLabsGlassIntensity';

  var SITE_MAP = [
    { keys: ['home', 'main', 'start', 'index'], href: 'index.html', label: 'Home' },
    { keys: ['blog', 'news', 'posts'], href: 'blog.html', label: 'Blog' },
    { keys: ['mods', 'mod', 'modifications'], href: 'mods.html', label: 'Mods' },
    {
      keys: ['system requirements', 'sys req', 'sysreq', 'requirements', 'specs', 'ice tag requirements'],
      href: 'sysreq.html',
      label: 'Ice Tag system requirements',
    },
    {
      keys: ['round runners', 'round runner', 'rr sys', 'rr requirements', 'runners requirements'],
      href: 'sysreqrr.html',
      label: 'Round Runners system requirements',
    },
    { keys: ['terms', 'terms of service', 'tos'], href: 'terms.html', label: 'Terms of Service' },
    { keys: ['privacy', 'privacy policy'], href: 'privacy.html', label: 'Privacy Policy' },
  ];

  var DOWNLOADS = [
    {
      keys: ['ice tag', 'icetag', 'download ice', 'itch ice'],
      url: 'https://jackww51.itch.io/iceygame',
      label: 'Ice Tag on itch.io',
    },
    {
      keys: ['round runners download', 'download round', 'runners itch'],
      url: 'https://jackww51.itch.io/round-runners',
      label: 'Round Runners on itch.io',
    },
    { keys: ['itch', 'itch.io', 'store'], url: 'https://jackww51.itch.io', label: 'Ice Labs on itch.io' },
  ];

  function setGlassIntensity(percent) {
    var p = Math.max(0, Math.min(100, Number(percent) || 0));
    var g = p / 100;
    var root = document.documentElement;
    root.style.setProperty('--glass-intensity', String(g));
    root.style.setProperty('--glass-solid', String(1 - g));
    try {
      localStorage.setItem(STORAGE_GLASS, String(p));
    } catch (e) {}
    var out = document.getElementById('glass-intensity-value');
    if (out) out.textContent = String(Math.round(p));
    var slider = document.getElementById('glass-intensity-slider');
    if (slider && slider.value !== String(p)) slider.value = String(p);
  }

  function loadGlassIntensity() {
    var stored = 100;
    try {
      var s = localStorage.getItem(STORAGE_GLASS);
      if (s !== null) stored = Number(s);
    } catch (e) {}
    if (Number.isNaN(stored)) stored = 100;
    setGlassIntensity(stored);
  }

  function normalize(text) {
    return (text || '')
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function findNavTarget(input) {
    var q = normalize(input);
    if (!q) return null;

    var i;
    var k;
    for (i = 0; i < SITE_MAP.length; i++) {
      var entry = SITE_MAP[i];
      for (k = 0; k < entry.keys.length; k++) {
        if (q.indexOf(entry.keys[k]) !== -1) {
          return { type: 'nav', href: entry.href, label: entry.label };
        }
      }
    }
    for (i = 0; i < DOWNLOADS.length; i++) {
      var dl = DOWNLOADS[i];
      for (k = 0; k < dl.keys.length; k++) {
        if (q.indexOf(dl.keys[k]) !== -1) {
          return { type: 'link', url: dl.url, label: dl.label };
        }
      }
    }

    if (/help|what can you|commands|navigate/.test(q)) {
      return {
        type: 'text',
        message:
          'Try: "Go to blog", "Round Runners requirements", "Download Ice Tag", or "Open privacy policy". You can type or tap the mic.',
      };
    }

    if (/hello|hi|hey|ice labs/.test(q)) {
      return {
        type: 'text',
        message: 'Hi! I\'m Ice Guide. Ask me to open any page, find system requirements, or jump to a download on itch.io.',
      };
    }

    if (/settings|glass|transparen|blur/.test(q)) {
      return {
        type: 'text',
        message: 'Use the gear icon on the navigation bar to adjust how glassy the site looks.',
      };
    }

    if (/discord|community|chat/.test(q)) {
      return {
        type: 'text',
        message: 'The Discord widget is on the home page. I can take you there if you say "go home".',
      };
    }

    return {
      type: 'text',
      message:
        'I\'m not sure about that. Try "Go to mods", "Ice Tag requirements", or "Download Round Runners".',
    };
  }

  function speak(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.rate = 1.02;
    u.pitch = 1;
    window.speechSynthesis.speak(u);
    return u;
  }

  function injectNavSettings() {
    var inner = document.querySelector('.nav-inner');
    if (!inner) return;

    var toggle = inner.querySelector('.nav-toggle');
    var actions = inner.querySelector('.nav-actions');
    if (!actions) {
      actions = document.createElement('div');
      actions.className = 'nav-actions';
      if (toggle) {
        inner.appendChild(actions);
        actions.appendChild(toggle);
      } else {
        inner.appendChild(actions);
      }
    }

    if (inner.querySelector('.nav-settings-btn')) return;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nav-settings-btn';
    btn.setAttribute('aria-label', 'Appearance settings');
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="3"/>' +
      '<path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>' +
      '</svg>';
    actions.insertBefore(btn, actions.firstChild);
    btn.addEventListener('click', function () {
      openSettings(true);
    });
  }

  function buildSettingsUI() {
    if (document.getElementById('ui-backdrop')) return;

    var backdrop = document.createElement('div');
    backdrop.id = 'ui-backdrop';
    backdrop.className = 'ui-backdrop';
    backdrop.addEventListener('click', function () {
      openSettings(false);
    });

    var sheet = document.createElement('div');
    sheet.id = 'settings-sheet';
    sheet.className = 'settings-sheet';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-labelledby', 'settings-title');
    sheet.innerHTML =
      '<h2 id="settings-title">Appearance</h2>' +
      '<p>Adjust Liquid Glass intensity across the site.</p>' +
      '<div class="glass-slider-row"><label for="glass-intensity-slider">Glass intensity</label>' +
      '<output id="glass-intensity-value" for="glass-intensity-slider">100</output></div>' +
      '<input type="range" id="glass-intensity-slider" class="glass-slider" min="0" max="100" step="1" value="100" />' +
      '<p class="settings-hint">0% is flat and solid; 100% is full blur, shine, and mesh background.</p>' +
      '<button type="button" class="settings-close" id="settings-close-btn">Done</button>';

    document.body.appendChild(backdrop);
    document.body.appendChild(sheet);

    var slider = document.getElementById('glass-intensity-slider');
    slider.addEventListener('input', function () {
      setGlassIntensity(slider.value);
    });
    document.getElementById('settings-close-btn').addEventListener('click', function () {
      openSettings(false);
    });
  }

  function openSettings(open) {
    var backdrop = document.getElementById('ui-backdrop');
    var sheet = document.getElementById('settings-sheet');
    if (!backdrop || !sheet) return;
    backdrop.classList.toggle('is-open', open);
    sheet.classList.toggle('is-open', open);
  }

  function buildGuideUI() {
    if (document.getElementById('ice-guide-panel')) return;

    var launcher = document.createElement('button');
    launcher.type = 'button';
    launcher.className = 'ice-guide-launcher';
    launcher.setAttribute('aria-label', 'Open Ice Guide assistant');
    launcher.innerHTML =
      '<div class="siri-orb-wrap" id="siri-orb-launcher">' +
      '<div class="siri-orb-core"></div></div>';

    var panel = document.createElement('div');
    panel.id = 'ice-guide-panel';
    panel.className = 'ice-guide-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Ice Guide');
    panel.innerHTML =
      '<div class="ice-guide-header">' +
      '<div class="siri-orb-wrap" id="siri-orb-header"><div class="siri-orb-core"></div></div>' +
      '<div><h2>Ice Guide</h2><span>Navigate Ice Labs with voice or keyboard</span></div>' +
      '<button type="button" class="ice-guide-close" aria-label="Close">&times;</button></div>' +
      '<div class="ice-guide-messages" id="ice-guide-messages" aria-live="polite"></div>' +
      '<div class="ice-guide-input-row">' +
      '<input type="text" class="ice-guide-input" id="ice-guide-input" placeholder="Ask or type a command…" autocomplete="off" />' +
      '<button type="button" class="ice-guide-mic" id="ice-guide-mic" aria-label="Use microphone">' +
      '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z"/></svg></button>' +
      '<button type="button" class="ice-guide-send" id="ice-guide-send" aria-label="Send">' +
      '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3.4 20.4 22 12 3.4 3.6l2.8 7.2L16 12l-9.8 1.2-2.8 7.2z"/></svg></button></div>';

    document.body.appendChild(launcher);
    document.body.appendChild(panel);

    var messages = document.getElementById('ice-guide-messages');
    appendMessage(
      'bot',
      'Hi! I\'m Ice Guide. Say or type things like "Go to blog" or "Round Runners requirements".'
    );

    function togglePanel(open) {
      panel.classList.toggle('is-open', open);
      if (open) {
        setTimeout(function () {
          document.getElementById('ice-guide-input').focus();
        }, 200);
      }
    }

    launcher.addEventListener('click', function () {
      togglePanel(!panel.classList.contains('is-open'));
    });
    panel.querySelector('.ice-guide-close').addEventListener('click', function () {
      togglePanel(false);
    });

    document.getElementById('ice-guide-send').addEventListener('click', submitInput);
    document.getElementById('ice-guide-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') submitInput();
    });

    setupSpeechRecognition();

    function submitInput() {
      var input = document.getElementById('ice-guide-input');
      var text = (input.value || '').trim();
      if (!text) return;
      input.value = '';
      handleUserMessage(text);
    }

    function appendMessage(role, text) {
      var el = document.createElement('div');
      el.className = 'ice-msg ice-msg--' + role;
      el.textContent = text;
      messages.appendChild(el);
      messages.scrollTop = messages.scrollHeight;
    }

    function setOrbState(state) {
      var orbs = document.querySelectorAll('.siri-orb-wrap');
      orbs.forEach(function (o) {
        o.classList.remove('is-listening', 'is-speaking');
        if (state) o.classList.add(state);
      });
    }

    function handleUserMessage(text) {
      appendMessage('user', text);
      var result = findNavTarget(text);
      var reply = result.message || '';

      if (result.type === 'nav') {
        reply = 'Opening ' + result.label + '.';
        appendMessage('bot', reply);
        var utter = speak(reply);
        if (utter) {
          setOrbState('is-speaking');
          utter.onend = function () {
            setOrbState('');
            window.location.href = result.href;
          };
        } else {
          setTimeout(function () {
            window.location.href = result.href;
          }, 600);
        }
        return;
      }

      if (result.type === 'link') {
        reply = 'Opening ' + result.label + ' in a new tab.';
        appendMessage('bot', reply);
        speak(reply);
        window.open(result.url, '_blank', 'noopener,noreferrer');
        return;
      }

      appendMessage('bot', reply);
      var u = speak(reply);
      if (u) {
        setOrbState('is-speaking');
        u.onend = function () {
          setOrbState('');
        };
      }
    }

    function setupSpeechRecognition() {
      var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      var micBtn = document.getElementById('ice-guide-mic');
      if (!SpeechRecognition) {
        micBtn.disabled = true;
        micBtn.title = 'Speech recognition is not supported in this browser';
        return;
      }

      var recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      var listening = false;

      recognition.onstart = function () {
        listening = true;
        micBtn.classList.add('is-active');
        setOrbState('is-listening');
      };

      recognition.onend = function () {
        listening = false;
        micBtn.classList.remove('is-active');
        setOrbState('');
      };

      recognition.onerror = function () {
        listening = false;
        micBtn.classList.remove('is-active');
        setOrbState('');
        appendMessage('bot', 'I couldn\'t hear that. Check mic permissions or type your request.');
      };

      recognition.onresult = function (event) {
        var transcript = event.results[0][0].transcript;
        if (!panel.classList.contains('is-open')) togglePanel(true);
        handleUserMessage(transcript);
      };

      micBtn.addEventListener('click', function () {
        if (listening) {
          recognition.stop();
          return;
        }
        if (!panel.classList.contains('is-open')) togglePanel(true);
        try {
          recognition.start();
        } catch (e) {
          appendMessage('bot', 'Microphone is already active or unavailable.');
        }
      });
    }
  }

  function shortenNavLabels() {
    document.querySelectorAll('.nav-links a[href="sysreqrr.html"]').forEach(function (a) {
      if (a.textContent.trim().length > 20) {
        a.textContent = 'RR Sys Req';
      }
      if (!a.getAttribute('title')) {
        a.setAttribute('title', 'Round Runners System Requirements');
      }
    });
    document.querySelectorAll('.nav-links a[href="sysreq.html"]').forEach(function (a) {
      if (/system requirements/i.test(a.textContent) && a.getAttribute('href') === 'sysreq.html') {
        if (a.textContent.trim().length > 18) {
          a.textContent = 'Ice Tag Req';
          a.setAttribute('title', 'Ice Tag System Requirements');
        }
      }
    });
  }

  function init() {
    loadGlassIntensity();
    buildSettingsUI();
    injectNavSettings();
    buildGuideUI();
    shortenNavLabels();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
