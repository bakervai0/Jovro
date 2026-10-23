import React from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import type { CartItem } from '../types';

/* ── helpers ─────────────────────────────────────────────────── */

function seedSession(role: 'customer' | 'rider' | 'admin' | 'staff' | 'affiliate' = 'customer') {
  localStorage.setItem('jovro_loggedIn', 'true');
  localStorage.setItem('jovro_role', JSON.stringify(role));
  localStorage.setItem('jovro_lang', JSON.stringify('bn'));
}

const RICE: CartItem = {
  id: 'p-01',
  productId: 'p-01',
  nameBn: 'মিনিকেট চাল',
  nameEn: 'Miniket Rice',
  price: 70,
  quantity: 3,
  unit: 'কেজি',
  source: 'bazaar',
  isApproxPrice: true,
};

function seedCart(items: CartItem[] = [RICE]) {
  localStorage.setItem('jovro_cart', JSON.stringify(items));
}

async function renderAt(path: string) {
  window.history.replaceState({}, '', path);
  const user = userEvent.setup();
  const view = render(<App />);
  return { user, ...view };
}

const flush = () => new Promise(r => setTimeout(r, 120));

/* ── customer shell ──────────────────────────────────────────── */

describe('customer shell', () => {
  it('renders the home screen with the five-tab bottom nav', async () => {
    seedSession();
    await renderAt('/');
    expect(await screen.findByText('Jovro')).toBeInTheDocument();

    const nav = await screen.findByRole('navigation');
    const tabs = within(nav).getAllByRole('button');
    const labels = tabs.map(t => t.textContent ?? '');
    for (const label of ['হোম', 'বাজার', 'রেস্টুরেন্ট', 'অর্ডার', 'প্রোফাইল']) {
      expect(labels.some(l => l.includes(label))).toBe(true);
    }
  });

  it('switches the whole UI to English with the language toggle', async () => {
    seedSession();
    const { user } = await renderAt('/');
    const toggle = await screen.findByRole('button', { name: /Switch to English/i });
    await user.click(toggle);
    await flush();
    await waitFor(() => expect(screen.getByRole('button', { name: /বাংলায় দেখুন/i })).toBeInTheDocument());
    expect(localStorage.getItem('jovro_lang')).toBe('"en"');
  });

  it('keeps the bottom nav out of the auth screens', async () => {
    await renderAt('/login');
    await screen.findAllByText(/লগইন|Login/i);
    expect(screen.queryByRole('navigation')).toBeNull();
  });
});

/* ── shopping flow ───────────────────────────────────────────── */

