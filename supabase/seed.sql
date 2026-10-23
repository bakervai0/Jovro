-- ============================================================
-- Jovro — seed data (run AFTER schema.sql, in the SQL Editor)
-- Contains: 114 delivery areas + starter admin_settings row.
-- Products / restaurants are NOT bulk-seeded on purpose: they
-- change often, so the admin adds them from the app's admin
-- panel (templates at the bottom of this file).
-- ============================================================

-- ── 114 delivery areas (converted from src/data/areas.ts) ────
insert into public.areas (id, name_bn, name_en, fee, zone, group_name, is_served) values
  ('area-01', 'গোশালা বাজার', 'Goshala Bazar', 20, 'town', 'কেন্দ্র', true),
  ('area-02', 'মিশন মোড়', 'Mission Mor', 25, 'town', 'কেন্দ্র', true),
  ('area-03', 'হাড়িভাঙ্গা', 'Haribhanga', 25, 'town', 'কেন্দ্র', true),
  ('area-04', 'ক্যান্টিন মোড়', 'Canteen Mor', 30, 'town', 'কেন্দ্র', true),
  ('area-05', 'খাটাপাড়া', 'Khata Para', 30, 'town', 'কেন্দ্র', true),
  ('area-06', 'পুলিশ লাইন', 'Police Line', 25, 'town', 'কেন্দ্র', true),
  ('area-07', 'স্টেশন রোড', 'Station Road', 25, 'town', 'কেন্দ্র', true),
  ('area-08', 'রেলওয়ে কলোনি', 'Railway Colony', 30, 'town', 'কেন্দ্র', true),
  ('area-09', 'মসজিদ পাড়া', 'Mosjid Para', 25, 'town', 'কেন্দ্র', true),
  ('area-10', 'বড় মসজিদ মোড়', 'Boro Mosjid Mor', 25, 'town', 'কেন্দ্র', true),
  ('area-11', 'লালমনিরহাট পৌরসভা', 'Lalmonirhat Municipality', 25, 'town', 'পৌর এলাকা', true),
  ('area-12', 'বাস টার্মিনাল', 'Bus Terminal', 30, 'town', 'পৌর এলাকা', true),
  ('area-13', 'পুরাতন বাজার', 'Purana Bazar', 20, 'town', 'পৌর এলাকা', true),
  ('area-14', 'নতুন বাজার', 'Naya Bazar', 25, 'town', 'পৌর এলাকা', true),
  ('area-15', 'শহীদ মিনার এলাকা', 'Shahid Minar Area', 25, 'town', 'পৌর এলাকা', true),
  ('area-16', 'কলেজ রোড', 'College Road', 30, 'town', 'পৌর এলাকা', true),
  ('area-17', 'স্কুল রোড', 'School Road', 30, 'town', 'পৌর এলাকা', true),
  ('area-18', 'হাসপাতাল রোড', 'Hospital Road', 30, 'town', 'পৌর এলাকা', true),
  ('area-19', 'ডিসি অফিস এলাকা', 'DC Office Area', 25, 'town', 'পৌর এলাকা', true),
  ('area-20', 'এসপি অফিস মোড়', 'SP Office Mor', 25, 'town', 'পৌর এলাকা', true),
  ('area-21', 'আদালত পাড়া', 'Adalat Para', 25, 'town', 'পৌর এলাকা', true),
  ('area-22', 'পার্ক রোড', 'Park Road', 30, 'town', 'পৌর এলাকা', true),
  ('area-23', 'মহিলা কলেজ এলাকা', 'Mohila College Area', 30, 'town', 'পৌর এলাকা', true),
  ('area-24', 'ফায়ার স্টেশন মোড়', 'Fire Station Mor', 30, 'town', 'পৌর এলাকা', true),
  ('area-25', 'গোশালা রোড', 'Goshala Road', 25, 'town', 'গোশালা', true),
  ('area-26', 'গোশালা পাড়া', 'Goshala Para', 25, 'town', 'গোশালা', true),
  ('area-27', 'গোশালা উত্তর পাড়া', 'Goshala Uttor Para', 30, 'town', 'গোশালা', true),
  ('area-28', 'তালুক শাসন পাড়া', 'Taluk Shason Para', 30, 'town', 'গোশালা', true),
  ('area-29', 'ডাক্তার পাড়া', 'Doctor Para', 30, 'town', 'গোশালা', true),
  ('area-30', 'মির্জাপুর', 'Mirzapur', 35, 'town', 'উপকণ্ঠ', true),
  ('area-31', 'পূর্ব মির্জাপুর', 'Purba Mirzapur', 35, 'town', 'উপকণ্ঠ', true),
  ('area-32', 'মোগলহাট', 'Mughalhaat', 35, 'town', 'উপকণ্ঠ', true),
  ('area-33', 'মোগলহাট বাজার', 'Mughalhaat Bazar', 35, 'town', 'উপকণ্ঠ', true),
  ('area-34', 'কুলাঘাট', 'Kulaghat', 40, 'town', 'উপকণ্ঠ', true),
  ('area-35', 'কুলাঘাট বাজার', 'Kulaghat Bazar', 40, 'town', 'উপকণ্ঠ', true),
  ('area-36', 'কুলাঘাট ঘাট ও বাজার', 'Kulaghat Ghat', 45, 'town', 'উপকণ্ঠ', true),
  ('area-37', 'বড়বাড়ী হাট', 'Boro Bari Haat', 40, 'town', 'উপকণ্ঠ', true),
  ('area-38', 'পাটিকাপাড়া', 'Patikapara', 35, 'town', 'উপকণ্ঠ', true),
  ('area-39', 'বিমান বন্দর রোড', 'Airport Road', 35, 'town', 'উপকণ্ঠ', true),
  ('area-40', 'চকবাজার', 'Chokbazar', 30, 'town', 'পৌর এলাকা', true),
  ('area-41', 'মাছ বাজার', 'Mach Bazar', 20, 'town', 'কেন্দ্র', true),
  ('area-42', 'কাঁচা বাজার এলাকা', 'Kacha Bazar Area', 20, 'town', 'কেন্দ্র', true),
  ('area-43', 'সদর হাসপাতাল', 'Sadar Hospital', 30, 'town', 'পৌর এলাকা', true),
  ('area-44', 'সরকারি কলেজ গেট', 'Govt College Gate', 30, 'town', 'পৌর এলাকা', true),
  ('area-45', 'নর্থ বেঙ্গল শুগার মিল', 'North Bengal Sugar Mill', 35, 'town', 'শিল্প এলাকা', true),
  ('area-46', 'চিনি কল রোড', 'Chini Kol Road', 35, 'town', 'শিল্প এলাকা', true),
  ('area-47', 'ভাটিপাড়া', 'Bhati Para', 30, 'town', 'পৌর এলাকা', true),
  ('area-48', 'উত্তর ভাটিপাড়া', 'Uttor Bhati Para', 30, 'town', 'পৌর এলাকা', true),
  ('area-49', 'দক্ষিণ পাড়া', 'Dakshin Para', 30, 'town', 'পৌর এলাকা', true),
  ('area-50', 'পাথরঘাটা', 'Pathorghata', 30, 'town', 'পৌর এলাকা', true),
  ('area-51', 'ঘুঘুমারী', 'Ghughumari', 35, 'town', 'উপকণ্ঠ', true),
  ('area-52', 'তুষভাণ্ডার', 'Tushbhandar', 35, 'town', 'উপকণ্ঠ', true),
  ('area-53', 'তুষভাণ্ডার বাজার', 'Tushbhandar Bazar', 35, 'town', 'উপকণ্ঠ', true),
  ('area-54', 'মহেন্দ্রনগর', 'Mahendranagar', 40, 'town', 'উপকণ্ঠ', true),
  ('area-55', 'মহেন্দ্রনগর বাজার', 'Mahendranagar Bazar', 40, 'town', 'উপকণ্ঠ', true),
  ('area-56', 'কমলাবাড়ী', 'Kamalabari', 35, 'town', 'উপকণ্ঠ', true),
  ('area-57', 'বামনডাঙ্গা', 'Bamondanga', 40, 'town', 'উপকণ্ঠ', true),
  ('area-58', 'বামনডাঙ্গা বাজার', 'Bamondanga Bazar', 40, 'town', 'উপকণ্ঠ', true),
  ('area-59', 'বাগডোগরা', 'Bagdogra', 35, 'town', 'উপকণ্ঠ', true),
  ('area-60', 'রশিদ নগর', 'Rashid Nagar', 35, 'town', 'পৌর এলাকা', true),
  ('area-61', 'রশিদ নগর বাজার', 'Rashid Nagar Bazar', 35, 'town', 'পৌর এলাকা', true),
  ('area-62', 'ফৌজদারহাট', 'Faujdarhaat', 35, 'town', 'পৌর এলাকা', true),
  ('area-63', 'কাজীপাড়া', 'Kazi Para', 30, 'town', 'পৌর এলাকা', true),
  ('area-64', 'নোয়াপাড়া', 'Noa Para', 30, 'town', 'পৌর এলাকা', true),
  ('area-65', 'তেঁতুলিয়া মোড়', 'Tentulia Mor', 35, 'town', 'পৌর এলাকা', true),
  ('area-66', 'কাচারি বাজার', 'Kachari Bazar', 30, 'town', 'পৌর এলাকা', true),
  ('area-67', 'পাটোয়ারী পাড়া', 'Patwari Para', 30, 'town', 'পৌর এলাকা', true),
  ('area-68', 'আইনজীবী পাড়া', 'Ainjibi Para', 30, 'town', 'পৌর এলাকা', true),
  ('area-69', 'মুক্তিযোদ্ধা কমপ্লেক্স', 'Muktijoddha Complex', 25, 'town', 'পৌর এলাকা', true),
  ('area-70', 'সোনাইমুড়ি', 'Sonaimuri', 40, 'town', 'উপকণ্ঠ', true),
  ('area-71', 'সোনাইমুড়ি বাজার', 'Sonaimuri Bazar', 40, 'town', 'উপকণ্ঠ', true),
  ('area-72', 'ভোটমারী', 'Bhotmari', 35, 'town', 'উপকণ্ঠ', true),
  ('area-73', 'ভোটমারী বাজার', 'Bhotmari Bazar', 35, 'town', 'উপকণ্ঠ', true),
  ('area-74', 'জগতবেড়', 'Jogotveda', 40, 'town', 'উপকণ্ঠ', true),
  ('area-75', 'খোকসা বাজার', 'Khoksha Bazar', 40, 'town', 'উপকণ্ঠ', true),
  ('area-76', 'চলতিবিল', 'Choltibil', 40, 'town', 'উপকণ্ঠ', true),
  ('area-77', 'নাপিতেরহাট', 'Napitera Haat', 40, 'town', 'উপকণ্ঠ', true),
  ('area-78', 'মাহারপুর', 'Maharpur', 40, 'town', 'উপকণ্ঠ', true),
  ('area-79', 'মাহারপুর বাজার', 'Maharpur Bazar', 40, 'town', 'উপকণ্ঠ', true),
  ('area-80', 'কানিয়াল', 'Kanyal', 40, 'town', 'উপকণ্ঠ', true),
  ('area-81', 'গোকুণ্ডা', 'Gokunda', 40, 'town', 'উপকণ্ঠ', true),
  ('area-82', 'হাঁড়িয়াপাড়া', 'Hariya Para', 45, 'town', 'উপকণ্ঠ', true),
  ('area-83', 'পঞ্চগ্রাম', 'Panchagram', 45, 'town', 'উপকণ্ঠ', true),
  ('area-84', 'ডোকরা হাট', 'Dokra Haat', 45, 'town', 'উপকণ্ঠ', true),
  ('area-85', 'তিস্তা বাজার', 'Tista Bazar', 50, 'union', 'তিস্তা ইউনিয়ন', true),
  ('area-86', 'বুড়িরহাট', 'Burirhat', 50, 'union', 'তিস্তা ইউনিয়ন', true),
  ('area-87', 'চাঁদ বাজার', 'Chand Bazar', 55, 'union', 'সদর ইউনিয়ন', true),
  ('area-88', 'মোগলহাট ইউনিয়ন', 'Mughalhaat Union', 55, 'union', 'মোগলহাট ইউনিয়ন', true),
  ('area-89', 'মোগলহাট হাট', 'Mughalhaat Haat', 55, 'union', 'মোগলহাট ইউনিয়ন', true),
  ('area-90', 'কুলাঘাট ইউনিয়ন', 'Kulaghat Union', 60, 'union', 'কুলাঘাট ইউনিয়ন', true),
  ('area-91', 'গোকুণ্ডা বাজার', 'Gokunda Bazar', 55, 'union', 'গোকুণ্ডা ইউনিয়ন', true),
  ('area-92', 'গোকুণ্ডা হাট', 'Gokunda Haat', 60, 'union', 'গোকুণ্ডা ইউনিয়ন', true),
  ('area-93', 'বড়বাড়ী ইউনিয়ন', 'Boro Bari Union', 60, 'union', 'বড়বাড়ী ইউনিয়ন', true),
  ('area-94', 'বড়বাড়ী হাট', 'Boro Bari Haat', 60, 'union', 'বড়বাড়ী ইউনিয়ন', true),
  ('area-95', 'চলতিবিল বাজার', 'Choltibil Bazar', 60, 'union', 'বড়বাড়ী ইউনিয়ন', true),
  ('area-96', 'হারোয়া হাট', 'Haroa Haat', 60, 'union', 'হারোয়া ইউনিয়ন', true),
  ('area-97', 'হারোয়া বাজার', 'Haroa Bazar', 65, 'union', 'হারোয়া ইউনিয়ন', true),
  ('area-98', 'ভোটমারী ইউনিয়ন', 'Bhotmari Union', 60, 'union', 'ভোটমারী ইউনিয়ন', true),
  ('area-99', 'ভোটমারী হাট', 'Bhotmari Haat', 60, 'union', 'ভোটমারী ইউনিয়ন', true),
  ('area-100', 'পঞ্চগ্রাম বাজার', 'Panchagram Bazar', 65, 'union', 'পঞ্চগ্রাম ইউনিয়ন', true),
  ('area-101', 'পঞ্চগ্রাম হাট', 'Panchagram Haat', 65, 'union', 'পঞ্চগ্রাম ইউনিয়ন', true),
  ('area-102', 'তুষভাণ্ডার ইউনিয়ন', 'Tushbhandar Union', 60, 'union', 'তুষভাণ্ডার ইউনিয়ন', true),
  ('area-103', 'তুষভাণ্ডার হাট', 'Tushbhandar Haat', 60, 'union', 'তুষভাণ্ডার ইউনিয়ন', true),
  ('area-104', 'খুনিয়াগাছ বাজার', 'Khuniyagach Bazar', 65, 'union', 'খুনিয়াগাছ ইউনিয়ন', true),
  ('area-105', 'খুনিয়াগাছ হাট', 'Khuniyagach Haat', 65, 'union', 'খুনিয়াগাছ ইউনিয়ন', true),
  ('area-106', 'বামনডাঙ্গা ইউনিয়ন', 'Bamondanga Union', 65, 'union', 'বামনডাঙ্গা ইউনিয়ন', true),
  ('area-107', 'বামনডাঙ্গা হাট', 'Bamondanga Haat', 65, 'union', 'বামনডাঙ্গা ইউনিয়ন', true),
  ('area-108', 'দুরাকুটি বাজার', 'Durakuti Bazar', 70, 'union', 'দুরাকুটি ইউনিয়ন', true),
  ('area-109', 'দুরাকুটি হাট', 'Durakuti Haat', 70, 'union', 'দুরাকুটি ইউনিয়ন', true),
  ('area-110', 'মহেন্দ্রনগর ইউনিয়ন', 'Mahendranagar Union', 70, 'union', 'মহেন্দ্রনগর ইউনিয়ন', true),
  ('area-111', 'মহেন্দ্রনগর হাট', 'Mahendranagar Haat', 70, 'union', 'মহেন্দ্রনগর ইউনিয়ন', true),
  ('area-112', 'রাজপুর হাট', 'Rajpur Haat', 75, 'union', 'রাজপুর ইউনিয়ন', true),
  ('area-113', 'রাজপুর বাজার', 'Rajpur Bazar', 75, 'union', 'রাজপুর ইউনিয়ন', true),
  ('area-114', 'কাকিনা বাজার', 'Kakina Bazar', 75, 'union', 'কাকিনা ইউনিয়ন', true)
