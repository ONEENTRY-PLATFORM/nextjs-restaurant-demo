'use client';

import type { JSX, ReactNode } from 'react';
import { useState } from 'react';
import { Provider } from 'react-redux';
import { persistStore } from 'redux-persist';

import { setupStore } from '../store';

/**
 * StoreProvider — Redux-провайдер store.
 *
 * @param   {object}      props          - Пропсы.
 * @param   {ReactNode}   props.children - Дочерний ReactNode.
 * @returns {JSX.Element}                JSX провайдер.
 */
export default function StoreProvider({ children }: { children: ReactNode }): JSX.Element {
  const [store] = useState(() => {
    const newStore = setupStore();
    persistStore(newStore);
    return newStore;
  });

  return <Provider store={store}>{children}</Provider>;
}
