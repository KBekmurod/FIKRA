var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { folderApi } from '../api/endpoints';
import { useToast } from '../components/Toast';
import { triggerHaptic } from '../utils/haptics';
export default function FlashcardPage() {
    var _this = this;
    var folderId = useParams().folderId;
    var navigate = useNavigate();
    var toast = useToast();
    var _a = useState(null), deck = _a[0], setDeck = _a[1];
    var _b = useState(true), loading = _b[0], setLoading = _b[1];
    var _c = useState(false), generating = _c[0], setGenerating = _c[1];
    var _d = useState(0), currentIndex = _d[0], setCurrentIndex = _d[1];
    var fetchDeck = function () { return __awaiter(_this, void 0, void 0, function () {
        var data, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!folderId)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, folderApi.getFlashcards(folderId)];
                case 2:
                    data = (_a.sent()).data;
                    if (data.status === 'not_found') {
                        setDeck(null);
                    }
                    else {
                        setDeck(data);
                    }
                    return [3 /*break*/, 5];
                case 3:
                    e_1 = _a.sent();
                    toast.error('Flashcardlarni yuklashda xatolik');
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    useEffect(function () {
        fetchDeck();
    }, [folderId]);
    useEffect(function () {
        if (deck ? .status === 'generating' : ) {
            var interval_1 = setInterval(fetchDeck, 3000);
            return function () { return clearInterval(interval_1); };
        }
    }, [deck]);
    var handleGenerate = function () { return __awaiter(_this, void 0, void 0, function () {
        var data, e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!folderId)
                        return [2 /*return*/];
                    setGenerating(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, folderApi.generateFlashcards(folderId)];
                case 2:
                    data = (_a.sent()).data;
                    setDeck(data);
                    return [3 /*break*/, 5];
                case 3:
                    e_2 = _a.sent();
                    toast.error(e_2.response ? .data ? .error || 'Generatsiyada xatolik' :  : );
                    return [3 /*break*/, 5];
                case 4:
                    setGenerating(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var goBack = function () { return navigate(-1); };
    if (loading) {
        return (<div className="full-loader">
        <div className="spin"/>
      </div>);
    }
    if (!deck || deck.status === 'failed') {
        return (<div style={{ padding: 20, textAlign: 'center', marginTop: 100 }}>
        <h2>FIKRA Flash ⚡</h2>
        <p style={{ color: 'var(--txt-2)', margin: '20px 0' }}>
          Mavzuni tezkor takrorlash uchun AI tomonidan Flashcardlar yaratamiz.
        </p>
        <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
          {generating ? <><div className="spin"/> Yaratilmoqda...</> : 'Flashcard Yaratish'}
        </button>
      </div>);
    }
    if (deck.status === 'generating') {
        return (<div className="full-loader">
        <div className="spin" style={{ width: 40, height: 40 }}/>
        <div className="full-loader-text">FIKRA <span>Flash</span></div>
        <div style={{ color: 'var(--txt-2)' }}>Kartochkalar yaratilmoqda...</div>
      </div>);
    }
    var cards = deck.cards || [];
    if (currentIndex >= cards.length) {
        return (<div style={{ padding: 20, textAlign: 'center', marginTop: 100 }}>
        <h2>Ajoyib! 🎉</h2>
        <p style={{ color: 'var(--txt-2)', margin: '20px 0' }}>Barcha kartochkalarni takrorladingiz.</p>
        <button className="btn btn-primary" onClick={function () { return setCurrentIndex(0); }}>
          Qaytadan boshlash
        </button>
        <button className="btn btn-ghost" onClick={goBack} style={{ marginLeft: 10 }}>
          Ortga
        </button>
      </div>);
    }
    return (<div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--bg)'
    }}>
      <div className="header">
        <button onClick={goBack} style={{
        background: 'none', border: 'none', color: 'var(--txt-2)',
        fontSize: 22, cursor: 'pointer', padding: 0, marginRight: 8
    }}>←</button>
        <div className="header-logo">FIKRA <span>Flash</span> ⚡</div>
        <div style={{ fontWeight: 700, color: 'var(--txt-2)' }}>
          {currentIndex + 1} / {cards.length}
        </div>
      </div>

      <div style={{
        flex: 1,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: 1200
    }}>
        <AnimatePresence>
          <SwipeCard key={currentIndex} card={cards[currentIndex]} onSwipe={function () {
        triggerHaptic('swipe');
        setCurrentIndex(function (c) { return c + 1; });
    }}/>
        </AnimatePresence>
      </div>
    </div>);
}
function SwipeCard(_a) {
    var card = _a.card, onSwipe = _a.onSwipe;
    var x = useMotionValue(0);
    var rotate = useTransform(x, [-200, 200], [-15, 15]);
    var opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
    var _b = useState(false), flipped = _b[0], setFlipped = _b[1];
    var handleDragEnd = function (e, info) {
        if (Math.abs(info.offset.x) > 100) {
            onSwipe();
        }
    };
    return (<motion.div drag="x" dragConstraints={{ left: 0, right: 0 }} onDragEnd={handleDragEnd} style={{
        x: x,
        rotate: rotate,
        opacity: opacity,
        position: 'absolute',
        width: '320px',
        height: '420px',
        cursor: 'grab'
    }} whileTap={{ cursor: 'grabbing', scale: 0.95 }} onClick={function () {
        triggerHaptic('click');
        setFlipped(!flipped);
    }}>
      <motion.div initial={false} animate={{ rotateY: flipped ? 180 : 0 }} transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }} style={{
        width: '100%',
        height: '100%',
        transformStyle: 'preserve-3d',
        position: 'relative'
    }}>
        
        <div className="glass" style={{
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
    }}>
          <div style={{ color: 'var(--acc-l)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20 }}>
            {card.topic || 'SAVOL'}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.4 }}>
            {card.front}
          </div>
          <div style={{ position: 'absolute', bottom: 20, color: 'var(--txt-3)', fontSize: 12 }}>
            Javobni ko'rish uchun bosing
          </div>
        </div>

        
        <div className="glass" style={{
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
    }}>
          <div style={{ color: 'var(--g)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20 }}>
            JAVOB
          </div>
          <div style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.5 }}>
            {card.back}
          </div>
          <div style={{ position: 'absolute', bottom: 20, color: 'var(--txt-3)', fontSize: 12 }}>
            Keyingisiga o'tish uchun o'ngga yoki chapga suring
          </div>
        </div>
      </motion.div>
    </motion.div>);
}
