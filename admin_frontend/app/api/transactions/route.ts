import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'transactions.json');

export async function GET() {
  try {
    if (!fs.existsSync(dataFilePath)) {
      return NextResponse.json({ expenses: [], income: [], categories: [] });
    }

    const rawData = fs.readFileSync(dataFilePath, 'utf8');
    const parsedData = JSON.parse(rawData);

    // Make sure default empty arrays exist
    return NextResponse.json({
      expenses: parsedData.expenses || [],
      income: parsedData.income || [],
      categories: parsedData.categories || [],
    });
  } catch (error) {
    console.error('Error reading transactions file:', error);
    return NextResponse.json({ expenses: [], income: [], categories: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const newData = await request.json();
    fs.writeFileSync(dataFilePath, JSON.stringify(newData, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to save data' }, { status: 500 });
  }
}