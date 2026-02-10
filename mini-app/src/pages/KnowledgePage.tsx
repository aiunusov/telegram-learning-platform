import { useEffect, useState } from 'react';
import { useProjectStore } from '../store/project-store';
import { apiClient } from '../lib/api-client';

export function KnowledgePage() {
  const currentProject = useProjectStore((s) => s.currentProject);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (currentProject) {
      loadDocuments();
    }
  }, [currentProject]);

  const loadDocuments = async () => {
    if (!currentProject) return;
    setIsLoading(true);
    try {
      const docs = await apiClient.getDocuments(currentProject.id);
      setDocuments(docs);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!currentProject) return;

    const filename = prompt('Введите название файла:');
    if (!filename) return;

    setIsUploading(true);
    try {
      const result = await apiClient.uploadDocument({
        projectId: currentProject.id,
        filename,
        contentType: 'text/plain',
      });
      await apiClient.confirmUpload(result.documentId);
      await loadDocuments();
    } catch {
      alert('Ошибка при загрузке');
    } finally {
      setIsUploading(false);
    }
  };

  if (!currentProject) {
    return (
      <div style={{ padding: '16px', textAlign: 'center', color: '#999' }}>
        Выберите проект
      </div>
    );
  }

  const statusLabels: Record<string, string> = {
    UPLOADED: 'Загружен',
    PROCESSING: 'Обработка...',
    INDEXED: 'Проиндексирован',
    FAILED: 'Ошибка',
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h1 style={{ fontSize: '24px', margin: 0 }}>Материалы</h1>
        <button
          onClick={handleUpload}
          disabled={isUploading}
          style={{
            background: 'var(--tg-theme-button-color, #007aff)',
            color: 'var(--tg-theme-button-text-color, #fff)',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            cursor: 'pointer',
          }}
        >
          {isUploading ? 'Загрузка...' : '+ Загрузить'}
        </button>
      </div>

      <p style={{ color: '#999', fontSize: '14px' }}>
        Проект: {currentProject.name}
      </p>

      {isLoading ? (
        <div>Загрузка...</div>
      ) : documents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px', color: '#999' }}>
          Нет загруженных материалов
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {documents.map((doc: any) => (
            <div
              key={doc.id}
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                background: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontWeight: 'bold' }}>{doc.filename}</div>
                <div style={{ fontSize: '12px', color: '#999' }}>
                  {doc._count?.chunks || 0} фрагментов
                </div>
              </div>
              <span
                style={{
                  fontSize: '12px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  background:
                    doc.status === 'INDEXED' ? '#e8f5e9' :
                    doc.status === 'FAILED' ? '#ffebee' : '#fff3e0',
                  color:
                    doc.status === 'INDEXED' ? '#2e7d32' :
                    doc.status === 'FAILED' ? '#c62828' : '#e65100',
                }}
              >
                {statusLabels[doc.status] || doc.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
