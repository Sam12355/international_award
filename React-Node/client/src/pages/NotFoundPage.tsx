import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary-600">404</h1>
        <p className="mt-4 text-xl text-gray-700">Page not found</p>
        <p className="mt-2 text-sm text-gray-500">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link to="/" className="inline-block mt-6">
          <Button>Go Home</Button>
        </Link>
      </div>
    </div>
  );
}
