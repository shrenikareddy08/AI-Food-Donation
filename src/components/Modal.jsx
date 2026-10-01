import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../utils/cn';

export default function Modal({ open, onClose, title, children, footer, size = 'md', className }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className={cn('modal', `modal--${size}`, 'animate-scale-in', className)}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="modal__header">
            <h2 className="modal__title">{title}</h2>
            <button className="modal__close" onClick={onClose} aria-label="Close modal">
              <X size={20} />
            </button>
          </div>
        )}
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
