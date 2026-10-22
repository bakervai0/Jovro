import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

export default function SplashScreen() {
  const { state } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (state.isLoggedIn) {
        // Route by role
        const routes: Record<string, string> = {
          customer: '/',
          rider: '/rider',
          affiliate: '/affiliate',
          staff: '/staff',
          admin: '/admin',
        };
        navigate(routes[state.role] ?? '/', { replace: true });
      } else {
        navigate('/lang', { replace: true });
      }
    }, 2200);
    return () => clearTimeout(timer);
  }, [state.isLoggedIn, state.role, navigate]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-primary relative overflow-hidden">
      {/* Background circles */}
      <div className="absolute top-[-80px] right-[-60px] w-64 h-64 rounded-full bg-white/10" />
      <div className="absolute bottom-[-100px] left-[-80px] w-80 h-80 rounded-full bg-white/8" />
      <div className="absolute top-1/3 left-[-40px] w-32 h-32 rounded-full bg-white/6" />

      {/* Logo */}
      <div className="flex flex-col items-center gap-4 animate-fadeIn">
        <div className="w-24 h-24 rounded-[28px] bg-white flex items-center justify-center shadow-xl">
          <span className="material-symbols-outlined text-primary text-[52px] filled-symbol">local_shipping</span>
        </div>
        <div className="text-center">
          <h1 className="text-[42px] font-black text-white leading-none tracking-tight">Jovro</h1>
          <p className="text-white/80 text-body-lg mt-1">লালমনিরহাটের নিজের পার্সোনাল শপার</p>
        </div>
      </div>

      {/* Tagline */}
      <div className="absolute bottom-24 text-center animate-fadeIn" style={{ animationDelay: '0.8s', animationFillMode: 'both', opacity: 0 }}>
        <p className="text-white/60 text-label-md">বাজার করুন ঘরে বসে</p>
      </div>

      {/* Loading dots */}
      <div className="absolute bottom-12 flex gap-2">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-white/60"
            style={{
              animation: 'pulse 1.2s ease-in-out infinite',
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
