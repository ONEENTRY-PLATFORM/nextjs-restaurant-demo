import { unstable_noStore } from 'next/cache';
import type { IFormsEntity } from 'oneentry/dist/forms/formsInterfaces';
import type {
  IFormByMarkerDataEntity,
  IFormsByMarkerDataEntity,
} from 'oneentry/dist/forms-data/formsDataInterfaces';

import { getApi, getLang, isError } from '@/app/api';
import { FORM_MODULE_CONFIG_IDS, FORMS } from '@/app/utils/constants';

const FORM_MARKER = FORMS.reviewForm;
const DEFAULT_MODULE_CONFIG_ID = FORM_MODULE_CONFIG_IDS.reviewForm;
const REVIEWS_LIMIT = 50;

/**
 * getProductReviews — approved product review records from OneEntry FormsData by `entityIdentifier`.
 *
 * Returns the SDK entities untouched (top-level filter + newest-first sort only) — field values are
 * read at the point of use via `productReviewFromFormData` (`components/reviews/productReview.ts`).
 * Deliberately uncached (`unstable_noStore`): user-generated reviews must be fresh.
 *
 * @param   {number}                    productId - Product id (becomes `entityIdentifier`).
 * @returns Promise resolving to top-level review records, newest first (empty on SDK error).
 */
export const getProductReviews = async (productId: number): Promise<IFormByMarkerDataEntity[]> => {
  unstable_noStore();

  try {
    const lang = getLang();

    const form = (await getApi().Forms.getFormByMarker(FORM_MARKER)) as IFormsEntity;
    const formModuleConfigId = form?.moduleFormConfigs?.[0]?.id ?? DEFAULT_MODULE_CONFIG_ID;

    const data = await getApi().FormData.getFormsDataByMarker(
      FORM_MARKER,
      formModuleConfigId,
      {
        entityIdentifier: productId,
        userIdentifier: '',
        status: ['approved'],
        dateFrom: '',
        dateTo: '',
      },
      1,
      lang,
      0,
      REVIEWS_LIMIT
    );

    if (isError(data)) {
      return [];
    }

    const items: IFormByMarkerDataEntity[] = (data as IFormsByMarkerDataEntity).items ?? [];

    return items.filter(item => item.parentId === null).sort((a, b) => b.id - a.id);
  } catch {
    return [];
  }
};
