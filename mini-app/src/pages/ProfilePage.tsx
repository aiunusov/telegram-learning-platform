import { useState } from 'react';
import { useAuthStore } from '../store/auth-store';
import { useThemeStore } from '../store/theme-store';
import { apiClient } from '../lib/api-client';

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const { theme, setTheme } = useThemeStore();

  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [position, setPosition] = useState(user?.position || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await apiClient.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        position: position.trim() || undefined,
      });
      setUser(updated);
      setIsEditing(false);
    } catch {
      // Error handled silently
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFirstName(user?.firstName || '');
    setLastName(user?.lastName || '');
    setPosition(user?.position || '');
    setIsEditing(false);
  };

  const initials = `${(user?.firstName || '?')[0]}${(user?.lastName || '')[0] || ''}`.toUpperCase();

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid var(--tg-theme-hint-color, #ccc)',
    background: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
    color: 'var(--tg-theme-text-color, #000)',
    fontSize: '15px',
    outline: 'none',
  };

  return (
    <div>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Профиль</h1>

      {/* Avatar + Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'var(--tg-theme-button-color, #007aff)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            fontWeight: 'bold',
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
            {user?.firstName} {user?.lastName}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--tg-theme-hint-color, #999)' }}>
            @{user?.username || 'no_username'}
          </div>
          <span
            style={{
              display: 'inline-block',
              marginTop: '4px',
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '11px',
              fontWeight: '600',
              background: user?.role === 'ADMIN' ? '#ff9500' : 'var(--tg-theme-button-color, #007aff)',
              color: '#fff',
            }}
          >
            {user?.role === 'ADMIN' ? 'Админ' : 'Студент'}
          </span>
        </div>
      </div>

      {/* Profile Fields */}
      <div
        style={{
          background: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600' }}>Личные данные</h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--tg-theme-button-color, #007aff)',
                color: '#fff',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Изменить
            </button>
          )}
        </div>

        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--tg-theme-hint-color, #999)', marginBottom: '4px' }}>Имя</label>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--tg-theme-hint-color, #999)', marginBottom: '4px' }}>Фамилия</label>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--tg-theme-hint-color, #999)', marginBottom: '4px' }}>Должность</label>
              <input value={position} onChange={(e) => setPosition(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleSave}
                disabled={isSaving}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'var(--tg-theme-button-color, #007aff)',
                  color: '#fff',
                  fontSize: '14px',
                  cursor: 'pointer',
                  opacity: isSaving ? 0.6 : 1,
                }}
              >
                {isSaving ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button
                onClick={handleCancel}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  border: '1px solid var(--tg-theme-hint-color, #ccc)',
                  background: 'transparent',
                  color: 'var(--tg-theme-text-color, #000)',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color, #999)' }}>Имя</div>
              <div style={{ fontSize: '15px' }}>{user?.firstName || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color, #999)' }}>Фамилия</div>
              <div style={{ fontSize: '15px' }}>{user?.lastName || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color, #999)' }}>Должность</div>
              <div style={{ fontSize: '15px' }}>{user?.position || '—'}</div>
            </div>
          </div>
        )}
      </div>

      {/* Theme Toggle */}
      <div
        style={{
          background: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px',
        }}
      >
        <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Тема оформления</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          {([
            { value: 'light' as const, label: 'Светлая' },
            { value: 'dark' as const, label: 'Тёмная' },
          ]).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '10px',
                border: theme === opt.value ? '2px solid var(--tg-theme-button-color, #007aff)' : '1px solid var(--tg-theme-hint-color, #ccc)',
                background: theme === opt.value ? 'var(--tg-theme-button-color, #007aff)' : 'transparent',
                color: theme === opt.value ? '#fff' : 'var(--tg-theme-text-color, #000)',
                fontSize: '13px',
                fontWeight: theme === opt.value ? '600' : '400',
                cursor: 'pointer',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '12px',
          border: '1px solid #ff3b30',
          background: 'transparent',
          color: '#ff3b30',
          fontSize: '15px',
          cursor: 'pointer',
        }}
      >
        Выйти
      </button>
    </div>
  );
}
