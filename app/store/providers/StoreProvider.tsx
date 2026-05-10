'use client';

import type { JSX, ReactNode } from 'react';
import { useState } from 'react';
import { Provider } from 'react-redux';
import { persistStore } from 'redux-persist';

import { setupStore } from '../store';

/**
 * StoreProvider — Redux store provider with a per-render `setupStore()` and `persistStore` rehydration.
 *
 * @param   {object}      props          - Component props.
 * @param   {ReactNode}   props.children - Subtree that consumes the Redux store.
 * @returns {JSX.Element}                JSX `<Provider>` wrapping children with the Redux store.
 */
export default function StoreProvider({ children }: { children: ReactNode }): JSX.Element {
  const [store] = useState(() => {
    const newStore = setupStore();
    persistStore(newStore);
    return newStore;
  });

  return <Provider store={store}>{children}</Provider>;
}
