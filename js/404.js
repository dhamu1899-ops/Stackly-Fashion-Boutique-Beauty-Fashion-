/* =============================================================================
   STACKLY — 404 page behaviour
   - the whole "Back To Home" pill (label sits over the link) navigates
   - Enter / Esc anywhere jumps back to the home page
============================================================================= */
(function () {
  "use strict";

  function boot() {
    var S = window.STACKLY;
    if (!S) return;

    function home() { S.go("index.html"); }

    var label = document.querySelector(".pg404__btn-label");
    if (label) {
      label.style.cursor = "pointer";
      label.addEventListener("click", home);
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === "Escape") {
        var t = document.activeElement;
        if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
        home();
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
