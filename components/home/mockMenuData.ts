import type { MenuItemData } from './MenuItemCard';

/**
 * Mock product catalogue — placeholders used while the OneEntry CMS is not
 * populated. Each section mirrors the items shown in `static-html/index.html`
 * (titles + image paths). Replace with real data from
 * `api.Products.getProductsByPageUrl(category)` once the API is live.
 */

const makeItem = (
  id: string,
  image: string,
  title: string,
  price = '$14',
): MenuItemData => ({
  id,
  image,
  time: '30-45 min',
  weight: '250 g',
  rating: '5,0',
  title,
  counter: 'x1',
  price,
});

export const recommendedItems: MenuItemData[] = [
  makeItem(
    'rec-1',
    '/images/picture/menu_item1.png',
    'Pancakes with honey and berries',
  ),
  makeItem(
    'rec-2',
    '/images/picture/menu_item2.png',
    'Greek salad with olives, tomatoes, and greenery',
  ),
  makeItem(
    'rec-3',
    '/images/picture/menu_item3.png',
    'Salad with eggplant, tomatoes and cilantro',
  ),
  makeItem(
    'rec-4',
    '/images/picture/menu_item4.png',
    'Fried scallops with cream',
  ),
  makeItem(
    'rec-5',
    '/images/picture/menu_item5.png',
    'Apple strudel with caramel',
  ),
  makeItem(
    'rec-6',
    '/images/picture/menu_item6.png',
    'Sour cabbage soup with beef',
  ),
];

export const breakfastItems: MenuItemData[] = [
  makeItem(
    'br-1',
    '/images/picture/Brackfast1.png',
    'Oatmeal with honey and hazelnut cookies',
  ),
  makeItem(
    'br-2',
    '/images/picture/Brackfast2.png',
    'Rice porrige with kaffir lime',
  ),
  makeItem(
    'br-3',
    '/images/picture/Brackfast3.png',
    'Millet porridge with pumpkin and custard',
  ),
  makeItem(
    'br-4',
    '/images/picture/Brackfast4.png',
    'Amaranth porridge with coconut milk and berry jam',
  ),
  makeItem(
    'br-5',
    '/images/picture/Brackfast5.png',
    'Strawberry cheesecake with mascarpone',
  ),
  makeItem(
    'br-6',
    '/images/picture/Brackfast6.png',
    'Pancakes with fresh fruit',
  ),
  makeItem(
    'br-7',
    '/images/picture/Brackfast7.png',
    'Eggs Benedict on toasted bread',
  ),
  makeItem(
    'br-8',
    '/images/picture/Brackfast8.png',
    'Greek yogurt with granola and honey',
  ),
];

export const lunchItems: MenuItemData[] = [
  makeItem(
    'lu-1',
    '/images/picture/lunch1.png',
    'Caesar salad with grilled chicken',
  ),
  makeItem('lu-2', '/images/picture/lunch2.png', 'Club sandwich with fries'),
  makeItem('lu-3', '/images/picture/lunch3.png', 'Grilled vegetable wrap'),
  makeItem('lu-4', '/images/picture/lunch4.png', 'Tuna salad with balsamic'),
  makeItem('lu-5', '/images/picture/lunch5.png', 'Spaghetti carbonara'),
  makeItem('lu-6', '/images/picture/lunch6.png', 'Margherita pizza'),
];

export const firstCourseItems: MenuItemData[] = [
  makeItem(
    'fc-1',
    '/images/picture/FIRST COURSE1.png',
    'Cream soup with salmon and greenery',
  ),
  makeItem(
    'fc-2',
    '/images/picture/FIRST COURSE2.png',
    'Traditional borsch with beef',
  ),
  makeItem(
    'fc-3',
    '/images/picture/FIRST COURSE3.png',
    'Tom yum with shrimp and coconut',
  ),
  makeItem(
    'fc-4',
    '/images/picture/FIRST COURSE4.png',
    'Minestrone with seasonal vegetables',
  ),
  makeItem(
    'fc-5',
    '/images/picture/FIRST COURSE5.png',
    'Chicken noodle soup with herbs',
  ),
  makeItem(
    'fc-6',
    '/images/picture/FIRST COURSE6.png',
    'Pumpkin cream soup with pepitas',
  ),
  makeItem(
    'fc-7',
    '/images/picture/FIRST COURSE7.png',
    'Miso soup with tofu and seaweed',
  ),
  makeItem(
    'fc-8',
    '/images/picture/FIRST COURSE8.png',
    'French onion soup with crouton',
  ),
];

export const mainCourseItems: MenuItemData[] = [
  makeItem('mc-1', '/images/picture/main1.png', 'Grilled ribeye steak'),
  makeItem('mc-2', '/images/picture/main2.png', 'Salmon fillet with asparagus'),
  makeItem(
    'mc-3',
    '/images/picture/main3.png',
    'Chicken Kyiv with mashed potato',
  ),
  makeItem(
    'mc-4',
    '/images/picture/main4.png',
    'Lamb rack with rosemary sauce',
  ),
  makeItem(
    'mc-5',
    '/images/picture/main5.png',
    'Pork tenderloin with apple glaze',
  ),
  makeItem('mc-6', '/images/picture/main6.png', 'Beef stroganoff with rice'),
  makeItem(
    'mc-7',
    '/images/picture/main7.png',
    'Duck breast with cherry reduction',
  ),
  makeItem(
    'mc-8',
    '/images/picture/main8.png',
    'Vegetable risotto with parmesan',
  ),
];

export const desertItems: MenuItemData[] = [
  makeItem(
    'de-1',
    '/images/picture/DESERT1.png',
    'Apple strudel with ice cream',
  ),
  makeItem('de-2', '/images/picture/DESERT2.png', 'Tiramisu with coffee syrup'),
  makeItem(
    'de-3',
    '/images/picture/DESERT3.png',
    'Chocolate fondant with berry',
  ),
  makeItem('de-4', '/images/picture/DESERT4.png', 'Lemon tart with meringue'),
  makeItem('de-5', '/images/picture/DESERT5.png', 'Cheesecake with raspberry'),
  makeItem('de-6', '/images/picture/DESERT6.png', 'Creme brulee with caramel'),
  makeItem('de-7', '/images/picture/DESERT7.png', 'Panna cotta with berries'),
  makeItem('de-8', '/images/picture/DESERT8.png', 'Macarons assortment box'),
];

export const beveragesItems: MenuItemData[] = [
  makeItem(
    'bv-1',
    '/images/picture/beverages1.png',
    'Cappuccino with cinnamon',
  ),
  makeItem('bv-2', '/images/picture/beverages2.png', 'Fresh orange juice'),
  makeItem('bv-3', '/images/picture/beverages3.png', 'Iced matcha latte'),
  makeItem('bv-4', '/images/picture/beverages4.png', 'Strawberry milkshake'),
  makeItem(
    'bv-5',
    '/images/picture/beverages5.png',
    'Espresso tonic with lime',
  ),
  makeItem('bv-6', '/images/picture/beverages6.png', 'Hot chocolate with whip'),
  makeItem('bv-7', '/images/picture/beverages7.png', 'Green tea with jasmine'),
  makeItem('bv-8', '/images/picture/beverages8.png', 'Berry smoothie bowl'),
];

export const mobilePromos = [
  '/images/promo/Business Lunch.png',
  '/images/promo/Deal of the Day.png',
  '/images/promo/Dinner_Fix_price.png',
  '/images/promo/Happy Birthday.png',
  '/images/promo/Happy_monday.png',
  '/images/promo/Kids_menu.png',
];
