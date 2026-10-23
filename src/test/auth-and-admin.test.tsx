import React from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

function seedSession(role: 'customer' | 'rider' | 'admin' | 'staff' | 'affiliate' = 'customer') {
  localStorage.setItem('jovro_loggedIn', 'true');
  localStorage.setItem('jovro_role', JSON.stringify(role));
  localStorage.setItem('jovro_lang', JSON.stringify('bn'));
}

async function renderAt(path: string) {
  window.history.replaceState({}, '', path);
  const user = userEvent.setup();
  const view = render(<App />);
  return { user, ...view };
}

describe('authentication', () => {
  it('logs in any mobile + password as a customer', async () => {
    const { user } = await renderAt('/login');
    await screen.findAllByText(/আবার স্বাগতম/);

    fireEvent.change(await screen.findByPlaceholderText('01XXXXXXXXX'), { target: { value: '01712999000' } });
    fireEvent.change(await screen.findByPlaceholderText(/পাসওয়ার্ড দিন/), { target: { value: 'demo1234' } });
    const submit = screen.getAllByRole('button', { name: /লগইন করুন/ }).find(b => b.getAttribute('type') === 'submit');
    await user.click(submit!);

    await waitFor(() => expect(window.location.pathname).toBe('/'), { timeout: 8000 });
    expect(localStorage.getItem('jovro_loggedIn')).toBe('true');
    expect(JSON.parse(localStorage.getItem('jovro_role') || '"customer"')).toBe('customer');
  });

  it('shows the demo code hint on the OTP screen', async () => {
    await renderAt('/otp');
    expect(await screen.findByText(/Demo code: 1234/)).toBeInTheDocument();
  });

  it('switches roles instantly from the login screen demo switcher', async () => {
    const { user } = await renderAt('/login');
    await user.click(await screen.findByRole('button', { name: /ডেমো মোড/ }));
    const rider = await screen.findByRole('button', { name: /রাইডার/ });
    await user.click(rider);

    await waitFor(() => expect(window.location.pathname).toBe('/rider'), { timeout: 8000 });
    expect(JSON.parse(localStorage.getItem('jovro_role') || '"customer"')).toBe('rider');
  });

  it('keeps the onboarding flow reachable without a session', async () => {
    await renderAt('/lang');
    await screen.findAllByText(/ভাষা|Language/i);
    expect(screen.queryByRole('navigation')).toBeNull();
  });
});

describe('admin editing reaches the customer app', () => {
  it('a product added in admin appears in the bazaar catalogue', async () => {
    seedSession('admin');
    const { user, unmount } = await renderAt('/admin/products/new');

    await screen.findAllByText(/প্রোডাক্ট|Product/i);
    fireEvent.change(await screen.findByPlaceholderText(/মিনিকেট চাল/), {
      target: { value: 'টেস্ট মশুর ডাল' },
    });
    fireEvent.change(await screen.findByPlaceholderText('Miniket Rice (Grade 1)'), {
      target: { value: 'Test Masoor Dal' },
    });
    fireEvent.change(await screen.findByPlaceholderText('75'), { target: { value: '95' } });
    await user.click(await screen.findByRole('button', { name: /প্রোডাক্ট সেভ করুন|Save product/ }));

    await waitFor(() => {
      const data = JSON.parse(localStorage.getItem('jovro_data_v5') || '{}');
      expect((data.products || []).some((p: { nameBn: string }) => p.nameBn === 'টেস্ট মশুর ডাল')).toBe(true);
    });
    unmount();

    seedSession('customer');
    await renderAt('/bazaar');
    await waitFor(() => expect(document.body.textContent).toContain('টেস্ট মশুর ডাল'));
  });

  it('uses the edited area fee on checkout', async () => {
    seedSession();
    const areas = JSON.parse(localStorage.getItem('jovro_data_v5') || '{}');
    localStorage.setItem(
      'jovro_data_v5',
      JSON.stringify({
        ...areas,
        areas: [{ id: 'area-01', nameBn: 'গোশালা বাজার', nameEn: 'Goshala Bazar', fee: 55, isActive: true }],
      }),
    );
    localStorage.setItem(
      'jovro_cart',
      JSON.stringify([
        { id: 'p-01', productId: 'p-01', nameBn: 'মিনিকেট চাল', nameEn: 'Miniket Rice', price: 70, quantity: 2, unit: 'কেজি', source: 'bazaar', isApproxPrice: true },
      ]),
    );

    await renderAt('/checkout');
    await waitFor(() => expect(document.body.textContent).toContain('৫৫'));
  });

  it('turning the service off surfaces the closed state', async () => {
    seedSession('admin');
    const { unmount } = await renderAt('/admin/settings');
    await screen.findAllByText(/বিজনেস|Business|সেটিংস|Settings/i);

    const master = await screen.findByRole('switch', { name: /মাস্টার সার্ভিস সুইচ/ });
    fireEvent.click(master);
    await waitFor(() => {
      const data = JSON.parse(localStorage.getItem('jovro_data_v5') || '{}');
      expect(data.isServiceOpen).toBe(false);
    });
    unmount();
  });

  it('shows the closed state on home when the service is off', async () => {
    seedSession();
    localStorage.setItem('jovro_data_v5', JSON.stringify({ isServiceOpen: false }));

    const { user } = await renderAt('/');
    const banners = await screen.findAllByText(/সার্ভিস বন্ধ|Service closed/i);
    expect(banners.length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: /বিস্তারিত/ }));
    await waitFor(() => expect(window.location.pathname).toBe('/closed'));
    expect(await screen.findAllByText(/সেবা এখন বন্ধ/)).not.toHaveLength(0);
  });
});
