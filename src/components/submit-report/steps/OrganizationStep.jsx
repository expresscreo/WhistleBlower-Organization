'use client';

import { useCallback, useEffect, useState } from 'react';
import AsyncCreatableSelect from 'react-select/async-creatable';
import { supabase } from '@/lib/customSupabaseClient';
import { reactSelectStyles } from '@/lib/reactSelectStyles';
import { FieldError } from '@/components/ui/form-feedback';

const UNMATCHED_VALUE = '__unmatched__';

export function buildUnmatchedOrganization(label) {
  const trimmed = label.trim();
  return {
    value: UNMATCHED_VALUE,
    label: trimmed,
    isUnmatched: true,
  };
}

export function buildMatchedOrganization(id, name) {
  return {
    value: id,
    label: name,
    isUnmatched: false,
  };
}

export default function OrganizationStep({
  formData,
  onOrganizationChange,
  isOrganizationLocked,
  fieldError = '',
}) {
  const [mounted, setMounted] = useState(false);
  const [menuPortalTarget, setMenuPortalTarget] = useState(null);

  useEffect(() => {
    setMounted(true);
    setMenuPortalTarget(document.body);
  }, []);

  const loadOptions = useCallback(async (inputValue) => {
    if (!inputValue || inputValue.trim().length < 3) return [];
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name')
      .ilike('name', `%${inputValue.trim()}%`)
      .eq('status', 'active')
      .limit(8);
    if (error) return [];
    return (data || []).map((org) => buildMatchedOrganization(org.id, org.name));
  }, []);

  const handleChange = (option) => {
    if (!option) {
      onOrganizationChange(null);
      return;
    }
    if (option.isUnmatched) {
      onOrganizationChange(option);
      return;
    }
    onOrganizationChange(buildMatchedOrganization(option.value, option.label));
  };

  const handleCreate = (inputValue) => {
    const trimmed = inputValue.trim();
    if (trimmed.length < 3) return;
    onOrganizationChange(buildUnmatchedOrganization(trimmed));
  };

  if (!mounted) {
    return (
      <div
        className="h-12 w-full rounded-md bg-muted animate-pulse"
        aria-hidden
      />
    );
  }

  return (
    <div className="submit-report-org-field space-y-2">
      <AsyncCreatableSelect
        instanceId="submit-report-org-select"
        inputId="companyName"
        aria-label="Organization name"
        placeholder="Type your organization's name..."
        isDisabled={isOrganizationLocked}
        value={formData.organization}
        onChange={handleChange}
        onCreateOption={handleCreate}
        loadOptions={loadOptions}
        defaultOptions={false}
        cacheOptions
        styles={reactSelectStyles}
        menuPortalTarget={menuPortalTarget}
        menuPosition="fixed"
        menuPlacement="bottom"
        menuShouldScrollIntoView={false}
        closeMenuOnScroll={false}
        blurInputOnSelect
        isClearable={!isOrganizationLocked}
        formatCreateLabel={(inputValue) =>
          `Use "${inputValue.trim()}" (not in our list yet)`
        }
        isValidNewOption={(inputValue, _selectValue, options) => {
          const trimmed = inputValue.trim();
          if (trimmed.length < 3) return false;
          const lower = trimmed.toLowerCase();
          return !options.some(
            (opt) => opt.label?.trim().toLowerCase() === lower
          );
        }}
        noOptionsMessage={({ inputValue }) =>
          inputValue.trim().length < 3
            ? 'Type at least 3 characters to search'
            : 'No matches — press Enter or choose the option below to continue'
        }
      />
      <FieldError message={fieldError} />
      <p className="text-xs text-muted-foreground leading-relaxed">
        Type at least 3 characters to see Organizations in our database. If the
        Organization isn&apos;t listed, tap the (+) button.
      </p>
    </div>
  );
}
