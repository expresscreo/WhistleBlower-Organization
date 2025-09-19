import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Building, List, AlertTriangle, MapPin, Clock, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import AttachmentItem from './AttachmentItem';

const ReportInfoCards = ({ report, status, onStatusUpdate, files, onFileDownload, isAdmin }) => {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader><CardTitle className="text-2xl">Report Info</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center"><User className="mr-2 h-4 w-4 text-primary" />Reporter: <span className="font-semibold ml-1">
              {report.is_anonymous ? 'Anonymous' : (isAdmin ? report.contact_email || report.contact_phone : 'Identified')}
          </span></div>
          <div className="flex items-center"><Building className="mr-2 h-4 w-4 text-primary" />Organization: <span className="font-semibold ml-1">{report.organizations?.name || report.organization_name}</span></div>
          <div className="flex items-center"><List className="mr-2 h-4 w-4 text-primary" />Category: <span className="font-semibold ml-1">{report.category}</span></div>
          <div className="flex items-center"><AlertTriangle className="mr-2 h-4 w-4 text-primary" />Urgency: <span className="font-semibold ml-1">{report.urgency}</span></div>
          <div className="flex items-center"><MapPin className="mr-2 h-4 w-4 text-primary" />Location: <span className="font-semibold ml-1">{report.lga}, {report.state}</span></div>
          <div className="flex items-center"><Clock className="mr-2 h-4 w-4 text-primary" />Incident Date: <span className="font-semibold ml-1">{format(new Date(report.incident_date), 'PPP')}</span></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-2xl">Update Status</CardTitle></CardHeader>
        <CardContent>
          <Select value={status} onValueChange={onStatusUpdate}>
            <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Under Review">Under Review</SelectItem>
              <SelectItem value="Assigned">Assigned</SelectItem>
              <SelectItem value="Investigation">Investigation</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader><CardTitle className="flex items-center text-2xl"><Paperclip className="mr-2 text-primary"/>Attachments</CardTitle></CardHeader>
        <CardContent>
           {files && files.length > 0 ? (
            <div className="space-y-2">
              {files.map((file, index) => (
                <AttachmentItem key={index} file={file} onDownload={onFileDownload} />
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground">No attachments.</p>}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportInfoCards;