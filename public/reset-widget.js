// =============================================================
// BLOOD BIKE WEST — SHARED PASSWORD RESET WIDGET
//
// Single source of truth for the reset UI/logic across every app in the
// suite. Host apps just add data-bbw-reset-trigger to whatever element
// should open it (a "Forgot password?" link, typically) — no other
// wiring needed. Loaded via a plain <script src> tag, so it works
// cross-origin regardless of which app is hosting it.
//
// Backend: the dedicated Reference Auth Service (its own Apps Script
// project, NOT Rota's or CC's own backend) — the one place
// loginWithReference / sendResetCode / verifyResetCode / updateReference
// actually live now.
// =============================================================

(function () {
  var SERVICE_URL = 'https://script.google.com/macros/s/AKfycbzKHHqSi2pEunRUkDRfrbMx66VlQg9wwqQMSo-6f5rRAkA_UP9aDuxkuC9aMyYZHZ5X/exec';

  function normalizePhone(p) { return String(p).replace(/[\s\-()+]/g, '').trim(); }

  function serviceApi(action, params) {
    var url = new URL(SERVICE_URL);
    url.searchParams.set('action', action);
    Object.keys(params || {}).forEach(function (k) { url.searchParams.set(k, params[k]); });
    return fetch(url.toString(), { method: 'GET' }).then(function (res) { return res.text(); }).then(function (text) {
      try { return JSON.parse(text); } catch (e) { throw new Error('Invalid response from server: ' + text.slice(0, 100)); }
    });
  }
  function sendResetCode(phone)                { return serviceApi('sendResetCode', { phone: phone }); }
  function verifyResetCode(phone, code)        { return serviceApi('verifyResetCode', { phone: phone, code: code }); }
  function updateReference(phone, resetToken, newPassword) { return serviceApi('updateReference', { phone: phone, resetToken: resetToken, newPassword: newPassword }); }

  // ── Styles (scoped under .bbw-reset-*, safe to drop into any host page) ──
  var STYLE = '\
.bbw-reset-overlay{position:fixed;inset:0;background:rgba(11,31,58,0.65);z-index:999999;display:flex;align-items:center;justify-content:center;padding:1.5rem;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;}\
.bbw-reset-overlay[hidden]{display:none!important;}\
.bbw-reset-card{width:100%;max-width:380px;background:#fff;border-radius:14px;padding:2rem 1.75rem 1.75rem;box-shadow:0 24px 60px rgba(0,0,0,0.35);position:relative;text-align:center;box-sizing:border-box;}\
.bbw-reset-card *{box-sizing:border-box;}\
.bbw-reset-close{position:absolute;top:0.9rem;right:0.9rem;background:none;border:none;font-size:1.3rem;line-height:1;cursor:pointer;color:#5B6572;padding:0.2rem;}\
.bbw-reset-eyebrow{font-size:11px;font-weight:600;letter-spacing:0.1em;color:#B01F2E;margin:0 0 8px;text-transform:uppercase;}\
.bbw-reset-title{font-family:"Barlow Condensed",sans-serif;font-weight:700;font-size:1.7rem;letter-spacing:-0.01em;margin:0 0 0.4rem;color:#0B1F3A;}\
.bbw-reset-sub{color:#5B6572;font-size:0.85rem;line-height:1.5;margin:0 0 1.1rem;}\
.bbw-reset-label{display:block;text-align:left;font-size:0.78rem;font-weight:600;color:#1B2430;margin:0 0 0.35rem;}\
.bbw-reset-input{width:100%;padding:0.65rem 0.8rem;margin-bottom:1rem;border:1px solid #E3DFD8;border-radius:8px;font-size:0.95rem;font-family:inherit;color:#1B2430;background:#F7F5F2;}\
.bbw-reset-input:focus{outline:none;border-color:#D62839;background:#fff;}\
.bbw-reset-code-input{font-size:1.3rem;text-align:center;letter-spacing:0.4em;}\
.bbw-reset-pwwrap{position:relative;}\
.bbw-reset-pwwrap .bbw-reset-input{padding-right:2.3rem;}\
.bbw-reset-pwtoggle{position:absolute;right:0.55rem;top:0.55rem;background:none;border:none;cursor:pointer;font-size:0.95rem;color:#5B6572;padding:0.2rem;}\
.bbw-reset-btn{width:100%;background:#D62839;color:#fff;border:none;padding:0.8rem;border-radius:8px;font-weight:700;font-size:1rem;cursor:pointer;margin-bottom:0.6rem;}\
.bbw-reset-btn:disabled{background:#e3b3ba;cursor:default;}\
.bbw-reset-back{display:block;width:100%;background:none;border:none;color:#5B6572;font-size:0.82rem;cursor:pointer;text-align:center;font-family:inherit;padding:0.3rem;}\
.bbw-reset-back:hover{color:#B01F2E;}\
.bbw-reset-msg{border-radius:8px;padding:0.55rem 0.8rem;font-size:0.83rem;margin:0 0 1rem;text-align:left;}\
.bbw-reset-msg-error{background:#FCEBEB;color:#B01F2E;border:1px solid #f3c9cd;}\
.bbw-reset-msg-info{background:#E9F7EF;color:#1a6b42;border:1px solid #bfe8d1;}\
.bbw-reset-checklist{background:#F7F5F2;border:1px solid #E3DFD8;border-radius:8px;padding:0.7rem 0.85rem;margin-bottom:1rem;text-align:left;}\
.bbw-reset-checklist-title{font-size:0.65rem;font-weight:700;letter-spacing:0.08em;color:#5B6572;margin:0 0 0.45rem;}\
.bbw-reset-check{display:flex;align-items:center;gap:0.5rem;margin-bottom:0.25rem;font-size:0.78rem;color:#5B6572;}\
.bbw-reset-check:last-child{margin-bottom:0;}\
.bbw-reset-check.met{color:#1a6b42;font-weight:600;}\
';

  function injectStyle() {
    if (document.getElementById('bbw-reset-style')) return;
    var s = document.createElement('style');
    s.id = 'bbw-reset-style';
    s.textContent = STYLE;
    document.head.appendChild(s);

    if (!document.getElementById('bbw-reset-font')) {
      var link = document.createElement('link');
      link.id = 'bbw-reset-font';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700&display=swap';
      document.head.appendChild(link);
    }
  }

  // ── Build the overlay DOM once ──
  var overlay, card;
  var screens = {};
  var state = { phone: '', resetToken: '' };

  var PW_CHECKS = [
    { key: 'len',     label: 'At least 8 characters',          test: function (p) { return p.length >= 8; } },
    { key: 'upper',   label: 'At least one uppercase letter',  test: function (p) { return /[A-Z]/.test(p); } },
    { key: 'lower',   label: 'At least one lowercase letter',  test: function (p) { return /[a-z]/.test(p); } },
    { key: 'number',  label: 'At least one number',            test: function (p) { return /[0-9]/.test(p); } },
    { key: 'special', label: 'At least one special character', test: function (p) { return /[^A-Za-z0-9]/.test(p); } }
  ];
  function validatePassword(p) { return PW_CHECKS.every(function (c) { return c.test(p); }); }

  function buildOverlay() {
    if (overlay) return;
    injectStyle();

    overlay = document.createElement('div');
    overlay.className = 'bbw-reset-overlay';
    overlay.hidden = true;

    var checklistRows = PW_CHECKS.map(function (c) {
      return '<div class="bbw-reset-check" data-check="' + c.key + '"><span class="bbw-reset-check-mark">○</span><span>' + c.label + '</span></div>';
    }).join('');

    overlay.innerHTML =
      '<div class="bbw-reset-card">' +
        '<button type="button" class="bbw-reset-close" aria-label="Close">×</button>' +
        '<p class="bbw-reset-eyebrow">BloodBikeWest</p>' +
        '<div id="bbw-reset-msg-slot"></div>' +

        '<div id="bbw-reset-screen-phone">' +
          '<p class="bbw-reset-title">Reset Password</p>' +
          '<p class="bbw-reset-sub">Enter your phone number and we\'ll send a reset code to your email address.</p>' +
          '<label class="bbw-reset-label" for="bbw-reset-phone">Phone Number</label>' +
          '<input id="bbw-reset-phone" class="bbw-reset-input" type="tel" placeholder="e.g. 087 123 4567" autocomplete="tel">' +
          '<button type="button" class="bbw-reset-btn" id="bbw-reset-send">Send Code</button>' +
        '</div>' +

        '<div id="bbw-reset-screen-code" hidden>' +
          '<p class="bbw-reset-title">Enter Code</p>' +
          '<p class="bbw-reset-sub">Enter the 6-digit code sent to your email. It expires in 10 minutes.</p>' +
          '<label class="bbw-reset-label" for="bbw-reset-code">6-digit code</label>' +
          '<input id="bbw-reset-code" class="bbw-reset-input bbw-reset-code-input" type="text" inputmode="numeric" maxlength="6">' +
          '<button type="button" class="bbw-reset-btn" id="bbw-reset-verify">Verify Code</button>' +
          '<button type="button" class="bbw-reset-back" data-goto="phone">← Resend code</button>' +
        '</div>' +

        '<div id="bbw-reset-screen-password" hidden>' +
          '<p class="bbw-reset-title">Set New Password</p>' +
          '<div class="bbw-reset-checklist"><p class="bbw-reset-checklist-title">PASSWORD REQUIREMENTS</p>' + checklistRows + '</div>' +
          '<label class="bbw-reset-label" for="bbw-reset-newpw">New Password</label>' +
          '<div class="bbw-reset-pwwrap"><input id="bbw-reset-newpw" class="bbw-reset-input" type="password">' +
            '<button type="button" class="bbw-reset-pwtoggle" data-target="bbw-reset-newpw">👁</button></div>' +
          '<label class="bbw-reset-label" for="bbw-reset-confirmpw">Confirm Password</label>' +
          '<div class="bbw-reset-pwwrap"><input id="bbw-reset-confirmpw" class="bbw-reset-input" type="password">' +
            '<button type="button" class="bbw-reset-pwtoggle" data-target="bbw-reset-confirmpw">👁</button></div>' +
          '<button type="button" class="bbw-reset-btn" id="bbw-reset-setpw">Set Password</button>' +
        '</div>' +

        '<div id="bbw-reset-screen-done" hidden>' +
          '<p class="bbw-reset-title">Password Updated</p>' +
          '<p class="bbw-reset-sub">You can now close this and sign in with your new password.</p>' +
          '<button type="button" class="bbw-reset-btn" id="bbw-reset-finish">Close</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);
    card = overlay.querySelector('.bbw-reset-card');

    screens = {
      phone:    overlay.querySelector('#bbw-reset-screen-phone'),
      code:     overlay.querySelector('#bbw-reset-screen-code'),
      password: overlay.querySelector('#bbw-reset-screen-password'),
      done:     overlay.querySelector('#bbw-reset-screen-done')
    };

    wireEvents();
  }

  function goTo(name) {
    Object.keys(screens).forEach(function (k) { screens[k].hidden = (k !== name); });
    clearMsg();
  }
  function msgSlot() { return overlay.querySelector('#bbw-reset-msg-slot'); }
  function showError(text) { msgSlot().innerHTML = '<p class="bbw-reset-msg bbw-reset-msg-error">' + text + '</p>'; }
  function showInfo(text)  { msgSlot().innerHTML = '<p class="bbw-reset-msg bbw-reset-msg-info">' + text + '</p>'; }
  function clearMsg()      { msgSlot().innerHTML = ''; }

  function open() {
    buildOverlay();
    state = { phone: '', resetToken: '' };
    overlay.querySelector('#bbw-reset-phone').value = '';
    overlay.querySelector('#bbw-reset-code').value = '';
    overlay.querySelector('#bbw-reset-newpw').value = '';
    overlay.querySelector('#bbw-reset-confirmpw').value = '';
    updateChecklist();
    goTo('phone');
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    overlay.querySelector('#bbw-reset-phone').focus();
  }
  function close() {
    overlay.hidden = true;
    document.body.style.overflow = '';
  }

  function updateChecklist() {
    var p = overlay.querySelector('#bbw-reset-newpw').value;
    PW_CHECKS.forEach(function (c) {
      var row = overlay.querySelector('.bbw-reset-check[data-check="' + c.key + '"]');
      var met = p.length > 0 && c.test(p);
      row.classList.toggle('met', met);
      row.querySelector('.bbw-reset-check-mark').textContent = met ? '✓' : '○';
    });
  }

  function wireEvents() {
    overlay.querySelector('.bbw-reset-close').addEventListener('click', close);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !overlay.hidden) close(); });

    overlay.querySelectorAll('.bbw-reset-back[data-goto]').forEach(function (btn) {
      btn.addEventListener('click', function () { goTo(btn.getAttribute('data-goto')); });
    });

    overlay.querySelectorAll('.bbw-reset-pwtoggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var input = overlay.querySelector('#' + btn.getAttribute('data-target'));
        var showing = input.type === 'text';
        input.type = showing ? 'password' : 'text';
        btn.textContent = showing ? '👁' : '🙈';
      });
    });

    overlay.querySelector('#bbw-reset-newpw').addEventListener('input', updateChecklist);

    // Step 1
    var sendBtn = overlay.querySelector('#bbw-reset-send');
    var phoneInput = overlay.querySelector('#bbw-reset-phone');
    function handleSend() {
      var phone = normalizePhone(phoneInput.value);
      clearMsg();
      if (!phone) { showError('Please enter your phone number.'); return; }
      sendBtn.disabled = true; sendBtn.textContent = 'Sending…';
      sendResetCode(phone).then(function (res) {
        if (res.error) throw new Error(res.error);
        state.phone = phone;
        goTo('code');
        showInfo('A 6-digit code has been sent to your email address.');
      }).catch(function (err) {
        showError(err.message || 'Could not connect to server. Please try again.');
      }).finally(function () { sendBtn.disabled = false; sendBtn.textContent = 'Send Code'; });
    }
    sendBtn.addEventListener('click', handleSend);
    phoneInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') handleSend(); });

    // Step 2
    var verifyBtn = overlay.querySelector('#bbw-reset-verify');
    var codeInput = overlay.querySelector('#bbw-reset-code');
    function handleVerify() {
      var code = codeInput.value.trim();
      clearMsg();
      if (!code) { showError('Please enter the code from your email.'); return; }
      verifyBtn.disabled = true; verifyBtn.textContent = 'Verifying…';
      verifyResetCode(state.phone, code).then(function (res) {
        if (!res.ok || !res.resetToken) throw new Error(res.error || 'Invalid code.');
        state.resetToken = res.resetToken;
        goTo('password');
      }).catch(function (err) {
        showError(err.message || 'Could not connect to server. Please try again.');
      }).finally(function () { verifyBtn.disabled = false; verifyBtn.textContent = 'Verify Code'; });
    }
    verifyBtn.addEventListener('click', handleVerify);
    codeInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') handleVerify(); });

    // Step 3
    var setBtn = overlay.querySelector('#bbw-reset-setpw');
    var newPw = overlay.querySelector('#bbw-reset-newpw');
    var confirmPw = overlay.querySelector('#bbw-reset-confirmpw');
    function handleSetPassword() {
      clearMsg();
      var p1 = newPw.value, p2 = confirmPw.value;
      if (!p1.trim())            { showError('Please enter a new password.'); return; }
      if (!validatePassword(p1)) { showError('Password does not meet the requirements above.'); return; }
      if (p1 !== p2)             { showError('Passwords do not match.'); return; }
      setBtn.disabled = true; setBtn.textContent = 'Please wait…';
      updateReference(state.phone, state.resetToken, p1).then(function (res) {
        if (!res.ok) throw new Error(res.error || 'Could not update password. Please try again.');
        goTo('done');
      }).catch(function (err) {
        showError(err.message || 'Could not connect to server. Please try again.');
      }).finally(function () { setBtn.disabled = false; setBtn.textContent = 'Set Password'; });
    }
    setBtn.addEventListener('click', handleSetPassword);
    confirmPw.addEventListener('keydown', function (e) { if (e.key === 'Enter') handleSetPassword(); });

    overlay.querySelector('#bbw-reset-finish').addEventListener('click', close);
  }

  function attachTriggers() {
    document.querySelectorAll('[data-bbw-reset-trigger]').forEach(function (el) {
      if (el.__bbwResetWired) return;
      el.__bbwResetWired = true;
      el.addEventListener('click', function (e) {
        e.preventDefault();
        open();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachTriggers);
  } else {
    attachTriggers();
  }

  // Expose in case a host page adds a trigger element dynamically later.
  window.BBWReset = { open: open, close: close, attachTriggers: attachTriggers };
})();
