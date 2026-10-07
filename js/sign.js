/* =============================================================================
   STACKLY — sign up page behaviour
   - email / name / password fields become typeable (design placeholder stays until focus)
   - eye toggles on the password-style boxes
   - user / Admin role boxes select
   - "Sign in" validates (email + password rules + match) and registers the
     account so the login page can verify it (always as a customer —
     public sign-up can not pick the Admin role)
   - "Login here" -> login page
============================================================================= */
(function () {
  "use strict";

  function boot() {
    var S = window.STACKLY;
    if (!S) return;

    var fields = [].slice.call(document.querySelectorAll(".sg-field"));

    /* plain field = email (top), --pw fields = name / password / new password,
       the two boxes under "Select role" are recognised by their own text so
       they keep working when the mobile layout reflows the design canvas */
    var emailF = null, pwStyle = [], roles = [];
    fields.forEach(function (f) {
      var ph = f.querySelector(".sg-ph");
      var t = ph ? ph.textContent.trim().toLowerCase() : "";
      if (t === "user" || t === "admin") roles.push(f);
      else if (f.classList.contains("sg-field--pw")) pwStyle.push(f);
      else if (!emailF) emailF = f;
    });
    pwStyle.sort(function (a, b) { return a.offsetTop - b.offsetTop; });

    var emailInp = emailF ? S.overlayInput(emailF, {
      placeholderEl: emailF.querySelector(".sg-ph"), type: "email", aria: "Email"
    }) : null;

    /* name box shows design's ******** (label says Name -> treat as text),
       the two password boxes are real password inputs */
    var nameInp = pwStyle[0] ? S.overlayInput(pwStyle[0], {
      placeholderEl: pwStyle[0].querySelector(".sg-ph"), type: "text", aria: "Name", insetRight: 44
    }) : null;
    var pwInp = pwStyle[1] ? S.overlayInput(pwStyle[1], {
      placeholderEl: pwStyle[1].querySelector(".sg-ph"), type: "password", aria: "Password", insetRight: 44
    }) : null;
    var pw2Inp = pwStyle[2] ? S.overlayInput(pwStyle[2], {
      placeholderEl: pwStyle[2].querySelector(".sg-ph"), type: "password", aria: "New password", insetRight: 44
    }) : null;

    /* ---------- eye toggles ---------- */
    pwStyle.forEach(function (f, i) {
      var eye = f.querySelector(".sg-eye");
      var inp = [nameInp, pwInp, pw2Inp][i];
      if (!eye || !inp) return;
      eye.style.cursor = "pointer";
      var slash = eye.querySelector('path[d="M21 21l-3.75-3.75"]');
      eye.addEventListener("click", function () {
        var show = inp.type === "password";
        inp.type = show ? "text" : "password";
        if (slash) slash.style.display = show ? "none" : "";
        inp.focus();
      });
    });

    /* ---------- role selection ----------
       QA FB-004: a public sign-up may not create or select an administrator.
       The Admin box can not be picked and signUp() always stores role "user"
       anyway, so the privileged role is unreachable from this form. */
    var roleSelected = null;
    roles.forEach(function (f) {
      var cs = getComputedStyle(f);
      var baseBorder = cs.borderColor, baseBg = cs.backgroundColor, baseShadow = cs.boxShadow;
      var sib = f.nextElementSibling;
      var rPh = f.querySelector(".sg-ph") ||
        (sib && sib.classList && sib.classList.contains("sg-ph") ? sib : null);
      var isAdminBox = !!(rPh && rPh.textContent.trim().toLowerCase() === "admin");
      f.style.cursor = "pointer";
      f.addEventListener("click", function () {
        if (isAdminBox) {
          S.toast("Public sign-up creates a customer account — admin roles are assigned by an administrator");
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
       QA FB-001 / FB-004: the form creates a real account record (role is
       always "user"), so the login page has something to verify against. */
    function submit() {
      var name = nameInp ? nameInp.value.trim() : "";
      var email = emailInp ? emailInp.value.trim() : "";
      var pw = pwInp ? pwInp.value : "";
      var pw2 = pw2Inp ? pw2Inp.value : "";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { S.toast("Please enter a valid email address"); return; }
      if (pw.length < 8) { S.toast("Password: minimum 8 characters"); return; }
      if (!/\d/.test(pw)) { S.toast("Password: must contain at least 1 number"); return; }
      if (!/[A-Z]/.test(pw) || !/[a-z]/.test(pw)) { S.toast("Password: needs 1 capital and 1 small case"); return; }
      if (!/[^A-Za-z0-9]/.test(pw)) { S.toast("Password: must contain at least 1 symbol"); return; }
      if (pw !== pw2) { S.toast("Passwords do not match"); return; }
      /* name is optional — fall back to the part before the @ */
      var res = S.signUp(name || email.split("@")[0], email, pw);
      S.toast(res.msg);
      if (!res.ok) return;
      setTimeout(function () { S.go("login.html"); }, 900);
    }

    var btn = document.querySelector(".sg-btn");
    if (btn) btn.addEventListener("click", function () { submit(); });
    document.querySelectorAll(".sg-field input").forEach(function (el) {
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter") { e.preventDefault(); submit(); }
      });
    });

    /* ---------- forget password (no reset flow yet — stay on the page) ---------- */
    var fp = document.querySelector(".sg-fp");
    if (fp) fp.addEventListener("click", function (e) {
      e.preventDefault();
      S.toast("Password reset is coming soon — please contact support for now");
    });

    /* ---------- login link ---------- */
    var foot = document.querySelector(".sg-foot");
    if (foot) {
      foot.style.cursor = "pointer";
      foot.addEventListener("click", function () { S.go("login.html"); });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
