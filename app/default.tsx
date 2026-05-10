import type { ReactNode } from 'react';

/**
 * Layout — pass-through that renders children as-is.
 *
 * @param   {object}    props          - Component props.
 * @param   {ReactNode} props.children - Children rendered inside the layout.
 * @returns Children passed in.
 */
const Layout = ({ children }: { children: ReactNode }): ReactNode => children;

export default Layout;
