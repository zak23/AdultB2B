import Link from 'next/link';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/feed"
              className="text-lg font-bold text-primary-600 hover:text-primary-700"
            >
              AdultB2B
            </Link>
          </div>

          {/* Product */}
          <nav aria-label="Product">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Product
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/feed"
                  className="text-gray-500 hover:text-gray-900 text-sm"
                >
                  Feed
                </Link>
              </li>
              <li>
                <Link
                  href="/network"
                  className="text-gray-500 hover:text-gray-900 text-sm"
                >
                  Network
                </Link>
              </li>
              <li>
                <Link
                  href="/messages"
                  className="text-gray-500 hover:text-gray-900 text-sm"
                >
                  Messages
                </Link>
              </li>
              <li>
                <Link
                  href="/groups"
                  className="text-gray-500 hover:text-gray-900 text-sm"
                >
                  Groups
                </Link>
              </li>
            </ul>
          </nav>

          {/* Account */}
          <nav aria-label="Account">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Account
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/profile"
                  className="text-gray-500 hover:text-gray-900 text-sm"
                >
                  Profile
                </Link>
              </li>
              <li>
                <Link
                  href="/settings"
                  className="text-gray-500 hover:text-gray-900 text-sm"
                >
                  Settings
                </Link>
              </li>
            </ul>
          </nav>

          {/* Legal */}
          <nav aria-label="Legal">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Legal
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/privacy"
                  className="text-gray-500 hover:text-gray-900 text-sm"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-gray-500 hover:text-gray-900 text-sm"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </nav>

          {/* Support */}
          <nav aria-label="Support">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Support
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/contact"
                  className="text-gray-500 hover:text-gray-900 text-sm"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-center text-gray-500 text-sm">
            &copy; {year} AdultB2B. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
