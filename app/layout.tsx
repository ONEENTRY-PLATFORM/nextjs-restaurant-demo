import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Lato } from 'next/font/google';

import { getOutOfStockMarker } from '@/app/api';
import { getDictionary } from '@/app/dictionaries';
import { AuthProvider } from '@/app/store/providers/AuthContext';
import { DictProvider } from '@/app/store/providers/DictProvider';
import { OpenDrawerProvider } from '@/app/store/providers/OpenDrawerContext';
import { ProductStatusProvider } from '@/app/store/providers/ProductStatusContext';
import StoreProvider from '@/app/store/providers/StoreProvider';
import PopupRoot from '@/components/layout/PopupRoot';
import ServerCartSync from '@/components/layout/ServerCartSync';

import HeaderAnimGate from './animations/HeaderAnimGate';
import RegisterGSAP from './animations/RegisterGSAP';
import TransitionProvider from './animations/TransitionProvider';

const BottomMenu = dynamic(() => import('@/components/layout/bottom-menu'), {
  ssr: true,
});
const Header = dynamic(() => import('@/components/layout/header'), {
  ssr: true,
});

import './globals.css';

import { getSiteUrl } from '@/app/utils/getSiteUrl';
import ResponsiveToastContainer from '@/components/shared/ResponsiveToastContainer';

const lato = Lato({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  style: ['normal'],
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
  variable: '--font-lato',
});

// Italic is used in exactly one place (hero slogan, weight 700) — load it as a
// separate face so we don't pay for italic 300 / 400 that are never rendered.
const latoItalic = Lato({
  subsets: ['latin'],
  weight: ['700'],
  style: ['italic'],
  display: 'swap',
  preload: false,
  adjustFontFallback: true,
  variable: '--font-lato-italic',
});

/**
 * Static metadata for the home page.
 *
 * `metadataBase` is what makes every relative URL in child metadata resolve
 * against the real origin; without it Next resolves them against
 * `localhost:3000`. `title.template` gives child pages their brand suffix, so a
 * CMS title like "Soups" reads as a page title rather than a bare word.
 */
export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: 'Restaurant — Excellent taste in every bite',
    template: '%s — Restaurant',
  },
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
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Kick off the dictionary fetch but DO NOT await it: passing the promise to
  // `DictProvider` lets Header / page server components fire their own
  // OneEntry calls in parallel with `getDictionary()` instead of waiting for
  // it to resolve first. `getDictionary()` is wrapped in React `cache()`, so
  // every other server caller (e.g. server-side `t()`) shares this same
  // in-flight promise.
  const dictPromise = getDictionary();
  // Same parallel-fetch trick as the dictionary: pass the promise (not an awaited
  // value) so the product-statuses fetch runs alongside every other server call.
  const outOfStockMarkerPromise = getOutOfStockMarker();

  return (
    <html lang="en">
      <body
        className={`${lato.variable} ${latoItalic.variable} relative flex min-h-screen w-full flex-col bg-black pb-19 font-main text-paper antialiased md:pb-0`}
      >
        <RegisterGSAP />
        <StoreProvider>
          <DictProvider value={dictPromise}>
            <ProductStatusProvider value={outOfStockMarkerPromise}>
              <AuthProvider>
                <ServerCartSync />
                <OpenDrawerProvider>
                  <Header />
                  <TransitionProvider>
                    <main className="flex w-full grow flex-col overflow-hidden pb-10">
                      {children}
                    </main>
                  </TransitionProvider>
                  <HeaderAnimGate delay={0.5}>
                    <BottomMenu />
                  </HeaderAnimGate>
                  <PopupRoot />
                </OpenDrawerProvider>
              </AuthProvider>
            </ProductStatusProvider>
          </DictProvider>
        </StoreProvider>
        <ResponsiveToastContainer />
      </body>
    </html>
  );
}
