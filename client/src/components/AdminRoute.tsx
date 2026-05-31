import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [secret, setSecret] = useState(localStorage.getItem('adminSecret') || '');
  const [inputVal, setInputVal] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('adminSecret', inputVal);
    setSecret(inputVal);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminSecret');
    setSecret('');
  };

  // ─── QAT'IY XAVFSIZLIK QULFI ────────────────────────────────────────────────
  // Admin panelga faqat Railway domeni yoki Localhost orqali kirish mumkin.
  // Fikra.cc domeni orqali admin sahifasiga kirish butunlay taqiqlanadi (404/Redirect).
  const isPublicDomain = window.location.hostname.includes('fikra.cc');
  
  if (isPublicDomain) {
    return <Navigate to="/" replace />;
  }

  if (!secret) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: 20 }}>
        <form onSubmit={handleLogin} style={{ width: '100%', maxWidth: 300, display: 'flex', flexDirection: 'column', gap: 15 }}>
          <h2 style={{ textAlign: 'center', marginBottom: 10 }}>Admin Login</h2>
          <input
            type="password"
            placeholder="Admin Secret Key"
            className="input"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary">Kirish</button>
        </form>
      </div>
    );
  }

  // Inject a quick logout function into the window object for easy access
  (window as any).adminLogout = handleLogout;

  return <>{children}</>;
};
