/**
 * seed-test-user-orders.mjs — заводит для E2E-тестового юзера один delivery-заказ и одну бронь,
 * чтобы `/profile/orders` и `/profile/bookings` показывали строки, а тесты `auth-flow.spec.ts`
 * вышли из skip (см. ONEENTRY-ADMIN-TODO C.11.2).
 *
 * Что делает:
 *  1. Авторизуется под E2E_USER_EMAIL / E2E_USER_PASSWORD (.env.local) через SDK.
 *  2. Инспектирует сторэджи заказов (getAllOrdersStorage), формы delivery/booking и текущие заказы.
 *  3. С флагом --create: создаёт по одному заказу в delivery- и booking-сторэдже, ТОЛЬКО если там
 *     ещё нет ни одного (идемпотентно). formData строится из живой схемы формы (required-поля + те,
 *     для которых есть значение), с правильным шейпингом по типам.
 *  4. Проверяет результат (повторный getAllOrdersByMarker).
 *
 * Запуск:
 *   node scripts/seed-test-user-orders.mjs            # только инспекция (без записи)
 *   node scripts/seed-test-user-orders.mjs --create   # создать недостающие заказ+бронь
 */

import { readFileSync } from 'node:fs';
import { defineOneEntry } from 'oneentry';

const LANG = 'en_US';
const CREATE = process.argv.includes('--create');

const DELIVERY_PRODUCT_ID = 1828; // app/utils/constants.ts
const BOOKING_PRODUCT_ID = 2071;
const DELIVERY_MARKER = 'delivery_order';
const BOOKING_MARKER = 'booking_order';

/** loadEnv — KEY=VALUE из .env.local без зависимостей. */
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

/** isErr — конверт ошибки SDK ({ statusCode, message }). */
function isErr(res) {
  return Boolean(
    res && typeof res === 'object' && typeof res.statusCode === 'number' && 'message' in res
  );
}

const iso = ms => new Date(ms).toISOString();

/** shapeValue — приводит сырое значение к форме, которую ждёт OneEntry для данного типа поля. */
function shapeValue(type, raw) {
  if (raw === undefined || raw === null) return undefined;
  switch (type) {
    case 'text':
      return [{ plainValue: String(raw) }];
    case 'integer':
      return typeof raw === 'string' ? raw : String(raw);
    case 'entity':
      return Array.isArray(raw) ? raw : [raw];
    case 'timeInterval':
      return raw; // ожидается [[startISO, endISO]]
    case 'date':
      return raw; // ожидается { fullDate, formattedValue, formatString }
    case 'spam':
    case 'button':
      return undefined;
    default:
      return typeof raw === 'object' ? raw : String(raw);
  }
}

/** defaultForType — безопасное дефолтное значение, если required-поле не покрыто RAW. */
function defaultForType(type, now) {
  switch (type) {
    case 'integer':
      return '1';
    case 'text':
      return 'E2E seed';
    case 'date':
      return { fullDate: iso(now), formattedValue: iso(now).slice(0, 10), formatString: 'YYYY-MM-DD' };
    case 'timeInterval':
      return [[iso(now + 30 * 60000), iso(now + 75 * 60000)]];
    default:
      return 'E2E seed';
  }
}

/** buildFormData — из живых атрибутов формы: required-поля + те, для которых есть значение в RAW. */
function buildFormData(attributes, RAW, now) {
  const out = [];
  for (const a of attributes ?? []) {
    if (a.type === 'spam' || a.type === 'button') continue;
    const required = a?.validators?.requiredValidator?.strict === true;
    let raw = RAW[a.marker];
    if (raw === undefined) {
      if (!required) continue;
      raw = defaultForType(a.type, now);
    }
    const value = shapeValue(a.type, raw);
    if (value === undefined) continue;
    out.push({ marker: a.marker, type: a.type, value });
  }
  return out;
}

