
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

import AdminLayoutWrapper from '@/components/admin/AdminLayoutWrapper';
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
              <AdminLayoutWrapper>
                <Routes>
                  <Route path="overview" element={<Overview />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="customer-feedback" element={<CustomerFeedback />} />
                  <Route path="reports/:id" element={<ReportDetails />} />
                  <Route path="user-management" element={<UserManagement />} />
                  <Route path="organizations-management" element={<OrganizationsManagement />} />
                  <Route path="unmatched-organizations" element={<UnmatchedOrganizations />} />
                  <Route path="reward" element={<RewardPage />} />
                  <Route path="bounties" element={<BountiesManagement />} />
                  <Route path="bounties/:id" element={<BountyDetails />} />
                  <Route path="news-editor" element={<NewsEditor />} />
                  <Route path="billing" element={<Billing />} />
                  <Route path="plan-features" element={<PlanFeatures />} />
                  <Route path="plan-management" element={<PlanManagement />} />
                  <Route path="audit-logs" element={<AuditLogs />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="triage" element={<TriagePage />} />
                  <Route path="trashed-reports" element={<TrashedReports />} />
                </Routes>
              </AdminLayoutWrapper>
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
