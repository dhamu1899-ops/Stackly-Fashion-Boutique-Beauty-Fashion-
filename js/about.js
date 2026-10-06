/* =============================================================================
   STACKLY — about page behaviour
   - "Visit store"-style CTA links (href="#") -> shop
   - category / featured-blog image boxes -> shop / blog
   (search box, header icons and footer are handled by script.js)
============================================================================= */
(function () {
  "use strict";
  function boot() {
    var S = window.STACKLY;
    if (!S) return;

    /* generic CTA anchors on this page (class-less href="#") -> shop */
    document.querySelectorAll("main a[href='#'], .canvas > a[href='#']").forEach(function (a) {
      a.addEventListener("click", function (e) { e.preventDefault(); S.go("shop.html"); });
    });

    /* category thumbs (about-6..11) -> shop */
    document.querySelectorAll("[data-img^='about-']").forEach(function (el) {
      var key = el.getAttribute("data-img");
      var n = parseInt(key.split("-")[1], 10);
      if (n >= 6 && n <= 11) {
        el.style.cursor = "pointer";
        el.addEventListener("click", function () { S.go("shop.html"); });
      }
      /* featured blog photos -> blog */
      if (n === 15 || n === 16) {
        el.style.cursor = "pointer";
        el.addEventListener("click", function () { S.go("blog.html"); });
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
