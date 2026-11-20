import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminData } from '../AdminData';
import { exportBackup, importBackup, resetDemo, ValidationError, checkBackup } from '../data/repository';
import { buildContentPackage, downloadBlob } from '../data/exportPackage';
import { countMissingTranslations } from './translations';

export function DashboardPage() {
  const { records, reload } = useAdminData();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  if (!records) return null;

  const published = records.projects.filter((p) => p.status === 'published').length;
  const drafts = records.projects.length - published;
  const images = records.projects.reduce((n, p) => n + p.images.length, 0);
  const unclassified = records.projects.reduce((n, p) => n + p.images.filter((i) => i.groupId === null).length, 0);
  const uploads = records.assets.filter((a) => a.blob).length;
  const missing = countMissingTranslations(records);
  const stamp = new Date().toISOString().slice(0, 10);

  const doExportBackup = async () => {
    const data = await exportBackup();
    downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), `compa-sao-luu-noi-dung-${stamp}.json`);
    setMsg({ kind: 'ok', text: 'Đã xuất bản sao lưu nội dung (JSON, chỉ chứa tham chiếu ảnh).' });
  };

  const doImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const problems = await checkBackup(data);
      if (problems.length) {
        setMsg({ kind: 'error', text: `Không nhập được — cần sửa:\n• ${problems.join('\n• ')}` });
        return;
      }
      if (!confirm('Nhập bản sao lưu sẽ THAY THẾ toàn bộ nội dung hiện tại trong trình duyệt này. Tiếp tục?')) return;
      await importBackup(data);
      await reload();
      setMsg({ kind: 'ok', text: 'Đã nhập bản sao lưu.' });
    } catch (e) {
      setMsg({ kind: 'error', text: e instanceof ValidationError ? e.issues.join('\n') : `Tệp không hợp lệ: ${(e as Error).message}` });
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const doPackage = async () => {
    setBusy(true);
    try {
      const { blob, warnings } = await buildContentPackage();
      downloadBlob(blob, `compa-goi-noi-dung-${stamp}.zip`);
      setMsg({
        kind: 'ok',
        text: `Đã tạo gói nội dung. Chạy: npm run content:import <đường-dẫn-file.zip> rồi npm run build.${warnings.length ? `\nLưu ý:\n• ${warnings.join('\n• ')}` : ''}`,
      });
    } catch (e) {
      setMsg({ kind: 'error', text: `Chưa xuất được gói: ${(e as Error).message}` });
    } finally {
      setBusy(false);
    }
  };

  const doReset = async () => {
    if (!confirm('Khôi phục dữ liệu demo sẽ XÓA mọi thay đổi và ảnh đã tải lên trong trình duyệt này. Tiếp tục?')) return;
    if (!confirm('Xác nhận lần nữa: ghi đè toàn bộ dữ liệu hiện tại bằng dữ liệu demo?')) return;
    await resetDemo();
    await reload();
    setMsg({ kind: 'ok', text: 'Đã khôi phục dữ liệu demo.' });
  };

  return (
    <div className="a-page">
      <h1>Tổng quan</h1>
      <ul className="a-stats">
        <li>
          <strong>{records.projects.length}</strong> dự án
        </li>
        <li>
          <strong>{published}</strong> công khai
        </li>
        <li>
          <strong>{drafts}</strong> nháp
        </li>
        <li>
          <strong>{images}</strong> ảnh trong gallery
        </li>
        <li>
          <strong>{records.site.hero.slides.length}</strong> ảnh mở đầu
        </li>
        <li>
          <strong>{uploads}</strong> ảnh tải lên trên máy này
        </li>
      </ul>
      {unclassified > 0 && <p className="a-issue a-issue--warning">Có {unclassified} ảnh chưa phân loại trong các dự án nháp.</p>}
      {missing > 0 && (
        <p className="a-issue a-issue--warning">
          Có {missing} trường còn thiếu bản dịch. <Link to="/admin/noi-dung">Xem danh sách</Link>
        </p>
      )}
      {!records.site.seo.allowIndexing && (
        <p className="a-hint">Website đang ở chế độ không cho index (noindex) vì còn dữ liệu minh họa. Bật trong “Thương hiệu & Liên hệ” khi đã có dự án thật.</p>
      )}

      <section className="a-card">
        <h2>Xuất gói nội dung cho website</h2>
        <p>
          Tạo file ZIP gồm JSON đã kiểm tra và ảnh tải lên được đổi tên có nghĩa theo dự án / nhóm / thứ tự (ví dụ <code>du-an/nha-vuon-cam-thanh/noi-that-03.jpg</code>
          ). Đây là cách đưa nội dung từ trang quản trị vào bản build chính thức.
        </p>
        <button type="button" className="a-btn a-btn--primary" onClick={doPackage} disabled={busy}>
          {busy ? 'Đang tạo…' : 'Xuất gói nội dung cho website'}
        </button>
      </section>

      <section className="a-card">
        <h2>Sao lưu nội dung (JSON)</h2>
        <p>
          Bản sao lưu chỉ chứa nội dung và <strong>tham chiếu ảnh</strong>, không chứa dữ liệu ảnh — đây <strong>không phải sao lưu đầy đủ</strong>. Ảnh tải lên chỉ khôi
          phục được trên cùng trình duyệt; để giữ ảnh, dùng “Xuất gói nội dung cho website”.
        </p>
        <div className="a-toolbar">
          <button type="button" className="a-btn" onClick={doExportBackup}>
            Xuất JSON
          </button>
          <button type="button" className="a-btn" onClick={() => fileRef.current?.click()}>
            Nhập JSON…
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => doImport(e.target.files?.[0])} />
        </div>
      </section>

      <section className="a-card">
        <h2>Khôi phục dữ liệu demo</h2>
        <p>Đưa nội dung về bộ dữ liệu ban đầu trong thư mục content/. Cần xác nhận trước khi ghi đè.</p>
        <button type="button" className="a-btn a-btn--danger" onClick={doReset}>
          Khôi phục dữ liệu demo
        </button>
      </section>

      {msg && (
        <p className={`a-issue a-issue--${msg.kind === 'ok' ? 'ok' : 'error'} a-pre`} role="status">
          {msg.text}
        </p>
      )}

      <section className="a-card a-card--muted">
        <h2>Lưu ý về lưu trữ cục bộ</h2>
        <ul className="a-list">
          <li>Dữ liệu lưu trong IndexedDB của trình duyệt này, theo từng địa chỉ. Đổi cổng localhost (ví dụ 5173 → 5174) sẽ là một vùng dữ liệu khác, trống.</li>
          <li>Xóa dữ liệu trình duyệt sẽ mất nội dung chưa xuất. Hãy xuất gói nội dung thường xuyên.</li>
          <li>Chưa có xác thực: đây không phải hệ thống quản trị production.</li>
        </ul>
      </section>
    </div>
  );
}
