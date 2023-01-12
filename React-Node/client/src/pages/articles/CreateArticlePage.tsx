import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Select from '../../components/ui/Select';
import FileInput from '../../components/ui/FileInput';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { articleSchema, type ArticleFormData } from '../../lib/validation';
import { articlesApi } from '../../api/articles.api';
import { journalsApi } from '../../api/users.api';
import { getErrorMessage } from '../../lib/utils';
import type { Journal } from '../../types';

export default function CreateArticlePage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [journalsLoading, setJournalsLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ArticleFormData>({
    resolver: zodResolver(articleSchema),
  });

  useEffect(() => {
    const loadJournals = async () => {
      try {
        const res = await journalsApi.list();
        setJournals(res.data.data);
      } catch (error) {
        toast.error('Failed to load journals');
      } finally {
        setJournalsLoading(false);
      }
    };
    loadJournals();
  }, []);

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
    if (!file) {
      setFileError('Manuscript file is required');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('journal_id', String(data.journal_id));
      formData.append('abstract', data.abstract);
      if (data.keywords) formData.append('keywords', data.keywords);
      formData.append('manuscript', file);

      await articlesApi.create(formData);
      toast.success('Article submitted successfully!');
      navigate('/articles');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  if (journalsLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Submit New Article</h1>

      <Card>
        <CardHeader>
          <p className="text-sm text-gray-600">
            Fill in the details below to submit your manuscript for review.
          </p>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Title"
              placeholder="Enter article title"
              error={errors.title?.message}
              {...register('title')}
            />

            <Select
              label="Journal"
              placeholder="Select a journal"
              options={journals.map((j) => ({ value: j.id, label: j.name }))}
              error={errors.journal_id?.message}
              {...register('journal_id')}
            />

            <Textarea
              label="Abstract"
              placeholder="Enter article abstract (minimum 50 characters)"
              rows={6}
              error={errors.abstract?.message}
              {...register('abstract')}
            />

            <Input
              label="Keywords"
              placeholder="e.g., agriculture, sustainability, crop yield"
              error={errors.keywords?.message}
              {...register('keywords')}
            />

            <FileInput
              label="Manuscript"
              accept=".pdf,.doc,.docx"
              hint="PDF, DOC, or DOCX up to 10MB"
              error={fileError}
              onChange={handleFileChange}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => navigate('/articles')}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isLoading}>
                Submit Article
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
