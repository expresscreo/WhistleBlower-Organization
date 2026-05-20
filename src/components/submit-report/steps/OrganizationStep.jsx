'use client';

import { useCallback, useEffect, useState } from 'react';
import AsyncSelect from 'react-select/async';
import { supabase } from '@/lib/customSupabaseClient';
import { reactSelectStyles } from '@/lib/reactSelectStyles';

export default function OrganizationStep({
  formData,
  onOrganizationChange,
  isOrganizationLocked,
}) {
  const [mounted, setMounted] = useState(false);
  const [menuPortalTarget, setMenuPortalTarget] = useState(null);

  useEffect(() => {
    setMounted(true);
    setMenuPortalTarget(document.body);
  }, []);

  const loadOptions = useCallback(async (inputValue) => {
    if (!inputValue || inputValue.length < 3) return [];
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name')
      .ilike('name', `%${inputValue}%`)
      .eq('status', 'active')
      .limit(8);
    if (error) return [];
    return (data || []).map((org) => ({ value: org.id, label: org.name }));
  }, []);

  if (!mounted) {
    return (
      <div
        className="h-12 w-full rounded-md bg-muted animate-pulse"
        aria-hidden
      />
    );
  }

  return (
    <div className="submit-report-org-field">
      <AsyncSelect
        instanceId="submit-report-org-select"
        inputId="companyName"
        aria-label="Organization name"
        placeholder="Type your organization's name..."
        isDisabled={isOrganizationLocked}
        value={formData.organization}
        onChange={(option) => onOrganizationChange(option)}
        loadOptions={loadOptions}
        defaultOptions={false}
        cacheOptions
        styles={reactSelectStyles}
        menuPortalTarget={menuPortalTarget}
        menuPosition="fixed"
        menuShouldScrollIntoView={false}
        closeMenuOnScroll={false}
        blurInputOnSelect
        noOptionsMessage={({ inputValue }) =>
          inputValue.length < 3
            ? 'Type at least 3 characters to search'
            : 'No organizations found'
        }
      />
    </div>
  );
}
