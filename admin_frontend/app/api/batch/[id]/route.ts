import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'batch.json');

function ensureDataFile() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, '[]', 'utf-8');
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    ensureDataFile();
    const data = fs.readFileSync(filePath, 'utf-8');
    let batches = JSON.parse(data);
    const id = parseInt(params.id);

    batches = batches.filter((b: any) => b.id !== id);
    fs.writeFileSync(filePath, JSON.stringify(batches, null, 2), 'utf-8');

    return NextResponse.json({ message: 'Batch deleted' });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete batch' }, { status: 500 });
  }
}
