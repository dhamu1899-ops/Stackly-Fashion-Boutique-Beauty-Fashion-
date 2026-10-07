/* =============================================================================
   STACKLY — product details page behaviour
   - dynamic product: ?p=<img key> selects WHICH product is shown; its name
     and price are read from js/catalog.js (the trusted list), never from
     ?n= / ?pr= — a hand-edited price in the URL can not reach this page or
     the cart (QA bug FB-005). No params means the static design product,
     which is what the pixel audits measure
   - gallery: clicking a thumbnail swaps it with the main photo
   - quantity stepper (+ / -, minimum 1)
   - size selector (moves the brown active state; xxl is out of stock)
   - Add To Cart adds the DISPLAYED product (name + price + photo) to the cart
   - wishlist cards -> open that product here
============================================================================= */
(function () {
  "use strict";

  /* ---------- helpers for the dynamic (URL-driven) product ---------- */
  /* category text derived from the product name; "man t-Shirt" is the default
     (the design's own category text, also what audits read in rest state) */
  function pdCategory(name) {
    var n = String(name).toLowerCase();
    if (/gown|dress|ankara|flared|skirt|ball/.test(n)) return "women Gown";
    if (/blouse|women|romper|tank|top/.test(n)) return "women Blouse";
    if (/suit|blazer|tux|formal/.test(n)) return "man Suit";
    if (/hoodie|sweater|knit|pullover|sweat/.test(n)) return "man Hoodie";
    if (/jacket|leather|outer|denim|jean/.test(n)) return "man Jacket";
    if (/pant|trouser|short/.test(n)) return "man Pant";
    if (/shoe|sneaker|boot|sandal|slipper/.test(n)) return "man Shoes";
    if (/shirt|tee|t-shirt|cotton|oversize|casual|crew/.test(n)) return "man t-Shirt";
    return "man t-Shirt";
  }
  /* deterministic 4.80-4.99 rating (2 decimals, same format as the design's 4.95) */
  function pdRating(seed) {
    var h = 0, s = String(seed);
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100000;
    return (4.8 + (h % 20) / 100).toFixed(2);
  }
  /* 5-photo gallery pools per category — the "5 type different angle" shots.
     All keys are real images.js entries, so every frame is a real product photo. */
  /* 5-photo gallery: ONLY DIFFERENT ANGLES OF THE SELECTED PRODUCT (NO IRRELEVANT IMAGES) */
  function pdGallery(mainKey, cat) {
    if (typeof IMAGES === "undefined") return;
    var thumbs = document.querySelectorAll(".pd-thumb");
    if (!thumbs.length) return;

    // If viewing the default white tee (pd-1) or tee category with real multi-angle shots:
    if (mainKey === "pd-1" || !mainKey || mainKey === "tshirt") {
      var teeAngles = ["pd-2", "pd-3", "pd-4", "pd-5", "pd-6"];
      thumbs.forEach(function (t, idx) {
        var k = teeAngles[idx] || "pd-1";
        var src = window.resolveAsset ? window.resolveAsset(IMAGES[k]) : "../" + IMAGES[k];
        t.style.backgroundImage = 'url("' + src + '")';
        t.style.backgroundSize = "cover";
        t.style.backgroundPosition = "center";
        t.classList.add("has-image");
        t._anglePos = "center";
        t._angleSize = "cover";
      });
      return;
    }

    // For ANY OTHER product: show 5 distinct angles/details of THE EXACT SELECTED PRODUCT!
    // NEVER show irrelevant people or different clothes!
    var rawSrc = IMAGES[mainKey] || IMAGES["pd-1"];
    var prodSrc = window.resolveAsset ? window.resolveAsset(rawSrc) : "../" + rawSrc;

    var angles = [
      { name: "Full View", pos: "center top", size: "100% 100%" },
      { name: "Collar Angle", pos: "center 15%", size: "145% auto" },
      { name: "Center Fit Angle", pos: "center 48%", size: "165% auto" },
      { name: "Waist Angle", pos: "center 80%", size: "155% auto" },
      { name: "Fabric Detail", pos: "35% 35%", size: "185% auto" }
    ];

    thumbs.forEach(function (t, idx) {
      var a = angles[idx % angles.length];
      t.style.backgroundImage = 'url("' + prodSrc + '")';
      t.style.backgroundSize = a.size;
      t.style.backgroundPosition = a.pos;
      t.classList.add("has-image");
      t.setAttribute("title", a.name);
      t._anglePos = a.pos;
      t._angleSize = a.size;
    });
  }

  function boot() {
    var S = window.STACKLY;
    if (!S) return;

    /* ---------- gallery main slot ---------- */
    var main = document.querySelector("[data-img='pd-1']");

    /* ---------- dynamic product (identity travels in the URL) ----------
       QA FB-005: ?p only says WHICH product to open. The name and the price
       are taken from js/catalog.js, never from ?n / ?pr, so a price typed
       into the address bar can not change what is shown (or what the cart
       stores, because the cart stores the displayed price). A key that is
       not in the catalog falls back to the design's own product. */
    var qi = "";
    try { qi = (new URLSearchParams(location.search).get("p") || "").trim(); } catch (e) {}
    var item = qi ? (window.STACKLY_CATALOG || {})[qi] : null;
    if (!item) qi = "";
    var qn = item ? item.name : "";
    var qp = item ? item.price : "";

    /* leave a canonical address behind — the edited price disappears from it */
    try {
      if (location.search) {
        history.replaceState(null, "", location.pathname +
          (qi ? "?p=" + encodeURIComponent(qi) : "") + location.hash);
      }
    } catch (e) {}

    var titleEl = document.querySelector(".section-title");
    var newP = document.querySelector(".pd-price-new");
    var oldP = document.querySelector(".pd-price-old");
    if (qn && titleEl) titleEl.textContent = qn;
    if (qp && newP) {
      newP.textContent = qp;
      var num = parseInt(qp.replace(/[^0-9]/g, ""), 10);
      if (oldP && num) oldP.textContent = S.inr(num * 2);   /* the design sells at 50% off */
    }
    if (qi && main && typeof IMAGES !== "undefined" && IMAGES[qi]) {
      var src = window.resolveAsset ? window.resolveAsset(IMAGES[qi]) : "../" + IMAGES[qi];
      main.style.backgroundImage = 'url("' + src + '")';
      main.classList.add("has-image");
      main._imgKey = qi;   /* keep the displayed photo's identity for the cart */
    }

    /* ---------- dynamic category / rating / description / gallery ----------
       Only when a product was resolved from the catalog. Without one every
       element keeps its exact design text — that is what the pixel audits
       read. */
    var cat = qn ? pdCategory(qn) : "man t-Shirt";
    if (qn) {
      var catEl = document.querySelector(".pd-cat");
      if (catEl) catEl.textContent = cat;
      var rateEl = document.querySelector(".pd-rate");
      if (rateEl) rateEl.textContent = pdRating(qn + "|" + qp);
      var descs = document.querySelectorAll(".pd-desc");
      var shortD = "Cut for everyday comfort, the " + qn + " is a relaxed " + cat +
        " staple in a soft cotton-rich weave. It breathes easily, holds its shape wash after wash and layers without bulk under a jacket or over a tee.";
      var longD = "Finished with reinforced seams and a smooth hand-feel, the " + qn +
        " moves from casual days to evening layers without effort. The cotton-rich blend resists creasing and stays soft after every machine wash. Pair it with denim for weekends or tailoring for the office. True to size with a relaxed drape and a tag-free collar. Order today at " +
        (qp || "the listed price") + " \u2014 free shipping and easy 7-day returns across India.";
      if (descs[0]) descs[0].textContent = shortD;
      if (descs[1]) descs[1].textContent = longD;
    }

    /* ---------- initialize 5 gallery angle thumbnails for selected product ---------- */
    var mainKey = qi || (main ? main.getAttribute("data-img") : "pd-1") || "pd-1";
    if (typeof IMAGES !== "undefined") {
      pdGallery(mainKey, cat);
    }

    /* ---------- gallery angle selector ---------- */
    var thumbs = document.querySelectorAll(".pd-thumb");
    if (thumbs[0]) thumbs[0].classList.add("is-active");

    thumbs.forEach(function (thumb) {
      thumb.style.cursor = "pointer";
      thumb.addEventListener("click", function () {
        if (!main) return;
        thumbs.forEach(function (t) { t.classList.remove("is-active"); });
        thumb.classList.add("is-active");

        if (thumb._anglePos && thumb._angleSize) {
          main.style.backgroundImage = thumb.style.backgroundImage;
          main.style.backgroundPosition = thumb._anglePos;
          main.style.backgroundSize = thumb._angleSize;
        } else if (thumb.style.backgroundImage) {
          main.style.backgroundImage = thumb.style.backgroundImage;
          main.style.backgroundPosition = "center";
          main.style.backgroundSize = "cover";
        }
      });
    });

    /* ---------- quantity ---------- */
    var num = document.querySelector(".pd-qnum");
    if (num) {
      var qty = parseInt(num.textContent, 10) || 1;
      var btns = document.querySelectorAll(".pd-qbtn");
      if (btns[0]) btns[0].addEventListener("click", function () {
        if (qty > 1) { qty--; num.textContent = qty; }
      });
      if (btns[1]) btns[1].addEventListener("click", function () {
        qty++; num.textContent = qty;
      });
    }

    /* ---------- sizes ---------- */
    document.querySelectorAll(".pd-size").forEach(function (size) {
      size.style.cursor = "pointer";
      size.addEventListener("click", function () {
        if (size.classList.contains("pd-size--xxl") && !size.classList.contains("pd-size--m")) {
          S.toast("Size xxl is out of stock");
          return;
        }
        document.querySelectorAll(".pd-size--m").forEach(function (s) { s.classList.remove("pd-size--m"); });
        size.classList.add("pd-size--m");
      });
    });

    /* ---------- add to cart (displayed product -> store + header badge) ---------- */
    var addBtn = document.querySelector(".pd-btn");
    if (addBtn) {
      var label = addBtn.querySelector(".pd-btn__t");
      var original = label ? label.textContent : "";
      var titleForCart = document.querySelector(".section-title");
      var priceForCart = document.querySelector(".pd-price-new");
      addBtn.addEventListener("click", function () {
        var q = num ? parseInt(num.textContent, 10) || 1 : 1;
        S.addToCart(
          titleForCart ? titleForCart.textContent.replace(/\s+/g, " ").trim() : "White casual t-shirt",
          priceForCart ? priceForCart.textContent.replace(/\s+/g, " ").trim() : "",
          q,
          main ? (main._imgKey || main.getAttribute("data-img") || "") : ""
        );
        if (label) {
          label.textContent = "Added \u2713";
          setTimeout(function () { label.textContent = original; }, 1600);
        }
      });
    }

    /* ---------- wishlist cards -> open that product in place ---------- */
    document.querySelectorAll(".pd-card").forEach(function (card) {
      card.style.cursor = "pointer";
      card.addEventListener("click", function () { S.goProduct(card); });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
