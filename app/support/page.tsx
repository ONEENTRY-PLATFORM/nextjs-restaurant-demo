import type { Metadata } from 'next';
import Image from 'next/image';
import type { JSX } from 'react';

import { getFormByMarker, getPageByUrl } from '@/app/api';
import { getDictionary } from '@/app/dictionaries';
import ContactUsForm from '@/components/forms/ContactUsForm';

export const dynamic = 'force-dynamic';

/**
 * SupportPage — страница поддержки (CMS title/description/contacts + форма Contact-Us).
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
    <section className="section_layout">
      <h1 className="mb-5 font-bold text-[24px] md:text-[32px] uppercase tracking-[0.02em] text-brand">
        {title}
      </h1>
      {descriptionHtml ? (
        <div
          className="mb-8 text-base text-paper/90"
          dangerouslySetInnerHTML={{ __html: descriptionHtml }}
        />
      ) : null}

      <div className="mb-8 flex flex-col gap-6.25">
        {phone || whatsapp ? (
          <div className="rounded-[20px] border border-paper/30 px-5 pt-3 pb-5">
            <p className="text-center text-xl font-normal leading-150 text-paper">
              Would you like to call?
            </p>
            <div className="mt-4 flex justify-center gap-15">
              {whatsapp ? (
                <a href={whatsapp} target="_blank" rel="noopener noreferrer">
                  <Image src="/images/icons/watsap.svg" alt="WhatsApp" width={45} height={45} />
                </a>
              ) : null}
              {phone ? (
                <a href={'tel:' + phone}>
                  <Image src="/images/icons/call.svg" alt="Call" width={45} height={45} />
                </a>
              ) : null}
            </div>
          </div>
        ) : null}
        {email || whatsapp ? (
          <div className="rounded-[20px] border border-paper/30 px-5 pt-3 pb-5">
            <p className="text-center text-xl font-normal leading-150 text-paper">
              Would you like to ask a question?
            </p>
            <a
              href={whatsapp ?? 'mailto:' + email}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex justify-center"
            >
              <Image src="/images/icons/watsap.svg" alt="WhatsApp" width={45} height={45} />
            </a>
          </div>
        ) : null}
      </div>

      <div className="rounded-xl bg-ink/40 p-5">
        <h2 className="mb-4 font-bold text-[18px] uppercase text-brand">{formHeading}</h2>
        <ContactUsForm className="" />
      </div>
    </section>
  );
};

export default SupportPage;

/** generateMetadata — метаданные страницы поддержки. */
export async function generateMetadata(): Promise<Metadata> {
  const [{ page }, dict] = await Promise.all([getPageByUrl('support'), getDictionary()]);
  const title =
    (page?.attributeValues?.support_title?.value as string | undefined) ??
    page?.localizeInfos?.title ??
    (dict.support_default_title?.value as string);
  const description = dict.support_metadata_description?.value as string;
  return { title, description };
}
