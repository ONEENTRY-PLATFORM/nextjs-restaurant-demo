'use client';

import type { Dispatch, JSX, ReactNode } from 'react';
import { createContext, useEffect, useState } from 'react';

/** OpenDrawerContext — контекст открытия drawer/попапов. */
export const OpenDrawerContext = createContext<{
  component: string;
  open: boolean;
  action: string;
  transition: string;
  setComponent: Dispatch<string>;
  setOpen: Dispatch<boolean>;
  setAction: Dispatch<string>;
  setTransition: Dispatch<string>;
}>({
  open: false,
  component: '',
  action: '',
  transition: '',
  setOpen(): void {},
  setComponent(): void {},
  setAction(): void {},
  setTransition(): void {},
});

/**
 * OpenDrawerProvider — провайдер контекста drawer/попапов.
 *
 * @param   {object}      props          - Пропсы.
 * @param   {ReactNode}   props.children - Дочерний ReactNode.
 * @returns {JSX.Element}                JSX провайдер.
 */
export const OpenDrawerProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const [open, setOpen] = useState<boolean>(false);
  const [component, setComponent] = useState<string>('');
  const [action, setAction] = useState<string>('');
  const [transition, setTransition] = useState<string>('');

  // Блокируем скролл фона при открытом попапе: запираем и `<html>`, и `<body>`
  // (скролл-контейнер зависит от страницы), на iOS фиксируем `body` через
  // `position: fixed` против body-rubber-band. Компенсируем ширину скроллбара
  // через padding-right + CSS-переменную `--scrollbar-width`, чтобы контент
  // не прыгал на ~15px на десктопе (на macOS/overlay-скроллбарах = 0).
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const body = document.body;
    const scrollY = window.scrollY;
    const scrollbarWidth = window.innerWidth - html.clientWidth;
    const prev = {
      htmlOverflow: html.style.overflow,
      htmlPaddingRight: html.style.paddingRight,
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyWidth: body.style.width,
      bodyPaddingRight: body.style.paddingRight,
      cssVar: html.style.getPropertyValue('--scrollbar-width'),
    };
    if (scrollbarWidth > 0) {
      html.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
      body.style.paddingRight = `${scrollbarWidth}px`;
    }
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';
    return () => {
      html.style.overflow = prev.htmlOverflow;
      html.style.paddingRight = prev.htmlPaddingRight;
      body.style.overflow = prev.bodyOverflow;
      body.style.position = prev.bodyPosition;
      body.style.top = prev.bodyTop;
      body.style.width = prev.bodyWidth;
      body.style.paddingRight = prev.bodyPaddingRight;
      if (prev.cssVar) {
        html.style.setProperty('--scrollbar-width', prev.cssVar);
      } else {
        html.style.removeProperty('--scrollbar-width');
      }
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  return (
    <OpenDrawerContext.Provider
      value={{
        component,
        setComponent,
        open,
        setOpen,
        action,
        setAction,
        transition,
        setTransition,
      }}
    >
      {children}
    </OpenDrawerContext.Provider>
  );
};
