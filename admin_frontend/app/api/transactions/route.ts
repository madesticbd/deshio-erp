import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'transactions.json');

export async function GET() {
  try {
    const data = fs.readFileSync(dataFilePath, 'utf8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    return NextResponse.json({ expenses: [], categories: [] });
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