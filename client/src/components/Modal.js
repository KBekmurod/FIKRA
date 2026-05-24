import { useEffect } from 'react';
import { createPortal } from 'react-dom';
export default function Modal(_a) {
    var open = _a.open, onClose = _a.onClose, title = _a.title, children = _a.children;
    useEffect(function () {
        if (!open)
            return;
        var onKey = function (e) { if (e.key === 'Escape')
            onClose(); };
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return function () {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [open, onClose]);
    if (!open)
        return null;
    return createPortal(<div className="modal-backdrop" onClick={function (e) { if (e.target === e.currentTarget)
        onClose(); }}>
      <div className="modal">
        {title && (<div className="modal-header">
            <div className="modal-title">{title}</div>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>)}
        <div className="modal-body">{children}</div>
      </div>
    </div>, document.body);
}
