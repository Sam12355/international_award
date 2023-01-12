import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { articlesApi } from '../../api/articles.api';
import type { Article, PaginationMeta, ArticleStatus } from '../../types';
import Card, { CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import { formatDate, formatFileSize, getErrorMessage } from '../../lib/utils';

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'All Statuses' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'PUBLISHED', label: 'Published' },
];

export default function ArticlesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [articles, setArticles] = useState<Article[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const page = parseInt(searchParams.get('page') || '1', 10);
  const status = searchParams.get('status') || '';

  const fetchArticles = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await articlesApi.list({
        page,
        perPage: 15,
        ...(status && { status }),
      });
      setArticles(response.data.data);
      setMeta(response.data.meta);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handlePageChange = (newPage: number) => {
    setSearchParams({ page: String(newPage), ...(status && { status }) });
  };

  const handleStatusChange = (newStatus: string) => {
    setSearchParams(newStatus ? { status: newStatus } : {});
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Articles</h1>

        <div className="flex items-center gap-3">
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="rounded-lg border border-gray-300 text-sm px-3 py-2 focus:ring-2 focus:ring-primary-500"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <Link to="/articles/new">
            <Button>Submit Article</Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : articles.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <p className="text-gray-500 mb-4">No articles found.</p>
            <Link to="/articles/new">
              <Button>Submit Your First Article</Button>
            </Link>
          </CardBody>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {articles.map((article) => (
              <Link key={article.id} to={`/articles/${article.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardBody>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-400 font-mono">{article.reference}</span>
                          <Badge status={article.status as ArticleStatus} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {article.title}
                        </h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          {article.journal && <span>{article.journal.name}</span>}
                          <span>{formatFileSize(article.fileSize)}</span>
                          <span>{formatDate(article.createdAt)}</span>
                        </div>
                      </div>
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
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  );
}
