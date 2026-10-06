/* =============================================================================
   STACKLY — product listing page behaviour
   - product cards -> product details
   - rating badges keep their star (static)
   (search box, header icons and footer are handled by script.js)
============================================================================= */
(function () {
  "use strict";
  function boot() {
    var S = window.STACKLY;
    if (!S) return;

    document.querySelectorAll(".product").forEach(function (card) {
      card.style.cursor = "pointer";
      card.addEventListener("click", function () { S.goProduct(card); });
    });

    /* any "load more"-style plain CTA on this page -> shop grid stays put */
    document.querySelectorAll("main a[href='#'], .canvas > a[href='#']").forEach(function (a) {
      a.addEventListener("click", function (e) { e.preventDefault(); S.go("shop.html"); });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
