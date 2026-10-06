/* =============================================================================
   STACKLY — cart page behaviour (dynamic)
   - The rows are rendered from the localStorage cart (STACKLY.cartItems):
       0 items -> the designed empty state, N items -> N design rows
   - quantity steppers / Delete update the store and re-render; the
     Subtotal / Total recompute in ₹ (design delta: -500 promo)
   - the footer + canvas grow when the rows no longer fit the fixed design
   - promo bar, typeable notes and PROCEED TO CHECKOUT kept from the design
   The three static design rows are consumed as the row TEMPLATE at boot and
   removed from the DOM, so the resting (0 items) render stays exactly what
   the pixel audits measure.
============================================================================= */
(function () {
  "use strict";

  var ROW_TOP = 385;      /* design y of the first row */
  var ROW_PITCH = 313;    /* design distance between rows (385 -> 698) */
  var ROW_H = 266;        /* row-1 content height (385 -> 651, incl. notes) */
  var FOOTER_Y = 1420;    /* design y of the footer */
  var PAGE_H = 1896;      /* design page height */
  var PROMO = 500;        /* the design's Subtotal(3600) -> Total(3100) delta */

  function boot() {
    var S = window.STACKLY;
    if (!S) return;
    var canvas = document.querySelector(".canvas");
    if (!canvas) return;
    var footer = canvas.querySelector(".footer");
    var emptyBox = document.querySelector(".ct-empty");
    var subEl = document.querySelector(".ct__val:not(.ct__val--dark)");
    var totEl = document.querySelector(".ct__val--dark");

    /* ---------- consume the design rows --------------------------------
       row 1 becomes the clone template (its inline tops are the layout
       source); all three static rows leave the DOM so the resting page is
       the empty cart the audits measure.                                */
    var template = [], srcTops = [];
    var statics = [];
    var bounds = [{ s: 385, e: 697 }, { s: 698, e: 984 }, { s: 985, e: 1419 }];
    /* The bounds above are DESKTOP design coordinates. Below 992px the
       responsive layer rewrites the layout, so offsetLeft/offsetTop no longer
       describe the design and the rows would be classified per viewport (the
       mobile cart lost its item rows that way). When the reflow is active,
       read the original coordinates back from the generated .sN rules;
       fall back to the live offsets at desktop widths — where they are the
       layout source anyway — so desktop behaviour is byte-identical. */
    var coordMap = null;
    function designPos(el) {
      if (coordMap === null) {
        coordMap = {};
        try {
          for (var s = 0; s < document.styleSheets.length; s++) {
            var sheetRules;
            try { sheetRules = document.styleSheets[s].cssRules; } catch (e) { continue; }
            for (var r = 0; r < sheetRules.length; r++) {
              var rule = sheetRules[r];
              if (!rule.selectorText || !rule.style) continue;
              var lv = parseFloat(rule.style.left), tv = parseFloat(rule.style.top);
              if (isNaN(lv) || isNaN(tv)) continue;
              var sels = rule.selectorText.split(","), all = sels.length > 0;
              for (var q = 0; q < sels.length; q++) {
                if (!/^\s*\.s\d+\s*$/.test(sels[q])) { all = false; break; }
              }
              if (!all) continue;
              for (var q2 = 0; q2 < sels.length; q2++) coordMap[sels[q2].trim()] = { left: lv, top: tv };
            }
          }
        } catch (e) { coordMap = {}; }
      }
      var pos = null, cls = el.classList;
      for (var i = 0; i < cls.length; i++) {
        if (coordMap.hasOwnProperty("." + cls[i])) { pos = coordMap["." + cls[i]]; break; }
      }
      if (!pos) {                       /* JS-placed pieces keep inline coords */
        var il = parseFloat(el.style.left), it = parseFloat(el.style.top);
        if (!isNaN(il) && !isNaN(it)) pos = { left: il, top: it };
      }
      if (!pos) pos = { left: el.offsetLeft, top: el.offsetTop };
      return pos;
    }
    var compact = window.matchMedia && window.matchMedia("(max-width: 991px)").matches;
    Array.prototype.slice.call(canvas.children).forEach(function (el) {
      if (el.classList.contains("ct-empty")) return;
      var pos = compact ? designPos(el) : { left: el.offsetLeft, top: el.offsetTop };
      if (pos.left >= 850) return;                 /* right column + footer stay */
      for (var i = 0; i < bounds.length; i++) {
        if (pos.top >= bounds[i].s && pos.top <= bounds[i].e) {
          statics.push(el);
          if (i === 0) { template.push(el); srcTops.push(pos.top); }
          break;
        }
      }
    });
    statics.forEach(function (el) { if (el.parentNode) el.parentNode.removeChild(el); });

    var clones = [];
    function clearClones() {
      clones.forEach(function (el) { if (el.parentNode) el.parentNode.removeChild(el); });
      clones = [];
    }

    /* rows grow downward; past the design budget the footer + page shift */
    function applyLayout(count) {
      var bottom = ROW_TOP + Math.max(0, count - 1) * ROW_PITCH + ROW_H;
      var delta = Math.max(0, bottom + 30 - FOOTER_Y);
      if (footer) footer.style.top = (FOOTER_Y + delta) + "px";
      canvas.style.height = (PAGE_H + delta) + "px";
      if (S.refit) S.refit();
    }

    function totals() {
      var items = S.cartItems(), sub = 0;
      items.forEach(function (it) {
        sub += (it.price || 0) * (Math.max(1, parseInt(it.qty, 10) || 1));
      });
      if (subEl) subEl.textContent = S.inr(sub);
      if (totEl) totEl.textContent = S.inr(Math.max(0, sub - PROMO));
    }

    /* ---------- store mutations (full re-render keeps indices honest) ---- */
    function changeQty(index, delta) {
      var items = S.cartItems();
      if (!items[index]) return;
      items[index].qty = Math.max(1, (parseInt(items[index].qty, 10) || 1) + delta);
      S.saveCart(items);
      render();
    }
    function removeItem(index) {
      var items = S.cartItems();
      if (!items[index]) return;
      var name = items[index].name || "Item";
      items.splice(index, 1);
      S.saveCart(items);
      render();
      S.toast(name + " removed from cart");
    }

    /* ---------- one rendered row (row-1 layout, per-item content) -------- */
    function wireRow(rowEls, item, index) {
      var nameEl = null, priceEl = null, qtyBox = null, slot = null;
      var noteBox = null, noteText = null, dels = [];
      rowEls.forEach(function (el) {
        var c = el.classList;
        if (c.contains("ct__name")) nameEl = el;
        else if (c.contains("ct__price1")) priceEl = el;
        else if (c.contains("ct__qty")) qtyBox = el;
        else if (c.contains("ct__notebox")) noteBox = el;
        else if (c.contains("ct__notetext")) noteText = el;
        if (c.contains("slot")) slot = el;
        if (c.contains("ct__trash") || c.contains("ct__del") || c.contains("ct__delline")) dels.push(el);
      });

      if (nameEl) nameEl.textContent = item.name || "Product";
      if (priceEl) priceEl.textContent = S.inr(item.price);

      /* the product's own photo (falls back to the design placeholder) */
      if (slot && item.img && typeof IMAGES !== "undefined" && IMAGES[item.img]) {
        var src = window.resolveAsset ? window.resolveAsset(IMAGES[item.img]) : "../" + IMAGES[item.img];
        slot.style.backgroundImage = 'url("' + src + '")';
        slot.classList.add("has-image");
        slot.setAttribute("data-img", item.img);
      }

      if (qtyBox) {
        var num = qtyBox.querySelector(".ct__num");
        var steps = qtyBox.querySelectorAll(".ct__step");
        if (num) num.textContent = Math.max(1, parseInt(item.qty, 10) || 1);
        qtyBox.style.cursor = "pointer";
        if (steps[0]) steps[0].addEventListener("click", function () { changeQty(index, -1); });
        if (steps[1]) steps[1].addEventListener("click", function () { changeQty(index, 1); });
      }

      dels.forEach(function (el) {
        el.style.cursor = "pointer";
        el.addEventListener("click", function () { removeItem(index); });
      });

      /* notes: typeable, persisted on the line item */
      if (noteBox) {
        var inp = S.overlayInput(noteBox, { placeholderEl: noteText, aria: "Order notes" });
        if (inp) {
          if (item.note) {
            inp.value = item.note;
            try { inp.dispatchEvent(new Event("input")); } catch (e) {}
          }
          inp.addEventListener("input", function () {
            var list = S.cartItems();
            if (list[index]) { list[index].note = inp.value; S.saveCart(list); }
          });
        }
      }
    }

    function revealRow(rowEls, i) {
      if (!Element.prototype.animate) return;
      rowEls.forEach(function (el, k) {
        el.animate(
          [{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }],
          { duration: 420, delay: i * 60 + k * 12, easing: "cubic-bezier(.22,.61,.36,1)", fill: "backwards" }
        );
      });
    }

    function render() {
      var items = S.cartItems();
      clearClones();
      if (emptyBox) emptyBox.style.display = items.length ? "none" : "";
      if (!items.length) { applyLayout(0); totals(); return; }

      items.forEach(function (item, i) {
        var top0 = ROW_TOP + i * ROW_PITCH;
        var rowEls = template.map(function (src, k) {
          var el = src.cloneNode(true);
          el.style.top = (srcTops[k] - ROW_TOP + top0) + "px";
          canvas.appendChild(el);
          clones.push(el);
          return el;
        });
        wireRow(rowEls, item, i);
        revealRow(rowEls, i);
      });
      applyLayout(items.length);
      totals();
    }

    /* ---------- promo bar (right column, static design) ------------------ */
    var promo = document.querySelector(".ct__promo");
    var pT1 = document.querySelector(".ct__promo-t1");
    var pT2 = document.querySelector(".ct__promo-t2");
    var pX = document.querySelector(".ct__promo-x");
    var promoInp = null;

    if (pX) pX.addEventListener("click", function () {
      [promo, pT1, pT2, pX].forEach(function (el) { if (el) el.style.display = "none"; });
      if (promoInp) { promoInp.remove(); promoInp = null; }
    });

    if (pT2) pT2.addEventListener("click", function () {
      if (promoInp) return;
      pT1.style.visibility = "hidden";
      pT2.style.visibility = "hidden";
      var cs = getComputedStyle(pT1);
      promoInp = document.createElement("input");
      promoInp.type = "text";
      promoInp.setAttribute("aria-label", "Promo code");
      promoInp.style.cssText =
        "position:absolute;left:916px;top:401px;width:400px;height:24px;box-sizing:border-box;" +
        "border:0;outline:0;background:transparent;color:#8b4513;caret-color:#8b4513;" +
        "font-family:" + cs.fontFamily + ";font-size:" + cs.fontSize + ";font-weight:" + cs.fontWeight + ";letter-spacing:" + cs.letterSpacing + ";";
      if (window.matchMedia && window.matchMedia("(max-width: 991px)").matches) {
        /* the responsive layer neutralises inline coordinates, so re-place the
           input over the (now flowed) promo line with important inline values */
        var rr = pT1.getBoundingClientRect(), cr = canvas.getBoundingClientRect();
        var put = function (k, v) { promoInp.style.setProperty(k, v, "important"); };
        put("position", "absolute");
        put("left", Math.max(0, rr.left - cr.left) + "px");
        put("top", Math.max(0, rr.top - cr.top + 2) + "px");
        put("width", Math.max(80, rr.width) + "px");
        put("height", Math.max(20, rr.height - 4) + "px");
      }
      canvas.appendChild(promoInp);
      promoInp.focus();
      function close(keep) {
        if (promoInp) { promoInp.remove(); promoInp = null; }
        if (!keep) { pT1.style.visibility = ""; pT2.style.visibility = ""; }
      }
      promoInp.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          var v = promoInp.value.trim();
          if (!v) { S.toast("Enter a promo code"); return; }
          close(true);
          S.toast("Promo code applied!");
        } else if (e.key === "Escape") {
          close(false);
        }
      });
      promoInp.addEventListener("blur", function () { setTimeout(function () { close(false); }, 120); });
    });

    /* ---------- checkout: needs at least one item ------------------------ */
    var checkout = document.querySelector(".ct__checkout");
    if (checkout) checkout.addEventListener("click", function (e) {
      e.preventDefault();
      if (!S.cartItems().length) { S.toast("Your cart is empty — add a product first"); return; }
      S.go("contact.html");
    });

    /* ---------- first paint ---------- */
    render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
