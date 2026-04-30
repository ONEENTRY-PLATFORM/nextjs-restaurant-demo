import type { ReactNode } from 'react';

/**
 * Компонент layout-а, рендерящий своих детей напрямую.
 * Это простой pass-through компонент, не добавляющий дополнительных оборачивающих элементов.
 * @param   {object}    props          - Свойства компонента.
 * @param   {ReactNode} props.children - Дочерние компоненты, рендерящиеся внутри этого layout-а.
 * @returns {ReactNode}                Дочерние компоненты, переданные в layout.
 */
const Layout = ({ children }: { children: ReactNode }): ReactNode => children;

export default Layout;
