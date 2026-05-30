const API_URL = import.meta.env.VITE_API_URL || '';

// Admin so'rovlariga header qo'shuvchi yordamchi funksiya
const fetchAdmin = async (endpoint: string, options: RequestInit = {}) => {
  const secret = localStorage.getItem('adminSecret') || '';
  const headers = {
    'Content-Type': 'application/json',
    'x-admin-secret': secret,
    ...options.headers,
  };

  const res = await fetch(`${API_URL}/api/admin${endpoint}`, { ...options, headers });
  if (!res.ok) {
    let msg = 'Xatolik yuz berdi';
    try {
      const data = await res.json();
      if (data.error) msg = data.error;
    } catch (e) {}
    throw new Error(msg);
  }
  return res.json();
};

export const adminApi = {
  getStats: () => fetchAdmin('/stats'),
  getAnalytics: () => fetchAdmin('/analytics'),
  getRevenue: () => fetchAdmin('/revenue'),
  getUsers: (page = 1, limit = 20, q = '') => fetchAdmin(`/users?page=${page}&limit=${limit}&q=${encodeURIComponent(q)}`),
  banUser: (id: string) => fetchAdmin(`/users/${id}/ban`, { method: 'POST' }),
  activatePlan: (id: string, planId: string) => fetchAdmin(`/users/${id}/activate-plan`, {
    method: 'POST',
    body: JSON.stringify({ planId })
  }),
  getOrders: (page = 1, limit = 20, status = '') => fetchAdmin(`/orders?page=${page}&limit=${limit}&status=${status}`),
  confirmOrder: (orderId: string, note?: string) => fetchAdmin(`/orders/${orderId}/confirm`, {
    method: 'POST',
    body: JSON.stringify({ note })
  }),
  rejectOrder: (orderId: string, reason?: string) => fetchAdmin(`/orders/${orderId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  }),
  getSubscriptions: (page = 1, limit = 20) => fetchAdmin(`/subscriptions?page=${page}&limit=${limit}`),
  getQuestions: (page = 1, limit = 20) => fetchAdmin(`/questions?page=${page}&limit=${limit}`),
};
