import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { loginSchema, type LoginFormData } from '../../lib/validation';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../stores/authStore';
import { getErrorMessage } from '../../lib/utils';

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(data);
      const { user, tokens } = response.data;
      setAuth(user, tokens.accessToken, tokens.refreshToken);
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/articles');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <h1 className="text-xl font-bold text-gray-900 mb-6 text-center">Sign in to your account</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="flex items-center justify-between">
          <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-500">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" isLoading={isLoading} className="w-full">
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
          Create one
        </Link>
      </p>
    </>
  );
}
