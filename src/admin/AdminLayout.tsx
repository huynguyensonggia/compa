import { useEffect, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAdminData } from './AdminData';
import { storedLang } from '../i18n';
import { paths } from '../routing/paths';

const NAV = [
  { to: '/admin', label: 'Tổng quan', end: true },
  { to: '/admin/danh-muc', label: 'Danh mục dự án' },
  { to: '/admin/du-an', label: 'Dự án' },
  { to: '/admin/anh-mo-dau', label: 'Ảnh mở đầu' },
  { to: '/admin/thuong-hieu', label: 'Thương hiệu & Liên hệ' },
  { to: '/admin/noi-dung', label: 'Nội dung Việt–Anh' },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const { records, error } = useAdminData();

  useEffect(() => {
    document.title = 'Quản trị | COMPA Architecture Hội An';
    document.documentElement.lang = 'vi';
    document.head.querySelectorAll('[data-seo]').forEach((el) => el.remove());
    let robots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement('meta');
      robots.name = 'robots';
      document.head.append(robots);
    }
    robots.content = 'noindex, nofollow';
  }, []);

  return (
    <div className="admin">
      <aside className="admin__side">
        <p className="admin__brand">
          COMPA <span>Quản trị</span>
        </p>
        <nav aria-label="Quản trị">
          <ul>
            {NAV.map((n) => (
              <li key={n.to}>
                <NavLink to={n.to} end={n.end}>
                  {n.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <p className="admin__note">Bản quản trị thử nghiệm trên thiết bị này</p>
        <Link className="admin__view" to={paths.home(storedLang() ?? 'vi')} target="_blank" rel="noopener">
          Xem website ↗
        </Link>
      </aside>
      <main className="admin__main" id="main">
        {error && <p className="a-issue a-issue--error">Không mở được dữ liệu cục bộ (IndexedDB): {error}</p>}
        {!import.meta.env.DEV && (
          <p className="a-issue a-issue--warning">
            Đây là bản build tĩnh: thay đổi ở đây chỉ lưu trong trình duyệt và KHÔNG hiển thị trên các trang công khai đã prerender. Dùng “Xuất gói nội dung cho
            website” rồi build lại để cập nhật website.
          </p>
        )}
        {records ? children : !error && <p>Đang tải dữ liệu…</p>}
      </main>
    </div>
  );
}
