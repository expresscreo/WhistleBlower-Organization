import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PageHead from '@/components/PageHead';
import PageHeader from '@/components/admin/PageHeader';
import NewsEditorPostCard from '@/components/admin/news-editor/NewsEditorPostCard';
import NewsEditorPostListRow from '@/components/admin/news-editor/NewsEditorPostListRow';
import { supabase } from '@/lib/customSupabaseClient';
import { FieldError, PageErrorBanner } from '@/components/ui/form-feedback';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, ChevronDown, LayoutGrid, List, Newspaper } from 'lucide-react';
import NavbarLoader from '@/components/admin/NavbarLoader';
import { slugify, cn } from '@/lib/utils';

const VIEW_MODE_STORAGE_KEY = 'wb-news-editor-view';

const filterSelectClassName = cn(
  'flex h-10 w-full appearance-none border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background',
  'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  'disabled:cursor-not-allowed disabled:opacity-50'
);

const DEFAULT_FILTERS = {
  category: 'all',
  status: 'all',
  sortBy: 'newest',
};

const NewsEditor = () => {
  const router = useRouter();
  const [newsItems, setNewsItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [deleteFeedback, setDeleteFeedback] = useState({ error: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [viewMode, setViewMode] = useState('list');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    if (stored === 'list' || stored === 'cards') {
      setViewMode(stored);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
  }, [viewMode]);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNewsItems(data || []);
    } catch (error) {
      console.error('Error fetching news:', error);
      setFetchError('Failed to fetch news posts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const filteredNewsItems = useMemo(() => {
    let results = [...newsItems];
    const query = searchTerm.trim().toLowerCase();

    if (query) {
      results = results.filter((item) => {
        const title = String(item.title || '').toLowerCase();
        const content = String(item.content || '').toLowerCase();
        return title.includes(query) || content.includes(query);
      });
    }

    if (filters.category !== 'all') {
      results = results.filter((item) => item.category === filters.category);
    }

    if (filters.status !== 'all') {
      results = results.filter((item) => item.status === filters.status);
    }

    results.sort((a, b) => {
      const aDate = new Date(a.created_at).getTime();
      const bDate = new Date(b.created_at).getTime();

      if (filters.sortBy === 'oldest') return aDate - bDate;
      if (filters.sortBy === 'title') {
        return String(a.title || '').localeCompare(String(b.title || ''));
      }
      return bDate - aDate;
    });

    return results;
  }, [newsItems, searchTerm, filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleDelete = async (id) => {
    setDeleteFeedback({ error: '' });
    if (!window.confirm('Are you sure you want to delete this news post?')) {
      return;
    }

    try {
      const { error } = await supabase.from('news').delete().eq('id', id);
      if (error) throw error;
      fetchNews();
    } catch (error) {
      console.error('Error deleting news post:', error);
      setDeleteFeedback({ error: 'Failed to delete news post' });
    }
  };

  const handleViewPost = (item) => {
    const slug = slugify(item.title);
    if (item.category === 'bounty' && item.bounty_id) {
      window.open(`/bounties/${slug}`, '_blank');
      return;
    }
    window.open(`/news/post/${slug}`, '_blank');
  };

  const handleEdit = (id) => {
    router.push(`/admin/news-editor/edit/${id}`);
  };

  const hasActiveFilters =
    Boolean(searchTerm.trim()) ||
    filters.category !== 'all' ||
    filters.status !== 'all' ||
    filters.sortBy !== 'newest';

  const clearFilters = () => {
    setSearchTerm('');
    setFilters(DEFAULT_FILTERS);
  };

  if (loading) {
    return <NavbarLoader />;
  }

  return (
    <>
      <PageHead title="News Editor — WhistleBlower.ng" />

      <div className="flex flex-1 flex-col gap-4 bg-muted/20 p-4 lg:gap-6 lg:p-6">
        <PageHeader title="News Editor" description="Manage news posts and content">
          <Button onClick={() => router.push('/admin/news-editor/create')} className="uppercase">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create News Post
          </Button>
        </PageHeader>

        <PageErrorBanner error={fetchError} title="Could not load news posts" />
        <FieldError message={deleteFeedback.error} />

        <div className="space-y-4 rounded-lg border bg-card p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="sm:col-span-2 xl:col-span-1">
                <label htmlFor="news-editor-search" className="mb-2 block text-sm font-medium">
                  Search
                </label>
                <Input
                  id="news-editor-search"
                  placeholder="Search by title or content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="news-editor-category" className="mb-2 block text-sm font-medium">
                  Category
                </label>
                <div className="relative">
                  <select
                    id="news-editor-category"
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className={filterSelectClassName}
                    aria-label="Filter by category"
                  >
                    <option value="all">All Categories</option>
                    <option value="news">News</option>
                    <option value="bounty">Bounty</option>
                    <option value="most_wanted">Most Wanted</option>
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50"
                    aria-hidden
                  />
                </div>
              </div>

              <div>
                <label htmlFor="news-editor-status" className="mb-2 block text-sm font-medium">
                  Status
                </label>
                <div className="relative">
                  <select
                    id="news-editor-status"
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className={filterSelectClassName}
                    aria-label="Filter by status"
                  >
                    <option value="all">All Statuses</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50"
                    aria-hidden
                  />
                </div>
              </div>

              <div>
                <label htmlFor="news-editor-sort" className="mb-2 block text-sm font-medium">
                  Sort
                </label>
                <div className="relative">
                  <select
                    id="news-editor-sort"
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className={filterSelectClassName}
                    aria-label="Sort posts"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="title">Title (A–Z)</option>
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50"
                    aria-hidden
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 lg:justify-end">
              <p className="text-sm text-muted-foreground">
                {filteredNewsItems.length} of {newsItems.length} posts
              </p>
              <div
                className="inline-flex rounded-md border border-input p-1"
                role="group"
                aria-label="Display layout"
              >
                <Button
                  type="button"
                  variant={viewMode === 'cards' ? 'default' : 'ghost'}
                  size="sm"
                  className="px-3"
                  onClick={() => setViewMode('cards')}
                  aria-pressed={viewMode === 'cards'}
                  aria-label="Card view"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  className="px-3"
                  onClick={() => setViewMode('list')}
                  aria-pressed={viewMode === 'list'}
                  aria-label="List view"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          )}
        </div>

        {filteredNewsItems.length > 0 ? (
          viewMode === 'cards' ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredNewsItems.map((item) => (
                <NewsEditorPostCard
                  key={item.id}
                  item={item}
                  onEdit={handleEdit}
                  onView={handleViewPost}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border bg-card divide-y divide-border">
              {filteredNewsItems.map((item) => (
                <NewsEditorPostListRow
                  key={item.id}
                  item={item}
                  onEdit={handleEdit}
                  onView={handleViewPost}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )
        ) : newsItems.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mb-4 text-muted-foreground">
              <PlusCircle className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <h3 className="text-lg font-medium">No news posts yet</h3>
              <p>Create your first news post to get started</p>
            </div>
            <Button onClick={() => router.push('/admin/news-editor/create')} className="uppercase">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create News Post
            </Button>
          </div>
        ) : (
          <div className="py-16 text-center text-muted-foreground">
            <Newspaper className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p className="text-lg">No posts match the current filters.</p>
            <p className="text-sm">Try adjusting your search or filter criteria.</p>
            <Button type="button" variant="outline" className="mt-4" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default NewsEditor;
