import React, { useState, useEffect, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Building } from 'lucide-react';

const FormLabel = ({ id, children, required = false }) => (
    <Label htmlFor={id} className="flex items-center">
        {children}
        {required && <span className="text-primary ml-1">*</span>}
    </Label>
);

const OrganizationSearch = ({ organizationName, onOrganizationChange, isOrgFromUrl }) => {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState(organizationName || "");
    const [suggestions, setSuggestions] = useState([]);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        setSearchTerm(organizationName);
    }, [organizationName]);

    const fetchSuggestions = useCallback(async (term) => {
        if (term.length < 3 || isOrgFromUrl) {
            setSuggestions([]);
            return;
        }
        const { data, error } = await supabase
            .from('organizations')
            .select('id, name')
            .ilike('name', `%${term}%`)
            .eq('status', 'active')
            .limit(5);

        if (error) {
            toast({ title: "Error", description: "Could not fetch organization suggestions.", variant: "destructive" });
        } else {
            setSuggestions(data);
        }
    }, [toast, isOrgFromUrl]);

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchSuggestions(searchTerm);
        }, 300);
        return () => clearTimeout(debounce);
    }, [searchTerm, fetchSuggestions]);

    const handleSelect = (org) => {
        setSearchTerm(org.name);
        onOrganizationChange('organizationName', org.name);
        onOrganizationChange('organizationId', org.id);
        setSuggestions([]);
    };

    const handleChange = (e) => {
        if (isOrgFromUrl) return;
        const { value } = e.target;
        setSearchTerm(value);
        onOrganizationChange('organizationName', value);
        onOrganizationChange('organizationId', null);
    };

    return (
        <div className="space-y-2 relative">
            <FormLabel id="organization" required><Building className="mr-2 h-4 w-4" />Organization Name</FormLabel>
            <Input
                id="organization"
                placeholder="Type the Agency or Organization name here"
                value={searchTerm}
                onChange={handleChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 150)}
                autoComplete="off"
                required
                disabled={isOrgFromUrl}
                className={isOrgFromUrl ? 'bg-muted cursor-not-allowed' : ''}
            />
            {isFocused && suggestions.length > 0 && !isOrgFromUrl && (
                <div className="absolute z-10 w-full bg-card border shadow-lg mt-1 max-h-60 overflow-y-auto">
                    {suggestions.map(org => (
                        <div
                            key={org.id}
                            className="p-2 hover:bg-accent cursor-pointer"
                            onMouseDown={() => handleSelect(org)}
                        >
                            {org.name}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OrganizationSearch;