'use client';

import Image from 'next/image';
import type { JSX } from 'react';
import { useContext, useState } from 'react';

import { AuthContext } from '@/app/store/providers/AuthContext';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import CardLineIcon from '@/components/icons/card-line.svg';
import ChevronUpIcon from '@/components/icons/chevron-up.svg';
import CloseXBoldIcon from '@/components/icons/close-x-bold.svg';
import PinIcon from '@/components/icons/pin.svg';
import ProfileIcon from '@/components/icons/profile';
import ModalBackdrop from '@/components/layout/modal/components/ModalBackdrop';

import ProfilePopupAnimations from './animations/ProfilePopupAnimations';

type SavedCard = { id: string; last4: string };
type SavedAddress = {
  id: string;
  street: string;
  house: string;
  floor: string;
};

const initialCards: SavedCard[] = [
  { id: 'c1', last4: '4867' },
  { id: 'c2', last4: '4867' },
];

const initialAddresses: SavedAddress[] = [
  { id: 'a1', street: 'OneEntry', house: '40', floor: '27' },
];

/**
 * Profile drawer popup — port of `static-html/details_personal.html`
 * profile overlay, opened from the user icon in the global header.
 * Three collapsible sections: My Profile (personal data form), Payment
 * (saved cards + add-card form), Address (saved addresses + map + add
 * form). Driven by `OpenDrawerContext` (`component === 'ProfilePopup'`).
 * Mirrors {@link FavoritesPopup} drawer pattern. The standalone
 * `/profile` page is preserved — popup is an additional entry point.
 * @returns {JSX.Element} Profile drawer JSX.
 */
