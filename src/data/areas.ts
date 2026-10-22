import type { DeliveryArea } from '../types';

// 114 delivery areas — extracted from design screens + realistic Lalmonirhat Sadar areas
export const DELIVERY_AREAS: DeliveryArea[] = [
  // ── শহর এলাকা (Town Areas 01–84) ──
  { id: 'area-01', nameBn: 'গোশালা বাজার', nameEn: 'Goshala Bazar', fee: 20, zone: 'town', group: 'কেন্দ্র' },
  { id: 'area-02', nameBn: 'মিশন মোড়', nameEn: 'Mission Mor', fee: 25, zone: 'town', group: 'কেন্দ্র' },
  { id: 'area-03', nameBn: 'হাড়িভাঙ্গা', nameEn: 'Haribhanga', fee: 25, zone: 'town', group: 'কেন্দ্র' },
  { id: 'area-04', nameBn: 'ক্যান্টিন মোড়', nameEn: 'Canteen Mor', fee: 30, zone: 'town', group: 'কেন্দ্র' },
  { id: 'area-05', nameBn: 'খাটাপাড়া', nameEn: 'Khata Para', fee: 30, zone: 'town', group: 'কেন্দ্র' },
  { id: 'area-06', nameBn: 'পুলিশ লাইন', nameEn: 'Police Line', fee: 25, zone: 'town', group: 'কেন্দ্র' },
  { id: 'area-07', nameBn: 'স্টেশন রোড', nameEn: 'Station Road', fee: 25, zone: 'town', group: 'কেন্দ্র' },
  { id: 'area-08', nameBn: 'রেলওয়ে কলোনি', nameEn: 'Railway Colony', fee: 30, zone: 'town', group: 'কেন্দ্র' },
  { id: 'area-09', nameBn: 'মসজিদ পাড়া', nameEn: 'Mosjid Para', fee: 25, zone: 'town', group: 'কেন্দ্র' },
  { id: 'area-10', nameBn: 'বড় মসজিদ মোড়', nameEn: 'Boro Mosjid Mor', fee: 25, zone: 'town', group: 'কেন্দ্র' },
  { id: 'area-11', nameBn: 'লালমনিরহাট পৌরসভা', nameEn: 'Lalmonirhat Municipality', fee: 25, zone: 'town', group: 'পৌর এলাকা' },
  { id: 'area-12', nameBn: 'বাস টার্মিনাল', nameEn: 'Bus Terminal', fee: 30, zone: 'town', group: 'পৌর এলাকা' },
  { id: 'area-13', nameBn: 'পুরাতন বাজার', nameEn: 'Purana Bazar', fee: 20, zone: 'town', group: 'পৌর এলাকা' },
  { id: 'area-14', nameBn: 'নতুন বাজার', nameEn: 'Naya Bazar', fee: 25, zone: 'town', group: 'পৌর এলাকা' },
  { id: 'area-15', nameBn: 'শহীদ মিনার এলাকা', nameEn: 'Shahid Minar Area', fee: 25, zone: 'town', group: 'পৌর এলাকা' },
  { id: 'area-16', nameBn: 'কলেজ রোড', nameEn: 'College Road', fee: 30, zone: 'town', group: 'পৌর এলাকা' },
  { id: 'area-17', nameBn: 'স্কুল রোড', nameEn: 'School Road', fee: 30, zone: 'town', group: 'পৌর এলাকা' },
  { id: 'area-18', nameBn: 'হাসপাতাল রোড', nameEn: 'Hospital Road', fee: 30, zone: 'town', group: 'পৌর এলাকা' },
  { id: 'area-19', nameBn: 'ডিসি অফিস এলাকা', nameEn: 'DC Office Area', fee: 25, zone: 'town', group: 'পৌর এলাকা' },
  { id: 'area-20', nameBn: 'এসপি অফিস মোড়', nameEn: 'SP Office Mor', fee: 25, zone: 'town', group: 'পৌর এলাকা' },
  { id: 'area-21', nameBn: 'আদালত পাড়া', nameEn: 'Adalat Para', fee: 25, zone: 'town', group: 'পৌর এলাকা' },
  { id: 'area-22', nameBn: 'পার্ক রোড', nameEn: 'Park Road', fee: 30, zone: 'town', group: 'পৌর এলাকা' },
  { id: 'area-23', nameBn: 'মহিলা কলেজ এলাকা', nameEn: 'Mohila College Area', fee: 30, zone: 'town', group: 'পৌর এলাকা' },
  { id: 'area-24', nameBn: 'ফায়ার স্টেশন মোড়', nameEn: 'Fire Station Mor', fee: 30, zone: 'town', group: 'পৌর এলাকা' },
  { id: 'area-25', nameBn: 'গোশালা রোড', nameEn: 'Goshala Road', fee: 25, zone: 'town', group: 'গোশালা' },
  { id: 'area-26', nameBn: 'গোশালা পাড়া', nameEn: 'Goshala Para', fee: 25, zone: 'town', group: 'গোশালা' },
  { id: 'area-27', nameBn: 'গোশালা উত্তর পাড়া', nameEn: 'Goshala Uttor Para', fee: 30, zone: 'town', group: 'গোশালা' },
  { id: 'area-28', nameBn: 'তালুক শাসন পাড়া', nameEn: 'Taluk Shason Para', fee: 30, zone: 'town', group: 'গোশালা' },
  { id: 'area-29', nameBn: 'ডাক্তার পাড়া', nameEn: 'Doctor Para', fee: 30, zone: 'town', group: 'গোশালা' },
  { id: 'area-30', nameBn: 'মির্জাপুর', nameEn: 'Mirzapur', fee: 35, zone: 'town', group: 'উপকণ্ঠ' },
  { id: 'area-31', nameBn: 'পূর্ব মির্জাপুর', nameEn: 'Purba Mirzapur', fee: 35, zone: 'town', group: 'উপকণ্ঠ' },
  { id: 'area-32', nameBn: 'মোগলহাট', nameEn: 'Mughalhaat', fee: 35, zone: 'town', group: 'উপকণ্ঠ' },
  { id: 'area-33', nameBn: 'মোগলহাট বাজার', nameEn: 'Mughalhaat Bazar', fee: 35, zone: 'town', group: 'উপকণ্ঠ' },
  { id: 'area-34', nameBn: 'কুলাঘাট', nameEn: 'Kulaghat', fee: 40, zone: 'town', group: 'উপকণ্ঠ' },
  { id: 'area-35', nameBn: 'কুলাঘাট বাজার', nameEn: 'Kulaghat Bazar', fee: 40, zone: 'town', group: 'উপকণ্ঠ' },
  { id: 'area-36', nameBn: 'কুলাঘাট ঘাট ও বাজার', nameEn: 'Kulaghat Ghat', fee: 45, zone: 'town', group: 'উপকণ্ঠ' },
  { id: 'area-37', nameBn: 'বড়বাড়ী হাট', nameEn: 'Boro Bari Haat', fee: 40, zone: 'town', group: 'উপকণ্ঠ' },
  { id: 'area-38', nameBn: 'পাটিকাপাড়া', nameEn: 'Patikapara', fee: 35, zone: 'town', group: 'উপকণ্ঠ' },
  { id: 'area-39', nameBn: 'বিমান বন্দর রোড', nameEn: 'Airport Road', fee: 35, zone: 'town', group: 'উপকণ্ঠ' },
  { id: 'area-40', nameBn: 'চকবাজার', nameEn: 'Chokbazar', fee: 30, zone: 'town', group: 'পৌর এলাকা' },
  { id: 'area-41', nameBn: 'মাছ বাজার', nameEn: 'Mach Bazar', fee: 20, zone: 'town', group: 'কেন্দ্র' },
  { id: 'area-42', nameBn: 'কাঁচা বাজার এলাকা', nameEn: 'Kacha Bazar Area', fee: 20, zone: 'town', group: 'কেন্দ্র' },
  { id: 'area-43', nameBn: 'সদর হাসপাতাল', nameEn: 'Sadar Hospital', fee: 30, zone: 'town', group: 'পৌর এলাকা' },
  { id: 'area-44', nameBn: 'সরকারি কলেজ গেট', nameEn: 'Govt College Gate', fee: 30, zone: 'town', group: 'পৌর এলাকা' },
  { id: 'area-45', nameBn: 'নর্থ বেঙ্গল শুগার মিল', nameEn: 'North Bengal Sugar Mill', fee: 35, zone: 'town', group: 'শিল্প এলাকা' },
  { id: 'area-46', nameBn: 'চিনি কল রোড', nameEn: 'Chini Kol Road', fee: 35, zone: 'town', group: 'শিল্প এলাকা' },
  { id: 'area-47', nameBn: 'ভাটিপাড়া', nameEn: 'Bhati Para', fee: 30, zone: 'town', group: 'পৌর এলাকা' },
  { id: 'area-48', nameBn: 'উত্তর ভাটিপাড়া', nameEn: 'Uttor Bhati Para', fee: 30, zone: 'town', group: 'পৌর এলাকা' },
  { id: 'area-49', nameBn: 'দক্ষিণ পাড়া', nameEn: 'Dakshin Para', fee: 30, zone: 'town', group: 'পৌর এলাকা' },
  { id: 'area-50', nameBn: 'পাথরঘাটা', nameEn: 'Pathorghata', fee: 30, zone: 'town', group: 'পৌর এলাকা' },
  { id: 'area-51', nameBn: 'ঘুঘুমারী', nameEn: 'Ghughumari', fee: 35, zone: 'town', group: 'উপকণ্ঠ' },
  { id: 'area-52', nameBn: 'তুষভাণ্ডার', nameEn: 'Tushbhandar', fee: 35, zone: 'town', group: 'উপকণ্ঠ' },
  { id: 'area-53', nameBn: 'তুষভাণ্ডার বাজার', nameEn: 'Tushbhandar Bazar', fee: 35, zone: 'town', group: 'উপকণ্ঠ' },
  { id: 'area-54', nameBn: 'মহেন্দ্রনগর', nameEn: 'Mahendranagar', fee: 40, zone: 'town', group: 'উপকণ্ঠ' },
  { id: 'area-55', nameBn: 'মহেন্দ্রনগর বাজার', nameEn: 'Mahendranagar Bazar', fee: 40, zone: 'town', group: 'উপকণ্ঠ' },
  { id: 'area-56', nameBn: 'কমলাবাড়ী', nameEn: 'Kamalabari', fee: 35, zone: 'town', group: 'উপকণ্ঠ' },
  { id: 'area-57', nameBn: 'বামনডাঙ্গা', nameEn: 'Bamondanga', fee: 40, zone: 'town', group: 'উপকণ্ঠ' },
  { id: 'area-58', nameBn: 'বামনডাঙ্গা বাজার', nameEn: 'Bamondanga Bazar', fee: 40, zone: 'town', group: 'উপকণ্ঠ' },
  { id: 'area-59', nameBn: 'বাগডোগরা', nameEn: 'Bagdogra', fee: 35, zone: 'town', group: 'উপকণ্ঠ' },
  { id: 'area-60', nameBn: 'রশিদ নগর', nameEn: 'Rashid Nagar', fee: 35, zone: 'town', group: 'পৌর এলাকা' },
  { id: 'area-61', nameBn: 'রশিদ নগর বাজার', nameEn: 'Rashid Nagar Bazar', fee: 35, zone: 'town', group: 'পৌর এলাকা' },
  { id: 'area-62', nameBn: 'ফৌজদারহাট', nameEn: 'Faujdarhaat', fee: 35, zone: 'town', group: 'পৌর এলাকা' },
  { id: 'area-63', nameBn: 'কাজীপাড়া', nameEn: 'Kazi Para', fee: 30, zone: 'town', group: 'পৌর এলাকা' },
  { id: 'area-64', nameBn: 'নোয়াপাড়া', nameEn: 'Noa Para', fee: 30, zone: 'town', group: 'পৌর এলাকা' },
  { id: 'area-65', nameBn: 'তেঁতুলিয়া মোড়', nameEn: 'Tentulia Mor', fee: 35, zone: 'town', group: 'পৌর এলাকা' },
  { id: 'area-66', nameBn: 'কাচারি বাজার', nameEn: 'Kachari Bazar', fee: 30, zone: 'town', group: 'পৌর এলাকা' },
  { id: 'area-67', nameBn: 'পাটোয়ারী পাড়া', nameEn: 'Patwari Para', fee: 30, zone: 'town', group: 'পৌর এলাকা' },
  { id: 'area-68', nameBn: 'আইনজীবী পাড়া', nameEn: 'Ainjibi Para', fee: 30, zone: 'town', group: 'পৌর এলাকা' },
  { id: 'area-69', nameBn: 'মুক্তিযোদ্ধা কমপ্লেক্স', nameEn: 'Muktijoddha Complex', fee: 25, zone: 'town', group: 'পৌর এলাকা' },
  { id: 'area-70', nameBn: 'সোনাইমুড়ি', nameEn: 'Sonaimuri', fee: 40, zone: 'town', group: 'উপকণ্ঠ' },
  { id: 'area-71', nameBn: 'সোনাইমুড়ি বাজার', nameEn: 'Sonaimuri Bazar', fee: 40, zone: 'town', group: 'উপকণ্ঠ' },
  { id: 'area-72', nameBn: 'ভোটমারী', nameEn: 'Bhotmari', fee: 35, zone: 'town', group: 'উপকণ্ঠ' },
  { id: 'area-73', nameBn: 'ভোটমারী বাজার', nameEn: 'Bhotmari Bazar', fee: 35, zone: 'town', group: 'উপকণ্ঠ' },
  { id: 'area-74', nameBn: 'জগতবেড়', nameEn: 'Jogotveda', fee: 40, zone: 'town', group: 'উপকণ্ঠ' },
  { id: 'area-75', nameBn: 'খোকসা বাজার', nameEn: 'Khoksha Bazar', fee: 40, zone: 'town', group: 'উপকণ্ঠ' },
  { id: 'area-76', nameBn: 'চলতিবিল', nameEn: 'Choltibil', fee: 40, zone: 'town', group: 'উপকণ্ঠ' },
  { id: 'area-77', nameBn: 'নাপিতেরহাট', nameEn: 'Napitera Haat', fee: 40, zone: 'town', group: 'উপকণ্ঠ' },
  { id: 'area-78', nameBn: 'মাহারপুর', nameEn: 'Maharpur', fee: 40, zone: 'town', group: 'উপকণ্ঠ' },
  { id: 'area-79', nameBn: 'মাহারপুর বাজার', nameEn: 'Maharpur Bazar', fee: 40, zone: 'town', group: 'উপকণ্ঠ' },
  { id: 'area-80', nameBn: 'কানিয়াল', nameEn: 'Kanyal', fee: 40, zone: 'town', group: 'উপকণ্ঠ' },
  { id: 'area-81', nameBn: 'গোকুণ্ডা', nameEn: 'Gokunda', fee: 40, zone: 'town', group: 'উপকণ্ঠ' },
  { id: 'area-82', nameBn: 'হাঁড়িয়াপাড়া', nameEn: 'Hariya Para', fee: 45, zone: 'town', group: 'উপকণ্ঠ' },
  { id: 'area-83', nameBn: 'পঞ্চগ্রাম', nameEn: 'Panchagram', fee: 45, zone: 'town', group: 'উপকণ্ঠ' },
  { id: 'area-84', nameBn: 'ডোকরা হাট', nameEn: 'Dokra Haat', fee: 45, zone: 'town', group: 'উপকণ্ঠ' },

  // ── ইউনিয়ন হাট-বাজার (Union Areas 85–114) ──
  { id: 'area-85', nameBn: 'তিস্তা বাজার', nameEn: 'Tista Bazar', fee: 50, zone: 'union', group: 'তিস্তা ইউনিয়ন' },
  { id: 'area-86', nameBn: 'বুড়িরহাট', nameEn: 'Burirhat', fee: 50, zone: 'union', group: 'তিস্তা ইউনিয়ন' },
  { id: 'area-87', nameBn: 'চাঁদ বাজার', nameEn: 'Chand Bazar', fee: 55, zone: 'union', group: 'সদর ইউনিয়ন' },
  { id: 'area-88', nameBn: 'মোগলহাট ইউনিয়ন', nameEn: 'Mughalhaat Union', fee: 55, zone: 'union', group: 'মোগলহাট ইউনিয়ন' },
  { id: 'area-89', nameBn: 'মোগলহাট হাট', nameEn: 'Mughalhaat Haat', fee: 55, zone: 'union', group: 'মোগলহাট ইউনিয়ন' },
  { id: 'area-90', nameBn: 'কুলাঘাট ইউনিয়ন', nameEn: 'Kulaghat Union', fee: 60, zone: 'union', group: 'কুলাঘাট ইউনিয়ন' },
  { id: 'area-91', nameBn: 'গোকুণ্ডা বাজার', nameEn: 'Gokunda Bazar', fee: 55, zone: 'union', group: 'গোকুণ্ডা ইউনিয়ন' },
  { id: 'area-92', nameBn: 'গোকুণ্ডা হাট', nameEn: 'Gokunda Haat', fee: 60, zone: 'union', group: 'গোকুণ্ডা ইউনিয়ন' },
  { id: 'area-93', nameBn: 'বড়বাড়ী ইউনিয়ন', nameEn: 'Boro Bari Union', fee: 60, zone: 'union', group: 'বড়বাড়ী ইউনিয়ন' },
  { id: 'area-94', nameBn: 'বড়বাড়ী হাট', nameEn: 'Boro Bari Haat', fee: 60, zone: 'union', group: 'বড়বাড়ী ইউনিয়ন' },
  { id: 'area-95', nameBn: 'চলতিবিল বাজার', nameEn: 'Choltibil Bazar', fee: 60, zone: 'union', group: 'বড়বাড়ী ইউনিয়ন' },
  { id: 'area-96', nameBn: 'হারোয়া হাট', nameEn: 'Haroa Haat', fee: 60, zone: 'union', group: 'হারোয়া ইউনিয়ন' },
  { id: 'area-97', nameBn: 'হারোয়া বাজার', nameEn: 'Haroa Bazar', fee: 65, zone: 'union', group: 'হারোয়া ইউনিয়ন' },
  { id: 'area-98', nameBn: 'ভোটমারী ইউনিয়ন', nameEn: 'Bhotmari Union', fee: 60, zone: 'union', group: 'ভোটমারী ইউনিয়ন' },
  { id: 'area-99', nameBn: 'ভোটমারী হাট', nameEn: 'Bhotmari Haat', fee: 60, zone: 'union', group: 'ভোটমারী ইউনিয়ন' },
  { id: 'area-100', nameBn: 'পঞ্চগ্রাম বাজার', nameEn: 'Panchagram Bazar', fee: 65, zone: 'union', group: 'পঞ্চগ্রাম ইউনিয়ন' },
  { id: 'area-101', nameBn: 'পঞ্চগ্রাম হাট', nameEn: 'Panchagram Haat', fee: 65, zone: 'union', group: 'পঞ্চগ্রাম ইউনিয়ন' },
  { id: 'area-102', nameBn: 'তুষভাণ্ডার ইউনিয়ন', nameEn: 'Tushbhandar Union', fee: 60, zone: 'union', group: 'তুষভাণ্ডার ইউনিয়ন' },
  { id: 'area-103', nameBn: 'তুষভাণ্ডার হাট', nameEn: 'Tushbhandar Haat', fee: 60, zone: 'union', group: 'তুষভাণ্ডার ইউনিয়ন' },
  { id: 'area-104', nameBn: 'খুনিয়াগাছ বাজার', nameEn: 'Khuniyagach Bazar', fee: 65, zone: 'union', group: 'খুনিয়াগাছ ইউনিয়ন' },
  { id: 'area-105', nameBn: 'খুনিয়াগাছ হাট', nameEn: 'Khuniyagach Haat', fee: 65, zone: 'union', group: 'খুনিয়াগাছ ইউনিয়ন' },
  { id: 'area-106', nameBn: 'বামনডাঙ্গা ইউনিয়ন', nameEn: 'Bamondanga Union', fee: 65, zone: 'union', group: 'বামনডাঙ্গা ইউনিয়ন' },
  { id: 'area-107', nameBn: 'বামনডাঙ্গা হাট', nameEn: 'Bamondanga Haat', fee: 65, zone: 'union', group: 'বামনডাঙ্গা ইউনিয়ন' },
  { id: 'area-108', nameBn: 'দুরাকুটি বাজার', nameEn: 'Durakuti Bazar', fee: 70, zone: 'union', group: 'দুরাকুটি ইউনিয়ন' },
  { id: 'area-109', nameBn: 'দুরাকুটি হাট', nameEn: 'Durakuti Haat', fee: 70, zone: 'union', group: 'দুরাকুটি ইউনিয়ন' },
  { id: 'area-110', nameBn: 'মহেন্দ্রনগর ইউনিয়ন', nameEn: 'Mahendranagar Union', fee: 70, zone: 'union', group: 'মহেন্দ্রনগর ইউনিয়ন' },
  { id: 'area-111', nameBn: 'মহেন্দ্রনগর হাট', nameEn: 'Mahendranagar Haat', fee: 70, zone: 'union', group: 'মহেন্দ্রনগর ইউনিয়ন' },
  { id: 'area-112', nameBn: 'রাজপুর হাট', nameEn: 'Rajpur Haat', fee: 75, zone: 'union', group: 'রাজপুর ইউনিয়ন' },
  { id: 'area-113', nameBn: 'রাজপুর বাজার', nameEn: 'Rajpur Bazar', fee: 75, zone: 'union', group: 'রাজপুর ইউনিয়ন' },
  { id: 'area-114', nameBn: 'কাকিনা বাজার', nameEn: 'Kakina Bazar', fee: 75, zone: 'union', group: 'কাকিনা ইউনিয়ন' },
];

