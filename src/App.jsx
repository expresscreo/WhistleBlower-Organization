
import React, { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider, useAuth } from '@/contexts/SupabaseAuthContext';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HomePage from '@/pages/HomePage';
import AboutUsPageV2 from '@/pages/AboutUsPageV2';
import HowWeSecureDataPage from '@/pages/HowWeSecureDataPage';
import SubmitReportPage from '@/pages/SubmitReportPage';
import PlaceBountyPage from '@/pages/PlaceBountyPage';
import TrackPage from '@/pages/TrackPage';
import BountyPostPage from '@/pages/BountyPostPage';
import NewsPage from '@/pages/NewsPage';
import NewsPostPage from '@/pages/NewsPostPage';
import PricingPage from '@/pages/PricingPage';
import FAQPage from '@/pages/FAQPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import PartnerPage from '@/pages/PartnerPage';
import PrivacyPolicyPage from '@/pages/PrivacyPolicyPage';
import TermsOfServicePage from '@/pages/TermsOfServicePage';
import DisclaimerPage from '@/pages/DisclaimerPage';
import ContactPage from '@/pages/ContactPage';
import PaymentSuccessPage from '@/pages/PaymentSuccessPage';
import SitemapPage from '@/pages/SitemapPage';

import DashboardLayout from '@/components/admin/DashboardLayout';
import Overview from '@/pages/admin/Overview';
import Reports from '@/pages/admin/Reports';
import CustomerFeedback from '@/pages/admin/CustomerFeedback';
import ReportDetails from '@/pages/admin/ReportDetails';
import UserManagement from '@/pages/admin/UserManagement';
import OrganizationsManagement from '@/pages/admin/OrganizationsManagement';
import UnmatchedOrganizations from '@/pages/admin/UnmatchedOrganizations';
import RewardPage from '@/pages/admin/RewardPage';
import Billing from '@/pages/admin/Billing';
import PlanFeatures from '@/pages/admin/PlanFeatures';
import PlanManagement from '@/pages/admin/PlanManagement';
import AuditLogs from '@/pages/admin/AuditLogs';
import Settings from '@/pages/admin/Settings';
import TriagePage from '@/pages/admin/TriagePage';
import TrashedReports from '@/pages/admin/TrashedReports';
import BountiesManagement from '@/pages/admin/BountiesManagement';
import BountyDetails from '@/pages/admin/BountyDetails';
import NewsEditor from '@/pages/admin/NewsEditor';

const ProtectedRoute = ({ children, pageName }) => {
  const { user, loading, profile, permissions } = useAuth();
  const isSuperAdmin = profile?.user_type === 'super_admin';

  if (loading) {
    return <div className="flex h-screen w-screen items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (pageName === 'Trashed Report') {
      const allowedRoles = ['super_admin', 'executive_admin'];
      if (!profile || !allowedRoles.includes(profile.user_type)) {
          return <Navigate to="/admin/overview" replace />;
      }
  } else if (!isSuperAdmin && pageName && !permissions[pageName]) {
    return <Navigate to="/admin/overview" replace />;
  }

  return children;
};

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    if (!pathname.startsWith('/track')) {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
};

const LogoutTracker = () => {
    const location = useLocation();
    const previousPath = useRef(location.pathname);

    useEffect(() => {
        const fromTrackPage = previousPath.current.startsWith('/track');
        const toAnotherPage = !location.pathname.startsWith('/track');

        if (fromTrackPage && toAnotherPage) {
            sessionStorage.removeItem('trackId');
            sessionStorage.removeItem('trackPassword');
            sessionStorage.removeItem('trackType');
        }
        previousPath.current = location.pathname;
    }, [location.pathname]);

    return null;
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <ScrollToTop />
          <LogoutTracker />
          <Routes>
            <Route path="/*" element={<PublicApp />} />
            
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/payment-success" element={<PaymentSuccessPage />} />

            <Route path="/admin/*" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Routes>
                    <Route path="overview" element={<ProtectedRoute pageName="Overview"><Overview /></ProtectedRoute>} />
                    <Route path="reports" element={<ProtectedRoute pageName="Reports"><Reports /></ProtectedRoute>} />
                    <Route path="customer-feedback" element={<ProtectedRoute pageName="Customer Feedback"><CustomerFeedback /></ProtectedRoute>} />
                    <Route path="reports/:id" element={<ProtectedRoute pageName="Report Details"><ReportDetails /></ProtectedRoute>} />
                    <Route path="user-management" element={<ProtectedRoute pageName="User Management"><UserManagement /></ProtectedRoute>} />
                    <Route path="organizations-management" element={<ProtectedRoute pageName="Organizations"><OrganizationsManagement /></ProtectedRoute>} />
                    <Route path="unmatched-organizations" element={<ProtectedRoute pageName="Unmatched Organization"><UnmatchedOrganizations /></ProtectedRoute>} />
                    <Route path="reward" element={<ProtectedRoute pageName="Reward"><RewardPage /></ProtectedRoute>} />
                    <Route path="bounties" element={<ProtectedRoute pageName="Bounties"><BountiesManagement /></ProtectedRoute>} />
                    <Route path="bounties/:id" element={<ProtectedRoute pageName="Bounty Details"><BountyDetails /></ProtectedRoute>} />
                    <Route path="news-editor" element={<ProtectedRoute pageName="News Editor"><NewsEditor /></ProtectedRoute>} />
                    <Route path="billing" element={<ProtectedRoute pageName="Billing"><Billing /></ProtectedRoute>} />
                    <Route path="plan-features" element={<ProtectedRoute pageName="Plan Features"><PlanFeatures /></ProtectedRoute>} />
                    <Route path="plan-management" element={<ProtectedRoute pageName="Plan Management"><PlanManagement /></ProtectedRoute>} />
                    <Route path="audit-logs" element={<ProtectedRoute pageName="Audit Logs"><AuditLogs /></ProtectedRoute>} />
                    <Route path="settings" element={<ProtectedRoute pageName="Settings"><Settings /></ProtectedRoute>} />
                    <Route path="triage" element={<ProtectedRoute pageName="Triage"><TriagePage /></ProtectedRoute>} />
                    <Route path="trashed-reports" element={<ProtectedRoute pageName="Trashed Report"><TrashedReports /></ProtectedRoute>} />
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            } />
          </Routes>
          <Toaster />
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

const PublicApp = () => (
  <div className="min-h-screen bg-background text-foreground">
    <Navbar />
    <main id="main-content">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about-us" element={<AboutUsPageV2 />} />
        <Route path="/how-we-secure-your-data" element={<HowWeSecureDataPage />} />
        <Route path="/track" element={<TrackPage />} />
        <Route path="/bounties/:id" element={<BountyPostPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/news/:category" element={<NewsPage />} />
        <Route path="/news/post/:id" element={<NewsPostPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/partner-program" element={<PartnerPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms-of-service" element={<TermsOfServicePage />} />
        <Route path="/disclaimer" element={<DisclaimerPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/submit-report" element={<SubmitReportPage />} />
        <Route path="/place-bounty" element={<PlaceBountyPage />} />
        <Route path="/sitemap.xml" element={<SitemapPage />} />
      </Routes>
    </main>
    <Footer />
  </div>
);

export default App;
