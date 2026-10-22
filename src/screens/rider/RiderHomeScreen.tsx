import React from 'react';
import { useApp } from '../../context/AppContext';
import { TopAppBar } from '../../components/layout/TopAppBar';
import { PageFrame } from '../../components/layout/PageFrame';
export default function RiderHomeScreen() {
  return (
    <>
      <TopAppBar title="Rider Dashboard" />
      <PageFrame>
        <p className="py-8 text-center text-on-surface-variant">Rider screen — Phase 5</p>
      </PageFrame>
    </>
  );
}
