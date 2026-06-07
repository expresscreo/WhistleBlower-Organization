import { useEffect, useMemo, useState } from 'react';
import nigerianStatesAndLgas from '@/data/nigerianStatesAndLgas.json';
import { isNigeriaMostWantedCountry } from '@/lib/mostWantedUtils';

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

  const handleCountryChange = (value) => {
    const nextIsNigeria = isNigeriaMostWantedCountry(value);
    onChange({
      ...details,
      crime_country: value,
      crime_state: nextIsNigeria ? details.crime_state : '',
      crime_lga: nextIsNigeria ? details.crime_lga : '',
    });
    if (!nextIsNigeria) {
      setLgas([]);
    }
  };

  return {
    states,
    lgas,
    hasLgasForState,
    handleStateChange,
    handleCountryChange,
    isNigeria: isNigeriaMostWantedCountry(details.crime_country),
  };
}
