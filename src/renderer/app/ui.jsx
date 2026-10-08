import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './icons.jsx';
import { avatarColor, initialsOf } from './utils.js';

// ── En-tête de page (dégradé ClassPro) ──────────────────────────────────────
export function PageHeader({ badge, badgeIcon, title, sub, actions, stats, onBack, backLabel = 'Retour', children, compact }) {
  return (
    <div className={`page-hd ${compact ? 'compact' : ''}`}>
      <div className="hd-drag" />
      <div style={{ position: 'relative', zIndex: 1, minWidth: 0, flex: 1 }}>
        {onBack && <button className="phd-back" onClick={onBack}><Icon name="arrowLeft" />{backLabel}</button>}
        {badge && <div className="phd-badge">{badgeIcon && <Icon name={badgeIcon} />}{badge}</div>}
        <div className="phd-title">{title}</div>
        {sub && <div className="phd-sub">{sub}</div>}
      </div>
      {actions && <div className="phd-actions">{actions}</div>}
      {stats && (
        <div className="phd-stats">
          {stats.map((s) => (
            <div className="phstat" key={s.label}>
              <div className="phstat-label">{s.label}</div>
              <div className="phstat-value">{s.value}{s.unit && <small>{s.unit}</small>}</div>
            </div>
          ))}
        </div>
      )}
      {children}
    </div>
  );
}

export function Empty({ icon = 'info', title, sub, children }) {
  return (
    <div className="empty">
      <div className="empty-icon"><Icon name={icon} /></div>
      <div className="empty-title">{title}</div>
      {sub && <div className="empty-sub">{sub}</div>}
      {children && <div className="row mt-1" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>{children}</div>}
    </div>
  );
}

/** Champ de formulaire : libellé, aide sous le champ, et bulle « ? » facultative. */
export function Field({ label, hint, help, children, style, required, as = 'label', className = '' }) {
  const Tag = as;
  return (
    <Tag className={`field ${className}`} style={style}>
      {label && (
        <span className="field-label">
          {label}{required && <span className="req" aria-label="obligatoire"> *</span>}
          {help && <HelpTip text={help} />}
        </span>
      )}
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </Tag>
  );
}

/** Petite bulle d'aide au survol / clic. */
export function HelpTip({ text, side = 'bottom' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const h = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  return (
    <span className="helptip" ref={ref} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button type="button" className="helptip-btn" aria-label="Aide" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((o) => !o); }}>?</button>
      {open && <span className={`helptip-pop ${side}`} role="tooltip">{text}</span>}
    </span>
  );
}

/** Encadré de conseil (pédagogique ou pratique). */
export function Callout({ icon = 'bulb', tone = 'accent', title, children, onClose, action }) {
  return (
    <div className={`callout ${tone}`}>
      <div className="callout-icon"><Icon name={icon} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && <div className="callout-title">{title}</div>}
        <div className="callout-text">{children}</div>
        {action && <div className="mt-1">{action}</div>}
      </div>
      {onClose && <button className="btn btn-quiet btn-icon btn-sm" onClick={onClose} aria-label="Masquer ce conseil"><Icon name="x" /></button>}
    </div>
  );
}

/** Section repliable (« Options avancées »). */
export function Collapse({ title, icon = 'settings', defaultOpen = false, children, count, sub }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`collapse ${open ? 'open' : ''}`}>
      <button type="button" className="collapse-hd" onClick={() => setOpen(!open)} aria-expanded={open}>
        <Icon name={icon} />
        <span className="collapse-title">{title}{sub && <small>{sub}</small>}</span>
        {count ? <span className="pill accent">{count}</span> : null}
        <Icon name={open ? 'chevronUp' : 'chevronDown'} className="collapse-chev" />
      </button>
      {open && <div className="collapse-body">{children}</div>}
    </div>
  );
}

