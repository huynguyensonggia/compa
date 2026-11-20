import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import type { Lang } from './content/types';
import { LangProvider } from './i18n';
import { HomePage } from './pages/HomePage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { ProjectTypePage } from './pages/ProjectTypePage';
import { StudioPage } from './pages/StudioPage';
import { PricingPage } from './pages/PricingPage';
import { ContactPage } from './pages/ContactPage';
import { ServiceDetailPage, ServicesPage } from './pages/ServicesPage';
import { NotFoundPage } from './pages/NotFoundPage';

const AdminApp = lazy(() => import('./admin/AdminApp'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

const L = (lang: Lang, el: ReactNode) => <LangProvider lang={lang}>{el}</LangProvider>;

export function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={L('vi', <HomePage />)} />
        <Route path="/du-an" element={L('vi', <ProjectsPage />)} />
        <Route path="/du-an/:typeSlug" element={L('vi', <ProjectTypePage />)} />
        <Route path="/du-an/:typeSlug/:slug" element={L('vi', <ProjectDetailPage />)} />
        <Route path="/don-gia" element={L('vi', <PricingPage />)} />
        <Route path="/gioi-thieu" element={L('vi', <StudioPage />)} />
        <Route path="/lien-he" element={L('vi', <ContactPage />)} />
        <Route path="/dich-vu" element={L('vi', <ServicesPage />)} />
        <Route path="/dich-vu/:slug" element={L('vi', <ServiceDetailPage />)} />

        <Route path="/en" element={L('en', <HomePage />)} />
        <Route path="/en/projects" element={L('en', <ProjectsPage />)} />
        <Route path="/en/projects/:typeSlug" element={L('en', <ProjectTypePage />)} />
        <Route path="/en/projects/:typeSlug/:slug" element={L('en', <ProjectDetailPage />)} />
        <Route path="/en/pricing" element={L('en', <PricingPage />)} />
        <Route path="/en/studio" element={L('en', <StudioPage />)} />
        <Route path="/en/contact" element={L('en', <ContactPage />)} />
        <Route path="/en/services" element={L('en', <ServicesPage />)} />
        <Route path="/en/services/:slug" element={L('en', <ServiceDetailPage />)} />

        <Route
          path="/admin/*"
          element={
            <Suspense fallback={<p className="admin-loading">Đang tải trang quản trị…</p>}>
              <AdminApp />
            </Suspense>
          }
        />
        <Route path="*" element={L('vi', <NotFoundPage />)} />
      </Routes>
    </>
  );
}
