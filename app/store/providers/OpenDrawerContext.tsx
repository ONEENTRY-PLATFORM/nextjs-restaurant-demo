'use client';

import type { Dispatch, JSX, ReactNode } from 'react';
import { createContext, useEffect, useState } from 'react';

/** OpenDrawerContext — context for opening drawer/popups. */
export const OpenDrawerContext = createContext<{
  component: string;
  open: boolean;
  action: string;
  transition: string;
  /**
   * postAuthComponent — drawer component to switch to after a successful authentication,
   * instead of closing the popup. Set by callers that initiate auth (e.g. bottom-menu profile
   * tap) and consumed by SignInForm / SignUpForm / VerificationForm. Cleared on drawer close.
   * Kept separate from `action` because `action` is already used as form data ('add-address',
   * 'activateUser', 'checkCode'), so reusing it would clash with the signup flow.
   */
  postAuthComponent: string;
  setComponent: Dispatch<string>;
  setOpen: Dispatch<boolean>;
  setAction: Dispatch<string>;
  setTransition: Dispatch<string>;
  setPostAuthComponent: Dispatch<string>;
}>({
  open: false,
  component: '',
  action: '',
  transition: '',
  postAuthComponent: '',
  setOpen(): void {},
  setComponent(): void {},
  setAction(): void {},
  setTransition(): void {},
  setPostAuthComponent(): void {},
});

/**
 * OpenDrawerProvider — provider for the drawer/popup context that also locks background scroll while a drawer is open.
 *
 * @param   {object}      props          - Component props.
 * @param   {ReactNode}   props.children - Subtree that consumes `OpenDrawerContext`.
 * @returns JSX provider wrapping children with the drawer/popup context value.
 */
export const OpenDrawerProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const [open, setOpen] = useState<boolean>(false);
  const [component, setComponent] = useState<string>('');
  const [action, setAction] = useState<string>('');
  const [transition, setTransition] = useState<string>('');
  const [postAuthComponent, setPostAuthComponent] = useState<string>('');

  // Drop the post-auth intent whenever the drawer fully closes — otherwise a stale value
  // (e.g. user opened auth, closed it without signing in) would hijack the next auth flow.
  // Cleared during render (React's documented alternative to a setState inside
  // an effect body) so no consumer ever observes the stale intent.
  if (!open && postAuthComponent) {
    setPostAuthComponent('');
  }

  // Lock background scroll while a popup is open
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
        postAuthComponent,
        setPostAuthComponent,
      }}
    >
      {children}
    </OpenDrawerContext.Provider>
  );
};
