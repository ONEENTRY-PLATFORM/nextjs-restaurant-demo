import { useDispatch, useSelector, useStore } from 'react-redux';

import {
  type AppDispatch,
  type AppStore,
  type RootState,
} from '@/app/store/store';

// Используй по всему приложению вместо обычных `useDispatch` и `useSelector`
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppStore = useStore.withTypes<AppStore>();
