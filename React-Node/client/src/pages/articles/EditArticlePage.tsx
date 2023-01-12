import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import FileInput from '../../components/ui/FileInput';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { articleSchema, type ArticleFormData } from '../../lib/validation';
import { articlesApi } from '../../api/articles.api';
import { getErrorMessage, formatFileSize } from '../../lib/utils';
import type { Article } from '../../types';

export default function EditArticlePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [article, setArticle] = useState<Article | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ArticleFormData>({
    resolver: zodResolver(articleSchema),
  });

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const response = await articlesApi.get(Number(id));
        const data = response.data.data;
        setArticle(data);
        reset({
          title: data.title,
          journal_id: data.journal?.id || 0,
          abstract: data.abstract || '',
          keywords: data.keywords || '',
        });
      } catch (error) {
        toast.error(getErrorMessage(error));
        navigate('/articles');
      } finally {
        setIsLoading(false);
      }
    };
    fetchArticle();
  }, [id, navigate, reset]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    setFileError('');

    if (!selected) {
      setFile(null);
      return;
    }

    const ext = selected.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'doc', 'docx'].includes(ext || '')) {
      setFileError('Only PDF, DOC, and DOCX files are allowed');
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      setFileError('File size must not exceed 10MB');
      return;
    }

    setFile(selected);
  };

  const onSubmit = async (data: ArticleFormData) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('abstract', data.abstract);
      if (data.keywords) formData.append('keywords', data.keywords);
      if (file) formData.append('manuscript', file);

      await articlesApi.update(Number(id), formData);
      toast.success('Article updated successfully!');
      navigate(`/articles/${id}`);
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
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Article</h1>

      <Card>
        <CardHeader>
          <p className="text-sm text-gray-600">
            Update your article details. You can only edit articles that are still in "Submitted" status.
          </p>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Title"
              error={errors.title?.message}
              {...register('title')}
            />

            {/* Journal is read-only on edit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Journal</label>
              <p className="text-sm text-gray-900 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                {article.journal?.name}
              </p>
            </div>

            <Textarea
              label="Abstract"
              rows={6}
              error={errors.abstract?.message}
              {...register('abstract')}
            />

            <Input
              label="Keywords"
              error={errors.keywords?.message}
              {...register('keywords')}
            />

            <div>
              <FileInput
                label="Replace Manuscript"
                accept=".pdf,.doc,.docx"
                hint={`Current: ${article.originalFilename} (${formatFileSize(article.fileSize)}). Upload a new file to replace it.`}
                error={fileError}
                onChange={handleFileChange}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => navigate(`/articles/${id}`)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                Update Article
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
