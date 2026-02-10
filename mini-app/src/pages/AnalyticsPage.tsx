import { useEffect, useState } from 'react';
import { useProjectStore } from '../store/project-store';
import { apiClient } from '../lib/api-client';

export function AnalyticsPage() {
  const currentProject = useProjectStore((s) => s.currentProject);
  const [summary, setSummary] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any>(null);
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (currentProject) loadData();
  }, [currentProject, period]);

  const loadData = async () => {
    if (!currentProject) return;
    setIsLoading(true);
    try {
      const [summaryData, leaderboardData] = await Promise.all([
        apiClient.getAnalyticsSummary(currentProject.id),
        apiClient.getLeaderboard(currentProject.id, period),
      ]);
      setSummary(summaryData);
      setLeaderboard(leaderboardData);
    } catch {
      // Ignore errors for now
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentProject) {
    return <div style={{ padding: '16px', textAlign: 'center', color: '#999' }}>Выберите проект</div>;
  }

  if (isLoading) return <div>Загрузка аналитики...</div>;

  return (
    <div>
      <h1 style={{ fontSize: '24px' }}>Аналитика</h1>

      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Участники', value: summary.totalUsers || 0 },
            { label: 'Тесты', value: summary.totalTests || 0 },
            { label: 'Попытки', value: summary.totalAttempts || 0 },
            { label: 'Домашки', value: summary.totalHomework || 0 },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                padding: '16px',
                borderRadius: '12px',
                background: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{stat.value}</div>
              <div style={{ fontSize: '14px', color: '#999' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '20px' }}>Рейтинг</h2>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          {(['week', 'month'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: 'none',
                background: period === p ? 'var(--tg-theme-button-color, #007aff)' : '#eee',
                color: period === p ? '#fff' : '#333',
                cursor: 'pointer',
              }}
            >
              {p === 'week' ? 'Неделя' : 'Месяц'}
            </button>
          ))}
        </div>
      </div>

      {leaderboard?.ranking?.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {leaderboard.ranking.map((entry: any, index: number) => (
            <div
              key={entry.userId || index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                borderRadius: '8px',
                background: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
              }}
            >
              <span style={{ fontSize: '20px', fontWeight: 'bold', width: '30px' }}>
                {index + 1}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold' }}>{entry.name || 'Студент'}</div>
                <div style={{ fontSize: '12px', color: '#999' }}>
                  {entry.score || 0} баллов
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', color: '#999', padding: '16px' }}>
          Нет данных для рейтинга
        </div>
      )}
    </div>
  );
}
