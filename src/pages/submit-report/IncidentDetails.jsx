import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, List } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import nigerianStatesAndLgas from '@/data/nigerianStatesAndLgas.json';

const IncidentDetails = ({ formData, onInputChange, categories, isBountyReportMode }) => {
    const [lgas, setLgas] = useState([]);

    useEffect(() => {
        if (formData.state) {
            const selectedState = nigerianStatesAndLgas.find(s => s.state === formData.state);
            setLgas(selectedState ? selectedState.lgas : []);
        }
    }, [formData.state]);

    const handleStateChange = (value) => {
        onInputChange('state', value);
        const selectedState = nigerianStatesAndLgas.find(s => s.state === value);
        setLgas(selectedState ? selectedState.lgas : []);
        onInputChange('lga', '');
    };

    return (
        <div className="space-y-6 pt-6 border-t">
            <h3 className="text-lg font-semibold">Incident Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="category" className="flex items-center"><List className="mr-2 h-4 w-4" />Category</Label>
                    <Select value={formData.category} onValueChange={(v) => onInputChange('category', v)} required disabled={isBountyReportMode}>
                        <SelectTrigger id="category">
                            <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="incidentDate" className="flex items-center"><Calendar className="mr-2 h-4 w-4" />Date of Incident</Label>
                    <Input id="incidentDate" type="date" value={formData.incidentDate} onChange={(e) => onInputChange('incidentDate', e.target.value)} />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="state" className="flex items-center"><MapPin className="mr-2 h-4 w-4" />State</Label>
                    <Select value={formData.state} onValueChange={handleStateChange}>
                        <SelectTrigger id="state">
                            <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                            {nigerianStatesAndLgas.map(s => <SelectItem key={s.state} value={s.state}>{s.state}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="lga" className="flex items-center"><MapPin className="mr-2 h-4 w-4" />LGA</Label>
                    <Select value={formData.lga} onValueChange={(v) => onInputChange('lga', v)} disabled={!formData.state}>
                        <SelectTrigger id="lga">
                            <SelectValue placeholder="Select LGA" />
                        </SelectTrigger>
                        <SelectContent>
                            {lgas.map(lga => <SelectItem key={lga} value={lga}>{lga}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="incidentAddress" className="flex items-center"><MapPin className="mr-2 h-4 w-4" />Incident Address</Label>
                <Input id="incidentAddress" placeholder="e.g., 123 Main Street, Ikeja" value={formData.incidentAddress} onChange={(e) => onInputChange('incidentAddress', e.target.value)} />
            </div>
        </div>
    );
};

export default IncidentDetails;