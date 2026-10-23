import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/layout/Headers';
import { BottomSheet } from '../../components/ui/BottomSheet';
import { tk } from '../../lib/format';

export default function AddressesScreen() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const bn = state.lang === 'bn';
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const makeDefault = (id: string) => {
    state.addresses.forEach(a => {
      dispatch({ type: 'UPDATE_ADDRESS', address: { ...a, isDefault: a.id === id } });
    });
    const addr = state.addresses.find(a => a.id === id);
    if (addr) dispatch({ type: 'SET_AREA', areaId: addr.areaId });
  };

  return (
    <div className="screen-scroll bg-surface">
      <PageHeader
        showBack
        title={bn ? 'সেভ করা ঠিকানা' : 'Saved addresses'}
        subtitle={bn ? 'ডেলিভারির জন্য ব্যবহৃত ঠিকানা' : 'Addresses used for delivery'}
        right={
          <button onClick={() => navigate('/addresses/new')} className="grid h-8 w-8 place-items-center rounded-full bg-primary text-white">
            <span className="material-symbols-outlined text-[18px]">add</span>
          </button>
        }
      />

      <div className="flex flex-col gap-2.5 px-4 pb-32 pt-3">
        {state.addresses.map(addr => {
          const area = state.areas.find(a => a.id === addr.areaId);
          return (
            <div key={addr.id} className={clsx('rounded-2xl border bg-surface-container-lowest p-3.5 shadow-card', addr.isDefault ? 'border-primary' : 'border-outline-variant/60')}>
              <div className="flex items-start gap-2.5">
                <span className={clsx('grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl', addr.isDefault ? 'bg-primary-soft text-primary-deep' : 'bg-surface-container text-on-surface-variant')}>
                  <span className="material-symbols-outlined text-[19px]">{addr.label === 'বাড়ি' ? 'home' : addr.label === 'অফিস' ? 'work' : 'place'}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-[13px] font-bold text-on-surface">
                    {bn ? addr.label : addr.labelEn}
                    {addr.isDefault && (
                      <span className="rounded-full bg-primary px-1.5 py-0.5 text-[8.5px] font-bold text-white">{bn ? 'ডিফল্ট' : 'Default'}</span>
                    )}
                  </p>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-on-surface-variant">{addr.fullAddress}</p>
                  <p className="mt-1 text-[10.5px] text-primary-deep">
                    {bn ? area?.nameBn : area?.nameEn} · {bn ? 'ডেলিভারি' : 'Delivery'} {tk(area?.fee ?? 20, state.lang)}
                  </p>
                </div>
              </div>

              <div className="mt-2.5 flex items-center gap-2 border-t border-outline-variant/50 pt-2">
                {!addr.isDefault && (
                  <button onClick={() => makeDefault(addr.id)} className="text-[10.5px] font-semibold text-primary">
                    {bn ? 'ডিফল্ট করুন' : 'Make default'}
                  </button>
                )}
                <span className="flex-1" />
                <button onClick={() => navigate(`/addresses/${addr.id}/edit`)} className="flex items-center gap-1 rounded-lg bg-surface-container px-2 py-1 text-[10.5px] font-semibold text-on-surface">
                  <span className="material-symbols-outlined text-[13px]">edit</span>{bn ? 'এডিট' : 'Edit'}
                </button>
                <button onClick={() => setDeleteId(addr.id)} className="flex items-center gap-1 rounded-lg bg-error-soft px-2 py-1 text-[10.5px] font-semibold text-error">
                  <span className="material-symbols-outlined text-[13px]">delete</span>{bn ? 'মুছুন' : 'Delete'}
                </button>
              </div>
            </div>
          );
        })}

        {state.addresses.length === 0 && (
          <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest p-8 text-center">
            <span className="material-symbols-outlined text-[38px] text-on-surface-variant/50">location_off</span>
            <p className="mt-2 text-[13.5px] font-semibold text-on-surface">{bn ? 'কোনো ঠিকানা সেভ করা নেই' : 'No saved addresses'}</p>
            <p className="mt-1 text-[11px] text-on-surface-variant">{bn ? 'একটি ঠিকানা যোগ করুন — চেকআউট দ্রুত হবে।' : 'Add one to speed up checkout.'}</p>
          </div>
        )}

        <button
          onClick={() => navigate('/addresses/new')}
          className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-full border border-dashed border-primary/60 bg-primary-tint text-[13px] font-bold text-primary-deep"
        >
          <span className="material-symbols-outlined text-[18px]">add_location_alt</span>
          {bn ? 'নতুন ঠিকানা যোগ করুন' : 'Add a new address'}
        </button>

        <div className="rounded-2xl bg-surface-container p-3">
          <p className="text-[10.5px] leading-relaxed text-on-surface-variant">
            <b className="text-on-surface">{bn ? 'কেন বিস্তারিত ঠিকানা?' : 'Why detailed address?'}</b>{' '}
            {bn ? 'লালমনিরহাটে অনেক গলি একই নামে — বাড়ি নম্বর, মসজিদ/স্কুলের নাম লিখলে রাইডার দ্রুত পৌঁছাবে।' : 'Many lanes share names in Lalmonirhat — add landmarks so riders reach faster.'}
          </p>
        </div>
      </div>

      <BottomSheet open={!!deleteId} onClose={() => setDeleteId(null)} title={bn ? 'ঠিকানা মুছবেন?' : 'Delete address?'}>
        <div className="px-4 pb-4">
          <p className="text-[12px] text-on-surface-variant">{bn ? 'এই ঠিকানাটি স্থায়ীভাবে মুছে যাবে।' : 'This address will be removed permanently.'}</p>
          <div className="mt-3 flex gap-2">
            <button onClick={() => setDeleteId(null)} className="h-10 flex-1 rounded-full border border-outline-variant text-[12.5px] font-semibold text-on-surface">
              {bn ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              onClick={() => { if (deleteId) dispatch({ type: 'DELETE_ADDRESS', id: deleteId }); setDeleteId(null); }}
              className="h-10 flex-1 rounded-full bg-error text-[12.5px] font-semibold text-white"
            >
              {bn ? 'মুছুন' : 'Delete'}
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