on conflict (id) do nothing;

-- ── Starter admin_settings (mirrors DEFAULT_ADMIN_SETTINGS) ──
insert into public.admin_settings (id, settings) values (
  1,
  '{
    "serviceHours": "সকাল ৬:০০–দুপুর ১:৩০ ও বিকেল ৪:৩০–রাত ১০:৩০",
    "deliverySlots": ["সকাল ৬:০০–দুপুর ১:৩০", "বিকেল ৪:৩০–রাত ১০:৩০"],
    "passPrice": 1000,
    "passDeliveries": 30,
    "passActive": true,
    "banners": [
      {"id": "banner-1", "image": "🥬", "headlineBn": "আজকের তাজা বাজার", "headlineEn": "Fresh bazaar today", "subBn": "গোশালা বাজার থেকে সরাসরি", "subEn": "Straight from Goshala Bazar", "isActive": true},
      {"id": "banner-2", "image": "🍛", "headlineBn": "বিরিয়ানি অফার", "headlineEn": "Biryani offer", "subBn": "নির্বাচিত রেস্টুরেন্টে", "subEn": "At selected restaurants", "isActive": true},
      {"id": "banner-3", "image": "🚲", "headlineBn": "দ্রুত ডেলিভারি", "headlineEn": "Fast delivery", "subBn": "সদরের সব এলাকায়", "subEn": "Across Sadar areas", "isActive": false}
    ],
    "flashSaleProductIds": [],
    "flashSaleDiscount": 10,
    "flashSaleStart": "",
    "flashSaleEnd": "",
    "flashSaleActive": false,
    "subscriptionInterests": []
  }'::jsonb
)
on conflict (id) do nothing;

