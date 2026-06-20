import { describe, expect, it } from '@jest/globals';
import type { IFormAttribute } from 'oneentry/dist/forms/formsInterfaces';

import { pickAuthMarkers } from '../authMarkers';

const attr = (over: Partial<IFormAttribute>): IFormAttribute =>
  ({ marker: 'x', isLogin: false, isPassword: false, ...over }) as IFormAttribute;

describe('pickAuthMarkers', () => {
  it('reads markers from the isLogin / isPassword flags', () => {
    const fields = [
      attr({ marker: 'email', isLogin: true }),
      attr({ marker: 'password', isPassword: true }),
    ];
    expect(pickAuthMarkers(fields)).toEqual({ loginMarker: 'email', passwordMarker: 'password' });
  });

  it('honours renamed login/password fields (non-email provider)', () => {
    const fields = [
      attr({ marker: 'phone_number', isLogin: true }),
      attr({ marker: 'secret', isPassword: true }),
    ];
    expect(pickAuthMarkers(fields)).toEqual({
      loginMarker: 'phone_number',
      passwordMarker: 'secret',
    });
  });

  it('defaults to email / password when no flag is set or input is missing', () => {
    expect(pickAuthMarkers([attr({ marker: 'foo' })])).toEqual({
      loginMarker: 'email',
      passwordMarker: 'password',
    });
    expect(pickAuthMarkers(undefined)).toEqual({ loginMarker: 'email', passwordMarker: 'password' });
  });
});
