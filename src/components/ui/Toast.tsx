import { useEffect } from 'react';
import { useFamilyStore } from '../../store/useFamilyStore';

export default function Toast() {
  const pendingToasts = useFamilyStore(s => s.pendingToasts);
  const shiftToast    = useFamilyStore(s => s.shiftToast);
  const current       = pendingToasts[0] ?? null;

  useEffect(() => {
    if (!current) return;
    const t = setTimeout(() => shiftToast(), 2800);
    return () => clearTimeout(t);
  }, [current, shiftToast]);

  return (
    <div className={`toast ${current ? 'show' : ''}`}>
      {current}
    </div>
  );
}
