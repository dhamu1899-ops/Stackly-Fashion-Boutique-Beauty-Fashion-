/* =============================================================================
   STACKLY — login page behaviour
   - email / password fields become typeable (design placeholder shows until focus)
   - eye toggle shows / hides the password
   - password hint icons light up green as each rule passes
   - role boxes select (Admin is not pickable here — see FB-002)
   - Login verifies email + password against the registered account
     (STACKLY.signIn) and routes to the session's dashboard;
     "Register here" -> sign up
   - "Forget Password ?" -> on-page toast (no reset flow exists yet)
============================================================================= */
(function () {
  "use strict";

  function boot() {
    var S = window.STACKLY;
    if (!S) return;

    var fields = [].slice.call(document.querySelectorAll(".lg__field"));
    var phs = [].slice.call(document.querySelectorAll(".lg__ph"));

    /* pair each empty field with the design placeholder sitting over it */
    function phFor(field) {
      var best = null, bd = 1e9;
      phs.forEach(function (ph) {
        if (ph.parentElement === field) { if (!best) best = ph; return; }
        var dt = Math.abs(ph.offsetTop - field.offsetTop);
        var inX = ph.offsetLeft >= field.offsetLeft && ph.offsetLeft < field.offsetLeft + field.offsetWidth;
        if (dt <= 40 && inX && dt < bd) { bd = dt; best = ph; }
      });
      return best;
    }

    /* email = top field, password = .lg__field--pw, the two boxes under
       "Select role" are recognised by their own placeholder text (the
       placeholder is a SIBLING span, so it is paired geometrically with
       phFor). Reading the text instead of an offset keeps the boxes — and
       the email field — classified correctly when the mobile layout
       restacks the design canvas (offsets change there). */
    var emailF = null, pwF = null, roles = [];
    fields.forEach(function (f) {
      var ph = phFor(f);
      var t = ph ? ph.textContent.trim().toLowerCase() : "";
      if (f.classList.contains("lg__field--pw")) pwF = f;
      else if (t === "user" || t === "admin") roles.push(f);
      else if (!emailF || f.offsetTop < emailF.offsetTop) emailF = f;
    });

    var emailInp = emailF ? S.overlayInput(emailF, { placeholderEl: phFor(emailF), type: "email", aria: "Email" }) : null;
    var pwInp = pwF ? S.overlayInput(pwF, { placeholderEl: phFor(pwF), type: "password", aria: "Password", insetRight: 40 }) : null;

    /* ---------- eye toggle (sits next to the password box) ---------- */
    var eye = document.querySelector(".lg__eye");
    if (eye && pwInp) {
      eye.style.cursor = "pointer";
      var slash = eye.querySelector('path[d="M4 20L20 4"]');
      eye.addEventListener("click", function () {
        var show = pwInp.type === "password";
        pwInp.type = show ? "text" : "password";
        if (slash) slash.style.display = show ? "none" : "";
        pwInp.focus();
      });
    }

    /* ---------- live password hints ---------- */
    var hintIcons = [].slice.call(document.querySelectorAll(".lg__hint-ic"));
    var rules = [
      function (v) { return v.length >= 8; },
      function (v) { return /\d/.test(v); },
      function (v) { return /[A-Z]/.test(v) && /[a-z]/.test(v); },
      function (v) { return /[^A-Za-z0-9]/.test(v); }
    ];
    function paintHints() {
      var v = pwInp ? pwInp.value : "";
      hintIcons.forEach(function (ic, i) {
        var svg = ic.querySelector("svg");
        if (!svg || !rules[i]) return;
        svg.style.fill = rules[i](v) ? "#2fa84f" : "#787878";
      });
    }
    if (pwInp) {
      pwInp.addEventListener("input", paintHints);
      pwInp.addEventListener("keyup", paintHints);
    }

    /* ---------- role selection ----------
       QA FB-002: the login form must not hand out administrator access.
       The Admin box can no longer be picked here and, even if it could,
       submit() takes the role from the verified account (STACKLY.signIn).
       The selected state is painted with the box's own inset stroke as well
       as the border colour: the responsive sheet pins border/background with
       !important, so border-colour alone would show nothing when picked. */
    var roleSelected = null;
    roles.forEach(function (f) {
      var cs = getComputedStyle(f);
      var baseBorder = cs.borderColor, baseBg = cs.backgroundColor, baseShadow = cs.boxShadow;
      var rPh = phFor(f);
      var isAdminBox = !!(rPh && rPh.textContent.trim().toLowerCase() === "admin");
      f.style.cursor = "pointer";
      f.addEventListener("click", function () {
        if (isAdminBox) {
          S.toast("Administrator access can only be granted to an authorized admin account");
          return;
        }
        if (roleSelected && roleSelected.f !== f) {
          roleSelected.f.style.borderColor = roleSelected.baseBorder;
          roleSelected.f.style.backgroundColor = roleSelected.baseBg;
          roleSelected.f.style.boxShadow = roleSelected.baseShadow;
        }
        var on = roleSelected && roleSelected.f === f;
        if (on) {
          f.style.borderColor = baseBorder;
          f.style.backgroundColor = baseBg;
          f.style.boxShadow = baseShadow;
          roleSelected = null;
        } else {
          f.style.borderColor = "#8b4513";
          f.style.backgroundColor = "#f7efe6";
          f.style.boxShadow = "inset 0 0 0 1px #8b4513";
          roleSelected = { f: f, baseBorder: baseBorder, baseBg: baseBg, baseShadow: baseShadow };
        }
      });
    });

    /* ---------- submit ----------
       QA FB-001: the password is checked against the registered account,
       not against the password rules shown on the page. */
    function submit() {
      var email = emailInp ? emailInp.value.trim() : "";
      var pw = pwInp ? pwInp.value : "";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { S.toast("Please enter a valid email address"); return; }
      var res = S.signIn(email, pw);
      if (!res.ok) { S.toast(res.msg); return; }
      S.toast("Welcome back!");
      setTimeout(function () { S.go("dashboard.html"); }, 700);
    }

    var btn = document.querySelector(".lg__btn");
    var btnLabel = document.querySelector(".lg__btn-label");
    var btnArrow = document.querySelector(".lg__btn-arrow");
    [btn, btnLabel, btnArrow].forEach(function (el) {
      if (!el) return;
      el.style.cursor = "pointer";
      el.addEventListener("click", function (e) { e.preventDefault(); submit(); });
    });
    document.querySelectorAll(".lg__field input").forEach(function (el) {
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter") { e.preventDefault(); submit(); }
      });
    });

    /* ---------- forget password (no reset flow yet — stay on the page) ---------- */
    var fp = document.querySelector(".lg__fp");
    if (fp) fp.addEventListener("click", function (e) {
      e.preventDefault();
      S.toast("Password reset is coming soon — please contact support for now");
    });

    /* ---------- register link ---------- */
    var reg = document.querySelector(".lg__register");
    if (reg) {
      reg.style.cursor = "pointer";
      reg.addEventListener("click", function () { S.go("sign.html"); });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
