import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const defectsFilePath = path.join(process.cwd(), 'data', 'defects.json');
const inventoryFilePath = path.join(process.cwd(), 'data', 'inventory.json');
const ordersFilePath = path.join(process.cwd(), 'data', 'orders.json');

function ensureDataFile(filePath: string, defaultData: any = []) {
  const dataDir = path.dirname(filePath);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
}

function readFromFile(filePath: string) {
  ensureDataFile(filePath);
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}

function writeToFile(filePath: string, data: any) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// GET - Fetch all defects or single defect by ID
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const store = searchParams.get('store');
    
    const defects = readFromFile(defectsFilePath);
    
    // Filter by single ID
    if (id) {
      const defect = defects.find((d: any) => d.id === id);
      if (!defect) {
        return NextResponse.json({ error: 'Defect not found' }, { status: 404 });
      }
      return NextResponse.json(defect);
    }
    
    // Filter by store
    if (store && store !== 'all') {
      const filteredDefects = defects.filter((d: any) => d.store === store);
      return NextResponse.json(filteredDefects);
    }
    
    return NextResponse.json(defects);
  } catch (error) {
    console.error('Error reading defects:', error);
    return NextResponse.json({ error: 'Failed to load defects' }, { status: 500 });
  }
}

// POST - Add new defect (from barcode scan or customer return)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { barcode, reason, store, orderId, customerPhone } = body;
    
    if (!barcode || !reason) {
      return NextResponse.json({ error: 'Barcode and reason are required' }, { status: 400 });
    }
    
    // Find the inventory item by barcode
    const inventory = readFromFile(inventoryFilePath);
    const inventoryItem = inventory.find((item: any) => item.barcode === barcode);
    
    if (!inventoryItem) {
      return NextResponse.json({ error: 'Item not found in inventory' }, { status: 404 });
    }
    
    // Check inventory status
    if (inventoryItem.status === 'available' && !store) {
      return NextResponse.json({ 
        error: 'This item is in stock. Please select the store location where you are returning it.',
        needsStore: true 
      }, { status: 400 });
    }
    
    if (inventoryItem.status === 'sold' && !store) {
      return NextResponse.json({ 
        error: 'This item was sold. Please select the store where you are receiving the return.',
        needsStore: true 
      }, { status: 400 });
    }
    
    // For customer returns, we need order and customer info
    if (reason === 'customer_return' && inventoryItem.status === 'sold') {
      if (!orderId || !customerPhone) {
        return NextResponse.json({ 
          error: 'Order ID and customer phone are required for customer returns' 
        }, { status: 400 });
      }
    }
    
    // Update inventory status to defective
    const invIndex = inventory.findIndex((item: any) => item.barcode === barcode);
    inventory[invIndex] = {
      ...inventory[invIndex],
      status: 'defective',
      updatedAt: new Date().toISOString()
    };
    writeToFile(inventoryFilePath, inventory);
    
    // Create defect entry
    const defects = readFromFile(defectsFilePath);
    const newDefect = {
      id: `defect-${Date.now()}`,
      barcode: inventoryItem.barcode,
      productId: inventoryItem.productId,
      productName: inventoryItem.productName || `Product ${inventoryItem.productId}`,
      reason,
      status: 'pending',
      store: store || null,
      addedBy: 'Admin',
      addedAt: new Date().toISOString(),
      originalOrderId: orderId || inventoryItem.orderId || null,
      customerPhone: customerPhone || null,
      costPrice: inventoryItem.costPrice,
      originalSellingPrice: inventoryItem.sellingPrice,
      sellingPrice: null,
      returnReason: body.returnReason || null
    };
    
    defects.push(newDefect);
    writeToFile(defectsFilePath, defects);
    
    return NextResponse.json({
      success: true,
      message: 'Item marked as defective successfully',
      defect: newDefect
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error adding defect:', error);
    return NextResponse.json({ error: 'Failed to add defect' }, { status: 500 });
  }
}

// PATCH - Update defect (approve, sell, etc.)
export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const body = await req.json();
    
    if (!id) {
      return NextResponse.json({ error: 'Defect ID is required' }, { status: 400 });
    }
    
    const defects = readFromFile(defectsFilePath);
    const defectIndex = defects.findIndex((d: any) => d.id === id);
    
    if (defectIndex === -1) {
      return NextResponse.json({ error: 'Defect not found' }, { status: 404 });
    }
    
    // Update defect
    defects[defectIndex] = {
      ...defects[defectIndex],
      ...body,
      updatedAt: new Date().toISOString()
    };
    
    writeToFile(defectsFilePath, defects);
    
    return NextResponse.json({
      success: true,
      message: 'Defect updated successfully',
      defect: defects[defectIndex]
    });
    
  } catch (error) {
    console.error('Error updating defect:', error);
    return NextResponse.json({ error: 'Failed to update defect' }, { status: 500 });
  }
}

// DELETE - Remove defect
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Defect ID is required' }, { status: 400 });
    }
    
    const defects = readFromFile(defectsFilePath);
    const defect = defects.find((d: any) => d.id === id);
    
    if (!defect) {
      return NextResponse.json({ error: 'Defect not found' }, { status: 404 });
    }
    
    // Return inventory status to available
    const inventory = readFromFile(inventoryFilePath);
    const invIndex = inventory.findIndex((item: any) => item.barcode === defect.barcode);
    
    if (invIndex !== -1) {
      inventory[invIndex] = {
        ...inventory[invIndex],
        status: 'available',
        updatedAt: new Date().toISOString()
      };
      writeToFile(inventoryFilePath, inventory);
    }
    
    // Remove defect
    const updatedDefects = defects.filter((d: any) => d.id !== id);
    writeToFile(defectsFilePath, updatedDefects);
    
    return NextResponse.json({
      success: true,
      message: 'Defect removed and inventory restored'
    });
    
  } catch (error) {
    console.error('Error deleting defect:', error);
    return NextResponse.json({ error: 'Failed to delete defect' }, { status: 500 });
  }
}