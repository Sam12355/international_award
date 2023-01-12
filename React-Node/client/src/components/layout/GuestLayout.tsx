import { Link, Outlet } from 'react-router-dom';

export default function GuestLayout() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold text-primary-600">
            SJP
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
