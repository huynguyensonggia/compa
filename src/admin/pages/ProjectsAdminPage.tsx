import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminData } from '../AdminData';
import { deleteProject, reorderProjects } from '../data/repository';
import { thumbSrc } from '../components/AssetPicker';
import { projectPath, typeOfProject } from '../../content/projectTypes';

export function ProjectsAdminPage() {
  const { records, assets, reload } = useAdminData();
  const [dragId, setDragId] = useState<string | null>(null);
  if (!records) return null;
  const list = records.projects;

  const move = async (from: number, to: number) => {
    if (to < 0 || to >= list.length) return;
    const ids = list.map((p) => p.id);
    const [id] = ids.splice(from, 1);
    ids.splice(to, 0, id);
    await reorderProjects(ids);
    await reload();
  };

  const remove = async (id: string, name: string) => {
    if (!confirm(`Xóa dự án “${name}”? Thao tác này không thể hoàn tác.`)) return;
    await deleteProject(id);
    await reload();
  };

  return (
    <div className="a-page">
      <div className="a-page__head">
        <h1>Dự án</h1>
        <Link to="/admin/du-an/moi" className="a-btn a-btn--primary">
          + Thêm dự án
        </Link>
      </div>
      <p className="a-hint">Thứ tự dưới đây là thứ tự hiển thị trên trang Dự án. Kéo thả hàng hoặc dùng nút ↑/↓.</p>
      <ol className="a-plist">
        {list.map((p, i) => (
          <li
            key={p.id}
            className={`a-prow${dragId === p.id ? ' is-dragging' : ''}`}
            draggable
            onDragStart={() => setDragId(p.id)}
            onDragEnd={() => setDragId(null)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const from = list.findIndex((x) => x.id === dragId);
              if (from >= 0 && from !== i) move(from, i);
              setDragId(null);
            }}
          >
            <span className="a-drag" aria-hidden="true">
              ⋮⋮
            </span>
            <span className="a-prow__thumb">{p.coverAssetId && assets[p.coverAssetId] && <img src={thumbSrc(assets[p.coverAssetId])} alt="" />}</span>
            <span className="a-prow__main">
              <Link to={`/admin/du-an/${p.id}`} className="a-prow__title">
                {p.title.vi || '(chưa đặt tên)'}
              </Link>
              <span className="a-prow__meta">
                {typeOfProject(records.site, p)?.title.vi ?? 'Chưa có danh mục'} · /{p.slug}/ · {p.images.length} ảnh · {p.groups.length} nhóm {p.isDemo && '· minh họa'}
              </span>
            </span>
            <span className={`a-badge ${p.status === 'published' ? 'a-badge--ok' : ''}`}>{p.status === 'published' ? 'Công khai' : 'Nháp'}</span>
            <span className="a-prow__actions">
              <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={`Đưa ${p.title.vi} lên`}>
                ↑
              </button>
              <button
                type="button"
                className="a-btn a-btn--ghost a-btn--sm"
                onClick={() => move(i, i + 1)}
                disabled={i === list.length - 1}
                aria-label={`Đưa ${p.title.vi} xuống`}
              >
                ↓
              </button>
              {p.status === 'published' && projectPath(records.site, p, 'vi') && (
                <a className="a-btn a-btn--ghost a-btn--sm" href={projectPath(records.site, p, 'vi')!} target="_blank" rel="noopener">
                  Xem ↗
                </a>
              )}
              <Link className="a-btn a-btn--sm" to={`/admin/du-an/${p.id}`}>
                Sửa
              </Link>
              <button type="button" className="a-btn a-btn--ghost a-btn--sm a-btn--danger" onClick={() => remove(p.id, p.title.vi)}>
                Xóa
              </button>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
