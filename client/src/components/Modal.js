import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
export default function Modal({ open, onClose, title, children }) {
    useEffect(() => {
        if (!open)
            return;
        const onKey = (e) => { if (e.key === 'Escape')
            onClose(); };
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [open, onClose]);
    if (!open)
        return null;
    return createPortal(_jsx("div", { className: "modal-backdrop", onClick: (e) => { if (e.target === e.currentTarget)
            onClose(); }, children: _jsxs("div", { className: "modal", children: [title && (_jsxs("div", { className: "modal-header", children: [_jsx("div", { className: "modal-title", children: title }), _jsx("button", { className: "modal-close", onClick: onClose, children: "\u00D7" })] })), _jsx("div", { className: "modal-body", children: children })] }) }), document.body);
}
