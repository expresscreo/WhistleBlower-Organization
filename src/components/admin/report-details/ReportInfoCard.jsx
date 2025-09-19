import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, List, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';

const InfoItem = ({ icon: Icon, label, value }) => (
    <div className="flex items-start">
        <Icon className="mr-3 h-4 w-4 text-primary mt-1 flex-shrink-0" />
        <div className="flex-grow">
            {label}: <span className="font-semibold ml-1">{value || 'N/A'}</span>
        </div>
    </div>
);

const ReportInfoCard = ({ report }) => {
    return (
        <Card>
            <CardHeader><CardTitle className="text-2xl">Report Info</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
                <InfoItem icon={Building} label="Organization" value={report.organizations?.name || report.organization_name} />
                <InfoItem icon={List} label="Category" value={report.category} />
                <InfoItem icon={MapPin} label="Location" value={`${report.lga}, ${report.state}`} />
                {report.incident_address && <InfoItem icon={MapPin} label="Address" value={report.incident_address} />}
                <InfoItem icon={Clock} label="Incident Date" value={report.incident_date ? format(new Date(report.incident_date), 'PPP') : 'N/A'} />
            </CardContent>
        </Card>
    );
};

export default ReportInfoCard;