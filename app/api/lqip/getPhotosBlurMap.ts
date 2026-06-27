import 'server-only';

import getLqipPreview from '@/app/api/lqip/getLqipPreview';

type PhotoLike = {
  downloadLink?: string;
  defaultPreview?: string;
  previewLink?: string | Record<string, [string?, string?] | undefined>;
};

/**
 * readInlineBlur — inline base64 LQIP OneEntry ships for a server-compressed image, or `''`.
 *
 * Reads `previewLink[defaultPreview][0]`. The SDK types `previewLink` as `string`, but for
 * compressed assets it is actually an object keyed by preview variant — hence the runtime check.
 *
 * @param   {PhotoLike} photo - A single OneEntry image-attribute item.
 * @returns The `data:` URI blur placeholder, or `''` when this asset has no inline preview.
 */
const readInlineBlur = (photo: PhotoLike): string => {
  const variant =
    photo.defaultPreview && typeof photo.previewLink === 'object'
      ? photo.previewLink[photo.defaultPreview]
      : undefined;
  const blur = Array.isArray(variant) ? variant[0] : undefined;
  return typeof blur === 'string' && blur.startsWith('data:') ? blur : '';
};

/**
 * getPhotosBlurMap — base64 LQIP previews for a list of OneEntry photos keyed by `downloadLink`.
 *
 * Prefers the inline blur OneEntry ships with server-compressed images (no asset fetch, no `sharp`).
 * Assets uploaded before preview generation was enabled have no inline preview and fall back to
 * `getLqipPreview`, which fetches the asset and reuses its in-process LRU so warm calls return at once.
 *
 * Photos without a `downloadLink` are dropped. Duplicate links collapse to a single entry. Keyed by
 * `downloadLink` because gallery photos have no stable id.
 *
 * Kept out of the `@/app/api` barrel: `lqip-modern`/`sharp` are Node-only and that barrel is imported by client code.
 *
 * @param   {PhotoLike[]} photos - OneEntry image-attribute items.
 * @returns Promise resolving to `{ [downloadLink]: base64DataURI }`.
 */
const getPhotosBlurMap = async (photos: PhotoLike[]): Promise<Record<string, string>> => {
  const entries = await Promise.all(
    photos.map(async photo => {
      const src = photo.downloadLink;
      if (!src) return null;
      const inline = readInlineBlur(photo);
      if (inline) return [src, inline] as const;
      const blur = await getLqipPreview(src);
      return [src, blur] as const;
    })
  );
  return Object.fromEntries(entries.filter((e): e is readonly [string, string] => e !== null));
};

export default getPhotosBlurMap;
