import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Card, { CardBody, CardHeader, CardFooter } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { ConfirmModal } from '../../components/ui/Modal';
import { articlesApi } from '../../api/articles.api';
import { useAuthStore } from '../../stores/authStore';
import { formatDate, formatFileSize, getErrorMessage } from '../../lib/utils';
import type { Article } from '../../types';

export default function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const response = await articlesApi.get(Number(id));
        setArticle(response.data.data);
      } catch (error) {
        toast.error(getErrorMessage(error));
        navigate('/articles');
      } finally {
        setIsLoading(false);
      }
    };
    fetchArticle();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!article) return;
    setIsDeleting(true);
    try {
      await articlesApi.delete(article.id);
      toast.success('Article deleted');
      navigate('/articles');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!article) return null;

  const isOwner = user?.id === article.user?.id;
  const canEdit = isOwner && article.status === 'SUBMITTED';
  const canDelete = isOwner && !['APPROVED', 'PUBLISHED'].includes(article.status);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Link to="/articles" className="text-sm text-gray-500 hover:text-gray-700">
          Articles
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-900 font-mono">{article.reference}</span>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge status={article.status} />
                <span className="text-xs text-gray-400 font-mono">{article.reference}</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">{article.title}</h1>
            </div>

            <div className="flex gap-2 shrink-0">
              {canEdit && (
                <Link to={`/articles/${article.id}/edit`}>
                  <Button variant="secondary" size="sm">Edit</Button>
                </Link>
              )}
              {canDelete && (
                <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)}>
                  Delete
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardBody className="space-y-6">
          {/* Metadata grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-500">Journal</span>
              <p className="text-gray-900">{article.journal?.name || '—'}</p>
            </div>
            <div>
              <span className="font-medium text-gray-500">Author</span>
              <p className="text-gray-900">{article.user?.name || '—'}</p>
            </div>
            <div>
              <span className="font-medium text-gray-500">Submitted</span>
              <p className="text-gray-900">{formatDate(article.createdAt)}</p>
            </div>
            <div>
              <span className="font-medium text-gray-500">File</span>
              <p className="text-gray-900">
                {article.originalFilename} ({formatFileSize(article.fileSize)})
              </p>
            </div>
            {article.reviewedAt && (
              <div>
                <span className="font-medium text-gray-500">Reviewed</span>
                <p className="text-gray-900">{formatDate(article.reviewedAt)}</p>
              </div>
            )}
            {article.publishedAt && (
              <div>
                <span className="font-medium text-gray-500">Published</span>
                <p className="text-gray-900">{formatDate(article.publishedAt)}</p>
              </div>
            )}
            {article.doi && (
              <div className="sm:col-span-2">
                <span className="font-medium text-gray-500">DOI</span>
                <p className="text-gray-900 font-mono text-xs">{article.doi}</p>
              </div>
            )}
          </div>

          {/* Abstract */}
          {article.abstract && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Abstract</h3>
              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                {article.abstract}
              </p>
            </div>
          )}

          {/* Keywords */}
          {article.keywords && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {article.keywords.split(',').map((kw, i) => (
                  <span
                    key={i}
                    className="inline-flex px-2 py-1 rounded-md bg-gray-100 text-xs text-gray-700"
                  >
                    {kw.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Review assignments */}
          {article.reviewAssignments && article.reviewAssignments.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Review Assignments</h3>
              <div className="space-y-2">
                {article.reviewAssignments.map((ra, i) => (
                  <div key={i} className="flex justify-between items-center text-sm bg-gray-50 rounded-lg px-4 py-2">
                    <span className="text-gray-900">{ra.reviewer}</span>
                    <span className="text-gray-500 capitalize">{ra.status.toLowerCase()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardBody>

        <CardFooter>
          <Link to="/articles">
            <Button variant="ghost" size="sm">Back to Articles</Button>
          </Link>
        </CardFooter>
      </Card>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Article"
        message={`Are you sure you want to delete "${article.title}"? This action cannot be undone.`}
        confirmText="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
}
