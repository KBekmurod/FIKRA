import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
export default function InstallPWA() {
    const [supportsPWA, setSupportsPWA] = useState(false);
    const [promptInstall, setPromptInstall] = useState(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [activeTab, setActiveTab] = useState('native');
    const [copied, setCopied] = useState(false);
    const appUrl = window.location.origin;
    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setSupportsPWA(true);
            setPromptInstall(e);
        };
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
        }
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);
    useEffect(() => {
        if (!isInstalled) {
            setShowModal(true);
            setActiveTab(supportsPWA ? 'native' : 'manual');
        }
    }, [isInstalled, supportsPWA]);
    const handleNativeInstall = (evt) => {
        evt.preventDefault();
        if (!promptInstall) {
            setActiveTab('manual');
            return;
        }
        promptInstall.prompt();
        promptInstall.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                setIsInstalled(true);
                setShowModal(false);
            }
        });
    };
    const copyUrl = () => {
        navigator.clipboard.writeText(appUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    const openInChrome = () => {
        window.open(appUrl, '_blank');
    };
    if (isInstalled)
        return null;
    return (_jsxs(_Fragment, { children: [!showModal && (_jsxs("div", { onClick: () => setShowModal(true), style: {
                    position: 'fixed',
                    bottom: '80px',
                    left: '20px',
                    right: '20px',
                    background: 'var(--acc)',
                    color: 'white',
                    padding: '15px',
                    borderRadius: '15px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    animation: 'slideUp 0.5s ease-out',
                    cursor: 'pointer',
                    transition: 'transform 0.2s'
                }, onMouseEnter: (e) => (e.currentTarget.style.transform = 'scale(1.02)'), onMouseLeave: (e) => (e.currentTarget.style.transform = 'scale(1)'), children: [_jsxs("div", { children: [_jsx("h4", { style: { margin: 0, fontSize: '16px', fontWeight: 'bold' }, children: "\uD83D\uDCF1 Ilovani o'rnating" }), _jsx("p", { style: { margin: '5px 0 0', fontSize: '13px', opacity: 0.9 }, children: "Ilovani telefonga qo'shing, keyin tez ochiladi va qulay ishlaydi" })] }), _jsx("button", { onClick: (e) => {
                            e.stopPropagation();
                            setShowModal(true);
                        }, style: {
                            background: 'white',
                            color: 'var(--acc)',
                            border: 'none',
                            padding: '8px 15px',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            marginLeft: '10px'
                        }, children: supportsPWA ? "O'rnatish" : "Ko'rsatma" })] })), showModal && (_jsx("div", { style: {
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'flex-end',
                    zIndex: 2000,
                    animation: 'fadeIn 0.3s'
                }, onClick: () => setShowModal(false), children: _jsxs("div", { onClick: (e) => e.stopPropagation(), style: {
                        width: '100%',
                        background: 'var(--bg)',
                        borderTopLeftRadius: '20px',
                        borderTopRightRadius: '20px',
                        padding: '20px',
                        maxHeight: '80vh',
                        overflowY: 'auto',
                        animation: 'slideUp 0.3s'
                    }, children: [_jsxs("div", { style: {
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '20px'
                            }, children: [_jsx("h2", { style: { margin: 0, fontSize: '20px' }, children: "\uD83D\uDCF1 Ilovani o'rnating" }), _jsx("button", { onClick: () => setShowModal(false), style: {
                                        background: 'none',
                                        border: 'none',
                                        fontSize: '20px',
                                        cursor: 'pointer',
                                        color: 'var(--txt-2)'
                                    }, children: "\u2715" })] }), _jsxs("div", { style: { display: 'flex', gap: '10px', marginBottom: '20px' }, children: [_jsx("button", { onClick: () => setActiveTab('native'), style: {
                                        flex: 1,
                                        padding: '10px',
                                        background: activeTab === 'native' ? 'var(--acc)' : 'var(--s2)',
                                        color: activeTab === 'native' ? 'white' : 'var(--txt-2)',
                                        border: 'none',
                                        borderRadius: '10px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }, children: "\u26A1 Tez" }), _jsx("button", { onClick: () => setActiveTab('manual'), style: {
                                        flex: 1,
                                        padding: '10px',
                                        background: activeTab === 'manual' ? 'var(--acc)' : 'var(--s2)',
                                        color: activeTab === 'manual' ? 'white' : 'var(--txt-2)',
                                        border: 'none',
                                        borderRadius: '10px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }, children: "\uD83D\uDCD6 Qo'lda" })] }), activeTab === 'native' && (_jsxs("div", { children: [_jsx("p", { style: { margin: '0 0 15px', color: 'var(--txt-2)', fontSize: '14px', lineHeight: 1.6 }, children: "Brauzer o'rnatishga ruxsat bersa, quyidagi tugma bilan ilovani qo'shasiz. Agar Telegram ichida bo'lsangiz yoki tugma chiqmasa, Qo'lda bo'limiga o'ting." }), _jsx("button", { onClick: handleNativeInstall, style: {
                                        width: '100%',
                                        padding: '15px',
                                        background: 'var(--acc)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '10px',
                                        fontWeight: 'bold',
                                        fontSize: '16px',
                                        cursor: 'pointer',
                                        marginBottom: '15px'
                                    }, children: "\u2B07\uFE0F Ilovani o'rnating" }), !promptInstall && (_jsx("p", { style: {
                                        margin: '10px 0 0',
                                        padding: '10px',
                                        background: 'var(--s2)',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        color: 'var(--txt-3)'
                                    }, children: "\u2139\uFE0F Telegram ichidan o'tgansiz? Qo'lda yo'nalishdan foydalaning." }))] })), activeTab === 'manual' && (_jsxs("div", { children: [_jsxs("div", { style: {
                                        background: 'var(--s2)',
                                        padding: '15px',
                                        borderRadius: '10px',
                                        marginBottom: '15px'
                                    }, children: [_jsx("p", { style: { margin: '0 0 10px 0', fontWeight: 'bold', fontSize: '12px' }, children: "\uD83D\uDCCC Ilovaning URL manzili:" }), _jsxs("div", { style: {
                                                background: 'var(--bg)',
                                                padding: '10px',
                                                borderRadius: '8px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                gap: '10px',
                                                marginBottom: '10px',
                                                borderLeft: '3px solid var(--acc)'
                                            }, children: [_jsx("code", { style: {
                                                        fontSize: '11px',
                                                        color: 'var(--acc)',
                                                        flex: 1,
                                                        wordBreak: 'break-all',
                                                        fontFamily: 'monospace'
                                                    }, children: appUrl }), _jsx("button", { onClick: copyUrl, style: {
                                                        padding: '8px 12px',
                                                        background: copied ? 'var(--g)' : 'var(--acc)',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        fontSize: '12px',
                                                        fontWeight: 'bold',
                                                        cursor: 'pointer',
                                                        whiteSpace: 'nowrap',
                                                        transition: 'all 0.3s'
                                                    }, children: copied ? '✓ Nusxalandi' : 'Nusxalash' })] })] }), _jsxs("div", { style: {
                                        background: 'var(--s2)',
                                        padding: '15px',
                                        borderRadius: '10px'
                                    }, children: [_jsxs("div", { style: {
                                                marginBottom: '12px',
                                                padding: '10px 12px',
                                                borderRadius: '8px',
                                                background: 'rgba(123,104,238,0.08)',
                                                color: 'var(--txt-2)',
                                                fontSize: '12px',
                                                lineHeight: 1.6,
                                                border: '1px solid rgba(123,104,238,0.18)'
                                            }, children: ["Bu usul Telegram ichida ham ishlaydi. Avval URL ni nusxalang, Chrome\u2019da oching, so\u2018ng menyudan", _jsx("strong", { children: " \u201CEkranga qo\u2018shish\u201D" }), " yoki ", _jsx("strong", { children: " \u201CIlovani o\u2018rnatish\u201D" }), " ni bosing."] }), _jsx("p", { style: {
                                                margin: '0 0 12px 0',
                                                fontWeight: 'bold',
                                                fontSize: '12px'
                                            }, children: "\uD83D\uDCF1 Bosqichma-bosqich:" }), _jsxs("ol", { style: {
                                                margin: 0,
                                                paddingLeft: '20px',
                                                fontSize: '13px',
                                                lineHeight: '1.8',
                                                color: 'var(--txt-2)'
                                            }, children: [_jsxs("li", { children: [_jsx("strong", { children: "Chrome ochib" }), " qo'shimcha browser orqali"] }), _jsxs("li", { children: [_jsx("strong", { children: "URL nusxasini paste" }), " qilib manzil sariyasiga kiriting"] }), _jsxs("li", { children: [_jsx("strong", { children: "3 nuqta tugmasini bosing" }), " (\u22EE) o\u02BBng burchakda"] }), _jsxs("li", { children: [_jsx("strong", { children: "\"Ekranga qo\u02BBshish\"" }), " yoki ", _jsx("strong", { children: "\"O'rnatish\"" }), " bosing"] }), _jsxs("li", { children: [_jsx("strong", { children: "Tayyor!" }), " Ilovasi smartfonyungizda paydo bo\u02BBladi"] })] })] }), _jsx("button", { onClick: openInChrome, style: {
                                        width: '100%',
                                        padding: '12px',
                                        background: 'var(--acc)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '10px',
                                        fontWeight: 'bold',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        marginTop: '15px'
                                    }, children: "\uD83C\uDF10 Chrome-da ochish" })] })), _jsx("button", { onClick: () => setShowModal(false), style: {
                                width: '100%',
                                padding: '12px',
                                background: 'var(--s2)',
                                color: 'var(--txt-2)',
                                border: 'none',
                                borderRadius: '10px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                marginTop: '10px'
                            }, children: "Yopish" })] }) })), _jsx("style", { children: `
          @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        ` })] }));
}
