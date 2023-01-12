import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { registerSchema, type RegisterFormData } from '../../lib/validation';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../stores/authStore';
import { getErrorMessage } from '../../lib/utils';

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const response = await authApi.register(data);
      const { user, tokens } = response.data;
      setAuth(user, tokens.accessToken, tokens.refreshToken);
      toast.success('Account created successfully!');
      navigate('/articles');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <h1 className="text-xl font-bold text-gray-900 mb-1 text-center">Create your account</h1>
      <p className="text-sm text-gray-600 mb-6 text-center">Join the Scientific Journal Platform</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full Name"
          placeholder="John Doe"
          error={errors.name?.message}
          {...registerField('name')}
        />

        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...registerField('email')}
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...registerField('password')}
        />

        <Input
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          error={errors.passwordConfirmation?.message}
          {...registerField('passwordConfirmation')}
        />

        <Button type="submit" isLoading={isLoading} className="w-full">
          Create Account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
          Sign in
        </Link>
      </p>
    </>
  );
}
