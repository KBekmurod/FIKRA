import { createContext, useContext, useState, useCallback } from 'react';
var Ctx = createContext({
    toast: function () { },
    success: function () { },
    error: function () { },
    info: function () { }
});
export function ToastProvider(_a) {
    var children = _a.children;
    var _b = useState(null), msg = _b[0], setMsg = _b[1];
    var toast = useCallback(function (text, type) {
        if (type === void 0) { type = 'info'; }
        setMsg({ text: text, type: type });
        // BEST PRACTICE: matn uzunligi va xato turiga qarab vaqt
        // Qisqa: 3s, uzun: 5s, xato: kamida 4s
        var baseDuration = type === 'err' ? 4000 : 3000;
        var lengthBonus = Math.min(2500, text.length * 30);
        var duration = baseDuration + lengthBonus;
        setTimeout(function () { return setMsg(null); }, duration);
    }, []);
    var success = useCallback(function (text) { return toast(text, 'ok'); }, [toast]);
    var error = useCallback(function (text) { return toast(text, 'err'); }, [toast]);
    var info = useCallback(function (text) { return toast(text, 'info'); }, [toast]);
    return (<Ctx.Provider value={{ toast: toast, success: success, error: error, info: info }}>
      {children}
      {msg && (<div className="toast" style={{
        borderColor: msg.type === 'ok' ? 'var(--g)' : msg.type === 'err' ? 'var(--r)' : 'var(--f)'
    }}>
          {msg.text}
        </div>)}
    </Ctx.Provider>);
}
export var useToast = function () { return useContext(Ctx); };
