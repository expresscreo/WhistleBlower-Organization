import { format } from 'date-fns';
import { Edit, Eye, Trash2, CheckCircle, Newspaper } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ResolvedStorageImage from '@/components/media/ResolvedStorageImage';
import { htmlToPlainText } from '@/lib/utils';
import MaximizableThumbnailOverlay, { maximizableThumbnailGroupClass } from '@/components/media/MaximizableThumbnailOverlay';
import {
  formatNewsCategoryLabel,
  getNewsCategoryBadgeClass,
  getNewsStatusBadgeClass,
} from '@/components/admin/news-editor/newsEditorDisplayUtils';

export default function NewsEditorPostListRow({
  item,
  onEdit,
  onView,
  onDelete,
}) {
  const excerpt = htmlToPlainText(
    String(item.content || '').replace(/<img[^>]*>/gi, ' [Image] ')
  );

  return (
    <div className="flex flex-col gap-4 p-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted sm:h-24 sm:w-24">
          {item.featured_image ? (
            <div className={`${maximizableThumbnailGroupClass} h-full w-full`}>
              <ResolvedStorageImage
                path={item.featured_image}
                alt={item.title}
                className="h-full w-full object-cover"
              />
              <MaximizableThumbnailOverlay />
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <Newspaper className="h-6 w-6 text-muted-foreground/70" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-base font-semibold leading-snug">{item.title}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{format(new Date(item.created_at), 'MMM dd, yyyy')}</span>
            <Badge className={`${getNewsCategoryBadgeClass(item.category)} rounded-none uppercase`}>
              {formatNewsCategoryLabel(item.category)}
            </Badge>
            <Badge className={`${getNewsStatusBadgeClass(item.status)} rounded-none uppercase`}>
              {item.status}
            </Badge>
            {item.category === 'bounty' && item.bounty_id && item.bounty_amount && (
              <span className="inline-flex items-center text-green-600">
                <CheckCircle className="mr-1 h-3 w-3" />
                ₦{Number(item.bounty_amount).toLocaleString()}
              </span>
            )}
          </div>
          {excerpt && (
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{excerpt}</p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 gap-2 sm:flex-col sm:items-stretch lg:flex-row">
        <Button variant="outline" size="sm" onClick={() => onEdit(item.id)} className="flex-1 sm:flex-none">
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
        <Button variant="outline" size="sm" onClick={() => onView(item)}>
          <Eye className="h-4 w-4" />
        </Button>
        <Button variant="destructive" size="sm" onClick={() => onDelete(item.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
