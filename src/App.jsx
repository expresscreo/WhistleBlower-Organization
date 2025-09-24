
import React, { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider, useAuth } from '@/contexts/SupabaseAuthContext';
import { MobileMenuProvider } from '@/contexts/MobileMenuContext';

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
import StickyScrollSamplePage from '@/pages/StickyScrollSamplePage';
import RewardsForInformationPage from '@/pages/RewardsForInformationPage';

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
import NewsEditorPage from '@/pages/admin/NewsEditorPage';



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
          <ErrorBoundary>
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
                  <Route path="news-editor/create" element={<NewsEditorPage />} />
                  <Route path="news-editor/edit/:id" element={<NewsEditorPage />} />
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
          </ErrorBoundary>
          <Toaster />
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

const PublicApp = () => (
  <MobileMenuProvider>
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main id="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about-us" element={<AboutUsPageV2 />} />
          <Route path="/how-we-secure-your-data" element={<HowWeSecureDataPage />} />
          <Route path="/track" element={<TrackPage />} />
          <Route path="/bounties/:slug" element={<BountyPostPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/news/:category" element={<NewsPage />} />
          <Route path="/news/post/:slug" element={<NewsPostPage />} />
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
          <Route path="/sticky-scroll-sample" element={<StickyScrollSamplePage />} />
          <Route path="/rewards-for-information" element={<RewardsForInformationPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  </MobileMenuProvider>
);

export default App;

// Simple error boundary to prevent full-blank pages and surface runtime errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('App render error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20">
          <div className="text-center p-8 max-w-md mx-auto">
            <div className="mb-6">
              <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl font-bold">🔧</span>
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 tracking-wider">
              WEBSITE IS UNDER THE KNIFE
            </h1>
            
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              Our developers are working hard to fix this issue. Please check back soon!
            </p>
            
            <button 
              onClick={() => window.location.reload()} 
              className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
