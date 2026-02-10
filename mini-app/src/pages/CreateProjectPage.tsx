import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../store/project-store';

export function CreateProjectPage() {
  const navigate = useNavigate();
  const createProject = useProjectStore((s) => s.createProject);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await createProject({ name: name.trim(), description: description.trim() || undefined });
      navigate('/projects');
    } catch (error) {
      alert('Ошибка при создании проекта');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: '24px' }}>Новый проект</h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
            Название *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Введите название проекта"
            required
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid var(--tg-theme-hint-color, #ccc)',
              background: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
              fontSize: '16px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
            Описание
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Описание проекта (необязательно)"
            rows={4}
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
          disabled={isSubmitting || !name.trim()}
          style={{
            background: 'var(--tg-theme-button-color, #007aff)',
            color: 'var(--tg-theme-button-text-color, #fff)',
            border: 'none',
            borderRadius: '8px',
            padding: '14px',
            fontSize: '16px',
            cursor: isSubmitting ? 'wait' : 'pointer',
            opacity: isSubmitting || !name.trim() ? 0.6 : 1,
          }}
        >
          {isSubmitting ? 'Создание...' : 'Создать проект'}
        </button>
      </form>
    </div>
  );
}
