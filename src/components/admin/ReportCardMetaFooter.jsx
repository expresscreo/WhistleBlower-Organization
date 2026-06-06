import { Building, Calendar, Paperclip, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const companyHighlightStyles = {
  red: {
    container: 'bg-red-500 text-white',
    icon: 'text-white',
    label: 'text-white/80',
    value: 'text-white',
  },
  green: {
    container: 'bg-green-500 text-white',
    icon: 'text-white',
    label: 'text-white/80',
    value: 'text-white',
  },
};

const ReportCardMetaFooter = ({
  company,
  companyLabel = 'Company',
  companyHighlight,
  urgency,
  incidentDate,
  attachmentCount = 0,
}) => {
  const highlight = companyHighlight ? companyHighlightStyles[companyHighlight] : null;

  const cellBase = 'flex items-center gap-2';

  return (
    <div className="grid grid-cols-2 text-xs border-t bg-muted/30 dark:bg-card">
      <div className={cn('pt-6 pb-4 pr-4', highlight ? 'pl-0' : 'pl-6')}>
        <div
          className={cn(
            cellBase,
            highlight ? cn('pl-6 pr-4 py-1.5 w-full', highlight.container) : 'w-full'
          )}
        >
          <Building className={cn('h-4 w-4 shrink-0', highlight ? highlight.icon : 'text-primary')} />
          <div>
            <p className={cn(highlight ? highlight.label : 'text-muted-foreground')}>{companyLabel}</p>
            <p className={cn('font-bold line-clamp-1', highlight ? highlight.value : undefined)}>
              {company || 'N/A'}
            </p>
          </div>
        </div>
      </div>
      <div className={cn(cellBase, 'pl-4 pr-6 pt-6 pb-4')}>
        <Zap className="h-4 w-4 text-primary shrink-0" />
        <div>
          <p className="text-muted-foreground">Urgency</p>
          <p className="font-bold capitalize">{urgency || 'N/A'}</p>
        </div>
      </div>
      <div className={cn(cellBase, 'pl-6 pr-4 pt-4 pb-6')}>
        <Calendar className="h-4 w-4 text-primary shrink-0" />
        <div>
          <p className="text-muted-foreground">Incident Date</p>
          <p className="font-bold">
            {incidentDate ? format(new Date(incidentDate), "do MMM'.' yyyy") : 'N/A'}
          </p>
        </div>
      </div>
      <div className={cn(cellBase, 'pl-4 pr-6 pt-4 pb-6')}>
        <Paperclip className="h-4 w-4 text-primary shrink-0" />
        <div>
          <p className="text-muted-foreground">Attachments</p>
          <p className="font-bold">{attachmentCount ?? 0}</p>
        </div>
      </div>
    </div>
  );
};

export default ReportCardMetaFooter;
