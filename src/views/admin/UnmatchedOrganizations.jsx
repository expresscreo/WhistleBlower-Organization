import React, { useState, useEffect, useCallback } from 'react';
import PageHead from '@/components/PageHead';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/customSupabaseClient';
import { FieldError, FieldSuccess, PageErrorBanner } from '@/components/ui/form-feedback';
import { Loader2, Link as LinkIcon } from 'lucide-react';
import NavbarLoader from '@/components/admin/NavbarLoader';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/admin/PageHeader';

const UnmatchedOrganizations = () => {
  const [unmatchedReports, setUnmatchedReports] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [fetchError, setFetchError] = useState('');
  const [matchFeedback, setMatchFeedback] = useState({ error: '', success: '' });

  const fetchUnmatchedReports = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    const { data, error } = await supabase
      .from('reports')
      .select('id, report_id, organization_name')
      .is('organization_id', null)
      .not('organization_name', 'is', null);
    
    if (error) {
      setFetchError(error.message);
    } else {
      setUnmatchedReports(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUnmatchedReports();
    const fetchOrgs = async () => {
      const { data } = await supabase.from('organizations').select('id, name');
      setOrganizations(data || []);
    };
    fetchOrgs();
  }, [fetchUnmatchedReports]);

  const handleMatchClick = (report) => {
    setSelectedReport(report);
    setSelectedOrgId('');
    setMatchFeedback({ error: '', success: '' });
    setIsModalOpen(true);
  };

  const handleConfirmMatch = async () => {
    setMatchFeedback({ error: '', success: '' });

    if (!selectedReport || !selectedOrgId) {
      setMatchFeedback({ error: 'Please select an organization to match.', success: '' });
      return;
    }

    const { error } = await supabase
      .from('reports')
      .update({ organization_id: selectedOrgId })
      .eq('id', selectedReport.id);

    if (error) {
      setMatchFeedback({ error: error.message, success: '' });
      return;
    }

    setMatchFeedback({ error: '', success: 'Organization matched successfully!' });
    fetchUnmatchedReports();
    setIsModalOpen(false);
    setSelectedReport(null);
    setSelectedOrgId('');
  };

  return (
    <>
      <PageHead title="Unmatched Organizations - WhistleBlower.ng" />
      <div className="space-y-8">
        <PageHeader 
          title="Unmatched Organizations"
          description="Match free-text organization names from reports to official organizations in the system."
        />

        <PageErrorBanner error={fetchError} title="Could not load reports" />
        
        {/* Organizations Table */}
        <Card>
          <CardContent>
            <div className="overflow-x-auto">
              {loading ? (
                <>
                  <NavbarLoader />
                  <div className="flex justify-center p-8">
                    {/* Loading indication is handled by NavbarLoader */}
                  </div>
                </>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Report ID</TableHead>
                      <TableHead>Submitted Name</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unmatchedReports.length > 0 ? (
                      unmatchedReports.map(report => (
                        <TableRow key={report.id}>
                          <TableCell>{report.report_id}</TableCell>
                          <TableCell className="font-medium">{report.organization_name}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={() => handleMatchClick(report)}>
                              <LinkIcon className="mr-2 h-4 w-4" /> Match
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow><TableCell colSpan="3" className="text-center text-muted-foreground">No unmatched organizations to review.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Match Organization</DialogTitle>
            <DialogDescription>
              Match the submitted name <span className="font-semibold">"{selectedReport?.organization_name}"</span> to an official organization.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="organization-select">Official Organization</Label>
            <Select onValueChange={setSelectedOrgId} value={selectedOrgId}>
                <SelectTrigger>
                    <SelectValue placeholder="Select an organization..." />
                </SelectTrigger>
                <SelectContent>
                    {organizations.map(org => (
                        <SelectItem key={org.id} value={org.id}>
                            {org.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <FieldError message={matchFeedback.error} className="mt-3" />
            <FieldSuccess message={matchFeedback.success} className="mt-3" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmMatch}>Confirm Match</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UnmatchedOrganizations;
