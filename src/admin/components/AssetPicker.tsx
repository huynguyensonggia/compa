import { useRef, useState } from 'react';
import type { AssetMap, AssetRecord } from '../../content/types';
import { addAssetsFromFiles } from '../data/repository';
import { Modal } from './ui';
import { useAdminData } from '../AdminData';

interface Props {
  open: boolean;
  title: string;
  /** Asset ids offered first (e.g. this project's gallery). */
  suggested?: string[];
  allAssets: AssetMap;
  onClose: () => void;
  onPick: (assetId: string, record?: AssetRecord) => void;
}

/** Choose an existing image or upload a new one from this device. */
export function AssetPicker({ open, title, suggested, allAssets, onClose, onPick }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { registerAssets } = useAdminData();
  const [showAll, setShowAll] = useState(!suggested?.length);
  const [busy, setBusy] = useState(false);
  const ids = showAll ? Object.keys(allAssets) : suggested ?? [];

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    const { assets, failed } = await addAssetsFromFiles([files[0]]);
    setBusy(false);
    if (failed.length) alert(`Không đọc được ảnh: ${failed.join(', ')}`);
    if (assets[0]) {
      registerAssets(assets);
      onPick(assets[0].id, assets[0]);
    }
  };

  return (
    <Modal open={open} title={title} onClose={onClose} wide>
      <div className="a-toolbar">
        <button type="button" className="a-btn" onClick={() => fileRef.current?.click()} disabled={busy}>
          {busy ? 'Đang xử lý…' : 'Tải ảnh từ máy…'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files)} />
        {suggested?.length ? (
          <label className="a-check">
            <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} /> Hiện tất cả ảnh trong thư viện
          </label>
        ) : null}
      </div>
      <ul className="a-picker">
        {ids.map((id) => {
          const a = allAssets[id];
          if (!a) return null;
          return (
            <li key={id}>
              <button type="button" onClick={() => onPick(id)} className="a-picker__item">
                <img src={a.srcSet ? a.src.replace('-960.webp', '-480.webp') : a.src} alt="" loading="lazy" />
                <span className="visually-hidden">Chọn ảnh {id}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}

export function thumbSrc(a: { src: string; srcSet?: string } | undefined) {
  if (!a) return '';
  return a.srcSet ? a.src.replace('-960.webp', '-480.webp') : a.src;
}
