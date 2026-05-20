import { useEffect, useMemo, useState } from 'react';
import nigerianStatesAndLgas from '@/data/nigerianStatesAndLgas.json';

export function useReportFormLocation(formData, handleSelectChange) {
  const [lgas, setLgas] = useState([]);

  const states = useMemo(
    () => nigerianStatesAndLgas.map((s) => s.state),
    []
  );

  const hasLgasForState = lgas.length > 0;

  useEffect(() => {
    if (formData.stateOfIncident) {
      const selected = nigerianStatesAndLgas.find(
        (s) => s.state === formData.stateOfIncident
      );
      setLgas(selected?.lgas ?? []);
    } else {
      setLgas([]);
    }
  }, [formData.stateOfIncident]);

  useEffect(() => {
    if (formData.organization === null) {
      handleSelectChange('stateOfIncident', '');
      handleSelectChange('lga', '');
    }
  }, [formData.organization, handleSelectChange]);

  const handleStateChange = (value) => {
    handleSelectChange('stateOfIncident', value);
    handleSelectChange('lga', '');
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
