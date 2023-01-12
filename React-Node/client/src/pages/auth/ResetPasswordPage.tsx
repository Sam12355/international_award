import { useState } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { resetPasswordSchema, type ResetPasswordFormData } from '../../lib/validation';
import { authApi } from '../../api/auth.api';
import { getErrorMessage } from '../../lib/utils';

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const email = searchParams.get('email') || '';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return;

    setIsLoading(true);
    try {
      await authApi.resetPassword({
        token,
        email,
        password: data.password,
        passwordConfirmation: data.passwordConfirmation,
      });
      toast.success('Password has been reset successfully!');
      navigate('/login');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <h1 className="text-xl font-bold text-gray-900 mb-6 text-center">Reset your password</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="New Password"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          error={errors.passwordConfirmation?.message}
          {...register('passwordConfirmation')}
        />

        <Button type="submit" isLoading={isLoading} className="w-full">
          Reset Password
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
