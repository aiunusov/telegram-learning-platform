import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth-store';
import { apiClient } from '../lib/api-client';

export function StudentDashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [projects, setProjects] = useState<any[]>([]);
  const [homework, setHomework] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const projectsList = await apiClient.getProjects();
      setProjects(projectsList || []);

      if (projectsList?.length > 0) {
        const firstProject = projectsList[0];
        const [hw, assigns, lb] = await Promise.all([
          apiClient.getStudentHomework(firstProject.id).catch(() => []),
          apiClient.getHomeworkAssignments(firstProject.id).catch(() => []),
          apiClient.getLeaderboard(firstProject.id, 'week').catch(() => null),
        ]);
        setHomework(hw || []);
        setAssignments(assigns || []);
        setLeaderboard(lb);
      }
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div style={{ padding: '16px', textAlign: 'center' }}>Загрузка...</div>;
  }

  const upcomingDeadlines = assignments
    .filter((a: any) => a.dueAt && new Date(a.dueAt) > new Date())
    .sort((a: any, b: any) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
    .slice(0, 5);

  const recentHomework = homework.slice(0, 5);

  const statusLabels: Record<string, string> = {
    SUBMITTED: 'Отправлено',
    REVIEWED: 'Проверено',
    NEEDS_FIX: 'На доработку',
    APPROVED: 'Принято',
  };

  const statusColors: Record<string, string> = {
    SUBMITTED: '#ff9500',
    REVIEWED: '#007aff',
    NEEDS_FIX: '#ff3b30',
    APPROVED: '#34c759',
  };

  return (
    <div>
      {/* Welcome */}
      <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>
        Привет, {user?.firstName || 'Студент'}!
      </h1>
      <p style={{ fontSize: '14px', color: 'var(--tg-theme-hint-color, #999)', marginBottom: '20px' }}>
        {user?.position || 'Учащийся'}
      </p>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
        {[
          { label: 'Мои курсы', value: projects.length },
          { label: 'Домашних работ', value: homework.length },
          { label: 'Принято', value: homework.filter((h: any) => h.status === 'APPROVED').length },
          { label: 'На проверке', value: homework.filter((h: any) => h.status === 'SUBMITTED').length },
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

      {/* My Courses */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '12px' }}>Мои курсы</h2>
        {projects.length === 0 ? (
          <div
            style={{
              padding: '20px',
              borderRadius: '12px',
              background: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
              textAlign: 'center',
              color: 'var(--tg-theme-hint-color, #999)',
            }}
          >
            Пока нет назначенных курсов. Обратитесь к преподавателю.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {projects.map((p: any) => (
              <div
                key={p.id}
                onClick={() => navigate('/tests')}
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  background: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: '600', fontSize: '15px' }}>{p.name}</div>
                  {p.description && (
                    <div style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color, #999)', marginTop: '2px' }}>
                      {p.description}
                    </div>
                  )}
                </div>
                <span style={{ fontSize: '18px' }}>→</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Deadlines */}
      {upcomingDeadlines.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '12px' }}>Ближайшие дедлайны</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {upcomingDeadlines.map((a: any) => {
              const dueDate = new Date(a.dueAt);
              const daysLeft = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              return (
                <div
                  key={a.id}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    background: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px' }}>{a.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color, #999)' }}>
                      {dueDate.toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: daysLeft <= 2 ? '#ff3b3020' : '#ff950020',
                      color: daysLeft <= 2 ? '#ff3b30' : '#ff9500',
                    }}
                  >
                    {daysLeft} дн.
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Homework */}
      {recentHomework.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '12px' }}>Последние работы</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentHomework.map((h: any) => (
              <div
                key={h.id}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: '600', fontSize: '14px' }}>
                    {h.assignment?.title || 'Домашняя работа'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color, #999)' }}>
                    {new Date(h.submittedAt).toLocaleDateString('ru-RU')}
                  </div>
                </div>
                <span
                  style={{
                    padding: '4px 8px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: '600',
                    background: statusColors[h.status] + '20',
                    color: statusColors[h.status] || '#999',
                  }}
                >
                  {statusLabels[h.status] || h.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard Preview */}
      {leaderboard?.ranking?.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '12px' }}>Рейтинг (неделя)</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {leaderboard.ranking.slice(0, 5).map((entry: any, index: number) => (
              <div
                key={entry.userId || index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px',
                  borderRadius: '10px',
                  background: entry.userId === user?.id
                    ? 'var(--tg-theme-button-color, #007aff)15'
                    : 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
                  border: entry.userId === user?.id
                    ? '1px solid var(--tg-theme-button-color, #007aff)'
                    : 'none',
                }}
              >
                <span style={{ fontSize: '16px', fontWeight: 'bold', width: '24px', textAlign: 'center' }}>
                  {index + 1}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', fontSize: '14px' }}>{entry.name || 'Студент'}</div>
                </div>
                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{entry.score || 0}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
