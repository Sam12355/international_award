import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { reviewStatusSchema, type ReviewStatusFormData } from '../../lib/validation';
import { reviewsApi } from '../../api/reviews.api';
import { formatDate, formatFileSize, getErrorMessage } from '../../lib/utils';
import type { Article } from '../../types';

const STATUS_OPTIONS = [
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

export default function ReviewArticlePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReviewStatusFormData>({
    resolver: zodResolver(reviewStatusSchema),
  });

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const response = await reviewsApi.get(Number(id));
        const data = response.data.data;
        setArticle(data);
        reset({ status: data.status as ReviewStatusFormData['status'] });
      } catch (error) {
        toast.error(getErrorMessage(error));
        navigate('/reviews');
      } finally {
        setIsLoading(false);
      }
    };
    fetchArticle();
  }, [id, navigate, reset]);

  const onSubmit = async (data: ReviewStatusFormData) => {
    setIsSubmitting(true);
    try {
      await reviewsApi.updateStatus(Number(id), {
        status: data.status,
        reviewer_notes: data.reviewer_notes,
      });
      toast.success('Article status updated!');
      navigate('/reviews');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
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

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Link to="/reviews" className="text-sm text-gray-500 hover:text-gray-700">
          Reviews
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-900 font-mono">{article.reference}</span>
      </div>

      {/* Article details */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge status={article.status} />
            <span className="text-xs text-gray-400 font-mono">{article.reference}</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">{article.title}</h1>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-500">Author</span>
              <p className="text-gray-900">{article.user?.name}</p>
            </div>
            <div>
              <span className="font-medium text-gray-500">Journal</span>
              <p className="text-gray-900">{article.journal?.name}</p>
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
          </div>

          {article.abstract && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Abstract</h3>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{article.abstract}</p>
            </div>
          )}

          {article.keywords && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Keywords</h3>
              <p className="text-sm text-gray-700">{article.keywords}</p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Review form */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Update Status</h2>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Select
              label="Status"
              options={STATUS_OPTIONS}
              error={errors.status?.message}
              {...register('status')}
            />

            <Textarea
              label="Reviewer Notes (optional)"
              placeholder="Add any notes for the author..."
              rows={4}
              error={errors.reviewer_notes?.message}
              {...register('reviewer_notes')}
            />

            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => navigate('/reviews')}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                Update Status
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
