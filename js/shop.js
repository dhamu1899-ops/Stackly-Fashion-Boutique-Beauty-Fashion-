/* =============================================================================
   STACKLY — shop page behaviour
   - Sort dropdown actually re-orders the grid (Popular / Newest / price)
   - Filter checkboxes (Gender / Age group / Size) actually filter
   - Min / Max price actually bound the grid; chips clear their filter
   - Filter label collapses the panel, Subscribe validates an email
   - product frames / names / prices -> product details
   Filtered results re-flow into the design's 3 x 5 grid (frame + info are
   sibling canvas kids paired in reading order); nothing runs at rest, so
   the static pixel render stays exactly as designed.
============================================================================= */
(function () {
  "use strict";

  /* canonical grid geometry from the design (3 columns x 5 rows) */
  var COLS = [369, 727, 1107];
  var ROWS = [963, 1367, 1800, 2284, 2737];
  /* every product ships two of the three sizes (deterministic, so each
     size chip has a real result set) */
  var SIZES = [["Small", "Medium"], ["Medium", "Large"], ["Small", "Large"]];

  function boot() {
    var S = window.STACKLY;
    if (!S) return;
    var canvas = document.querySelector(".canvas");
    if (!canvas) return;

    /* ---------- product registry ---------- */
    var frames = [], roots = [];
    Array.prototype.forEach.call(canvas.children, function (el) {
      if (el.classList.contains("sh-frame")) frames.push(el);
      else if (el.classList.contains("sh-info") || el.querySelector(".sh-info")) roots.push(el);
    });
    var items = frames.map(function (fr, i) {
      var info = roots[i];
      var col = i % 3, row = Math.floor(i / 3);
      /* design coordinates now live in css/stackly.css, so read them from the
         cascade (falling back to layout) instead of an inline style attr */
      var cf = getComputedStyle(fr);
      var fl = parseFloat(cf.left), ft = parseFloat(cf.top);
      if (isNaN(fl)) fl = fr.offsetLeft;
      if (isNaN(ft)) ft = fr.offsetTop;
      var ci = info ? getComputedStyle(info) : null;
      var il = ci ? parseFloat(ci.left) : fl;
      var it2 = ci ? parseFloat(ci.top) : ft + 280;
      if (isNaN(il)) il = info ? info.offsetLeft : fl;
      if (isNaN(it2)) it2 = info ? info.offsetTop : ft + 280;
      var priceEl = info && info.querySelector(".sh-price");
      var gEl = info && info.querySelector(".sh-mg .sh-v");
      var aEl = info && info.querySelector(".sh-ma .sh-v");
      return {
        idx: i, frame: fr, info: info,
        fdx: fl - COLS[col], fdy: ft - ROWS[row],  /* frame offset inside its cell */
        rdx: il - fl, rdy: it2 - ft,               /* info offset inside the card */
        price: parseInt((priceEl ? priceEl.textContent : "").replace(/[^0-9]/g, ""), 10) || 0,
        gender: gEl ? gEl.textContent.trim() : "Male",
        age: (aEl && aEl.textContent.trim() === "0 - 11") ? "Children" : "Adult",
        sizes: SIZES[i % 3]
      };
    });

    var sortKey = "popular";
    var minInp = null, maxInp = null;
    /* shared registry: script.js overlays on .sh-frame look up their
       sibling info root here (name/price live outside the frame) */
    S.shItems = items;

    /* The source DOM lists every frame first and every info block second,
       which reads as "3 pictures, then 6 texts" once the canvas reflows to
       a single column. Re-pair each frame with its own info root so mobile
       shows image → name/price per product. Desktop is unaffected: every
       card is placed by its design coordinate in the css cascade (and by the
       inline left/top written in apply()), so document order never matters
       above 991px. */
    items.forEach(function (p) {
      if (p.info && p.frame.nextSibling !== p.info) {
        canvas.insertBefore(p.info, p.frame.nextSibling);
      }
    });

    /* ---------- read the filter panel state ---------- */
    function group(label) {
      var gs = document.querySelectorAll(".sh-fgroup");
      for (var i = 0; i < gs.length; i++) {
        var l = gs[i].querySelector(".sh-flabel");
        if (l && l.textContent.trim() === label) return gs[i];
      }
      return null;
    }
    function checked(groupEl) {
      var out = [];
      if (!groupEl) return out;
      groupEl.querySelectorAll(".sh-frow").forEach(function (row) {
        var svg = row.querySelector(".sh-cb svg");
        var lbl = row.querySelector(".sh-fopt");
        if (svg && svg.style.display !== "none" && lbl) out.push(lbl.textContent.trim());
      });
      return out;
    }
    function num(inp) {
      if (!inp) return null;
      var d = (inp.value || "").replace(/[^0-9]/g, "");
      return d ? parseInt(d, 10) : null;
    }

    /* ---------- apply filters + sort, then re-flow the grid ---------- */
    function apply(announce) {
      var gsel = checked(group("Gender"));
      var asel = checked(group("Age group"));
      var ssel = checked(group("Size"));
      var min = num(minInp), max = num(maxInp);

      var vis = items.filter(function (p) {
        if (gsel.length && gsel.indexOf(p.gender) < 0) return false;
        if (asel.length && asel.indexOf(p.age) < 0) return false;
        if (ssel.length && !ssel.some(function (s) { return p.sizes.indexOf(s) >= 0; })) return false;
        if (min !== null && p.price < min) return false;
        if (max !== null && p.price > max) return false;
        return true;
      });
      vis.sort(function (a, b) {
        if (sortKey === "newest") return b.idx - a.idx;
        if (sortKey === "low") return a.price - b.price;
        if (sortKey === "high") return b.price - a.price;
        return a.idx - b.idx;
      });

      items.forEach(function (p) {
        p.frame.style.display = "none";
        if (p.info) p.info.style.display = "none";
      });
      vis.forEach(function (p, k) {
        var c = k % 3, r = Math.floor(k / 3);
        var fl = COLS[c] + p.fdx, ft = ROWS[r] + p.fdy;
        p.frame.style.display = "";
        p.frame.style.left = fl + "px";
        p.frame.style.top = ft + "px";
        if (p.info) {
          p.info.style.display = "";
          p.info.style.left = (fl + p.rdx) + "px";
          p.info.style.top = (ft + p.rdy) + "px";
        }
      });
      if (announce) S.toast(vis.length + " product" + (vis.length === 1 ? "" : "s") + " found");
      return vis.length;
    }

    /* ---------- Sort by ---------- */
    var sort = document.querySelector(".sh-sort");
    if (sort) {
      var KEYS = {
        "Sort by: Popular": "popular",
        "Sort by: Newest": "newest",
        "Sort by: Price: Low to High": "low",
        "Sort by: Price: High to Low": "high"
      };
      S.dropdown(sort, ["Sort by: Popular", "Sort by: Newest", "Sort by: Price: Low to High", "Sort by: Price: High to Low"],
        function (pick) {
          var t = sort.querySelector(".sh-sort-t");
          if (t) t.textContent = pick;
          sortKey = KEYS[pick] || "popular";
          apply(false);
          S.toast("Showing: " + pick.replace("Sort by: ", ""));
        });
      sort.addEventListener("click", function () {
        setTimeout(function () { sort.classList.toggle("is-dd-open"); }, 0);
      });
    }

    /* ---------- filter checkboxes: tick + live re-filter ---------- */
    var tick = document.querySelector(".sh-frow .sh-cb svg");
    var tickHTML = tick ? tick.outerHTML : "";
    function setRows(groupEl, on) {
      if (!groupEl) return;
      groupEl.querySelectorAll(".sh-frow").forEach(function (row) {
        var cb = row.querySelector(".sh-cb");
        if (!cb) return;
        var svg = cb.querySelector("svg");
        if (on) {
          if (!svg && tickHTML) cb.insertAdjacentHTML("beforeend", tickHTML);
          svg = cb.querySelector("svg");
          if (svg) svg.style.display = "";
        } else if (svg) {
          svg.style.display = "none";
        }
      });
    }
    document.querySelectorAll(".sh-frow").forEach(function (row) {
      row.style.cursor = "pointer";
      row.addEventListener("click", function () {
        var cb = row.querySelector(".sh-cb");
        if (!cb) return;
        var svg = cb.querySelector("svg");
        if (svg) svg.style.display = (svg.style.display === "none") ? "" : "none";
        else if (tickHTML) cb.insertAdjacentHTML("beforeend", tickHTML);
        apply(true);
      });
    });

    /* Filter label collapses/expands the filter panel */
    var filterLbl = document.querySelector(".sh-filter");
    var filterSec = document.querySelector(".sh-filtersec");
    if (filterLbl && filterSec) {
      filterLbl.style.cursor = "pointer";
      filterLbl.addEventListener("click", function () {
        filterSec.style.display = (filterSec.style.display === "none") ? "" : "none";
      });
    }

    /* active-filter chips clear their own filter */
    var chipStyle = document.querySelector(".sh-ankara");
    var chipGender = document.querySelector(".sh-gender");
    document.querySelectorAll(".sh-ankara, .sh-gender").forEach(function (chip) {
      chip.style.cursor = "pointer";
    });
    if (chipStyle) chipStyle.addEventListener("click", function () {
      chipStyle.style.display = "none";
      setRows(group("Gender"), true);
      setRows(group("Age group"), true);
      setRows(group("Size"), false);
      [minInp, maxInp].forEach(function (inp) {
        if (inp) { inp.value = ""; inp.dispatchEvent(new Event("input")); }
      });
      apply(true);
    });
    if (chipGender) chipGender.addEventListener("click", function () {
      chipGender.style.display = "none";
      setRows(group("Gender"), true);
      apply(true);
    });

    /* ---------- Min / Max price — typeable + live bound ---------- */
    var pboxes = document.querySelectorAll(".sh-pbox");
    pboxes.forEach(function (box, i) {
      var ph = box.querySelector(".sh-pbox-l");
      var inp = S.overlayInput(box, {
        placeholderEl: ph, aria: i === 0 ? "Min price" : "Max price", autocomplete: "off"
      });
      if (i === 0) minInp = inp;
      else if (i === 1) maxInp = inp;
      if (inp) inp.addEventListener("input", function () { apply(false); });
    });

    /* ---------- Subscribe ---------- */
    var subField = document.querySelector(".sh-input");
    var subBtn = document.querySelector(".sh-subbtn");
    if (subField) {
      var subInp = S.overlayInput(subField, {
        placeholderEl: subField.querySelector(".sh-input-t"),
        type: "email", aria: "Email for subscription"
      });
      if (subBtn) subBtn.addEventListener("click", function () { subscribe(); });
      if (subField.parentElement) {
        subField.addEventListener("keydown", function (e) {
          if (e.key === "Enter") { e.preventDefault(); subscribe(); }
        });
      }
      function subscribe() {
        var v = (subInp && subInp.value || "").trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { S.toast("Please enter a valid email address"); return; }
        if (subInp) subInp.value = "";
        S.toast("Thanks! You are subscribed.");
      }
    }

    /* ---------- hero play button (bounces like the home one) ---------- */
    var play = document.querySelector(".sh-play");
    if (play) {
      play.style.cursor = "pointer";
      play.addEventListener("click", function () {
        play.animate([{ transform: "scale(1)" }, { transform: "scale(.88)" }, { transform: "scale(1)" }],
          { duration: 260, easing: "ease-out" });
      });
    }

    /* ---------- "Summer Shop" promo button (no matching page yet) — stay put ---------- */
    var summer = document.querySelector(".sh-summerbtn");
    if (summer) summer.addEventListener("click", function (e) {
      e.preventDefault();
      S.toast("This collection is coming soon");
    });

    /* ---------- product cards -> product details (with identity) ---------- */
    document.querySelectorAll(".sh-frame, .sh-pname, .sh-price").forEach(function (el) {
      el.style.cursor = "pointer";
      el.addEventListener("click", function () {
        if (el.classList.contains("sh-frame")) { S.goProduct(el); return; }
        var info = null, frame = el;
        for (var i = 0; i < items.length; i++) {
          if (items[i].info && items[i].info.contains(el)) { info = items[i].info; frame = items[i].frame; break; }
        }
        S.goProduct(frame, info);
      });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
