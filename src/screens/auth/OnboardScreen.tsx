import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';

const SLIDES = [
  {
    emoji: '🛒',
    titleBn: 'বাজার করুন ঘরে বসে',
    titleEn: 'Shop from home',
    bodyBn: 'লালমনিরহাটের যেকোনো এলাকা থেকে তাজা বাজার ও রেস্তোরাঁর খাবার অর্ডার করুন।',
    bodyEn: 'Order fresh groceries and restaurant food from any area in Lalmonirhat.',
    bg: 'bg-primary',
  },
  {
    emoji: '⚡',
    titleBn: 'দ্রুত ডেলিভারি',
    titleEn: 'Fast delivery',
    bodyBn: 'অর্ডার দেওয়ার ৩০-৬০ মিনিটের মধ্যে আপনার দরজায় পৌঁছে দেওয়া হবে।',
    bodyEn: 'Get your order delivered to your door within 30-60 minutes.',
    bg: 'bg-secondary',
  },
  {
    emoji: '📍',
    titleBn: 'লাইভ ট্র্যাকিং',
    titleEn: 'Live tracking',
    bodyBn: 'রাইডারের লোকেশন রিয়েল-টাইমে দেখুন এবং অর্ডারের আপডেট পান।',
    bodyEn: 'See your rider\'s location in real-time and get order updates.',
    bg: 'bg-tertiary',
  },
];

export default function OnboardScreen() {
  const { state, t } = useApp();
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const lang = state.lang;

  const slide = SLIDES[current];
  const isLast = current === SLIDES.length - 1;

  const next = () => {
    if (isLast) navigate('/login', { replace: true });
    else setCurrent(c => c + 1);
  };

  const skip = () => navigate('/login', { replace: true });

  return (
    <div className="flex-1 flex flex-col">
      {/* Slide */}
      <div className={clsx('flex-1 flex flex-col items-center justify-center gap-6 px-8', slide.bg)}>
        {/* Skip */}
        <button
          onClick={skip}
          className="absolute top-5 right-5 text-white/70 text-label-md"
        >
          {lang === 'bn' ? 'এড়িয়ে যান' : 'Skip'}
        </button>

        {/* Icon */}
        <div className="w-36 h-36 rounded-[40px] bg-white/20 flex items-center justify-center text-[72px]">
          {slide.emoji}
        </div>

        {/* Text */}
        <div className="text-center">
          <h2 className="text-headline-lg font-bold text-white">
            {lang === 'bn' ? slide.titleBn : slide.titleEn}
          </h2>
          <p className="text-body-lg text-white/80 mt-2 leading-relaxed">
            {lang === 'bn' ? slide.bodyBn : slide.bodyEn}
          </p>
        </div>
      </div>

      {/* Bottom */}
      <div className="bg-surface px-6 py-8 flex flex-col gap-5">
        {/* Dots */}
        <div className="flex justify-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={clsx(
                'rounded-full transition-all duration-300',
                i === current ? 'w-6 h-2 bg-primary' : 'w-2 h-2 bg-outline-variant',
              )}
            />
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={next}
          className="w-full py-4 rounded-2xl bg-primary text-white text-label-lg font-bold active:bg-primary/90 transition-colors"
        >
          {isLast
            ? (lang === 'bn' ? 'শুরু করুন' : 'Get Started')
            : (lang === 'bn' ? 'পরবর্তী' : 'Next')}
        </button>
      </div>
    </div>
  );
}
