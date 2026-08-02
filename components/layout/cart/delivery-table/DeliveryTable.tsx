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
import { FORMS } from '@/app/utils/constants';
import CalendarIcon from '@/components/icons/calendar';
import { getFormAttributes } from '@/components/utils';

import TableRowAnimations from '../animations/TableRowAnimations';
import AddressRow from './AddressRow';
import DeliveryRow from './DeliveryRow';
import DeliveryTableRow from './DeliveryTableRow';

/**
 * DeliveryTable — delivery details table: time, address, and the delivery line; also dispatches into the order draft.
 *
 * @param   {object}            props          - Component props.
 * @param   {IProductsEntity}   props.delivery - OneEntry product representing the delivery service line item.
 * @returns JSX of the delivery table.
 */
const DeliveryTable = ({ delivery }: { delivery: IProductsEntity }): JSX.Element => {
  const t = useT();
  const dispatch = useAppDispatch();
  const { user } = useContext(AuthContext);
  const deliveryData = useAppSelector(selectDeliveryData);

  const { data } = useGetFormByMarkerQuery({
    marker: FORMS.deliveryOrder,
  });

  const timeText = t('time_text', 'Time');

  const attrs = getFormAttributes(data).filter((attr: IFormAttribute) => attr.marker !== 'time2');
  const addressReg = user?.formData.find(el => el.marker === 'address_reg')?.value || '';

  useEffect(() => {
    const date = deliveryData.date;
    const time = deliveryData.time;
    const address = deliveryData.address || addressReg || '';

    // OneEntry expects `timeInterval` as `[[startISO, endISO]]`;
    // if no hour has been picked yet, skip the dispatch.
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
    // Seed the order draft once per delivery change — `addressReg` is a login-time constant and `dispatch` is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliveryData]);

  return (
    <TableRowAnimations className="table w-full border-collapse text-white/90" index={5}>
      <div>
        {attrs?.map((attr: IFormAttribute, i: Key) => {
          const marker = attr.marker;
          const fieldPlaceholder = String(attr.additionalFields?.placeholder?.value ?? '');
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
                placeholder={fieldPlaceholder}
              />
            );
          }
          if (marker === 'delivery_address') {
            return <AddressRow key={i} placeholder={fieldPlaceholder} />;
          }
          return;
        })}
        <DeliveryRow delivery={delivery} />
      </div>
    </TableRowAnimations>
  );
};

export default DeliveryTable;
