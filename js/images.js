/* =============================================================================
   IMAGES — the ONE place where every image on every page is defined.
   -----------------------------------------------------------------------------
   Every empty image box in any <page>.html has a  data-img="key"  attribute.
   Put a file path (or URL) below and that image appears in that box.
   Leave it as "" and the box stays empty (current state).

   Example:
      hero: "assets/hero.webp",

   ALL SLOTS AT ONCE:
      Set DEFAULT to one path (e.g. "assets/sample.webp") and EVERY box on the
      whole site will show that same image. Any key listed below overrides DEFAULT.

   Keys per page are also listed in <page>.imgkeys.json (auto-generated from
   this project's specs — keep them in sync, or rerun: node merge-images.mjs).
============================================================================= */

const DEFAULT_IMAGE = "assets/store.webp";      // <-- ONE path fills EVERY box (store interior photo)

const IMAGES = {
  "wish-1": "assets/wish-1.webp",
  "wish-2": "assets/wish-2.webp",
  "wish-3": "assets/wish-3.webp",

  /* --- index / home (28 slots) — all images from the Home design files --- */
  // hero = full hero background (1440x1024), promoTop/promoJacket = card thumbnails (share promo.jpg), catWoman/catMan/catCasual = category blocks, p1-p8 = product photos (315x420: TEES/DENIM/WOMEN TOP/HOLIDAY + BLACK SHIRT/T-SHIRT/PANT/OUTERWEAR), video = 1356x763, ig1-ig7 = instagram strip, s1-s3 = service icons 78x78, pr1-pr3 = Our Progress photos 400x378
  hero: "assets/hero.webp",
  promoTop: "assets/promo.webp",
  promoJacket: "assets/promo.webp",
  catWoman: "assets/cat-woman.webp",
  catMan: "assets/cat-man.webp",
  catCasual: "assets/cat-casual.webp",
  p1: "assets/p1.webp",
  p2: "assets/p2.webp",
  p3: "assets/p3.webp",
  p4: "assets/p4.webp",
  p5: "assets/p5.webp",
  p6: "assets/p6.webp",
  p7: "assets/p7.webp",
  p8: "assets/p8.webp",
  video: "assets/video-thumb.webp",
  ig1: "assets/ig1.webp",
  ig2: "assets/ig2.webp",
  ig3: "assets/ig3.webp",
  ig4: "assets/ig4.webp",
  ig5: "assets/ig5.webp",
  ig6: "assets/ig6.webp",
  ig7: "assets/ig7.webp",
  s1: "assets/s1.webp",
  s2: "assets/s2.webp",
  s3: "assets/s3.webp",
  pr1: "assets/pr1.webp",
  pr2: "assets/pr2.webp",
  pr3: "assets/pr3.webp",

  /* --- login (1 slot) --- */
  // login-1 = full left photo panel (720x1024) behind the white STACKLY logo — user's photo from the 'login,signup,404 image' folder (39607da9...jpg, 1402x2104)
  "login-1": "assets/login-panel.webp",

  /* --- sign (1 slot) --- */
  // sign-1 = the 720x1024 left photo panel (Frame 1368 @0,0, fill=IMAGE) behind the white STACKLY logo — the ONLY image fill in the frame. Same user photo as login-1 (both panels share it). Everything else is text, 1px strokes and vector icons (3 eye-slash icons + 1 arrow-right, drawn as inline SVG).
  "sign-1": "assets/login-panel.webp",

  /* --- about (16 slots) — exact images from the About page design (SVG coords matched 1:1) --- */
  // about-1 = hero band 'We believe...' (0,221 1440x647), about-2 = big box under About Us text (60,1337 1320x655 r10), about-3 = mission banner (64,2037 1316x281), about-4/5 = portrait photos (145/751,2494 505x626), about-6..11 = category thumbs (SHIRTS/DENIM/TEES/PANTS/SWEATERS/OUTERWEAR, y3337), about-12/13/14 = New Arrivals / Best-Sellers / Holiday Outfit banners (y3738), about-15/16 = featured blog photos (64,4673 / 883,4678 461x361)
  "about-1": "assets/about-1.webp",
  "about-2": "assets/about-2.webp",
  "about-3": "assets/about-3.webp",
  "about-4": "assets/about-4.webp",
  "about-5": "assets/about-5.webp",
  "about-6": "assets/about-6.webp",
  "about-7": "assets/about-7.webp",
  "about-8": "assets/about-8.webp",
  "about-9": "assets/about-9.webp",
  "about-10": "assets/about-10.webp",
  "about-11": "assets/about-11.webp",
  "about-12": "assets/about-12.webp",
  "about-13": "assets/about-13.webp",
  "about-14": "assets/about-14.webp",
  "about-15": "assets/about-15.webp",
  "about-16": "assets/about-16.webp",

  /* --- product (18 slots) --- */
  // 16 IMAGE fills in spec (all 315x420 product photos + one 410x301 card photo), listed in HTML document order. product-1 = visible card @1017,372 'Jacket / Brown Leather jacket'; product-2 = @549,380 'Hoodie and Sweater / T-shirt Cotton 30S'; product-3 = @549,948 tall card 'shirt / Black Yellow Square Shirt'; product-4 = @1017,954 'Hoodie and Sweater / White Oversize Cotton'; product-5 = @549,1561 'Jacket / white men formal shirt'; product-6 = @1017,1561 'shirt / white men formal shirt'. product-7..15 = the off-canvas component grid Frame 94846 @2213,1267 (outside the 1440 frame, clipped): row1 y=1267 → 7:@2213, 8:@2733.5, 9:@3254; row2 y=1860 → 10:@2213, 11:@2733.5, 12:@3254; row3 y=2417 → 13:@2213, 14:@2733.5, 15:@3254. product-16 = 'Similar Products' middle card Frame 97 @529,2347 (410x301). product-17/18 = the left (@56,2347) and right (@988,2347) 'Similar Products' card photos (410x301).
  // All 18 = UNIQUE Pexels photos (downloaded 2026-10), matched to each card's product name: 1 = brown leather texture, 2 = gray hoodie worn outdoors, 3 = plaid (square-pattern) shirt, 4 = white oversize tee, 5 = man in shirt+sunglasses, 6 = two men in suits, 7/8/9/10 = hoodie series, 11/12/13 = knit sweater series, 14/15 = sneakers, 16 = gray suit, 17 = green gown, 18 = man in blue suit.
  "product-1": "assets/prod-1.webp",
  "product-2": "assets/prod-2.webp",
  "product-3": "assets/prod-3.webp",
  "product-4": "assets/prod-4.webp",
  "product-5": "assets/prod-5.webp",
  "product-6": "assets/prod-6.webp",
  "product-7": "assets/prod-7.webp",
  "product-8": "assets/prod-8.webp",
  "product-9": "assets/prod-9.webp",
  "product-10": "assets/prod-10.webp",
  "product-11": "assets/prod-11.webp",
  "product-12": "assets/prod-12.webp",
  "product-13": "assets/prod-13.webp",
  "product-14": "assets/prod-14.webp",
  "product-15": "assets/prod-15.webp",
  "product-16": "assets/wish-2.webp",
  "product-17": "assets/wish-1.webp",
  "product-18": "assets/wish-3.webp",

  /* --- product-details (9 slots) --- */
  // pd-1 = main product photo 'image 2' (656x875 @46,274, fill=IMAGE). pd-2..pd-6 = the five 80x121 thumbnail rectangles under the gallery (Rectangle 1..5 @55,1187 / 187,1188 / 319,1187 / 462,1187 / 582,1183). pd-7 / pd-8 / pd-9 = the 410x301 product images of the three 'Womens Denim Jacket' wishlist cards (@56,1531 / @529,1531 / @988,1531).
  // Sources: pd-1 = white tee torso shot (Pexels px-tshirt-5); pd-2..6 = five DIFFERENT white-tee photos = the "5 type different angle" gallery (Pexels px-tee-1 back walk / px-tee-2 collar detail / px-tee-3 worn front / px-tee2-4 two models / px-tee2-5 back view). pd-7/8/9 = the design's own export assets/denim-jacket.png (630x840, the exact 'wOMEN DENIM JACKET' layer export — same photo repeated because the design repeats the same card 3x).
  "pd-1": "assets/pd-tee-main.webp",
  "pd-2": "assets/pd-tee-a.webp",
  "pd-3": "assets/pd-tee-b.webp",
  "pd-4": "assets/pd-tee-c.webp",
  "pd-5": "assets/pd-tee-d.webp",
  "pd-6": "assets/pd-tee-e.webp",
  "pd-7": "assets/wish-1.webp",
  "pd-8": "assets/wish-2.webp",
  "pd-9": "assets/wish-3.webp",

  /* --- cart (3 slots) --- */
  // cart-1 = product 1 thumbnail (116x155), cart-2 = product 2 thumbnail (140x187), cart-3 = product 3 thumbnail (140x187) — rest-state rows use the same product photos as the home featured grid (p1/p3/p7) so cart rows match what was "added" from the design's featured products.
  "cart-1": "assets/p1.webp",
  "cart-2": "assets/p3.webp",
  "cart-3": "assets/p7.webp",

  /* --- blog (9 slots) --- */
  // 9 image fills, in spec order top-to-bottom: blog-1 = Section 01 hero band 1440x750 @0,226 (fill=IMAGE, white 'Style / How To Style Winter Whites' title + subtitle sit on top); blog-2 = tall feature article photo 926x1054 @334,1450; blog-3/4/5 = the three post-card thumbnails at y4201 (395x413, 413x413, 428x413) under titles 'How To Style Winter Whites', 'We Won A Glossy Award', 'Coordinate Your Style: Matching Outfits for Everyone'; blog-6 = mid-page photo 739x809 @376,2793; blog-7/8/9 = the three 423x287 'More to Explore' thumbnails @3738 at x34/508/982, above the 'Our Product / Our Stores / Our Careers' labels. Everything else is text, 1px strokes and vector icons (banner x-mark, search/user/cart icons, 3 social icons in the intro row, 4 footer social icons) drawn as inline SVG approximations.
  // Files from the user's Blog.images folder (exported 16:46-16:48, newer than the 11:21 page SVGs = source of truth). Mapping: every file matches its slot exactly by dimensions; the three 423x287 trio files image (2)/(3)/(4) map to x34/508/x982 by the user's export numbering, which follows a verified top-to-bottom, left-to-right sweep of the page (image.png=blog-2 y1450, image (1)=blog-6 y2793, image (5)/(6)/(7)=post row confirmed by unique 395/413/428 widths). blog-1 = 8e4b97d3...png (2000x798, MD5-identical to the design's hero pattern image), blog-2 = image.png (926x1054), blog-3 = image (5).png, blog-4 = image (6).png, blog-5 = image (7).png, blog-6 = image (1).png (739x809), blog-7 = image (2).png, blog-8 = image (3).png, blog-9 = image (4).png.
  "blog-1": "assets/blog-1.webp",
  "blog-2": "assets/blog-2.webp",
  "blog-3": "assets/blog-3.webp",
  "blog-4": "assets/blog-4.webp",
  "blog-5": "assets/blog-5.webp",
  "blog-6": "assets/blog-6.webp",
  "blog-7": "assets/blog-7.webp",
  "blog-8": "assets/blog-8.webp",
  "blog-9": "assets/blog-9.webp",

  /* --- contact (21 slots) --- */
  // 21 IMAGE fills in frame 1:2228, in spec order. contact-1..contact-14 = the 14 Google-map raster tiles (vt, 256x256 each) inside Group 47724 / div.h2d-69865e44 — they sit BEHIND the real stitched Salem map (assets/map-salem.png, z-index:1) so they all now point at that same map image (any 1px that peeks around the map edge still reads as map, never as a random photo). contact-15 = place-card link icon "Get directions to this location on Google Maps." (22x22) = assets/contact-nav.svg (blue Google directions arrow). contact-16..contact-20 = the five 11x11 "Img - Rated 4.5 out of 5" star icons = assets/contact-star.svg (gold Google star, repeated — the design repeats the same sprite 5x). contact-21 = "Region - Map" thumbnail (256x256, clipped to the 38x38 inner box of the satellite-imagery button) = assets/contact-region.svg (mini map: parks, roads, river — content centred so the clipped window shows roads + green).
  "contact-1": "assets/map-salem.webp",
  "contact-2": "assets/map-salem.webp",
  "contact-3": "assets/map-salem.webp",
  "contact-4": "assets/map-salem.webp",
  "contact-5": "assets/map-salem.webp",
  "contact-6": "assets/map-salem.webp",
  "contact-7": "assets/map-salem.webp",
  "contact-8": "assets/map-salem.webp",
  "contact-9": "assets/map-salem.webp",
  "contact-10": "assets/map-salem.webp",
  "contact-11": "assets/map-salem.webp",
  "contact-12": "assets/map-salem.webp",
  "contact-13": "assets/map-salem.webp",
  "contact-14": "assets/map-salem.webp",
  "contact-15": "assets/contact-nav.svg",
  "contact-16": "assets/contact-star.svg",
  "contact-17": "assets/contact-star.svg",
  "contact-18": "assets/contact-star.svg",
  "contact-19": "assets/contact-star.svg",
  "contact-20": "assets/contact-star.svg",
  "contact-21": "assets/contact-region.svg",

  /* --- 404 (1 slot) --- */
  // pg404-1 = ghost image (Rectangle 9 @604.05,253 229.5x271.39, radius 364 pill) between the big 4 and 5 digits — user's animated ghost GIF from the 'login,signup,404 image' folder (1885b6dd...gif, 640x640)
  "pg404-1": "assets/pg404-ghost.gif",

  /* --- shop (19 slots) --- */
  // Keys are numbered in spec line order (top-to-bottom of specs/shop.txt). shop-1 = hero Banner masked photo (Mask group @246.41,333 264.19x388.48, r200 clip). Product grid photos, each inside its clipped 264x264 white frame (slot offset = image rect minus frame origin): shop-2 = row1 col1 frame @369,963; shop-3 = row1 col2 frame @727,965; shop-4 = row1 col3 frame @1107,963; shop-5 = row2 col1 frame @369,1367; shop-6 = row2 col2 frame @727,1367; shop-7 = row2 col3 frame @1107,1367; shop-8 = row3 col1 frame @371,1800; shop-9 = row3 col2 frame @727,1800; shop-10 = row3 col3 frame @1107,1800; shop-11 = row4 col1 frame @369,2284; shop-12 = row4 col2 frame @727,2284; shop-13 = row4 col3 frame @1107,2284; shop-14 = row5 col1 frame @369,2737; shop-15 = row5 col2 frame @727,2739; shop-16 = row5 col3 frame @1107,2737; shop-17 = From-The-Blog masked image (assets/Group 405 @53,3264 654x367, r40 clip); shop-18 = nike-just-do-it.jpg banner @12,3679 1416x698; shop-19 = Exclusive-offer card photo @99,4545 482x596.
  // Files from the user's shop.images folder, matched to each design fill by SVG rect coordinates + pixel-content comparison: Frame 7.png = image1 (shop-2), Frame 7 (1) = image2 (shop-3), Frame 7 (2) = image3 (shop-4), Frame 7 (3) = image4 (shop-5), Frame 7 (4) = image5 (shop-6), Frame 7 (5) = image6 (shop-7), Frame 7 (6) = image7 (shop-8), Images.png = image9 (shop-17), nike-just-do-it = image10 (shop-18), girl-with-glasses = image11 (shop-19). shop-1 (image0 hero) and shop-9 (image8) are not in the folder -> same shop page.svg export used instead.
  // shop-10..16 originally REPEATED shop-p1..p6 (the design reuses the component's default photo) — replaced with 7 UNIQUE Pexels photos, chosen to match each card's product name: shop-u1 = magenta blouse (Blouse ₹2,599), shop-u2 = tan suit (Ankara suit ₹3,499), shop-u3 = evening gown (Brown ball gown ₹2,299), shop-u4 = man adjusting tie (Male Suit ₹4,999), shop-u5 = pink top + white skirt (Blouse ₹2,099), shop-u6 = purple shawl gown (Pink ankara mixed ₹2,799), shop-u7 = blue dress in field (A-shaped gown ₹1,699).
  "shop-1": "assets/shop-hero.webp",
  "shop-2": "assets/shop-p1.webp",
  "shop-3": "assets/shop-p2.webp",
  "shop-4": "assets/shop-p3.webp",
  "shop-5": "assets/shop-p4.webp",
  "shop-6": "assets/shop-p5.webp",
  "shop-7": "assets/shop-p6.webp",
  "shop-8": "assets/shop-p7.webp",
  "shop-9": "assets/shop-p8.webp",
  "shop-10": "assets/shop-u1.webp",
  "shop-11": "assets/shop-u2.webp",
  "shop-12": "assets/shop-u3.webp",
  "shop-13": "assets/shop-u4.webp",
  "shop-14": "assets/shop-u5.webp",
  "shop-15": "assets/shop-u6.webp",
  "shop-16": "assets/shop-u7.webp",
  "shop-17": "assets/shop-blog.webp",
  "shop-18": "assets/shop-nike.webp",
  "shop-19": "assets/shop-offer.webp",
};
