import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import Card, { CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import { ConfirmModal } from '../../components/ui/Modal';
import { publishApi } from '../../api/publish.api';
import { formatDate, getErrorMessage } from '../../lib/utils';
import type { Article, PaginationMeta, PublishResponse } from '../../types';

export default function PublishPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const [confirmArticle, setConfirmArticle] = useState<Article | null>(null);

  const fetchArticles = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await publishApi.list({ page, perPage: 15 });
      setArticles(response.data.data);
      setMeta(response.data.meta);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handlePublish = async () => {
    if (!confirmArticle) return;
    setPublishingId(confirmArticle.id);
    setConfirmArticle(null);

    try {
      const response = await publishApi.publish(confirmArticle.id);
      const result: PublishResponse = response.data;

      if (result.warnings && result.warnings.length > 0) {
        result.warnings.forEach((w: string) => toast(w, { icon: '⚠️' }));
      }

      toast.success(`Article published! DOI: ${result.data.doi || 'N/A'}`);
      fetchArticles();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setPublishingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Publish Articles</h1>
        <p className="text-sm text-gray-500 mt-1">
          Approved articles ready for publication with DOI registration
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : articles.length === 0 ? (
        <Card>
          <CardBody>
            <p className="text-center text-gray-500 py-6">
              No approved articles awaiting publication.
            </p>
          </CardBody>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {articles.map((article) => (
              <Card key={article.id}>
                <CardBody>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge status={article.status} />
                        <span className="text-xs text-gray-400 font-mono">
                          {article.reference}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 truncate">
                        {article.title}
                      </h3>
                      <div className="flex gap-4 mt-2 text-sm text-gray-500">
                        <span>By {article.user?.name}</span>
                        <span>{article.journal?.name}</span>
                        <span>Submitted {formatDate(article.createdAt)}</span>
                      </div>
                      {article.abstract && (
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                          {article.abstract}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      isLoading={publishingId === article.id}
                      disabled={publishingId !== null}
                      onClick={() => setConfirmArticle(article)}
                    >
                      Publish
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>

          {meta && meta.totalPages > 1 && (
            <Pagination
              currentPage={meta.page}
              totalPages={meta.totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      <ConfirmModal
        isOpen={confirmArticle !== null}
        onClose={() => setConfirmArticle(null)}
        onConfirm={handlePublish}
        title="Publish Article"
        message={`This will register a DOI and index "${confirmArticle?.title}" on Scholar. This action cannot be undone.`}
        confirmText="Publish"
      />
    </div>
  );
}
