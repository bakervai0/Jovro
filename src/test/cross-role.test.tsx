import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

function seedSession(role: 'customer' | 'rider' | 'admin') {
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

describe('delivery tracking loop', () => {
  it('rider tracking updates mirror onto the customer timeline', async () => {
    const ORDER_ID = 'JV-240001';
    seedSession('rider');
    const { user, unmount } = await renderAt(`/rider/orders/${ORDER_ID}`);

    const before = JSON.parse(localStorage.getItem('jovro_data_v5') || '{"orders":[]}');

    const send = await screen.findAllByRole('button', { name: /এই আপডেট কাস্টমারকে পাঠান/ });
    await user.click(send[0]);

    let sentMessage = '';
    await waitFor(() => {
      const data = JSON.parse(localStorage.getItem('jovro_data_v5') || '{}');
      const order = (data.orders || []).find((o: { id: string }) => o.id === ORDER_ID);
      expect(order).toBeTruthy();
      const count = order.trackingUpdates.length;
      const oldCount =
        (before.orders || []).find((o: { id: string }) => o.id === ORDER_ID)?.trackingUpdates.length ?? 0;
      expect(count).toBeGreaterThan(oldCount);
      sentMessage = order.trackingUpdates[order.trackingUpdates.length - 1].messageBn;
    });
    unmount();

    seedSession('customer');
    await renderAt(`/orders/${ORDER_ID}`);
    await waitFor(() => expect(document.body.textContent).toContain(sentMessage));
  });
});

describe('customer account data', () => {
  it('favouriting a product persists to localStorage', async () => {
    seedSession('customer');
    const { user, unmount } = await renderAt('/product/p-01');
    await screen.findAllByText(/চাল|Rice/);

    const fav = await screen.findByRole('button', { name: /পছন্দ|favourite|favorite/i });
    await user.click(fav);

    await waitFor(() => {
      const favs = JSON.parse(localStorage.getItem('jovro_favs') || '[]');
      expect(favs).toContain('p-01');
    });
    unmount();
  });

  it('saving a new address keeps it in the persisted state', async () => {
    seedSession('customer');
    const { user } = await renderAt('/addresses/new');
    await screen.findAllByText(/ঠিকানা|Address/i);

    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    expect(textarea).toBeTruthy();
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
    setter?.call(textarea, 'বাসা ৭, রোড ২, চৌধুরীপাড়া, গোশালা বাজারের পাশে');
    textarea.dispatchEvent(new window.Event('input', { bubbles: true }));

    const save = screen
      .getAllByRole('button')
      .find(b => /ঠিকানা সেভ করুন|Save address/.test(b.textContent || ''));
    expect(save).toBeTruthy();
    await user.click(save!);

    await waitFor(() => {
      const data = JSON.parse(localStorage.getItem('jovro_data_v5') || '{}');
      expect(
        (data.addresses || []).some((a: { fullAddress: string }) =>
          a.fullAddress.includes('বাসা ৭'),
        ),
      ).toBe(true);
    });
  });
});
