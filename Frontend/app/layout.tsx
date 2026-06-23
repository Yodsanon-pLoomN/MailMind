<<<<<<< HEAD:app/layout.tsx
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
=======
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/provider/AuthProvider";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MailMind",
  description: "AI-powered email management and scheduling",
>>>>>>> main:Frontend/app/layout.tsx
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <html lang="en">
<<<<<<< HEAD:app/layout.tsx
      <body className={inter.className}>
        <SessionProvider session={session}>{children}</SessionProvider>
=======
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
>>>>>>> main:Frontend/app/layout.tsx
      </body>
    </html>
  );
}