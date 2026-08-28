import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'TrustAgent — AI Investigation & Risk Assessment',
  description: 'AI that investigates before your business acts.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          <header className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                  </div>
                  <a href="/" className="text-xl font-bold text-gray-900">
                    TrustAgent
                  </a>
                </div>
                <nav className="flex items-center gap-6">
                  <a href="/" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                    Dashboard
                  </a>
                  <a href="/suppliers" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                    Suppliers
                  </a>
                  <span className="text-sm text-gray-400">|</span>
                  <span className="text-sm text-gray-500">
                    AI Investigation Platform
                  </span>
                </nav>
              </div>
            </div>
          </header>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
