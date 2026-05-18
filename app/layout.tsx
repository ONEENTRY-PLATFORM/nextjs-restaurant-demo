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

import HeaderAnimGate from './animations/HeaderAnimGate';
import RegisterGSAP from './animations/RegisterGSAP';
import TransitionProvider from './animations/TransitionProvider';

const BottomMenu = dynamic(() => import('@/components/layout/bottom-menu'), {
  ssr: true,
});
const Header = dynamic(() => import('@/components/layout/header'), {
  ssr: true,
});
const CartPopup = dynamic(() => import('@/components/cart/CartPopup'));
const FavoritesPopup = dynamic(() => import('@/components/profile/FavoritesPopup'));
const ProfilePopup = dynamic(() => import('@/components/profile/ProfilePopup'));
const BookingsPopup = dynamic(() => import('@/components/profile/BookingsPopup'));
const ReservationPopup = dynamic(() => import('@/components/reservation/ReservationPopup'));
const OrderReviewPopup = dynamic(() => import('@/components/profile/OrderReviewPopup'));

import './globals.css';
import 'react-toastify/dist/ReactToastify.css';

import ResponsiveToastContainer from '@/components/shared/ResponsiveToastContainer';

const lato = Lato({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
  variable: '--font-lato',
});

/** Static metadata for the home page. */
export const metadata: Metadata = {
  title: 'Restaurant — Excellent taste in every bite',
  description: 'Restaurant ordering platform built with Next.js + OneEntry CMS',
  openGraph: {
    type: 'website',
  },
};

/**
 * RootLayout — root application layout.
 *
 * @param   {object}            props          - Component props.
 * @param   {React.ReactNode}   props.children - Page tree rendered inside the layout.
 * @returns Promise resolving to JSX of the `<html>` shell with global providers, header, footer, and modals.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
                <HeaderAnimGate delay={0.5}>
                  <BottomMenu />
                </HeaderAnimGate>
                <CartPopup />
                <FavoritesPopup />
                <ProfilePopup />
                <BookingsPopup />
                <ReservationPopup />
                <OrderReviewPopup />
                <Modal />
              </OpenDrawerProvider>
            </AuthProvider>
          </DictProvider>
        </StoreProvider>
        <ResponsiveToastContainer />
      </body>
    </html>
  );
}
