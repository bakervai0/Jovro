import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

export default function SplashScreen() {
  const { state } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (state.isLoggedIn) {
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
    }, 2000);
    return () => clearTimeout(timer);
  }, [state.isLoggedIn, state.role, navigate]);

  return (
    <div
      className="flex-1 flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #1D9D57 0%, #17834a 60%, #126e3e 100%)' }}
    >
      {/* Background blobs */}
      <div className="absolute top-[-80px] right-[-60px] w-72 h-72 rounded-full"
        style={{ background: 'rgba(255,255,255,0.08)' }} />
      <div className="absolute bottom-[-100px] left-[-80px] w-96 h-96 rounded-full"
        style={{ background: 'rgba(255,255,255,0.06)' }} />
      <div className="absolute top-[30%] left-[-40px] w-36 h-36 rounded-full"
        style={{ background: 'rgba(255,255,255,0.05)' }} />

      {/* Logo */}
      <div className="flex flex-col items-center gap-5 animate-fadeIn">
        {/* Icon */}
        <div
          className="w-28 h-28 rounded-[32px] bg-white flex items-center justify-center relative"
          style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.2)' }}
        >
          <span
            className="material-symbols-outlined text-primary text-[60px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            pedal_bike
          </span>
          <div className="absolute -top-2 -right-2 w-9 h-9 rounded-full bg-secondary flex items-center justify-center shadow-lg">
            <span
              className="material-symbols-outlined text-white text-[18px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              shopping_bag
            </span>
          </div>
        </div>

        {/* Name */}
        <div className="text-center">
          <h1 className="text-[48px] font-black text-white leading-none tracking-tight">Jovro</h1>
          <p className="text-white/70 text-body-lg mt-1">লালমনিরহাটের নিজের পার্সোনাল শপার</p>
        </div>
      </div>

      {/* Bottom loading */}
      <div className="absolute bottom-14 flex flex-col items-center gap-3">
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-white/60"
              style={{
                animation: 'pulse 1.2s ease-in-out infinite',
                animationDelay: `${i * 0.25}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
