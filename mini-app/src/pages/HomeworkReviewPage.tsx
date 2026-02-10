import { useEffect, useState } from 'react';
import { useProjectStore } from '../store/project-store';
import { apiClient } from '../lib/api-client';

export function HomeworkReviewPage() {
  const currentProject = useProjectStore((s) => s.currentProject);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('SUBMITTED');
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewScore, setReviewScore] = useState<number>(0);
  const [reviewStatus, setReviewStatus] = useState<string>('APPROVED');

  useEffect(() => {
    if (currentProject) loadSubmissions();
  }, [currentProject, filter]);

  const loadSubmissions = async () => {
    if (!currentProject) return;
    setIsLoading(true);
    try {
      const result = await apiClient.getAdminHomework(currentProject.id, filter);
      setSubmissions(result);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = async (submissionId: string) => {
    if (!reviewComment.trim() || reviewComment.length < 10) {
      alert('Комментарий должен быть не менее 10 символов');
      return;
    }

    try {
      await apiClient.reviewHomework(submissionId, {
        status: reviewStatus,
        score: reviewScore,
        comment: reviewComment,
      });
      setReviewingId(null);
      setReviewComment('');
      setReviewScore(0);
      await loadSubmissions();
    } catch {
      alert('Ошибка при проверке');
    }
  };

  if (!currentProject) {
    return <div style={{ padding: '16px', textAlign: 'center', color: '#999' }}>Выберите проект</div>;
  }

  const statusLabels: Record<string, string> = {
    SUBMITTED: 'На проверке',
    REVIEWED: 'Проверено',
    NEEDS_FIX: 'На доработку',
    APPROVED: 'Принято',
  };

  return (
    <div>
      <h1 style={{ fontSize: '24px' }}>Домашние задания</h1>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {['SUBMITTED', 'NEEDS_FIX', 'APPROVED', 'REVIEWED'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              padding: '6px 12px',
              borderRadius: '16px',
              border: 'none',
              background: filter === s ? 'var(--tg-theme-button-color, #007aff)' : '#eee',
              color: filter === s ? '#fff' : '#333',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            {statusLabels[s]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div>Загрузка...</div>
      ) : submissions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px', color: '#999' }}>
          Нет домашних заданий
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {submissions.map((sub: any) => (
            <div
              key={sub.id}
              style={{
                padding: '16px',
                borderRadius: '12px',
                background: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <strong>{sub.user?.firstName || sub.user?.username || 'Студент'}</strong>
                <span style={{ fontSize: '12px', color: '#999' }}>
                  {new Date(sub.submittedAt).toLocaleDateString('ru-RU')}
                </span>
              </div>

              <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                {sub.contentType === 'text' && (
                  <p style={{ margin: 0 }}>{sub.contentText?.substring(0, 200)}...</p>
                )}
                {sub.contentType === 'link' && (
                  <a href={sub.contentText} target="_blank" rel="noopener noreferrer">
                    {sub.contentText}
                  </a>
                )}
                {sub.contentType === 'file' && (
                  <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer">
                    Скачать файл
                  </a>
                )}
              </div>

              {sub.review && (
                <div
                  style={{
                    padding: '8px',
                    borderRadius: '6px',
                    background: '#e8f5e9',
                    fontSize: '13px',
                    marginBottom: '8px',
                  }}
                >
                  Оценка: {sub.review.score}/100 | {sub.review.comment}
                </div>
              )}

              {sub.status === 'SUBMITTED' && reviewingId !== sub.id && (
                <button
                  onClick={() => setReviewingId(sub.id)}
                  style={{
                    background: 'var(--tg-theme-button-color, #007aff)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Проверить
                </button>
              )}

              {reviewingId === sub.id && (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <label>Оценка:</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={reviewScore}
                      onChange={(e) => setReviewScore(Number(e.target.value))}
                      style={{ width: '60px', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                    <select
                      value={reviewStatus}
                      onChange={(e) => setReviewStatus(e.target.value)}
                      style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
                    >
                      <option value="APPROVED">Принято</option>
                      <option value="NEEDS_FIX">На доработку</option>
                      <option value="REVIEWED">Проверено</option>
                    </select>
                  </div>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Комментарий (мин. 10 символов)"
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid #ccc',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleReview(sub.id)}
                      style={{
                        background: '#4caf50',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        cursor: 'pointer',
                      }}
                    >
                      Сохранить
                    </button>
                    <button
                      onClick={() => setReviewingId(null)}
                      style={{
                        background: '#eee',
                        color: '#333',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        cursor: 'pointer',
                      }}
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
