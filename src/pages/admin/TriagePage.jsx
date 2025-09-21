import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Check, X, ArrowRight, Building, ChevronsUpDown } from 'lucide-react';
import { format } from 'date-fns';
import PageContentWrapper from '@/components/admin/PageContentWrapper';
import { useAdminData } from '@/contexts/AdminDataContext';
import PageHeader from '@/components/admin/PageHeader';
import { cn } from '@/lib/utils';

const TriagePage = () => {
  const [unassignedReports, setUnassignedReports] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [currentReportIndex, setCurrentReportIndex] = useState(0);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { fetchTriageData, loading } = useAdminData();


  const loadTriageData = useCallback(async () => {
    try {
      // Get unassigned reports
      const triageData = await fetchTriageData();
      const unassigned = triageData.filter(report => 
        report.status === 'Under Review' && !report.organization_id
      );
      setUnassignedReports(unassigned);

      // Get organizations
      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('status', 'active');
      if (orgsError) throw orgsError;
      setOrganizations(orgsData);

    } catch (error) {
      console.error('Failed to load triage data:', error);
      toast({ variant: 'destructive', title: 'Failed to load data', description: error.message });
    }
  }, [fetchTriageData, toast]);

  useEffect(() => {
    loadTriageData();
  }, [loadTriageData]);

  const handleAssign = async () => {
    if (!selectedOrg) {
      toast({ variant: 'destructive', title: 'Please select an organization.' });
      return;
    }
    const report = unassignedReports[currentReportIndex];
    const { error } = await supabase
      .from('reports')
      .update({ organization_id: selectedOrg, status: 'Assigned' })
      .eq('id', report.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Failed to assign report', description: error.message });
    } else {
      toast({ title: `Report ${report.report_id} assigned successfully!` });
      handleNext();
    }
    setSelectedOrg('');
  };

  const handleDismiss = async () => {
    const report = unassignedReports[currentReportIndex];
    const { error } = await supabase
      .from('reports')
      .update({ status: 'Closed' })
      .eq('id', report.id);
    
    if (error) {
      toast({ variant: 'destructive', title: 'Failed to dismiss report', description: error.message });
    } else {
      toast({ title: `Report ${report.report_id} dismissed.` });
      handleNext();
    }
  };

  const handleNext = () => {
    if (currentReportIndex < unassignedReports.length - 1) {
      setCurrentReportIndex(currentReportIndex + 1);
    } else {
      toast({ title: "All reports triaged!" });
      fetchData();
      setCurrentReportIndex(0);
    }
  };

  const currentReport = unassignedReports[currentReportIndex];

  return (
    <>
      <Helmet><title>Triage Reports - WhistleBlower.ng</title></Helmet>
      <PageContentWrapper loading={loading.triage} loadingText="Loading reports for triage...">
        <div className="space-y-8">
          <PageHeader 
            title="Report Triage" 
            description="Assign unmatched reports to the appropriate organizations."
          />
          
          <div className="max-w-4xl mx-auto px-4 sm:px-0">
            {loading.triage ? <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div> :
             !currentReport ? <p className="text-center py-8">No unassigned reports to triage. Great job!</p> :
             (
               <div className="space-y-6">
                 <Card>
                   <CardHeader>
                     <CardTitle>{currentReport.title}</CardTitle>
                     <CardDescription>
                        ID: {currentReport.report_id} | Submitted: {format(new Date(currentReport.created_at), 'PPP')}
                     </CardDescription>
                     {currentReport.organization_name && (
                        <p className="text-sm text-primary pt-2">Submitted For: <span className="font-semibold">{currentReport.organization_name}</span></p>
                     )}
                   </CardHeader>
                   <CardContent>
                     <p className="whitespace-pre-wrap">{currentReport.description}</p>
                   </CardContent>
                 </Card>
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-end">
                   <div className="space-y-2">
                     <label className="text-sm font-medium flex items-center"><Building className="mr-2 h-4 w-4" />Assign to Organization</label>
                     <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={open}
                                className="w-full justify-between"
                            >
                                {selectedOrg
                                    ? organizations.find((org) => org.id === selectedOrg)?.name
                                    : "Select an organization..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                                <CommandInput placeholder="Search organization..." />
                                <CommandList>
                                  <CommandEmpty>No organization found.</CommandEmpty>
                                  <CommandGroup>
                                      {organizations.map((org) => (
                                          <CommandItem
                                              key={org.id}
                                              value={org.name}
                                              onSelect={() => {
                                                  setSelectedOrg(org.id);
                                                  setOpen(false);
                                              }}
                                          >
                                              <Check
                                                  className={cn(
                                                      "mr-2 h-4 w-4",
                                                      selectedOrg === org.id ? "opacity-100" : "opacity-0"
                                                  )}
                                              />
                                              {org.name}
                                          </CommandItem>
                                      ))}
                                  </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                   </div>
                   <Button onClick={handleAssign} disabled={!selectedOrg}><Check className="mr-2 h-4 w-4" />Assign Report</Button>
                 </div>
                 <div className="flex justify-between items-center pt-4 border-t">
                   <Button variant="destructive" onClick={handleDismiss}><X className="mr-2 h-4 w-4" />Dismiss Report</Button>
                   <Button variant="outline" onClick={handleNext}>Skip for now<ArrowRight className="ml-2 h-4 w-4" /></Button>
                 </div>
               </div>
             )
            }
          </div>
        </div>
      </PageContentWrapper>
    </>
  );
};

export default TriagePage;