const ProfilePopup = (): JSX.Element => {
  const { open, component, setTransition } = useContext(OpenDrawerContext);
  const { user } = useContext(AuthContext);
  const isOpen = open && component === 'ProfilePopup';

  const [profileOpen, setProfileOpen] = useState(true);
  const [paymentOpen, setPaymentOpen] = useState(true);
  const [addressOpen, setAddressOpen] = useState(true);

  const [cards, setCards] = useState<SavedCard[]>(initialCards);
  const [newCardNumber, setNewCardNumber] = useState('');
  const [newCardExpiry, setNewCardExpiry] = useState('');
  const [newCardCvc, setNewCardCvc] = useState('');

  const [addresses, setAddresses] = useState<SavedAddress[]>(initialAddresses);
  const [newStreet, setNewStreet] = useState('');
  const [newHouse, setNewHouse] = useState('');
  const [newFloor, setNewFloor] = useState('');

  const close = () => setTransition('close');

  const userField = (marker: string): string => {
    if (!user?.formData || !Array.isArray(user.formData)) return '';
    const row = (
      user.formData as Array<{ marker: string; value: unknown }>
    ).find((f) => f.marker === marker);
    return typeof row?.value === 'string' ? row.value : '';
  };

  const firstName = userField('name');
  const secondName = userField('second_name') || userField('lastname');
  const phone = userField('phone');
  const email = userField('email');

  const onApplyCard = () => {
    const digits = newCardNumber.replace(/\D/g, '');
    if (digits.length < 4) return;
    setCards((prev) => [
      ...prev,
      { id: `c${Date.now()}`, last4: digits.slice(-4) },
    ]);
    setNewCardNumber('');
    setNewCardExpiry('');
    setNewCardCvc('');
  };

  const onApplyAddress = () => {
    if (!newStreet.trim()) return;
    setAddresses((prev) => [
      ...prev,
      {
        id: `a${Date.now()}`,
        street: newStreet.trim(),
        house: newHouse.trim(),
        floor: newFloor.trim(),
      },
    ]);
    setNewStreet('');
    setNewHouse('');
    setNewFloor('');
  };

  if (!isOpen) {
    return <></>;
  }

  return (
    <ProfilePopupAnimations>
      <div
        id="modalBody"
        className="fixed bottom-0 left-0 right-0 z-20 max-h-[100vh] min-h-[60vh] overflow-y-auto rounded-t-[20px] bg-[rgba(76,77,86,0.8)] px-5 pt-7.25 backdrop-blur-[10px] shadow-xl md:bottom-auto md:left-auto md:right-0 md:top-37.5 md:max-w-100 md:rounded-l-[20px] md:rounded-tr-none md:pb-7.25 lg:top-37.5 xl:top-46.25"
      >
        <div className="hidden w-full md:flex justify-end">
          <button
            type="button"
            onClick={close}
            aria-label="Close profile"
            className="group hidden h-11.5 w-11.5 -mt-2.5 items-center justify-center rounded-full border border-paper hover:border-brand md:flex"
          >
            <CloseXBoldIcon className="hover-target h-3.75 w-3.75" />
          </button>
        </div>

        <div className="mx-auto h-full max-w-87.5 overflow-y-auto pb-25 no-scrollbar md:pb-0">
          {/* My Profile */}
          <div>
            <button
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              className="mt-5 md:mt-0 flex w-full items-center justify-start gap-2.5"
            >
              <ProfileIcon />
              <p className="text-xl text-paper">My Profile</p>
              <ChevronUpIcon
                className={`transition-transform ${
                  profileOpen ? '' : 'rotate-180'
                }`}
              />
            </button>

            {profileOpen && (
              <>
                <div className="mt-5">
                  <form className="flex flex-col gap-3.75">
                    <div className="flex gap-5">
                      <label className="label">First Name</label>
                      <input
                        className="input"
                        type="text"
                        placeholder="One"
                        defaultValue={firstName}
                      />
                    </div>
                    <div className="flex gap-5">
                      <label className="label">Second Name</label>
                      <input
                        className="input"
                        type="text"
                        placeholder="Entry"
                        defaultValue={secondName}
                      />
                    </div>
                    <div className="flex gap-5">
                      <label className="label">Phone</label>
                      <input
                        className="input"
                        type="text"
                        placeholder="+7 988 567 88 99"
                        defaultValue={phone}
                      />
                    </div>
                    <div className="flex gap-5">
                      <label className="label">E-mail</label>
                      <input
                        className="input"
                        type="email"
                        placeholder="oneentry@cloud.com"
                        defaultValue={email}
                      />
                    </div>
                    <div className="flex gap-5">
                      <label className="label">Password</label>
                      <input className="input" type="password" />
                    </div>
                  </form>
                </div>
                <button
                  type="button"
                  className="hover_btn_transp mt-5 flex h-6.75 w-20.5 items-center justify-center rounded-[5px] border border-brand font-bold text-[16px] text-brand"
                >
                  Edit
                </button>
              </>
            )}
          </div>

          {/* Payment */}
          <div className="mx-auto max-w-87.5">
            <button
              type="button"
              onClick={() => setPaymentOpen((v) => !v)}
              className="mt-5 mx-auto flex w-full items-center justify-start gap-2.5"
            >
              <CardLineIcon />
              <p className="text-xl text-paper">Payment</p>
              <ChevronUpIcon
                className={`transition-transform ${
                  paymentOpen ? '' : 'rotate-180'
                }`}
              />
            </button>

            {paymentOpen && (
              <div className="mt-6.25">
                {cards.map((card, idx) => (
                  <div
                    key={card.id}
                    className={`flex items-center gap-3.75 ${
                      idx === 0 ? '' : 'mt-5'
                    }`}
                  >
                    <p className="font-normal text-[16px] text-paper">Card</p>
                    <CardLineIcon />
                    <div className="font-bold text-[16px] text-paper">
                      ****{card.last4}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setCards((prev) => prev.filter((c) => c.id !== card.id))
                      }
                      className="hover_btn_transp h-6.75 w-20.5 rounded-[5px] border border-brand font-bold text-[16px] text-brand"
                    >
                      Delete
                    </button>
                  </div>
                ))}

                <div className="mt-6.25">
                  <div className="flex items-center gap-3.75">
                    <button
                      type="button"
                      className="hover_btn_transp flex h-6.75 w-11.75 items-center justify-center rounded-[5px] bg-custom_gray text-xl font-bold text-ink"
                    >
                      +
                    </button>
                    <p className="text-[16px] font-semibold text-paper">
                      Add Card
                    </p>
                  </div>
                  <form
                    className="mt-6.25 flex max-w-75 flex-wrap gap-3.75"
                    onSubmit={(e) => {
                      e.preventDefault();
                      onApplyCard();
                    }}
                  >
                    <input
                      className="h-6.75 w-full rounded-[5px] border border-muted bg-transparent px-5 text-paper focus:outline-muted"
                      type="text"
                      placeholder="0000 0000 0000 0000"
                      value={newCardNumber}
                      onChange={(e) => setNewCardNumber(e.target.value)}
                    />
                    <div className="flex w-1/4 flex-col gap-2.5">
                      <label className="font-normal text-[16px] text-paper">
                        MM/YY
                      </label>
                      <input
                        className="h-6.75 rounded-[5px] border border-muted bg-transparent px-5 text-paper focus:outline-muted"
                        type="text"
                        placeholder="09/32"
                        value={newCardExpiry}
                        onChange={(e) => setNewCardExpiry(e.target.value)}
                      />
                    </div>
                    <div className="flex w-1/4 flex-col gap-2.5">
                      <label className="font-normal text-[16px] text-paper">
                        CVC
                      </label>
                      <input
                        className="h-6.75 rounded-[5px] border border-muted bg-transparent px-5 text-paper focus:outline-muted"
                        type="text"
                        placeholder="***"
                        value={newCardCvc}
                        onChange={(e) => setNewCardCvc(e.target.value)}
                      />
                    </div>
                    <button
                      type="submit"
                      className="hover_btn_transp mt-5 flex h-6.75 w-20.5 items-center justify-center rounded-[5px] border border-brand font-bold text-[16px] text-brand"
                    >
                      Apply
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>

          {/* Address */}
          <div className="mx-auto max-w-87.5">
            <button
              type="button"
              onClick={() => setAddressOpen((v) => !v)}
              className="mt-5 mx-auto flex w-full items-center justify-start gap-2.5"
            >
              <PinIcon />
              <p className="text-xl text-paper">Address</p>
              <ChevronUpIcon
                className={`transition-transform ${
                  addressOpen ? '' : 'rotate-180'
                }`}
              />
            </button>

            {addressOpen && (
              <div className="mt-5">
                <Image
                  src="/images/picture/maps.png"
                  alt="map"
                  width={350}
                  height={210}
                  className="w-full rounded-[5px] object-cover"
                />
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="mt-2.5 flex items-center justify-between"
                  >
                    <p className="font-normal text-xl text-white">
                      {addr.street} str., {addr.house}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setAddresses((prev) =>
                          prev.filter((a) => a.id !== addr.id),
                        )
                      }
                      className="hover_btn_transp flex items-center justify-center rounded-[5px] border border-brand px-5 py-1.25 font-bold text-[16px] text-brand"
                    >
                      Delete
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="hover_btn_white mt-7.5 rounded-[5px] border border-white px-5 py-1.25 font-semibold text-[16px] text-paper"
                >
                  + Add Address
                </button>
                <form
                  className="mt-6.25 flex max-w-75 flex-wrap gap-2.5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    onApplyAddress();
                  }}
                >
                  <div className="w-full">
                    <label className="font-normal text-[16px] text-paper">
                      Street
                    </label>
                    <input
                      className="mt-2.5 h-6.75 w-full rounded-[5px] border border-muted bg-transparent px-5 text-paper focus:outline-muted"
                      type="text"
                      placeholder="OneEntry"
                      value={newStreet}
                      onChange={(e) => setNewStreet(e.target.value)}
                    />
                  </div>
                  <div className="flex w-1/6 flex-col gap-2.5">
                    <label className="font-normal text-[16px] text-paper">
                      House
                    </label>
                    <input
                      className="h-6.75 rounded-[5px] border border-muted bg-transparent px-2.5 text-paper focus:outline-muted"
                      type="text"
                      placeholder="40"
                      value={newHouse}
                      onChange={(e) => setNewHouse(e.target.value)}
                    />
                  </div>
                  <div className="flex w-1/6 flex-col gap-2.5">
                    <label className="font-normal text-[16px] text-paper">
                      Floor
                    </label>
                    <input
                      className="h-6.75 rounded-[5px] border border-muted bg-transparent px-2.5 text-paper focus:outline-muted"
                      type="text"
                      placeholder="27"
                      value={newFloor}
                      onChange={(e) => setNewFloor(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    className="hover_btn_transp mt-5 flex h-6.75 items-center justify-center rounded-[5px] border border-brand px-5 py-1.25 font-bold text-[16px] text-brand"
                  >
                    Apply
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Mobile close button at bottom */}
          <div className="mt-7.5 mb-5 flex justify-center md:hidden">
            <button
              type="button"
              onClick={close}
              aria-label="Close profile"
              className="group flex h-11.5 w-11.5 items-center justify-center rounded-full border border-paper hover:border-brand"
            >
              <CloseXBoldIcon className="hover-target h-3.75 w-3.75" />
            </button>
          </div>

          <div className="h-25 bg-transparent md:hidden" />
        </div>
      </div>
      <ModalBackdrop />
    </ProfilePopupAnimations>
  );
};

export default ProfilePopup;
