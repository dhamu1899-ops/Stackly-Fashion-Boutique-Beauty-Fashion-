/* =============================================================================
   STACKLY — product catalog (the trusted price list)
   -----------------------------------------------------------------------------
   product-details.html gets its product identity from the URL (?p=<img key>)
   because that is how the cards navigate. The NAME and the PRICE are NOT read
   from the URL: they are looked up here (QA bug FB-005 — "product price can be
   overridden through URL parameters before adding to cart"). The page shows
   what the catalog says, so a hand-edited ?pr=99999 never reaches the product
   page and never reaches the cart (the cart stores the displayed price).

   Keys are the data-img keys used by the cards on:
     index.html / html/index.html   p1 .. p8
     html/product.html              product-1 .. product-15
     html/shop.html                 shop-2 .. shop-16
     html/product-details.html      wish-1 .. wish-3   (wishlist cards)

   The price is stored exactly as the card prints it (e.g. "₹4,299") so the
   rendered details page stays pixel-identical to the listing it came from.

   >>> If a price or a product name is edited in the listing HTML, edit it
       here too — this file is the value the details page will show. <<<
============================================================================= */
window.STACKLY_CATALOG = {
  /* ---- html/product.html ------------------------------------------------ */
  "product-1":  { name: "Brown Leather Jacket",     price: "\u20b94,299" },
  "product-2":  { name: "T-Shirt Cotton 30S",       price: "\u20b9749" },
  "product-3":  { name: "Black Yellow Square Shirt", price: "\u20b91,599" },
  "product-4":  { name: "White Oversize Cotton",    price: "\u20b9999" },
  "product-5":  { name: "White Men Formal Shirt",   price: "\u20b91,249" },
  "product-6":  { name: "White Men Formal Shirt",   price: "\u20b91,349" },
  "product-7":  { name: "Brown Leather Jacket",     price: "\u20b94,599" },
  "product-8":  { name: "Black Yellow Square Shirt", price: "\u20b91,699" },
  "product-9":  { name: "White Men Formal Shirt",   price: "\u20b91,449" },
  "product-10": { name: "Unisex Orange Sweater",    price: "\u20b91,999" },
  "product-11": { name: "T-Shirt Cotton 30S",       price: "\u20b9849" },
  "product-12": { name: "White Oversize Cotton",    price: "\u20b91,099" },
  "product-13": { name: "White Men Formal Shirt",   price: "\u20b91,549" },
  "product-14": { name: "White Woman Formal Shirt", price: "\u20b91,399" },
  "product-15": { name: "Formal Shirt Men",         price: "\u20b91,649" },

  /* ---- index.html / html/index.html ------------------------------------- */
  "p1": { name: "TEES",                price: "\u20b9799" },
  "p2": { name: "WOMEN DENIM JACKET",  price: "\u20b93,499" },
  "p3": { name: "WOMEN TOP",           price: "\u20b91,499" },
  "p4": { name: "HOLIDAY OUTFIT",      price: "\u20b92,799" },
  "p5": { name: "Black Shirt",         price: "\u20b91,299" },
  "p6": { name: "T-Shirt",             price: "\u20b9699" },
  "p7": { name: "Women Pant",          price: "\u20b91,899" },
  "p8": { name: "Outerwear",           price: "\u20b93,999" },

  /* ---- html/shop.html ---------------------------------------------------- */
  "shop-2":  { name: "Blouse and belted skirt",   price: "\u20b91,899" },
  "shop-3":  { name: "Pink ankara mixed gown",    price: "\u20b92,499" },
  "shop-4":  { name: "A - shaped gown",           price: "\u20b91,599" },
  "shop-5":  { name: "Ankara suit",               price: "\u20b93,299" },
  "shop-6":  { name: "Brown ball gown",           price: "\u20b92,199" },
  "shop-7":  { name: "Male Suit",                 price: "\u20b94,499" },
  "shop-8":  { name: "Flared gown",               price: "\u20b91,799" },
  "shop-9":  { name: "Blouse and belted skirt",   price: "\u20b91,999" },
  "shop-10": { name: "Blouse and belted skirt",   price: "\u20b92,599" },
  "shop-11": { name: "Ankara suit",               price: "\u20b93,499" },
  "shop-12": { name: "Brown ball gown",           price: "\u20b92,299" },
  "shop-13": { name: "Male Suit",                 price: "\u20b94,999" },
  "shop-14": { name: "Blouse and belted skirt",   price: "\u20b92,099" },
  "shop-15": { name: "Pink ankara mixed gown",    price: "\u20b92,799" },
  "shop-16": { name: "A - shaped gown",           price: "\u20b91,699" },

  /* ---- html/product-details.html (wishlist cards) ------------------------ */
  "wish-1": { name: "Womens Denim Jacket", price: "\u20b9699" },
  "wish-2": { name: "Womens Denim Jacket", price: "\u20b91,049" },
  "wish-3": { name: "Womens Denim Jacket", price: "\u20b91,399" }
};
