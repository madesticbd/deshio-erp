import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// ✅ File paths
const salesFilePath = path.resolve('data', 'sales.json');
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
    console.error('Error reading transactions file:', error);
    return { categories: [], expenses: [] };
  }
};

// Helper: Write transactions
const writeTransactionsToFile = (data: any) => {
  try {
    const dataDir = path.resolve('data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(transactionsFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing transactions file:', error);
    throw error;
  }
};

// Helper: Add transaction entry for sale (as income)
const addSaleTransactionEntry = (saleData: any) => {
  try {
    const transactions = readTransactionsFromFile();
    
    console.log('🔍 Sale data received:', JSON.stringify(saleData, null, 2));
    
    // Get item names for the transaction
    const itemNames = saleData.items?.map((item: any) => item.productName || item.name).join(', ') || 'Items';
    const itemCount = saleData.items?.length || 0;
    
    const transactionName = itemCount === 1 
      ? `Sale: ${itemNames}` 
      : `Sale: ${itemNames.split(',')[0].trim()} +${itemCount - 1} more`;
    
    // Calculate total amount from items - try multiple field names
    let totalAmount = 0;
    if (saleData.items && Array.isArray(saleData.items)) {
      saleData.items.forEach((item: any) => {
        console.log('🔍 Processing item:', JSON.stringify(item, null, 2));
        
        // Try different price field names
        const price = parseFloat(
          item.price || 
          item.sellingPrice || 
          item.unitPrice || 
          item.salePrice ||
          item.amount ||
          0
        );
        
        // Try different quantity field names
        const qty = parseInt(
          item.qty || 
          item.quantity || 
          item.count ||
          1
        );
        
        const itemTotal = price * qty;
        console.log(`💰 Item: ${item.productName || item.name}, Price: ${price}, Qty: ${qty}, Total: ${itemTotal}`);
        totalAmount += itemTotal;
      });
    }
    
    // Fallback to sale-level totals if calculation fails
    if (totalAmount === 0) {
      totalAmount = parseFloat(
        saleData.totalAmount || 
        saleData.total || 
        saleData.totalCost ||
        saleData.grandTotal ||
        saleData.amount ||
        0
      );
      console.log(`💰 Using sale-level total: ${totalAmount}`);
    }
    
    console.log(`💰 Final sale total calculated: ${totalAmount}`);
    
   
const transactionEntry = {
  id: saleData.id,
  name: transactionName,
  description: `Sold to ${saleData.customerName || 'Customer'}`,
  type: 'variable',
  amount: totalAmount, 
  category: 'Offline Sale', 
  date: new Date().toISOString(),
  comment: `Items: ${itemNames}`,
  receiptImage: '',
  createdAt: new Date().toISOString(),
};

// Ensure income array exists
transactions.income = transactions.income || [];
transactions.income.push(transactionEntry);
writeTransactionsToFile(transactions);

    
    console.log(`✅ Transaction entry created for sale ${saleData.id} with amount ${totalAmount}`);
  } catch (error) {
    console.error('Error adding sale transaction entry:', error);
  }
};

// Helper: Remove transaction entry
const removeSaleTransactionEntry = (saleId: string) => {
  try {
    const transactions = readTransactionsFromFile();
    
    transactions.expenses = transactions.expenses.filter((exp: any) => exp.id !== saleId);
    writeTransactionsToFile(transactions);
    
    console.log(`✅ Transaction entry removed for sale ${saleId}`);
  } catch (error) {
    console.error('Error removing sale transaction entry:', error);
  }
};

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

// Helper function to read defects
const readDefectsFromFile = () => {
  if (fs.existsSync(defectsFilePath)) {
    const fileData = fs.readFileSync(defectsFilePath, 'utf8');
    return JSON.parse(fileData);
  }
  return [];
};

// Helper function to write defects
const writeDefectsToFile = (defects: any[]) => {
  const dataDir = path.resolve('data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(defectsFilePath, JSON.stringify(defects, null, 2), 'utf8');
};

// Helper function to update defect status
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
    console.error('Error updating defect status:', error);
  }
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
      id: `sale-${Date.now()}`,
      ...newSale,
      createdAt: new Date().toISOString(),
    };
    
    // Update defect status for any defective items
    if (newSale.items && Array.isArray(newSale.items)) {
      newSale.items.forEach((item: any) => {
        if (item.isDefective && item.defectId) {
          console.log(`🔄 Processing defective item: ${item.defectId} with price ${item.price}`);
          updateDefectStatus(item.defectId, item.price);
        }
      });
    }
    
    sales.push(saleWithMetadata);
    writeSalesToFile(sales);
    
    // ✅ ADD TRANSACTION ENTRY
    addSaleTransactionEntry(saleWithMetadata);
    
    console.log(`✅ Sale created: ${saleWithMetadata.id}`);
    
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
    
    // Find the sale to check for defective items
    const saleToDelete = sales.find((s: any) => s.id === id);
    
    if (saleToDelete && saleToDelete.items) {
      // Revert defect status back to pending for any defective items
      saleToDelete.items.forEach((item: any) => {
        if (item.isDefective && item.defectId) {
          const defects = readDefectsFromFile();
          const defectIndex = defects.findIndex((d: any) => d.id === item.defectId);
          
          if (defectIndex !== -1) {
            defects[defectIndex] = {
              ...defects[defectIndex],
              status: 'pending',
              sellingPrice: null,
              soldAt: null,
              updatedAt: new Date().toISOString()
            };
            writeDefectsToFile(defects);
            console.log(`✅ Reverted defect ${item.defectId} to pending`);
          }
        }
      });
    }
    
    sales = sales.filter((s: any) => s.id !== id);
    writeSalesToFile(sales);
    
    // ✅ REMOVE TRANSACTION ENTRY
    removeSaleTransactionEntry(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete sale' }, { status: 500 });
  }
}