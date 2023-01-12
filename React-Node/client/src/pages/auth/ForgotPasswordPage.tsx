import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '../../lib/validation';
import { authApi } from '../../api/auth.api';
import { getErrorMessage } from '../../lib/utils';

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      await authApi.forgotPassword(data.email);
      setSent(true);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <>
        <h1 className="text-xl font-bold text-gray-900 mb-6 text-center">Check your email</h1>
        <p className="text-sm text-gray-600 text-center">
          If an account with that email exists, we've sent a password reset link.
          Please check your inbox.
        </p>
        <Link
          to="/login"
          className="block mt-6 text-center text-sm font-medium text-primary-600 hover:text-primary-500"
        >
          Back to sign in
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="text-xl font-bold text-gray-900 mb-1 text-center">Forgot your password?</h1>
      <p className="text-sm text-gray-600 mb-6 text-center">Enter your email and we'll send a reset link</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Button type="submit" isLoading={isLoading} className="w-full">
          Send Reset Link
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
          Back to sign in
        </Link>
      </p>
    </>
  );
}
