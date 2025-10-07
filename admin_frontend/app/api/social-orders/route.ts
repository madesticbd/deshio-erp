import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// ✅ Path to the JSON file
const ordersFilePath = path.resolve('data', 'orders.json');

// ✅ Helper: Read all orders
const readOrdersFromFile = () => {
  try {
    if (fs.existsSync(ordersFilePath)) {
      const fileData = fs.readFileSync(ordersFilePath, 'utf8');
      return JSON.parse(fileData);
    } else {
      return [];
    }
  } catch (error) {
    console.error('❌ Error reading orders file:', error);
    return [];
  }
};

// ✅ Helper: Write updated orders list
const writeOrdersToFile = (orders: any[]) => {
  try {
    // Ensure the data directory exists
    fs.mkdirSync(path.dirname(ordersFilePath), { recursive: true });
    fs.writeFileSync(ordersFilePath, JSON.stringify(orders, null, 2), 'utf8');
  } catch (error) {
    console.error('❌ Error writing orders file:', error);
    throw error;
  }
};

// ✅ GET — Fetch all orders
export async function GET() {
  try {
    const orders = readOrdersFromFile();
    return NextResponse.json(orders);
  } catch (error) {
    console.error('❌ Failed to fetch orders:', error);
    return NextResponse.json({ error: 'Failed to load orders' }, { status: 500 });
  }
}

// ✅ POST — Save a new order
export async function POST(request: Request) {
  try {
    const newOrder = await request.json();

    const existingOrders = readOrdersFromFile();

    // Add metadata (ID + timestamp)
    const orderWithMeta = {
      id: Date.now(),
      ...newOrder,
      createdAt: new Date().toISOString(),
    };

    existingOrders.push(orderWithMeta);

    writeOrdersToFile(existingOrders);

    return NextResponse.json({
      success: true,
      message: 'Order saved successfully!',
      order: orderWithMeta,
    });
  } catch (error) {
    console.error('❌ Failed to save order:', error);
    return NextResponse.json({ error: 'Failed to save order' }, { status: 500 });
  }
}
