import Image from 'next/image';
import type { JSX } from 'react';

/**
 * SocialSignInButton — square button rendering a single provider icon (image-only CTA).
 *
 * @param   {object} props          - Component props.
 * @param   {string} props.imageSrc - Provider icon URL.
 * @param   {string} props.alt      - Accessible alt text for the icon.
 * @returns JSX of the social sign-in button.
 */
const SocialSignInButton = ({ imageSrc, alt }: { imageSrc: string; alt: string }): JSX.Element => {
  return (
    <button type="button" className="relative box-border flex shrink-0 flex-col">
      <Image
        width={30}
        height={30}
        loading="lazy"
        src={imageSrc}
        alt={alt}
        className="aspect-square w-12.5 shrink-0"
      />
    </button>
  );
};

export default SocialSignInButton;
