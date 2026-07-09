import React, { useEffect, useMemo, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export default function ReportOrganizationAssignment({
  organizations,
  currentOrganizationId,
  onUpdateOrganization,
  isUpdating = false,
}) {
  const [open, setOpen] = useState(false);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState(currentOrganizationId || '');

  const selectedOrganization = useMemo(
    () => organizations.find((organization) => organization.id === selectedOrganizationId),
    [organizations, selectedOrganizationId]
  );

  useEffect(() => {
    setSelectedOrganizationId(currentOrganizationId || '');
  }, [currentOrganizationId]);

  const hasChanged = selectedOrganizationId && selectedOrganizationId !== currentOrganizationId;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Organization</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
              disabled={isUpdating}
            >
              <span className="truncate">
                {selectedOrganization?.name || 'Select an organization...'}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
            <Command>
              <CommandInput placeholder="Search organization..." />
              <CommandList>
                <CommandEmpty>No organization found.</CommandEmpty>
                <CommandGroup>
                  {organizations.map((organization) => (
                    <CommandItem
                      key={organization.id}
                      value={organization.name}
                      onSelect={() => {
                        setSelectedOrganizationId(organization.id);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          selectedOrganizationId === organization.id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {organization.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Button
          type="button"
          className="w-full"
          loading={isUpdating}
          disabled={!hasChanged || isUpdating}
          onClick={() => onUpdateOrganization(selectedOrganizationId)}
        >
          Update organization
        </Button>
      </CardContent>
    </Card>
  );
}
