// app/api/employees/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const employeesFilePath = path.resolve('data', 'employees.json');

// Helper: Read employees
const readEmployeesFromFile = () => {
  if (fs.existsSync(employeesFilePath)) {
    const fileData = fs.readFileSync(employeesFilePath, 'utf8');
    return JSON.parse(fileData);
  }
  return [];
};

// Helper: Write employees
const writeEmployeesToFile = (employees: any[]) => {
  const dataDir = path.resolve('data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(employeesFilePath, JSON.stringify(employees, null, 2), 'utf8');
};

// GET - Retrieve all employees
export async function GET() {
  try {
    const employees = readEmployeesFromFile();
    return NextResponse.json(employees);
  } catch (error) {
    console.error('Error reading employees from file:', error);
    return NextResponse.json({ error: 'Failed to load employees' }, { status: 500 });
  }
}

// POST - Add new employee
export async function POST(request: Request) {
  try {
    const newEmployee = await request.json();
    const employees = readEmployeesFromFile();
    
    // Add timestamp and ID
    const employeeWithMetadata = {
      id: `emp-${Date.now()}`,
      ...newEmployee,
      joinDate: newEmployee.joinDate || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    console.log('✅ Creating employee:', employeeWithMetadata.id);
    
    employees.push(employeeWithMetadata);
    writeEmployeesToFile(employees);
    
    return NextResponse.json(employeeWithMetadata, { status: 201 });
  } catch (error) {
    console.error('❌ Error adding employee:', error);
    return NextResponse.json({ error: 'Failed to add employee' }, { status: 500 });
  }
}

// PUT - Update employee
export async function PUT(request: Request) {
  try {
    const updatedEmployee = await request.json();
    let employees = readEmployeesFromFile();
    
    const index = employees.findIndex((e: any) => e.id === updatedEmployee.id);
    if (index === -1) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }
    
    employees[index] = {
      ...employees[index],
      ...updatedEmployee,
      updatedAt: new Date().toISOString(),
    };
    
    writeEmployeesToFile(employees);
    console.log('✅ Updated employee:', updatedEmployee.id);
    
    return NextResponse.json(employees[index]);
  } catch (error) {
    console.error('❌ Error updating employee:', error);
    return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 });
  }
}

// DELETE - Remove employee
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    let employees = readEmployeesFromFile();
    
    employees = employees.filter((e: any) => e.id !== id);
    writeEmployeesToFile(employees);
    
    console.log('✅ Deleted employee:', id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error deleting employee:', error);
    return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 });
  }
}