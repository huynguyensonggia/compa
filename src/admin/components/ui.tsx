import { useEffect, useId, useRef, type ReactNode } from 'react';
import type { Bi } from '../../content/types';
import { missingTranslation } from '../data/validate';

/** Warn before leaving a form with unsaved changes (reload/close tab and in-app links). */
export function useUnsavedGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const message = 'Bạn có thay đổi chưa lưu. Rời trang và bỏ các thay đổi này?';
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message;
    };
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!a || a.target === '_blank' || a.hasAttribute('download') || a.origin !== location.origin) return;
      if (a.pathname === location.pathname) return;
      if (!window.confirm(message)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('click', onClick, true);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('click', onClick, true);
    };
  }, [dirty]);
}

export function Field({ label, hint, children, counter }: { label: string; hint?: ReactNode; children: (id: string) => ReactNode; counter?: ReactNode }) {
  const id = useId();
  return (
    <div className="a-field">
      <div className="a-field__top">
        <label htmlFor={id}>{label}</label>
        {counter}
      </div>
      {children(id)}
      {hint && <p className="a-hint">{hint}</p>}
    </div>
  );
}

export function Counter({ value, min, max }: { value: string; min?: number; max: number }) {
  const n = value.length;
  const state = n === 0 ? '' : n > max || (min && n < min) ? 'is-warn' : 'is-ok';
  return (
    <span className={`a-counter ${state}`}>
      {n}
      {min ? ` / ${min}–${max}` : ` / ${max}`} ký tự
    </span>
  );
}

interface BiFieldProps {
  label: string;
  value: Bi;
  onChange: (v: Bi) => void;
  multiline?: boolean;
  rows?: number;
  required?: boolean;
  counter?: { min?: number; max: number };
  placeholder?: Partial<Bi>;
  hint?: ReactNode;
}

/** Vietnamese + English inputs side by side, flagging a missing translation. */
export function BiField({ label, value, onChange, multiline, rows = 4, required, counter, placeholder, hint }: BiFieldProps) {
  const id = useId();
  const missing = missingTranslation(value);
  return (
    <fieldset className="a-bifield">
      <legend>
        {label}
        {required && <span className="a-req"> *</span>}
        {missing && <span className="a-badge a-badge--warn">Thiếu bản {missing === 'en' ? 'tiếng Anh' : 'tiếng Việt'}</span>}
      </legend>
      <div className="a-bifield__cols">
        {(['vi', 'en'] as const).map((l) => (
          <div key={l} className="a-bifield__col">
            <div className="a-field__top">
              <label htmlFor={`${id}-${l}`}>{l === 'vi' ? 'Tiếng Việt' : 'English'}</label>
              {counter && <Counter value={value[l]} {...counter} />}
            </div>
            {multiline ? (
              <textarea
                id={`${id}-${l}`}
                rows={rows}
                value={value[l]}
                placeholder={placeholder?.[l]}
                lang={l}
                onChange={(e) => onChange({ ...value, [l]: e.target.value })}
              />
            ) : (
              <input
                id={`${id}-${l}`}
                type="text"
                value={value[l]}
                placeholder={placeholder?.[l]}
                lang={l}
                onChange={(e) => onChange({ ...value, [l]: e.target.value })}
              />
            )}
          </div>
        ))}
      </div>
      {hint && <p className="a-hint">{hint}</p>}
    </fieldset>
  );
}

/** Accessible modal dialog built on <dialog>. */
export function Modal({ open, title, onClose, children, wide }: { open: boolean; title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className={`a-modal${wide ? ' a-modal--wide' : ''}`} aria-labelledby={titleId} onClose={onClose} onCancel={onClose}>
      {open && (
        <>
          <div className="a-modal__head">
            <h2 id={titleId}>{title}</h2>
            <button type="button" className="a-btn a-btn--ghost" onClick={onClose} aria-label="Đóng">
              ✕
            </button>
          </div>
          <div className="a-modal__body">{children}</div>
        </>
      )}
    </dialog>
  );
}

export function SaveState({ dirty, savedAt }: { dirty: boolean; savedAt: string | null }) {
  return (
    <span className={`a-savestate ${dirty ? 'is-dirty' : 'is-clean'}`} role="status">
      {dirty ? '● Có thay đổi chưa lưu' : savedAt ? `✓ Đã lưu lúc ${savedAt}` : '✓ Đã lưu'}
    </span>
  );
}

export function IssueList({ issues }: { issues: Array<{ level: 'error' | 'warning'; message: string }> }) {
  if (!issues.length) return null;
  return (
    <ul className="a-issues" role="alert">
      {issues.map((i, idx) => (
        <li key={idx} className={`a-issue a-issue--${i.level}`}>
          {i.level === 'error' ? 'Lỗi: ' : 'Lưu ý: '}
          {i.message}
        </li>
      ))}
    </ul>
  );
}

export const timeNow = () => new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
