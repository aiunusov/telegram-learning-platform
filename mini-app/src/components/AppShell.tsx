import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth-store';

const studentNavItems = [
  { path: '/dashboard', label: 'Кабинет', icon: '🏠' },
  { path: '/tests', label: 'Тесты', icon: '✅' },
  { path: '/homework/submit', label: 'Домашки', icon: '📝' },
  { path: '/profile', label: 'Профиль', icon: '👤' },
];

const adminNavItems = [
  { path: '/admin', label: 'Панель', icon: '📊' },
  { path: '/admin/students', label: 'Студенты', icon: '👥' },
  { path: '/knowledge', label: 'Материалы', icon: '📚' },
  { path: '/homework/review', label: 'Проверка', icon: '📝' },
  { path: '/profile', label: 'Настройки', icon: '⚙️' },
];

export function AppShell() {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const navItems = user?.role === 'ADMIN' ? adminNavItems : studentNavItems;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <main style={{ flex: 1, padding: '16px', paddingBottom: '80px' }}>
        <Outlet />
      </main>

      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'var(--tg-theme-bg-color, #fff)',
          borderTop: '1px solid var(--tg-theme-hint-color, #ccc)',
          display: 'flex',
          justifyContent: 'space-around',
          padding: '8px 0',
          zIndex: 100,
        }}
      >
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                textDecoration: 'none',
                textAlign: 'center',
                color: isActive
                  ? 'var(--tg-theme-link-color, #007aff)'
                  : 'var(--tg-theme-hint-color, #999)',
                fontSize: '12px',
              }}
            >
              <div style={{ fontSize: '20px' }}>{item.icon}</div>
              <div>{item.label}</div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
