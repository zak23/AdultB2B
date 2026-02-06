import Link from 'next/link';

export default function AppNotFound() {
  return (
    <div className="card p-8 text-center max-w-md mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-2">Page not found</h1>
      <p className="text-gray-500 mb-6">
        The page you’re looking for doesn’t exist or has been moved.
      </p>
      <Link href="/feed" className="btn-primary">
        Back to Feed
      </Link>
    </div>
  );
}
