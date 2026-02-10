import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth-store';

export function LoadingPage() {
  const navigate = useNavigate();
  const { authenticate, isAuthenticated, error } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/projects');
      return;
    }

    authenticate().then(() => {
      navigate('/projects');
    });
  }, []);

  if (error) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <h2>Ошибка авторизации</h2>
        <p>{error}</p>
        <button onClick={() => authenticate()}>Повторить</button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
      }}
    >
      Загрузка...
    </div>
  );
}
