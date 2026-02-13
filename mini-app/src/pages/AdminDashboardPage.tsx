import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../store/project-store';
import { apiClient } from '../lib/api-client';

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const currentProject = useProjectStore((s) => s.currentProject);
  const projects = useProjectStore((s) => s.projects);
  const fetchProjects = useProjectStore((s) => s.fetchProjects);
  const setCurrentProject = useProjectStore((s) => s.setCurrentProject);

  const [summary, setSummary] = useState<any>(null);
  const [pendingHomework, setPendingHomework] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (projects.length === 0) fetchProjects();
  }, []);

  useEffect(() => {
    if (currentProject) loadData();
  }, [currentProject]);

  const loadData = async () => {
    if (!currentProject) return;
    setIsLoading(true);
    try {
      const [summaryData, homework] = await Promise.all([
        apiClient.getAnalyticsSummary(currentProject.id).catch(() => null),
        apiClient.getAdminHomework(currentProject.id, 'SUBMITTED').catch(() => []),
      ]);
      setSummary(summaryData);
      setPendingHomework(homework || []);
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>Панель управления</h1>

      {/* Project Selector */}
      {projects.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--tg-theme-hint-color, #999)', marginBottom: '6px' }}>
            Текущий курс
          </label>
          <select
            value={currentProject?.id || ''}
            onChange={(e) => {
              const p = projects.find((p: any) => p.id === e.target.value);
              if (p) setCurrentProject(p);
            }}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid var(--tg-theme-hint-color, #ccc)',
              background: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
              color: 'var(--tg-theme-text-color, #000)',
              fontSize: '15px',
            }}
          >
            <option value="">Выберите курс</option>
            {projects.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      {!currentProject ? (
        <div style={{ textAlign: 'center', color: 'var(--tg-theme-hint-color, #999)', padding: '40px 0' }}>
          Выберите или создайте курс
        </div>
      ) : isLoading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>Загрузка...</div>
      ) : (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
            {[
              { label: 'Участники', value: summary?.totalUsers || 0 },
              { label: 'Тесты', value: summary?.totalTests || 0 },
              { label: 'Попытки', value: summary?.totalAttempts || 0 },
              { label: 'На проверке', value: pendingHomework.length },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  background: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stat.value}</div>
                <div style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color, #999)' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '12px' }}>Быстрые действия</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: 'Создать курс', icon: '➕', path: '/projects/create' },
                { label: 'Загрузить материалы', icon: '📚', path: '/knowledge' },
                { label: 'Управление студентами', icon: '👥', path: '/admin/students' },
                { label: 'Проверить домашки', icon: '📝', path: '/homework/review' },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={() => navigate(action.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
                    color: 'var(--tg-theme-text-color, #000)',
                    fontSize: '15px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{action.icon}</span>
                  <span style={{ fontWeight: '500' }}>{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Pending Homework */}
          {pendingHomework.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', marginBottom: '12px' }}>
                Ожидают проверки ({pendingHomework.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {pendingHomework.slice(0, 5).map((hw: any) => (
                  <div
                    key={hw.id}
                    onClick={() => navigate('/homework/review')}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      background: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>
                        {hw.user?.firstName || hw.user?.username || 'Студент'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color, #999)' }}>
                        {hw.assignment?.title || 'Домашняя работа'} — {new Date(hw.submittedAt).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: '#ff950020',
                        color: '#ff9500',
                      }}
                    >
                      Новое
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
