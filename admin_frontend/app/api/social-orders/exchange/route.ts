// app/api/social-orders/exchange/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ordersFilePath = path.resolve('data', 'orders.json');

const readOrdersFromFile = () => {
  try {
    if (fs.existsSync(ordersFilePath)) {
      const fileData = fs.readFileSync(ordersFilePath, 'utf8');
      return JSON.parse(fileData);
    }
    return [];
  } catch (error) {
    console.error('❌ Error reading orders file:', error);
    return [];
  }
};

const writeOrdersToFile = (orders: any[]) => {
  try {
    fs.mkdirSync(path.dirname(ordersFilePath), { recursive: true });
    fs.writeFileSync(ordersFilePath, JSON.stringify(orders, null, 2), 'utf8');
  } catch (error) {
    console.error('❌ Error writing orders file:', error);
    throw error;
  }
};

export async function POST(request: Request) {
  try {
    const exchangeData = await request.json();
    const { orderId, removedProducts, replacementProducts } = exchangeData;

    if (!orderId) {
      return NextResponse.json({ error: 'Missing order ID' }, { status: 400 });
    }

    const orders = readOrdersFromFile();
    const orderIndex = orders.findIndex((order: any) => String(order.id) === String(orderId));
    
    if (orderIndex === -1) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = orders[orderIndex];
    let updatedProducts = [...order.products];

    // Step 1: Remove or update quantities for exchanged products
    removedProducts.forEach((removed: any) => {
      const index = updatedProducts.findIndex((p: any) => p.id === removed.productId);
      if (index !== -1) {
        if (removed.quantity >= updatedProducts[index].qty) {
          // Remove product completely
          updatedProducts.splice(index, 1);
        } else {
          // Reduce quantity
          updatedProducts[index].qty -= removed.quantity;
          updatedProducts[index].amount = (updatedProducts[index].price * updatedProducts[index].qty) - (updatedProducts[index].discount || 0);
        }
      }
    });

    // Step 2: Add or merge replacement products
    replacementProducts.forEach((replacement: any) => {
      // Check if this product already exists in the order by product name
      const existingIndex = updatedProducts.findIndex(
        (p: any) => p.productName.toLowerCase() === replacement.name.toLowerCase()
      );

      if (existingIndex !== -1) {
        // Product exists - increment quantity
        updatedProducts[existingIndex].qty += replacement.quantity;
        updatedProducts[existingIndex].amount = 
          (updatedProducts[existingIndex].price * updatedProducts[existingIndex].qty) - 
          (updatedProducts[existingIndex].discount || 0);
      } else {
        // New product - add to order
        updatedProducts.push({
          id: Date.now() + Math.random(),
          productName: replacement.name,
          size: replacement.size || '1',
          qty: replacement.quantity,
          price: replacement.price,
          discount: 0,
          amount: replacement.price * replacement.quantity
        });
      }
    });

    // Step 3: Recalculate ALL order totals from scratch
    const newSubtotal = updatedProducts.reduce((sum: number, p: any) => sum + p.amount, 0);
    const totalDiscount = updatedProducts.reduce((sum: number, p: any) => sum + (p.discount || 0), 0);
    
    // Calculate VAT based on the original VAT rate
    const vatRate = order.amounts.vatRate || 0;
    const newVat = Math.round(newSubtotal * (vatRate / 100));
    
    // Calculate new total
    const transportCost = order.amounts.transportCost || 0;
    const newTotal = newSubtotal + newVat + transportCost;
    
    // Calculate what's still due (total - what's already been paid)
    const totalPaid = order.payments.totalPaid || 0;
    const newDue = newTotal - totalPaid;

    // Calculate the difference from the original order total
    const originalTotal = order.amounts.total || 0;
    const difference = newTotal - originalTotal;

    // Step 4: Update order with new values
    orders[orderIndex] = {
      ...order,
      products: updatedProducts,
      subtotal: newSubtotal,
      amounts: {
        ...order.amounts,
        subtotal: newSubtotal,
        totalDiscount: totalDiscount,
        vat: newVat,
        transportCost: transportCost,
        total: newTotal
      },
      payments: {
        ...order.payments,
        due: newDue
      },
      exchangeHistory: [
        ...(order.exchangeHistory || []),
        {
          date: new Date().toISOString(),
          removedProducts,
          replacementProducts,
          originalTotal,
          newTotal,
          difference,
          note: difference > 0 ? 'Customer owes additional payment' : difference < 0 ? 'Refund to customer' : 'No payment difference'
        }
      ],
      updatedAt: new Date().toISOString()
    };

    writeOrdersToFile(orders);

    return NextResponse.json({
      success: true,
      message: 'Exchange processed successfully!',
      order: orders[orderIndex],
      difference: difference,
      totalDue: newDue
    });
  } catch (error) {
    console.error('❌ Failed to process exchange:', error);
    return NextResponse.json({ error: 'Failed to process exchange' }, { status: 500 });
  }
}