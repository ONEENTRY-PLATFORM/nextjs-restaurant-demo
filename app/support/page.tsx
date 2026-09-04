import type { Metadata } from 'next';
import Image from 'next/image';
import type { JSX } from 'react';

import { getFormByMarker } from '@/app/api/server/forms/getFormByMarker';
import { getPageByUrl } from '@/app/api/server/pages/getPageByUrl';
import { getDictionary } from '@/app/dictionaries';
import { FORMS, PAGES } from '@/app/utils/constants';
import { sanitizeHtml } from '@/app/utils/sanitizeHtml';
import ContactUsForm from '@/components/forms/ContactUsForm';
import { dictText, unwrapRichText } from '@/components/utils';

export const dynamic = 'force-static';
export const revalidate = 300;

/**
 * SupportPage — support page (CMS title/description/contacts + Contact-Us form).
 *
 * @returns Promise resolving to JSX of the support page (heading, contact CTA cards, contact form).
 */
const SupportPage = async (): Promise<JSX.Element> => {
  const [{ page }, formRes, dict] = await Promise.all([
    getPageByUrl(PAGES.support),
    getFormByMarker(FORMS.contactUs),
    getDictionary(),
  ]);
  const attrs = page?.attributeValues ?? {};
  const formHeading: string =
    formRes.form?.localizeInfos?.title ?? (dict.support_form_heading?.value as string);
  const title =
    (attrs.support_title?.value as string | undefined) ??
    page?.localizeInfos?.title ??
    (dict.support_default_title?.value as string);
  const descriptionHtml = sanitizeHtml(unwrapRichText(attrs.support_description?.value)?.htmlValue);
  const phone = attrs.support_phone?.value as string | undefined;
  const whatsapp = attrs.support_whatsapp_url?.value as string | undefined;
  const email = attrs.support_email?.value as string | undefined;
  const callPrompt = dictText(dict, 'support_call_prompt', 'Would you like to call?');
  const questionPrompt = dictText(
    dict,
    'support_question_prompt',
    'Would you like to ask a question?'
  );

  return (
    <section className="section_layout">
      <h1 className="mb-5 text-2xl font-bold tracking-fine text-brand uppercase md:text-[32px]">
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
            <p className="text-center text-xl leading-150 font-normal text-paper">{callPrompt}</p>
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
            <p className="text-center text-xl leading-150 font-normal text-paper">
              {questionPrompt}
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
        <h2 className="mb-4 text-[18px] font-bold text-brand uppercase">{formHeading}</h2>
        <ContactUsForm className="" />
      </div>
    </section>
  );
};

export default SupportPage;

/**
 * generateMetadata — support page metadata (CMS title with dictionary fallbacks).
 *
 * @returns Promise resolving to the page metadata.
 */
export async function generateMetadata(): Promise<Metadata> {
  const [{ page }, dict] = await Promise.all([getPageByUrl(PAGES.support), getDictionary()]);
  const title =
    (page?.attributeValues?.support_title?.value as string | undefined) ??
    page?.localizeInfos?.title ??
    (dict.support_default_title?.value as string);
  const description = dict.support_metadata_description?.value as string;
  return { title, description };
}