async function listOrders(sdk, marker) {
  const r = await sdk.Orders.getAllOrdersByMarker(marker, LANG, 0, 50);
  if (isErr(r)) {
    console.log(`   ! orders[${marker}]: ${r.statusCode} ${r.message}`);
    return null;
  }
  const items = r.items ?? [];
  console.log(`   orders[${marker}]: total=${r.total}, items=${items.length}`);
  items.slice(0, 5).forEach(o =>
    console.log(
      `      - id=${o.id} orderId=${o.orderId ?? ''} status=${o.statusIdentifier ?? ''} created=${o.createdDate ?? ''}`
    )
  );
  return items;
}

async function main() {
  const env = loadEnv();
  const url = (env.NEXT_PUBLIC_ONEENTRY_URL || env.NEXT_PUBLIC_PROJECT_URL || '').replace(/\/$/, '');
  const token = env.NEXT_PUBLIC_ONEENTRY_TOKEN || env.NEXT_PUBLIC_APP_TOKEN;
  const email = env.E2E_USER_EMAIL;
  const password = env.E2E_USER_PASSWORD;
  if (!url || !token || !email || !password) {
    console.error('Missing url/token/E2E_USER_EMAIL/E2E_USER_PASSWORD in .env.local');
    process.exit(1);
  }
  console.log(`OneEntry: ${url}  user: ${email}  mode: ${CREATE ? 'CREATE' : 'inspect-only'}\n`);

  const sdk = defineOneEntry(url, { token, langCode: LANG, isShell: true });
  const auth = await sdk.AuthProvider.auth('email', {
    authData: [
      { marker: 'email', value: email },
      { marker: 'password', value: password },
    ],
  });
  if (isErr(auth) || !auth?.accessToken) {
    console.error('Auth failed:', isErr(auth) ? `${auth.statusCode} ${auth.message}` : auth);
    process.exit(1);
  }
  console.log(`✓ Authed. userIdentifier=${auth.userIdentifier}\n`);

  // ── INSPECT storages ──────────────────────────────────────────
  console.log('▶ Order storages:');
  const storages = await sdk.Orders.getAllOrdersStorage(LANG);
  if (isErr(storages)) {
    console.error('   getAllOrdersStorage failed:', storages.statusCode, storages.message);
    process.exit(1);
  }
  for (const s of storages) {
    console.log(
      `   identifier="${s.identifier}" formIdentifier="${s.formIdentifier}" pay=${JSON.stringify(
        (s.paymentAccountIdentifiers ?? []).map(p => p.identifier)
      )}`
    );
  }
  const bookingStorage =
    storages.find(s => s.identifier?.toLowerCase().includes('booking')) ?? {
      identifier: BOOKING_MARKER,
      formIdentifier: BOOKING_MARKER,
      paymentAccountIdentifiers: [],
    };
  const deliveryStorage =
    storages.find(s => s !== bookingStorage && !s.identifier?.toLowerCase().includes('booking')) ?? {
      identifier: DELIVERY_MARKER,
      formIdentifier: DELIVERY_MARKER,
      paymentAccountIdentifiers: [],
    };

  // ── INSPECT forms ─────────────────────────────────────────────
  console.log('\n▶ Forms:');
  const forms = {};
  for (const m of [deliveryStorage.formIdentifier, bookingStorage.formIdentifier]) {
    const form = await sdk.Forms.getFormByMarker(m, LANG);
    if (isErr(form)) {
      console.log(`   form[${m}]: ${form.statusCode} ${form.message}`);
      continue;
    }
    forms[m] = form;
    const fields = (form.attributes ?? []).map(
      a => `${a.marker}:${a.type}${a?.validators?.requiredValidator?.strict ? '*' : ''}`
    );
    console.log(`   form[${m}]: ${fields.join(', ')}`);
  }

  // ── INSPECT existing orders ───────────────────────────────────
  console.log('\n▶ Existing orders for this user:');
  const delivItems = await listOrders(sdk, deliveryStorage.identifier);
  const bookItems = await listOrders(sdk, bookingStorage.identifier);

  // candidate restaurant entity id for the booking "restaurant" field
  let restaurantId = null;
  try {
    const rPages = await sdk.Pages.getChildPagesByParentUrl('restaurants', LANG);
    if (Array.isArray(rPages) && rPages.length) {
      restaurantId = rPages[0].id;
      console.log(`\n▶ Restaurant entity candidate: id=${restaurantId} (${rPages[0].pageUrl})`);
    }
  } catch {
    /* ignore */
  }

  if (!CREATE) {
    console.log('\n[inspect-only — re-run with --create to seed missing order/booking]');
    return;
  }

  // ── CREATE ────────────────────────────────────────────────────
  const now = Date.now();
  const RAW = {
    // delivery
    delivery_address: '12 Marina Walk, Dubai Marina, Dubai',
    address: '12 Marina Walk, Dubai Marina, Dubai',
    contact_phone: '+971500000000',
    alt_phone: '+971500000001',
    comment: 'E2E seed delivery order',
    delivery_time: [[iso(now + 30 * 60000), iso(now + 75 * 60000)]],
    // shared
    name: 'E2E Test User',
    username: 'E2E Test User',
    phone: '+971500000000',
    // booking
    people_count: '4',
    user_preferences: 'Window table — E2E seed booking',
    date: {
      fullDate: iso(now + 24 * 3600 * 1000),
      formattedValue: iso(now + 24 * 3600 * 1000).slice(0, 10),
      formatString: 'YYYY-MM-DD',
    },
    time_slot: [[iso(now + 24 * 3600 * 1000 + 18 * 3600000), iso(now + 24 * 3600 * 1000 + 19 * 3600000)]],
    ...(restaurantId ? { restaurant: [restaurantId] } : {}),
  };

  // delivery order
  if (delivItems && delivItems.length > 0) {
    console.log(`\n• delivery: already has ${delivItems.length} order(s) — skip`);
  } else {
    const pay = deliveryStorage.paymentAccountIdentifiers?.[0]?.identifier ?? 'cash';
    const body = {
      formIdentifier: deliveryStorage.formIdentifier ?? DELIVERY_MARKER,
      paymentAccountIdentifier: pay,
      formData: buildFormData(forms[deliveryStorage.formIdentifier]?.attributes, RAW, now),
      products: [{ productId: DELIVERY_PRODUCT_ID, quantity: 1 }],
    };
    console.log(`\n• Creating delivery order in "${deliveryStorage.identifier}" (pay=${pay})…`);
    console.log('   formData:', JSON.stringify(body.formData));
    const res = await sdk.Orders.createOrder(deliveryStorage.identifier, body, LANG);
    if (isErr(res)) console.error(`   ✗ ${res.statusCode} ${res.message}`);
    else console.log(`   ✓ created id=${res.id} total=${res.totalSum ?? ''} status=${res.statusIdentifier ?? ''}`);
  }

  // booking order
  if (bookItems && bookItems.length > 0) {
    console.log(`\n• booking: already has ${bookItems.length} booking(s) — skip`);
  } else {
    const pay = bookingStorage.paymentAccountIdentifiers?.[0]?.identifier ?? 'cash';
    const body = {
      formIdentifier: bookingStorage.formIdentifier ?? BOOKING_MARKER,
      paymentAccountIdentifier: pay,
      formData: buildFormData(forms[bookingStorage.formIdentifier]?.attributes, RAW, now),
      products: [{ productId: BOOKING_PRODUCT_ID, quantity: 1 }],
    };
    console.log(`\n• Creating booking in "${bookingStorage.identifier}" (pay=${pay})…`);
    console.log('   formData:', JSON.stringify(body.formData));
    const res = await sdk.Orders.createOrder(bookingStorage.identifier, body, LANG);
    if (isErr(res)) console.error(`   ✗ ${res.statusCode} ${res.message}`);
    else console.log(`   ✓ created id=${res.id} total=${res.totalSum ?? ''} status=${res.statusIdentifier ?? ''}`);
  }

  // ── VERIFY ────────────────────────────────────────────────────
  console.log('\n▶ Verify (post-create):');
  await listOrders(sdk, deliveryStorage.identifier);
  await listOrders(sdk, bookingStorage.identifier);
}

main().catch(e => {
  console.error('FATAL:', e?.message ?? e);
  process.exit(1);
});
