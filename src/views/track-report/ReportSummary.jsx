import React from 'react';
import { Button } from '@/components/ui/button';
import { Paperclip, Clock, Edit, LogOut } from 'lucide-react';
import AttachmentPreview from './AttachmentPreview';
import { format } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import FormattedReportDescription from '@/components/report/FormattedReportDescription';

const ReportSummary = ({ report, onUpdateReport, onLogout }) => {
    const statusConfig = {
        'Pending': { progress: 5, color: 'bg-orange-400' },
        'Under Review': { progress: 20, color: 'bg-yellow-400' },
        'Assigned': { progress: 40, color: 'bg-blue-400' },
        'Under Investigation': { progress: 70, color: 'bg-purple-400' },
        'Resolved': { progress: 100, color: 'bg-green-500' },
        'Rejected': { progress: 100, color: 'bg-red-400' },
    };
    
    const currentStatus = statusConfig[report.status] || { progress: 0, color: 'bg-gray-400' };

    const evidencePaths = Array.isArray(report.evidence_path) ? report.evidence_path : 
                          Array.isArray(report.evidence) ? report.evidence : [];

    return (
        <div className="bg-card p-6 md:p-8 border">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                <h2 className="text-lg sm:text-xl font-bold">REPORT ID — {report.report_id}</h2>
                <div className="flex flex-row items-center gap-2 w-full sm:w-auto">
                    <Button
                        variant="default"
                        onClick={onUpdateReport}
                        className="flex h-10 flex-1 min-w-0 items-center justify-center gap-2 px-4 sm:px-6 sm:flex-initial sm:border sm:border-input sm:bg-background sm:text-foreground sm:hover:bg-accent sm:hover:text-accent-foreground"
                    >
                        <Edit className="h-4 w-4 shrink-0" />
                        <span className="truncate">Update Report</span>
                    </Button>
                    <Button
                        onClick={onLogout}
                        aria-label="Logout"
                        className="flex h-9 w-9 shrink-0 items-center justify-center p-0 bg-red-500 text-white hover:bg-red-600 sm:h-10 sm:w-auto sm:px-6"
                    >
                        <LogOut className="h-4 w-4" />
                        <span className="hidden sm:inline">Logout</span>
                    </Button>
                </div>
            </div>
            
            {/* Report Status Bar */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-1">
                    <p className="font-semibold">{report.status}</p>
                    <p className="text-sm text-muted-foreground">{currentStatus.progress}% Complete</p>
                </div>
                <Progress value={currentStatus.progress} indicatorClassName={currentStatus.color} />
            </div>
            
            {/* Report Title */}
            <div className="border-t pt-6 border-b pb-6">
                <h3 className="text-xl sm:text-2xl font-bold mb-4">{report.title}</h3>
                <div className="text-muted-foreground">
                  <FormattedReportDescription text={report.description} />
                </div>
            </div>
            
            {/* Report Info */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-6">
                <div><p className="text-sm text-muted-foreground">Category</p><p className="font-semibold">{report.category}</p></div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center"><Clock className="h-3 w-3 mr-1.5"/>Submitted</p>
                  <p className="font-semibold">{format(new Date(report.created_at), 'PPP')}</p>
                </div>
                <div><p className="text-sm text-muted-foreground">Location</p><p className="font-semibold">{report.location || 'Not specified'}</p></div>
                {report.address && (
                    <div className="md:col-span-2"><p className="text-sm text-muted-foreground">Address</p><p className="font-semibold break-words">{report.address}</p></div>
                )}
            </div>
            
            {/* Attachments */}
            <div className="mt-6 border-t pt-6">
                <h3 className="font-semibold text-xl mb-4 flex items-center"><Paperclip className="mr-2 h-5 w-5"/>Attachments</h3>
                {evidencePaths && evidencePaths.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {evidencePaths.map((path, index) => <AttachmentPreview key={index} path={path} />)}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">No attachments for this report.</p>
                )}
            </div>
        </div>
    );
};

export default ReportSummary;