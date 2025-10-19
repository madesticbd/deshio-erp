import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'transactions.json');

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();
    const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    
    const newCategory = {
      id: Date.now().toString(),
      name,
      createdAt: new Date().toISOString()
    };
    
    data.categories.push(newCategory);
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
    
    return NextResponse.json(newCategory);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}