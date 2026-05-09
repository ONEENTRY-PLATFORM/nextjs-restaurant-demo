'use client';

import type { JSX, ReactNode } from 'react';
import { useState } from 'react';
import { Provider } from 'react-redux';
import { persistStore } from 'redux-persist';

import { setupStore } from '../store';

/**
 * StoreProvider — Redux store provider.
 *
 * @param   {object}      props          - Component props.
 * @param   {ReactNode}   props.children - Child ReactNode.
 * @returns {JSX.Element}                JSX provider.
 */
export default function StoreProvider({ children }: { children: ReactNode }): JSX.Element {
  const [store] = useState(() => {
    const newStore = setupStore();
    persistStore(newStore);
    return newStore;
  });

  return <Provider store={store}>{children}</Provider>;
}
