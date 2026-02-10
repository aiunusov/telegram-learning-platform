import { Outlet, Link, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/projects', label: 'Проекты', icon: '📁' },
  { path: '/knowledge', label: 'Материалы', icon: '📚' },
  { path: '/tests', label: 'Тесты', icon: '✅' },
  { path: '/analytics', label: 'Аналитика', icon: '📊' },
  { path: '/homework/review', label: 'Домашки', icon: '📝' },
];

export function AppShell() {
  const location = useLocation();

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
          const isActive = location.pathname.startsWith(item.path);
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
