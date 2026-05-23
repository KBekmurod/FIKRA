import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { triggerHaptic } from '../utils/haptics';
import { api } from '../api/client';
import ReactMarkdown from 'react-markdown';
import { useEntityStore } from '../store/entityStore';
import { useAppStore } from '../store';
import './FikraEntity.css';
export const FikraEntity = () => {
    const { mode, isVisible, isPrankingLevel, isMatrixMode, isScreenWiped, isThiefActive, prankMessage, setMode, triggerHammerPrank, triggerMatrixHack, triggerScreenWipe } = useEntityStore();
    const { user } = useAppStore();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const blobRef = useRef(null);
    const pupilRef = useRef(null);
    const messagesEndRef = useRef(null);
    const location = useLocation();
    // Kuzatuvchi ko'z (Mouse Tracking)
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!blobRef.current || !pupilRef.current)
                return;
            const rect = blobRef.current.getBoundingClientRect();
            // Blob ning markazi
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            // Kursor va markaz orasidagi burchak
            const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
            // Pupil qanchalik chetga surilishi (maksimal masofa 6px)
            const distance = Math.min(6, Math.hypot(e.clientX - centerX, e.clientY - centerY) / 20);
            const pupilX = Math.cos(angle) * distance;
            const pupilY = Math.sin(angle) * distance;
            pupilRef.current.style.transform = `translate(calc(-50% + ${pupilX}px), calc(-50% + ${pupilY}px))`;
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [isVisible]);
    // DND Mode (Chalg'itmaslik qoidasi)
    useEffect(() => {
        if (location.pathname.includes('/test-run') || location.pathname.includes('/personal-tests/')) {
            setMode('hidden');
            setIsOpen(false);
        }
    }, [location.pathname]);
    // Tasodifiy Prank Taymer (Faqat Bosh sahifada, va Streak/Level baland bo'lsa)
    useEffect(() => {
        if (location.pathname !== '/')
            return;
        if (!user || user.plan === 'free')
            return; // Yoki qandaydir baland shart: (user as any).level >= 5
        // Har 30-60 soniyada 10% ehtimollik bilan chiqish (faqat namoyish uchun tezroq qilamiz)
        const interval = setInterval(() => {
            if (Math.random() > 0.8 && mode === 'hidden') {
                const rng = Math.random();
                if (rng < 0.33) {
                    triggerHammerPrank();
                    triggerHaptic('wrong');
                }
                else if (rng < 0.66) {
                    triggerMatrixHack();
                    triggerHaptic('correct');
                }
            }
        }, 45000);
        // Idle timer logic
        let idleTimeout;
        const resetIdle = () => {
            clearTimeout(idleTimeout);
            idleTimeout = setTimeout(() => {
                if (mode === 'hidden') {
                    triggerScreenWipe();
                    triggerHaptic('swipe');
                }
            }, 60000); // 1 minute idle
        };
        window.addEventListener('mousemove', resetIdle);
        window.addEventListener('keypress', resetIdle);
        window.addEventListener('touchstart', resetIdle);
        resetIdle();
        return () => {
            clearInterval(interval);
            clearTimeout(idleTimeout);
            window.removeEventListener('mousemove', resetIdle);
            window.removeEventListener('keypress', resetIdle);
            window.removeEventListener('touchstart', resetIdle);
        };
    }, [location.pathname, user, mode]);
    // Auto scroll
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isTyping]);
    // Body CSS effect triggers
    useEffect(() => {
        if (isMatrixMode)
            document.body.classList.add('matrix-mode');
        else
            document.body.classList.remove('matrix-mode');
        const appContent = document.querySelector('.app-content');
        if (appContent) {
            if (isScreenWiped)
                appContent.classList.add('screen-blur');
            else
                appContent.classList.remove('screen-blur');
        }
    }, [isMatrixMode, isScreenWiped]);
    const toggleChat = () => {
        triggerHaptic('click');
        setIsOpen(!isOpen);
        if (!isOpen && messages.length === 0) {
            // Birinchi marta ochilganda o'zi salom beradi
            sendInitialGreeting();
        }
    };
    const sendInitialGreeting = async () => {
        setIsTyping(true);
        try {
            const response = await fetch(`${api.defaults.baseURL}/entity/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    message: "O'zingni tanishtir va qayerdaligimni ayt.",
                    contextUrl: window.location.pathname,
                    pageContext: getPageContext(window.location.pathname)
                })
            });
            if (!response.body)
                return;
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            setMessages([{ role: 'entity', content: '' }]);
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                        const data = JSON.parse(line.replace('data: ', ''));
                        if (data.content) {
                            setMessages(prev => {
                                const newMsgs = [...prev];
                                newMsgs[newMsgs.length - 1].content += data.content;
                                return newMsgs;
                            });
                            // Har bir so'zda kichik titrash
                            if (Math.random() > 0.8)
                                triggerHaptic('click');
                        }
                    }
                }
            }
        }
        catch (e) {
            console.error(e);
        }
        finally {
            setIsTyping(false);
        }
    };
    const handleSend = async () => {
        if (!input.trim())
            return;
        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        triggerHaptic('click');
        setIsTyping(true);
        try {
            const response = await fetch(`${api.defaults.baseURL}/entity/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    message: userMsg,
                    contextUrl: window.location.pathname,
                    pageContext: getPageContext(window.location.pathname)
                })
            });
            if (!response.body)
                return;
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            setMessages(prev => [...prev, { role: 'entity', content: '' }]);
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                        const data = JSON.parse(line.replace('data: ', ''));
                        if (data.content) {
                            setMessages(prev => {
                                const newMsgs = [...prev];
                                newMsgs[newMsgs.length - 1].content += data.content;
                                return newMsgs;
                            });
                        }
                    }
                }
            }
        }
        catch (e) {
            console.error(e);
        }
        finally {
            setIsTyping(false);
        }
    };
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };
    // Yordamchi: URL ga qarab kontekst so'zini beradi
    const getPageContext = (path) => {
        if (path === '/')
            return "Bosh sahifada statistikani ko'ryapti";
        if (path.includes('test'))
            return "Imtihon yoki test yechish bilan band";
        if (path.includes('materials'))
            return "Ombordan nimalarnidir o'qiyapti";
        if (path.includes('ai'))
            return "AI Yordamchi bilan gaplashmoqda (meni o'rnimga!)";
        return "Noma'lum sahifada adashib yuribdi";
    };
    // Agar DND rejimida yashiringan bo'lsa, umuman render qilinmaydi (Prank bo'lmasa)
    if (mode === 'hidden' && !isVisible)
        return null;
    const isAnyPrankActive = mode.startsWith('prank_');
    return (_jsxs("div", { className: `fikra-entity-container ${isAnyPrankActive ? 'prank-mode' : ''}`, children: [_jsx(AnimatePresence, { children: (isPrankingLevel || isMatrixMode || isScreenWiped || isThiefActive) && (_jsx(motion.div, { initial: { opacity: 0, scale: 0.5, y: 50 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.5, y: 50 }, className: "fikra-prank-bubble", children: prankMessage })) }), _jsx(AnimatePresence, { children: isOpen && !isAnyPrankActive && (_jsxs(motion.div, { initial: { opacity: 0, scale: 0.8, y: 20 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.8, y: 20 }, transition: { type: 'spring', damping: 25, stiffness: 300 }, className: "fikra-chat-window", children: [_jsxs("div", { className: "fikra-chat-header", children: [_jsx("span", { className: "fikra-chat-title", children: "FIKR-A MAVJUDOTI" }), _jsx("button", { className: "fikra-close-btn", onClick: toggleChat, children: "\u00D7" })] }), _jsxs("div", { className: "fikra-chat-messages", children: [messages.map((m, i) => (_jsx("div", { className: `fikra-msg ${m.role}`, children: m.role === 'entity' ? (_jsx(ReactMarkdown, { children: m.content })) : (m.content) }, i))), isTyping && (_jsx("div", { className: "fikra-typing", children: "Fikr-A yozmoqda..." })), _jsx("div", { ref: messagesEndRef })] }), _jsxs("div", { className: "fikra-chat-input-area", children: [_jsx("input", { type: "text", className: "fikra-chat-input", placeholder: "Mavjudotga gapir...", value: input, onChange: e => setInput(e.target.value), onKeyDown: handleKeyDown, disabled: isTyping }), _jsx("button", { className: "fikra-chat-send", onClick: handleSend, disabled: isTyping || !input.trim(), children: _jsx("i", { className: "fi fi-rr-paper-plane" }) })] })] })) }), _jsxs(motion.div, { className: "fikra-blob", ref: blobRef, onClick: !isAnyPrankActive ? toggleChat : undefined, title: "Fikr-A (Mavjudot)", animate: isAnyPrankActive ? {
                    y: -window.innerHeight * 0.7,
                    scale: 1.5,
                    boxShadow: isMatrixMode ? '0 0 50px #0f0' : '0 0 50px #ff0000'
                } : { y: 0, scale: 1 }, transition: { type: 'spring', damping: 20 }, children: [_jsx("div", { className: "fikra-eye", children: _jsx("div", { className: "fikra-pupil", ref: pupilRef }) }), _jsx(AnimatePresence, { children: mode === 'prank_hammer' && (_jsx(motion.div, { className: "fikra-hammer", initial: { rotate: 45, opacity: 0 }, animate: { rotate: -45, opacity: 1 }, transition: { delay: 1, type: 'spring', stiffness: 500 }, onAnimationComplete: () => {
                                // Urish payti keldi
                                document.body.classList.add('screen-shake');
                                triggerHaptic('wrong');
                                setTimeout(() => document.body.classList.remove('screen-shake'), 500);
                            }, children: "\uD83D\uDD28" })) })] })] }));
};
