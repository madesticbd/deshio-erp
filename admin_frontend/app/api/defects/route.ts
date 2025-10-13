import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const defectsFilePath = path.resolve('data', 'defects.json');
const inventoryFilePath = path.resolve('data', 'inventory.json');

// Helper functions for file operations
const readDefectsFromFile = () => {
  try {
    if (fs.existsSync(defectsFilePath)) {
      const fileData = fs.readFileSync(defectsFilePath, 'utf8');
      return JSON.parse(fileData);
    }
    return [];
  } catch (error) {
    console.error('Error reading defects file:', error);
    return [];
  }
};

const writeDefectsToFile = (defects: any[]) => {
  try {
    const dataDir = path.dirname(defectsFilePath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(defectsFilePath, JSON.stringify(defects, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing defects file:', error);
    throw error;
  }
};

const readInventoryFromFile = () => {
  try {
    if (fs.existsSync(inventoryFilePath)) {
      const fileData = fs.readFileSync(inventoryFilePath, 'utf8');
      return JSON.parse(fileData);
    }
    return [];
  } catch (error) {
    console.error('Error reading inventory file:', error);
    return [];
  }
};

const writeInventoryToFile = (inventory: any[]) => {
  try {
    const dataDir = path.dirname(inventoryFilePath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(inventoryFilePath, JSON.stringify(inventory, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing inventory file:', error);
    throw error;
  }
};

// GET: Fetch all defects
export async function GET() {
  try {
    const defects = readDefectsFromFile();
    return NextResponse.json(defects);
  } catch (error) {
    console.error('Error fetching defects:', error);
    return NextResponse.json({ error: 'Failed to load defects' }, { status: 500 });
  }
}


// POST: Add new defect and update inventory status

export async function POST(request: Request) {
  try {
    const newDefect = await request.json();
    
    // Read current data
    const defects = readDefectsFromFile();
    const inventory = readInventoryFromFile();

    console.log('Adding defect for barcode:', newDefect.barcode);
    console.log('Defect data received:', newDefect);

    // Find and update inventory item
    const inventoryIndex = inventory.findIndex((item: any) => item.barcode === newDefect.barcode);
    
    if (inventoryIndex === -1) {
      console.error('Barcode not found in inventory:', newDefect.barcode);
      return NextResponse.json({ error: 'Barcode not found in inventory' }, { status: 404 });
    }

    console.log('Found inventory item at index:', inventoryIndex);

    // Mark inventory as defective
    inventory[inventoryIndex] = {
      ...inventory[inventoryIndex],
      status: 'defective',
      updatedAt: new Date().toISOString()
    };

    // Add to defects - PRESERVE ALL FIELDS from frontend
    const defectWithMeta = {
      ...newDefect, // Keep all fields from frontend
      // Only add these if they're not already provided
      id: newDefect.id || `defect-${Date.now()}`,
      addedAt: newDefect.addedAt || new Date().toISOString(),
    };
    
    defects.push(defectWithMeta);

    // Write updated data
    writeDefectsToFile(defects);
    writeInventoryToFile(inventory);

    console.log('Defect added successfully with all fields:', defectWithMeta);

    return NextResponse.json(defectWithMeta, { status: 201 });
  } catch (error) {
    console.error('Error adding defect:', error);
    return NextResponse.json({ error: 'Failed to add defect' }, { status: 500 });
  }
}

// PATCH: Update defect (e.g., mark as sold)
export async function PATCH(request: Request) {
  try {
    // Extract ID from URL instead of query params
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop(); // Get last part of URL
    
    const updates = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Defect ID is required' }, { status: 400 });
    }

    const defects = readDefectsFromFile();
    const defectIndex = defects.findIndex((d: any) => d.id === id);

    if (defectIndex === -1) {
      return NextResponse.json({ error: 'Defect not found' }, { status: 404 });
    }

    // Update defect
    defects[defectIndex] = {
      ...defects[defectIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    writeDefectsToFile(defects);

    return NextResponse.json(defects[defectIndex]);
  } catch (error) {
    console.error('Error updating defect:', error);
    return NextResponse.json({ error: 'Failed to update defect' }, { status: 500 });
  }
}

// DELETE: Remove defect
export async function DELETE(request: Request) {
  try {
    // Extract ID from URL instead of query params
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop(); // Get last part of URL

    if (!id) {
      return NextResponse.json({ error: 'Defect ID is required' }, { status: 400 });
    }

    const defects = readDefectsFromFile();
    const updatedDefects = defects.filter((d: any) => d.id !== id);

    if (defects.length === updatedDefects.length) {
      return NextResponse.json({ error: 'Defect not found' }, { status: 404 });
    }

    writeDefectsToFile(updatedDefects);

    return NextResponse.json({ success: true, message: 'Defect removed successfully' });
  } catch (error) {
    console.error('Error deleting defect:', error);
    return NextResponse.json({ error: 'Failed to delete defect' }, { status: 500 });
  }
}