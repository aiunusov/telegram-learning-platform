import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../store/project-store';

export function ProjectsPage() {
  const navigate = useNavigate();
  const { projects, isLoading, fetchProjects, setCurrentProject } =
    useProjectStore();

  useEffect(() => {
    fetchProjects();
  }, []);

  if (isLoading) {
    return <div style={{ padding: '16px' }}>Загрузка проектов...</div>;
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <h1 style={{ fontSize: '24px', margin: 0 }}>Проекты</h1>
        <button
          onClick={() => navigate('/projects/create')}
          style={{
            background: 'var(--tg-theme-button-color, #007aff)',
            color: 'var(--tg-theme-button-text-color, #fff)',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            cursor: 'pointer',
          }}
        >
          + Создать
        </button>
      </div>

      {projects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px', color: '#999' }}>
          <p>Нет проектов</p>
          <p>Создайте первый проект, чтобы начать</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {projects.map((project: any) => (
            <div
              key={project.id}
              onClick={() => {
                setCurrentProject(project);
                navigate('/knowledge');
              }}
              style={{
                padding: '16px',
                borderRadius: '12px',
                background: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
                cursor: 'pointer',
              }}
            >
              <h3 style={{ margin: '0 0 4px 0' }}>{project.name}</h3>
              {project.description && (
                <p
                  style={{
                    margin: 0,
                    color: 'var(--tg-theme-hint-color, #999)',
                    fontSize: '14px',
                  }}
                >
                  {project.description}
                </p>
              )}
              {project._count && (
                <div
                  style={{
                    marginTop: '8px',
                    fontSize: '12px',
                    color: 'var(--tg-theme-hint-color, #999)',
                  }}
                >
                  {project._count.members} участников
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
