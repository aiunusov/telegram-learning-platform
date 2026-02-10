import { useEffect, useState } from 'react';
import { useProjectStore } from '../store/project-store';
import { apiClient } from '../lib/api-client';

export function TestsPage() {
  const currentProject = useProjectStore((s) => s.currentProject);
  const [tests, setTests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (currentProject) loadTests();
  }, [currentProject]);

  const loadTests = async () => {
    if (!currentProject) return;
    setIsLoading(true);
    try {
      const result = await apiClient.getTests(currentProject.id);
      setTests(result);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!currentProject) return;
    const topic = prompt('Тема теста:');
    if (!topic) return;

    const difficulty = prompt('Сложность (easy/medium/hard):', 'medium');
    if (!difficulty) return;

    setIsGenerating(true);
    try {
      await apiClient.generateTests({
        projectId: currentProject.id,
        topics: [topic],
        difficulty,
        count: 1,
      });
      alert('Генерация запущена. Обновите страницу через несколько секунд.');
      setTimeout(loadTests, 5000);
    } catch {
      alert('Ошибка генерации');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = async (testId: string) => {
    try {
      await apiClient.publishTest(testId);
      await loadTests();
    } catch {
      alert('Ошибка публикации');
    }
  };

  if (!currentProject) {
    return <div style={{ padding: '16px', textAlign: 'center', color: '#999' }}>Выберите проект</div>;
  }

  const statusLabels: Record<string, string> = {
    DRAFT: 'Черновик',
    PUBLISHED: 'Опубликован',
    ARCHIVED: 'Архив',
  };

  const diffLabels: Record<string, string> = {
    easy: 'Лёгкий',
    medium: 'Средний',
    hard: 'Сложный',
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h1 style={{ fontSize: '24px', margin: 0 }}>Тесты</h1>
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          style={{
            background: 'var(--tg-theme-button-color, #007aff)',
            color: 'var(--tg-theme-button-text-color, #fff)',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            cursor: 'pointer',
          }}
        >
          {isGenerating ? 'Генерация...' : '+ Сгенерировать'}
        </button>
      </div>

      {isLoading ? (
        <div>Загрузка...</div>
      ) : tests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px', color: '#999' }}>
          Нет тестов. Сгенерируйте первый тест с помощью AI.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {tests.map((test: any) => (
            <div
              key={test.id}
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                background: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{test.topic}</div>
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                    {diffLabels[test.difficulty] || test.difficulty} | {test._count?.attempts || 0} попыток
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '12px',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      background: test.status === 'PUBLISHED' ? '#e8f5e9' : '#fff3e0',
                      color: test.status === 'PUBLISHED' ? '#2e7d32' : '#e65100',
                    }}
                  >
                    {statusLabels[test.status]}
                  </span>
                  {test.status === 'DRAFT' && (
                    <button
                      onClick={() => handlePublish(test.id)}
                      style={{
                        background: '#4caf50',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      Опубликовать
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
