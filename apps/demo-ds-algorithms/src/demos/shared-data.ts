/**
 * Shared sample data used across demos
 */

export const SAMPLE_PRODUCTS = [
  'Apple iPhone 14',
  'Apple iPhone 14 Pro',
  'Apple MacBook Pro',
  'Apple MacBook Air',
  'Apple AirPods Pro',
  'Apple Watch Series 8',
  'Samsung Galaxy S23',
  'Samsung Galaxy S23 Ultra',
  'Samsung Tab S8',
  'Samsung Galaxy Watch',
  'Microsoft Surface Pro',
  'Microsoft Surface Laptop',
  'Microsoft Xbox Series X',
  'Google Pixel 7',
  'Google Pixel 7 Pro',
  'Sony PlayStation 5',
  'Sony WH-1000XM5',
  'Dell XPS 13',
  'HP Spectre x360',
  'Lenovo ThinkPad X1',
];

function generateProducts(count: number): string[] {
  const products: string[] = [];
  const brands = ['Apple', 'Samsung', 'Microsoft', 'Google', 'Sony', 'Dell', 'HP', 'Lenovo'];
  const types = ['Phone', 'Laptop', 'Tablet', 'Watch', 'Headphones', 'Monitor', 'Keyboard', 'Mouse'];

  for (let i = 0; i < count; i++) {
    const brand = brands[Math.floor(Math.random() * brands.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    const model = Math.floor(Math.random() * 100);
    products.push(`${brand} ${type} ${model}`);
  }

  return products;
}

export const ALL_PRODUCTS = [...SAMPLE_PRODUCTS, ...generateProducts(9980)];
