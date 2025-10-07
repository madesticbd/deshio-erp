import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ordersFilePath = path.resolve('data', 'social-orders.json');

const readOrdersFromFile = () => {
  if (fs.existsSync(ordersFilePath)) {
    const fileData = fs.readFileSync(ordersFilePath, 'utf8');
    return JSON.parse(fileData);
  }
  return [];
};

const writeOrdersToFile = (orders: any[]) => {
  const dataDir = path.resolve('data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(ordersFilePath, JSON.stringify(orders, null, 2), 'utf8');
};

export async function GET() {
  try {
    const orders = readOrdersFromFile();
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error reading orders from file:', error);
    return NextResponse.json({ error: 'Failed to load orders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const newOrder = await request.json();
    const orders = readOrdersFromFile();
    
    const orderWithMetadata = {
      id: `order-${Date.now()}`,
      ...newOrder,
      createdAt: new Date().toISOString(),
    };
    
    orders.push(orderWithMetadata);
    writeOrdersToFile(orders);
    
    return NextResponse.json(orderWithMetadata, { status: 201 });
  } catch (error) {
    console.error('Error adding order:', error);
    return NextResponse.json({ error: 'Failed to add order' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    let orders = readOrdersFromFile();
    orders = orders.filter((o: any) => o.id !== id);
    writeOrdersToFile(orders);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}