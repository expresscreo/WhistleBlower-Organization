import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import React, { useState, useEffect, useCallback } from 'react';
import PageHead from '@/components/PageHead';
import { supabase } from '@/lib/customSupabaseClient';
import { useAdminData } from '@/contexts/AdminDataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Pencil, Volume2 } from 'lucide-react';
import NavbarLoader from '@/components/admin/NavbarLoader';
import ReportInfoCard from '@/components/admin/report-details/ReportInfoCard';
import ReportAttachmentsCard from '@/components/admin/report-details/ReportAttachmentsCard';
import ReportStatusCard from '@/components/admin/report-details/ReportStatusCard';
import BountyHunterReportsPanel from '@/components/admin/bounty-details/BountyHunterReportsPanel';
import FormattedReportDescription from '@/components/report/FormattedReportDescription';
import EvidenceThumbnailGallery from '@/components/media/EvidenceThumbnailGallery';
import { isImagePath } from '@/lib/mediaUtils';
import {
  fetchSightingReportsForAlert,
} from '@/lib/mostWantedStatus';
import {
  getCaseFactsList,
  getPhysicalDescriptionList,
  normalizeMostWantedDetails,
} from '@/lib/mostWantedUtils';

const MostWantedDetails = () => {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { invalidateCache } = useAdminData();
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [sightingReportCount, setSightingReportCount] = useState(0);
  const [sightingReports, setSightingReports] = useState([]);
  const [loadingSightingReports, setLoadingSightingReports] = useState(false);

  const refreshSightingSubmissions = useCallback(async (newsId) => {
    setLoadingSightingReports(true);
    try {
      const reports = await fetchSightingReportsForAlert(supabase, newsId);
      setSightingReportCount(reports.length);
      setSightingReports(reports);
    } catch (error) {
      const message = [error?.message, error?.details, error?.hint].filter(Boolean).join(' ');
      console.error('Failed to load sighting submissions:', message || error);
    } finally {
      setLoadingSightingReports(false);
    }
  }, []);

  const fetchAlert = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .eq('id', id)
      .eq('category', 'most_wanted')
      .maybeSingle();

    if (error || !data) {
      router.push('/admin/most-wanted');
      setLoading(false);
      return;
    }

    setAlert(data);
    await refreshSightingSubmissions(data.id);
    setLoading(false);
  }, [id, router, refreshSightingSubmissions]);

  useEffect(() => {
    fetchAlert();
  }, [fetchAlert]);

  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`most-wanted-sighting-submissions-${id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'most_wanted_reports', filter: `news_id=eq.${id}` },
        () => refreshSightingSubmissions(id)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, refreshSightingSubmissions]);

  useEffect(() => {
    const reportId = searchParams.get('reportId');
    if (!reportId) {
      setSelectedReport(null);
      return;
    }

    const fetchReport = async () => {
      setLoadingReport(true);
      const { data, error } = await supabase
        .from('reports')
        .select('*, organizations(name)')
        .eq('id', reportId)
        .maybeSingle();

      if (error) {
        setSelectedReport(null);
      } else {
        setSelectedReport(data || null);
      }
      setLoadingReport(false);
    };

    fetchReport();
  }, [searchParams]);

  const handleReportStatusUpdate = async (status) => {
    if (!selectedReport) return;
    const { error } = await supabase.from('reports').update({ status }).eq('id', selectedReport.id);
    if (error) {
      console.error('Failed to update report status:', error);
      return;
    }
    setSelectedReport((prev) => ({ ...prev, status }));
    setSightingReports((prev) =>
      prev.map((report) => (report.id === selectedReport.id ? { ...report, status } : report))
    );
    invalidateCache('mostWanted');
  };

  const handleSelectSightingReport = (reportUuid) => {
    router.push(`/admin/most-wanted/${id}?reportId=${reportUuid}`);
  };

  const handleClearSightingReportSelection = () => {
    router.push(`/admin/most-wanted/${id}`);
  };

  if (loading) {
    return (
      <>
        <PageHead title="Loading Most Wanted Details — WhistleBlower.ng" />
        <NavbarLoader />
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Most Wanted Details</h1>
          </div>
        </div>
      </>
    );
  }

  if (!alert) return null;

  const details = normalizeMostWantedDetails(alert.most_wanted_details);
  const caseFacts = getCaseFactsList(details);
  const physicalDescription = getPhysicalDescriptionList(details);
  const evidencePaths = Array.isArray(alert.published_evidence) ? alert.published_evidence : [];
  const hasAlertImages = evidencePaths.some(isImagePath);

  const alertAsReport = {
    ...alert,
    report_id: details.case_reference || alert.id,
    incident_date: alert.created_at,
    category: details.crime_type || 'Most Wanted',
    lga: details.crime_lga,
    state: details.crime_state,
    incident_address: details.crime_address,
    organizations: { name: 'Most Wanted Alert' },
  };

  return (
    <>
      <PageHead title={`Most Wanted - ${details.case_reference || alert.title}`} />
      <div className="space-y-8">
        <Link
          href="/admin/most-wanted"
          className="flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Most Wanted
        </Link>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Most Wanted Details</h1>
            <p className="text-muted-foreground mt-1">
              {selectedReport ? (
                <>
                  Reviewing sighting tip{' '}
                  <span className="font-mono font-medium text-foreground">{selectedReport.report_id}</span>
                  {' · '}
                  <span className="font-mono">{details.case_reference}</span>
                </>
              ) : (
                <>
                  Case reference ·{' '}
                  <span className="font-mono font-medium text-foreground">
                    {details.case_reference || 'Pending'}
                  </span>
                </>
              )}
            </p>
          </div>
          <Button asChild className="uppercase">
            <Link href={`/admin/news-editor/edit/${alert.id}`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit in News Editor
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">
                  {selectedReport ? selectedReport.title || 'Sighting tip' : alert.title}
                </CardTitle>
                {!selectedReport && (
                  <p className="text-sm text-muted-foreground pt-1">
                    Alert status: <span className="font-medium capitalize">{alert.status}</span>
                    {sightingReportCount > 0 && (
                      <>
                        {' '}
                        · {sightingReportCount} linked sighting tip
                        {sightingReportCount === 1 ? '' : 's'}
                      </>
                    )}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                {selectedReport ? (
                  <FormattedReportDescription text={selectedReport.description} />
                ) : (
                  <div className="space-y-6">
                    {details.summary && (
                      <p className="whitespace-pre-wrap leading-relaxed">{details.summary}</p>
                    )}
                    {details.full_details && (
                      <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
                        {details.full_details}
                      </p>
                    )}
                    {caseFacts.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                          Case Facts
                        </h3>
                        <dl className="grid gap-2 text-sm sm:grid-cols-2">
                          {caseFacts.map(({ label, value }) => (
                            <div key={label}>
                              <dt className="text-muted-foreground">{label}</dt>
                              <dd className="font-medium">{value}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    )}
                    {physicalDescription.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                          Physical Description
                        </h3>
                        <dl className="grid gap-2 text-sm sm:grid-cols-2">
                          {physicalDescription.map(({ label, value }) => (
                            <div key={label}>
                              <dt className="text-muted-foreground">{label}</dt>
                              <dd className="font-medium">{value}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <BountyHunterReportsPanel
              reports={sightingReports}
              selectedReportId={selectedReport?.id ?? null}
              onSelectReport={handleSelectSightingReport}
              onClearSelection={selectedReport ? handleClearSightingReportSelection : undefined}
              loading={loadingSightingReports}
              panelTitle="Sighting Tips"
              panelDescriptionEmpty="Sighting tips will appear here once linked to this Most Wanted alert."
              panelDescriptionWithCount={(count) =>
                `${count} sighting tip${count === 1 ? '' : 's'} submitted for this alert. Select one to review details, evidence, and status.`
              }
              emptyStateTitle="No sighting tips yet"
              emptyStateDescription="When someone submits a tip against this alert, it will show up here for review."
              clearSelectionLabel="Back to alert overview"
              listAriaLabel="Sighting tips"
              headerToneClass="border-red-200/70 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30"
              badgeToneClass="bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300"
            />
          </div>

          <div className="space-y-8">
            {loadingReport ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Loading report…
              </div>
            ) : (
              <>
                <ReportInfoCard report={selectedReport || alertAsReport} />
                {selectedReport ? (
                  <ReportStatusCard
                    status={selectedReport.status}
                    onStatusUpdate={handleReportStatusUpdate}
                  />
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Alert Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm capitalize">
                        <span className="font-semibold">{alert.status}</span>
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Publish or update this alert from the News Editor.
                      </p>
                    </CardContent>
                  </Card>
                )}
                {!selectedReport && hasAlertImages && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Alert Media</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <EvidenceThumbnailGallery
                        paths={evidencePaths}
                        title=""
                        showOtherAttachments={false}
                      />
                    </CardContent>
                  </Card>
                )}
                <ReportAttachmentsCard
                  evidencePath={
                    (selectedReport && selectedReport.evidence_path) || evidencePaths
                  }
                  isVoiceNote={selectedReport ? !!selectedReport.is_voice_note : false}
                  hideVoiceNote={selectedReport && selectedReport.is_voice_note}
                />
                {selectedReport?.is_voice_note && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-lg">
                        <Volume2 className="mr-2 h-5 w-5" />
                        Voice Note Tip
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Play the voice note from the attachments card above.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default MostWantedDetails;