-- ============================================================
-- ★ MAKE YOURSELF ADMIN — read this, Baker ★
-- 1. First SIGN UP in the app / Supabase Auth with YOUR email
--    (that creates your profile row automatically as 'customer').
-- 2. Change the email below to YOUR email and run ONLY this
--    statement. Done — that account is now the admin.
-- ============================================================
-- update public.profiles
-- set role = 'admin', is_verified = true
-- where email = 'YOUR-EMAIL-HERE@example.com';

-- ============================================================
-- TEMPLATES (commented out — products/restaurants change often,
-- so add them from the in-app admin panel instead. Kept here
-- only as a shape reference.)
-- ============================================================
-- insert into public.products (id, name_bn, name_en, category, unit, unit_en, approx_price, is_available, image_emoji) values
--   ('p-01', 'মিনিকেট চাল', 'Miniket Rice', 'rice-pulses', 'কেজি', 'kg', 70, true, '🍚');
--
-- insert into public.restaurants (id, name_bn, name_en, cuisine_type_bn, cuisine_type_en, address, is_open, min_order, delivery_time_min, area_id) values
--   ('r-01', 'উদাহরণ রেস্টুরেন্ট', 'Example Restaurant', 'বাংলা', 'Bangla', 'গোশালা বাজার', true, 100, 30, 'area-01');
--
-- insert into public.menu_items (id, restaurant_id, name_bn, name_en, price, is_available) values
--   ('m-01', 'r-01', 'চিকেন বিরিয়ানি', 'Chicken Biryani', 180, true);
