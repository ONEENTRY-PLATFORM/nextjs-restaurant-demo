'use client';

import type { JSX, ReactNode } from 'react';
import { useState } from 'react';
import { Provider } from 'react-redux';
import { persistStore } from 'redux-persist';

// import type { AppStore } from '../store';
import { setupStore } from '../store';

/**
 * Store provider
 * @param   {object}      props          - props
 * @param   {ReactNode}   props.children - children ReactNode
 * @returns {JSX.Element}                Redux provider
 */
export default function StoreProvider({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const [store] = useState(() => {
    const newStore = setupStore();
    persistStore(newStore);
    return newStore;
  });

  return <Provider store={store}>{children}</Provider>;
}
