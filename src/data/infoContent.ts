// ============================================================
// Jovro — Info page content (D14–D19) + operator contact (D15)
// Sample wording for a demo build; contact values are clearly
// sample values until the operator's real number is published.
// ============================================================

export const OPERATOR = {
  phoneDisplayBn: '০১৭০০-০০০০০০ (নমুনা)',
  phoneDisplayEn: '01700-000000 (sample)',
  phoneTel: 'tel:+8801700000000',
  whatsappUrl: 'https://wa.me/8801700000000',
  email: 'support@jovro.com',
  hoursBn: 'প্রতিদিন সকাল ৬:০০–দুপুর ১:৩০ ও বিকেল ৪:৩০–রাত ১০:৩০ (দুই শিফটে)',
  hoursEn: 'Every day 6:00 AM–1:30 PM and 4:30–10:30 PM (two shifts)',
  addressBn: 'গোশালা বাজার, লালমনিরহাট সদর, লালমনিরহাট',
  addressEn: 'Goshala Bazar, Lalmonirhat Sadar, Lalmonirhat',
  facebookUrl: 'https://www.facebook.com/jovro',
};

export interface InfoSectionData {
  headingBn: string;
  headingEn: string;
  bodyBn: string[];
  bodyEn: string[];
  bulletsBn?: string[];
  bulletsEn?: string[];
}

export const ABOUT_SECTIONS: InfoSectionData[] = [
  {
    headingBn: 'জোভ্রো কী?',
    headingEn: 'What is Jovro?',
    bodyBn: [
      'জোভ্রো লালমনিরহাট সদরের নিজের এলাকার পার্সোনাল শপার সার্ভিস। বাজারে যাওয়ার সময় বা সুযোগ না থাকলে, আপনি লিস্ট দিলে আমরা আপনার হয়ে বাজার থেকে কিনে ঘরে পৌঁছে দিই — মুদি বাজার, সবজি-মাছ, আর পছন্দের রেস্টুরেন্টের খাবারও।',
    ],
    bodyEn: [
      'Jovro is a personal-shopper service for Lalmonirhat Sadar. If you cannot go to the bazaar yourself, send us your list — we buy it for you from the bazaar and deliver it home: groceries, vegetables and fish, and food from local restaurants too.',
    ],
  },
  {
    headingBn: 'আমাদের প্রতিশ্রুতি: কোনো মার্কআপ নেই',
    headingEn: 'Our promise: no markup',
    bodyBn: [
      'আপনি পণ্যের আসল বাজারদরই দেবেন — আমরা দামের ওপর এক টাকাও বাড়তি নিই না। আমাদের একমাত্র আয় ডেলিভারি চার্জ, যেটা অর্ডারের আগেই পরিষ্কার দেখিয়ে দিই।',
    ],
    bodyEn: [
      'You pay the real bazaar price for products — we never add a single taka on top. Our only income is the delivery charge, shown clearly before you order.',
    ],
    bulletsBn: ['পণ্যের দাম = বাজারের আসল দাম', 'আয় শুধু ডেলিভারি চার্জ থেকে', 'লুকানো কোনো ফি নেই'],
    bulletsEn: ['Product price = real bazaar price', 'Income only from the delivery charge', 'No hidden fees'],
  },
  {
    headingBn: 'যেভাবে কাজ করে',
    headingEn: 'How it works',
    bodyBn: [
      'অ্যাপে লিস্ট বানান বা সহায়ককে লিখে দিন → আমরা বাজার থেকে কিনি → রাইডার আপনার ঠিকানায় পৌঁছে দেয়। সদর উপজেলার ১১৪টি এলাকায় সার্ভিস দিই।',
    ],
    bodyEn: [
      'Make a list in the app or write to the Assistant → we buy from the bazaar → a rider delivers to your address. We serve 114 areas across Sadar upazila.',
    ],
  },
];

export const PRIVACY_SECTIONS: InfoSectionData[] = [
  {
    headingBn: 'কী তথ্য নিই (নমুনা লেখা)',
    headingEn: 'What we collect (sample wording)',
    bodyBn: [
      'অর্ডার পৌঁছে দিতে যা লাগে শুধু তাই নিই: নাম, মোবাইল নম্বর, ডেলিভারির ঠিকানা আর অর্ডারের বিবরণ। (এটি একটি ডেমোর নমুনা লেখা — আসল নীতি প্রকাশের আগে যাচাই করা হবে।)',
    ],
    bodyEn: [
      'We collect only what a delivery needs: your name, mobile number, delivery address and order details. (This is sample wording for a demo — the real policy will be verified before launch.)',
    ],
  },
  {
    headingBn: 'তথ্য কী কাজে লাগে',
    headingEn: 'How we use it',
    bodyBn: ['আপনার তথ্য শুধু অর্ডার কেনা, পৌঁছে দেওয়া আর প্রয়োজনে ফোনে যোগাযোগের কাজে ব্যবহার হয়। আমরা আপনার তথ্য বিক্রি করি না।'],
    bodyEn: ['Your information is used only to buy and deliver your order and to contact you when needed. We never sell your data.'],
  },
  {
    headingBn: 'আপনার অধিকার',
    headingEn: 'Your rights',
    bodyBn: ['যেকোনো সময় যোগাযোগ করে আপনার তথ্য সংশোধন বা মুছে ফেলতে বলতে পারেন। ভুল হলে আমরাই ঠিক করে দেবো।'],
    bodyEn: ['You can ask us anytime to correct or delete your information. If something is wrong, we will fix it.'],
  },
];

