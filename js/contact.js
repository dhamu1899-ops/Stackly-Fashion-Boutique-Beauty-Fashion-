/* =============================================================================
   STACKLY — contact / shipping-details page behaviour
   - banner close, text fields become typeable (design placeholder stays until focus)
   - Country / State / ZIP / phone-code boxes open dropdowns
   - "COntinue to Shipping" validates the form then confirms on this page
     (the payment step of the checkout flow does not exist yet)
   - map of the Stackly location (Salem): image + "View larger map" +
     "Directions" open the real Google Maps listing
============================================================================= */
(function () {
  "use strict";

  var OPTIONS = {
    "Country": ["Indonesia", "Malaysia", "Singapore", "Nigeria", "Ghana", "United States"],
    "State/Province": ["West Java", "Central Java", "Jakarta", "Bali", "Yogyakarta"],
    "ZIP COde": ["40111", "40115", "12920", "16920", "55281"]
  };
  var PHONE_CODES = ["(+62)", "(+1)", "(+44)", "(+61)", "(+234)", "(+233)"];

  function boot() {
    var S = window.STACKLY;
    if (!S) return;

    var inputs = [];   /* { input, label } for validation */
    var countryPh = null;

    /* ---------- text fields vs dropdown fields ---------- */
    document.querySelectorAll(".inp").forEach(function (inp) {
      var labelEl = inp.querySelector(".inp__l");
      var label = labelEl ? labelEl.textContent.trim() : "";
      var field = inp.querySelector(".inp__f");
      if (!field) return;
      var ph = field.querySelector(".inp__p");
      var chev = field.querySelector(".chev");

      if (chev && OPTIONS[label]) {
        /* select box */
        field.style.cursor = "pointer";
        S.dropdown(field, OPTIONS[label], function (pick) {
          if (ph) ph.textContent = pick;
          if (label === "Country") { countryPh = ph; ph.dataset.chosen = "1"; }
        });
        if (label === "Country") countryPh = ph;
      } else if (field.classList.contains("inp__f--area")) {
        /* textarea-style address box */
        inputs.push({ input: makeTextarea(field, ph), label: label });
      } else {
        inputs.push({ input: S.overlayInput(field, { placeholderEl: ph, aria: label }), label: label });
      }
    });

    function makeTextarea(host, ph) {
      var ta = document.createElement("textarea");
      ta.className = "stackly-inp";
      ta.setAttribute("aria-label", "Address");
      ta.style.cssText =
        "position:absolute;box-sizing:border-box;" +
        "border:0;outline:0;background:transparent;resize:none;margin:0;overflow:hidden;" +
        "color:#3e3e3e;caret-color:#8b4513;cursor:text;font:inherit;z-index:20;";
      ta.style.left = host.offsetLeft + "px";
      ta.style.top = host.offsetTop + "px";
      ta.style.width = host.offsetWidth + "px";
      ta.style.height = host.offsetHeight + "px";
      if (ph) {
        var cs = getComputedStyle(ph);
        ta.style.fontFamily = cs.fontFamily;
        ta.style.fontSize = cs.fontSize;
        ta.style.fontWeight = cs.fontWeight;
        ta.style.letterSpacing = cs.letterSpacing;
        var hr = host.getBoundingClientRect(), pr = ph.getBoundingClientRect();
        var scale = host.offsetWidth ? (hr.width / host.offsetWidth) : 1;
        ta.style.paddingLeft = Math.max(0, (pr.left - hr.left) / (scale || 1)) + "px";
        ta.style.paddingTop = Math.max(0, (pr.top - hr.top) / (scale || 1)) + "px";
      }
      (host.offsetParent || document.querySelector(".canvas") || document.body).appendChild(ta);
      function sync() {
        host.classList.toggle("is-focus", document.activeElement === ta);
        if (!ph) return;
        ph.style.visibility = (document.activeElement === ta || ta.value.length) ? "hidden" : "visible";
      }
      ta.addEventListener("focus", sync);
      ta.addEventListener("blur", sync);
      ta.addEventListener("input", sync);
      return ta;
    }

    /* ---------- phone number ---------- */
    var phoneNum = document.querySelector(".phone__num");
    if (phoneNum) {
      inputs.push({
        input: S.overlayInput(phoneNum, { placeholderEl: phoneNum.querySelector(".inp__p"), aria: "Phone Number" }),
        label: "Phone Number"
      });
    }

    /* ---------- phone country code ---------- */
    var cc = document.querySelector(".phone__cc");
    if (cc) {
      var ccPh = cc.querySelector(".inp__p");
      cc.style.cursor = "pointer";
      S.dropdown(cc, PHONE_CODES, function (pick) { if (ccPh) ccPh.textContent = pick; });
    }

    /* ---------- submit ---------- */
    function submit() {
      function byLabel(l) {
        for (var i = 0; i < inputs.length; i++) if (inputs[i].label === l) return inputs[i].input;
        return null;
      }
      var name = byLabel("Name"), email = byLabel("Email"), phone = byLabel("Phone Number"),
          addr = byLabel("Address");
      if (!name || !name.value.trim()) { S.toast("Please enter your name"); return; }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) { S.toast("Please enter a valid email"); return; }
      if (phone && phone.value.replace(/\D/g, "").length < 6) { S.toast("Please enter a valid phone number"); return; }
      if (!addr || !addr.value.trim()) { S.toast("Please enter your address"); return; }
      if (!countryPh || countryPh.dataset.chosen !== "1") { S.toast("Please choose your country"); return; }
      /* details are fine — the next checkout step (payment) has no page yet */
      try { localStorage.setItem("stacklyShipping", JSON.stringify({
        name: name.value.trim(), email: email.value.trim(), phone: phone.value.trim(), addr: addr.value.trim()
      })); } catch (e) {}
      /* never route to 404 — confirm on this page instead */
      S.toast("Shipping details saved — payment is coming soon");
    }

    var ship = document.querySelector(".btn-ship");
    if (ship) ship.addEventListener("click", function (e) { e.preventDefault(); submit(); });

    /* ---------- map of the Stackly location (Salem, Tamil Nadu) ---------- */
    var MAPS = "https://www.google.com/maps/search/?api=1&query=Salem%2C%20Tamil%20Nadu%2C%20India";
    var DIRS = "https://www.google.com/maps/dir/?api=1&destination=Salem%2C%20Tamil%20Nadu%2C%20India";
    function openMaps(url) { window.open(url, "_blank", "noopener"); }
    var mapImg = document.querySelector(".map__img");
    if (mapImg) mapImg.addEventListener("click", function () { openMaps(MAPS); });
    document.querySelectorAll(".mc-link").forEach(function (el) {
      var t = el.textContent.trim();
      if (t === "View larger map") { el.style.cursor = "pointer"; el.addEventListener("click", function () { openMaps(MAPS); }); }
      else if (t === "Directions") { el.style.cursor = "pointer"; el.addEventListener("click", function () { openMaps(DIRS); }); }
    });

    document.querySelectorAll(".inp input, .inp textarea").forEach(function (el) {
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && el.tagName === "INPUT") { e.preventDefault(); submit(); }
      });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
