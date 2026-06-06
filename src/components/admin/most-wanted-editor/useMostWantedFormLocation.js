import { useEffect, useMemo, useState } from 'react';
import nigerianStatesAndLgas from '@/data/nigerianStatesAndLgas.json';

export function useMostWantedFormLocation(details, onChange) {
  const [lgas, setLgas] = useState([]);

  const states = useMemo(
    () => nigerianStatesAndLgas.map((s) => s.state),
    []
  );

  const hasLgasForState = lgas.length > 0;

  useEffect(() => {
    if (details.crime_state) {
      const selected = nigerianStatesAndLgas.find((s) => s.state === details.crime_state);
      setLgas(selected?.lgas ?? []);
    } else {
      setLgas([]);
    }
  }, [details.crime_state]);

  const handleStateChange = (value) => {
    onChange({
      ...details,
      crime_state: value,
      crime_lga: '',
    });
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
