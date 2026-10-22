import type { Lang } from '../types';

const delay = (ms = 1200) => new Promise(res => setTimeout(res, ms));

interface AiResponse {
  messageBn: string;
  messageEn: string;
  suggestions?: string[];
}

const DEMO_RESPONSES: AiResponse[] = [
  {
    messageBn: 'আজকের বাজারে মিনিকেট চালের দাম প্রতি কেজি ৬৮ টাকা। মসুর ডাল ১১০ টাকা। সবকিছু স্বাভাবিক আছে।',
    messageEn: 'Today Miniket rice is ৳68/kg. Red lentils ৳110/kg. Prices are normal.',
    suggestions: ['চালের দাম কত?', 'আজকের সবজির দাম?', 'কোন কোন এলাকায় ডেলিভারি আছে?'],
  },
  {
    messageBn: 'লালমনিরহাট সদরে আমরা ৮৪টি এলাকায় ডেলিভারি দিচ্ছি। টাউন এলাকায় ৳২০ এবং ইউনিয়নে ৳৫০-৭৫ ডেলিভারি চার্জ।',
    messageEn: 'We deliver to 84 areas in Lalmonirhat Sadar. Town fee ৳20, union ৳50-75.',
    suggestions: ['আমার এলাকায় ডেলিভারি আছে?', 'ডেলিভারি কত সময় লাগে?'],
  },
  {
    messageBn: 'অর্ডার দেওয়ার পর সাধারণত ৩০-৬০ মিনিটের মধ্যে ডেলিভারি পাবেন। রাইডারের লোকেশন রিয়েল-টাইমে দেখতে পাবেন।',
    messageEn: 'After placing an order, delivery usually takes 30-60 minutes. Track your rider in real-time.',
    suggestions: ['অর্ডার ট্র্যাক করতে চাই', 'কোন পেমেন্ট পদ্ধতি আছে?'],
  },
  {
    messageBn: 'আমরা ক্যাশ অন ডেলিভারি, বিকাশ এবং নগদ পেমেন্ট গ্রহণ করি। বিকাশ/নগদে অর্ডারে ৫% ক্যাশব্যাক পাবেন।',
    messageEn: 'We accept Cash on Delivery, bKash, and Nagad. 5% cashback on bKash/Nagad payments.',
    suggestions: ['প্রমো কোড আছে?', 'রিফান্ড পলিসি কী?'],
  },
];

let responseIdx = 0;

export async function askAiAssistant(
  message: string,
  lang: Lang,
): Promise<AiResponse> {
  await delay(1000 + Math.random() * 800);
  const response = DEMO_RESPONSES[responseIdx % DEMO_RESPONSES.length];
  responseIdx++;
  return response;
}

export async function getAiSuggestions(context: string): Promise<string[]> {
  await delay(500);
  return [
    'আজকের দাম জানতে চাই',
    'অর্ডার করতে চাই',
    'ডেলিভারি সম্পর্কে জানতে চাই',
    'প্রমো কোড আছে?',
  ];
}
