import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Link as LinkIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const UnmatchedOrganizations = () => {
  const [unmatchedReports, setUnmatchedReports] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const { toast } = useToast();

  const fetchUnmatchedReports = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reports')
      .select('id, report_id, organization_name')
      .is('organization_id', null)
      .not('organization_name', 'is', null);
    
    if (error) {
      toast({ variant: 'destructive', title: 'Error fetching reports', description: error.message });
    } else {
      setUnmatchedReports(data);
    }
    setLoading(false);
  }, [toast]);

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
    setIsModalOpen(true);
  };

  const handleConfirmMatch = async () => {
    if (!selectedReport || !selectedOrgId) {
      toast({ variant: 'destructive', title: 'Selection required', description: 'Please select an organization to match.' });
      return;
    }

    const { error } = await supabase
      .from('reports')
      .update({ organization_id: selectedOrgId })
      .eq('id', selectedReport.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Failed to match organization', description: error.message });
    } else {
      toast({ title: 'Organization matched successfully!' });
      fetchUnmatchedReports();
    }
    setIsModalOpen(false);
    setSelectedReport(null);
    setSelectedOrgId('');
  };

  return (
    <>
      <Helmet><title>Unmatched Organizations - WhistleBlower.ng</title></Helmet>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Unmatched Organizations</h1>
        <Card>
          <CardHeader>
            <CardTitle>Review Submitted Organization Names</CardTitle>
            <CardDescription>Match free-text organization names from reports to official organizations in the system.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report ID</TableHead>
                  <TableHead>Submitted Name</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan="3" className="text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></TableCell></TableRow>
                ) : unmatchedReports.length > 0 ? (
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