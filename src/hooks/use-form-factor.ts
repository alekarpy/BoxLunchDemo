import { useState, useEffect } from 'react';

export type FormFactor = 'Phone' | 'Tablet' | 'Desktop' | 'Unknown';

function getFormFactor(): FormFactor {
  if (typeof window === 'undefined') return 'Unknown';
  const width = window.innerWidth;
  if (width < 768) return 'Phone';
  if (width < 1024) return 'Tablet';
  return 'Desktop';
}

export const useFormFactor = () => {
  const [formFactor, setFormFactor] = useState<FormFactor>(getFormFactor);

  useEffect(() => {
    const handler = () => setFormFactor(getFormFactor());
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return { data: formFactor };
};

export const useIsTablet = () => {
  const { data: formFactor } = useFormFactor();
  return formFactor === 'Tablet';
};
