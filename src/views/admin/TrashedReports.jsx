import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import PageHead from '@/components/PageHead';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { FieldError, FieldSuccess, PageErrorBanner } from '@/components/ui/form-feedback';
import { RotateCcw, Calendar, Trash2, Award, FileText } from 'lucide-react';
import NavbarLoader from '@/components/admin/NavbarLoader';
import PageHeader from '@/components/admin/PageHeader';
import { format, addDays } from 'date-fns';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';


const TrashedReports = () => {
  const [trashedItems, setTrashedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [actionFeedback, setActionFeedback] = useState({ error: '', success: '' });
  const router = useRouter();
  const { profile, loading: profileLoading } = useAuth();
  const [isProcessing, setIsProcessing] = useState(null);
  
  // Refs to prevent unnecessary re-fetching
  const hasInitialData = useRef(false);
  const lastFetchTime = useRef(0);
  const fetchTrashedItemsRef = useRef(null);
  
  const [dialogState, setDialogState] = useState({
      isOpen: false,
      item: null,
      action: null,
      type: null,
  });

  const purgeExpiredTrash = useCallback(async () => {
    const { error } = await supabase.rpc('purge_expired_trash');
    if (error) {
      console.warn('Failed to purge expired trash:', error.message);
    }
  }, []);

  const fetchTrashedItems = useCallback(async (forceRefresh = false) => {
    if (!profile) return;
    
    // Prevent unnecessary re-fetching
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTime.current;
    
    // If we already have data and it's been less than 30 seconds, don't fetch again unless forced
    if (hasInitialData.current && timeSinceLastFetch < 30000 && !forceRefresh) {
      return;
    }
    
    // Skip fetch if page is not visible and not forced
    if (!forceRefresh && document.visibilityState !== 'visible') {
      return;
    }
    setLoading(true);
    setFetchError('');
    lastFetchTime.current = now;

    await purgeExpiredTrash();
    
    let reportQuery = supabase.from('reports').select('*').eq('is_trashed', true);
    let bountyQuery = supabase.from('bounties').select('*').eq('is_trashed', true);

    if (profile.user_type === 'executive_admin') {
        reportQuery = reportQuery.eq('organization_id', profile.organization_id);
        bountyQuery = bountyQuery.limit(0); 
    }
    
    const [reportsRes, bountiesRes] = await Promise.all([reportQuery, bountyQuery]);

    if (reportsRes.error || bountiesRes.error) {
      setFetchError(reportsRes.error?.message || bountiesRes.error?.message);
      setTrashedItems([]);
    } else {
      const reports = reportsRes.data.map(r => ({ ...r, type: 'report' }));
      const bounties = bountiesRes.data.map(b => ({ ...b, type: 'bounty' }));
      const allItems = [...reports, ...bounties].sort((a, b) => new Date(b.trashed_at) - new Date(a.trashed_at));
      setTrashedItems(allItems);
      hasInitialData.current = true;
    }
    setLoading(false);
  }, [profile, purgeExpiredTrash]);

  // Store the latest fetchTrashedItems in ref
  fetchTrashedItemsRef.current = fetchTrashedItems;
  
  // Initial data fetch - only runs once when profile is loaded
  useEffect(() => {
    if (!profileLoading && profile) {
      const allowedRoles = ['super_admin', 'executive_admin'];
      if (!allowedRoles.includes(profile.user_type)) {
          setFetchError("You don't have permission to view this page.");
          router.push('/admin/overview');
          return;
      }
      if (!hasInitialData.current) {
        fetchTrashedItems(true); // Force initial fetch
      }
    }
  }, [profileLoading, profile?.id, profile?.user_type, router]); // Only depend on stable references
  
  const handleActionClick = (e, item, action, type) => {
    e.stopPropagation();
    setDialogState({ isOpen: true, item, action, type });
  };

  const confirmAction = async () => {
    const { item, action, type } = dialogState;
    if (!item || !action) return;

    setIsProcessing(item.id);
    setActionFeedback({ error: '', success: '' });
    
    const tableName = type === 'report' ? 'reports' : 'bounties';
    let error;

    if (action === 'restore') {
      const { error: restoreError } = await supabase.from(tableName).update({ is_trashed: false, trashed_at: null }).eq('id', item.id);
      error = restoreError;
    } else if (action === 'delete') {
        if (type === 'bounty') {
            const { error: deleteBountyError } = await supabase.rpc('delete_bounty_and_dependencies', { p_bounty_id: item.id });
            error = deleteBountyError;
        } else {
            const { error: deleteError } = await supabase.rpc('delete_report_and_dependencies', { p_report_id: item.id });
            error = deleteError;
        }
    }

    if (error) {
      setActionFeedback({ error: error.message, success: '' });
    } else if (action === 'restore') {
      setActionFeedback({ error: '', success: `${type.charAt(0).toUpperCase() + type.slice(1)} restored successfully` });
      fetchTrashedItems(true);
    } else {
      setTrashedItems((prev) => prev.filter((entry) => entry.id !== item.id));
      fetchTrashedItems(true);
    }

    setIsProcessing(null);
    setDialogState({ isOpen: false, item: null, action: null, type: null });
  };
  
  const handleCardClick = (item) => {
    if (item.type === 'report') {
        router.push(`/admin/reports/${item.id}`);
    } else {
        router.push(`/admin/bounties/${item.id}`);
    }
  };

  const isSuperAdmin = !profileLoading && profile?.user_type === 'super_admin';

  return (
    <>
      <PageHead title="Trash - WhistleBlower.ng" />
      {(loading || profileLoading) && <NavbarLoader />}
      <div className="space-y-8">
        <PageHeader 
          title="Trash" 
          description="Items in the trash will be automatically and permanently deleted after 30 days."
        />

        <PageErrorBanner error={fetchError} title="Could not load trashed items" />
        <FieldError message={actionFeedback.error} />
        <FieldSuccess message={actionFeedback.success} />

        {loading || profileLoading ? (
          <div className="flex justify-center py-8">
            {/* Loading indication is handled by NavbarLoader */}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {trashedItems.map(item => {
              const trashedDate = new Date(item.trashed_at);
              const deletionDate = addDays(trashedDate, 30);
              const daysUntilDeletion = Math.ceil((deletionDate - new Date()) / (1000 * 60 * 60 * 24));
              const isBounty = item.type === 'bounty';

              return (
                <Card 
                  key={item.id} 
                  className="flex flex-col hover:shadow-lg transition-shadow bg-card cursor-pointer overflow-hidden rounded-none"
                  onClick={() => handleCardClick(item)}
                >
                  <div className="bg-muted text-muted-foreground text-sm font-bold text-center p-2">
                    {daysUntilDeletion > 0 ? `Deletes in ${daysUntilDeletion} day${daysUntilDeletion > 1 ? 's' : ''}` : 'Pending Deletion'}
                  </div>
                   <CardContent className="p-6 flex-grow flex flex-col">
                       <p className="text-xs text-muted-foreground font-mono mb-2 flex items-center">
                         {isBounty ? <Award className="w-3 h-3 mr-1.5" /> : <FileText className="w-3 h-3 mr-1.5" />}
                         {isBounty ? `BOUNTY ID: ${item.bounty_id}` : `REPORT ID: ${item.report_id}`}
                       </p>
                       <h3 className="text-lg font-bold line-clamp-2 mb-2">{item.title}</h3>
                       <p className="text-sm text-muted-foreground line-clamp-3 flex-grow">{item.description}</p>
                   </CardContent>
                   <div className="px-6 py-4 border-t flex flex-wrap justify-between items-center gap-2">
                       <div className="text-sm text-muted-foreground flex items-center">
                           <Calendar className="w-4 h-4 mr-2"/>
                           Trashed: {format(trashedDate, 'PPP')}
                       </div>
                       {isSuperAdmin && (
                         <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={(e) => handleActionClick(e, item, 'restore', item.type)} loading={isProcessing === item.id} className="rounded-none">
                               <RotateCcw className="mr-2 h-4 w-4"/>
                               Restore
                           </Button>
                           <Button variant="destructive" size="sm" onClick={(e) => handleActionClick(e, item, 'delete', item.type)} loading={isProcessing === item.id} className="rounded-none">
                               <Trash2 className="mr-2 h-4 w-4"/>
                               Delete
                           </Button>
                         </div>
                       )}
                   </div>
                </Card>
              )
            })}
          </div>
        )}
        {!loading && !profileLoading && trashedItems.length === 0 && <div className="text-center py-16 text-muted-foreground bg-card border rounded-lg"><p className="text-lg font-medium">The trash is empty.</p><p>Deleted items will appear here.</p></div>}
      </div>

      <AlertDialog open={dialogState.isOpen} onOpenChange={(isOpen) => !isOpen && setDialogState({ isOpen: false, item: null, action: null, type: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {dialogState.action === 'restore'
                ? `This will restore the ${dialogState.type} "${dialogState.item?.title}" to the active list.`
                : `This action is permanent and cannot be undone. This will permanently delete the ${dialogState.type} "${dialogState.item?.title}" and all associated data.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <FieldError message={actionFeedback.error} className="mx-6" />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              loading={isProcessing === dialogState.item?.id}
              className={dialogState.action === 'delete' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
                {dialogState.action === 'restore' ? 'Restore' : 'Delete Permanently'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TrashedReports;