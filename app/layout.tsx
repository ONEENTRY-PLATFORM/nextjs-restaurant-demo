import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Lato } from 'next/font/google';

import { getDictionary } from '@/app/dictionaries';
import { AuthProvider } from '@/app/store/providers/AuthContext';
import { DictProvider } from '@/app/store/providers/DictProvider';
import { OpenDrawerProvider } from '@/app/store/providers/OpenDrawerContext';
import { ServerProvider } from '@/app/store/providers/ServerProvider';
import StoreProvider from '@/app/store/providers/StoreProvider';
import Modal from '@/components/layout/modal';

import RegisterGSAP from './animations/RegisterGSAP';
import TransitionProvider from './animations/TransitionProvider';

const BottomMenu = dynamic(() => import('@/components/layout/bottom-menu'), {
  ssr: true,
});
const Header = dynamic(() => import('@/components/layout/header'), {
  ssr: true,
});
const CartPopup = dynamic(() => import('@/components/cart/CartPopup'));
const FavoritesPopup = dynamic(
  () => import('@/components/profile/FavoritesPopup'),
);
const ProfilePopup = dynamic(() => import('@/components/profile/ProfilePopup'));
const BookingsPopup = dynamic(
  () => import('@/components/profile/BookingsPopup'),
);
const ReservationPopup = dynamic(
  () => import('@/components/reservation/ReservationPopup'),
);
const ReviewFormPopup = dynamic(
  () => import('@/components/reviews/ReviewFormPopup'),
);

import './globals.css';

import { ToastContainer } from 'react-toastify';

const lato = Lato({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
  variable: '--font-lato',
});

/**
 * Статические метаданные главной страницы
 */
export const metadata: Metadata = {
  title: 'Restaurant — Excellence taste in every bite',
  description: 'Restaurant ordering platform built with Next.js + OneEntry CMS',
  openGraph: {
    type: 'website',
  },
};

/**
 * Root layout
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Получаем словарь и проставляем в server provider
  const dictValue = await getDictionary();
  ServerProvider('dict', dictValue);
  const dict = dictValue;

  return (
    <html lang="en">
      <body
        className={`${lato.variable} font-main bg-black text-paper antialiased flex flex-col min-h-screen w-full relative pb-19 md:pb-0`}
      >
        <RegisterGSAP />
        <StoreProvider>
          <DictProvider value={dict}>
            <AuthProvider>
              <OpenDrawerProvider>
                <Header />
                <TransitionProvider>
                  <main className="flex flex-col grow overflow-hidden w-full pb-10">
                    {children}
                  </main>
                </TransitionProvider>
                <BottomMenu />
                <CartPopup />
                <FavoritesPopup />
                <ProfilePopup />
                <BookingsPopup />
                <ReservationPopup />
                <ReviewFormPopup />
                <Modal />
              </OpenDrawerProvider>
            </AuthProvider>
          </DictProvider>
        </StoreProvider>
        <ToastContainer position="bottom-right" autoClose={2000} />
      </body>
    </html>
  );
}
