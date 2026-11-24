// Seed data for ziro — matches the Muse demo: 43 listings, 10 GTA cities.
// Images are emoji tiles in this standalone build (no photo assets bundled).
// Real photos come from sellers via the Sell form / a storage service later.
export const CITIES = ['Toronto','Mississauga','Scarborough','Vaughan','Brampton','Etobicoke','Hamilton','Markham','Oakville','Richmond Hill']
export const CATEGORIES = ['All','Clothing','Electronics','Home','Sports','Toys','Collectibles','Beauty','Motors','Games','Books']

const L = (id, title, price, rent, category, city, dist, condition, seller, time, emoji, desc) => ({
  id, title, price, rentPerDay: rent, category, city, distanceKm: dist,
  condition, seller, time, emoji, desc, seed: true
})

export const LISTINGS = [
  L(1,'Nike Dunk Low — White/Black',85,6,'Clothing','Toronto',2.1,'Like New','@brampton_kid','2h','👟','Clean Dunks, worn twice. Box included.'),
  L(2,'iPhone 12 — 128GB',250,12,'Electronics','Mississauga',4.3,'Used','@techplug','1h','📱','Battery 89%. No scratches on the screen. Charger included.'),
  L(3,'Vintage Hoodie — Oversized',40,3,'Clothing','Brampton',3.8,'Used','@thrift_king','3h','🧥','Warm oversized hoodie, thrifted, washed and ready.'),
  L(4,'Car Phone Mount',12,1,'Motors','Toronto',1.2,'New','@drive_deals','5h','📲','Strong grip mount, fits most phones. Brand new in box.'),
  L(5,'Scented Candle — Vanilla',14,1,'Home','Scarborough',4.9,'New','@home_nest','4h','🕯️','Hand-poured vanilla candle, 40 hour burn time.'),
  L(6,'Mystery Box — Surprise Finds',15,2,'Toys','Vaughan',3.1,'New','@mystery_mia','6h','📦','A box of surprise goodies. Every box is different.'),
  L(7,'Comedy DVD 3-Pack',15,1,'Books','Toronto',0.8,'Used','@movie_mike','7h','📀','Three classic comedy films on DVD. Plays perfectly.'),
  L(8,'Ceramic Mug — Handmade',15,1,'Home','Etobicoke',2.4,'New','@clay_and_co','8h','☕','Handmade ceramic mug, dishwasher safe.'),
  L(9,'Desk Lamp — Adjustable',28,2,'Home','Toronto',1.9,'Like New','@home_nest','2h','💡','Adjustable desk lamp, warm light, works great.'),
  L(10,'Nintendo Switch Lite — Turquoise',180,9,'Games','Mississauga',3.6,'Like New','@game_zone','1h','🎮','Switch Lite in turquoise, with a case and two games.'),
  L(11,'Bike Helmet — Adult M',35,3,'Sports','Hamilton',4.8,'Used','@cycle_city','9h','🪖','Adult medium helmet, light use, no crashes.'),
  L(12,'Dumbbells — 10lb Pair',45,4,'Sports','Brampton',2.7,'Used','@gym_guru','3h','🏋️','Pair of 10lb dumbbells, great for home workouts.'),
  L(13,'Wall Clock — Minimal',22,2,'Home','Markham',4.1,'New','@home_nest','5h','🕐','Minimal wall clock, silent movement, batteries included.'),
  L(14,'Vase — Ceramic White',18,1,'Home','Oakville',3.3,'New','@clay_and_co','6h','🏺','White ceramic vase, perfect for dried flowers.'),
  L(15,'Mirror — Round 60cm',38,3,'Home','Richmond Hill',4.5,'Like New','@home_nest','4h','🪞','Round wall mirror, 60cm, no marks.'),
  L(16,'Cushion Set — 2 Pack',20,2,'Home','Scarborough',2.9,'New','@home_nest','7h','🛋️','Two soft cushions, washable covers.'),
  L(17,'Plant — Monstera in Pot',25,2,'Home','Toronto',1.5,'Like New','@plant_pal','2h','🪴','Healthy monstera in a ceramic pot.'),
  L(18,'Rug — 120x180cm',30,3,'Home','Vaughan',3.9,'Used','@home_nest','8h','🧶','Soft rug, cleaned, from a smoke-free home.'),
  L(19,'Basketball — Spalding',24,2,'Sports','Brampton',2.2,'Used','@sporty_sam','3h','🏀','Good grip, holds air, barely used.'),
  L(20,'Tennis Racket — Wilson',55,4,'Sports','Etobicoke',4.0,'Like New','@sporty_sam','5h','🎾','Wilson racket with cover, freshly strung.'),
  L(21,'LEGO City Set',48,4,'Toys','Mississauga',3.0,'Used','@toy_box','6h','🧱','Complete LEGO City set, all pieces counted.'),
  L(22,'Board Game — Catan',32,3,'Games','Hamilton',4.6,'Like New','@game_zone','9h','🎲','Catan, complete, played twice.'),
  L(23,'Funko Pop — Batman',16,1,'Collectibles','Markham',2.8,'New','@collectors_corner','4h','🦇','Batman Funko Pop, box in great shape.'),
  L(24,'Vinyl Record — Classic Rock',19,1,'Collectibles','Oakville',3.7,'Used','@vinyl_vic','7h','💿','Classic rock vinyl, plays clean.'),
  L(25,'Lipstick Set — 3 Shades',21,2,'Beauty','Richmond Hill',1.8,'New','@glow_up','3h','💄','Three shades, sealed, never opened.'),
  L(26,'Skincare Set — Gentle',29,2,'Beauty','Scarborough',4.2,'New','@glow_up','5h','🧴','Gentle skincare set for sensitive skin.'),
  L(27,'Sneakers — Running Size 9',65,5,'Clothing','Brampton',3.4,'Like New','@brampton_kid','2h','👟','Running shoes, size 9, low miles.'),
  L(28,'Jacket — Denim',42,3,'Clothing','Vaughan',2.6,'Used','@thrift_king','6h','🧥','Classic denim jacket, great condition.'),
  L(29,'Headphones — Wireless',75,6,'Electronics','Toronto',1.1,'Like New','@techplug','1h','🎧','Wireless headphones, great sound, case included.'),
  L(30,'Tablet — 10 inch',140,8,'Electronics','Mississauga',4.4,'Used','@techplug','4h','📱','10 inch tablet, works fast, charger included.'),
  L(31,'Keyboard — Mechanical',58,4,'Electronics','Etobicoke',3.2,'Like New','@techplug','8h','⌨️','Mechanical keyboard, clicky keys, RGB.'),
  L(32,'Coffee Maker — Drip',36,3,'Home','Hamilton',4.9,'Used','@home_nest','9h','☕','Drip coffee maker, cleaned and tested.'),
  L(33,'Cookbook — Easy Meals',17,1,'Books','Markham',2.3,'Used','@book_nook','5h','📖','Easy meals cookbook, no missing pages.'),
  L(34,'Novel — Mystery',11,1,'Books','Oakville',3.5,'Used','@book_nook','7h','📚','Mystery novel, good condition.'),
  L(35,'Soccer Ball — Size 5',19,1,'Sports','Richmond Hill',2.0,'Used','@sporty_sam','3h','⚽','Size 5 soccer ball, holds air.'),
  L(36,'Skateboard — Complete',68,5,'Sports','Scarborough',4.7,'Like New','@sporty_sam','6h','🛹','Complete skateboard, ready to ride.'),
  L(37,'Action Figure — Robot',23,2,'Toys','Brampton',3.1,'New','@toy_box','4h','🤖','Robot action figure, in box.'),
  L(38,'Puzzle — 1000 Pieces',13,1,'Toys','Vaughan',2.9,'Used','@toy_box','8h','🧩','1000 piece puzzle, all pieces there.'),
  L(39,'Watch — Minimal Steel',52,4,'Collectibles','Mississauga',1.6,'Like New','@collectors_corner','2h','⌚','Minimal steel watch, new battery.'),
  L(40,'Car Charger — USB-C',9,1,'Motors','Mississauga',4.0,'New','@drive_deals','5h','🔌','Fast USB-C car charger, brand new.'),
  L(41,'Game Controller — Wireless',44,3,'Games','Hamilton',3.8,'Like New','@game_zone','7h','🎮','Wireless controller, no drift.'),
  L(42,'Yoga Mat — Non-slip',21,2,'Sports','Etobicoke',2.5,'Used','@gym_guru','6h','🧘','Non-slip yoga mat, cleaned.'),
  L(43,'Blender — Personal',33,3,'Home','Scarborough',3.9,'Like New','@home_nest','9h','🥤','Personal blender, perfect for smoothies.'),
]

