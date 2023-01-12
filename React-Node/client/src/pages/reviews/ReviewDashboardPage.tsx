import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { reviewsApi } from '../../api/reviews.api';
import type { Article, PaginationMeta, ArticleStatus } from '../../types';
import Card, { CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import { formatDate, getErrorMessage } from '../../lib/utils';

export default function ReviewDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [articles, setArticles] = useState<Article[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const page = parseInt(searchParams.get('page') || '1', 10);

  const fetchArticles = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await reviewsApi.list({ page, perPage: 15 });
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Review Dashboard</h1>
      <p className="text-sm text-gray-500 mb-4">
        Articles awaiting review. Click to review and update their status.
      </p>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : articles.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <p className="text-gray-500">No articles pending review.</p>
          </CardBody>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {articles.map((article) => (
              <Link key={article.id} to={`/reviews/${article.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardBody>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-400 font-mono">{article.reference}</span>
                          <Badge status={article.status as ArticleStatus} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {article.title}
                        </h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span>By {article.user?.name}</span>
                          {article.journal && <span>{article.journal.name}</span>}
                          <span>Submitted {formatDate(article.createdAt)}</span>
                        </div>
                      </div>
                      <Button variant="secondary" size="sm">Review</Button>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>

          {meta && (
            <Pagination
              currentPage={meta.page}
              totalPages={meta.totalPages}
              onPageChange={(p) => setSearchParams({ page: String(p) })}
            />
          )}
        </>
      )}
    </div>
  );
}
