/* =============================================================================
   STACKLY — index (home) page behaviour
   - scroll-down indicator -> categories section
   - hero "Get started" + promo "SHOP NOW" links -> shop
   - product cards -> product detail page
   - instagram strip -> blog
============================================================================= */
(function () {
  "use strict";
  function boot() {
    var S = window.STACKLY;
    if (!S) return;

    /* scroll-down indicator -> first category */
    var scroll = document.querySelector(".scroll");
    if (scroll) {
      scroll.style.cursor = "pointer";
      scroll.addEventListener("click", function () {
        var cat = document.querySelector('[data-img="catWoman"]');
        if (cat) cat.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    /* hero + promo CTAs -> shop */
    document.querySelectorAll(".hero__btn, .promo__link, .btn-more").forEach(function (a) {
      a.addEventListener("click", function (e) { e.preventDefault(); S.go("shop.html"); });
    });

    /* product cards -> product details (that product's data in the URL) */
    document.querySelectorAll(".product").forEach(function (card) {
      card.style.cursor = "pointer";
      card.addEventListener("click", function () { S.goProduct(card); });
    });

    /* instagram strip -> blog */
    document.querySelectorAll("[data-img^='ig']").forEach(function (el) {
      el.style.cursor = "pointer";
      el.addEventListener("click", function () { S.go("blog.html"); });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
