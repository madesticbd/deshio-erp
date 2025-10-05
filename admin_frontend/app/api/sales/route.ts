import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// File path for the sales.json file
const salesFilePath = path.resolve('data', 'sales.json');

// Helper function to read sales from the JSON file
const readSalesFromFile = () => {
  if (fs.existsSync(salesFilePath)) {
    const fileData = fs.readFileSync(salesFilePath, 'utf8');
    return JSON.parse(fileData);
  }
  return [];
};

// Helper function to write sales to the JSON file
const writeSalesToFile = (sales: any[]) => {
  // Ensure data directory exists
  const dataDir = path.resolve('data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(salesFilePath, JSON.stringify(sales, null, 2), 'utf8');
};

// Handle GET request to retrieve all sales
export async function GET() {
  try {
    const sales = readSalesFromFile();
    return NextResponse.json(sales);
  } catch (error) {
    console.error('Error reading sales from file:', error);
    return NextResponse.json({ error: 'Failed to load sales' }, { status: 500 });
  }
}

// Handle POST request to add new sale
export async function POST(request: Request) {
  try {
    const newSale = await request.json();
    const sales = readSalesFromFile();
    
    // Add timestamp and ID
    const saleWithMetadata = {
      id: `sale-${Date.now()},
      ...newSale,
      createdAt: new Date().toISOString(),`};
    
    sales.push(saleWithMetadata);
    writeSalesToFile(sales);
    
    return NextResponse.json(saleWithMetadata, { status: 201 });
  } catch (error) {
    console.error('Error adding sale:', error);
    return NextResponse.json({ error: 'Failed to add sale' }, { status: 500 });
  }
}

// Handle DELETE request to remove a sale
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    let sales = readSalesFromFile();
    sales = sales.filter((s: any) => s.id !== id);
    writeSalesToFile(sales);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete sale' }, { status: 500 });
  }
}