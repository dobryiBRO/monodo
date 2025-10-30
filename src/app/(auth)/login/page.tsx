import { UserAuthForm } from '@/components/auth/UserAuthForm';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">monodo</h1>
          </Link>
          <p className="text-gray-600">Ваш персональный таск-менеджер</p>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            Вход в аккаунт
          </h2>
          <UserAuthForm />
        </div>

        <p className="text-center mt-6 text-sm text-gray-600">
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
            ← Вернуться на главную
          </Link>
        </p>
      </div>
    </div>
  );
}

