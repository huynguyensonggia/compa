import { useMemo, useRef, useState, type DragEvent } from 'react';
import type { AssetMap, Bi, FocalPoint, GalleryImage, SpaceGroup } from '../../content/types';
import {
  addGroup,
  appendImages,
  deleteGroup,
  imagesOf,
  moveGroupBefore,
  moveImages,
  removeImages,
  shiftGroup,
  shiftImage,
  sortedGroups,
  type GroupKey,
} from '../data/galleryOps';
import { addAssetsFromFiles } from '../data/repository';
import { newId } from '../data/slug';
import { useAdminData } from '../AdminData';
import { thumbSrc } from './AssetPicker';
import { BiField, Modal } from './ui';

export const DEFAULT_GROUPS: Bi[] = [
  { vi: 'Ngoại thất', en: 'Exterior' },
  { vi: 'Nội thất', en: 'Interior' },
  { vi: 'Sân vườn', en: 'Garden' },
];

interface Props {
  projectId: string;
  groups: SpaceGroup[];
  images: GalleryImage[];
  assets: AssetMap;
  coverAssetId: string | null;
  onChange: (next: { groups: SpaceGroup[]; images: GalleryImage[] }) => void;
  onSetCover: (assetId: string) => void;
}

type Drag = { kind: 'images'; ids: string[] } | { kind: 'group'; id: string } | null;

const UNCLASSIFIED = '__none__';
const keyOf = (g: GroupKey) => g ?? UNCLASSIFIED;
const fromKey = (k: string): GroupKey => (k === UNCLASSIFIED ? null : k);

