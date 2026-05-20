'use client';
import { usePathname, useRouter } from 'next/navigation';

import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { AdminDataProvider } from '@/contexts/AdminDataContext';
import DashboardLayout from './DashboardLayout';

/**
 * AdminLayoutWrapper - Shows admin layout immediately while handling authentication in background
 * This ensures sidebar and topnav appear instantly on page refresh
 */
const AdminLayoutWrapper = ({ children }) => {
  const router = useRouter();
  const { user, loading, profile, permissions } = useAuth();
  const pathname = usePathname();

  // Map routes to page names for permission checking
  const routeToPageName = {
    '/admin/overview': 'Overview',
    '/admin/reports': 'Reports',
    '/admin/customer-feedback': 'Customer Feedback',
    '/admin/user-management': 'User Management',
    '/admin/organizations-management': 'Organizations',
    '/admin/unmatched-organizations': 'Unmatched Organization',
    '/admin/reward': 'Reward',
    '/admin/bounties': 'Bounties',
    '/admin/news-editor': 'News Editor',
    '/admin/billing': 'Billing',
    '/admin/plan-features': 'Plan Features',
    '/admin/plan-management': 'Plan Management',
    '/admin/audit-logs': 'Audit Logs',
    '/admin/settings': 'Settings',
    '/admin/triage': 'Triage',
    '/admin/trashed-reports': 'Trashed Report',
  };

  // Handle redirects after authentication completes
  useEffect(() => {
    if (!loading) {
      // If authentication completed and user is not logged in, redirect to login
      if (!user) {
        // Don't redirect immediately to avoid flash, let the Navigate component handle it
        return;
      }

      // Check permissions only after authentication is complete
      if (profile) {
        const isSuperAdmin = profile?.user_type === 'super_admin';
        let pageName = routeToPageName[pathname];
        
        // Handle dynamic routes
        if (!pageName) {
          if (pathname.startsWith('/admin/reports/')) {
            pageName = 'Report Details';
          } else if (pathname.startsWith('/admin/bounties/')) {
            pageName = 'Bounty Details';
          }
        }

        // Check permissions for the specific page
        if (pageName === 'Trashed Report') {
          const allowedRoles = ['super_admin', 'executive_admin'];
          if (!allowedRoles.includes(profile.user_type)) {
            window.location.replace('/admin/overview');
            return;
          }
        } else if (!isSuperAdmin && pageName && !permissions[pageName]) {
          window.location.replace('/admin/overview');
          return;
        }
      }
    }
  }, [loading, user, profile, permissions, pathname, routeToPageName]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (!loading && !user) {
    return null;
  }

  // Always show the dashboard layout immediately
  // Authentication and permission checks happen in the background
  return (
    <AdminDataProvider>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </AdminDataProvider>
  );
};

export default AdminLayoutWrapper;

