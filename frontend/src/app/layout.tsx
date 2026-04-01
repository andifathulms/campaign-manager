import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/shared/Providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'KampanyeKit — Platform Kampanye Digital',
  description: 'Kelola kampanye politik Anda dengan cerdas dan terukur.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full w-full">
      <body className={`${inter.className} h-full w-full`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
