/**
 * seed-reviews.mjs — заполняет OneEntry отзывами (`review_form`) для всех товаров каталога.
 *
 * Что делает:
 *  1. Создаёт (или переиспользует) несколько демо-аккаунтов — каждый отзыв публикуется
 *     от своего пользователя, поэтому автор на карточке товара (= `userIdentifier`/email)
 *     получается разным.
 *  2. Перебирает все товары через `Products.getProducts` (с пагинацией).
 *  3. На каждый товар постит REVIEWS_PER_PRODUCT отзывов из курированного пула
 *     (текст + рейтинг), ротируя аккаунты, чтобы авторы и тексты не повторялись подряд.
 *  4. Идемпотентность: если у аккаунта уже есть отзыв на товар — пропускает (повторный
 *     запуск не плодит дубли). Один аккаунт = один отзыв на товар (как в UI приложения).
 *
 * Запуск:
 *   node scripts/seed-reviews.mjs            # реальная запись
 *   node scripts/seed-reviews.mjs --dry-run  # только показать, что было бы создано
 *
 * Конфиг (URL, app-token) читается из .env.local (NEXT_PUBLIC_PROJECT_URL / NEXT_PUBLIC_APP_TOKEN).
 */

import { readFileSync } from 'node:fs';
import { defineOneEntry } from 'oneentry';

// ─────────────────────────────────────────────────────────────────────────────
// Настройки
// ─────────────────────────────────────────────────────────────────────────────

const FORM_MARKER = 'review_form';
const RATING_MARKER = 'review_rating';
const TEXT_MARKER = 'review_text';
const REVIEW_STATUS = 'approved'; // только approved попадает в getProductReviews
const REVIEWS_PER_PRODUCT = 3;
const PAGE_SIZE = 100;
const LANG = 'en_US';
const DRY_RUN = process.argv.includes('--dry-run');

/** Демо-аккаунты. Автор на карточке = email (отдельного поля «имя» в форме нет). */
const DEMO_ACCOUNTS = [
  { email: 'maria.rossi@example.com', name: 'Maria', phone: '+12025550101' },
  { email: 'james.carter@example.com', name: 'James', phone: '+12025550102' },
  { email: 'sofia.almeida@example.com', name: 'Sofia', phone: '+12025550103' },
  { email: 'liam.novak@example.com', name: 'Liam', phone: '+12025550104' },
  { email: 'emma.dubois@example.com', name: 'Emma', phone: '+12025550105' },
  { email: 'noah.tanaka@example.com', name: 'Noah', phone: '+12025550106' },
];
const DEMO_PASSWORD = 'Demo12345!';

/**
 * Курированный пул отзывов (общие для любого блюда формулировки + рейтинг под тон текста).
 * Перебирается по кругу, смещение зависит от индекса товара — у соседних товаров разные тексты.
 */
