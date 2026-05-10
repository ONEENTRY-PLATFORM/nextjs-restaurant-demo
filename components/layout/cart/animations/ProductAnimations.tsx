'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX, ReactNode } from 'react';
import { useRef } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { getTransition, removeProduct, setCartTransition } from '@/app/store/reducers/CartSlice';

/**
 * ProductAnimations — cart product enter animation + delete animation tied to `transitionId`.
 *
 * @param   {object}            props           - Component props.
 * @param   {ReactNode}         props.children  - Product card content.
 * @param   {string}            props.className - Class merged onto the wrapping `<div>`.
 * @param   {IProductsEntity}   props.product   - Product entity (used to match `transitionId` for the delete tween).
 * @param   {number}            props.index     - Card index used to compute the per-row stagger delay.
 * @returns JSX wrapper around the cart product card.
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

  // Cart product removal animation.
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
          })
        );
        dispatch(removeProduct(product.id));
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
