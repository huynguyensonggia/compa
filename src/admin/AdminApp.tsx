import { Route, Routes, useParams } from 'react-router-dom';
import { LangProvider } from '../i18n';
import { AdminDataProvider } from './AdminData';
import { AdminLayout } from './AdminLayout';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsAdminPage } from './pages/ProjectsAdminPage';
import { ProjectEditorPage } from './pages/ProjectEditorPage';
import { HeroAdminPage } from './pages/HeroAdminPage';
import { BrandAdminPage } from './pages/BrandAdminPage';
import { ContentAdminPage } from './pages/ContentAdminPage';
import '../styles/admin.css';

/** Fresh editor state per project id. */
function KeyedEditor() {
  const { id } = useParams();
  return <ProjectEditorPage key={id} />;
}

export default function AdminApp() {
  return (
    <LangProvider lang="vi">
      <AdminDataProvider>
        <AdminLayout>
          <Routes>
            <Route index element={<DashboardPage />} />
            <Route path="du-an" element={<ProjectsAdminPage />} />
            <Route path="du-an/moi" element={<ProjectEditorPage key="new" />} />
            <Route path="du-an/:id" element={<KeyedEditor />} />
            <Route path="anh-mo-dau" element={<HeroAdminPage />} />
            <Route path="thuong-hieu" element={<BrandAdminPage />} />
            <Route path="noi-dung" element={<ContentAdminPage />} />
            <Route path="*" element={<p>Không tìm thấy trang quản trị.</p>} />
          </Routes>
        </AdminLayout>
      </AdminDataProvider>
    </LangProvider>
  );
}
