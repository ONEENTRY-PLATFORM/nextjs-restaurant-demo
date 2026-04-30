import type { FormDataType } from 'oneentry/dist/forms-data/formsDataInterfaces';

/**
 * Один атрибут формы OneEntry, возвращаемый `Forms.getFormByMarker`.
 * @property {string} marker     - Маркер поля (используется как ключ при отправке данных формы).
 * @property {string} type       - Тип поля OneEntry (`text`, `string`, `integer`, `groupOfImages`, `spam`, `button`, …).
 * @property {number} [position] - Порядок, в котором рендерятся поля.
 */
export interface FormAttribute {
  marker: string;
  type: string;
  position?: number;
}

/**
 * Входные данные для трансформации одного поля, передаваемые в {@link transformFormField}.
 * @property {string}  marker    - Маркер поля.
 * @property {string}  type      - Тип поля из схемы формы OneEntry.
 * @property {unknown} value     - Сырое значение, подаваемое из UI (string / number / array).
 * @property {number}  productId - Product ID — нужен для скоупа загрузок `groupOfImages`.
 */
export interface TransformFieldParams {
  marker: string;
  type: string;
  value: unknown;
  productId: number;
}

/**
 * Конвертирует одно UI-значение в payload-запись `FormDataType` OneEntry.
 * Повторяет конвенцию из `transformFormField` в `oneentry-next-shop` —
 * dispatch сначала по маркеру (`spam`, `send`), затем по типу поля
 * (`text`, `groupOfImages`), с проваливанием в дефолт для примитивов.
 * @param   {TransformFieldParams} params - Входные данные поля.
 * @returns {FormDataType}                Запись FormData, готовая для `postFormsData`.
 */
export const transformFormField = ({
  marker,
  type,
  value,
  productId,
}: TransformFieldParams): FormDataType => {
  if (marker === 'spam') {
    return { marker, type: 'spam', value: '' } as unknown as FormDataType;
  }
  if (marker === 'send') {
    return { marker, type: 'button', value: '' } as unknown as FormDataType;
  }
  if (type === 'text') {
    const plain = String(value ?? '');
    return {
      marker,
      type: 'text',
      value: [{ plainValue: plain, htmlValue: plain }],
    } as unknown as FormDataType;
  }
  if (type === 'groupOfImages') {
    return {
      marker,
      type: 'groupOfImages',
      value: Array.isArray(value) ? value : [],
      fileQuery: { type: 'catalog', entity: 'editor', id: productId },
    } as unknown as FormDataType;
  }
  return {
    marker,
    type: type as 'string' | 'integer' | 'float' | 'number',
    value: typeof value === 'number' ? value : String(value ?? ''),
  } as unknown as FormDataType;
};

/**
 * Валидирует, что трансформированный массив FormData содержит хотя бы одно непустое поле контента.
 * Записи `spam`/`button` игнорируются — они никогда не несут пользовательский ввод.
 * @param   {FormDataType[]}                       data - Трансформированный payload формы.
 * @returns {{ isValid: boolean; error?: string }}      Результат валидации.
 */
export const validateFormData = (
  data: FormDataType[],
): { isValid: boolean; error?: string } => {
  if (data.length === 0) {
    return { isValid: false, error: 'No form data to submit' };
  }
  const content = data.filter((f) => f.type !== 'spam' && f.type !== 'button');
  const hasContent = content.some((f) => {
    const v = f.value;
    if (Array.isArray(v)) return v.length > 0;
    return v !== '' && v !== null && v !== undefined;
  });
  return hasContent
    ? { isValid: true }
    : { isValid: false, error: 'Please fill in at least one field' };
};
