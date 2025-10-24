import React from 'react';

interface SkeletonProps {
  className?: string;
  children?: React.ReactNode;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = '', children }) => {
  return (
    <div className={`relative overflow-hidden bg-gray-200 rounded ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent"></div>
      {children}
    </div>
  );
};

// Skeleton components for different page layouts
export const HomePageSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Skeleton className="h-10 w-40 rounded-lg" />
            <div className="flex space-x-4">
              <Skeleton className="h-10 w-24 rounded-lg" />
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section Skeleton */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Skeleton className="h-16 w-96 mx-auto mb-6 rounded-xl" />
          <Skeleton className="h-8 w-80 mx-auto mb-8 rounded-lg" />
          <Skeleton className="h-14 w-40 mx-auto rounded-xl" />
        </div>
      </div>

      {/* Restaurants Grid Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Skeleton className="h-10 w-56 mb-12 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <Skeleton className="h-56 w-full" />
              <div className="p-6">
                <Skeleton className="h-7 w-3/4 mb-3 rounded-lg" />
                <Skeleton className="h-5 w-1/2 mb-4 rounded-md" />
                <div className="flex justify-between items-center">
                  <Skeleton className="h-5 w-24 rounded-md" />
                  <Skeleton className="h-10 w-28 rounded-xl" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const AdminPageSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header Skeleton */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Skeleton className="h-10 w-48 rounded-lg" />
            <div className="flex space-x-4">
              <Skeleton className="h-10 w-32 rounded-lg" />
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Admin Dashboard Content Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <Skeleton className="h-6 w-32 mb-4 rounded-lg" />
              <Skeleton className="h-12 w-20 rounded-xl" />
              <div className="mt-4">
                <Skeleton className="h-4 w-24 rounded-md" />
              </div>
            </div>
          ))}
        </div>

        {/* Charts/Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <Skeleton className="h-8 w-40 mb-6 rounded-lg" />
            <Skeleton className="h-80 w-full rounded-xl" />
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <Skeleton className="h-8 w-40 mb-6 rounded-lg" />
            <Skeleton className="h-80 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const LoginPageSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <Skeleton className="h-16 w-56 mx-auto mb-6 rounded-xl" />
          <Skeleton className="h-8 w-72 mx-auto rounded-lg" />
        </div>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-6 w-20 mb-3 rounded-md" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
          <div>
            <Skeleton className="h-6 w-20 mb-3 rounded-md" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
          <Skeleton className="h-14 w-full rounded-xl" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32 rounded-md" />
            <Skeleton className="h-6 w-24 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Skeleton;