export const getAreaById = (id: string): DeliveryArea | undefined =>
  DELIVERY_AREAS.find(a => a.id === id);

// Fuzzy search — tolerates wrong spellings
export const searchAreas = (query: string): DeliveryArea[] => {
  if (!query.trim()) return DELIVERY_AREAS;
  const q = query.toLowerCase().trim();

  // Normalize common misspellings
  const normalize = (s: string) =>
    s.toLowerCase()
      .replace(/gh/g, 'g').replace(/kh/g, 'k')
      .replace(/sh/g, 's').replace(/ph/g, 'f')
      .replace(/\s+/g, '');

  const nq = normalize(q);

  return DELIVERY_AREAS.filter(area => {
    const bn = area.nameBn.toLowerCase();
    const en = area.nameEn.toLowerCase();
    const enNorm = normalize(en);

    return (
      bn.includes(q) ||
      en.toLowerCase().includes(q) ||
      enNorm.includes(nq) ||
      // Check if all chars of query appear in order
      fuzzyMatch(en.toLowerCase(), q)
    );
  });
};

function fuzzyMatch(str: string, pattern: string): boolean {
  let pi = 0;
  for (let i = 0; i < str.length && pi < pattern.length; i++) {
    if (str[i] === pattern[pi]) pi++;
  }
  return pi === pattern.length && pattern.length >= 3;
}
