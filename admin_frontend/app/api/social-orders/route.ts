import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { triggerAccountingUpdate } from '@/lib/accounting-helper';

// ✅ Path to the JSON files
const ordersFilePath = path.resolve('data', 'orders.json');
const inventoryFilePath = path.resolve('data', 'inventory.json');
const defectsFilePath = path.resolve('data', 'defects.json');
const transactionsFilePath = path.resolve('data', 'transactions.json');

// Helper: Read transactions
const readTransactionsFromFile = () => {
  try {
    if (fs.existsSync(transactionsFilePath)) {
      const fileData = fs.readFileSync(transactionsFilePath, 'utf8');
      return JSON.parse(fileData);
    } else {
      return { categories: [], expenses: [] };
    }
  } catch (error) {
    console.error('❌ Error reading transactions file:', error);
    return { categories: [], expenses: [] };
  }
};

// Helper: Write transactions
const writeTransactionsToFile = (data: any) => {
  try {
    fs.mkdirSync(path.dirname(transactionsFilePath), { recursive: true });
    fs.writeFileSync(transactionsFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('❌ Error writing transactions file:', error);
    throw error;
  }
};

// Helper: Add transaction entry
const addTransactionEntry = (orderData: any) => {
  try {
    const transactions = readTransactionsFromFile();
    
    // Get product names for the transaction
    const productNames = orderData.products?.map((p: any) => p.productName || p.name).join(', ') || 'Products';
    const productCount = orderData.products?.length || 0;
    
    const transactionName = productCount === 1 
      ? `Order: ${productNames}` 
      : `Order: ${productNames.split(',')[0].trim()} +${productCount - 1} more`;
    
    // Calculate total amount from products
    let totalAmount = 0;
    if (orderData.products && Array.isArray(orderData.products)) {
      totalAmount = orderData.products.reduce((sum: number, product: any) => {
        const price = parseFloat(product.price || product.unitPrice || 0);
        const qty = parseInt(product.qty || product.quantity || 1);
        return sum + (price * qty);
      }, 0);
    }
    
    // Fallback to order-level totals if calculation fails
    if (totalAmount === 0) {
      totalAmount = parseFloat(orderData.totalCost || orderData.totalAmount || orderData.total || 0);
    }
    
    console.log(`💰 Order total calculated: ${totalAmount}`);
    
    // ✅ Set as income from social orders
    const transactionEntry = {
      id: `order-${orderData.id}`,
      name: transactionName,
      description: `Order from ${orderData.customerName || 'Social Customer'}`,
      type: 'variable',
      amount: totalAmount,       // positive for income
      category: 'Social Orders', // changed from "Inventory Purchase"
      date: new Date().toISOString(),
      comment: `Products: ${productNames}`,
      receiptImage: '',
      createdAt: new Date().toISOString(),
    };
    
    // Push to income array instead of expenses
    transactions.income = transactions.income || [];
    transactions.income.push(transactionEntry);
    
    writeTransactionsToFile(transactions);
    
    console.log(`✅ Transaction entry created for order ${orderData.id} with amount ${totalAmount} as income`);
  } catch (error) {
    console.error('❌ Error adding transaction entry:', error);
  }
};

// Helper: Remove transaction entry
const removeTransactionEntry = (orderId: string) => {
  try {
    const transactions = readTransactionsFromFile();
    const transactionId = `order-${orderId}`;
    
    transactions.expenses = transactions.expenses.filter((exp: any) => exp.id !== transactionId);
    writeTransactionsToFile(transactions);
    
    console.log(`✅ Transaction entry removed for order ${orderId}`);
  } catch (error) {
    console.error('❌ Error removing transaction entry:', error);
  }
};

// Helper: Read all orders
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

// Helper: Read inventory
const readInventoryFromFile = () => {
  try {
    if (fs.existsSync(inventoryFilePath)) {
      const fileData = fs.readFileSync(inventoryFilePath, 'utf8');
      return JSON.parse(fileData);
    } else {
      return [];
    }
  } catch (error) {
    console.error('❌ Error reading inventory file:', error);
    return [];
  }
};

// Helper: Read defects
const readDefectsFromFile = () => {
  try {
    if (fs.existsSync(defectsFilePath)) {
      const fileData = fs.readFileSync(defectsFilePath, 'utf8');
      return JSON.parse(fileData);
    } else {
      return [];
    }
  } catch (error) {
    console.error('❌ Error reading defects file:', error);
    return [];
  }
};

// Helper: Write updated orders list
const writeOrdersToFile = (orders: any[]) => {
  try {
    fs.mkdirSync(path.dirname(ordersFilePath), { recursive: true });
    fs.writeFileSync(ordersFilePath, JSON.stringify(orders, null, 2), 'utf8');
  } catch (error) {
    console.error('❌ Error writing orders file:', error);
    throw error;
  }
};

// Helper: Write updated inventory
const writeInventoryToFile = (inventory: any[]) => {
  try {
    fs.mkdirSync(path.dirname(inventoryFilePath), { recursive: true });
    fs.writeFileSync(inventoryFilePath, JSON.stringify(inventory, null, 2), 'utf8');
  } catch (error) {
    console.error('❌ Error writing inventory file:', error);
    throw error;
  }
};

// Helper: Write updated defects
const writeDefectsToFile = (defects: any[]) => {
  try {
    fs.mkdirSync(path.dirname(defectsFilePath), { recursive: true });
    fs.writeFileSync(defectsFilePath, JSON.stringify(defects, null, 2), 'utf8');
  } catch (error) {
    console.error('❌ Error writing defects file:', error);
    throw error;
  }
};

// Helper: Update defect status
const updateDefectStatus = (defectId: string, sellingPrice: number) => {
  try {
    const defects = readDefectsFromFile();
    const defectIndex = defects.findIndex((d: any) => d.id === defectId);
    
    if (defectIndex !== -1) {
      defects[defectIndex] = {
        ...defects[defectIndex],
        status: 'sold',
        sellingPrice: sellingPrice,
        soldAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      writeDefectsToFile(defects);
      console.log(`✅ Updated defect ${defectId} to sold with price ${sellingPrice}`);
    }
  } catch (error) {
    console.error('❌ Error updating defect status:', error);
  }
};

// Helper: Allocate inventory items and return barcodes
const allocateInventoryToOrder = (productId: string | number, quantity: number, orderId: number) => {
  const inventory = readInventoryFromFile();
  
  // Find available inventory items for this product
  const availableItems = inventory.filter((item: any) => {
    const itemProductId = String(item.productId);
    const searchProductId = String(productId);
    return itemProductId === searchProductId && item.status === 'available';
  });

  if (availableItems.length < quantity) {
    throw new Error(
      `Not enough inventory for product ${productId}. Required: ${quantity}, Available: ${availableItems.length}`
    );
  }

  // Take required quantity and update their status
  const allocatedItems = availableItems.slice(0, quantity);
  const barcodes: string[] = [];

  allocatedItems.forEach((item: any) => {
    const itemIndex = inventory.findIndex((i: any) => i.id === item.id);
    if (itemIndex !== -1) {
      inventory[itemIndex] = {
        ...inventory[itemIndex],
        status: 'sold',
        orderId: orderId,
        soldAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      barcodes.push(inventory[itemIndex].barcode);
    }
  });

  // Write updated inventory
  writeInventoryToFile(inventory);

  return barcodes;
};

// GET — Fetch all orders
export async function GET() {
  try {
    const orders = readOrdersFromFile();
    return NextResponse.json(orders);
  } catch (error) {
    console.error('❌ Failed to fetch orders:', error);
    return NextResponse.json({ error: 'Failed to load orders' }, { status: 500 });
  }
}

// POST — Save a new order with barcode allocation and transaction entry
export async function POST(request: Request) {
  try {
    const newOrder = await request.json();
    const existingOrders = readOrdersFromFile();

    // Generate order ID
    const orderId = Date.now();

    // Process each product and allocate barcodes
    const productsWithBarcodes = [];
    
    for (const product of newOrder.products) {
      try {
        const productId = product.productId || product.id;
        
        // Skip inventory allocation for defective products
        if (product.isDefective) {
          console.log(`🟧 Processing defective product: ${product.defectId}`);
          
          // Update defect status with selling price
          if (product.defectId) {
            updateDefectStatus(product.defectId, product.price);
          }
          
          // Add to products list without barcode allocation
          productsWithBarcodes.push({
            ...product,
            productId: productId,
            barcodes: product.barcode ? [product.barcode] : []
          });
          
          console.log(`✅ Defective product ${product.defectId} processed`);
          continue;
        }
        
        // Allocate inventory and get barcodes for regular products
        const barcodes = allocateInventoryToOrder(productId, product.qty, orderId);
        
        productsWithBarcodes.push({
          ...product,
          productId: productId,
          barcodes: barcodes
        });
        
        console.log(`✅ Allocated ${barcodes.length} items for ${product.productName}`);
      } catch (error: any) {
        console.error(`❌ Error allocating products for ${product.productName}:`, error.message);
        return NextResponse.json({ 
          error: `Failed to allocate inventory: ${error.message}` 
        }, { status: 400 });
      }
    }

    // Create order with metadata and barcodes
    const orderWithMeta = {
      id: orderId,
      ...newOrder,
      products: productsWithBarcodes,
      createdAt: new Date().toISOString(),
    };

    existingOrders.push(orderWithMeta);
    writeOrdersToFile(existingOrders);

    // ✅ ADD TRANSACTION ENTRY
    addTransactionEntry(orderWithMeta);
    triggerAccountingUpdate();

    console.log(`✅ Order ${orderId} created with ${productsWithBarcodes.length} products`);

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

// DELETE — Remove an order by ID
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing order ID' }, { status: 400 });
    }

    const orders = readOrdersFromFile();
    const orderToDelete = orders.find((order: any) => String(order.id) === String(id));
    
    if (!orderToDelete) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Return inventory items to available status and revert defect status
    const inventory = readInventoryFromFile();
    const defects = readDefectsFromFile();
    let updatedInventory = false;
    let updatedDefects = false;

    if (orderToDelete.products) {
      orderToDelete.products.forEach((product: any) => {
        // Handle defective products
        if (product.isDefective && product.defectId) {
          const defectIndex = defects.findIndex((d: any) => d.id === product.defectId);
          if (defectIndex !== -1) {
            defects[defectIndex] = {
              ...defects[defectIndex],
              status: 'pending',
              sellingPrice: null,
              soldAt: null,
              updatedAt: new Date().toISOString()
            };
            updatedDefects = true;
            console.log(`✅ Reverted defect ${product.defectId} to pending`);
          }
        }
      });
    }

    // Handle regular inventory items
    inventory.forEach((item: any, index: number) => {
      if (item.orderId && String(item.orderId) === String(id)) {
        inventory[index] = {
          ...item,
          status: 'available',
          orderId: undefined,
          soldAt: undefined,
          updatedAt: new Date().toISOString()
        };
        updatedInventory = true;
      }
    });

    if (updatedInventory) {
      writeInventoryToFile(inventory);
    }

    if (updatedDefects) {
      writeDefectsToFile(defects);
    }

    // Remove order
    const updatedOrders = orders.filter((order: any) => String(order.id) !== String(id));
    writeOrdersToFile(updatedOrders);

    // ✅ REMOVE TRANSACTION ENTRY
    removeTransactionEntry(id);
    triggerAccountingUpdate();

    return NextResponse.json({ 
      success: true, 
      message: 'Order cancelled successfully and inventory restored!' 
    });
  } catch (error) {
    console.error('❌ Failed to delete order:', error);
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}

// PUT — Update an existing order
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    console.log('PUT request received for order ID:', id);

    if (!id) {
      return NextResponse.json({ error: 'Missing order ID' }, { status: 400 });
    }

    const updatedOrderData = await request.json();
    console.log('Updated order data:', updatedOrderData);
    
    const orders = readOrdersFromFile();
    console.log('Current orders count:', orders.length);
    
    const orderIndex = orders.findIndex((order: any) => String(order.id) === String(id));
    
    if (orderIndex === -1) {
      console.log('Order not found with ID:', id);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const existingOrder = orders[orderIndex];

    // Merge products while preserving barcodes
    let mergedProducts = updatedOrderData.products;
    
    if (existingOrder.products && updatedOrderData.products) {
      mergedProducts = updatedOrderData.products.map((newProduct: any) => {
        // Find the corresponding existing product by id or productId
        const existingProduct = existingOrder.products.find(
          (p: any) => 
            String(p.id) === String(newProduct.id) || 
            String(p.productId) === String(newProduct.productId)
        );
        
        // If barcodes exist in the existing product but not in the new one, preserve them
        if (existingProduct?.barcodes && !newProduct.barcodes) {
          return {
            ...newProduct,
            barcodes: existingProduct.barcodes
          };
        }
        
        return newProduct;
      });
    }

    // Update the order with preserved barcodes
    orders[orderIndex] = {
      ...existingOrder,
      ...updatedOrderData,
      products: mergedProducts,
      id: existingOrder.id,
      createdAt: existingOrder.createdAt,
      updatedAt: new Date().toISOString(),
    };

    console.log('Updated order with preserved barcodes:', orders[orderIndex]);

    writeOrdersToFile(orders);
    
    // ✅ UPDATE TRANSACTION ENTRY
    removeTransactionEntry(id);
    addTransactionEntry(orders[orderIndex]);
    
    console.log('Order saved to file');

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