export function GalleryManager({ projectId, groups, images, assets, coverAssetId, onChange, onSetCover }: Props) {
  const { registerAssets } = useAdminData();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [uploadTarget, setUploadTarget] = useState<string>(UNCLASSIFIED);
  const [moveTarget, setMoveTarget] = useState<string>('');
  const [uploading, setUploading] = useState<string | null>(null);
  const [drag, setDrag] = useState<Drag>(null);
  const [dropHint, setDropHint] = useState<string | null>(null);
  const [editing, setEditing] = useState<GalleryImage | null>(null);
  const [deleting, setDeleting] = useState<SpaceGroup | null>(null);
  const [newGroup, setNewGroup] = useState<Bi>({ vi: '', en: '' });
  const [announce, setAnnounce] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const ordered = useMemo(() => sortedGroups(groups), [groups]);
  const unclassified = imagesOf(images, null);
  const groupName = (g: GroupKey) => (g === null ? 'Chưa phân loại' : ordered.find((x) => x.id === g)?.title.vi || 'Nhóm');

  const commit = (next: { groups?: SpaceGroup[]; images?: GalleryImage[] }, message?: string) => {
    onChange({ groups: next.groups ?? groups, images: next.images ?? images });
    if (message) setAnnounce(message);
  };

  // ----- upload -----
  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const files = Array.from(list); // picker order
    const target = fromKey(uploadTarget);
    setUploading(`Đang xử lý ${files.length} ảnh…`);
    const { assets: recs, failed } = await addAssetsFromFiles(files);
    registerAssets(recs);
    const added: GalleryImage[] = recs.map((r) => ({
      id: newId('img'),
      projectId,
      groupId: target,
      assetId: r.id,
      sortOrder: 0,
      alt: { vi: '', en: '' },
      focalPoint: null,
    }));
    commit({ images: appendImages(images, added, target) }, `Đã thêm ${added.length} ảnh vào ${groupName(target)}.`);
    setUploading(null);
    if (failed.length) alert(`Không đọc được ${failed.length} tệp (không phải ảnh hoặc định dạng không hỗ trợ):\n${failed.join('\n')}`);
    if (fileRef.current) fileRef.current.value = '';
  };

  // ----- selection -----
  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const selectAllIn = (g: GroupKey) => setSelected((s) => new Set([...s, ...imagesOf(images, g).map((i) => i.id)]));

  const moveSelected = () => {
    if (!selected.size || !moveTarget) return;
    const target = fromKey(moveTarget);
    commit({ images: moveImages(groups, images, [...selected], target) }, `Đã chuyển ${selected.size} ảnh vào ${groupName(target)}.`);
    setSelected(new Set());
  };

  const removeSelected = () => {
    if (!selected.size) return;
    if (!confirm(`Xóa ${selected.size} ảnh khỏi gallery của dự án này? (Ảnh dùng ở nơi khác như logo, ảnh mở đầu không bị ảnh hưởng.)`)) return;
    commit({ images: removeImages(images, [...selected]) }, `Đã xóa ${selected.size} ảnh khỏi gallery.`);
    setSelected(new Set());
  };

  // ----- groups -----
  const createGroup = (title: Bi) => {
    if (!title.vi.trim()) return;
    const g: SpaceGroup = { id: newId('grp'), projectId, title: { vi: title.vi.trim(), en: title.en.trim() }, sortOrder: groups.length };
    commit({ groups: addGroup(groups, g) }, `Đã thêm nhóm ${g.title.vi}.`);
  };
  const missingDefaults = DEFAULT_GROUPS.filter((d) => !groups.some((g) => g.title.vi.toLowerCase() === d.vi.toLowerCase()));

  // ----- drag & drop -----
  const startImageDrag = (e: DragEvent, id: string) => {
    const ids = selected.has(id) ? [...selected] : [id];
    setDrag({ kind: 'images', ids });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', ids.join(','));
  };
  const dropOnImage = (e: DragEvent, target: GalleryImage) => {
    e.preventDefault();
    e.stopPropagation();
    setDropHint(null);
    if (drag?.kind !== 'images' || drag.ids.includes(target.id)) return setDrag(null);
    commit({ images: moveImages(groups, images, drag.ids, target.groupId, target.id) }, `Đã di chuyển ${drag.ids.length} ảnh.`);
    setDrag(null);
  };
  const dropOnGroup = (e: DragEvent, g: GroupKey) => {
    e.preventDefault();
    setDropHint(null);
    if (drag?.kind === 'images') {
      commit({ images: moveImages(groups, images, drag.ids, g) }, `Đã chuyển ${drag.ids.length} ảnh vào ${groupName(g)}.`);
    } else if (drag?.kind === 'group' && g !== null) {
      commit({ groups: moveGroupBefore(groups, drag.id, g) }, 'Đã đổi thứ tự nhóm.');
    }
    setDrag(null);
  };

  const renderThumb = (img: GalleryImage, list: GalleryImage[], idx: number) => {
    const a = assets[img.assetId];
    const isSel = selected.has(img.id);
    const missingAlt = !img.alt.vi.trim() || !img.alt.en.trim();
    return (
      <li
        key={img.id}
        className={`a-thumb${isSel ? ' is-selected' : ''}${dropHint === img.id ? ' is-drop' : ''}`}
        draggable
        onDragStart={(e) => startImageDrag(e, img.id)}
        onDragEnd={() => {
          setDrag(null);
          setDropHint(null);
        }}
        onDragOver={(e) => {
          if (drag?.kind === 'images') {
            e.preventDefault();
            e.stopPropagation();
            setDropHint(img.id);
          }
        }}
        onDrop={(e) => dropOnImage(e, img)}
      >
        <label className="a-thumb__select">
          <input type="checkbox" checked={isSel} onChange={() => toggle(img.id)} />
          <span className="visually-hidden">Chọn ảnh {idx + 1}</span>
        </label>
        <button type="button" className="a-thumb__img" onClick={() => setEditing(img)} title="Sửa mô tả, điểm lấy nét">
          {a ? <img src={thumbSrc(a)} alt={img.alt.vi || `Ảnh ${idx + 1}`} loading="lazy" draggable={false} /> : <span>Thiếu ảnh</span>}
          <span className="a-thumb__no">{idx + 1}</span>
          {coverAssetId === img.assetId && <span className="a-thumb__cover">Bìa</span>}
          {missingAlt && <span className="a-thumb__warn" title="Thiếu mô tả ảnh (alt)">alt</span>}
        </button>
        <div className="a-thumb__ctrl">
          <button type="button" onClick={() => commit({ images: shiftImage(images, img.id, -1) })} disabled={idx === 0} aria-label={`Đưa ảnh ${idx + 1} lên trước`}>
            ←
          </button>
          <button
            type="button"
            onClick={() => commit({ images: shiftImage(images, img.id, 1) })}
            disabled={idx === list.length - 1}
            aria-label={`Đưa ảnh ${idx + 1} ra sau`}
          >
            →
          </button>
          <select
            aria-label={`Chuyển ảnh ${idx + 1} sang nhóm`}
            value={keyOf(img.groupId)}
            onChange={(e) => commit({ images: moveImages(groups, images, [img.id], fromKey(e.target.value)) }, `Đã chuyển ảnh sang ${groupName(fromKey(e.target.value))}.`)}
          >
            <option value={UNCLASSIFIED}>Chưa phân loại</option>
            {ordered.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title.vi}
              </option>
            ))}
          </select>
        </div>
      </li>
    );
  };

  const renderSection = (g: SpaceGroup | null, gi: number) => {
    const gid: GroupKey = g ? g.id : null;
    const list = imagesOf(images, gid);
    return (
      <section
        key={keyOf(gid)}
        className={`a-group${g ? '' : ' a-group--none'}${dropHint === keyOf(gid) ? ' is-drop' : ''}`}
        onDragOver={(e) => {
          if (drag) {
            e.preventDefault();
            setDropHint(keyOf(gid));
          }
        }}
        onDragLeave={(e) => {
          if (e.currentTarget === e.target) setDropHint(null);
        }}
        onDrop={(e) => dropOnGroup(e, gid)}
        aria-label={g ? `Nhóm ${g.title.vi}` : 'Chưa phân loại'}
      >
        <header
          className="a-group__head"
          draggable={!!g}
          onDragStart={(e) => {
            if (!g) return;
            setDrag({ kind: 'group', id: g.id });
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', g.id);
          }}
          onDragEnd={() => setDrag(null)}
        >
          {g ? (
            <>
              <span className="a-drag" aria-hidden="true" title="Kéo để đổi thứ tự nhóm">
                ⋮⋮
              </span>
              <div className="a-group__titles">
                <input
                  aria-label="Tên nhóm (tiếng Việt)"
                  value={g.title.vi}
                  onChange={(e) => commit({ groups: groups.map((x) => (x.id === g.id ? { ...x, title: { ...x.title, vi: e.target.value } } : x)) })}
                />
                <input
                  aria-label="Tên nhóm (tiếng Anh)"
                  lang="en"
                  placeholder="English"
                  className={!g.title.en.trim() ? 'is-missing' : ''}
                  value={g.title.en}
                  onChange={(e) => commit({ groups: groups.map((x) => (x.id === g.id ? { ...x, title: { ...x.title, en: e.target.value } } : x)) })}
                />
              </div>
            </>
          ) : (
            <h4 className="a-group__none">Chưa phân loại</h4>
          )}
          <span className="a-group__count">{list.length} ảnh</span>
          <div className="a-group__actions">
            {list.length > 0 && (
              <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={() => selectAllIn(gid)}>
                Chọn tất cả
              </button>
            )}
            {g && (
              <>
                <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={() => commit({ groups: shiftGroup(groups, g.id, -1) })} disabled={gi === 0} aria-label={`Đưa nhóm ${g.title.vi} lên`}>
                  ↑
                </button>
                <button
                  type="button"
                  className="a-btn a-btn--ghost a-btn--sm"
                  onClick={() => commit({ groups: shiftGroup(groups, g.id, 1) })}
                  disabled={gi === ordered.length - 1}
                  aria-label={`Đưa nhóm ${g.title.vi} xuống`}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="a-btn a-btn--ghost a-btn--sm a-btn--danger"
                  onClick={() => {
                    if (!list.length) {
                      if (confirm(`Xóa nhóm "${g.title.vi}"?`)) commit(deleteGroup(groups, images, g.id, { type: 'remove-images' }), 'Đã xóa nhóm.');
                    } else setDeleting(g);
                  }}
                >
                  Xóa nhóm
                </button>
              </>
            )}
          </div>
        </header>
        {list.length ? (
          <ul className="a-thumbs">{list.map((img, i) => renderThumb(img, list, i))}</ul>
        ) : (
          <p className="a-group__empty">{g ? 'Nhóm trống (không hiển thị trên website). Kéo ảnh vào đây hoặc dùng "Chuyển vào nhóm".' : 'Không có ảnh chưa phân loại.'}</p>
        )}
      </section>
    );
  };

  return (
    <div className="a-gallery">
      <p className="visually-hidden" aria-live="polite">
        {announce}
      </p>
      <div className="a-gallery__bar">
        <div className="a-gallery__upload">
          <label>
            Tải ảnh vào{' '}
            <select value={uploadTarget} onChange={(e) => setUploadTarget(e.target.value)}>
              <option value={UNCLASSIFIED}>Chưa phân loại</option>
              {ordered.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title.vi}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="a-btn" onClick={() => fileRef.current?.click()} disabled={!!uploading}>
            {uploading ?? 'Chọn nhiều ảnh…'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
        </div>
        <div className="a-gallery__bulk" aria-label="Thao tác với ảnh đã chọn">
          <span>{selected.size} ảnh đã chọn</span>
          <select value={moveTarget} onChange={(e) => setMoveTarget(e.target.value)} aria-label="Nhóm đích" disabled={!selected.size}>
            <option value="">— Chọn nhóm đích —</option>
            <option value={UNCLASSIFIED}>Chưa phân loại</option>
            {ordered.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title.vi}
              </option>
            ))}
          </select>
          <button type="button" className="a-btn" onClick={moveSelected} disabled={!selected.size || !moveTarget}>
            Chuyển vào nhóm
          </button>
          <button type="button" className="a-btn a-btn--ghost" onClick={() => setSelected(new Set())} disabled={!selected.size}>
            Bỏ chọn
          </button>
          <button type="button" className="a-btn a-btn--ghost a-btn--danger" onClick={removeSelected} disabled={!selected.size}>
            Xóa khỏi gallery
          </button>
        </div>
      </div>
      <p className="a-hint">
        Kéo thả ảnh để sắp thứ tự hoặc chuyển nhóm (kéo nhiều ảnh đã chọn cùng lúc); kéo tiêu đề nhóm để đổi thứ tự nhóm. Có thể dùng nút ←/→, ↑/↓ và ô chọn nhóm thay cho kéo thả.
        Nhấn vào ảnh để nhập mô tả (alt) và điểm lấy nét. Hệ thống không tự đoán không gian — việc phân loại do bạn xác nhận.
      </p>

      {(unclassified.length > 0 || ordered.length === 0) && renderSection(null, -1)}
      {ordered.map((g, i) => renderSection(g, i))}

      <div className="a-gallery__add">
        <BiField label="Thêm nhóm không gian" value={newGroup} onChange={setNewGroup} placeholder={{ vi: 'Ví dụ: Phòng khách', en: 'e.g. Living room' }} />
        <div className="a-toolbar">
          <button
            type="button"
            className="a-btn"
            disabled={!newGroup.vi.trim()}
            onClick={() => {
              createGroup(newGroup);
              setNewGroup({ vi: '', en: '' });
            }}
          >
            Thêm nhóm
          </button>
          {missingDefaults.map((d) => (
            <button key={d.vi} type="button" className="a-btn a-btn--ghost" onClick={() => createGroup(d)}>
              + {d.vi} / {d.en}
            </button>
          ))}
        </div>
      </div>

      {editing && (
      <ImageEditor
        key={editing.id}
        image={editing}
        assets={assets}
        isCover={!!editing && editing.assetId === coverAssetId}
        onClose={() => setEditing(null)}
        onSave={(next) => {
          commit({ images: images.map((i) => (i.id === next.id ? next : i)) }, 'Đã cập nhật thông tin ảnh.');
          setEditing(null);
        }}
        onSetCover={(assetId) => onSetCover(assetId)}
      />
      )}

      <DeleteGroupDialog
        group={deleting}
        groups={ordered}
        count={deleting ? imagesOf(images, deleting.id).length : 0}
        onClose={() => setDeleting(null)}
        onConfirm={(mode) => {
          if (!deleting) return;
          commit(deleteGroup(groups, images, deleting.id, mode), `Đã xóa nhóm ${deleting.title.vi}.`);
          setDeleting(null);
        }}
      />
    </div>
  );
}

