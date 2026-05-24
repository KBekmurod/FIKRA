import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { folderApi } from '../api/endpoints';
import { useToast } from '../components/Toast';
import { triggerHaptic } from '../utils/haptics';
export default function FlashcardPage() {
    const { folderId } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [deck, setDeck] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const fetchDeck = async () => {
        if (!folderId)
            return;
        try {
            const { data } = await folderApi.getFlashcards(folderId);
            if (data.status === 'not_found') {
                setDeck(null);
            }
            else {
                setDeck(data);
            }
        }
        catch (e) {
            toast.error('Flashcardlarni yuklashda xatolik');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchDeck();
    }, [folderId]);
    useEffect(() => {
        if (deck?.status === 'generating') {
            const interval = setInterval(fetchDeck, 3000);
            return () => clearInterval(interval);
        }
    }, [deck]);
    const handleGenerate = async () => {
        if (!folderId)
            return;
        setGenerating(true);
        try {
            const { data } = await folderApi.generateFlashcards(folderId);
            setDeck(data);
        }
        catch (e) {
            toast.error(e.response?.data?.error || 'Generatsiyada xatolik');
        }
        finally {
            setGenerating(false);
        }
    };
    const goBack = () => navigate(-1);
    if (loading) {
        return (_jsx("div", { className: "full-loader", children: _jsx("div", { className: "spin" }) }));
    }
    if (!deck || deck.status === 'failed') {
        return (_jsxs("div", { style: { padding: 20, textAlign: 'center', marginTop: 100 }, children: [_jsx("h2", { children: "FIKRA Flash \u26A1" }), _jsx("p", { style: { color: 'var(--txt-2)', margin: '20px 0' }, children: "Mavzuni tezkor takrorlash uchun AI tomonidan Flashcardlar yaratamiz." }), _jsx("button", { className: "btn btn-primary", onClick: handleGenerate, disabled: generating, children: generating ? _jsxs(_Fragment, { children: [_jsx("div", { className: "spin" }), " Yaratilmoqda..."] }) : 'Flashcard Yaratish' })] }));
    }
    if (deck.status === 'generating') {
        return (_jsxs("div", { className: "full-loader", children: [_jsx("div", { className: "spin", style: { width: 40, height: 40 } }), _jsxs("div", { className: "full-loader-text", children: ["FIKRA ", _jsx("span", { children: "Flash" })] }), _jsx("div", { style: { color: 'var(--txt-2)' }, children: "Kartochkalar yaratilmoqda..." })] }));
    }
    const cards = deck.cards || [];
    if (currentIndex >= cards.length) {
        return (_jsxs("div", { style: { padding: 20, textAlign: 'center', marginTop: 100 }, children: [_jsx("h2", { children: "Ajoyib! \uD83C\uDF89" }), _jsx("p", { style: { color: 'var(--txt-2)', margin: '20px 0' }, children: "Barcha kartochkalarni takrorladingiz." }), _jsx("button", { className: "btn btn-primary", onClick: () => setCurrentIndex(0), children: "Qaytadan boshlash" }), _jsx("button", { className: "btn btn-ghost", onClick: goBack, style: { marginLeft: 10 }, children: "Ortga" })] }));
    }
    return (_jsxs("div", { style: {
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            background: 'var(--bg)'
        }, children: [_jsxs("div", { className: "header", children: [_jsx("button", { onClick: goBack, style: {
                            background: 'none', border: 'none', color: 'var(--txt-2)',
                            fontSize: 22, cursor: 'pointer', padding: 0, marginRight: 8,
                        }, children: "\u2190" }), _jsxs("div", { className: "header-logo", children: ["FIKRA ", _jsx("span", { children: "Flash" }), " \u26A1"] }), _jsxs("div", { style: { fontWeight: 700, color: 'var(--txt-2)' }, children: [currentIndex + 1, " / ", cards.length] })] }), _jsx("div", { style: {
                    flex: 1,
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    perspective: 1200
                }, children: _jsx(AnimatePresence, { children: _jsx(SwipeCard, { card: cards[currentIndex], onSwipe: () => {
                            triggerHaptic('swipe');
                            setCurrentIndex(c => c + 1);
                        } }, currentIndex) }) })] }));
}
function SwipeCard({ card, onSwipe }) {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-15, 15]);
    const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
    const [flipped, setFlipped] = useState(false);
    const handleDragEnd = (e, info) => {
        if (Math.abs(info.offset.x) > 100) {
            onSwipe();
        }
    };
    return (_jsx(motion.div, { drag: "x", dragConstraints: { left: 0, right: 0 }, onDragEnd: handleDragEnd, style: {
            x,
            rotate,
            opacity,
            position: 'absolute',
            width: '320px',
            height: '420px',
            cursor: 'grab',
        }, whileTap: { cursor: 'grabbing', scale: 0.95 }, onClick: () => {
            triggerHaptic('click');
            setFlipped(!flipped);
        }, children: _jsxs(motion.div, { initial: false, animate: { rotateY: flipped ? 180 : 0 }, transition: { duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }, style: {
                width: '100%',
                height: '100%',
                transformStyle: 'preserve-3d',
                position: 'relative',
            }, children: [_jsxs("div", { className: "glass", style: {
                        position: 'absolute',
                        backfaceVisibility: 'hidden',
                        width: '100%',
                        height: '100%',
                        borderRadius: 24,
                        padding: 24,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textAlign: 'center',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                        background: 'linear-gradient(135deg, rgba(20,20,42,0.8), rgba(10,10,20,0.9))'
                    }, children: [_jsx("div", { style: { color: 'var(--acc-l)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20 }, children: card.topic || 'SAVOL' }), _jsx("div", { style: { fontSize: 22, fontWeight: 700, lineHeight: 1.4 }, children: card.front }), _jsx("div", { style: { position: 'absolute', bottom: 20, color: 'var(--txt-3)', fontSize: 12 }, children: "Javobni ko'rish uchun bosing" })] }), _jsxs("div", { className: "glass", style: {
                        position: 'absolute',
                        backfaceVisibility: 'hidden',
                        width: '100%',
                        height: '100%',
                        borderRadius: 24,
                        padding: 24,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textAlign: 'center',
                        transform: 'rotateY(180deg)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                        background: 'linear-gradient(135deg, rgba(123,104,238,0.2), rgba(20,20,42,0.9))'
                    }, children: [_jsx("div", { style: { color: 'var(--g)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20 }, children: "JAVOB" }), _jsx("div", { style: { fontSize: 20, fontWeight: 600, lineHeight: 1.5 }, children: card.back }), _jsx("div", { style: { position: 'absolute', bottom: 20, color: 'var(--txt-3)', fontSize: 12 }, children: "Keyingisiga o'tish uchun o'ngga yoki chapga suring" })] })] }) }));
}
