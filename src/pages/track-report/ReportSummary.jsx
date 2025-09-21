import React from 'react';
import { Button } from '@/components/ui/button';
import { Paperclip, Clock, Edit, LogOut } from 'lucide-react';
import AttachmentPreview from './AttachmentPreview';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

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

    const evidencePaths = Array.isArray(report.evidence_path) ? report.evidence_path : [];

    return (
        <div className="bg-card p-6 md:p-8 border">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                <h2 className="text-xl sm:text-2xl font-bold">Report Summary</h2>
                <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={onUpdateReport} className="flex-1 sm:flex-initial">
                        <Edit className="mr-2 h-4 w-4" />
                        <span className="hidden xs:inline">Update Report</span>
                        <span className="xs:hidden">Update</span>
                    </Button>
                    <Button 
                        onClick={onLogout}
                        className="bg-red-500 text-white hover:bg-red-600 border-red-500 hover:border-red-600 flex-1 sm:flex-initial"
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </Button>
                </div>
            </div>
            
            <div className="mb-6">
                <div className="flex justify-between items-center mb-1">
                    <p className="font-semibold">{report.status}</p>
                    <p className="text-sm text-muted-foreground">{currentStatus.progress}% Complete</p>
                </div>
                <Progress value={currentStatus.progress} indicatorClassName={currentStatus.color} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-6">
                <div><p className="text-sm text-muted-foreground">ID</p><p className="font-semibold">{report.report_id}</p></div>
                <div><p className="text-sm text-muted-foreground">Category</p><p className="font-semibold">{report.category}</p></div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center"><Clock className="h-3 w-3 mr-1.5"/>Submitted</p>
                  <p className="font-semibold">{format(new Date(report.created_at), 'PPP')}</p>
                </div>
                <div><p className="text-sm text-muted-foreground">Urgency</p><p className="font-semibold">{report.urgency || 'Not specified'}</p></div>

            </div>

            <div className="border-t pt-6">
                <h3 className="font-semibold text-xl mb-2">{report.title}</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{report.description}</p>
            </div>
            
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