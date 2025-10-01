import { Store } from '@/types/store';

const storeNames = [
  'Uttara',
  'Gulshan',
  'Banani',
  'Motijheel',
  'Banasree Plaza',
  'Mirpur Central',
];

const locations = [
  'Uttara, Dhaka, Bangladesh',
  'Gulshan, Dhaka, Bangladesh',
  'Banani, Dhaka, Bangladesh',
  'Motijheel, Dhaka, Bangladesh',
  'Banasree Plaza, Dhaka, Bangladesh',
  'Mirpur Central, Dhaka, Bangladesh',
];


const pathao_keys = [
  'UTTARA-12345',
  'GULSHAN-67890',
  'BANANI-13579',
  'MOTIJHEEL-24680',
  'BANASREE-11223',
  'MIRPUR-44556',
];


export function generateDummyStores(count: number): Store[] {
  const stores: Store[] = [];

  for (let i = 0; i < count; i++) {
    const isActive = i % 5 !== 0; // deterministic: every 5th store inactive
    const revenue = isActive ? 50000 + i * 1000 : 0;
    const revenueChange = isActive ? ((i % 10) - 5) : 0;

    stores.push({
      id: `store-${i + 1}`,
      name: storeNames[i % storeNames.length],
      location: locations[i % locations.length],
      type: i % 2 === 0 ? 'Store' : 'Warehouse',
      pathao_key: pathao_keys[i % pathao_keys.length],
      revenue,
      revenueChange,
      products: 400 + i * 10,
      orders: isActive ? 50 + i * 3 : 0,
    });
  }

  return stores;
}

  