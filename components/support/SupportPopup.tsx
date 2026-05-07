'use client';

import Image from 'next/image';
import type { JSX } from 'react';
import { useContext } from 'react';

import { useT } from '@/app/store/providers/DictProvider';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import ModalBackdrop from '@/components/layout/modal/components/ModalBackdrop';

import SupportPopupAnimations from './animations/SupportPopupAnimations';

/**
 * Попап поддержки — мобильная версия.
 * @param   {object}      props              - Пропсы попапа.
 * @param   {string}      [props.phone]      - Телефон для `tel:`-ссылки.
 * @param   {string}      [props.whatsappUrl] - Ссылка на WhatsApp-чат.
 * @returns {JSX.Element}                    JSX попапа.
 */
const SupportPopup = ({
  phone,
  whatsappUrl,
}: {
  phone: string | undefined;
  whatsappUrl: string | undefined;
}): JSX.Element => {
  const t = useT();
  const { setTransition } = useContext(OpenDrawerContext);

  const callPrompt = t('support_call_prompt', 'Would you like to call?');
  const questionPrompt = t('support_question_prompt', 'Would you like to ask a question?');
  const close = () => setTransition('close');
  const telHref = phone ? 'tel:' + phone.replace(/\s+/g, '') : undefined;

  return (
    <SupportPopupAnimations>
      <div
        id="modalBody"
        className="fixed bottom-0 left-0 right-0 z-20 w-full rounded-t-[20px] bg-[rgba(76,77,86,0.8)] backdrop-blur-[10px] pt-5 px-5 pb-25"
      >
        <div className="mx-auto max-w-88.75">
          <div className="flex justify-center">
            <p className="text-center text-xl font-normal leading-150 text-paper">Support</p>
          </div>

          {telHref || whatsappUrl ? (
            <div className="mt-6.25 rounded-[20px] border border-paper/30 px-5 pt-3 pb-5">
              <p className="text-center text-xl font-normal leading-150 text-paper">{callPrompt}</p>
              <div className="mt-4 flex justify-center gap-15">
                {whatsappUrl ? (
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" onClick={close}>
                    <Image src="/images/icons/watsap.svg" alt="WhatsApp" width={45} height={45} />
                  </a>
                ) : null}
                {telHref ? (
                  <a href={telHref} onClick={close}>
                    <Image src="/images/icons/call.svg" alt="Call" width={45} height={45} />
                  </a>
                ) : null}
              </div>
            </div>
          ) : null}

          {whatsappUrl ? (
            <div className="mt-6.25 rounded-[20px] border border-paper/30 px-5 pt-3 pb-5">
              <p className="text-center text-xl font-normal leading-150 text-paper">
                {questionPrompt}
              </p>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={close}
                className="mt-4 flex justify-center"
              >
                <Image src="/images/icons/watsap.svg" alt="WhatsApp" width={45} height={45} />
              </a>
            </div>
          ) : null}
        </div>
      </div>
      <ModalBackdrop />
    </SupportPopupAnimations>
  );
};

export default SupportPopup;
