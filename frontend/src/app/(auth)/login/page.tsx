import { LoginForm } from '@/components/auth/LoginForm';

export const metadata = {
  title: 'Masuk — KampanyeKit',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <LoginForm />
    </div>
  );
}