describe('shopping flow', () => {
  it('adds a product from the catalogue and shows the sticky cart bar', async () => {
    seedSession();
    const { user } = await renderAt('/bazaar');
    await screen.findAllByText(/বাজার|Bazaar/i);

    const addButtons = await screen.findAllByRole('button', { name: /যোগ করুন|Add/ });
    expect(addButtons.length).toBeGreaterThan(0);
    await user.click(addButtons[0]);

    await waitFor(() => expect(screen.getByText(/কার্ট দেখুন|View cart/)).toBeInTheDocument());
    const cart = JSON.parse(localStorage.getItem('jovro_cart') || '[]');
    expect(cart.length).toBe(1);
    expect(cart[0].quantity).toBe(1);
  });

  it('rejects an invalid promo and applies a valid one', async () => {
    seedSession();
    seedCart();
    const { user } = await renderAt('/cart');
    const input = await screen.findByPlaceholderText(/JOVRO50/);

    await user.type(input, 'NOTACODE');
    await user.click(screen.getByRole('button', { name: 'প্রয়োগ' }));
    expect(await screen.findByText(/সঠিক নয়|প্রযোজ্য নয়|নেই/)).toBeInTheDocument();

    await user.clear(input);
    await user.type(input, 'JOVRO50');
    await user.click(screen.getByRole('button', { name: 'প্রয়োগ' }));
    await waitFor(() => expect(screen.getByText(/JOVRO50 প্রয়োগ হয়েছে/)).toBeInTheDocument());
  });

  it('places an order from checkout and lists it under My Orders', async () => {
    seedSession();
    seedCart();
    const { user } = await renderAt('/checkout');

    await screen.findAllByText(/চেকআউট/);
    fireEvent.change(await screen.findByPlaceholderText('আপনার নাম'), { target: { value: 'রাবেয়া খাতুন' } });
    fireEvent.change(await screen.findByPlaceholderText('01XXXXXXXXX'), { target: { value: '01712345678' } });
    fireEvent.change(await screen.findByPlaceholderText(/বাড়ি নম্বর/), {
      target: { value: 'হাউস ১২, রোড ৩, চৌধুরীপাড়া, গোশালা বাজারের পাশে' },
    });

    await user.click(screen.getByRole('button', { name: /অর্ডার নিশ্চিত করুন/ }));

    await waitFor(() => expect(window.location.pathname).toMatch(/^\/order-success\//), { timeout: 8000 });

    await waitFor(() => {
      const data = JSON.parse(localStorage.getItem('jovro_data_v5') || '{}');
      const placed = (data.orders || []).find((o: { customerName?: string }) => o.customerName?.includes('রাবেয়া'));
      expect(placed).toBeTruthy();
      expect(placed.items.length).toBeGreaterThan(0);
      expect(placed.finalTotal).toBeGreaterThan(0);
    });
  });
});

/* ── area picker ─────────────────────────────────────────────── */

describe('area picker', () => {
  it('finds গোশালা বাজার from the typo "gosala"', async () => {
    await renderAt('/area');
    const user = userEvent.setup();
    const input = await screen.findByPlaceholderText(/এলাকার নাম লিখুন/);
    await user.type(input, 'gosala');
    await waitFor(() => expect(screen.getByText(/গোশালা বাজার/)).toBeInTheDocument());
  });
});

/* ── cross-role flows ────────────────────────────────────────── */

describe('cross-role flows', () => {
  it('admin assigns a rider and the order shows up in that rider’s portal', async () => {
    seedSession('admin');
    const { user, unmount } = await renderAt('/admin/orders');
    await screen.findAllByText(/অর্ডার/);

    const selects = await screen.findAllByLabelText(/রাইডার নির্বাচন|Select rider/);
    const select = selects.find(s => (s as HTMLSelectElement).value === '');
    expect(select).toBeTruthy();
    await user.selectOptions(select!, 'rider-01');

    let assignedId = '';
    await waitFor(() => {
      const data = JSON.parse(localStorage.getItem('jovro_data_v5') || '{}');
      const assigned = (data.orders || []).find(
        (o: { riderId?: string; status: string }) =>
          o.riderId === 'rider-01' && ['pending', 'confirmed', 'buying', 'on-the-way'].includes(o.status),
      );
      expect(assigned).toBeTruthy();
      assignedId = assigned.id;
    });
    unmount();

    // Rider portal reads the same persisted order graph
    seedSession('rider');
    await renderAt('/rider');
    await waitFor(() => expect(document.body.textContent).toContain(assignedId.slice(0, 8)));
  });

  it('customer problem report lands in the admin inbox', async () => {
    seedSession();
    const order = 'JV-240001';
    const { user, unmount } = await renderAt(`/report?order=${order}`);

    await screen.findAllByText(/রিপোর্ট|Report/i);
    await user.click(await screen.findByRole('button', { name: /ভুল জিনিস এসেছে|Wrong item/ }));
    const detail = document.getElementById('problem-detail') as HTMLTextAreaElement;
    fireEvent.change(detail, { target: { value: 'চালের বদলে ভুল ব্র্যান্ড এসেছে, ফেরত চাই।' } });
    await user.click(screen.getByRole('button', { name: /রিপোর্ট পাঠান|Send Report/ }));

    await waitFor(() => {
      const data = JSON.parse(localStorage.getItem('jovro_data_v5') || '{}');
      const report = (data.problemReports || []).find(
        (r: { orderId: string }) => r.orderId === order,
      );
      expect(report).toBeTruthy();
    });
    unmount();

    seedSession('admin');
    await renderAt('/admin/problems');
    await waitFor(() => expect(document.body.textContent).toMatch(/চালের বদলে ভুল ব্র্যান্ড|ভুল জিনিস/));
  });
});

/* ── role dashboards ─────────────────────────────────────────── */

describe('role dashboards', () => {
  it('shows the rider portal with today’s deliveries', async () => {
    seedSession('rider');
    await renderAt('/rider');
    await screen.findAllByText(/আজকের|ডেলিভারি|Rider/i);
    expect(screen.queryByRole('navigation')).toBeTruthy();
  });

  it('shows the admin overview with live counters', async () => {
    seedSession('admin');
    await renderAt('/admin');
    await screen.findAllByText(/অ্যাডমিন|Admin|ড্যাশবোর্ড|Overview/i);
  });

  it('shows the restricted staff dashboard', async () => {
    seedSession('staff');
    await renderAt('/staff');
    await screen.findAllByText(/অর্ডার|Order/i);
  });

  it('shows the affiliate home with referral code', async () => {
    seedSession('affiliate');
    await renderAt('/affiliate');
    await screen.findAllByText(/রেফারেল|Referral|আয়|Earning/i);
  });
});
