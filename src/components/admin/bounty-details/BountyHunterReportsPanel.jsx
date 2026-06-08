'use client';

import { format, formatDistanceToNow } from 'date-fns';
import {
  ChevronRight,
  FileText,
  Inbox,
  Loader2,
  MapPin,
  Mic,
  Paperclip,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const REPORT_STATUS_STYLES = {
  Pending: 'bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300',
  'Under Review': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-300',
  Assigned: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300',
  'Under Investigation': 'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300',
  Investigation: 'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300',
  Closed: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

function getReportTimestamp(report) {
  return report.created_at || report.incident_date;
}

function HunterReportRow({ report, isSelected, onSelect }) {
  const attachmentCount = Array.isArray(report.evidence_path) ? report.evidence_path.length : 0;
  const timestamp = getReportTimestamp(report);
  const statusStyle =
    REPORT_STATUS_STYLES[report.status] ||
    'bg-muted text-muted-foreground';
  const location = [report.lga, report.state].filter(Boolean).join(', ');

  return (
    <button
      type="button"
      onClick={() => onSelect(report.id)}
      aria-current={isSelected ? 'true' : undefined}
      className={cn(
        'group relative w-full text-left rounded-lg border transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        isSelected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border/70 bg-card hover:border-primary/40 hover:bg-muted/30'
      )}
    >
      <span
        className={cn(
          'absolute left-0 top-3 bottom-3 w-1 rounded-r-full transition-colors',
          isSelected ? 'bg-primary' : 'bg-transparent group-hover:bg-primary/30'
        )}
        aria-hidden
      />
      <div className="flex items-start gap-3 p-4 pl-5">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
            isSelected ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
          )}
        >
          {report.is_voice_note ? (
            <Mic className="h-4 w-4" aria-hidden />
          ) : (
            <FileText className="h-4 w-4" aria-hidden />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-sm font-semibold tracking-tight">{report.report_id}</p>
            <span className={cn('rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide', statusStyle)}>
              {report.status || 'Pending'}
            </span>
          </div>

          <p className="text-sm font-medium leading-snug line-clamp-1">
            {report.title || 'Untitled submission'}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {report.description || 'No description provided.'}
          </p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {timestamp && (
              <span title={format(new Date(timestamp), 'PPpp')}>
                {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
              </span>
            )}
            {location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                {location}
              </span>
            )}
            {attachmentCount > 0 && (
              <span className="inline-flex items-center gap-1">
                <Paperclip className="h-3 w-3 shrink-0" aria-hidden />
                {attachmentCount} file{attachmentCount === 1 ? '' : 's'}
              </span>
            )}
          </div>
        </div>

        <ChevronRight
          className={cn(
            'h-5 w-5 shrink-0 mt-1 transition-transform',
            isSelected ? 'text-primary translate-x-0.5' : 'text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5'
          )}
          aria-hidden
        />
      </div>
    </button>
  );
}

export default function BountyHunterReportsPanel({
  reports = [],
  selectedReportId,
  onSelectReport,
  onClearSelection,
  loading = false,
  panelTitle = 'Hunter Submissions',
  panelDescriptionEmpty = 'Tips from bounty hunters will appear here once linked to this bounty.',
  panelDescriptionWithCount = (count) =>
    `${count} anonymous tip${count === 1 ? '' : 's'} submitted for this bounty. Select one to review details, evidence, and status.`,
  emptyStateTitle = 'No hunter reports yet',
  emptyStateDescription = 'When someone submits a tip against this bounty, it will show up here for review.',
  clearSelectionLabel = 'Back to bounty overview',
  listAriaLabel = 'Hunter submissions',
  headerToneClass = 'border-orange-200/70 bg-orange-50 dark:border-orange-900/50 dark:bg-orange-950/30',
  badgeToneClass = 'bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300',
}) {
  const count = reports.length;

  return (
    <Card className="overflow-hidden">
      <CardHeader className={cn('border-b pb-5', headerToneClass)}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Users className="h-5 w-5 text-primary" aria-hidden />
              {panelTitle}
              {count > 0 && (
                <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', badgeToneClass)}>
                  {count}
                </span>
              )}
            </CardTitle>
            <CardDescription>
              {count === 0 ? panelDescriptionEmpty : panelDescriptionWithCount(count)}
            </CardDescription>
          </div>

          {selectedReportId && onClearSelection && (
            <Button type="button" variant="outline" size="sm" onClick={onClearSelection} className="shrink-0">
              {clearSelectionLabel}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading submissions…
          </div>
        ) : count === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-12 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Inbox className="h-6 w-6 text-muted-foreground" aria-hidden />
            </div>
            <p className="text-sm font-medium">{emptyStateTitle}</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {emptyStateDescription}
            </p>
          </div>
        ) : (
          <div className="space-y-3" role="list" aria-label={listAriaLabel}>
            {reports.map((report) => (
              <div key={report.id} role="listitem">
                <HunterReportRow
                  report={report}
                  isSelected={selectedReportId === report.id}
                  onSelect={onSelectReport}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
