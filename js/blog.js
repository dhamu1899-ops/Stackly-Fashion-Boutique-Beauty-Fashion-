/* =============================================================================
   STACKLY — blog page behaviour
   - post cards + "More to Explore" tiles -> open the featured article
   - explore tiles (Our Product / Our Stores / Our Careers) -> shop / about
   (search box, header icons, socials and footer are handled by script.js)
============================================================================= */
(function () {
  "use strict";
  function boot() {
    var S = window.STACKLY;
    if (!S) return;

    /* the page's own article starts at the hero band */
    function toArticle() {
      var hero = document.querySelector(".bl-hero");
      if (hero) hero.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    /* the three post cards reopen the featured article */
    document.querySelectorAll(".bl-card").forEach(function (card) {
      card.style.cursor = "pointer";
      card.addEventListener("click", toArticle);
    });

    /* More to Explore: image 7/8/9 (34/508/982) -> product, stores -> about, careers -> contact */
    var explore = [
      { sel: "[data-img='blog-7']", url: "shop.html" },
      { sel: "[data-img='blog-8']", url: "about.html" },
      { sel: "[data-img='blog-9']", url: "contact.html" }
    ];
    explore.forEach(function (x) {
      var el = document.querySelector(x.sel);
      if (!el) return;
      el.style.cursor = "pointer";
      el.addEventListener("click", function () { S.go(x.url); });
    });
    document.querySelectorAll(".bl-label").forEach(function (lbl, i) {
      lbl.style.cursor = "pointer";
      lbl.addEventListener("click", function () { S.go(explore[i] ? explore[i].url : "shop.html"); });
    });

    /* The source DOM lists the three explore images first and the three
       captions second, so a single-column reflow shows every picture before
       any caption. Move each label right below its own image (Our Product →
       blog-7, Our Stores → blog-8, Our Careers → blog-9). Desktop renders
       each caption from its design coordinate in the css cascade, so
       document order never changes pixels above 991px. */
    var exImgs = document.querySelectorAll("[data-img='blog-7'],[data-img='blog-8'],[data-img='blog-9']");
    var exLbls = document.querySelectorAll(".bl-label");
    Array.prototype.forEach.call(exLbls, function (lbl, i) {
      var img = exImgs[i];
      if (img && lbl.previousElementSibling !== img) {
        img.parentNode.insertBefore(lbl, img.nextSibling);
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
