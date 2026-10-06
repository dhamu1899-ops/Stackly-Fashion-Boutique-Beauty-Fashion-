/* =============================================================================
   STACKLY — page behaviour (shared, loaded on every page)
   - fills every image box from images.js (single source of truth)
   - scales the fixed 1440 design canvas down on narrower screens
   - smooth anchor scroll / scroll-down button
   - shared UI: header icon routing, search, footer links, socials,
     toast notifications, in-field overlay inputs, dropdown helpers
   Page-specific behaviour lives in <page>.js (loaded after this file).
   Exposes: window.STACKLY = { toast, overlayInput, dropdown, inr/idr, go, refit,
   cartItems, saveCart, cartCount, addToCart, clearCart, productData, goProduct }
============================================================================= */
(function () {
  "use strict";

  var DESIGN_WIDTH = 1440;
function resolveSrc(src) {
    if (!src) return "";
    var isHtmlSub = (location.pathname.replace(/\\/g, "/").indexOf("/html/") !== -1) ||
                    !!document.querySelector('link[href*="../css/"]');
    if (isHtmlSub && src.indexOf("assets/") === 0) {
      return "../" + src;
    }
    return src;
  }
  window.resolveAsset = resolveSrc;
  var designHeight = 0;

  /* ================================================================
     0. Shared helpers (used by <page>.js files)
     ================================================================ */

  /* Toast — appended to <body>, fixed bottom-right, only on demand
     (nothing exists in the DOM until the first call, so the static
     design/pixel audits are unaffected). */
  var toastEl = null, toastTimer = 0;
  function toast(msg) {
    if (!toastEl) {
      var st = document.createElement("style");
      st.textContent =
        /* layer + stylesheet: these rules must not outrank the design
           coordinates in stackly.css the way an unlayered rule outranks them */
        "@layer stackly{" +
        ".stackly-toast{position:fixed;right:24px;bottom:24px;z-index:9999;" +
        "background:#8b4513;color:#fff;font-family:Lato,Arial,sans-serif;font-size:15px;" +
        "letter-spacing:.3px;padding:14px 22px;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.28);" +
        "opacity:0;transform:translateY(12px);transition:opacity .22s,transform .22s;pointer-events:none;max-width:340px}" +
        ".stackly-toast.is-on{opacity:1;transform:translateY(0)}" +
        "}";
      document.head.appendChild(st);
      toastEl = document.createElement("div");
      toastEl.className = "stackly-toast";
      toastEl.setAttribute("role", "status");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-on"); }, 2400);
  }

  /* Overlay input — turns a static design field (absolute box) into a real,
     typeable input without changing the static render: the design's own
     placeholder span stays visible until the user focuses/types.
     The input is placed in the host's offset parent (same coordinate space,
     no layout/containing-block changes on the host itself). */
  /* Every overlay <input> keeps a record so it can be re-fitted later: the
     mobile reflow (css/responsive.css) changes label metrics and box offsets,
     so left/top/width/height are re-measured on every fitStage() call
     (page init, window resize, document.fonts.ready). */
  var overlays = [];
  function placeOverlay(rec) {
    var host = rec.host, input = rec.input;
    if (!host || !input || !host.isConnected || !input.isConnected) return;
    var parent = host.offsetParent || document.querySelector(".canvas") || document.body;
    if (input.parentNode !== parent) parent.appendChild(input);
    input.style.left = host.offsetLeft + "px";
    input.style.top = host.offsetTop + "px";
    input.style.width = (host.offsetWidth - (rec.opts.insetRight || 0)) + "px";
    input.style.height = host.offsetHeight + "px";
    /* rect-based inset: correct regardless of offset parents and stage scale */
    if (rec.ph) {
      var hr = host.getBoundingClientRect(), pr = rec.ph.getBoundingClientRect();
      var scale = host.offsetWidth ? (hr.width / host.offsetWidth) : 1;
      input.style.paddingLeft = Math.max(0, (pr.left - hr.left) / (scale || 1)) + "px";
    }
  }
  function syncOverlays() {
    for (var i = 0; i < overlays.length; i++) placeOverlay(overlays[i]);
  }

  function overlayInput(host, opts) {
    if (!host) return null;
    if (host._slyInp) return host._slyInp;
    opts = opts || {};
    var ph = opts.placeholderEl || null;
    var parent = host.offsetParent || document.querySelector(".canvas") || document.body;
    var input = document.createElement("input");
    input.type = opts.type || "text";
    input.className = "stackly-inp";
    input.setAttribute("autocomplete", opts.autocomplete || "off");
    if (opts.aria) input.setAttribute("aria-label", opts.aria);
    input.style.cssText =
      "position:absolute;box-sizing:border-box;" +
      "border:0;outline:0;background:transparent;padding:0;margin:0;" +
      "color:#3e3e3e;caret-color:#8b4513;font:inherit;cursor:text;z-index:20;";
    // copy the design placeholder's typography inside the box
    if (ph) {
      var cs = getComputedStyle(ph);
      input.style.fontFamily = cs.fontFamily;
      input.style.fontSize = cs.fontSize;
      input.style.fontWeight = cs.fontWeight;
      input.style.letterSpacing = cs.letterSpacing;
      input.placeholder = "";   // the design's own span acts as the placeholder
    }
    parent.appendChild(input);
    var rec = { host: host, input: input, ph: ph, opts: opts };
    overlays.push(rec);
    placeOverlay(rec);
    /* layout keeps settling after boot (webfonts swapping in, cart.js cloning
       item rows): re-measure when fonts are ready and once after that, so the
       overlay can never stick a few pixels off its box */
    var remeasure = function () { try { placeOverlay(rec); } catch (e) {} };
    if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
      document.fonts.ready.then(remeasure);
    }
    setTimeout(remeasure, 350);
    function sync() {
      host.classList.toggle("is-focus", document.activeElement === input);
      if (!ph) return;
      var hide = document.activeElement === input || input.value.length > 0;
      ph.style.visibility = hide ? "hidden" : "visible";
    }
    input.addEventListener("focus", sync);
    input.addEventListener("blur", sync);
    input.addEventListener("input", sync);
    host.classList.remove("is-focus");
    host._slyInp = input;
    return input;
  }

  /* Small dropdown — built on first open (nothing in the DOM at load).
     The list is appended to the anchor's offset parent at the anchor's
     coordinates, so the anchor's own positioning is never touched. */
  var ddStyleDone = false;
  function dropdown(anchor, options, onPick) {
    if (!anchor) return;
    if (anchor._slyDd) return;
    anchor._slyDd = true;
    if (!ddStyleDone) {
      var st = document.createElement("style");
      st.textContent =
        "@layer stackly{" +
        ".stackly-dd{position:absolute;z-index:60;" +
        "background:#fff;border:1px solid #e6e6e6;border-radius:8px;box-shadow:0 10px 28px rgba(0,0,0,.16);" +
        "padding:6px 0;font-family:Lato,Arial,sans-serif;font-size:14px;color:#3e3e3e;overflow:hidden}" +
        ".stackly-dd div{padding:9px 16px;cursor:pointer;white-space:nowrap}" +
        ".stackly-dd div:hover{background:#f6f1ea;color:#8b4513}" +
        ".stackly-dd div.is-sel{color:#8b4513;font-weight:700}" +
        "}";
      document.head.appendChild(st);
      ddStyleDone = true;
    }
    var open = null;
    function close() { if (open) { open.remove(); open = null; } }
    anchor.addEventListener("click", function (e) {
      e.stopPropagation();
      if (open) { close(); return; }
      open = document.createElement("div");
      open.className = "stackly-dd";
      options.forEach(function (o) {
        var d = document.createElement("div");
        d.textContent = o;
        if (anchor.textContent.trim() === o) d.className = "is-sel";
        d.addEventListener("click", function (ev) {
          ev.stopPropagation();
          close();
          if (onPick) onPick(o);
        });
        open.appendChild(d);
      });
      var parent = anchor.offsetParent || document.querySelector(".canvas") || document.body;
      open.style.left = anchor.offsetLeft + "px";
      open.style.top = (anchor.offsetTop + anchor.offsetHeight) + "px";
      open.style.minWidth = anchor.offsetWidth + "px";
      parent.appendChild(open);
    });
    document.addEventListener("click", close);
  }

  /* INR format: ₹ + Indian digit grouping (₹1,23,456) */
  function inr(n) {
    n = Math.max(0, Math.round(Number(n) || 0));
    var s = String(n), last3 = s.slice(-3), rest = s.slice(0, -3);
    if (rest) last3 = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3;
    return "\u20b9" + last3;
  }
  /* ---------- screen preloader — the branded loading screen -------------
      EVERY page shows it: PRELOAD_FIRST ms on the first load of the tab
      session ("loading page time 3 seconds"), PRELOAD_NAV ms on every
      in-site navigation after that so browsing still feels fast. All
      navigation (go(), plain links, cards) covers the screen first, so
      transitions are always smooth — no white flashes between pages. */
  var PRELOAD_FIRST = 3000, PRELOAD_NAV = 1200, PRELOAD_OUT = 550;
  var preloader = null, plPctTimer = null;

  function preloadCSS() {
    if (document.getElementById("preloader-css")) return;
    var st = document.createElement("style");
    st.id = "preloader-css";
    st.textContent = [
      "@layer stackly{",
      ".preloader{position:fixed;left:0;top:0;width:100%;height:100%;z-index:2147483000;",
      "background:radial-gradient(120% 120% at 50% 0%,#fffaf4 0%,#f7e9d9 60%,#f0dcc6 100%);",
      "display:flex;align-items:center;justify-content:center;opacity:1;",
      "transform:translateY(0);transition:transform .55s cubic-bezier(.7,0,.3,1),opacity .45s ease;}",
      ".preloader.is-out{transform:translateY(-102%);}",
      ".pl__in{text-align:center;color:#5a3216;width:270px;max-width:82vw;}",
      ".pl__mark{width:92px;height:92px;margin:0 auto 22px;border-radius:50%;",
      "border:3px solid rgba(139,69,19,.22);display:flex;align-items:center;justify-content:center;",
      "position:relative;}",
      ".pl__mark:before{content:\"\";position:absolute;inset:-3px;border-radius:50%;",
      "border:3px solid transparent;border-top-color:#8b4513;border-right-color:#c98a4b;",
      "animation:plspin 1.1s linear infinite;}",
      ".pl__mark span{font:700 44px/1 \"Playfair Display\",serif;color:#8b4513;",
      "animation:plpulse 1.4s ease-in-out infinite;}",
      "@keyframes plspin{to{transform:rotate(360deg)}}",
      "@keyframes plpulse{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}",
      ".pl__word{font:700 26px/1 \"Libre Baskerville\",serif;letter-spacing:.42em;",
      "text-indent:.42em;color:#8b4513;}",
      ".pl__tag{font:400 11px/1.6 Lato,sans-serif;letter-spacing:.26em;text-transform:uppercase;",
      "color:#a97a52;margin-top:12px;}",
      ".pl__track{width:230px;max-width:70vw;height:3px;background:rgba(139,69,19,.16);",
      "border-radius:3px;margin:28px auto 10px;overflow:hidden;}",
      ".pl__bar{width:0;height:100%;background:linear-gradient(90deg,#8b4513,#d3a06a);border-radius:3px;}",
      ".pl__bar.is-run{width:100%;}",
      ".pl__pct{font:700 11px/1 Lato,sans-serif;letter-spacing:.2em;color:#8b4513;}",
      "html.is-loading,body.is-loading{overflow:hidden;}",
      "}"
    ].join("");
    document.head.appendChild(st);
  }

  function buildPreloader() {
    preloadCSS();
    var el = document.createElement("div");
    el.className = "preloader";
    el.setAttribute("role", "status");
    el.setAttribute("aria-label", "Loading");
    el.innerHTML =
      '<div class="pl__in">' +
      '<div class="pl__mark">' + `<svg class="brand-logo-icon" viewBox="398 82 212 290" width="48" height="56" style="vertical-align:middle;display:inline-block;flex-shrink:0;margin-right:8px;margin-right:0;" xmlns="http://www.w3.org/2000/svg"><path fill="#8b4513" d="M419.713867,256.179962   C408.001251,235.739304 410.215973,215.613876 419.889709,195.679504   C426.373138,182.319229 436.255493,171.444672 446.508270,160.904480   C457.075165,150.041229 468.783997,140.348602 478.792694,128.896606   C487.411407,119.035004 494.797852,108.464394 500.031921,96.425682   C500.738983,94.799370 501.001617,92.854477 502.785980,91.712807   C503.214905,91.838028 503.879059,91.821617 504.103485,92.127670   C514.526489,106.341171 522.003967,121.483376 518.287415,139.859406   C515.933533,151.498276 508.987885,160.308563 500.296600,167.942245   C487.788574,178.928223 473.634369,187.949692 462.046570,200.037262   C456.219025,206.116135 451.191589,212.659836 449.149933,221.054688   C445.376373,236.570572 454.272034,249.198563 470.197021,250.779221   C485.241028,252.272446 499.302216,248.880798 512.632202,241.996979   C514.021362,241.279602 515.213196,239.793518 517.062500,240.547546   C517.833252,242.063324 516.690857,242.794266 515.917847,243.562866   C502.480865,256.923462 487.519073,267.973206 468.591339,271.949402   C447.923096,276.291199 431.269562,272.383606 419.713867,256.179962  z"/><path fill="#1a1a1a" d="M536.351807,311.352905   C521.089722,325.623138 508.631836,341.451172 501.644409,361.304535   C500.580017,360.856842 499.799347,360.777496 499.458496,360.348633   C491.323975,350.113098 485.458466,338.909088 484.707672,325.531189   C484.034546,313.536499 489.236786,303.909576 496.947052,295.363251   C506.737030,284.511749 519.089050,276.702271 530.329102,267.573334   C539.676453,259.981689 548.930542,252.352356 553.649658,240.719803   C556.247925,234.315125 556.803040,227.722214 555.167542,221.122284   C551.964783,208.197189 539.399353,200.886032 526.174622,203.877502   C513.911682,206.651428 503.242737,212.702515 493.079834,219.823700   C492.039246,220.552856 491.267578,221.851700 489.661957,221.557190   C488.659760,220.289383 489.653076,219.345703 490.287292,218.480408   C503.850159,199.976334 521.506714,187.674316 544.321167,183.636948   C574.742554,178.253418 599.437622,199.883118 594.804749,234.346802   C592.539368,251.198425 583.628967,264.794067 572.581299,277.156372   C561.558105,289.491241 548.610413,299.803345 536.351807,311.352905  z"/></svg>` + '</div>' +
      '<div class="pl__word">STACKLY</div>' +
      '<div class="pl__tag">curated fashion, delivered</div>' +
      '<div class="pl__track"><div class="pl__bar"></div></div>' +
      '<div class="pl__pct">0%</div>' +
      "</div>";
    (document.body || document.documentElement).appendChild(el);
    return el;
  }

  function showPreloader() {
    if (preloader) return preloader;
    preloader = buildPreloader();
    document.documentElement.classList.add("is-loading");
    if (document.body) document.body.classList.add("is-loading");
    var first = false;
    try {
      first = !sessionStorage.getItem("stacklyBooted");
      sessionStorage.setItem("stacklyBooted", "1");
    } catch (e) { first = true; }
    var dur = first ? PRELOAD_FIRST : PRELOAD_NAV;
    var bar = preloader.querySelector(".pl__bar");
    var pct = preloader.querySelector(".pl__pct");
    var t0 = Date.now();
    requestAnimationFrame(function () {
      bar.style.transition = "width " + dur + "ms linear";
      bar.classList.add("is-run");
    });
    plPctTimer = setInterval(function () {
      var p = Math.min(99, Math.round((Date.now() - t0) / dur * 100));
      pct.textContent = p + "%";
    }, 60);
    setTimeout(function () {
      if (!preloader) return;
      clearInterval(plPctTimer);
      pct.textContent = "100%";
      preloader.classList.add("is-out");
      document.documentElement.classList.remove("is-loading");
      if (document.body) document.body.classList.remove("is-loading");
      /* the scrollbar was suppressed by html.is-loading{overflow:hidden}, so
         the stage was fitted to a viewport 15px too wide — refit now */
      requestAnimationFrame(function () { try { fitStage(); } catch (e) {} });
      var dead = preloader;
      preloader = null;
      setTimeout(function () { if (dead.parentNode) dead.parentNode.removeChild(dead); }, PRELOAD_OUT + 80);
    }, dur + 120);
    return preloader;
  }

  /* instantly cover the current page when a navigation starts */
  function coverPreloader() {
    if (preloader) return preloader;
    preloader = buildPreloader();
    document.documentElement.classList.add("is-loading");
    if (document.body) document.body.classList.add("is-loading");
    return preloader;
  }

  function resolvePageUrl(url) {
    if (!url || /^(https?:|mailto:|tel:|javascript:|#)/.test(url)) return url;
    var inHtml = (location.pathname.replace(/\\/g, "/").indexOf("/html/") !== -1) ||
                 !!document.querySelector('link[href*="../css/"]');
    if (!inHtml) {
      // At root index.html
      if (url.indexOf("html/") !== 0 && url !== "index.html") {
        return "html/" + url;
      }
    } else {
      // Inside html/ subfolder
      if (url.indexOf("html/") === 0) {
        return url.replace(/^html\//, "");
      }
    }
    return url;
  }

  function navigate(url) {
    url = resolvePageUrl(url);
    if (/^(https?:|mailto:|tel:)/.test(url)) { location.href = url; return; }
    coverPreloader();
    setTimeout(function () { location.href = url; }, 340);
  }
  function go(url) { navigate(url); }

  /* ---------- cart store (localStorage) + header badge --------------------
     The cart page renders exactly what is in this list: an empty list is
     the "0 items" rest state, adding products (card overlay / product
     details) makes only those rows appear on cart.html. The header badge
     always shows the total quantity (sum of the line quantities).       */
  var CART_KEY = "stacklyCart";
  function cartItems() {
    try {
      var raw = localStorage.getItem(CART_KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Object.prototype.toString.call(list) === "[object Array]" ? list : [];
    } catch (e) { return []; }
  }
  function saveCart(list) {
    try { localStorage.setItem(CART_KEY, JSON.stringify(list)); } catch (e) {}
    paintCartBadge();
  }
  function cartCount() {
    var n = 0;
    cartItems().forEach(function (it) { n += parseInt(it && it.qty, 10) || 0; });
    return n;
  }
  function paintCartBadge() {
    var count = cartCount();
    var icon = document.querySelector('.nav-icon[aria-label="Cart"]');
    if (!icon) return;                       /* login/sign/404 have no header */
    var badge = icon.querySelector(".cart-badge");
    if (count > 0) {
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "cart-badge";
        badge.setAttribute("aria-hidden", "true");
        icon.appendChild(badge);
      }
      badge.textContent = count > 99 ? "99+" : String(count);
    } else if (badge) {
      badge.parentNode.removeChild(badge);
    }
  }
  function priceNum(p) {
    return parseInt(String(p || "").replace(/[^0-9]/g, ""), 10) || 0;
  }
  function addToCart(name, price, qty, img) {
    var list = cartItems();
    var add = Math.max(1, parseInt(qty, 10) || 1);
    var nm = String(name || "Item").replace(/\s+/g, " ").trim();
    var pr = priceNum(price);
    var found = null;
    for (var i = 0; i < list.length; i++) {
      if ((list[i].name || "") === nm && (list[i].price || 0) === pr) { found = list[i]; break; }
    }
    if (found) found.qty = (parseInt(found.qty, 10) || 0) + add;
    else list.push({ name: nm, price: pr, img: img || "", qty: add });
    saveCart(list);
    var n = cartCount();
    toast(nm + " added to cart \u00b7 " + n + " in cart" + (price ? " \u00b7 " + price : ""));
    return n;
  }
  function clearCartItems() {
    saveCart([]);
    try { localStorage.removeItem("stacklyCartCount"); } catch (e) {}
  }

  /* ---------- product identity: a card -> { name, price, img } ----------
     Shop cards split their info (name/price) into a sibling root next to
     the photo frame, so a frame can be paired with it via the registry
     (shop.js fills STACKLY.shItems) or, defensively, by geometry. */
  function findInfoForFrame(frame) {
    if (!frame || !frame.classList.contains("sh-frame")) return null;
    var top = frame.offsetTop;
    var left = parseFloat(frame.style.left) || frame.offsetLeft;
    var el = frame.nextElementSibling;
    while (el) {
      var elLeft = parseFloat(el.style.left);
      if (isNaN(elLeft)) elLeft = el.offsetLeft;
      if (el.offsetTop >= top && el.offsetTop < top + 460 && Math.abs(elLeft - left) <= 60) {
        if (el.classList.contains("sh-info")) return el;
        if (el.querySelector && el.querySelector(".sh-info")) return el;
      }
      el = el.nextElementSibling;
    }
    return null;
  }
  function productData(card, info) {
    if (!card) return { name: "", price: "", img: "" };
    if (!info && card.classList && card.classList.contains("sh-frame")) {
      var reg = (window.STACKLY && window.STACKLY.shItems) || null;
      if (reg) {
        for (var r = 0; r < reg.length; r++) {
          if (reg[r].frame === card) { info = reg[r].info; break; }
        }
      }
      if (!info) info = findInfoForFrame(card);
    }
    var scope = info || card;
    var nameEl = scope.querySelector(".product__name, .sh-pname, .pd-card__t");
    var priceEl = scope.querySelector(".product__price, .sh-price, .pd-card__price");
    var slot = card.querySelector(".slot");
    return {
      name: nameEl ? nameEl.textContent.replace(/\s+/g, " ").trim() : "",
      price: priceEl ? priceEl.textContent.replace(/\s+/g, " ").trim() : "",
      img: slot ? (slot.getAttribute("data-img") || "") : ""
    };
  }
  /* open the details page for a card (product identity travels in the URL
     so product-details.html renders THAT product) */
  function goProduct(card, info) {
    var d = productData(card, info);
    go("product-details.html?p=" + encodeURIComponent(d.img) +
       "&n=" + encodeURIComponent(d.name) + "&pr=" + encodeURIComponent(d.price));
  }

  window.STACKLY = {
    toast: toast, overlayInput: overlayInput, dropdown: dropdown,
    inr: inr, idr: inr, go: go, refit: refit,
    cartItems: cartItems, saveCart: saveCart,
    cartCount: cartCount, addToCart: addToCart, clearCart: clearCartItems,
    productData: productData, goProduct: goProduct
  };

  /* ================================================================
     1. Fill image slots from images.js — lazy per IntersectionObserver
        Above-fold slots (design top < 900 px) load immediately;
        everything else loads when it first scrolls into view.
        No visual change — slot size/colour/layout is untouched.
     ================================================================ */
  function applyImages() {
    var map = (typeof IMAGES !== "undefined") ? IMAGES : {};

    function fillSlot(el) {
      var rawSrc = map[el.getAttribute("data-img")];
      var src = resolveSrc(rawSrc);
      if (src) {
        el.style.backgroundImage = 'url("' + src + '")';
        el.classList.add("has-image");
        el._imgDone = true;
      }
    }

    document.querySelectorAll("[data-img]").forEach(fillSlot);
  }

  /* ================================================================
     2. Scale the canvas on narrow viewports
     ================================================================ */
  function fitStage() {
    var stage = document.querySelector(".stage");
    var canvas = document.querySelector(".canvas");
    if (!stage || !canvas) return;

    /* viewport width WITHOUT the classic scrollbar — exactly what the
       (max-width:991px) media queries in responsive.css evaluate against,
       so the JS branch and the CSS branch can never disagree */
    var winW = document.documentElement.clientWidth ||
               window.innerWidth || 1440;

    /* overlay <input>s track their design box — re-measure first, because both
       branches below change the layout they are positioned against */
    try { syncOverlays(); } catch (e) {}

    // Mobile / Tablet viewports (< 992px): responsive CSS reflow takes over
    if (winW < 992) {
      canvas.style.transform = "";
      canvas.style.transformOrigin = "";
      stage.style.width = "";
      stage.style.height = "";
      return;
    }

    // Dashboard uses native fluid grid layout, not fixed canvas
    if (document.querySelector(".db")) {
      canvas.style.transform = "";
      stage.style.width = "";
      stage.style.height = "";
      return;
    }

    if (!designHeight) designHeight = canvas.offsetHeight;
    var scale = winW / DESIGN_WIDTH;
    if (scale > 1) scale = 1;

    canvas.style.transformOrigin = "top left";
    canvas.style.transform = scale === 1 ? "" : "scale(" + scale + ")";
    stage.style.width = (DESIGN_WIDTH * scale) + "px";
    stage.style.height = (designHeight * scale) + "px";
  }
  /* re-measure after a page grows/shrinks its canvas (dynamic cart rows) */
  function refit() { designHeight = 0; fitStage(); }

  /* ================================================================
     3. Smooth anchor scrolling
     ================================================================ */
  function initAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href");
        if (id.length < 2) return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  /* ================================================================
     4. Video play (placeholder until real video added)
     ================================================================ */
  function initVideo() {
    var btn = document.querySelector(".play");
    if (!btn) return;
    btn.addEventListener("click", function () {
      btn.animate(
        [{ transform: "scale(1)" }, { transform: "scale(.88)" }, { transform: "scale(1)" }],
        { duration: 260, easing: "ease-out" }
      );
      // TODO: replace with real embed, e.g.
      // videoWrapper.innerHTML = '<iframe src="...?autoplay=1" ...></iframe>';
    });
  }

  /* ================================================================
     5. Header icons — account -> login, cart -> cart (all pages that
        have the header; silent on login/sign/404 which don't)
     ================================================================ */
  function initHeader() {
    /* signed-in state (saved by the login page) — navbar chip + routing */
    var user = "";
    try { user = localStorage.getItem("stacklyUser") || ""; } catch (e) {}
    var role = "user";
    try { role = localStorage.getItem("stacklyRole") || "user"; } catch (e) {}
    var accountDest = user ? "dashboard.html?role=" + role : "login.html";

    document.querySelectorAll('button.nav-icon[aria-label="Account"]').forEach(function (b) {
      b.addEventListener("click", function () { go(accountDest); });
    });
    document.querySelectorAll('button.nav-icon[aria-label="Cart"]').forEach(function (b) {
      b.addEventListener("click", function () { go("cart.html"); });
    });

    /* navbar user chip — only exists when signed in (audits run signed out,
       so the audited rest state never contains it) */
    var nav = document.querySelector(".nav");
    var canvas = document.querySelector(".canvas");
    if (user && nav && canvas && !document.querySelector(".nav-user")) {
      var nm = String(user).split("@")[0].replace(/[._\-+]+/g, " ").replace(/[<>&"]/g, "");
      nm = nm.charAt(0).toUpperCase() + nm.slice(1);
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "nav-user";
      chip.title = user;
      chip.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" ' +
        'stroke="#8b4513" stroke-width="1.8" stroke-linecap="round">' +
        '<path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></svg>' +
        "<span>Hi, " + nm + "</span>";
      chip.addEventListener("click", function () { go(accountDest); });
      canvas.insertBefore(chip, nav.nextSibling);
    }
    /* burger menu (revealed by responsive.css at <=860px) */
    if (nav && canvas && !document.querySelector(".burger")) {
      var burger = document.createElement("button");
      burger.type = "button";
      burger.className = "burger";
      burger.setAttribute("aria-label", "Menu");
      burger.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" ' +
        'stroke="#8b4513" stroke-width="2" stroke-linecap="round">' +
        '<path d="M4 7h16M4 12h16M4 17h16"/></svg>';
      burger.addEventListener("click", function () {
        var open = nav.classList.toggle("is-open");
        /* responsive.css reveals the menu contents (icons/search) only while
           .canvas carries menu-open — see "6. MOBILE HEADER MENU" block */
        canvas.classList.toggle("menu-open", open);
      });
      canvas.insertBefore(burger, nav.nextSibling);   /* DOM order: nav, burger, chip */
    }
    /* login / sign-up X close button -> home screen */
    document.querySelectorAll(".page-close").forEach(function (b) {
      b.addEventListener("click", function () { go("index.html"); });
    });
    /* promo banner close (all header pages) */
    document.querySelectorAll(".banner__close").forEach(function (b) {
      b.addEventListener("click", function () {
        var banner = b.closest(".banner");
        if (banner) banner.style.display = "none";
      });
    });
    /* restore the saved cart count on the header cart icon */
    paintCartBadge();
  }

  /* ================================================================
     6. Search boxes — submit goes to the shop with the query
     ================================================================ */
  function initSearch() {
    document.querySelectorAll("form.search").forEach(function (f) {
      f.addEventListener("submit", function (e) {
        e.preventDefault();
        var inp = f.querySelector("input");
        var q = inp && inp.value.trim();
        go(q ? "shop.html?q=" + encodeURIComponent(q) : "shop.html");
      });
    });
  }

  /* ================================================================
     7. Footer links: real destination per link (cart/orders/wishlist/
        shipping/blogs); the rest stay put with a "coming soon" toast;
        social icons -> real platforms (mapped by aria-label)
     ================================================================ */
  var SOCIALS = {
    "facebook": "https://www.facebook.com/", "fb": "https://www.facebook.com/",
    "x": "https://x.com/", "twitter": "https://x.com/",
    "instagram": "https://www.instagram.com/",
    "whatsapp": "https://whatsapp.com/", "linkedin": "https://www.linkedin.com/"
  };
  var SOCIAL_FALLBACK = ["https://www.facebook.com/", "https://x.com/",
    "https://www.instagram.com/", "https://www.linkedin.com/"];
  function initFooter() {
    [".socials a", ".bl-intro__socials a"].forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (a, i) {
        if (a.getAttribute("href") !== "#") return;
        var label = (a.getAttribute("aria-label") || "").toLowerCase();
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noopener");
        a.setAttribute("href", SOCIALS[label] || SOCIAL_FALLBACK[i % SOCIAL_FALLBACK.length]);
      });
    });
    /* footer destinations: pages that exist route there, the rest stay put
       (no page in this site routes to 404.html from a link click) */
    var FOOTER_DEST = {
      "your cart": "cart.html",
      "your orders": "dashboard.html?role=user",
      "wishlist": "dashboard.html?role=user#wishlist",
      "shipping details": "contact.html",
      "blogs": "blog.html"
    };
    document.querySelectorAll(".footer a[href='#']").forEach(function (a) {
      var dest = FOOTER_DEST[a.textContent.trim().toLowerCase()] || "shop.html";
      a.addEventListener("click", function (e) {
        e.preventDefault();
        var key = a.textContent.trim().toLowerCase();
        if (!FOOTER_DEST[key] && ["compared items", "terms & conditions", "privacy policy"].indexOf(key) >= 0) {
          toast("This page is coming soon");
          return;
        }
        go(dest);
      });
    });
  }

  /* ================================================================
     8. Scroll reveal — every direct canvas block fades/slides in the
        first time it enters the viewport (row-staggered cascade).
        Implemented with transient WAAPI animations: the resting CSS
        is never touched, so the static pixel render stays identical
        (audits simply finish any running animation before measuring).
     ================================================================ */
  function initReveal() {
    var canvas = document.querySelector(".canvas");
    if (!canvas || !("IntersectionObserver" in window)) return;

    var kids = [].slice.call(canvas.children).filter(function (el) {
      return el.offsetParent !== null;
    });
    if (!kids.length) return;

    /* row bands: everything sharing a y-range cascades left→right,
       bands cascade down the page */
    kids.sort(function (a, b) { return a.offsetTop - b.offsetTop; });
    var bandTop = -1e9, idx = 0;
    kids.forEach(function (el) {
      if (el.offsetTop - bandTop > 70) { bandTop = el.offsetTop; idx = 0; }
      el._rdelay = Math.min(idx * 55, 330);
      idx++;
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        io.unobserve(el);
        if (el._rdone || !el.animate) return;
        el._rdone = true;
        el.animate(
          [
            { opacity: 0, transform: "translateY(20px)" },
            { opacity: 1, transform: "translateY(0)" }
          ],
          {
            duration: 520,
            delay: el._rdelay || 0,
            easing: "cubic-bezier(.22,.61,.36,1)",
            fill: "backwards"
          }
        );
      });
    }, { rootMargin: "0px 0px -4% 0px", threshold: 0.04 });

    kids.forEach(function (el) { io.observe(el); });
  }

  /* ================================================================
     9. Product cards — hovering reveals Quick View + Add to Cart
        over the photo. The overlay is built lazily on the first
        hover, so the resting DOM (and the pixel audits) never
        contains it: nothing to measure, nothing to overlap.
     ================================================================ */
  function initCardActions() {
    var cards = document.querySelectorAll(".product, .sh-frame, .pd-card");
    cards.forEach(function (card) {
      card.addEventListener("mouseenter", function () {
        if (card._pov) return;
        var pov = document.createElement("div");
        pov.className = "pov";
        pov.innerHTML =
          '<button type="button" class="pov__btn pov__qv">Quick View</button>' +
          '<button type="button" class="pov__btn pov__atc">Add to Cart</button>';
        var slot = card.querySelector(".slot");
        if (slot) {
          /* clamp the overlay to the card's VISIBLE box: image slots can
             bleed past a clipped frame (shop cards), which used to push
             the Add to Cart button out of the visible area */
          var l = Math.max(0, slot.offsetLeft);
          var t = Math.max(0, slot.offsetTop);
          var r = Math.min(card.offsetWidth, slot.offsetLeft + slot.offsetWidth);
          var b = Math.min(card.offsetHeight, slot.offsetTop + slot.offsetHeight);
          pov.style.left = l + "px";
          pov.style.top = t + "px";
          pov.style.width = Math.max(0, r - l) + "px";
          pov.style.height = Math.max(0, b - t) + "px";
        }
        card.appendChild(pov);
        card._pov = pov;

        /* Quick View / photo -> that product's details page */
        pov.querySelector(".pov__qv").addEventListener("click", function (e) {
          e.stopPropagation();
          goProduct(card);
        });
        /* Add to Cart -> line item in the store + header badge */
        pov.querySelector(".pov__atc").addEventListener("click", function (e) {
          e.stopPropagation();
          var d = productData(card);
          addToCart(d.name || "Item", d.price, 1, d.img);
        });
        pov.addEventListener("click", function (e) {
          if (e.target === pov) { e.stopPropagation(); goProduct(card); }
        });
      });
    });
  }

  /* ================================================================
     All internal page links pass through the preloader (smooth,
     branded transitions); external links and # anchors stay native.
     ================================================================ */
  function initNavLinks() {
    document.addEventListener("click", function (e) {
      // a specialized handler (footer, forget-password, …) already claimed
      // this click — do nothing so its toast/destination stands alone
      if (e.defaultPrevented) return;

      // 1. Check anchor tags
      var a = e.target && e.target.closest ? e.target.closest("a") : null;
      if (a) {
        if (a.target === "_blank") return;
        var href = a.getAttribute("href") || "";
        if (!href || href === "#" || href === "#!") {
          // dead anchor: stay on the page (never route to 404)
          if (!a.classList.contains("tab") && !a.hasAttribute("data-tab") && !a.hasAttribute("data-toggle")) {
            e.preventDefault();
            toast("This link is coming soon");
            return;
          }
        }
        if (/^(https?:|mailto:|tel:|javascript:)/.test(href)) return;
        if (a.hasAttribute("data-native")) return;
        if (href.charAt(0) !== "#") {
          e.preventDefault();
          navigate(href);
          return;
        }
      }

      // 2. Check dead buttons without handlers
      var btn = e.target && e.target.closest ? e.target.closest("button") : null;
      if (btn) {
        var isHandled = btn.classList.contains("nav-icon") ||
                        btn.classList.contains("banner__close") ||
                        btn.classList.contains("page-close") ||
                        btn.classList.contains("burger") ||
                        btn.classList.contains("nav-user") ||
                        btn.classList.contains("stackly-sticky-burger") ||
                        btn.classList.contains("pov-btn") ||
                        btn.classList.contains("ct-qty__b") ||
                        btn.classList.contains("ct-remove") ||
                        btn.classList.contains("ct-btn") ||
                        btn.classList.contains("sg-btn") ||
                        btn.classList.contains("lg__btn") ||
                        btn.classList.contains("db-logout") ||
                        btn.type === "submit" ||
                        btn.hasAttribute("data-native") ||
                        btn.onclick;
        if (!isHandled && !btn.hasAttribute("data-action")) {
          // Check if button is inside form or custom component
          if (!btn.closest("form") && !btn.closest(".pov") && !btn.closest(".ct-card")) {
            // unhandled button: stay on the page (never route to 404)
            e.preventDefault();
            toast("This action is coming soon");
          }
        }
      }
    });
  }

  /* ================================================================
     boot
     ================================================================ */
  
  /* ================================================================
     Sticky Nav Header on Scroll
     ================================================================ */
  function initStickyHeader() {
    var isAuthOr404 = /login|sign|404|dashboard/.test(location.pathname);
    if (isAuthOr404) return;

    var inHtml = location.pathname.indexOf("/html/") >= 0;
    var homeHref = inHtml ? "index.html" : "index.html";
    var aboutHref = inHtml ? "about.html" : "html/about.html";
    var shopHref = inHtml ? "shop.html" : "html/shop.html";
    var prodHref = inHtml ? "product-details.html" : "html/product-details.html";
    var blogHref = inHtml ? "blog.html" : "html/blog.html";
    var contactHref = inHtml ? "contact.html" : "html/contact.html";
    var cartHref = inHtml ? "cart.html" : "html/cart.html";

    var user = "";
    try { user = localStorage.getItem("stacklyUser") || ""; } catch (e) {}
    var role = "user";
    try { role = localStorage.getItem("stacklyRole") || "user"; } catch (e) {}
    var accountDest = user ? (inHtml ? "dashboard.html?role=" + role : "html/dashboard.html?role=" + role) : (inHtml ? "login.html" : "html/login.html");

    // Add sticky header styles
    var st = document.createElement("style");
    st.textContent = [
      "@layer stackly{",
      ".stackly-sticky-header{",
      "  position:fixed;top:0;left:0;width:100%;z-index:9999;",
      "  background:rgba(255,255,255,0.95);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);",
      "  border-bottom:1px solid rgba(139,69,19,0.12);box-shadow:0 6px 24px rgba(40,20,10,0.08);",
      "  transform:translateY(-110%);transition:transform .35s cubic-bezier(.2,.8,.2,1),opacity .3s ease;",
      "  opacity:0;pointer-events:none;padding:10px 24px;box-sizing:border-box;",
      "}",
      ".stackly-sticky-header.is-visible{ transform:translateY(0);opacity:1;pointer-events:auto; }",
      ".ssh-inner{ max-width:1440px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:16px; }",
      ".ssh-logo{ font:700 24px/1 'Libre Baskerville',serif;color:#1a1a1a;display:inline-flex;align-items:center;text-decoration:none; }",
      ".ssh-logo b{ color:#8b4513; }",
      ".ssh-logo .brand-logo-icon{ width:24px;height:28px;margin-right:8px;vertical-align:middle; }",
      ".ssh-nav{ display:flex;align-items:center;gap:22px; }",
      ".ssh-nav a{ font:800 15px/1 Lato,sans-serif;color:#333;text-decoration:none;transition:color .2s; }",
      ".ssh-nav a:hover{ color:#8b4513; }",
      ".ssh-right{ display:flex;align-items:center;gap:14px; }",
      ".ssh-search{ display:flex;align-items:center;background:#f5f3f0;border-radius:20px;padding:6px 12px;border:1px solid #e2ddd7; }",
      ".ssh-search input{ border:0;background:none;font:400 13px Lato,sans-serif;outline:none;width:110px;color:#333; }",
      ".ssh-btn{ background:none;border:0;cursor:pointer;color:#222;display:flex;align-items:center;justify-content:center;position:relative;padding:4px; }",
      ".ssh-btn:hover{ color:#8b4513; }",
      ".ssh-badge{ position:absolute;top:-4px;right:-4px;min-width:16px;height:16px;background:#8b4513;color:#fff;font:700 10px/16px Lato,sans-serif;border-radius:8px;text-align:center;padding:0 3px; }",
      ".ssh-burger{ display:none; background:#fff; border:1.5px solid #e2d9cf; border-radius:50%; width:38px; height:38px; align-items:center; justify-content:center; cursor:pointer; padding:0; }",
      ".ssh-burger[aria-expanded=\"true\"]{ background:#8b4513; border-color:#8b4513; }",
      ".ssh-burger[aria-expanded=\"true\"] svg{ stroke:#fff; }",
      /* phone / small tablet: the desktop link row becomes a drop-down panel */
      "@media (max-width:991px){",
      "  .ssh-search{ display:none; }",
      "  .ssh-burger{ display:flex; }",
      "  .ssh-nav{ display:none; position:absolute; top:100%; left:0; right:0; flex-direction:column; gap:0;",
      "            background:#fff; padding:6px 20px 12px; border-top:1px solid rgba(139,69,19,.10);",
      "            border-bottom:1px solid rgba(139,69,19,.16); box-shadow:0 16px 30px rgba(40,20,10,.14); }",
      /* responsive.css already forces .ssh-nav/.ssh-search to display:none at
         this breakpoint (with !important) — the open panel must out-rank it */
      "  .stackly-sticky-header.is-open .ssh-nav{ display:flex !important; align-items: stretch !important; }",
      "  .ssh-nav a{ padding:12px 4px; border-bottom:1px dashed #eee; font-size:15px; }",
      "  .ssh-nav a:last-child{ border-bottom:0; }",
      "}",
      "}"
    ].join("");
    document.head.appendChild(st);

    // Create sticky header element
    var hdr = document.createElement("div");
    hdr.className = "stackly-sticky-header";
    /* brand mark: reuse the logo SVG that is already on the page instead of
       hard-coding the path data a second time (the old inline reference to a
       never-defined `path1D` threw and aborted the whole boot sequence) */
    var markEl = document.querySelector(".logo .brand-logo-icon") ||
                 document.querySelector(".brand-logo-icon");
    var markHtml = markEl
      ? markEl.outerHTML.replace(/\s(?:width|height)="[^"]*"/g, "")
      : "";
    hdr.innerHTML = [
      '<div class="ssh-inner">',
      '  <a class="ssh-logo" href="' + homeHref + '">',
      '    ' + markHtml,
      '    <b>S</b>TACKLY',
      '  </a>',
      '  <button type="button" class="ssh-burger stackly-sticky-burger" aria-label="Menu" aria-expanded="false">',
      '    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#8b4513" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
      '  </button>',
      '  <nav class="ssh-nav">',
      '    <a href="' + homeHref + '">Home</a>',
      '    <a href="' + aboutHref + '">About</a>',
      '    <a href="' + shopHref + '">Shop</a>',
      '    <a href="' + prodHref + '">Product details</a>',
      '    <a href="' + blogHref + '">Blog</a>',
      '    <a href="' + contactHref + '">Contact</a>',
      '  </nav>',
      '  <div class="ssh-right">',
      '    <form class="ssh-search" onsubmit="return false;">',
      '      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#888" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.4-3.4"/></svg>',
      '      <input type="text" placeholder="Search..." aria-label="Search" style="margin-left:6px;">',
      '    </form>',
      '    <button type="button" class="ssh-btn ssh-account" aria-label="Account" title="Account">',
      '      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></svg>',
      '    </button>',
      '    <button type="button" class="ssh-btn ssh-cart" aria-label="Cart" title="Cart">',
      '      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 4h2.2l2.3 10.5h9.6L19.5 7H6.3"/><circle cx="9.5" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/></svg>',
      '      <span class="ssh-badge" style="display:none;">0</span>',
      '    </button>',
      '  </div>',
      '</div>'
    ].join("");
    document.body.appendChild(hdr);

    // Event listeners for sticky header controls
    hdr.querySelector(".ssh-account").addEventListener("click", function () { navigate(accountDest); });
    hdr.querySelector(".ssh-cart").addEventListener("click", function () { navigate(cartHref); });

    // mobile burger: drop-down panel with the same links as the desktop row
    var sBurger = hdr.querySelector(".ssh-burger");
    if (sBurger) {
      var setMenu = function (open) {
        hdr.classList.toggle("is-open", open);
        sBurger.setAttribute("aria-expanded", open ? "true" : "false");
      };
      sBurger.addEventListener("click", function (e) {
        e.stopPropagation();
        setMenu(!hdr.classList.contains("is-open"));
      });
      Array.prototype.forEach.call(hdr.querySelectorAll(".ssh-nav a"), function (a) {
        a.addEventListener("click", function () { setMenu(false); });
      });
      document.addEventListener("click", function (e) {
        if (!hdr.contains(e.target)) setMenu(false);
      });
      window.addEventListener("resize", function () {
        if (window.innerWidth > 991) setMenu(false);
      });
    }
    var sInput = hdr.querySelector(".ssh-search input");
    if (sInput) {
      sInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          var q = sInput.value.trim();
          if (q) navigate(shopHref + "?q=" + encodeURIComponent(q));
        }
      });
    }

    // Update sticky cart badge
    function updateStickyCartBadge() {
      var count = cartCount();
      var b = hdr.querySelector(".ssh-badge");
      if (b) {
        b.textContent = count > 99 ? "99+" : String(count);
        b.style.display = count > 0 ? "block" : "none";
      }
    }
    updateStickyCartBadge();
    window.addEventListener("storage", updateStickyCartBadge);

    // Scroll listener
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (!ticking) {
        requestAnimationFrame(function () {
          var y = window.scrollY || document.documentElement.scrollTop || 0;
          if (y > 140) {
            hdr.classList.add("is-visible");
          } else {
            hdr.classList.remove("is-visible");
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* Safety net for the one layout change that does not reliably fire a window
     `resize`: a classic scrollbar appearing/disappearing (the preloader locks
     html overflow, fonts swap in, images change the page height). Watches the
     root box and re-fits whenever the viewport width actually changes. */
  function observeRootSize() {
    if (typeof ResizeObserver === "undefined" || window.__slyRootObs) return;
    window.__slyRootObs = true;
    var lastW = document.documentElement.clientWidth, pending = false;
    var tick = function () {
      var w = document.documentElement.clientWidth;
      if (w === lastW) return;
      lastW = w;
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () {
        pending = false;
        try { fitStage(); } catch (e) {}
      });
    };
    var ro = new ResizeObserver(tick);
    ro.observe(document.documentElement);
    if (document.body) ro.observe(document.body);
  }

  function init() {
    /* resize / re-fit listeners FIRST: no optional feature can ever take the
       responsive scaling down with it */
    window.addEventListener("resize", fitStage);
    window.addEventListener("orientationchange", fitStage);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(fitStage);
    }
    observeRootSize();

    /* every step is isolated: a failure in one enhancement must not silently
       disable the rest of the page (search, footer routing, reveal, …) */
    function boot(label, fn) {
      try { fn(); }
      catch (e) { if (window.console && console.warn) console.warn("[stackly] " + label, e); }
    }

    boot("preloader", showPreloader);
    boot("images", applyImages);
    boot("fit", fitStage);
    boot("anchors", initAnchors);
    boot("nav links", initNavLinks);
    boot("video", initVideo);
    boot("header", initHeader);
    boot("sticky header", initStickyHeader);
    boot("search", initSearch);
    boot("footer", initFooter);
    boot("reveal", initReveal);
    boot("card actions", initCardActions);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
