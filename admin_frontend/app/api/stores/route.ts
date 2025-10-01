import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// File path for the stores.json file
const storesFilePath = path.resolve('public', 'stores.json');

// Helper function to read stores from the JSON file
const readStoresFromFile = () => {
  if (fs.existsSync(storesFilePath)) {
    const fileData = fs.readFileSync(storesFilePath, 'utf8');
    return JSON.parse(fileData);
  }
  return [];
};

// Helper function to write stores to the JSON file
const writeStoresToFile = (stores: any[]) => {
  fs.writeFileSync(storesFilePath, JSON.stringify(stores, null, 2), 'utf8');
};

// Normalize incoming store data to match the structure of manually added stores
const normalizeStoreData = (store: any) => {
  return {
    id: store.id || `store-${Date.now()}`, // Generate a unique ID if it doesn't exist
    name: store.storeName || store.name, // Normalize store name
    location: store.address || store.location, // Normalize location
    type: store.type || 'Store', // Default to 'Store' if type is missing
    pathao_key: store.pathaoKey || store.pathao_key, // Normalize pathao key
    revenue: store.revenue || 0, // Default revenue if not provided
    revenueChange: store.revenueChange || 0, // Default revenue change if not provided
    products: store.products || 0, // Default products if not provided
    orders: store.orders || 0, // Default orders if not provided
  };
};

// Handle GET request to retrieve stores
export async function GET() {
  try {
    const stores = readStoresFromFile();
    return NextResponse.json(stores); // Send the stores as JSON response
  } catch (error) {
    console.error('Error reading stores from file:', error);
    return NextResponse.json({ error: 'Failed to load stores' }, { status: 500 });
  }
}

// Handle POST request to add new store
export async function POST(request: Request) {
  try {
    const newStore = await request.json(); // Parse the incoming store data from the body
    const stores = readStoresFromFile();    // Fetch the current list of stores from the JSON file
    const normalizedStore = normalizeStoreData(newStore); // Normalize the store data structure
    stores.push(normalizedStore);           // Add the normalized store to the list
    writeStoresToFile(stores);              // Save the updated stores array back to the JSON file
    return NextResponse.json(normalizedStore, { status: 201 }); // Return the added store as the response
  } catch (error) {
    console.error('Error adding store:', error);
    return NextResponse.json({ error: 'Failed to add store' }, { status: 500 });
  }
}
