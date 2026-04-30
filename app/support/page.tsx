import type { Metadata } from 'next';
import type { JSX } from 'react';

import { getFormByMarker, getPageByUrl } from '@/app/api';
import { getDictionary } from '@/app/dictionaries';
import ContactUsForm from '@/components/forms/ContactUsForm';

export const dynamic = 'force-dynamic';

/**
 * Страница поддержки — рендерит управляемые из CMS title/description/contacts со
 * страницы `support` плюс динамическую форму Contact-Us.
 * @returns {Promise<JSX.Element>} JSX страницы поддержки.
 */
const SupportPage = async (): Promise<JSX.Element> => {
  const [{ page }, formRes, dict] = await Promise.all([
    getPageByUrl('support'),
    getFormByMarker('contact_us'),
    getDictionary(),
  ]);
  const attrs = page?.attributeValues ?? {};
  const formHeading: string =
    (formRes.form?.localizeInfos?.title as string | undefined) ??
    (dict.support_form_heading?.value as string);
  const title =
    (attrs.support_title?.value as string | undefined) ??
    page?.localizeInfos?.title ??
    (dict.support_default_title?.value as string);
  const description = attrs.support_description?.value as
    | Array<{ htmlValue?: string; plainValue?: string }>
    | undefined;
  const descriptionHtml = description?.[0]?.htmlValue ?? '';
  const phone = attrs.support_phone?.value as string | undefined;
  const whatsapp = attrs.support_whatsapp_url?.value as string | undefined;
  const email = attrs.support_email?.value as string | undefined;

  return (
    <section className="mx-auto w-full max-w-88 md:max-w-175 lg:max-w-250 xl:max-w-323 px-4 py-10">
      <h1 className="mb-5 font-bold text-[24px] md:text-[32px] uppercase tracking-[0.02em] text-brand">
        {title}
      </h1>
      {descriptionHtml ? (
        <div
          className="mb-8 text-base text-paper/90"
          dangerouslySetInnerHTML={{ __html: descriptionHtml }}
        />
      ) : null}

      <div className="mb-8 flex flex-wrap gap-3">
        {phone ? (
          <a
            href={'tel:' + phone}
            className="inline-flex items-center gap-2 rounded-[10px] border border-muted px-4 py-2 text-paper hover:border-brand hover:text-brand"
          >
            📞 {phone}
          </a>
        ) : null}
        {whatsapp ? (
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-[10px] border border-muted px-4 py-2 text-paper hover:border-brand hover:text-brand"
          >
            WhatsApp
          </a>
        ) : null}
        {email ? (
          <a
            href={'mailto:' + email}
            className="inline-flex items-center gap-2 rounded-[10px] border border-muted px-4 py-2 text-paper hover:border-brand hover:text-brand"
          >
            ✉ {email}
          </a>
        ) : null}
      </div>

      <div className="rounded-xl bg-ink/40 p-5">
        <h2 className="mb-4 font-bold text-[18px] uppercase text-brand">
          {formHeading}
        </h2>
        <ContactUsForm className="" />
      </div>
    </section>
  );
};

export default SupportPage;

/**
 * Генерирует метаданные страницы для маршрута support.
 * @returns {Promise<Metadata>} Метаданные страницы.
 */
export async function generateMetadata(): Promise<Metadata> {
  const [{ page }, dict] = await Promise.all([
    getPageByUrl('support'),
    getDictionary(),
  ]);
  const title =
    (page?.attributeValues?.support_title?.value as string | undefined) ??
    page?.localizeInfos?.title ??
    (dict.support_default_title?.value as string);
  const description = dict.support_metadata_description?.value as string;
  return { title, description };
}
