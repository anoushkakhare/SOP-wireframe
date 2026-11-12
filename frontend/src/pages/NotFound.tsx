import React from 'react';
import { Link } from 'react-router-dom';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-bg-page flex items-center justify-center p-4 text-center">
      <div className="bg-surface border border-border p-8 rounded-card max-w-md space-y-4 shadow-card">
        <h1 className="text-4xl font-extrabold text-text-primary">404</h1>
        <p className="text-sm text-text-secondary">Page not found</p>
        <Link
          to="/"
          className="inline-block px-4 py-2 bg-primary-700 hover:bg-primary-900 text-white rounded-card text-xs font-semibold"
        >
          Return home
        </Link>
      </div>
    </div>
  );
};
