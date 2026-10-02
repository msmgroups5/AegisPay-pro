(function(){
'use strict';
var rows=[
['Mini USB Fan','Aegis Home','Home & Kitchen','Cooling',2.99,4.4,'Deal','🌀',1],
['Cable Organizer Kit','Aegis Office','Office','Desk',4.99,4.5,'New','🧷',2],
['Pocket Notebook Set','Aegis Paper','Books','Stationery',7.49,4.6,'Popular','📓',3],
['Phone Grip Stand','Aegis Mobile','Electronics','Accessories',9.99,4.5,'Best Seller','📱',4],
['Travel Water Bottle','Aegis Active','Outdoor','Hydration',12.99,4.7,'Popular','🥤',5],
['Classic Sunglasses','Aegis Style','Fashion','Accessories',15.99,4.6,'New','🕶️',6],
['LED Desk Light','Aegis Home','Office','Lighting',18.99,4.6,'Deal','💡',7],
['Wireless Mouse','Aegis Tech','Electronics','Computer Accessories',21.99,4.7,'Top Rated','🖱️',8],
['Kitchen Storage Set','Aegis Home','Home & Kitchen','Storage',24.99,4.6,'Featured','🫙',9],
['Compact Travel Pouch','Aegis Style','Fashion','Travel',29.99,4.5,'Popular','👜',10],
['Fitness Resistance Bands','Aegis Active','Sports','Training',34.99,4.7,'Best Seller','🏋️',11],
['Ceramic Coffee Mug','Aegis Home','Home & Kitchen','Drinkware',39.99,4.6,'New','☕',12],
['Desk Mat Pro','Aegis Office','Office','Desk Accessories',44.99,4.7,'Top Rated','🖥️',13],
['Glow Skin Care Set','Aegis Beauty','Beauty','Skin Care',49.99,4.8,'Best Seller','🧴',14],
['Everyday Backpack','Aegis Style','Fashion','Bags',54.99,4.7,'Featured','🎒',15],
['Smart Tracker Tag','Aegis Tech','Electronics','Smart Devices',59.99,4.4,'New','🏷️',16],
['Portable Blender','Aegis Home','Home & Kitchen','Appliances',69.99,4.6,'Deal','🥤',17],
['Gaming Mouse Pro','Aegis Game','Gaming','PC Gaming',79.99,4.8,'Top Rated','🖱️',18],
['Running Shoes Lite','Aegis Sport','Sports','Footwear',89.99,4.7,'Popular','👟',19],
['Travel Duffel Bag','Aegis Style','Fashion','Travel',99.99,4.6,'Featured','🧳',20],
['Mechanical Keyboard','Aegis Tech','Gaming','PC Gaming',109,4.8,'Best Seller','⌨️',21],
['Fitness Smart Band','Aegis Active','Sports','Wearables',119,4.6,'New','⌚',22],
['Stainless Cookware Set','Aegis Home','Home & Kitchen','Cookware',129,4.8,'Top Rated','🍳',23],
['Noise Cancel Earbuds','Aegis Audio','Electronics','Headphones',139,4.7,'Featured','🎧',24],
['Polarized Eyewear','Aegis Style','Fashion','Accessories',149,4.6,'Deal','🕶️',25],
['Office Backpack Pro','Aegis Office','Office','Bags',159,4.7,'Popular','🎒',26],
['Beauty Vanity Kit','Aegis Beauty','Beauty','Cosmetics',169,4.7,'Best Seller','💄',27],
['Air Fryer Compact','Aegis Home','Home & Kitchen','Appliances',179,4.8,'Hot','🍟',28],
['Smart Home Camera','Aegis Tech','Electronics','Smart Home',199,4.5,'New','📷',29],
['Premium Sports Watch','Aegis Active','Sports','Wearables',219,4.7,'Featured','⌚',30],
['Ultralight Tent','Aegis Outdoor','Outdoor','Camping',239,4.8,'Top Rated','⛺',31],
['Gaming Headset Elite','Aegis Game','Gaming','PC Gaming',249,4.8,'Best Seller','🎮',32],
['Robot Vacuum Mini','Aegis Home','Home & Kitchen','Appliances',269,4.6,'Deal','🧹',33],
['Leather Weekender','Aegis Style','Fashion','Travel',289,4.7,'Featured','👜',34],
['4K Streaming Box','Aegis Tech','Electronics','Entertainment',299,4.5,'Popular','📺',35],
['Ergonomic Office Chair','Aegis Office','Office','Furniture',329,4.7,'Top Rated','🪑',36],
['Pro Makeup Case','Aegis Beauty','Beauty','Accessories',349,4.8,'New','💼',37],
['Performance Running Kit','Aegis Active','Sports','Training',379,4.8,'Featured','🏃',38],
['Mirrorless Camera Body','Aegis Tech','Electronics','Cameras',399,4.7,'Best Seller','📷',39],
['Travel Smart Luggage','Aegis Outdoor','Outdoor','Travel',429,4.7,'New','🧳',40],
['Premium Coffee Machine','Aegis Home','Home & Kitchen','Coffee',449,4.8,'Top Rated','☕',41],
['Ultra Gaming Monitor','Aegis Game','Gaming','PC Gaming',499,4.8,'Hot','🖥️',42],
['Business Laptop Air','Aegis Tech','Electronics','Laptops',549,4.7,'Featured','💻',43],
['Designer Carry-On','Aegis Style','Fashion','Travel',599,4.7,'Popular','🧳',44],
['Smart Fitness Station','Aegis Active','Sports','Training',649,4.9,'Top Rated','🏋️',45],
['Home Theater System','Aegis Tech','Electronics','Entertainment',699,4.6,'Best Seller','📺',46],
['Premium Espresso Bar','Aegis Home','Home & Kitchen','Coffee',749,4.8,'Featured','☕',47],
['Creator Laptop Pro','Aegis Tech','Electronics','Laptops',799,4.8,'Top Rated','💻',48],
['Luxury Outdoor Set','Aegis Outdoor','Outdoor','Furniture',849,4.7,'New','🪵',49],
['Studio Camera Kit','Aegis Tech','Electronics','Cameras',899,4.8,'Featured','📷',50],
['Executive Workspace','Aegis Office','Office','Furniture',929,4.7,'Premium','🪑',51],
['Flagship Smart Device','Aegis Tech','Electronics','Smart Devices',949,4.6,'Premium','📱',52],
['Luxury Travel Trunk','Aegis Style','Fashion','Luggage',959,4.8,'Premium','🧳',53],
['Home Wellness Suite','Aegis Home','Home & Kitchen','Wellness',969,4.7,'Premium','🛁',54],
['Pro Creator Bundle','Aegis Tech','Gaming','Creator Gear',979,4.9,'Premium','🎥',55],
['Elite Fitness Bundle','Aegis Active','Sports','Training',989,4.8,'Premium','🏆',56],
['Aegis Signature Collection','Aegis Style','Fashion','Signature',999,4.9,'Signature','👑',57],
['Wireless Charging Hub','Aegis Tech','Electronics','Charging',31.99,4.5,'New','🔋',58],
['Smart Kitchen Scale','Aegis Home','Home & Kitchen','Kitchen Tools',36.99,4.6,'Popular','⚖️',59],
['Portable Projector','Aegis Tech','Electronics','Projectors',189,4.6,'Featured','📽️',60]
];
var PRODUCT_IMAGES={
  tech:'https://images.unsplash.com/photo-1769689268229-3e9c9ddaf1ee?auto=format&fit=crop&w=900&q=82',
  laptop:'https://images.unsplash.com/photo-1610006330187-5f0c6ec0f9aa?auto=format&fit=crop&w=900&q=82',
  bag:'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=82',
  camera:'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=82',
  shoes:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=82',
  watch:'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=82',
  headphones:'https://images.unsplash.com/photo-1674658556545-f18d4080ab6c?auto=format&fit=crop&w=900&q=82',
  coffee:'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=82',
  chair:'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=82',
  home:'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=900&q=82'
};
function productImage(x){
  var s=(x[0]+' '+x[1]+' '+x[2]+' '+x[3]).toLowerCase();
  if(/camera|creator|streaming|photo/.test(s))return PRODUCT_IMAGES.camera;
  if(/laptop|keyboard|monitor|mouse|computer/.test(s))return PRODUCT_IMAGES.laptop;
  if(/headphone|earbud|audio/.test(s))return PRODUCT_IMAGES.headphones;
  if(/phone|smart device|charger|charging/.test(s))return PRODUCT_IMAGES.tech;
  if(/shoe|running|fitness|sport|training|gym/.test(s))return PRODUCT_IMAGES.shoes;
  if(/watch|wearable/.test(s))return PRODUCT_IMAGES.watch;
  if(/backpack|bag|luggage|travel|pouch|makeup case/.test(s))return PRODUCT_IMAGES.bag;
  if(/chair|furniture|office/.test(s))return PRODUCT_IMAGES.chair;
  if(/coffee|mug|espresso/.test(s))return PRODUCT_IMAGES.coffee;
  if(/home|kitchen|cook|air fryer|blender|vacuum/.test(s))return PRODUCT_IMAGES.home;
  return PRODUCT_IMAGES.tech;
}
window.AegisShopCatalog=rows.map(function(x){return{id:'SP-'+x[8],title:x[0],brand:x[1],category:x[2],subcategory:x[3],marketPrice:x[4],rating:x[5],badge:x[6],emoji:x[7],image:productImage(x)};});
})();
