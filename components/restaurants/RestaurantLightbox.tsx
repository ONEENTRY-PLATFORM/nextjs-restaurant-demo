'use client';

import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/counter.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';

import type { JSX } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import Counter from 'yet-another-react-lightbox/plugins/counter';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';

type Slide = { src: string; alt: string };

/**
 * RestaurantLightbox — separate chunk for `yet-another-react-lightbox` (lib + 4
 * plugins + 3 CSS files together ~80 KB) so it only loads after the user opens
 * the gallery, not on the first paint of the restaurant page.
 *
 * @param   {object}              props          - Component props.
 * @param   {boolean}             props.open     - Whether the lightbox is currently open.
 * @param   {() => void}          props.onClose  - Called when the lightbox is dismissed.
 * @param   {number}              props.index    - Currently displayed slide index.
 * @param   {(i: number) => void} props.onView   - Called when the user navigates to a different slide.
 * @param   {Slide[]}             props.slides   - List of `{ src, alt }` slides.
 * @returns JSX of the lightbox.
 */
const RestaurantLightbox = ({
  open,
  onClose,
  index,
  onView,
  slides,
}: {
  open: boolean;
  onClose: () => void;
  index: number;
  onView: (index: number) => void;
  slides: Slide[];
}): JSX.Element => (
  <Lightbox
    open={open}
    close={onClose}
    index={index}
    on={{ view: ({ index: i }) => onView(i) }}
    slides={slides}
    plugins={[Counter, Fullscreen, Thumbnails, Zoom]}
    controller={{ closeOnBackdropClick: true }}
    styles={{
      container: {
        backgroundColor: 'rgba(76, 77, 86, 0.8)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      },
    }}
  />
);

export default RestaurantLightbox;
