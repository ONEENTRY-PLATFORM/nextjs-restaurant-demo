import type { IPagesEntity } from 'oneentry/dist/pages/pagesInterfaces';
import type { IFilterParams } from 'oneentry/dist/products/productsInterfaces';

/**
 * Локализованная информация.
 * @property {string} content   - Контент страницы.
 * @property {string} menuTitle - Заголовок страницы в меню.
 * @property {string} title     - Заголовок страницы.
 */
declare type LocalizeInfo = {
  content: string;
  menuTitle: string;
  title: string;
};

/**
 * Пропсы страницы.
 * @property {object} params       - Параметры страницы.
 * @property {object} searchParams - Search-параметры.
 */
declare type PageProps = {
  params: Promise<{ page?: string; handle: string; lang: string }>;
  searchParams: Promise<{
    search?: string;
    page?: string;
    filters?: IFilterParams[];
  }>;
};

/**
 * Упрощённые пропсы страницы.
 * @property {IPagesEntity} page  - Объект страницы.
 * @property {string}       lang  - Код языка.
 * @property {object}       dict  - Объект словаря.
 * @property {object}       [key] - Дополнительная пара ключ-значение.
 */
declare type SimplePageProps = {
  page?: IPagesEntity;
  lang?: string;
  dict?: IAttributeValues;
  [key: string]: unknown;
};

/**
 * Пропсы лоадера.
 * @property {object} data     - Объект данных.
 * @property {number} [limit]  - Лимит элементов.
 * @property {number} [offset] - Offset элементов.
 */
declare type LoaderProps = {
  data?: Record<string, unknown>;
  productsLimit?: number;
  offset?: number;
};

/**
 * Параметры метаданных.
 * @property {object} params - Параметры страницы.
 */
declare type MetadataParams = {
  params: Promise<{ handle: string; lang: string }>;
};

/**
 * Состояние корзины.
 * @property {number}      quantity     - Количество товаров в корзине.
 * @property {number}      id           - ID корзины.
 * @property {IProducts[]} productsData - Массив данных товаров.
 */
export type CartState = {
  quantity: number;
  id: number;
  productsData: IProducts[];
};

/**
 * Пропсы анимаций.
 * @property {React.ReactNode} children  - Дочерние элементы компонента.
 * @property {string}          className - Имя класса компонента.
 * @property {number}          index     - Индекс компонента.
 */
export type AnimationsProps = {
  children: React.ReactNode;
  className: string;
  index: number;
};

/**
 * Данные товара.
 * @property {number}  id       - ID товара.
 * @property {boolean} selected - Выбран ли товар.
 * @property {number}  quantity - Количество товара.
 */
export type IProducts = {
  id: number;
  selected: boolean;
  quantity: number;
};

/**
 * Метаданные товара.
 * @property {string} title       - Название товара.
 * @property {string} description - Описание товара.
 * @property {string} url         - URL товара.
 * @property {number} width       - Ширина изображения товара.
 * @property {number} height      - Высота изображения товара.
 * @property {string} alt         - Alt-текст изображения товара.
 */
interface IProductMetadata {
  title: string;
  description: string;
  url: string;
  width: number;
  height: number;
  alt: string;
}

/**
 * Метаданные страницы.
 * @property {string}           title           - Заголовок страницы.
 * @property {string}           description     - Описание страницы.
 * @property {boolean}          isVisible       - Видима ли страница.
 * @property {IAttributeValues} attributeValues - Значения атрибутов страницы.
 * @property {LocalizeInfo}     localizeInfos   - Локализованная информация страницы.
 */
interface IPageMetadata {
  title: string;
  description: string;
  isVisible: boolean;
  attributeValues: {
    icon?: {
      downloadLink: string;
    };
  };
  localizeInfos: {
    title: string;
    plainContent: string;
  };
}

/**
 * Товар в заказе.
 * @property {number}        id           - ID товара.
 * @property {number}        quantity     - Количество товара.
 * @property {string}        title        - Название товара.
 * @property {string | null} sku          - SKU товара.
 * @property {string | null} previewImage - Превью-изображение товара.
 * @property {number}        price        - Цена товара.
 */
export type IOrderProducts = {
  id: number;
  quantity: number;
  title: string;
  sku: string | null;
  previewImage: string | null;
  price: number;
};

/**
 * Пропсы изображения.
 * @property {string}                                              src              - Источник изображения.
 * @property {string}                                              alt              - Alt-текст изображения.
 * @property {boolean}                                             fill             - Должно ли изображение заполнять доступное пространство.
 * @property {number}                                              [width]          - Ширина изображения.
 * @property {number}                                              [height]         - Высота изображения.
 * @property {boolean}                                             [isImageLoading] - Идёт ли загрузка изображения.
 * @property {string}                                              [className]      - Имя класса изображения.
 * @property {React.CSSProperties}                                 [style]          - Стиль изображения.
 * @property {string}                                              [objectFit]      - Object fit изображения.
 * @property {string}                                              [priority]       - Приоритет изображения.
 * @property {(result?: unknown) => void}                          [onLoad]         - Колбэк по завершению загрузки изображения.
 * @property {React.Ref<unknown>}                                  ref              - Ref изображения.
 * @property {(event: React.MouseEvent<HTMLImageElement>) => void} [onClick]        - Колбэк клика по изображению.
 */
export type ImageProps = {
  src: string;
  alt?: string;
  fill: boolean;
  width?: number;
  height?: number;
  loading?: 'eager' | 'lazy' | undefined;
  placeholder?: 'blur' | 'empty' | `data:image/${string}`;
  blurDataURL?: string;
  isImageLoading: boolean;
  className?: string;
  style?: React.CSSProperties;
  objectFit?: string;
  priority?: 'auto' | 'low' | 'high' | undefined;
  onLoad?: React.ReactEventHandler<HTMLImageElement>;
  ref: React.Ref<HTMLImageElement>;
  onClick?: React.MouseEventHandler<HTMLImageElement>;
  // decoding?: 'async' | 'sync' | 'auto';
};

export type FormProps = { dict: IAttributeValues; className: string };

declare type TabLayoutProps = {
  dict: IAttributeValues;
  tabsState: {
    [tabKey: string]: {
      isActive: boolean;
      disabled: boolean;
    };
  };
  setTabsState: React.Dispatch<React.SetStateAction<TabLayoutProps['tabsState']>>;
};

declare type IAppOrder = {
  formIdentifier?: string;
  paymentAccountIdentifier?: string;
  formData: Array<IOrdersFormData & { valid?: boolean }>;
  products: Array<IOrderProductData>;
};

declare global {
  interface Window {
    grecaptcha?: {
      enterprise: {
        ready: (callback: () => void) => void;
        execute: (siteKey: string, options: { action: string }) => Promise<string>;
      };
    };
  }
}
