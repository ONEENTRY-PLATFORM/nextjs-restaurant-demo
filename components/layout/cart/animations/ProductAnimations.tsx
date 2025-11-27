'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX, ReactNode } from 'react';
import { useRef } from 'react';
import { toast } from 'react-toastify';

import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import {
  getTransition,
  removeProduct,
  setCartTransition,
} from '@/app/store/reducers/CartSlice';

/**
 * Product animations
 */
const ProductAnimations = ({
  children,
  className,
  product,
  index,
}: {
  children: ReactNode;
  className: string;
  index: number;
  product: IProductsEntity;
}): JSX.Element => {
  const dispatch = useAppDispatch();
  const ref = useRef(null);
  const { transitionId } = useAppSelector(getTransition);

  // first load animations
  useGSAP(() => {
    if (!ref.current) {
      return;
    }
    const tl = gsap.timeline({
      paused: true,
    });

    tl.set(ref.current, {
      opacity: 0,
      yPercent: 100,
    }).to(ref.current, {
      opacity: 1,
      yPercent: 0,
      delay: index / 10,
    });
    tl.play();

    return () => {
      tl.kill();
    };
  }, []);

  // remove Product from cart animations
  useGSAP(() => {
    if (!ref.current || product.id !== transitionId) {
      return;
    }
    const tl = gsap.timeline();

    tl.to(ref.current, {
      autoAlpha: 0,
      duration: 0.5,
      onStart: () => {
        dispatch(
          setCartTransition({
            productId: 0,
          }),
        );
        dispatch(removeProduct(product.id));
        toast('Product ' + product.localizeInfos.title + ' removed from cart!');
      },
    }).to(ref.current, {
      autoAlpha: 1,
      duration: 0.35,
    });

    return () => {
      tl.kill();
    };
  }, [transitionId]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
};

export default ProductAnimations;
