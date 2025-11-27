import ArrowLeftIcon from '@/components/icons/arrow-left';
import ArrowRightIcon from '@/components/icons/arrow-right';
import { JSX } from 'react';

/**
 * Carousel navigation button
 */
const NavigationButton = ({ direction }: {
  direction: 'left' | 'right';
}): JSX.Element => {
  return direction === 'left' ? <ArrowLeftIcon /> : <ArrowRightIcon />;
};

export default NavigationButton;
