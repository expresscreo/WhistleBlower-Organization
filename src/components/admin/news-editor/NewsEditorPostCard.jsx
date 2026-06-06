import { format } from 'date-fns';
import { Edit, Eye, Trash2, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import ResolvedStorageImage from '@/components/media/ResolvedStorageImage';
import MaximizableThumbnailOverlay, { maximizableThumbnailGroupClass } from '@/components/media/MaximizableThumbnailOverlay';
import {
  formatNewsCategoryLabel,
  getNewsCategoryBadgeClass,
  getNewsStatusBadgeClass,
} from '@/components/admin/news-editor/newsEditorDisplayUtils';

export default function NewsEditorPostCard({
  item,
  onEdit,
  onView,
  onDelete,
}) {
  return (
    <Card className="transition-shadow hover:shadow-lg">
      <CardHeader>
        <div className="flex-1">
          <CardTitle className="line-clamp-2 text-lg">{item.title}</CardTitle>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-muted-foreground">
            <CardDescription>{format(new Date(item.created_at), 'MMM dd, yyyy')}</CardDescription>
            <Badge className={`${getNewsCategoryBadgeClass(item.category)} rounded-none uppercase`}>
              {formatNewsCategoryLabel(item.category)}
            </Badge>
            <Badge className={`${getNewsStatusBadgeClass(item.status)} rounded-none uppercase`}>
              {item.status}
            </Badge>
            {item.category === 'bounty' && item.bounty_id && item.bounty_amount && (
              <span className="inline-flex items-center text-xs text-green-600">
                <CheckCircle className="mr-1 h-3 w-3" />
                ₦{Number(item.bounty_amount).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {item.featured_image && (
          <div className={`${maximizableThumbnailGroupClass} mb-4 rounded-lg`}>
            <ResolvedStorageImage
              path={item.featured_image}
              alt={item.title}
              className="h-32 w-full rounded-lg object-cover transition-transform duration-200 group-hover:scale-105"
            />
            <MaximizableThumbnailOverlay />
          </div>
        )}

        <div className="mb-4 line-clamp-3 text-sm text-muted-foreground">
          <div
            dangerouslySetInnerHTML={{
              __html: item.content?.replace(/<img[^>]*>/g, '[Image]') || '',
            }}
          />
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(item.id)} className="flex-1">
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
      </CardContent>
    </Card>
  );
}
