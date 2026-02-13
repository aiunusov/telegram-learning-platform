import { useEffect, useState } from 'react';
import { useProjectStore } from '../store/project-store';
import { apiClient } from '../lib/api-client';

export function AdminStudentsPage() {
  const projects = useProjectStore((s) => s.projects);
  const fetchProjects = useProjectStore((s) => s.fetchProjects);

  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [assigningProject, setAssigningProject] = useState<{ userId: string; projectId: string } | null>(null);

  useEffect(() => {
    loadStudents();
    if (projects.length === 0) fetchProjects();
  }, []);

  const loadStudents = async () => {
    setIsLoading(true);
    try {
      const users = await apiClient.getAllUsers();
      setStudents(users || []);
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssign = async (userId: string, projectId: string) => {
    setAssigningProject({ userId, projectId });
    try {
      await apiClient.assignStudentToProject(userId, projectId);
      await loadStudents();
    } catch {
      // Ignore
    } finally {
      setAssigningProject(null);
    }
  };

  const handleRemove = async (userId: string, projectId: string) => {
    try {
      await apiClient.removeStudentFromProject(userId, projectId);
      await loadStudents();
    } catch {
      // Ignore
    }
  };

  const filtered = students.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (s.firstName || '').toLowerCase().includes(q) ||
      (s.lastName || '').toLowerCase().includes(q) ||
      (s.username || '').toLowerCase().includes(q)
    );
  });

  if (isLoading) {
    return <div style={{ padding: '16px', textAlign: 'center' }}>Загрузка студентов...</div>;
  }

  return (
    <div>
      <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>Студенты</h1>

      {/* Search */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Поиск по имени или username..."
        style={{
          width: '100%',
          padding: '10px 14px',
          borderRadius: '10px',
          border: '1px solid var(--tg-theme-hint-color, #ccc)',
          background: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
          color: 'var(--tg-theme-text-color, #000)',
          fontSize: '15px',
          marginBottom: '16px',
          outline: 'none',
        }}
      />

      {/* Stats */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <div
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '10px',
            background: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{students.length}</div>
          <div style={{ fontSize: '11px', color: 'var(--tg-theme-hint-color, #999)' }}>Всего</div>
        </div>
        <div
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '10px',
            background: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
            {students.filter((s) => s._count?.projectMemberships > 0).length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--tg-theme-hint-color, #999)' }}>С курсами</div>
        </div>
        <div
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '10px',
            background: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
            {students.filter((s) => !s.onboardingCompleted).length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--tg-theme-hint-color, #999)' }}>Без профиля</div>
        </div>
      </div>

      {/* Student List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filtered.map((student) => {
          const isExpanded = expandedId === student.id;
          const initials = `${(student.firstName || '?')[0]}${(student.lastName || '')[0] || ''}`.toUpperCase();

          return (
            <div
              key={student.id}
              style={{
                borderRadius: '12px',
                background: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : student.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: student.onboardingCompleted
                      ? 'var(--tg-theme-button-color, #007aff)'
                      : 'var(--tg-theme-hint-color, #999)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    flexShrink: 0,
                  }}
                >
                  {initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '600', fontSize: '14px' }}>
                    {student.firstName || '?'} {student.lastName || ''}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color, #999)' }}>
                    @{student.username || 'no_username'} · {student.position || 'Без позиции'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      padding: '2px 6px',
                      borderRadius: '6px',
                      fontSize: '10px',
                      fontWeight: '600',
                      background: student.role === 'ADMIN' ? '#ff950030' : '#007aff20',
                      color: student.role === 'ADMIN' ? '#ff9500' : '#007aff',
                    }}
                  >
                    {student.role === 'ADMIN' ? 'Админ' : 'Студент'}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color, #999)' }}>
                    {student._count?.projectMemberships || 0} курс.
                  </span>
                  <span style={{ fontSize: '14px', transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
                    ▸
                  </span>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div style={{ padding: '0 12px 12px', borderTop: '1px solid var(--tg-theme-hint-color, #ccc)30' }}>
                  {/* Stats */}
                  <div style={{ display: 'flex', gap: '8px', margin: '12px 0' }}>
                    <span style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color, #999)' }}>
                      Тесты: {student._count?.testAttempts || 0}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color, #999)' }}>
                      ДЗ: {student._count?.homeworkSubmissions || 0}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color, #999)' }}>
                      Регистрация: {new Date(student.createdAt).toLocaleDateString('ru-RU')}
                    </span>
                  </div>

                  {/* Assign Course */}
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Назначить курс:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {projects.map((p: any) => {
                        const isAssigning = assigningProject?.userId === student.id && assigningProject?.projectId === p.id;
                        return (
                          <button
                            key={p.id}
                            onClick={() => handleAssign(student.id, p.id)}
                            disabled={isAssigning}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '8px',
                              border: 'none',
                              background: 'var(--tg-theme-button-color, #007aff)',
                              color: '#fff',
                              fontSize: '12px',
                              cursor: 'pointer',
                              opacity: isAssigning ? 0.5 : 1,
                            }}
                          >
                            {isAssigning ? '...' : `+ ${p.name}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--tg-theme-hint-color, #999)', padding: '40px 0' }}>
          {search ? 'Студенты не найдены' : 'Пока нет зарегистрированных студентов'}
        </div>
      )}
    </div>
  );
}
