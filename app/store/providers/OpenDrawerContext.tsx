'use client';

import type { Dispatch, JSX, ReactNode } from 'react';
import { createContext, useEffect, useState } from 'react';

/**
 * Контекст open drawer
 * @property {string}            component     - Название компонента
 * @property {boolean}           open          - Состояние открытости
 * @property {string}            action        - Тип действия
 * @property {string}            transition    - Тип перехода
 * @property {Dispatch<string>}  setComponent  - Сеттер компонента
 * @property {Dispatch<boolean>} setOpen       - Сеттер состояния открытости
 * @property {Dispatch<string>}  setAction     - Сеттер действия
 * @property {Dispatch<string>}  setTransition - Сеттер перехода
 */
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
 * Провайдер контекста для модалок
 * @param   {object}      props          - Пропсы провайдера
 * @param   {ReactNode}   props.children - Дочерний ReactNode
 * @returns {JSX.Element}                Провайдер контекста drawer
 */
export const OpenDrawerProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  /** Отслеживаем состояние открытости drawer */
  const [open, setOpen] = useState<boolean>(false);
  /** Отслеживаем компонент для рендера в drawer */
  const [component, setComponent] = useState<string>('');
  /** Отслеживаем тип действия для drawer */
  const [action, setAction] = useState<string>('');
  /** Отслеживаем тип перехода для drawer */
  const [transition, setTransition] = useState<string>('');

  // Блокируем скролл фона, пока открыт любой попап. Запираем и `<html>`,
  // и `<body>`, потому что в зависимости от страницы скролл-контейнером
  // может оказаться любой из них (особенно на мобильных browsers'ах). На
  // iOS дополнительно фиксируем `body` через `position: fixed`, чтобы
  // body-rubber-band не пробивал лок. Сохраняем предыдущие inline-стили
  // и возвращаем их при закрытии.
  //
  // Чтобы при скрытии полосы прокрутки контент не дёргался на ~15px (десктоп
  // Windows/Linux, где скроллбар занимает место в layout-е), компенсируем
  // ширину скроллбара через padding-right у body и публикуем её в CSS-переменной
  // `--scrollbar-width`, чтобы fixed-элементы (хедер / правые drawer'ы) могли
  // подвинуться при необходимости. На macOS / overlay-скроллбарах ширина = 0,
  // компенсация просто не вступает.
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

  /** Прокидываем значения контекста дочерним компонентам */
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
