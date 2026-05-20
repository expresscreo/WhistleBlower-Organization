import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileStack } from 'lucide-react';

const ReportCategorization = ({ formData, onInputChange, categories }) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><FileStack className="mr-2 h-6 w-6 text-primary"/>Report Details</CardTitle>
                <CardDescription>Provide a clear title and categorize the report.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="category">Report Category</Label>
                    <Select onValueChange={(value) => onInputChange('category', value)} value={formData.category}>
                        <SelectTrigger id="category"><SelectValue placeholder="Select a category" /></SelectTrigger>
                        <SelectContent>
                            {categories.map((cat, index) => (
                                <SelectItem key={index} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="title">Report Title</Label>
                    <Input id="title" placeholder="e.g., Suspicious financial transactions in Q3" value={formData.title} onChange={(e) => onInputChange('title', e.target.value)} required />
                </div>
            </CardContent>
        </Card>
    );
};

export default ReportCategorization;