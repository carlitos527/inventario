import { type ReactNode } from 'react';
import Sidebar from '@/components/Sidebar';
import type { Route } from '@/lib/router';

export default function Layout({
  children,
  current,
}: {
  children: ReactNode;
  current: Route;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar current={current} />
      <main className="md:ml-72 pb-20 md:pb-0 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
