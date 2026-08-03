import type { IFilterParams } from 'oneentry/dist/products/productsInterfaces';

/**
 * Page props.
 * @property {object} params       - Page params.
 * @property {object} searchParams - Search params.
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
 * Loader props.
 * @property {object} data     - Data object.
 * @property {number} [limit]  - Item limit.
 * @property {number} [offset] - Item offset.
 */
declare type LoaderProps = {
  data?: Record<string, unknown>;
  productsLimit?: number;
  offset?: number;
};

/**
 * Metadata params.
 * @property {object} params - Page params.
 */
declare type MetadataParams = {
  params: Promise<{ handle: string; lang: string }>;
};

/**
 * Cart state.
 * @property {number}      quantity     - Number of products in the cart.
 * @property {number}      id           - Cart ID.
 * @property {IProducts[]} productsData - Array of product data.
 */
export type CartState = {
  quantity: number;
  id: number;
  productsData: IProducts[];
};

/**
 * Animation props.
 * @property {React.ReactNode} children  - Component children.
 * @property {string}          className - Component class name.
 * @property {number}          index     - Component index.
 */
export type AnimationsProps = {
  children: React.ReactNode;
  className: string;
  index: number;
};

/**
 * Product data.
 * @property {number}  id       - Product ID.
 * @property {boolean} selected - Whether the product is selected.
 * @property {number}  quantity - Product quantity.
 */
export type IProducts = {
  id: number;
  selected: boolean;
  quantity: number;
};

/**
 * Product in an order.
 * @property {number}        id           - Product ID.
 * @property {number}        quantity     - Product quantity.
 * @property {string}        title        - Product name.
 * @property {string | null} sku          - Product SKU.
 * @property {string | null} previewImage - Product preview image.
 * @property {number}        price        - Product price.
 */
export type IOrderProducts = {
  id: number;
  quantity: number;
  title: string;
  sku: string | null;
  previewImage: string | null;
  price: number;
};

/** ImageProps — props for the `next/image` wrapper. */
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
  /** Order-storage marker (`Orders.createOrder` first arg) — resolved from `getOrdersStorageByMarker`. */
  storageMarker?: string;
  /** Order form marker (`createOrder` body `formIdentifier`) — taken from `storage.formIdentifier`. */
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