export const TERMS_SECTIONS: InfoSectionData[] = [
  {
    headingBn: 'সার্ভিসের ধরন (নমুনা লেখা)',
    headingEn: 'The service (sample wording)',
    bodyBn: [
      'জোভ্রো একটি পার্সোনাল শপার সার্ভিস: আমরা আপনার হয়ে বাজার থেকে কিনে পৌঁছে দিই। পণ্যের দাম বাজারদর অনুযায়ী হয়, আমাদের আয় শুধু ডেলিভারি চার্জ। (ডেমোর নমুনা লেখা।)',
    ],
    bodyEn: [
      'Jovro is a personal-shopper service: we buy from the bazaar on your behalf and deliver. Product prices follow the bazaar rate; our income is only the delivery charge. (Sample wording for a demo.)',
    ],
  },
  {
    headingBn: 'অর্ডার ও পেমেন্ট',
    headingEn: 'Orders & payment',
    bodyBn: ['অর্ডার নিশ্চিত হলে আমরা কেনা শুরু করি। দাম আনুমানিক হলে কেনার সময়ের আসল দামের সঙ্গে সামান্য পার্থক্য হতে পারে — বড় পার্থক্য হলে ফোনে জানিয়ে দিই।'],
    bodyEn: ['Once an order is confirmed, we start buying. Approx prices may differ slightly from the real buying price — if the difference is large, we call you first.'],
  },
  {
    headingBn: 'বাতিল ও দায়িত্ব',
    headingEn: 'Cancellation & responsibility',
    bodyBn: ['কেনা শুরু হওয়ার আগে অর্ডার বাতিল করা যায়। ভুল, কম বা নষ্ট পণ্যের ক্ষেত্রে রিপ্লেসমেন্ট ও রিফান্ড নীতি প্রযোজ্য হয়।'],
    bodyEn: ['Orders can be cancelled before buying starts. Wrong, missing or damaged items are covered by the Replacement & Refund Policy.'],
  },
];

export const REFUND_SECTIONS: InfoSectionData[] = [
  {
    headingBn: 'ভুল জিনিস এলে',
    headingEn: 'If a wrong item arrives',
    bodyBn: [
      'ডেলিভারি পাওয়ার সঙ্গে সঙ্গে দেখে নিন। ভুল জিনিস হলে অ্যাপে "সমস্যা জানান" থেকে রিপোর্ট করুন বা ফোন করুন — আমরা সঠিক জিনিসটা পৌঁছে দেবো, অথবা জিনিসটার দাম ফেরত দেবো।',
    ],
    bodyEn: [
      'Please check your items as soon as they arrive. If an item is wrong, report it from "Report a Problem" in the app or call us — we will deliver the correct item or refund its price.',
    ],
  },
  {
    headingBn: 'কম জিনিস এলে',
    headingEn: 'If an item is missing',
    bodyBn: ['কোনো জিনিস কম এলে যাচাই করে হয় সেটা আলাদা করে পৌঁছে দেবো, নয়তো ওই জিনিসের পুরো দাম ফেরত দেবো — যেটা আপনার সুবিধা।'],
    bodyEn: ['If an item is missing, after checking we will either deliver it separately or refund its full price — whichever suits you.'],
  },
  {
    headingBn: 'নষ্ট জিনিস এলে',
    headingEn: 'If an item is damaged',
    bodyBn: ['নষ্ট বা পচা জিনিসের ছবিসহ রিপোর্ট করুন। যাচাই শেষে রিপ্লেসমেন্ট বা রিফান্ড দেওয়া হবে। মাছ-সবজির মতো পচনশীল জিনিসের ক্ষেত্রে ডেলিভারির দিনই জানাতে হবে।'],
    bodyEn: ['Report damaged or spoiled items with a photo. After checking, we replace or refund. Perishables like fish and vegetables must be reported on the delivery day itself.'],
  },
  {
    headingBn: 'রিফান্ডের সময়',
    headingEn: 'Refund timing',
    bodyBn: ['অনুমোদিত রিফান্ড সাধারণত ৩–৫ কর্মদিবসে আপনার দেওয়া মাধ্যমেই ফেরত যায়। দেরি হলে ফোনে জানালে আমরা খোঁজ নিয়ে জানাবো।'],
    bodyEn: ['Approved refunds usually return within 3–5 working days through the same method you paid with. If it is delayed, call us and we will follow up.'],
  },
];

