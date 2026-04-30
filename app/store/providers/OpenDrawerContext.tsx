'use client';

import type { Dispatch, JSX, ReactNode } from 'react';
import { createContext, useState } from 'react';

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
export const OpenDrawerProvider = ({
  children,
}: {
  children: ReactNode;
}): JSX.Element => {
  /** Отслеживаем состояние открытости drawer */
  const [open, setOpen] = useState<boolean>(false);
  /** Отслеживаем компонент для рендера в drawer */
  const [component, setComponent] = useState<string>('');
  /** Отслеживаем тип действия для drawer */
  const [action, setAction] = useState<string>('');
  /** Отслеживаем тип перехода для drawer */
  const [transition, setTransition] = useState<string>('');

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
