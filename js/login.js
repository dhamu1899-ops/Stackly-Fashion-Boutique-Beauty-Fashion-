/* =============================================================================
   STACKLY — login page behaviour
   - email / password fields become typeable (design placeholder shows until focus)
   - eye toggle shows / hides the password
   - password hint icons light up green as each rule passes
   - user / Admin role boxes select
   - Login validates and routes to the role-based dashboard; "Register here" -> sign up
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

    /* email = top field, password = .lg__field--pw, the two at y~696 = roles */
    var emailF = null, pwF = null, roles = [];
    fields.forEach(function (f) {
      if (f.classList.contains("lg__field--pw")) pwF = f;
      else if (f.offsetTop > 650) roles.push(f);
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

    /* ---------- role selection ---------- */
    var roleSelected = null;
    roles.forEach(function (f) {
      var cs = getComputedStyle(f);
      var baseBorder = cs.borderColor, baseBg = cs.backgroundColor;
      f.style.cursor = "pointer";
      f.addEventListener("click", function () {
        if (roleSelected && roleSelected.f !== f) {
          roleSelected.f.style.borderColor = roleSelected.baseBorder;
          roleSelected.f.style.backgroundColor = roleSelected.baseBg;
        }
        var on = roleSelected && roleSelected.f === f;
        if (on) {
          f.style.borderColor = baseBorder;
          f.style.backgroundColor = baseBg;
          roleSelected = null;
        } else {
          f.style.borderColor = "#8b4513";
          f.style.backgroundColor = "#f7efe6";
          roleSelected = { f: f, baseBorder: baseBorder, baseBg: baseBg };
        }
      });
    });

    /* ---------- submit ---------- */
    function submit() {
      var email = emailInp ? emailInp.value.trim() : "";
      var pw = pwInp ? pwInp.value : "";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { S.toast("Please enter a valid email address"); return; }
      var fail = -1;
      rules.forEach(function (r, i) { if (fail < 0 && !r(pw)) fail = i; });
      if (fail >= 0) {
        var msgs = ["Minimum 8 characters", "Must contain at least 1 number",
          "Must contain 1 capital and 1 small case", "Must contain at least 1 symbol"];
        S.toast("Password: " + msgs[fail]);
        return;
      }
      /* signed in — open the role-based dashboard (user / Admin) */
      try { localStorage.setItem("stacklyUser", email); } catch (e) {}
      var role = "user";
      if (roleSelected) {
        var rPh = roleSelected.f.querySelector(".lg__ph");
        var rTxt = rPh ? rPh.textContent.trim().toLowerCase() : "";
        if (rTxt === "admin") role = "admin";
      }
      S.toast("Welcome back!");
      try { localStorage.setItem("stacklyRole", role); } catch (e) {}
      setTimeout(function () { S.go("dashboard.html?role=" + role); }, 700);
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
