import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import getServerSession from 'next-auth'
import SessionProvider from '@/components/SessionProvider'
import { auth } from '@/lib/auth';
const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MailMind',
  description: 'AI-powered email assistant with Gmail and Google Calendar integration.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider session={session}>{children}</SessionProvider>
      </body>
    </html>
  );
}