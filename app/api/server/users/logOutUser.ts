import { getApi } from '@/app/api';

type LogOutProps = { marker: string; token?: string };

/** logOutUser — выход пользователя через API AuthProvider. */
export const logOutUser = async ({ marker }: LogOutProps) => {
  try {
    const token = localStorage.getItem('refresh-token');
    if (!token) {
      throw Error('No token provided');
    }
    const result = await getApi().AuthProvider.logout(marker, token);
    return { data: result };
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }
};
