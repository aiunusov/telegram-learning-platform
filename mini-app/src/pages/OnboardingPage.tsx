import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth-store';
import { apiClient } from '../lib/api-client';

export function OnboardingPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [position, setPosition] = useState(user?.position || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setError('Имя и фамилия обязательны');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const updated = await apiClient.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        position: position.trim() || undefined,
      });
      setUser(updated);

      if (updated.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch {
      setError('Не удалось сохранить профиль');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '24px',
        background: 'var(--tg-theme-bg-color, #fff)',
        color: 'var(--tg-theme-text-color, #000)',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>👋</div>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
          Добро пожаловать!
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--tg-theme-hint-color, #999)' }}>
          Заполните профиль, чтобы начать обучение
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px', margin: '0 auto', width: '100%' }}>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>
            Имя *
          </label>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Ваше имя"
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '12px',
              border: '1px solid var(--tg-theme-hint-color, #ccc)',
              background: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
              color: 'var(--tg-theme-text-color, #000)',
              fontSize: '16px',
              outline: 'none',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>
            Фамилия *
          </label>
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Ваша фамилия"
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '12px',
              border: '1px solid var(--tg-theme-hint-color, #ccc)',
              background: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
              color: 'var(--tg-theme-text-color, #000)',
              fontSize: '16px',
              outline: 'none',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>
            Должность / Роль
          </label>
          <input
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            placeholder="Например: Студент, Разработчик"
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '12px',
              border: '1px solid var(--tg-theme-hint-color, #ccc)',
              background: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
              color: 'var(--tg-theme-text-color, #000)',
              fontSize: '16px',
              outline: 'none',
            }}
          />
        </div>

        {error && (
          <div style={{ color: '#ff3b30', fontSize: '14px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '12px',
            border: 'none',
            background: 'var(--tg-theme-button-color, #007aff)',
            color: 'var(--tg-theme-button-text-color, #fff)',
            fontSize: '16px',
            fontWeight: '600',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.6 : 1,
            marginTop: '8px',
          }}
        >
          {isSubmitting ? 'Сохранение...' : 'Продолжить'}
        </button>
      </div>
    </div>
  );
}
