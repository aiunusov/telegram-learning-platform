import { useState } from 'react';
import { useProjectStore } from '../store/project-store';
import { apiClient } from '../lib/api-client';

export function HomeworkSubmitPage() {
  const currentProject = useProjectStore((s) => s.currentProject);
  const [contentType, setContentType] = useState<'text' | 'link' | 'file'>('text');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !content.trim()) return;

    setIsSubmitting(true);
    try {
      await apiClient.submitHomework({
        projectId: currentProject.id,
        contentType,
        contentText: contentType !== 'file' ? content : undefined,
        fileUrl: contentType === 'file' ? content : undefined,
      });
      setSuccess(true);
      setContent('');
    } catch {
      alert('Ошибка при отправке');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentProject) {
    return <div style={{ padding: '16px', textAlign: 'center', color: '#999' }}>Выберите проект</div>;
  }

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
        <h2>Домашка отправлена!</h2>
        <p style={{ color: '#999' }}>Ожидайте проверки преподавателем</p>
        <button
          onClick={() => setSuccess(false)}
          style={{
            background: 'var(--tg-theme-button-color, #007aff)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            cursor: 'pointer',
            marginTop: '16px',
          }}
        >
          Отправить ещё
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: '24px' }}>Сдать домашку</h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Тип ответа
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {([
              { value: 'text', label: 'Текст' },
              { value: 'link', label: 'Ссылка' },
              { value: 'file', label: 'Файл' },
            ] as const).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setContentType(option.value)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  background:
                    contentType === option.value
                      ? 'var(--tg-theme-button-color, #007aff)'
                      : '#eee',
                  color: contentType === option.value ? '#fff' : '#333',
                  cursor: 'pointer',
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
            {contentType === 'text'
              ? 'Текст ответа'
              : contentType === 'link'
                ? 'URL ссылки'
                : 'URL файла'}
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              contentType === 'text'
                ? 'Введите текст домашнего задания...'
                : contentType === 'link'
                  ? 'https://...'
                  : 'https://drive.google.com/...'
            }
            rows={contentType === 'text' ? 8 : 3}
            required
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid var(--tg-theme-hint-color, #ccc)',
              background: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
              fontSize: '16px',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          style={{
            background: 'var(--tg-theme-button-color, #007aff)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '14px',
            fontSize: '16px',
            cursor: isSubmitting ? 'wait' : 'pointer',
            opacity: isSubmitting || !content.trim() ? 0.6 : 1,
          }}
        >
          {isSubmitting ? 'Отправка...' : 'Отправить'}
        </button>
      </form>
    </div>
  );
}
