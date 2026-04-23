import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { IFormAttribute } from 'oneentry/dist/forms/formsInterfaces';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX, Key } from 'react';
import { useContext, useEffect } from 'react';

import { useGetFormByMarkerQuery } from '@/app/api';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { selectDeliveryData } from '@/app/store/reducers/CartSlice';
import { addData } from '@/app/store/reducers/OrderSlice';

import TableRowAnimations from '../animations/TableRowAnimations';
import AddressRow from './AddressRow';
import DeliveryRow from './DeliveryRow';
import DeliveryTableRow from './DeliveryTableRow';

/**
 * Delivery table
 */
const DeliveryTable = ({
  delivery,
  dict,
}: {
  delivery: IProductsEntity;
  dict: IAttributeValues;
}): JSX.Element => {
  const dispatch = useAppDispatch();
  const { user } = useContext(AuthContext);
  const deliveryData = useAppSelector(selectDeliveryData);

  // get form by marker with RTK
  const { data } = useGetFormByMarkerQuery({
    marker: 'order',
  });

  const {
    order_info_date_placeholder,
    order_info_time_placeholder,
    order_info_address_placeholder,
  } = dict;

  const attrs = data?.attributes.filter(
    (attr: IFormAttribute) => attr.marker !== 'time2',
  );
  const addressReg =
    user?.formData.find((el) => el.marker === 'address_reg')?.value || '';

  // set delivery data onChange
  useEffect(() => {
    const date = deliveryData.date;
    const time = deliveryData.time;
    const address = deliveryData.address || addressReg || '';

    dispatch(
      addData({
        marker: 'date',
        type: 'date',
        value: {
          fullDate: new Date(date).toISOString(),
          formattedValue: new Date(date).toDateString() + ' 00:00',
          formatString: 'YYYY-MM-DD',
        },
        valid: date ? true : false,
      }),
    );
    dispatch(
      addData({
        marker: 'time',
        type: 'string',
        value: time,
        valid: time ? true : false,
      }),
    );
    dispatch(
      addData({
        marker: 'order_address',
        type: 'string',
        value: address,
        valid: address ? true : false,
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliveryData]);

  return (
    <TableRowAnimations
      className="table w-full border-collapse text-white/90"
      index={5}
    >
      <div>
        {attrs?.map((attr: IFormAttribute, i: Key) => {
          const marker = attr.marker;
          if (marker === 'date') {
            return (
              <DeliveryTableRow
                key={i}
                value={new Date(deliveryData.date).toLocaleDateString('en-US')}
                icon={'/icons/calendar.svg'}
                label={order_info_date_placeholder?.value as string}
                placeholder={order_info_date_placeholder?.value as string}
              />
            );
          }
          if (marker === 'time') {
            return (
              <DeliveryTableRow
                key={i}
                value={deliveryData.time as string}
                icon={'/icons/time.svg'}
                label={order_info_time_placeholder?.value as string}
                placeholder={order_info_time_placeholder?.value as string}
              />
            );
          }
          if (marker === 'order_address') {
            return (
              <AddressRow
                key={i}
                placeholder={order_info_address_placeholder?.value as string}
              />
            );
          }
          return;
        })}
        <DeliveryRow delivery={delivery} />
      </div>
    </TableRowAnimations>
  );
};

export default DeliveryTable;
