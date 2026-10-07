(function () {
  'use strict';

  var COOKIE_GLASS = 'iceLabsGlassIntensity';
  var STORAGE_GLASS = 'iceLabsGlassIntensity';
  var STORAGE_CHAT = 'iceGuideChatHistory';

  var GROQ_API_KEY = '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';
  var GROQ_MODEL = 'openai/gpt-oss-120b';
  var GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

  var glassPercent = 100;

  function setCookie(name, value, days) {
    var expires = new Date(Date.now() + days * 86400000).toUTCString();
    document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/; SameSite=Lax';
  }

  function getCookie(name) {
    var match = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  }

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
    glassPercent = p;
    setCookie(COOKIE_GLASS, String(p), 365);
    try {
      localStorage.setItem(STORAGE_GLASS, String(p));
    } catch (e) {}
    var out = document.getElementById('glass-intensity-value');
    if (out) out.textContent = String(Math.round(p));
    var slider = document.getElementById('glass-intensity-slider');
    if (slider && slider.value !== String(p)) slider.value = String(p);
  }

  function loadGlassIntensity() {
    var stored = null;
    var cookie = getCookie(COOKIE_GLASS);
    if (cookie !== null) {
      stored = Number(cookie);
    }
    if (stored === null || Number.isNaN(stored)) {
      try {
        var s = localStorage.getItem(STORAGE_GLASS);
        if (s !== null) stored = Number(s);
      } catch (e) {}
    }
    if (stored === null || Number.isNaN(stored)) stored = 100;
    setGlassIntensity(stored);
  }

  function loadChatHistory() {
    try {
      var s = sessionStorage.getItem(STORAGE_CHAT);
      var h = s ? JSON.parse(s) : [];
      return Array.isArray(h) ? h : [];
    } catch (e) {
      return [];
    }
  }

  function saveChatHistory(history) {
    try {
      sessionStorage.setItem(STORAGE_CHAT, JSON.stringify(history.slice(-16)));
    } catch (e) {}
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
          'Try: "Go to blog", "Round Runners requirements", "Download Ice Tag", "Open privacy policy", or "Set glass intensity to 40". You can type or tap the mic.',
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
        message: 'Just ask me things like "set glass intensity to 40" or "make it less glassy", or use the gear icon in the navigation bar.',
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

  function resolvePage(page) {
    var p = normalize(page);
    var i;
    var k;
    for (i = 0; i < SITE_MAP.length; i++) {
      var entry = SITE_MAP[i];
      if (entry.href === page || normalize(entry.label) === p) return entry;
      for (k = 0; k < entry.keys.length; k++) {
        if (p === normalize(entry.keys[k])) return entry;
      }
    }
    if (!p) return null;
    for (i = 0; i < SITE_MAP.length; i++) {
      var e = SITE_MAP[i];
      var hrefName = normalize(e.href.replace(/\.html$/, ''));
      if (hrefName.indexOf(p) !== -1 || p.indexOf(hrefName) !== -1) return e;
      for (k = 0; k < e.keys.length; k++) {
        if (e.keys[k].indexOf(p) !== -1 || p.indexOf(e.keys[k]) !== -1) return e;
      }
    }
    return null;
  }

  function resolveLink(url) {
    var i;
    var k;
    for (i = 0; i < DOWNLOADS.length; i++) {
      if (DOWNLOADS[i].url === url) return DOWNLOADS[i];
    }
    var u = normalize(url);
    if (!u) return null;
    for (i = 0; i < DOWNLOADS.length; i++) {
      var dl = DOWNLOADS[i];
      if (normalize(dl.url).indexOf(u) !== -1) return dl;
      for (k = 0; k < dl.keys.length; k++) {
        if (u === normalize(dl.keys[k]) || dl.keys[k].indexOf(u) !== -1 || u.indexOf(dl.keys[k]) !== -1) return dl;
      }
    }
    return null;
  }

  function buildGroqTools() {
    var pageHrefs = [];
    var i;
    for (i = 0; i < SITE_MAP.length; i++) pageHrefs.push(SITE_MAP[i].href);
    var linkUrls = [];
    for (i = 0; i < DOWNLOADS.length; i++) linkUrls.push(DOWNLOADS[i].url);

    return [
      {
        type: 'function',
        function: {
          name: 'navigate',
          description:
            'Open a page of the Ice Labs website in the current tab. Use this whenever the user wants to go somewhere on the site.',
          parameters: {
            type: 'object',
            properties: {
              page: { type: 'string', enum: pageHrefs, description: 'The site page to open.' },
            },
            required: ['page'],
            additionalProperties: false,
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'open_link',
          description: 'Open an external Ice Labs link (downloads and store pages) in a new tab.',
          parameters: {
            type: 'object',
            properties: {
              url: { type: 'string', enum: linkUrls, description: 'The external URL to open.' },
            },
            required: ['url'],
            additionalProperties: false,
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'set_glass_intensity',
          description:
            'Set the Liquid Glass intensity of the site theme. 0 is flat and solid, 100 is full blur, shine, and mesh background. Apply it right away.',
          parameters: {
            type: 'object',
            properties: {
              percent: { type: 'number', description: 'The new intensity from 0 to 100.' },
            },
            required: ['percent'],
            additionalProperties: false,
          },
        },
      },
    ];
  }

  function buildSystemPrompt() {
    var pages = [];
    var i;
    for (i = 0; i < SITE_MAP.length; i++) {
      pages.push(SITE_MAP[i].label + ' (' + SITE_MAP[i].href + ')');
    }
    var links = [];
    for (i = 0; i < DOWNLOADS.length; i++) {
      links.push(DOWNLOADS[i].label + ' (' + DOWNLOADS[i].url + ')');
    }
    return (
      'You are Ice Guide, a friendly assistant embedded on the Ice Labs website. ' +
      'You help visitors move around the site, reach downloads, and change how the site looks. ' +
      'Pages you can open: ' + pages.join('; ') + '. ' +
      'External links you can open: ' + links.join('; ') + '. ' +
      'The current Liquid Glass intensity is ' + Math.round(glassPercent) + ' out of 100. ' +
      'When the user asks to change the glass, transparency, blur, or intensity, call set_glass_intensity with the new absolute value from 0 to 100, ' +
      'then mention the value you set in your reply. For relative requests like "make it more glassy" or "turn it down a bit", pick a sensible value yourself. ' +
      'When the user wants a page or a download, call navigate or open_link instead of just telling them where to click. ' +
      'Keep replies short, warm, and conversational: one to three sentences. ' +
      'You are powered by Groq.'
    );
  }

  function askGroq(userText) {
    var history = loadChatHistory().concat([{ role: 'user', content: userText }]);
    return fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + GROQ_API_KEY,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'system', content: buildSystemPrompt() }].concat(history),
        tools: buildGroqTools(),
        tool_choice: 'auto',
      }),
    })
      .then(function (res) {
        if (!res.ok) throw new Error('Groq request failed with status ' + res.status);
        return res.json();
      })
      .then(function (data) {
        var msg = data && data.choices && data.choices[0] && data.choices[0].message;
        if (!msg) throw new Error('Empty Groq response');
        if (msg.reasoning) delete msg.reasoning;
        return msg;
      });
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
      '<p class="settings-hint">0% is flat and solid; 100% is full blur, shine, and mesh background. Your choice is remembered with a cookie.</p>' +
      '<button type="button" class="settings-close" id="settings-close-btn">Done</button>';

    document.body.appendChild(backdrop);
    document.body.appendChild(sheet);

    var slider = document.getElementById('glass-intensity-slider');
    var valueOut = document.getElementById('glass-intensity-value');
    if (valueOut) valueOut.textContent = String(Math.round(glassPercent));
    if (slider) slider.value = String(Math.round(glassPercent));
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
      '<div><h2>Ice Guide</h2><span>Groq-powered help with pages, downloads, and glass</span></div>' +
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
    var history = loadChatHistory();
    if (history.length) {
      var start = Math.max(0, history.length - 8);
      for (var h = start; h < history.length; h++) {
        appendMessage(history[h].role === 'user' ? 'user' : 'bot', history[h].content);
      }
    } else {
      appendMessage(
        'bot',
        'Hi! I\'m Ice Guide, powered by Groq. Try "Go to blog", "Round Runners requirements", or "Set glass intensity to 40".'
      );
    }

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
      setOrbState('is-listening');
      askGroq(text)
        .then(function (msg) {
          setOrbState('');
          handleAssistantMessage(text, msg);
        })
        .catch(function () {
          setOrbState('');
          handleLocalCommand(text);
        });
    }

    function handleAssistantMessage(userText, msg) {
      var actions = runToolCalls(msg.tool_calls);
      var text = typeof msg.content === 'string' ? msg.content.trim() : '';
      if (!text) text = actions.summary || 'Done.';

      var history = loadChatHistory();
      history.push({ role: 'user', content: userText });
      history.push({ role: 'assistant', content: text });
      saveChatHistory(history);

      appendMessage('bot', text);

      if (actions.link) {
        speak(text);
        window.open(actions.link.url, '_blank', 'noopener,noreferrer');
      }

      if (actions.nav) {
        var href = actions.nav.href;
        var utter = speak(text);
        if (utter) {
          setOrbState('is-speaking');
          utter.onend = function () {
            setOrbState('');
            window.location.href = href;
          };
        } else {
          setTimeout(function () {
            window.location.href = href;
          }, 600);
        }
        return;
      }

      if (!actions.link) {
        var u = speak(text);
        if (u) {
          setOrbState('is-speaking');
          u.onend = function () {
            setOrbState('');
          };
        }
      }
    }

    function runToolCalls(toolCalls) {
      var actions = { nav: null, link: null, summary: '' };
      if (!toolCalls || !toolCalls.length) return actions;

      for (var i = 0; i < toolCalls.length; i++) {
        var call = toolCalls[i];
        var name = call && call.function && call.function.name;
        var args = {};
        try {
          args = JSON.parse((call && call.function && call.function.arguments) || '{}');
        } catch (e) {}

        if (name === 'navigate') {
          var page = resolvePage(args.page);
          if (page) {
            actions.nav = page;
            if (!actions.summary) actions.summary = 'Opening ' + page.label + '.';
          }
        } else if (name === 'open_link') {
          var dl = resolveLink(args.url);
          if (dl) {
            actions.link = dl;
            if (!actions.summary) actions.summary = 'Opening ' + dl.label + ' in a new tab.';
          }
        } else if (name === 'set_glass_intensity') {
          var p = Math.round(Number(args.percent));
          if (!Number.isNaN(p)) {
            setGlassIntensity(p);
            if (!actions.summary) actions.summary = 'Liquid Glass intensity set to ' + Math.max(0, Math.min(100, p)) + '%.';
          }
        }
      }
      return actions;
    }

    function handleLocalCommand(text) {
      var result = findNavTarget(text) || {
        type: 'text',
        message: 'I\'m not sure about that. Try "Go to mods", "Ice Tag requirements", or "Download Round Runners".',
      };
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
    buildSettingsUI();
    loadGlassIntensity();
    injectNavSettings();
    buildGuideUI();
    shortenNavLabels();
    window.addEventListener('pageshow', function () {
      loadGlassIntensity();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
