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
import { useState, useEffect, useMemo } from 'react';
import { subApi } from '../api/endpoints';
import { useAppStore } from '../store';
import { useToast } from './Toast';
import Modal from './Modal';
{
    PlanData;
}
from;
'../types';
export default function SubscriptionModal(_a) {
    var _this = this;
    var open = _a.open, onClose = _a.onClose;
    var _b = useState([]), plans = _b[0], setPlans = _b[1];
    var _c = useState(false), loading = _c[0], setLoading = _c[1];
    var _d = useState('1m'), period = _d[0], setPeriod = _d[1];
    var _e = useState(''), promoCode = _e[0], setPromoCode = _e[1];
    var _f = useState(0), promoDiscount = _f[0], setPromoDiscount = _f[1];
    var _g = useState(false), promoLoading = _g[0], setPromoLoading = _g[1];
    var _h = useState(false), promoApplied = _h[0], setPromoApplied = _h[1];
    var user = useAppStore().user;
    var toast = useToast();
    useEffect(function () {
        if (open) {
            subApi.plans().then(function (r) { return setPlans(r.data); })["catch"](function () { });
        }
    }, [open]);
    var visiblePlans = useMemo(function () {
        return plans.filter(function (p) { return p.id.endsWith("_" + period); });
    }, [plans, period]);
    var applyPromo = function () { return __awaiter(_this, void 0, void 0, function () {
        var res, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!promoCode.trim())
                        return [2 /*return*/];
                    setPromoLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, subApi.validatePromo(promoCode.trim())];
                case 2:
                    res = _a.sent();
                    setPromoDiscount(res.data.discountPercent);
                    setPromoApplied(true);
                    toast.success("Tabriklaymiz! " + res.data.discountPercent + "% chegirma qo'llanildi.");
                    return [3 /*break*/, 5];
                case 3:
                    e_1 = _a.sent();
                    toast.error(e_1.response ? .data ? .error || 'Promokod xato yoki muddati tugagan' :  : );
                    setPromoDiscount(0);
                    setPromoApplied(false);
                    return [3 /*break*/, 5];
                case 4:
                    setPromoLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var handleBuy = function (planId) { return __awaiter(_this, void 0, void 0, function () {
        var data, adminUsername, rawText, text, err_1, e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!user) {
                        toast.error('Avval tizimga kiring');
                        return [2 /*return*/];
                    }
                    setLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 8, 9, 10]);
                    return [4 /*yield*/, subApi.createP2POrder(planId, promoApplied ? promoCode.trim() : undefined)];
                case 2:
                    data = (_a.sent()).data;
                    adminUsername = window.ADMIN_USERNAME || 'fikra_support';
                    if (!adminUsername) return [3 /*break*/, 7];
                    rawText = "Salom! Men FIKRA ilovasidan " + data.order.planName + " obunasini olmoqchiman.\nBuyurtma ID: " + data.order.orderId + "\nNarx: " + data.order.priceUZS.toLocaleString() + " UZS\n\nRekvizitlarni yuboring!";
                    text = encodeURIComponent(rawText);
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, navigator.clipboard.writeText(rawText)];
                case 4:
                    _a.sent();
                    return [3 /*break*/, 6];
                case 5:
                    err_1 = _a.sent();
                    console.warn('Clipboard write failed', err_1);
                    return [3 /*break*/, 6];
                case 6:
                    // Use location.href instead of window.open to avoid popup blockers on mobile PWA
                    window.location.href = "https://t.me/" + adminUsername + "?text=" + text + "&_t=" + Date.now();
                    _a.label = 7;
                case 7:
                    toast.success("Telegram ochilmoqda! Agar matn eski bo'lsa, xotiradan \"Pastroq/Paste\" qiling.");
                    onClose();
                    return [3 /*break*/, 10];
                case 8:
                    e_2 = _a.sent();
                    toast.error(e_2.response ? .data ? .error || 'Xatolik' :  : );
                    return [3 /*break*/, 10];
                case 9:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 10: return [2 /*return*/];
            }
        });
    }); };
    var tierColor = {
        basic: 'var(--y)', pro: 'var(--acc)', vip: 'var(--g)'
    };
    var tierEmoji = { basic: '⭐', pro: '✨', vip: '💎' };
    var isFree = !user ? .effectivePlan || user.effectivePlan === 'free' : ;
    return (<Modal open={open} onClose={onClose} title="💎 Obuna rejalari">
      
      
      {isFree && (<div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid var(--f)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16
    }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>🆓</span> Bepul tarifingiz cheklovlari (kunlik):
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11, color: 'var(--txt-2)' }}>
            <div>• <b>20 ta</b> AI tushuntirish</div>
            <div>• <b>30 ta</b> AI xabar</div>
            <div>• <b>3 ta</b> Hujjat (PDF/Doc)</div>
            <div>• <b>5 ta</b> Rasm (OCR)</div>
            <div>• <b>5 ta</b> AI test generatsiya</div>
            <div>• <b>5 ta</b> Material saqlash (har fanga)</div>
          </div>
          <div style={{ fontSize: 10, color: 'var(--acc-l)', marginTop: 8, fontWeight: 700 }}>
            Cheklovlardan xalos bo'lish uchun obunani tanlang ↓
          </div>
        </div>)}

      
      <div style={{
        display: 'flex',
        background: 'var(--s2)',
        borderRadius: 10,
        padding: 4,
        marginBottom: 16,
        border: '1px solid var(--f)'
    }}>
        <button onClick={function () { return setPeriod('1m'); }} style={{
        flex: 1, padding: '8px 0', border: 'none', borderRadius: 8,
        background: period === '1m' ? 'var(--s1)' : 'transparent',
        color: period === '1m' ? 'var(--txt)' : 'var(--txt-3)',
        fontWeight: period === '1m' ? 800 : 600,
        fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
        boxShadow: period === '1m' ? '0 2px 5px rgba(0,0,0,0.2)' : 'none'
    }}>
          1 oy
        </button>
        <button onClick={function () { return setPeriod('3m'); }} style={{
        flex: 1, padding: '8px 0', border: 'none', borderRadius: 8,
        background: period === '3m' ? 'var(--s1)' : 'transparent',
        color: period === '3m' ? 'var(--txt)' : 'var(--txt-3)',
        fontWeight: period === '3m' ? 800 : 600,
        fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
        boxShadow: period === '3m' ? '0 2px 5px rgba(0,0,0,0.2)' : 'none'
    }}>
          3 oy
        </button>
        <button onClick={function () { return setPeriod('12m'); }} style={{
        flex: 1, padding: '8px 0', border: 'none', borderRadius: 8,
        background: period === '12m' ? 'var(--s1)' : 'transparent',
        color: period === '12m' ? 'var(--txt)' : 'var(--txt-3)',
        fontWeight: period === '12m' ? 800 : 600,
        fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
        boxShadow: period === '12m' ? '0 2px 5px rgba(0,0,0,0.2)' : 'none'
    }}>
          12 oy <span style={{ color: 'var(--g)', fontSize: 10, verticalAlign: 'top' }}>%</span>
        </button>
      </div>

      
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: 6,
        marginBottom: 14
    }}>
        <div style={{ padding: '8px 6px', background: 'rgba(0,212,170,0.12)', border: '1.5px solid rgba(0,212,170,0.35)', borderRadius: 10, textAlign: 'center' }}>
          <div style={{ fontSize: 16 }}>🤝</div>
          <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--g)', marginTop: 2 }}>P2P</div>
          <div style={{ fontSize: 8, color: 'var(--g)' }}>Faol</div>
        </div>
        <div style={{ padding: '8px 6px', background: 'var(--s2)', border: '1px solid var(--f)', borderRadius: 10, textAlign: 'center', opacity: 0.6 }}>
          <div style={{ fontSize: 16 }}>💳</div>
          <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--txt-2)', marginTop: 2 }}>Payme</div>
          <div style={{ fontSize: 8, color: 'var(--txt-3)' }}>Tez orada</div>
        </div>
        <div style={{ padding: '8px 6px', background: 'var(--s2)', border: '1px solid var(--f)', borderRadius: 10, textAlign: 'center', opacity: 0.6 }}>
          <div style={{ fontSize: 16 }}>💳</div>
          <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--txt-2)', marginTop: 2 }}>Click</div>
          <div style={{ fontSize: 8, color: 'var(--txt-3)' }}>Tez orada</div>
        </div>
      </div>

      
      <div style={{
        background: 'var(--s2)', borderRadius: 10, padding: 12, marginBottom: 16, border: '1px solid var(--f)',
        display: 'flex', gap: 8, alignItems: 'center'
    }}>
        <div style={{ fontSize: 16 }}>🎟️</div>
        <input type="text" placeholder="Promokod (agar bo'lsa)" value={promoCode} onChange={function (e) { setPromoCode(e.target.value); setPromoApplied(false); setPromoDiscount(0); }} style={{
        flex: 1, background: 'transparent', border: 'none', color: 'var(--txt)',
        fontSize: 13, outline: 'none', textTransform: 'uppercase'
    }} disabled={promoApplied || promoLoading}/>
        {promoApplied ? (<span style={{ color: 'var(--g)', fontSize: 12, fontWeight: 700 }}>✓ Qo'llanildi</span>) : (<button onClick={applyPromo} disabled={!promoCode.trim() || promoLoading} style={{
        background: 'var(--s3)', border: '1px solid var(--f)', color: 'var(--txt)',
        padding: '6px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
        opacity: !promoCode.trim() || promoLoading ? 0.5 : 1
    }}>
            {promoLoading ? '...' : "Qo'llash"}
          </button>)}
      </div>

      
      <div style={{ display: 'grid', gap: 10 }}>
        {visiblePlans.map(function (plan) {
        var color = tierColor[plan.tier] || 'var(--txt-2)';
        var emoji = tierEmoji[plan.tier] || '⭐';
        var isPro = plan.tier === 'pro';
        var finalPrice = promoApplied
            ? Math.max(0, Math.round(plan.priceUZS * (1 - promoDiscount / 100)))
            : plan.priceUZS;
        return (<div key={plan.id} style={{
            background: 'var(--s1)',
            border: "1.5px solid " + (isPro ? color : 'var(--f)'),
            borderRadius: 14,
            padding: 14,
            position: 'relative'
        }}>
              {isPro && (<div style={{
            position: 'absolute', top: -10, right: 12,
            background: color, color: '#0a0a14',
            fontSize: 9, fontWeight: 800, padding: '3px 10px',
            borderRadius: 100, letterSpacing: 0.5
        }}>OMMABOP</div>)}
              {plan.badge && !isPro && (<div style={{
            position: 'absolute', top: -10, right: 12,
            background: 'var(--s2)', color: 'var(--txt-2)', border: '1px solid var(--f)',
            fontSize: 9, fontWeight: 800, padding: '2px 8px',
            borderRadius: 100
        }}>{plan.badge}</div>)}
              {plan.badge && isPro && (<div style={{
            position: 'absolute', top: -10, right: 90,
            background: 'var(--s2)', color: 'var(--txt)', border: "1px solid " + color,
            fontSize: 9, fontWeight: 800, padding: '2px 8px',
            borderRadius: 100
        }}>{plan.badge}</div>)}

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ fontSize: 26 }}>{emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: color }}>{plan.name}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {promoApplied && (<div style={{ fontSize: 11, textDecoration: 'line-through', color: 'var(--txt-3)', marginBottom: -2 }}>
                      {plan.priceUZS.toLocaleString()}
                    </div>)}
                  <div style={{ fontWeight: 900, fontSize: 18, color: promoApplied ? 'var(--g)' : 'inherit' }}>
                    {finalPrice.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--txt-3)' }}>UZS / {plan.period}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gap: 4, marginBottom: 10 }}>
                {plan.features.slice(0, 4).map(function (f, i) { return (<div key={i} style={{ fontSize: 11, color: 'var(--txt)', display: 'flex', gap: 6 }}>
                    <span style={{ color: color }}>✓</span>
                    <span>{f}</span>
                  </div>); })}
              </div>

              <button onClick={function () { return handleBuy(plan.id); }} disabled={loading} style={{
            width: '100%',
            background: "linear-gradient(135deg, " + color + ", " + color + "dd)",
            color: '#0a0a14',
            border: 'none',
            borderRadius: 12,
            padding: '14px 16px',
            fontSize: 14,
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            boxShadow: "0 4px 14px " + color + "66",
            cursor: loading ? 'wait' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transform: 'translateY(-1px)',
            transition: 'all 0.2s'
        }}>
                {loading ? '⏳ Bajarilmoqda...' : '🤝 P2P orqali olish'}
              </button>
            </div>);
    })}
      </div>

      
      <div style={{
        marginTop: 14, padding: 12,
        background: 'rgba(123,104,238,0.06)', border: '1px solid rgba(123,104,238,0.18)',
        borderRadius: 10, fontSize: 11, color: 'var(--txt-2)', lineHeight: 1.5
    }}>
        🤝 <strong>P2P (Peer-to-Peer)</strong> — admin bilan to'g'ridan-to'g'ri to'lov.
        Admin'ga yozib, kartani to'ldirib chek yuborasiz. Admin obunani faollashtiradi.
      </div>
    </Modal>);
}
