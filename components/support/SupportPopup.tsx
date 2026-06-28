'use client';

import Image from 'next/image';
import type { JSX } from 'react';
import { useContext, useRef } from 'react';

import { useT } from '@/app/store/providers/DictProvider';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import ModalBackdrop from '@/components/layout/modal/components/ModalBackdrop';
import DrawerAnimations from '@/components/shared/animations/DrawerAnimations';
import { useSwipeToClose } from '@/components/shared/useSwipeToClose';

/**
 * SupportPopup — mobile support popup (call / WhatsApp).
 *
 * @param   {object}              props             - Component props.
 * @param   {string | undefined}  props.phone       - Phone number for the `tel:` link.
 * @param   {string | undefined}  props.whatsappUrl - WhatsApp chat URL.
 * @returns JSX of the support drawer (mobile-only).
 */
const SupportPopup = ({
  phone,
  whatsappUrl,
}: {
  phone: string | undefined;
  whatsappUrl: string | undefined;
}): JSX.Element => {
  const t = useT();
  const { setOpen, setTransition } = useContext(OpenDrawerContext);
  const sheetRef = useRef<HTMLDivElement | null>(null);

  useSwipeToClose(sheetRef, () => setOpen(false));

  const callPrompt = t('support_call_prompt', 'Would you like to call?');
  const questionPrompt = t('support_question_prompt', 'Would you like to ask a question?');
  const close = () => setTransition('close');
  const telHref = phone ? 'tel:' + phone.replace(/\s+/g, '') : undefined;

  return (
    <DrawerAnimations component="SupportPopup" wrapperClassName="md:hidden">
      <div
        id="modalBody"
        ref={sheetRef}
        className="fixed inset-x-0 bottom-0 z-20 w-full rounded-t-[20px] bg-ink/80 px-5 pt-5 pb-25 shadow-xl backdrop-blur-card"
      >
        <div className="mx-auto max-w-88.75">
          <div className="flex justify-center">
            <p className="text-center text-xl leading-150 font-normal text-paper">
              {t('support_title', 'Support')}
            </p>
          </div>

          {telHref || whatsappUrl ? (
            <div className="mt-6.25 rounded-[20px] border border-paper/30 px-5 pt-3 pb-5">
              <p className="text-center text-xl leading-150 font-normal text-paper">{callPrompt}</p>
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
              <p className="text-center text-xl leading-150 font-normal text-paper">
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
    </DrawerAnimations>
  );
};

export default SupportPopup;
