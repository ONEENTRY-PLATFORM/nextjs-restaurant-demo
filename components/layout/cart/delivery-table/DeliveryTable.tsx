import type { IFormAttribute } from 'oneentry/dist/forms/formsInterfaces';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX, Key } from 'react';
import { useContext, useEffect } from 'react';

import { useGetFormByMarkerQuery } from '@/app/api';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { useT } from '@/app/store/providers/DictProvider';
import { selectDeliveryData } from '@/app/store/reducers/CartSlice';
import { addData } from '@/app/store/reducers/OrderSlice';
import CalendarIcon from '@/components/icons/calendar';

import TableRowAnimations from '../animations/TableRowAnimations';
import AddressRow from './AddressRow';
import DeliveryRow from './DeliveryRow';
import DeliveryTableRow from './DeliveryTableRow';

/**
 * Таблица доставки
 */
const DeliveryTable = ({ delivery }: { delivery: IProductsEntity }): JSX.Element => {
  const t = useT();
  const dispatch = useAppDispatch();
  const { user } = useContext(AuthContext);
  const deliveryData = useAppSelector(selectDeliveryData);

  // получаем форму по marker через RTK
  const { data } = useGetFormByMarkerQuery({
    marker: 'delivery_order',
  });

  // `order_info_*_placeholder` отсутствуют в `static_content` — используем
  // существующие `time_text` / `address_text` (проверено через inspect-api).
  const timeText = t('time_text', 'Time');
  const addressText = t('address_text', 'Address');

  const attrs = data?.attributes.filter((attr: IFormAttribute) => attr.marker !== 'time2');
  const addressReg = user?.formData.find(el => el.marker === 'address_reg')?.value || '';

  // устанавливаем данные доставки onChange — markers соответствуют форме `delivery_order` в admin
  useEffect(() => {
    const date = deliveryData.date;
    const time = deliveryData.time;
    const address = deliveryData.address || addressReg || '';

    // OneEntry для `timeInterval` ждёт массив пар `[[startISO, endISO]]`
    // (см. SDK skill `create-checkout`). Если час ещё не выбран — пропускаем
    // dispatch, чтобы не отправить невалидный value.
    const hourMatch = typeof time === 'string' ? time.match(/^(\d{1,2})/) : null;
    const hour = hourMatch?.[1] ? parseInt(hourMatch[1], 10) : NaN;
    if (date && Number.isFinite(hour)) {
      const start = new Date(date);
      start.setUTCHours(hour, 0, 0, 0);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      dispatch(
        addData({
          marker: 'delivery_time',
          type: 'timeInterval',
          value: [[start.toISOString(), end.toISOString()]],
          valid: true,
        })
      );
    }
    dispatch(
      addData({
        marker: 'delivery_address',
        type: 'string',
        value: address,
        valid: address ? true : false,
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliveryData]);

  return (
    <TableRowAnimations className="table w-full border-collapse text-white/90" index={5}>
      <div>
        {attrs?.map((attr: IFormAttribute, i: Key) => {
          const marker = attr.marker;
          if (marker === 'delivery_time') {
            return (
              <DeliveryTableRow
                key={i}
                value={
                  deliveryData.date
                    ? `${new Date(deliveryData.date).toLocaleDateString('en-US')} ${deliveryData.time ?? ''}`
                    : ''
                }
                icon={
                  <span className="inline-block size-5">
                    <CalendarIcon />
                  </span>
                }
                label={timeText}
                placeholder={timeText}
              />
            );
          }
          if (marker === 'delivery_address') {
            return <AddressRow key={i} placeholder={addressText} />;
          }
          return;
        })}
        <DeliveryRow delivery={delivery} />
      </div>
    </TableRowAnimations>
  );
};

export default DeliveryTable;