function ImageEditor({
  image,
  assets,
  isCover,
  onClose,
  onSave,
  onSetCover,
}: {
  image: GalleryImage;
  assets: AssetMap;
  isCover: boolean;
  onClose: () => void;
  onSave: (img: GalleryImage) => void;
  onSetCover: (assetId: string) => void;
}) {
  const [current, setDraft] = useState<GalleryImage>(image);
  const a = assets[current.assetId];
  const fp: FocalPoint = current.focalPoint ?? null;
  const setFp = (x: number, y: number) => setDraft({ ...current, focalPoint: { x, y } });
  return (
    <Modal open title="Thông tin ảnh" onClose={onClose} wide>
      {(
        <div className="a-imgedit">
          <div className="a-imgedit__preview">
            <button
              type="button"
              className="a-focal"
              aria-label="Nhấn lên ảnh để đặt điểm lấy nét"
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                setFp(Math.round(((e.clientX - r.left) / r.width) * 100) / 100, Math.round(((e.clientY - r.top) / r.height) * 100) / 100);
              }}
            >
              {a && <img src={a.src} alt="" />}
              {fp && <span className="a-focal__dot" style={{ left: `${fp.x * 100}%`, top: `${fp.y * 100}%` }} />}
            </button>
            <p className="a-hint">
              Điểm lấy nét: {fp ? `${Math.round(fp.x * 100)}% / ${Math.round(fp.y * 100)}%` : 'giữa ảnh (mặc định)'}{' '}
              {fp && (
                <button type="button" className="a-link" onClick={() => setDraft({ ...current, focalPoint: null })}>
                  Đặt lại
                </button>
              )}
            </p>
          </div>
          <div>
            <BiField
              label="Mô tả ảnh (alt)"
              value={current.alt}
              onChange={(alt) => setDraft({ ...current, alt })}
              multiline
              rows={2}
              hint='Mô tả đúng nội dung ảnh, ví dụ "Mặt tiền nhà vườn mái ngói ở Cẩm Thanh, Hội An". Không ghi "ảnh 1", không nhồi từ khóa.'
            />
            <div className="a-toolbar">
              <button type="button" className="a-btn a-btn--primary" onClick={() => onSave(current)}>
                Áp dụng
              </button>
              <button type="button" className="a-btn" onClick={() => onSetCover(current.assetId)} disabled={isCover}>
                {isCover ? 'Đang là ảnh bìa' : 'Đặt làm ảnh bìa'}
              </button>
            </div>
            {a?.sourceUrl && (
              <p className="a-hint">
                Nguồn: {a.sourceUrl} — {a.license}
              </p>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

function DeleteGroupDialog({
  group,
  groups,
  count,
  onClose,
  onConfirm,
}: {
  group: SpaceGroup | null;
  groups: SpaceGroup[];
  count: number;
  onClose: () => void;
  onConfirm: (mode: Parameters<typeof deleteGroup>[3]) => void;
}) {
  const others = groups.filter((g) => g.id !== group?.id);
  const [choice, setChoice] = useState<string>('none');
  return (
    <Modal open={!!group} title={`Xóa nhóm "${group?.title.vi ?? ''}"`} onClose={onClose}>
      <p>Nhóm này có {count} ảnh. Bạn muốn xử lý các ảnh này thế nào?</p>
      <div className="a-radios">
        {others.map((g) => (
          <label key={g.id}>
            <input type="radio" name="del-mode" value={g.id} checked={choice === g.id} onChange={() => setChoice(g.id)} /> Chuyển sang nhóm “{g.title.vi}”
          </label>
        ))}
        <label>
          <input type="radio" name="del-mode" value="none" checked={choice === 'none'} onChange={() => setChoice('none')} /> Đưa về “Chưa phân loại”
        </label>
        <label>
          <input type="radio" name="del-mode" value="remove" checked={choice === 'remove'} onChange={() => setChoice('remove')} /> Xóa {count} ảnh khỏi gallery (ảnh
          gốc dùng ở nơi khác không bị xóa)
        </label>
      </div>
      <div className="a-toolbar">
        <button
          type="button"
          className="a-btn a-btn--danger"
          onClick={() => onConfirm(choice === 'remove' ? { type: 'remove-images' } : { type: 'move', target: choice === 'none' ? null : choice })}
        >
          Xóa nhóm
        </button>
        <button type="button" className="a-btn a-btn--ghost" onClick={onClose}>
          Hủy
        </button>
      </div>
    </Modal>
  );
}
