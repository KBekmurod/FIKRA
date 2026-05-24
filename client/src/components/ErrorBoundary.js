var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import { Component } from 'react';
/**
 * Error Boundary — agar React komponentlarida xato bo'lsa,
 * "Aw, Snap!" o'rniga yumshoq ko'rinishda xato sahifasini ko'rsatadi.
 *
 * Bu Android WebView'da memory yoki render xatolari bo'lganda foydali.
 */
var ErrorBoundary = /** @class */ (function (_super) {
    __extends(ErrorBoundary, _super);
    function ErrorBoundary() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.state = { hasError: false, error: null, errorInfo: '' };
        _this.handleReload = function () {
            // ServiceWorker cache'ni tozalash va qaytadan yuklash
            try {
                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistrations().then(function (regs) {
                        regs.forEach(function (r) { return r.unregister(); });
                    });
                }
                if ('caches' in window) {
                    caches.keys().then(function (names) { return names.forEach(function (n) { return caches["delete"](n); }); });
                }
            }
            catch (_a) { }
            window.location.href = '/';
        };
        _this.handleGoHome = function () {
            _this.setState({ hasError: false, error: null, errorInfo: '' });
            window.location.href = '/';
        };
        return _this;
    }
    ErrorBoundary.getDerivedStateFromError = function (error) {
        return { hasError: true, error: error, errorInfo: '' };
    };
    ErrorBoundary.prototype.componentDidCatch = function (error, info) {
        console.error('FIKRA ErrorBoundary caught:', error, info);
        this.setState({ errorInfo: info.componentStack || '' });
        // Anonim error reporting (optional)
        try {
            var errorPayload = {
                message: error.message,
                stack: (error.stack || '').slice(0, 1000),
                component: (info.componentStack || '').slice(0, 500),
                url: window.location.href,
                userAgent: navigator.userAgent.slice(0, 200),
                timestamp: new Date().toISOString()
            };
            // Beacon — javob kutmaymiz
            navigator.sendBeacon ? .('/api/log/client-error', new Blob([JSON.stringify(errorPayload)], { type: 'application/json' }))
                :
            ;
        }
        catch (_a) { }
    };
    ErrorBoundary.prototype.render = function () {
        if (this.state.hasError) {
            return (<div style={{
                minHeight: '100vh',
                padding: '40px 24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#0a0a14',
                color: '#f0eeff',
                textAlign: 'center'
            }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>⚠️</div>
          <h2 style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 24, fontWeight: 800,
                margin: 0, marginBottom: 12
            }}>
            Texnik nosozlik yuz berdi
          </h2>
          <p style={{
                fontSize: 14,
                color: 'rgba(240,238,255,0.7)',
                lineHeight: 1.5,
                maxWidth: 320,
                margin: '0 0 24px'
            }}>
            Ilova ishida kutilmagan xato bo'ldi. Bu vaqtinchalik —
            qayta yuklashda hammasi yana ishlaydi.
          </p>

          <div style={{
                display: 'grid',
                gap: 10,
                width: '100%',
                maxWidth: 280
            }}>
            <button onClick={this.handleReload} style={{
                background: 'linear-gradient(135deg, #7b68ee, #9d8fff)',
                color: 'white',
                border: 'none',
                borderRadius: 12,
                padding: '14px 18px',
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer'
            }}>🔄 Ilovani qaytadan yuklash</button>

            <button onClick={this.handleGoHome} style={{
                background: 'rgba(240,238,255,0.05)',
                color: '#f0eeff',
                border: '1px solid rgba(240,238,255,0.1)',
                borderRadius: 12,
                padding: '14px 18px',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer'
            }}>🏠 Asosiy sahifaga</button>
          </div>

          
          {import.meta.env.DEV && this.state.error && (<details style={{
                marginTop: 24,
                padding: 12,
                background: 'rgba(255,95,126,0.08)',
                border: '1px solid rgba(255,95,126,0.2)',
                borderRadius: 10,
                fontSize: 11,
                maxWidth: 400,
                textAlign: 'left'
            }}>
              <summary style={{ cursor: 'pointer', fontWeight: 700, color: '#ff5f7e' }}>
                Dev: xato ma'lumoti
              </summary>
              <pre style={{
                marginTop: 8,
                fontSize: 10,
                overflow: 'auto',
                maxHeight: 200,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
            }}>
                {this.state.error.message}
                {'\n\n'}
                {this.state.error.stack}
              </pre>
            </details>)}
        </div>);
        }
        return this.props.children;
    };
    return ErrorBoundary;
}(Component));
export default ErrorBoundary;
