'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  FileText, 
  Key, 
  DollarSign, 
  Clock, 
  FolderOpen,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { logout } from '@/lib/auth';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Beranda' },
  { href: '/tasks', icon: CheckSquare, label: 'Tugas' },
  { href: '/notes', icon: FileText, label: 'Catatan' },
  { href: '/passwords', icon: Key, label: 'Kata Sandi' },
  { href: '/finance', icon: DollarSign, label: 'Keuangan' },
  { href: '/files', icon: FolderOpen, label: 'File' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/');
    router.refresh();
  };

  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      {/* Mobile Menu Button - Pojok Kiri Bawah */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 z-50 lg:hidden w-14 h-14 rounded-full bg-gray-900 text-white shadow-lg flex items-center justify-center hover:bg-gray-800 transition-all active:scale-95"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-100 z-40 transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="h-16 border-b border-gray-100 flex items-center px-6">
          <h1 className="text-lg font-semibold text-gray-900">Catatan Pengemis</h1>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 h-[calc(100vh-8rem)] overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || 
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSidebar}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm ${
                  isActive
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon size={18} strokeWidth={2} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-0 left-0 right-0 h-16 p-3 border-t border-gray-100 bg-white">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 w-full transition-all text-sm"
          >
            <LogOut size={18} strokeWidth={2} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Spacer for desktop */}
      <div className="hidden lg:block w-64" />
    </>
  );

}
