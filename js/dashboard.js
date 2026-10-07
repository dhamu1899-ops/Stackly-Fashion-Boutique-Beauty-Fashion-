/* =============================================================================
   STACKLY — role-based dashboard
   - the role comes from the signed-in session (STACKLY.session), never from
     the query string: ?role=admin is user-editable and used to render the
     admin dashboard (QA FB-003). Any leftover role= in the URL is dropped.
   - left sidebar menu, right side the section view (same site theme)
   - My Cart reads the live STACKLY cart store; Wishlist can move items to it
   - deep links: dashboard.html#wishlist opens Wishlist directly
   - dead buttons (Add Product) stay on the page with a toast
   - logout -> index.html; logo -> home
============================================================================= */
(function () {
  "use strict";

  var S = window.STACKLY;
  if (!S) return;
  var body = document.getElementById("dbBody");
  if (!body) return;

  /* ---------------------------------------------------------------- role */
  function readRole() {
    /* strip a role parameter if one was typed in — it has no effect and it
       must not stay in the address bar looking like it does */
    try {
      if (/[?&]role=/.test(location.search)) {
        var q = location.search.replace(/[?&]role=[^&]*/g, "").replace(/^&/, "?");
        history.replaceState(null, "", location.pathname + (q === "?" ? "" : q) + location.hash);
      }
    } catch (e) {}
    var s = S.session ? S.session() : null;
    return s && s.role === "admin" ? "admin" : "user";
  }
  var ROLE = readRole();

  /* ------------------------------------------------------- identity bits */
  var EMAIL = "";
  try { EMAIL = localStorage.getItem("stacklyUser") || ""; } catch (e) {}
  var WHO = EMAIL ? EMAIL.split("@")[0].replace(/[._-]+/g, " ") : "Shopper";
  var WHO_CAP = WHO.charAt(0).toUpperCase() + WHO.slice(1);
  var AVATAR = (EMAIL ? EMAIL.charAt(0) : "S").toUpperCase();

  /* ------------------------------------------------------------- helpers */
  function img(key) {
    var p = (window.IMAGES && IMAGES[key]) || "assets/store.webp";
    return window.resolveAsset ? window.resolveAsset(p) : ("../" + p);
  }
  function inr(n) { return S.inr(n); }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function card(title, inner) { return '<section class="db-card"><h3>' + title + "</h3>" + inner + "</section>"; }

  /* ---------------------------------------------------------------- icons */
  var IC = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.8V21h5v-6h4v6h5V9.8"/></svg>',
    orders: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4a3 3 0 0 1 6 0"/><path d="M9 11h6M9 15h4"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20s-7.5-4.7-9.3-9.4C1.4 7.3 3.6 4 7 4c2 0 3.7 1.2 5 3 1.3-1.8 3-3 5-3 3.4 0 5.6 3.3 4.3 6.6C19.5 15.3 12 20 12 20z"/></svg>',
    cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h2.2l2.3 10.5h9.6L19.5 7H6.3"/><circle cx="9.5" cy="19" r="1.5"/><circle cx="17.5" cy="19" r="1.5"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/></svg>',
    cog: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.11a1.7 1.7 0 0 0-1.11-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.11A1.7 1.7 0 0 0 4.6 8.9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.09A1.7 1.7 0 0 0 10.1 3V3a2 2 0 1 1 4 0v.11a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.09a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.11a1.7 1.7 0 0 0-1.49 1.01z"/></svg>',
    box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8.5 12 3 3 8.5v7L12 21l9-5.5z"/><path d="M3 8.5 12 14l9-5.5M12 14v7"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.4"/><path d="M2.5 20c0-3.4 2.9-5.6 6.5-5.6s6.5 2.2 6.5 5.6"/><path d="M16 4.7a3.4 3.4 0 0 1 0 6.6M17.5 14.7c2.4.7 4 2.6 4 5.3"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/></svg>',
    bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7h12l1.2 13H4.8z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/></svg>',
    rub: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M7 20V4h6.5a4.5 4.5 0 0 1 0 9H7m0 0 8 7"/></svg>'
  };

  /* ---------------------------------------------------------------- data */
  var WISHLIST = [
    { key: "p1",     name: "TEES",                  cat: "T-Shirt",  price: 799 },
    { key: "p3",     name: "WOMEN TOP",             cat: "Top",      price: 1499 },
    { key: "p4",     name: "HOLIDAY OUTFIT",        cat: "Outfit",   price: 2799 },
    { key: "p5",     name: "BLACK SHIRT",           cat: "Shirt",    price: 1299 },
    { key: "shop-2", name: "Blouse and belted skirt", cat: "Skirt",   price: 1899 },
    { key: "shop-6", name: "Brown ball gown",       cat: "Gown",     price: 2199 }
  ];
  var RECOMMENDED = [
    { key: "p1", name: "TEES",        price: 799 },
    { key: "p6", name: "T-SHIRT",     price: 699 },
    { key: "p3", name: "WOMEN TOP",   price: 1499 },
    { key: "p8", name: "OUTERWEAR",   price: 3999 }
  ];
  var USER_ORDERS = [
    ["#SK-1042", "12 Sep 2026", "3 items", 2397, "Delivered", "ok"],
    ["#SK-1039", "04 Sep 2026", "1 item",  1899, "Shipping",  "ship"],
    ["#SK-1031", "27 Aug 2026", "2 items", 3499, "Delivered", "ok"],
    ["#SK-1024", "15 Aug 2026", "4 items", 5297, "Delivered", "ok"],
    ["#SK-1019", "02 Aug 2026", "1 item",  699,  "Cancelled", "bad"],
    ["#SK-1011", "21 Jul 2026", "2 items", 2798, "Delivered", "ok"]
  ];
  var ADMIN_ORDERS = [
    ["#SK-1042", "Arjun Sharma", "12 Sep 2026", 2397, "Delivered", "ok"],
    ["#SK-1041", "Rita Kumar",   "11 Sep 2026", 4499, "Processing", "proc"],
    ["#SK-1040", "Mani Iyer",    "10 Sep 2026", 1599, "Shipping",   "ship"],
    ["#SK-1039", "Sneha Patel",  "09 Sep 2026", 1899, "Shipping",   "ship"],
    ["#SK-1038", "Dev Reddy",    "08 Sep 2026", 799,  "Delivered",  "ok"],
    ["#SK-1037", "Fara Khan",    "07 Sep 2026", 3999, "Processing", "proc"]
  ];
  var PRODUCTS = [
    { key: "shop-2", name: "Blouse and belted skirt",   cat: "Women",  price: 1899, stock: 24, status: "Active",      pill: "ok" },
    { key: "shop-3", name: "Pink ankara mixed gown",    cat: "Women",  price: 2499, stock: 12, status: "Active",      pill: "ok" },
    { key: "shop-5", name: "Ankara suit",               cat: "Unisex", price: 3299, stock: 0,  status: "Out of stock", pill: "bad" },
    { key: "shop-7", name: "Male Suit",                 cat: "Men",    price: 4499, stock: 6,  status: "Active",      pill: "ok" },
    { key: "shop-6", name: "Brown ball gown",           cat: "Women",  price: 2199, stock: 5,  status: "Low stock",   pill: "ship" },
    { key: "p1",     name: "TEES",                      cat: "Men",    price: 799,  stock: 48, status: "Active",      pill: "ok" },
    { key: "p3",     name: "WOMEN TOP",                 cat: "Women",  price: 1499, stock: 18, status: "Active",      pill: "ok" },
    { key: "p8",     name: "OUTERWEAR",                 cat: "Unisex", price: 3999, stock: 3,  status: "Low stock",   pill: "ship" }
  ];
  var CUSTOMERS = [
    ["Arjun Sharma", "arjun.sharma@gmail.com", 12, 24973],
    ["Rita Kumar",   "rita.kumar@yahoo.com",    8, 18240],
    ["Mani Iyer",    "mani.iyer@outlook.com",   5,  9870],
    ["Sneha Patel",  "sneha.patel@gmail.com",   4,  7455],
    ["Dev Reddy",    "dev.reddy@gmail.com",     2,  3198]
  ];
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];
  var REVENUE = [320, 410, 380, 520, 470, 610, 560, 720];   /* ₹ thousands */

  function cartCount() {
    try { return S.cartItems().reduce(function (s, i) { return s + i.qty; }, 0); } catch (e) { return 0; }
  }

  /* --------------------------------------------------------------- pieces */
  function statCard(label, value, delta, icon, down) {
    return '<section class="db-card db-stat"><span>' + (IC[icon] || IC.box) + label +
      "</span><b>" + value + "</b>" +
      (delta ? '<i class="' + (down ? "down" : "") + '">' + delta + "</i>" : "") + "</section>";
  }

  function productCard(p, acts) {
    return '<article class="db-p">' +
      '<div class="db-p__img" style="background-image:url(\'' + img(p.key) + "')\"></div>" +
      '<div class="db-p__b">' +
      '<span class="db-p__c">' + esc(p.cat || "") + "</span>" +
      '<span class="db-p__n">' + esc(p.name) + "</span>" +
      '<span class="db-p__price">' + inr(p.price) + "</span>" +
      '<div class="db-p__acts">' + acts(p) + "</div>" +
      "</div></article>";
  }

  function addBtn(p, label) {
    return '<button class="db-btn db-btn--sm" data-act="add" data-key="' + p.key +
      '" data-name="' + esc(p.name) + '" data-price="' + p.price + '">' + (label || "Add to cart") + "</button>";
  }

  function chart(values, maxPx) {
    var max = Math.max.apply(null, values);
    return '<div class="db-chart">' + values.map(function (v, i) {
      return '<div class="db-bar"><b>' + (v >= 1000 ? inr(v) : "₹" + v + "k") + "</b>" +
        '<i style="height:' + Math.max(8, Math.round(v / max * maxPx)) + 'px"></i>' +
        "<span>" + MONTHS[i] + "</span></div>";
    }).join("") + "</div>";
  }

  function ordersTable(rows, who) {
    var head = who
      ? "<tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th></tr>"
      : "<tr><th>Order</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th></tr>";
    return '<div style="overflow-x:auto"><table class="db-table"><thead>' + head + "</thead><tbody>" +
      rows.map(function (r) {
        /* both roles: [id, customer|date, date|items, total, status, pill] — 5 cells */
        return "<tr>" +
          '<td class="num">' + r[0] + "</td>" +
          "<td>" + esc(r[1]) + "</td>" +
          "<td>" + esc(r[2]) + "</td>" +
          '<td class="num">' + inr(r[3]) + "</td>" +
          '<td><span class="db-pill db-pill--' + r[5] + '">' + r[4] + "</span></td>" +
          "</tr>";
      }).join("") + "</tbody></table></div>";
  }

  /* ================================================================ USER */
  function userHome() {
    return (
      '<section class="db-hello"><div><h2>Welcome back, ' + esc(WHO_CAP) + "!</h2>" +
      "<p>Here's a quick look at your Stackly account today.</p></div>" +
      '<button class="db-btn" data-act="go" data-url="shop.html">Continue shopping</button></section>' +

      '<div class="db-stats">' +
      statCard("Total orders", "12", "+2 this month", "orders") +
      statCard("Wishlist items", String(WISHLIST.length), "", "heart") +
      statCard("Cart items", String(cartCount()), cartCount() ? "in your cart" : "cart is empty", "cart") +
      statCard("Total spent", inr(24973), "+8.4% vs last month", "rub") +
      "</div>" +

      '<div class="db-two">' +
      card("Recent orders", ordersTable(USER_ORDERS.slice(0, 3), false)) +
      card("Low stock today", '<div class="db-rank">' +
        PRODUCTS.filter(function (p) { return p.stock <= 6; }).map(function (p) {
          return '<div class="db-rank__i"><div><b>' + esc(p.name) + "</b><span>" + p.stock + " left</span></div>" +
            '<div class="db-prog"><i style="width:' + Math.max(6, p.stock / 6 * 100) + '%"></i></div></div>';
        }).join("") + "</div>") +
      "</div>" +

      card("Recommended for you", '<div class="db-grid">' +
        RECOMMENDED.map(function (p) {
          return productCard(p, function (x) { return addBtn(x); });
        }).join("") + "</div>")
    );
  }

  function userOrders() {
    return card("All orders", ordersTable(USER_ORDERS, false));
  }

  function userWishlist() {
    if (!WISHLIST.length) {
      return '<section class="db-card"><div class="db-empty">' + IC.heart +
        "<b>Your wishlist is empty</b><p>Save products you love and they will show up here.</p>" +
        '<button class="db-btn" data-act="go" data-url="shop.html">Browse products</button></div></section>';
    }
    return card("Saved products (" + WISHLIST.length + ")", '<div class="db-grid">' +
      WISHLIST.map(function (p) {
        return productCard(p, function (x) {
          return addBtn(x, "Move to cart") +
            '<button class="db-btn db-btn--ghost db-btn--sm" data-act="wish-rm" data-name="' + esc(x.name) + '">Remove</button>';
        });
      }).join("") + "</div>");
  }

  function userCart() {
    var items;
    try { items = S.cartItems(); } catch (e) { items = []; }
    if (!items.length) {
      return '<section class="db-card"><div class="db-empty">' + IC.cart +
        "<b>Your cart is empty</b><p>Products you add to the cart show up here instantly.</p>" +
        '<button class="db-btn" data-act="go" data-url="shop.html">Browse products</button></div></section>';
    }
    var sub = items.reduce(function (s, i) { return s + i.price * i.qty; }, 0);
    return card("My cart (" + cartCount() + ")",
      '<div style="overflow-x:auto"><table class="db-table"><thead><tr><th>Product</th><th>Price</th><th>Qty</th><th>Total</th></tr></thead><tbody>' +
      items.map(function (i) {
        return "<tr><td><div class=\"db-cell\"><div class=\"db-thumb\" style=\"background-image:url('" +
          img(i.img) + "')\"></div><b>" + esc(i.name) + "</b></div></td>" +
          '<td class="num">' + inr(i.price) + "</td>" +
          "<td>" + i.qty + '</td><td class="num">' + inr(i.price * i.qty) + "</td></tr>";
      }).join("") +
      '</tbody></table></div>' +
      '<div class="db-form__acts" style="margin-top:16px;justify-content:space-between">' +
      '<b style="align-self:center">Subtotal: ' + inr(sub) + "</b>" +
      '<span><button class="db-btn db-btn--ghost" data-act="go" data-url="shop.html">Add more</button> ' +
      '<button class="db-btn" data-act="go" data-url="cart.html">Open cart</button></span></div>');
  }

  function userProfile() {
    return '<section class="db-card"><div class="db-form">' +
      "<h3>My profile</h3>" +
      '<p class="db-hint">Account details used for orders and delivery updates.</p>' +
      '<div class="db-field"><label for="pf-name">Full name</label><input id="pf-name" value="' + esc(WHO_CAP) + '"></div>' +
      '<div class="db-field"><label for="pf-mail">Email</label><input id="pf-mail" type="email" value="' + esc(EMAIL) + '" placeholder="you@example.com"></div>' +
      '<div class="db-field"><label for="pf-phone">Phone</label><input id="pf-phone" value="+91 98765 43210"></div>' +
      '<div class="db-field"><label for="pf-addr">Address</label><input id="pf-addr" value="14, Main Road, Salem"></div>' +
      '<div class="db-form__acts"><button class="db-btn" data-act="save-profile">Save changes</button>' +
      '<button class="db-btn db-btn--ghost" data-act="go" data-url="index.html">Cancel</button></div>' +
      "</div></section>";
  }

  function userSettings() {
    return '<section class="db-card"><div style="max-width:620px"><h3>Settings</h3>' +
      sw("Order updates by email", "Shipping and delivery notifications", true) +
      sw("SMS updates", "Text messages for order status", false) +
      sw("Deals & offers", "Weekly discounts and new arrivals", true) +
      sw("Wishlist price drops", "Tell me when a saved item gets cheaper", true) +
      '<div class="db-form__acts" style="margin-top:18px"><button class="db-btn" data-act="save-settings">Save settings</button></div>' +
      "</div></section>";
  }

  function sw(title, sub, on) {
    return '<div class="db-sw"><div class="db-sw__t"><b>' + title + "</b><span>" + sub + "</span></div>" +
      '<button class="db-sw__k' + (on ? " is-on" : "") + '" data-act="sw" aria-label="' + esc(title) + '"></button></div>';
  }

  /* ================================================================ ADMIN */
  function adminHome() {
    return (
      '<section class="db-hello"><div><h2>Store overview</h2>' +
      "<p>Stackly performance for the last 30 days.</p></div>" +
      '<button class="db-btn" data-act="go" data-url="index.html">View storefront</button></section>' +

      '<div class="db-stats">' +
      statCard("Revenue", inr(482300), "+12.4% vs last month", "rub") +
      statCard("Orders", "128", "+4.1% vs last month", "orders") +
      statCard("Customers", "96", "+7 new this month", "users") +
      statCard("Products", "48", "3 low in stock", "box", true) +
      "</div>" +

      '<div class="db-two">' +
      card("Revenue by month", chart(REVENUE, 150)) +
      card("Order status", '<div class="db-rank">' +
        [["Delivered", 64, "ok"], ["Shipping", 21, "ship"], ["Processing", 12, "proc"], ["Cancelled", 3, "bad"]]
          .map(function (r) {
            return '<div class="db-rank__i"><div><b>' + r[0] + "</b><span>" + r[1] + " orders</span></div>" +
              '<div class="db-prog"><i style="width:' + Math.round(r[1] / 64 * 100) + '%"></i></div></div>';
          }).join("") + "</div>") +
      "</div>" +

      card("Latest orders", ordersTable(ADMIN_ORDERS.slice(0, 4), true))
    );
  }

  function adminProducts() {
    return card("Products (" + PRODUCTS.length + ")",
      '<div class="db-tools"><input id="pd-search" placeholder="Search products…" aria-label="Search products">' +
      '<button class="db-btn" data-act="404">+ Add Product</button></div>' +
      '<div style="overflow-x:auto"><table class="db-table" id="pd-table"><thead><tr>' +
      "<th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th></tr></thead><tbody>" +
      PRODUCTS.map(function (p) {
        return "<tr><td><div class=\"db-cell\"><div class=\"db-thumb\" style=\"background-image:url('" + img(p.key) +
          "')\"></div><b>" + esc(p.name) + "</b></div></td>" +
          "<td>" + p.cat + '</td><td class="num">' + inr(p.price) + "</td>" +
          "<td>" + p.stock + '</td><td><span class="db-pill db-pill--' + p.pill + '">' + p.status + "</span></td></tr>";
      }).join("") + "</tbody></table></div>");
  }

  function adminOrders() {
    return card("All orders", ordersTable(ADMIN_ORDERS, true));
  }

  function adminCustomers() {
    return card("Customers (" + CUSTOMERS.length + ")",
      '<div style="overflow-x:auto"><table class="db-table"><thead><tr>' +
      "<th>Customer</th><th>Email</th><th>Orders</th><th>Total spent</th></tr></thead><tbody>" +
      CUSTOMERS.map(function (c) {
        return "<tr><td><div class=\"db-cell\"><span class=\"db-av\" style=\"width:34px;height:34px;font-size:13px\">" +
          c[0].charAt(0) + "</span><b>" + esc(c[0]) + "</b></div></td>" +
          "<td>" + esc(c[1]) + "</td><td>" + c[2] + '</td><td class="num">' + inr(c[3]) + "</td></tr>";
      }).join("") + "</tbody></table></div>");
  }

  function adminReports() {
    return (
      '<div class="db-stats">' +
      statCard("Revenue (YTD)", inr(4060000), "+18% vs last year", "rub") +
      statCard("Avg. order value", inr(3768), "+₹212", "orders") +
      statCard("Repeat buyers", "41%", "+3 pts", "users") +
      "</div>" +
      card("Monthly revenue", chart(REVENUE, 170)) +
      card("Top products", '<div class="db-rank">' +
        [["TEES", 82], ["Brown ball gown", 64], ["Womens Denim Jacket", 57], ["Blouse and belted skirt", 45], ["OUTERWEAR", 38]]
          .map(function (r) {
            return '<div class="db-rank__i"><div><b>' + r[0] + "</b><span>" + r[1] + "% of target</span></div>" +
              '<div class="db-prog"><i style="width:' + r[1] + '%"></i></div></div>';
          }).join("") + "</div>")
    );
  }

  function adminSettings() {
    return '<section class="db-card"><div style="max-width:620px"><h3>Store settings</h3>' +
      sw("Store open", "Accept new orders on the storefront", true) +
      sw("Maintenance mode", "Hide the storefront while you update it", false) +
      sw("Product reviews", "Let customers rate purchased products", true) +
      sw("Auto low-stock alerts", "Email me when stock drops below 5", true) +
      '<div class="db-form__acts" style="margin-top:18px"><button class="db-btn" data-act="save-settings">Save settings</button></div>' +
      "</div></section>";
  }

  /* ================================================================ MENU */
  var MENUS = {
    user: [
      { id: "home",     label: "Dashboard",  icon: "home" },
      { id: "orders",   label: "My Orders",  icon: "orders" },
      { id: "wishlist", label: "Wishlist",   icon: "heart" },
      { id: "cart",     label: "My Cart",    icon: "cart", count: true },
      { id: "profile",  label: "My Profile", icon: "user" },
      { id: "settings", label: "Settings",   icon: "cog" }
    ],
    admin: [
      { id: "home",     label: "Overview",   icon: "home" },
      { id: "products", label: "Products",   icon: "box" },
      { id: "orders",   label: "Orders",     icon: "orders" },
      { id: "customers",label: "Customers",  icon: "users" },
      { id: "reports",  label: "Reports",    icon: "chart" },
      { id: "settings", label: "Settings",   icon: "cog" }
    ]
  };
  var SECTIONS = {
    user: { home: userHome, orders: userOrders, wishlist: userWishlist, cart: userCart, profile: userProfile, settings: userSettings },
    admin: { home: adminHome, products: adminProducts, orders: adminOrders, customers: adminCustomers, reports: adminReports, settings: adminSettings }
  };
  var TITLES = {
    user: { home: "Dashboard", orders: "My Orders", wishlist: "Wishlist", cart: "My Cart", profile: "My Profile", settings: "Settings" },
    admin: { home: "Overview", products: "Products", orders: "Orders", customers: "Customers", reports: "Reports", settings: "Settings" }
  };

  var menuEl = document.getElementById("dbMenu");
  var titleEl = document.getElementById("dbTitle");
  var current = "";

  function validId(id) { return !!(id && SECTIONS[ROLE][id]); }

  function renderMenu() {
    menuEl.innerHTML = MENUS[ROLE].map(function (m) {
      return '<button class="db-mitem" data-id="' + m.id + '" type="button">' +
        IC[m.icon] + "<span>" + m.label + "</span>" +
        '<b class="db-mitem__n" data-count="' + (m.count ? "1" : "") + '"></b></button>';
    }).join("");
  }

  function paintCounts() {
    var n = cartCount();
    menuEl.querySelectorAll(".db-mitem__n").forEach(function (b) {
      if (b.dataset.count) {
        b.textContent = n;
        b.style.display = n ? "grid" : "none";
      }
    });
    var chip = document.getElementById("dbCartN");
    if (chip) { chip.textContent = n; chip.classList.toggle("is-zero", !n); }
  }

  function render(id) {
    if (!validId(id)) id = MENUS[ROLE][0].id;
    current = id;
    menuEl.querySelectorAll(".db-mitem").forEach(function (b) {
      b.classList.toggle("is-on", b.dataset.id === id);
    });
    titleEl.textContent = TITLES[ROLE][id] || "Dashboard";
    body.innerHTML = SECTIONS[ROLE][id]();
    paintCounts();
    wire();
    try { history.replaceState(null, "", location.pathname + location.search + "#" + id); } catch (e) {}
    window.scrollTo({ top: 0 });
  }

  /* ------------------------------------------------------------- wiring */
  function wire() {
    body.querySelectorAll("[data-act]").forEach(function (el) {
      var act = el.dataset.act;
      if (act === "add") {
        el.addEventListener("click", function () {
          S.addToCart(el.dataset.name, parseInt(el.dataset.price, 10) || 0, 1, el.dataset.key);
          paintCounts();
        });
      } else if (act === "wish-rm") {
        el.addEventListener("click", function () {
          var name = el.dataset.name;
          var i = WISHLIST.findIndex(function (w) { return w.name === name; });
          if (i >= 0) WISHLIST.splice(i, 1);
          var c = el.closest(".db-p");
          if (c) {
            c.style.transition = "opacity .2s, transform .2s";
            c.style.opacity = "0";
            c.style.transform = "scale(.96)";
            setTimeout(function () { render("wishlist"); }, 180);
          }
          S.toast("Removed from wishlist");
          paintCounts();
        });
      } else if (act === "go") {
        el.addEventListener("click", function () { S.go(el.dataset.url); });
      } else if (act === "404") {
        el.addEventListener("click", function (e) {
          e.preventDefault();
          S.toast("Adding products is coming soon");
        });
      } else if (act === "save-profile") {
        el.addEventListener("click", function () {
          var mail = (document.getElementById("pf-mail") || {}).value || "";
          if (mail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
            try { localStorage.setItem("stacklyUser", mail); } catch (e) {}
            EMAIL = mail;
          }
          S.toast("Profile saved");
        });
      } else if (act === "save-settings") {
        el.addEventListener("click", function () { S.toast("Settings saved"); });
      } else if (act === "sw") {
        el.addEventListener("click", function () { el.classList.toggle("is-on"); });
      }
    });

    var search = document.getElementById("pd-search");
    if (search) {
      search.addEventListener("input", function () {
        var q = search.value.trim().toLowerCase();
        var rows = document.querySelectorAll("#pd-table tbody tr");
        rows.forEach(function (r) {
          r.style.display = !q || r.textContent.toLowerCase().indexOf(q) >= 0 ? "" : "none";
        });
      });
    }
  }

  /* ---------------------------------------------------------- chrome bits */
  menuEl.addEventListener("click", function (e) {
    var b = e.target.closest(".db-mitem");
    if (!b) return;
    render(b.dataset.id);
    closeNav();
  });

  var side = document.getElementById("dbSide");
  var scrim = document.getElementById("dbScrim");
  var burger = document.getElementById("dbBurger");
  function closeNav() { side.classList.remove("is-open"); scrim.classList.remove("is-on"); }
  if (burger) burger.addEventListener("click", function () {
    side.classList.toggle("is-open");
    scrim.classList.toggle("is-on", side.classList.contains("is-open"));
  });
  if (scrim) scrim.addEventListener("click", closeNav);

  var out = document.getElementById("dbLogout");
  if (out) out.addEventListener("click", function () {
    try {
      localStorage.removeItem("stacklyUser");
      localStorage.removeItem("stacklyRole");
    } catch (e) {}
    S.toast("Logged out successfully");
    setTimeout(function () { S.go("index.html"); }, 400);
  });

  var storedUser = "";
  try { storedUser = localStorage.getItem("stacklyUser") || ""; } catch (e) {}
  var displayUser = storedUser ? storedUser.split("@")[0].toUpperCase() : ROLE.toUpperCase();
  var displayInitial = storedUser ? storedUser.charAt(0).toUpperCase() : AVATAR;

  document.getElementById("dbRole").textContent = ROLE.toUpperCase();
  document.getElementById("dbChip").textContent = displayUser;
  document.getElementById("dbAv").textContent = displayInitial;
  if (ROLE === "admin") document.getElementById("dbCartChip").style.display = "none";

  window.addEventListener("hashchange", function () {
    var id = location.hash.replace("#", "");
    if (validId(id) && id !== current) render(id);
  });

  /* --------------------------------------------------------------- start */
  renderMenu();
  render(location.hash.replace("#", "") || MENUS[ROLE][0].id);
})();
