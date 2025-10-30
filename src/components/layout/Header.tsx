'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CategoryManager } from '@/components/categories/CategoryManager';

export function Header() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Закрытие меню при клике вне его
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setShowMenu(false);
    await signOut({ callbackUrl: '/' });
  };

  const getInitial = () => {
    if (session?.user?.email) {
      return session.user.email[0].toUpperCase();
    }
    return '+';
  };

  return (
    <>
      <header className="bg-white border-b-2 border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900">monodo</h1>
            </Link>

            {/* Profile Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-md"
              >
                {getInitial()}
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border-2 border-gray-200 py-2 z-50">
                  {status === 'authenticated' ? (
                    <>
                      <div className="px-5 py-4 border-b-2 border-gray-100">
                        <p className="text-sm font-bold text-gray-900">{session.user?.name || 'User'}</p>
                        <p className="text-xs text-gray-600 truncate font-medium">{session.user?.email}</p>
                      </div>

                      <button
                        onClick={() => {
                          setShowMenu(false);
                          setShowCategoryManager(true);
                        }}
                        className="w-full text-left px-5 py-3 text-sm font-semibold text-gray-800 hover:bg-blue-50 transition-colors"
                      >
                        Настройки категорий
                      </button>

                      <button
                        onClick={() => {
                          setShowMenu(false);
                          router.push('/settings/notifications');
                        }}
                        className="w-full text-left px-5 py-3 text-sm font-semibold text-gray-800 hover:bg-blue-50 transition-colors"
                      >
                        Настройки уведомлений
                      </button>

                      <div className="border-t-2 border-gray-100 my-2"></div>

                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-5 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Выйти
                      </button>
                    </>
                  ) : (
                    <Link
                      href="/login"
                      onClick={() => setShowMenu(false)}
                      className="block px-5 py-3 text-sm font-semibold text-gray-800 hover:bg-blue-50 transition-colors"
                    >
                      Войти / Зарегистрироваться
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Category Manager Modal */}
      <CategoryManager
        isOpen={showCategoryManager}
        onClose={() => setShowCategoryManager(false)}
      />
    </>
  );
}