// 8 rentals: first 8 listings with a daily rate, in home-page order.
export const RENTALS = LISTINGS.filter(l => [10,1,2,11,12,29,30,36].includes(l.id))

export const ADS = [
  { id: 1, business: 'Sneaker Spot', title: 'Fresh Sneakers — 20% Off This Week', desc: 'New drops, classic styles, and deals on the sneakers everyone wants.', link: 'sneakerspot.example', price: 0.99, type: 'image', emoji: '👟', listingId: 1, clicks: 1, status: 'LIVE' },
  { id: 2, business: 'Game Zone', title: 'Rent It — Game Night Starts Here', desc: 'Rent consoles and games for the weekend. Game night, sorted.', link: 'gamezone.example', price: 2.99, type: 'video', emoji: '🎮', listingId: 10, clicks: 1, status: 'LIVE' },
  { id: 3, business: 'Home Nest', title: 'Cozy Home Finds — Lamps & Cushions', desc: 'Lamps, cushions and little things that make a place feel like home.', link: 'homenest.example', price: 0.99, type: 'image', emoji: '💡', listingId: 9, clicks: 1, status: 'LIVE' },
  { id: 4, business: 'Cycle City', title: 'Ride Ready — Bikes & Gear', desc: 'Bikes, helmets and gear, checked and ready to ride.', link: 'cyclecity.example', price: 2.99, type: 'video', emoji: '🪖', listingId: 11, clicks: 1, status: 'LIVE' },
]

export const CHATS = [
  { id: 1, user: '@brampton_kid', item: 'Nike Dunk $85', messages: [{ from: 'them', text: 'Hi! Is the Dunk still available?' }, { from: 'me', text: 'Yes, it is!' }, { from: 'them', text: 'Can I pick it up today?' }] },
  { id: 2, user: '@techplug', item: 'iPhone $250', messages: [{ from: 'them', text: 'The iPhone is ready for pickup.' }, { from: 'me', text: 'Great, what time works?' }] },
  { id: 3, user: '@thrift_king', item: 'Hoodie $40', messages: [{ from: 'them', text: 'Hoodie is washed and ready.' }, { from: 'me', text: 'Perfect, see you at 4?' }] },
]

export const REVIEWS = [
  { user: '@happy_buyer', stars: 5, text: 'Fast reply, item exactly as described.' },
  { user: '@gta_shopper', stars: 5, text: 'Easy pickup, would buy again.' },
  { user: '@thrift_fan', stars: 4, text: 'Good price and friendly seller.' },
]

export const GIFT_TILES = ['Lamps','Clocks','Dumbbells','Candles','Vases','Mirrors','Cushions','Plants','Rugs']