export function Avatar({ name, size = 30, kind }) {
  const bg = kind === 'me' ? 'linear-gradient(135deg,#3b5bdb,#7c3aed)' : kind === 'system' ? '#64748b' : avatarColor(name || '');
  return (
    <span className="avatar" style={{ width: size, height: size, background: bg, fontSize: size * 0.38 }} aria-hidden="true">
      {kind === 'me' ? <Icon name="user" /> : kind === 'group' ? <Icon name="users2" /> : kind === 'system' ? <Icon name="info" /> : initialsOf(name)}
    </span>
  );
}

export function Switch({ checked, onChange, label, hint }) {
  return (
    <label className="switch">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="track" />
      <span>{label}{hint && <small className="switch-hint">{hint}</small>}</span>
    </label>
  );
}

export function Seg({ value, options, onChange, block, size }) {
  return (
    <div className={`seg ${block ? 'block' : ''} ${size || ''}`} role="radiogroup">
      {options.map((o) => (
        <button key={String(o.value)} type="button" role="radio" aria-checked={value === o.value} className={value === o.value ? 'on' : ''} onClick={() => onChange(o.value)} title={o.title}>
          {o.icon && <Icon name={o.icon} />}{o.label}
        </button>
      ))}
    </div>
  );
}

/** Zone de texte qui grandit avec son contenu. */
export function AutoText({ value, onChange, minRows = 2, className = '', ...rest }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [value]);
  return <textarea ref={ref} rows={minRows} className={`textarea ${className}`} value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...rest} />;
}

// ── Modale ──────────────────────────────────────────────────────────────────
export function Modal({ title, sub, icon = 'info', onClose, children, footer, size, bodyStyle, className = '' }) {
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return createPortal(
    <div className="modal-back" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className={`modal ${size || ''} ${className}`} role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined}>
        <div className="modal-hd">
          <div className="modal-hd-icon"><Icon name={icon} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="modal-title">{title}</div>
            {sub && <div className="modal-sub">{sub}</div>}
          </div>
          {onClose && <button className="btn btn-quiet btn-icon" onClick={onClose} aria-label="Fermer"><Icon name="x" /></button>}
        </div>
        <div className="modal-body" style={bodyStyle}>{children}</div>
        {footer && <div className="modal-ft">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

// ── Confirmation ────────────────────────────────────────────────────────────
const ConfirmCtx = createContext(null);
export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const confirm = useCallback((opts) => new Promise((resolve) => setState({ ...opts, resolve })), []);
  const close = (v) => { state?.resolve(v); setState(null); };
  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      {state && (
        <Modal title={state.title || 'Confirmer'} icon={state.danger ? 'alert' : 'info'} onClose={() => close(false)}
          footer={<>
            <button className="btn" onClick={() => close(false)}>{state.cancelLabel || 'Annuler'}</button>
            <button className={`btn ${state.danger ? 'btn-danger' : 'btn-primary'}`} onClick={() => close(true)} autoFocus>{state.confirmLabel || 'Confirmer'}</button>
          </>}>
          <div style={{ fontSize: '.86rem', lineHeight: 1.6, color: 'var(--text2)' }}>{state.message}</div>
        </Modal>
      )}
    </ConfirmCtx.Provider>
  );
}
export const useConfirm = () => useContext(ConfirmCtx);

// ── Menu déroulant ──────────────────────────────────────────────────────────
export function Menu({ trigger, items, align = 'right' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const h = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  return (
    <div className="menu-wrap" ref={ref} onClick={(e) => e.stopPropagation()}>
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div className={`menu ${align === 'left' ? 'left' : ''}`}>
          {items.filter(Boolean).map((it, i) => (it === '-' ? <div key={i} className="menu-sep" /> : (
            <button key={i} className={`menu-item ${it.danger ? 'danger' : ''}`} disabled={it.disabled} onClick={() => { setOpen(false); it.onClick(); }}>
              {it.icon && <Icon name={it.icon} />}
              <span>{it.label}{it.hint && <small>{it.hint}</small>}</span>
            </button>
          )))}
        </div>
      )}
    </div>
  );
}