const REVIEW_POOL = [
  { rating: 5, text: 'Absolutely delicious — easily one of the best things I have ordered here.' },
  { rating: 5, text: 'Fresh, flavorful and beautifully presented. Will definitely order again.' },
  { rating: 5, text: 'Generous portion and the taste was spot on. Highly recommend.' },
  { rating: 4, text: 'Really enjoyed it. Arrived hot and the flavor was great.' },
  { rating: 5, text: 'Perfectly cooked and full of flavor. My new favorite.' },
  { rating: 4, text: 'Tasty and satisfying. A solid choice, would get it again.' },
  { rating: 5, text: 'Exceeded my expectations — rich taste and great quality ingredients.' },
  { rating: 4, text: 'Very good overall. Nice balance of flavors, fast delivery.' },
  { rating: 3, text: 'Decent, but I expected a bit more seasoning. Still okay.' },
  { rating: 5, text: 'Outstanding! Tasted fresh and homemade. Thank you, chef.' },
  { rating: 4, text: 'Great value for the portion size and the flavor was lovely.' },
  { rating: 5, text: 'Loved every bite. Will be recommending this to my friends.' },
  { rating: 4, text: 'Solid dish, came well-packaged and still warm. Enjoyed it.' },
  { rating: 3, text: 'It was fine — nothing wrong, just not as memorable as I hoped.' },
  { rating: 5, text: 'Incredible flavor and texture. Felt like dining in the restaurant.' },
  { rating: 4, text: 'Good portion, fresh ingredients, pleasant taste. Happy with it.' },
  { rating: 5, text: 'One of the tastiest meals I have had this month. Five stars.' },
  { rating: 4, text: 'Really nice — flavorful and filling. Would order on a busy night.' },
  { rating: 5, text: 'Beautifully made and bursting with flavor. Cannot recommend enough.' },
  { rating: 3, text: 'Pretty good, a little pricey for the size but tasted fresh.' },
  { rating: 5, text: 'Delicious and comforting. Delivery was quick and everything was hot.' },
  { rating: 4, text: 'Enjoyable and well-seasoned. A reliable pick from the menu.' },
  { rating: 5, text: 'Top notch quality — you can tell it is made with care.' },
  { rating: 4, text: 'Very tasty, fresh and satisfying. Came exactly as described.' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Утилиты
// ─────────────────────────────────────────────────────────────────────────────

/**
 * loadEnv — читает пары KEY=VALUE из .env.local (без зависимостей, без экспорта в process.env).
 * @returns {Record<string,string>} Словарь переменных окружения из .env.local.
 */
function loadEnv() {
  const raw = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
  return Object.fromEntries(
    raw
      .split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('#'))
      .map(l => {
        const i = l.indexOf('=');
        return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')];
      })
  );
}

/**
 * isErr — true, если ответ SDK является конвертом ошибки (`{ statusCode, message }`).
 * @param   {unknown} res - Ответ метода SDK.
 * @returns {boolean} Признак ошибки.
 */
function isErr(res) {
  return Boolean(res && typeof res === 'object' && typeof res.statusCode === 'number' && 'message' in res);
}

/**
 * ensureAccount — гарантирует существование демо-аккаунта и возвращает авторизованный SDK-инстанс.
 *
 * Пытается signUp (новые пользователи в этом проекте активны сразу). Если email уже занят —
 * просто авторизуется существующим. Каждый аккаунт получает собственный изолированный инстанс.
 * @param   {string} url     - URL проекта OneEntry.
 * @param   {string} token   - App-token.
 * @param   {{email:string,name:string}} acc - Демо-аккаунт.
 * @returns {Promise<object|null>} Авторизованный SDK-инстанс или null при неудаче.
 */
async function ensureAccount(url, token, acc) {
  const sdk = defineOneEntry(url, { token, langCode: LANG, isShell: true });
  const signUpRes = await sdk.AuthProvider.signUp('email', {
    formIdentifier: 'user',
    authData: [
      { marker: 'email', value: acc.email },
      { marker: 'password', value: DEMO_PASSWORD },
    ],
    formData: [
      { marker: 'username', type: 'string', value: acc.name },
      { marker: 'surname', type: 'string', value: 'Guest' },
      { marker: 'email', type: 'string', value: acc.email },
      { marker: 'phone', type: 'string', value: acc.phone },
    ],
    notificationData: { email: acc.email, phonePush: [acc.phone], phoneSMS: acc.phone },
  });
  // statusCode присутствует и при «уже существует», и при валидационной ошибке — логируем, но не падаем.
  if (isErr(signUpRes)) {
    console.log(`   · ${acc.email}: signUp → ${signUpRes.statusCode} ${signUpRes.message} (пробую auth)`);
  }
  const authRes = await sdk.AuthProvider.auth('email', {
    authData: [
      { marker: 'email', value: acc.email },
      { marker: 'password', value: DEMO_PASSWORD },
    ],
  });
  if (isErr(authRes) || !authRes?.accessToken) {
    console.log(`   ✗ ${acc.email}: auth не удалась — пропускаю аккаунт`);
    return null;
  }
  return sdk;
}

/**
 * resolveModuleConfigId — id первого moduleFormConfig у `review_form` (фолбэк 2).
 * @param   {object} sdk - Любой инициализированный SDK-инстанс.
 * @returns {Promise<number>} `moduleFormConfigs[0].id`.
 */
async function resolveModuleConfigId(sdk) {
  try {
    const form = await sdk.Forms.getFormByMarker(FORM_MARKER);
    return form?.moduleFormConfigs?.[0]?.id ?? 2;
  } catch {
    return 2;
  }
}

/**
 * fetchAllProducts — все товары каталога постранично.
 * @param   {object} sdk - Авторизованный/анонимный SDK-инстанс.
 * @returns {Promise<Array<{id:number,title:string}>>} Список товаров (id + заголовок для логов).
 */
async function fetchAllProducts(sdk) {
  const out = [];
  let offset = 0;
  for (;;) {
    const page = await sdk.Products.getProducts([], LANG, { offset, limit: PAGE_SIZE });
    if (isErr(page)) {
      console.log(`   ✗ getProducts → ${page.statusCode} ${page.message}`);
      break;
    }
    const items = page?.items ?? [];
    for (const p of items) {
      out.push({ id: p.id, title: p.localizeInfos?.title ?? p.title ?? `#${p.id}` });
    }
    offset += PAGE_SIZE;
    if (offset >= (page?.total ?? out.length) || items.length === 0) break;
  }
  return out;
}

/**
 * hasReview — есть ли у аккаунта approved-отзыв на товар (для идемпотентности).
 * @param   {object} sdk       - SDK-инстанс аккаунта.
 * @param   {number} cfgId     - moduleFormConfigId.
 * @param   {number} productId - Id товара.
 * @param   {string} email     - userIdentifier аккаунта.
 * @returns {Promise<boolean>} true, если отзыв уже существует.
 */
async function hasReview(sdk, cfgId, productId, email) {
  try {
    const data = await sdk.FormData.getFormsDataByMarker(
      FORM_MARKER,
      cfgId,
      { entityIdentifier: productId, userIdentifier: email, status: [REVIEW_STATUS], dateFrom: '', dateTo: '' },
      1,
      LANG,
      0,
      10
    );
    if (isErr(data)) return false;
    const items = data?.items ?? [];
    return items.some(i => i.parentId === null && i.userIdentifier === email);
  } catch {
    return false;
  }
}

/**
 * postReview — публикует один отзыв (rating + text) от имени аккаунта на товар.
 * @param   {object} sdk       - Авторизованный SDK-инстанс аккаунта.
 * @param   {number} cfgId     - moduleFormConfigId.
 * @param   {number} productId - Id товара.
 * @param   {{rating:number,text:string}} review - Курированный отзыв.
 * @returns {Promise<boolean>} true при успешной записи.
 */
async function postReview(sdk, cfgId, productId, review) {
  const res = await sdk.FormData.postFormsData({
    formIdentifier: FORM_MARKER,
    formModuleConfigId: cfgId,
    moduleEntityIdentifier: String(productId),
    replayTo: null,
    status: REVIEW_STATUS,
    formData: [
      { marker: RATING_MARKER, type: 'integer', value: review.rating },
      { marker: TEXT_MARKER, type: 'text', value: [{ plainValue: review.text }] },
    ],
  });
  if (isErr(res)) {
    console.log(`      ✗ post → ${res.statusCode} ${res.message}`);
    return false;
  }
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Основной сценарий
// ─────────────────────────────────────────────────────────────────────────────

/**
 * main — оркестрирует весь сидинг: аккаунты → товары → отзывы.
 * @returns {Promise<void>}
 */
async function main() {
  const env = loadEnv();
  const url = (env.NEXT_PUBLIC_ONEENTRY_URL || env.NEXT_PUBLIC_PROJECT_URL || '').replace(/\/$/, '');
  const token = env.NEXT_PUBLIC_ONEENTRY_TOKEN || env.NEXT_PUBLIC_APP_TOKEN;
  if (!url || !token) {
    console.error('Не найден NEXT_PUBLIC_PROJECT_URL / NEXT_PUBLIC_APP_TOKEN в .env.local');
    process.exit(1);
  }
  console.log(`OneEntry: ${url}${DRY_RUN ? '  [DRY RUN — без записи]' : ''}\n`);

  // 1. Аккаунты
  console.log(`▶ Готовлю ${DEMO_ACCOUNTS.length} демо-аккаунтов…`);
  const sessions = [];
  for (const acc of DEMO_ACCOUNTS) {
    const sdk = await ensureAccount(url, token, acc);
    if (sdk) sessions.push({ ...acc, sdk });
  }
  if (sessions.length === 0) {
    console.error('Не удалось подготовить ни одного аккаунта. Останов.');
    process.exit(1);
  }
  console.log(`   ✓ Готово аккаунтов: ${sessions.length}\n`);

  // 2. Конфиг формы + товары
  const cfgId = await resolveModuleConfigId(sessions[0].sdk);
  console.log(`▶ moduleFormConfigId = ${cfgId}`);
  const products = await fetchAllProducts(sessions[0].sdk);
  console.log(`▶ Товаров в каталоге: ${products.length}\n`);

  // 3. Отзывы
  let posted = 0;
  let skipped = 0;
  let failed = 0;

  for (let pi = 0; pi < products.length; pi++) {
    const product = products[pi];
    const perProduct = Math.min(REVIEWS_PER_PRODUCT, sessions.length);
    const picks = [];
    for (let k = 0; k < perProduct; k++) {
      const session = sessions[(pi + k) % sessions.length];
      const review = REVIEW_POOL[(pi * REVIEWS_PER_PRODUCT + k) % REVIEW_POOL.length];
      picks.push({ session, review });
    }

    console.log(`[${pi + 1}/${products.length}] #${product.id} ${product.title}`);
    for (const { session, review } of picks) {
      if (DRY_RUN) {
        console.log(`      ↳ ${session.email}  ★${review.rating}  "${review.text.slice(0, 48)}…"`);
        posted++;
        continue;
      }
      if (await hasReview(session.sdk, cfgId, product.id, session.email)) {
        skipped++;
        continue;
      }
      const ok = await postReview(session.sdk, cfgId, product.id, review);
      if (ok) {
        posted++;
        console.log(`      ✓ ${session.email}  ★${review.rating}`);
      } else {
        failed++;
      }
    }
  }

  console.log(
    `\n✅ Готово. Опубликовано: ${posted}${DRY_RUN ? ' (dry-run)' : ''}` +
      `${skipped ? `, пропущено (уже были): ${skipped}` : ''}` +
      `${failed ? `, ошибок: ${failed}` : ''}`
  );
}

main().catch(e => {
  console.error('Фатальная ошибка:', e?.message ?? e);
  process.exit(1);
});
