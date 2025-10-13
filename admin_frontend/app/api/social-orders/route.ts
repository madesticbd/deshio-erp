import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// ✅ Path to the JSON file
const ordersFilePath = path.resolve('data', 'orders.json');

//  Helper: Read all orders
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

// Helper: Write updated orders list
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

//  GET — Fetch all orders
export async function GET() {
  try {
    const orders = readOrdersFromFile();
    return NextResponse.json(orders);
  } catch (error) {
    console.error('❌ Failed to fetch orders:', error);
    return NextResponse.json({ error: 'Failed to load orders' }, { status: 500 });
  }
}

//  POST — Save a new order
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

//  DELETE — Remove an order by ID
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing order ID' }, { status: 400 });
    }

    const orders = readOrdersFromFile();
    const updatedOrders = orders.filter((order: any) => String(order.id) !== String(id));

    if (orders.length === updatedOrders.length) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    writeOrdersToFile(updatedOrders);

    return NextResponse.json({ success: true, message: 'Order cancelled successfully!' });
  } catch (error) {
    console.error('❌ Failed to delete order:', error);
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}


//  PUT — Update an existing order
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    console.log('PUT request received for order ID:', id); // Debug log

    if (!id) {
      return NextResponse.json({ error: 'Missing order ID' }, { status: 400 });
    }

    const updatedOrderData = await request.json();
    console.log('Updated order data:', updatedOrderData); // Debug log
    
    const orders = readOrdersFromFile();
    console.log('Current orders count:', orders.length); // Debug log
    
    const orderIndex = orders.findIndex((order: any) => String(order.id) === String(id));
    
    if (orderIndex === -1) {
      console.log('Order not found with ID:', id); // Debug log
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Update the order
    orders[orderIndex] = {
      ...orders[orderIndex],
      ...updatedOrderData,
      id: orders[orderIndex].id, // Keep original ID
      createdAt: orders[orderIndex].createdAt, // Keep original creation time
      updatedAt: new Date().toISOString(),
    };

    console.log('Updated order:', orders[orderIndex]); // Debug log

    writeOrdersToFile(orders);
    console.log('Order saved to file'); // Debug log

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully!',
      order: orders[orderIndex],
    });
  } catch (error) {
    console.error('❌ Failed to update order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
