import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { miscApi } from '../api/endpoints';
export default function AnnouncementBanner() {
    const [ann, setAnn] = useState(null);
    const [closed, setClosed] = useState(false);
    useEffect(() => {
        miscApi.activeAnnouncement().then(res => {
            if (res.data.announcement) {
                // Check if user already dismissed this specific announcement
                const dismissedId = localStorage.getItem('fikra_dismissed_announcement');
                if (dismissedId !== res.data.announcement._id) {
                    setAnn(res.data.announcement);
                }
            }
        }).catch(() => { });
    }, []);
    if (!ann || closed)
        return null;
    const typeStyles = {
        info: { bg: 'var(--s2)', color: 'var(--txt)', icon: 'ℹ️' },
        success: { bg: 'rgba(0,212,170,0.1)', color: 'var(--g)', icon: '🎉' },
        warning: { bg: 'rgba(255,204,68,0.1)', color: 'var(--y)', icon: '⚠️' },
        error: { bg: 'rgba(255,95,126,0.1)', color: 'var(--r)', icon: '🚨' }
    };
    const s = typeStyles[ann.type] || typeStyles.info;
    const handleClose = () => {
        localStorage.setItem('fikra_dismissed_announcement', ann._id);
        setClosed(true);
    };
    return (_jsxs("div", { style: {
            background: s.bg,
            border: `1px solid ${s.color}44`,
            padding: '12px 16px',
            margin: '12px 16px',
            borderRadius: 12,
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
            position: 'relative'
        }, children: [_jsx("div", { style: { fontSize: 18 }, children: s.icon }), _jsxs("div", { style: { flex: 1, paddingRight: 20 }, children: [_jsx("div", { style: { fontWeight: 800, fontSize: 13, color: s.color, marginBottom: 4 }, children: ann.title }), _jsx("div", { style: { fontSize: 12, color: 'var(--txt)', lineHeight: 1.4 }, children: ann.message })] }), _jsx("button", { onClick: handleClose, style: {
                    position: 'absolute', top: 12, right: 12,
                    background: 'transparent', border: 'none', color: 'var(--txt-3)',
                    fontSize: 16, cursor: 'pointer', padding: 4
                }, children: "\u00D7" })] }));
}
