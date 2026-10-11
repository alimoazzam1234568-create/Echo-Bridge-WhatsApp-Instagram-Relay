/* Echo Bridge — WhatsApp Web content script */
(function () {
  'use strict';
  if (window.__ECHO_WA__) return;
  window.__ECHO_WA__ = true;

  var CSS = ".fab{position:fixed;right:18px;bottom:18px;z-index:2147483646;padding:10px 16px;border:none;border-radius:999px;\nbackground:linear-gradient(135deg,#7c3aed,#d946ef 55%,#22d3ee);color:#fff;font:700 12px/1 Arial;letter-spacing:2px;\ncursor:pointer;box-shadow:0 8px 28px -6px rgba(168,85,247,.8);}\n.panel{position:fixed;right:18px;bottom:66px;z-index:2147483646;width:308px;max-height:74vh;overflow-y:auto;\nbackground:rgba(10,10,20,.97);border:1px solid rgba(255,255,255,.12);border-radius:18px;padding:14px;\ncolor:#f4f4f8;font:13px Arial;box-shadow:0 24px 60px -12px rgba(0,0,0,.8);backdrop-filter:blur(16px);}\n.hd{display:flex;align-items:center;gap:8px;margin-bottom:10px;}\n.hd b{font:700 11px Arial;letter-spacing:2px;}\n.plat{margin-left:auto;font:10px monospace;color:#a5b4fc;letter-spacing:1px;}\n.dot{width:8px;height:8px;border-radius:50%;background:#34d399;box-shadow:0 0 8px #34d399;}\n#close{border:none;background:rgba(255,255,255,.08);color:#fff;width:20px;height:20px;border-radius:6px;cursor:pointer;font-size:12px;line-height:1;}\n.btn{width:100%;padding:9px;border:none;border-radius:10px;font:700 11px Arial;letter-spacing:1.5px;cursor:pointer;margin:6px 0;}\n.ghost{background:rgba(255,255,255,.07);color:#c7d2fe;border:1px solid rgba(129,140,248,.35);}\n.ghost:hover{background:rgba(129,140,248,.18);}\n.go{background:linear-gradient(90deg,#7c3aed,#d946ef);color:#fff;box-shadow:0 6px 20px -6px rgba(217,70,239,.6);}\n.stop{background:linear-gradient(90deg,#e11d48,#f43f5e);color:#fff;}\n.list{margin:8px 0;max-height:150px;overflow-y:auto;border:1px solid rgba(255,255,255,.1);border-radius:10px;background:rgba(0,0,0,.35);}\n.item{display:flex;align-items:center;gap:8px;padding:7px 10px;font-size:12px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.05);}\n.item:hover{background:rgba(255,255,255,.05);}\n.item span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}\n.item input{accent-color:#a855f7;}\n.empty{padding:14px 10px;font-size:11px;color:rgba(255,255,255,.35);text-align:center;}\n.lbl{display:block;margin:8px 0 4px;font:9px monospace;letter-spacing:2px;color:rgba(255,255,255,.35);}\ntextarea{width:100%;box-sizing:border-box;resize:vertical;background:rgba(0,0,0,.4);border:1px solid rgba(255,255,255,.12);\nborder-radius:10px;color:#fff;padding:8px;font:12px Arial;outline:none;}\ntextarea:focus{border-color:rgba(217,70,239,.5);}\n.row{display:flex;gap:8px;margin-top:8px;}\n.field{flex:1;}\n.field label{display:block;font:8.5px monospace;letter-spacing:2px;color:rgba(255,255,255,.35);margin-bottom:3px;}\n.field input{width:100%;box-sizing:border-box;background:rgba(0,0,0,.4);border:1px solid rgba(255,255,255,.12);border-radius:8px;\ncolor:#fff;padding:7px 8px;font:12px monospace;outline:none;}\n.log{margin-top:8px;max-height:96px;overflow-y:auto;font:10px monospace;color:rgba(255,255,255,.5);background:rgba(0,0,0,.35);\nborder-radius:8px;padding:6px 8px;}\n.log div{padding:1px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}\n.ok{color:#6ee7b7;}.err{color:#fda4af;}";

  var host = document.createElement('div');
  host.id = 'echo-bridge-wa';
  document.documentElement.appendChild(host);
  var root = host.attachShadow({ mode: 'open' });

  root.innerHTML =
    '<style>' + CSS + '</style>' +
    '<button class="fab" id="fab">ECHO</button>' +
    '<div class="panel" id="panel" hidden>' +
      '<div class="hd"><span class="dot"></span><b>ECHO BRIDGE</b><span class="plat">WhatsApp</span><button id="close">x</button></div>' +
      '<button class="btn ghost" id="scan">SCAN MY CHATS &amp; GROUPS</button>' +
      '<div class="list" id="list"><div class="empty">Press scan — your chats appear here</div></div>' +
      '<label class="lbl">MESSAGES · ONE PER LINE · THEY ROTATE</label>' +
      '<textarea id="msg" rows="3" placeholder="hello&#10;welcome to the chat &#128293;"></textarea>' +
      '<div class="row">' +
        '<div class="field"><label>COUNT / CHAT</label><input id="count" type="number" min="1" max="500" value="10"></div>' +
        '<div class="field"><label>EVERY (MS)</label><input id="gap" type="number" min="600" step="100" value="1500"></div>' +
      '</div>' +
      '<button class="btn go" id="run">START BLASTING</button>' +
      '<div class="log" id="log"></div>' +
    '</div>';

  var qs = function (s) { return root.querySelector(s); };
  var panel = qs('#panel');
  var logEl = qs('#log');
  var runBtn = qs('#run');
  var running = false;
  var stopFlag = false;

  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function log(t, cls) {
    var d = document.createElement('div');
    if (cls) d.className = cls;
    d.textContent = t;
    logEl.appendChild(d);
    while (logEl.children.length > 40) logEl.removeChild(logEl.firstChild);
    logEl.scrollTop = logEl.scrollHeight;
  }

  qs('#fab').addEventListener('click', function () { panel.hidden = !panel.hidden; });
  qs('#close').addEventListener('click', function () { panel.hidden = true; });

  qs('#scan').addEventListener('click', function () {
    var nodes = document.querySelectorAll('#pane-side span[title]');
    var seen = {};
    var titles = [];
    nodes.forEach(function (n) {
      var t = n.getAttribute('title');
      if (t && !seen[t]) { seen[t] = 1; titles.push(t); }
    });
    titles = titles.slice(0, 80);
    var list = qs('#list');
    list.innerHTML = '';
    if (!titles.length) {
      list.innerHTML = '<div class="empty">No chats found — wait for WhatsApp to fully load</div>';
      log('nothing found yet — is the chat list visible?', 'err');
      return;
    }
    titles.forEach(function (t) {
      var row = document.createElement('label');
      row.className = 'item';
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.setAttribute('data-t', t);
      var sp = document.createElement('span');
      sp.textContent = t;
      row.appendChild(cb);
      row.appendChild(sp);
      list.appendChild(row);
    });
    log('found ' + titles.length + ' chats/groups — select targets', 'ok');
  });

  function clickRow(node) {
    ['mousedown', 'mouseup', 'click'].forEach(function (type) {
      node.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
    });
  }

  async function openChat(title) {
    var spans = document.querySelectorAll('#pane-side span[title]');
    var target = null;
    spans.forEach(function (n) {
      if (!target && n.getAttribute('title') === title) target = n;
    });
    if (!target) return false;
    var row = target.closest('[role="listitem"]') || target.closest('div[tabindex]') || target;
    clickRow(row);
    for (var i = 0; i < 12; i++) {
      await sleep(300);
      if (document.querySelector('footer [contenteditable="true"]')) return true;
    }
    return false;
  }

  async function typeAndSend(text) {
    var box = document.querySelector('footer [contenteditable="true"][data-tab]') ||
              document.querySelector('footer [contenteditable="true"]');
    if (!box) return false;
    box.focus();
    await sleep(80);
    document.execCommand('selectAll', false, null);
    document.execCommand('insertText', false, text);
    await sleep(160);
    var icon = document.querySelector('footer [data-icon="send"]') ||
               document.querySelector('span[data-icon="send"]');
    if (icon) {
      (icon.closest('button') || icon).click();
    } else {
      ['keydown', 'keypress', 'keyup'].forEach(function (type) {
        box.dispatchEvent(new KeyboardEvent(type, { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
      });
    }
    return true;
  }

  function setRunBtn() {
    runBtn.textContent = running ? 'STOP' : 'START BLASTING';
    runBtn.className = running ? 'btn stop' : 'btn go';
  }

  runBtn.addEventListener('click', async function () {
    if (running) { stopFlag = true; return; }
    var lines = qs('#msg').value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    var count = Math.min(500, Math.max(1, parseInt(qs('#count').value, 10) || 1));
    var gap = Math.max(600, parseInt(qs('#gap').value, 10) || 1500);
    var checks = root.querySelectorAll('#list input:checked');
    var targets = [];
    checks.forEach(function (c) { targets.push(c.getAttribute('data-t')); });
    if (!lines.length) { log('write at least one message', 'err'); return; }
    if (!targets.length) { log('select at least one chat', 'err'); return; }
    running = true; stopFlag = false; setRunBtn();
    var sent = 0;
    log('blasting ' + targets.length + ' chat(s) x ' + count + ' msg', 'ok');
    for (var c = 0; c < targets.length && !stopFlag; c++) {
      log('opening: ' + targets[c]);
      var opened = await openChat(targets[c]);
      if (!opened) { log('chat not visible: ' + targets[c], 'err'); continue; }
      for (var i = 0; i < count && !stopFlag; i++) {
        var ok = await typeAndSend(lines[i % lines.length]);
        if (ok) sent++;
        log('[' + (i + 1) + '/' + count + '] -> ' + targets[c]);
        await sleep(gap);
      }
    }
    log(stopFlag ? 'aborted — sent ' + sent : 'done — sent ' + sent + ' messages', stopFlag ? 'err' : 'ok');
    running = false; setRunBtn();
  });

  log('echo bridge ready on whatsapp', 'ok');
})();
