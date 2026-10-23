import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/layout/Headers';
import { BottomSheet } from '../../components/ui/BottomSheet';
import { searchAreasIn } from '../../data/areas';
import { tk, toBn } from '../../lib/format';

export default function EditProfileScreen() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const bn = state.lang === 'bn';
  const user = state.user;

  const [name, setName] = useState(user?.nameBn ?? user?.name ?? '');
  const [nameEn, setNameEn] = useState(user?.name ?? '');
  const [mobile, setMobile] = useState(user?.mobile ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [areaId, setAreaId] = useState(state.selectedAreaId);
  const [areaSheet, setAreaSheet] = useState(false);
  const [areaQuery, setAreaQuery] = useState('');
  const [saved, setSaved] = useState(false);

  const area = state.areas.find(a => a.id === areaId);
  const results = areaQuery ? searchAreasIn(state.areas, areaQuery) : state.areas;

  const save = () => {
    if (!user) return;
    dispatch({
      type: 'UPDATE_PROFILE',
      user: {
        ...user,
        name: nameEn.trim() || name.trim(),
        nameBn: name.trim() || nameEn.trim(),
        mobile: mobile.trim(),
        email: email.trim() || undefined,
        deliveryAreaId: areaId,
      },
    });
    dispatch({ type: 'SET_AREA', areaId });
    setSaved(true);
    setTimeout(() => navigate(-1), 700);
  };

  return (
    <div className="screen-scroll bg-surface">
      <PageHeader showBack title={bn ? 'প্রোফাইল সম্পাদনা' : 'Edit profile'} subtitle={bn ? 'আপনার তথ্য আপডেট করুন' : 'Update your details'} />

      <div className="flex flex-col gap-3 px-4 pb-32 pt-4">
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            <span className="grid h-20 w-20 place-items-center rounded-full bg-primary-soft text-primary">
              <span className="material-symbols-outlined filled-symbol text-[38px]">person</span>
            </span>
            <button className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-primary text-white">
              <span className="material-symbols-outlined text-[16px]">photo_camera</span>
            </button>
          </div>
          <p className="text-[10.5px] text-on-surface-variant">{bn ? 'ছবি বদলাতে ট্যাপ করুন (ডেমো)' : 'Tap to change photo (demo)'}</p>
        </div>

        <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-3.5 shadow-card">
          <label className="text-[11px] font-medium text-on-surface-variant">{bn ? 'নাম (বাংলা)' : 'Name (Bangla)'}</label>
          <input value={name} onChange={e => setName(e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 text-[13px] outline-none focus:border-primary" />

          <label className="mt-3 block text-[11px] font-medium text-on-surface-variant">{bn ? 'নাম (English)' : 'Name (English)'}</label>
          <input value={nameEn} onChange={e => setNameEn(e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 text-[13px] outline-none focus:border-primary" />

          <label className="mt-3 block text-[11px] font-medium text-on-surface-variant">{bn ? 'মোবাইল নম্বর' : 'Mobile number'}</label>
          <input value={mobile} onChange={e => setMobile(e.target.value)} inputMode="tel" className="mt-1 h-10 w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 text-[13px] outline-none focus:border-primary" />
          <p className="mt-1 text-[10px] text-on-surface-variant">{bn ? 'নম্বর বদলালে OTP যাচাই লাগবে (ডেমোতে বন্ধ).' : 'Changing the number needs OTP verification (disabled in demo).'}</p>

          <label className="mt-3 block text-[11px] font-medium text-on-surface-variant">{bn ? 'ইমেইল (ঐচ্ছিক)' : 'Email (optional)'}</label>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" className="mt-1 h-10 w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 text-[13px] outline-none focus:border-primary" />

          <label className="mt-3 block text-[11px] font-medium text-on-surface-variant">{bn ? 'ডেলিভারি এলাকা' : 'Delivery area'}</label>
          <button onClick={() => setAreaSheet(true)} className="mt-1 flex w-full items-center justify-between gap-2 rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2.5 text-left">
            <span>
              <span className="block text-[12.5px] font-semibold text-on-surface">{bn ? area?.nameBn : area?.nameEn}</span>
              <span className="block text-[10px] text-on-surface-variant">{bn ? 'ডেলিভারি ফি' : 'Fee'} {tk(area?.fee ?? 20, state.lang)}</span>
            </span>
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">chevron_right</span>
          </button>

          <div className="mt-3 flex items-center justify-between rounded-xl bg-surface-container px-3 py-2">
            <span className="text-[11px] text-on-surface-variant">{bn ? 'কাস্টমার আইডি' : 'Customer ID'}</span>
            <span className="text-[12px] font-bold text-primary-deep">{user?.id?.toUpperCase()}</span>
          </div>
        </div>

        <button
          onClick={save}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-[13.5px] font-bold text-white"
        >
          <span className="material-symbols-outlined text-[18px]">{saved ? 'check_circle' : 'save'}</span>
          {saved ? (bn ? 'সেভ হয়েছে' : 'Saved') : (bn ? 'পরিবর্তন সেভ করুন' : 'Save changes')}
        </button>
      </div>

      <BottomSheet open={areaSheet} onClose={() => setAreaSheet(false)} title={bn ? 'ডেলিভারি এলাকা' : 'Delivery area'}>
        <div className="px-4 pb-4">
          <input
            value={areaQuery}
            onChange={e => setAreaQuery(e.target.value)}
            placeholder={bn ? 'এলাকার নাম লিখুন...' : 'Search area...'}
            className="h-10 w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 text-[12.5px] outline-none focus:border-primary"
          />
          <div className="mt-2 max-h-[50vh] overflow-y-auto">
            {results.slice(0, 80).map(a => (
              <button key={a.id} onClick={() => { setAreaId(a.id); setAreaSheet(false); }} className="flex w-full items-center justify-between border-b border-outline-variant/40 py-2.5 text-left">
                <span className="text-[12.5px] text-on-surface">{bn ? a.nameBn : a.nameEn}</span>
                <span className="text-[11.5px] font-semibold text-primary-deep">{tk(a.fee, state.lang)}</span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-center text-[10px] text-on-surface-variant">{toBn(results.length, state.lang)} {bn ? 'টি এলাকা পাওয়া গেছে' : 'areas found'}</p>
        </div>
      </BottomSheet>
    </div>
  );
}
