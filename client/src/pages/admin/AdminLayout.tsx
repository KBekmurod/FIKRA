import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { FiActivity, FiUsers, FiCreditCard, FiDatabase, FiLogOut } from 'react-icons/fi';

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    if ((window as any).adminLogout) {
      (window as any).adminLogout();
    }
  };

  const navItems = [
    { path: '/admin', icon: <FiActivity />, label: 'Asosiy' },
    { path: '/admin/users', icon: <FiUsers />, label: 'Foydalanuvchilar' },
    { path: '/admin/orders', icon: <FiCreditCard />, label: 'To\'lovlar' },
    { path: '/admin/questions', icon: <FiDatabase />, label: 'Testlar' },
  ];

  return (
    <div className="app admin-app" style={{ background: 'var(--bg)' }}>
      <header className="header" style={{ borderBottom: '1px solid var(--f)' }}>
        <h1 className="header-logo">
          FIKRA <span>Admin</span>
        </h1>
        <button onClick={handleLogout} className="btn btn-sm btn-ghost" style={{ padding: '6px 10px', color: 'var(--r)' }}>
          <FiLogOut />
        </button>
      </header>

      <div className="app-content" style={{ padding: 0 }}>
        <Outlet />
      </div>

      <nav className="nav nav-6">
        {navItems.map(item => (
          <button
            key={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <div className="nav-icon">{item.icon}</div>
            <div className="nav-label">{item.label}</div>
          </button>
        ))}
      </nav>
    </div>
  );
};