export const FAQ_ITEMS: { qBn: string; qEn: string; aBn: string; aEn: string }[] = [
  {
    qBn: 'জোভ্রো কীভাবে কাজ করে?',
    qEn: 'How does Jovro work?',
    aBn: 'আপনি অ্যাপে বাজারের লিস্ট বানিয়ে অর্ডার করবেন। আমরা আপনার হয়ে বাজার থেকে কিনে রাইডার দিয়ে ঘরে পৌঁছে দেবো। পণ্যের দাম বাজারদরই — আমাদের আয় শুধু ডেলিভারি চার্জ।',
    aEn: 'You make a bazaar list in the app and order. We buy it for you from the bazaar and a rider delivers it home. Product prices are the real bazaar prices — our income is only the delivery charge.',
  },
  {
    qBn: 'ডেলিভারি চার্জ কত?',
    qEn: 'How much is the delivery charge?',
    aBn: 'এলাকা অনুযায়ী চার্জ আলাদা। শহর এলাকায় সাধারণত ৳২০–৪৫, ইউনিয়ন এলাকায় ৳৫০–৭৫। পুরো তালিকা প্রোফাইলের "ডেলিভারি ফি তালিকা" পেজে আছে, আর অর্ডারের আগেই কার্টে মোট চার্জ দেখিয়ে দিই।',
    aEn: 'It depends on your area — usually ৳20–45 in town and ৳50–75 in union areas. The full list is on the Delivery Fee Table page in Profile, and the exact charge is shown in your cart before ordering.',
  },
  {
    qBn: 'কোন কোন এলাকায় ডেলিভারি হয়?',
    qEn: 'Which areas do you deliver to?',
    aBn: 'লালমনিরহাট সদর উপজেলার ১১৪টি এলাকায় ডেলিভারি হয়। অর্ডারের সময় আপনার এলাকা বেছে নিলেই হবে।',
    aEn: 'We deliver to 114 areas of Lalmonirhat Sadar upazila. Just pick your area when ordering.',
  },
  {
    qBn: 'দাম কি বাজারের চেয়ে বেশি?',
    qEn: 'Are prices higher than the bazaar?',
    aBn: 'না। কোনো মার্কআপ নেই — পণ্যে আপনি আসল বাজারদরই দেবেন। অ্যাপের দামগুলো আনুমানিক, কেনার সময়ের দামের সঙ্গে সামান্য কম-বেশি হতে পারে।',
    aEn: 'No. There is no markup — you pay the real bazaar price. App prices are approximate and may vary slightly at buying time.',
  },
  {
    qBn: 'ভুল বা নষ্ট জিনিস এলে কী হবে?',
    qEn: 'What if an item is wrong or damaged?',
    aBn: 'প্রোফাইল থেকে "সমস্যা জানান" পেজে রিপোর্ট করুন। যাচাই করে আমরা রিপ্লেসমেন্ট পৌঁছে দেবো বা টাকা ফেরত দেবো। বিস্তারিত "রিপ্লেসমেন্ট ও রিফান্ড নীতি" পেজে আছে।',
    aEn: 'Report it from the "Report a Problem" page in Profile. After checking, we will deliver a replacement or refund you. See the Replacement & Refund Policy page for details.',
  },
  {
    qBn: 'সহায়ক (AI) কী করে?',
    qEn: 'What does the Assistant (AI) do?',
    aBn: 'সহায়ককে বাংলায় লিস্ট লিখে দিলে কার্টে যোগ করে দেয়, তালিকার পণ্যের আনুমানিক দাম বলে, আর বাজেট অনুযায়ী বান্ডল সাজায়। সে শুধু আমাদের তালিকার তথ্যই বলে — বানিয়ে কিছু বলে না।',
    aEn: 'Write your list in Bangla and the Assistant adds it to your cart, quotes approx prices from the catalogue, and builds budget bundles. It only uses our listed data — it never makes things up.',
  },
  {
    qBn: 'যোগাযোগ করবো কীভাবে?',
    qEn: 'How can I contact you?',
    aBn: 'প্রোফাইলের "যোগাযোগ" পেজে ফোন, WhatsApp আর ইমেইল আছে। সার্ভিস সময়: প্রতিদিন সকাল ৬:০০–দুপুর ১:৩০ ও বিকেল ৪:৩০–রাত ১০:৩০।',
    aEn: 'Phone, WhatsApp and email are on the Contact page in Profile. Service hours: every day 6:00 AM–1:30 PM and 4:30–10:30 PM.',
  },
];
