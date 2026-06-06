import { useEffect, useMemo, useState } from 'react';
import nigerianStatesAndLgas from '@/data/nigerianStatesAndLgas.json';

export function useBountyFormLocation(formData, handleInputChange) {
  const [lgas, setLgas] = useState([]);

  const states = useMemo(
    () => nigerianStatesAndLgas.map((s) => s.state),
    []
  );

  const hasLgasForState = lgas.length > 0;

  useEffect(() => {
    if (formData.state) {
      const selected = nigerianStatesAndLgas.find((s) => s.state === formData.state);
      setLgas(selected?.lgas ?? []);
    } else {
      setLgas([]);
    }
  }, [formData.state]);

  const handleStateChange = (value) => {
    handleInputChange('state', value);
    handleInputChange('lga', '');
    const selected = nigerianStatesAndLgas.find((s) => s.state === value);
    setLgas(selected?.lgas ?? []);
  };

  return {
    states,
    lgas,
    hasLgasForState,
    handleStateChange,
  };
}
