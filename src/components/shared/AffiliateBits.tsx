import { useApp } from '../../context/AppContext';
import type { Affiliate } from '../../types';

/**
 * The affiliate record backing the signed-in affiliate: matched
 * by userId, then by the demo affiliate id, then any active one.
 */
export function useCurrentAffiliate(): Affiliate | undefined {
  const { state } = useApp();
  return (
    state.affiliates.find(a => a.userId === state.user?.id) ??
    state.affiliates.find(a => a.id === 'aff-01') ??
    state.affiliates.find(a => a.status === 'active')
  );
}
