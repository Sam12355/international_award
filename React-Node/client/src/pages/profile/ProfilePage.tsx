import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { ConfirmModal } from '../../components/ui/Modal';
import {
  profileSchema,
  passwordSchema,
  type ProfileFormData,
  type PasswordFormData,
} from '../../lib/validation';
import { usersApi } from '../../api/users.api';
import { useAuthStore } from '../../stores/authStore';
import { getErrorMessage } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { setUser, logout } = useAuthStore();
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await usersApi.me();
        const data = response.data.data;
        profileForm.reset({ name: data.name, email: data.email });
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setIsLoadingProfile(false);
      }
    };
    fetchProfile();
  }, [profileForm]);

  const handleProfileUpdate = async (data: ProfileFormData) => {
    try {
      const response = await usersApi.updateProfile(data);
      setUser(response.data.data);
      toast.success('Profile updated!');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handlePasswordUpdate = async (data: PasswordFormData) => {
    try {
      await usersApi.updatePassword({
        currentPassword: data.currentPassword,
        password: data.password,
        passwordConfirmation: data.passwordConfirmation,
      });
      passwordForm.reset();
      toast.success('Password changed!');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleDeleteAccount = async () => {
    setShowDeleteModal(false);
    try {
      await usersApi.deleteAccount();
      logout();
      navigate('/login');
      toast.success('Account deleted.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Profile</h1>

      {/* Profile info */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Account Information</h2>
        </CardHeader>
        <CardBody>
          <form
            onSubmit={profileForm.handleSubmit(handleProfileUpdate)}
            className="space-y-4"
          >
            <Input
              label="Name"
              error={profileForm.formState.errors.name?.message}
              {...profileForm.register('name')}
            />
            <Input
              label="Email"
              type="email"
              error={profileForm.formState.errors.email?.message}
              {...profileForm.register('email')}
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                isLoading={profileForm.formState.isSubmitting}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
        </CardHeader>
        <CardBody>
          <form
            onSubmit={passwordForm.handleSubmit(handlePasswordUpdate)}
            className="space-y-4"
          >
            <Input
              label="Current Password"
              type="password"
              error={passwordForm.formState.errors.currentPassword?.message}
              {...passwordForm.register('currentPassword')}
            />
            <Input
              label="New Password"
              type="password"
              error={passwordForm.formState.errors.password?.message}
              {...passwordForm.register('password')}
            />
            <Input
              label="Confirm New Password"
              type="password"
              error={passwordForm.formState.errors.passwordConfirmation?.message}
              {...passwordForm.register('passwordConfirmation')}
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                isLoading={passwordForm.formState.isSubmitting}
              >
                Update Password
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Danger zone */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-red-600">Danger Zone</h2>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Delete Account</p>
              <p className="text-sm text-gray-500">
                Permanently remove your account and all associated data.
              </p>
            </div>
            <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)}>
              Delete
            </Button>
          </div>
        </CardBody>
      </Card>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message="Are you sure you want to delete your account? This action is permanent and cannot be undone."
        confirmText="Delete Account"
      />
    </div>
  );
}
