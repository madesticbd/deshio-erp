'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, X, CheckCircle2, AlertCircle, Package, Calculator, UserPlus, Users, Download } from 'lucide-react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import jsPDF from 'jspdf';
import orderService from '@/services/orderService';
import paymentService from '@/services/paymentService';
import employeeService from '@/services/employeeService';
import storeService from '@/services/storeService';
import productService from '@/services/productService';
import batchService, { Batch } from '@/services/batchService';

interface Store {
  id: number;
  name: string;
  address: string;
  type: string;
  is_active: boolean;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  joinDate: string;
}

interface CartItem {
  id: number;
  productId: number;
  productName: string;
  batchId: number;
  batchNumber: string;
  size: string;
  qty: number;
  price: number;
  discount: number;
  amount: number;
  availableQty: number;
  isDefective?: boolean;
  defectId?: string;
  barcode?: string;
  barcodes?: string[];
}

interface Product {
  id: number;
  name: string;
  sku: string;
  batches?: Batch[];
  custom_fields?: Array<{
    field_title: string;
    value: any;
  }>;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

interface DefectItem {
  id: string;
  barcode: string;
  productId: number;
  productName: string;
  sellingPrice?: number;
  store?: string;
}

interface NoteCounts {
  note1000: number;
  note500: number;
  note200: number;
  note100: number;
  note50: number;
  note20: number;
  note10: number;
  note5: number;
  note2: number;
  note1: number;
}

interface DailyCashSummary {
  receivedNotes: NoteCounts;
  returnedNotes: NoteCounts;
  totalReceived: number;
  totalReturned: number;
  netCash: number;
  transactionCount: number;
}

export default function POSPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [outlets, setOutlets] = useState<Store[]>([]);
  const [selectedOutlet, setSelectedOutlet] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [userRole, setUserRole] = useState<string>('');
  const [userStoreId, setUserStoreId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');

  // Employee management
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ name: '', email: '', phone: '', role: '' });

  const [customerName, setCustomerName] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [address, setAddress] = useState('');
  const [product, setProduct] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [quantity, setQuantity] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [amount, setAmount] = useState(0);

  const [defectiveProduct, setDefectiveProduct] = useState<DefectItem | null>(null);

  const [vatRate, setVatRate] = useState(5);
  const [transportCost, setTransportCost] = useState(0);
  const [cashPaid, setCashPaid] = useState(0);
  const [cardPaid, setCardPaid] = useState(0);
  const [bkashPaid, setBkashPaid] = useState(0);
  const [nagadPaid, setNagadPaid] = useState(0);
  const [transactionFee, setTransactionFee] = useState(0);

  const [note1000, setNote1000] = useState(0);
  const [note500, setNote500] = useState(0);
  const [note200, setNote200] = useState(0);
  const [note100, setNote100] = useState(0);
  const [note50, setNote50] = useState(0);
  const [note20, setNote20] = useState(0);
  const [note10, setNote10] = useState(0);
  const [note5, setNote5] = useState(0);
  const [note2, setNote2] = useState(0);
  const [note1, setNote1] = useState(0);
  const [showNoteCounter, setShowNoteCounter] = useState(false);

  // Return change notes
  const [returnNote1000, setReturnNote1000] = useState(0);
  const [returnNote500, setReturnNote500] = useState(0);
  const [returnNote200, setReturnNote200] = useState(0);
  const [returnNote100, setReturnNote100] = useState(0);
  const [returnNote50, setReturnNote50] = useState(0);
  const [returnNote20, setReturnNote20] = useState(0);
  const [returnNote10, setReturnNote10] = useState(0);
  const [returnNote5, setReturnNote5] = useState(0);
  const [returnNote2, setReturnNote2] = useState(0);
  const [returnNote1, setReturnNote1] = useState(0);
  const [showReturnCounter, setShowReturnCounter] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);

const [paymentMethods, setPaymentMethods] = useState<{
  cash?: number;
  card?: number;
  mobileWallet?: number;
}>({
  cash: 1,
  card: 2,
  mobileWallet: 5, 
});

  const emptyNotes: NoteCounts = {
    note1000: 0,
    note500: 0,
    note200: 0,
    note100: 0,
    note50: 0,
    note20: 0,
    note10: 0,
    note5: 0,
    note2: 0,
    note1: 0
  };

  const [dailyCashSummary, setDailyCashSummary] = useState<DailyCashSummary>({
    receivedNotes: { ...emptyNotes },
    returnedNotes: { ...emptyNotes },
    totalReceived: 0,
    totalReturned: 0,
    netCash: 0,
    transactionCount: 0
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(toast => toast.id !== id)), 5000);
  };

const fetchPaymentMethods = async () => {
  try {
    console.log('🔍 Fetching payment methods...');
    const methods = await paymentService.getMethods('counter');
    console.log('✅ Payment methods loaded:', methods);
    
    if (!methods || methods.length === 0) {
      console.warn('⚠️ No payment methods returned from API');
      showToast('No payment methods found. Using defaults.', 'error');
      return;
    }
    
    const methodMap: any = {
      cash: 1,
      card: 2,
      mobileWallet: 6, // ✅ DEFAULT to 6
    };
    
    methods.forEach((method: any) => {
      const code = method.code?.toLowerCase();
      
      console.log(`  Method: ${method.name} (ID: ${method.id}, Code: ${code})`);
      
      if (code === 'cash') {
        methodMap.cash = method.id;
      } else if (code === 'card') {
        methodMap.card = method.id;
      } else if (code === 'mobile_banking') {
        methodMap.mobileWallet = method.id; // Should be 6
      }
    });
    
    console.log('✅ Payment method IDs mapped:', methodMap);
    setPaymentMethods(methodMap);
  } catch (error) {
    console.error('❌ Failed to load payment methods:', error);
    console.log('Using default payment method IDs: cash=1, card=2, mobileWallet=6');
  }
};

  const fetchEmployees = async () => {
    try {
      const response: any = await employeeService.getAll({ is_active: true });
      
      console.log('Raw employee response:', response);
      
      let employeesList: any[] = [];
      
      if (Array.isArray(response)) {
        employeesList = response;
      } else if (response && typeof response === 'object') {
        if (Array.isArray(response.data)) {
          employeesList = response.data;
        } 
        else if (response.data && Array.isArray(response.data.data)) {
          employeesList = response.data.data;
        }
      }
      
      console.log('Extracted employees list:', employeesList);
      
      if (!Array.isArray(employeesList) || employeesList.length === 0) {
        console.warn('No employees found or invalid data structure');
        setEmployees([]);
        return;
      }
      
      const formattedEmployees = employeesList.map((emp: any) => ({
        id: String(emp.id),
        name: emp.name,
        email: emp.email,
        phone: emp.phone,
        role: typeof emp.role === 'object' ? emp.role?.title || emp.role?.slug || 'Unknown' : emp.role,
        joinDate: emp.join_date || new Date().toISOString(),
      }));
      
      console.log('Formatted employees:', formattedEmployees);
      
      setEmployees(formattedEmployees);
    } catch (error: any) {
      console.error('Error fetching employees:', error);
      showToast(error.message || 'Failed to load employees', 'error');
      setEmployees([]);
    }
  };

  const handleAddEmployee = async () => {
    if (!newEmployee.name || !newEmployee.email || !newEmployee.phone || !newEmployee.role) {
      showToast('Please fill all employee fields', 'error');
      return;
    }

    try {
      const savedEmployee = await employeeService.create({
        name: newEmployee.name,
        email: newEmployee.email,
        phone: newEmployee.phone,
        role: newEmployee.role,
        store_id: selectedOutlet ? parseInt(selectedOutlet) : undefined,
      });

      const formattedEmployee: Employee = {
        id: String(savedEmployee.id),
        name: savedEmployee.name,
        email: savedEmployee.email,
        phone: savedEmployee.phone,
        role: savedEmployee.role,
        joinDate: savedEmployee.join_date || new Date().toISOString(),
      };

      setEmployees([...employees, formattedEmployee]);
      setSelectedEmployee(String(savedEmployee.id));
      setNewEmployee({ name: '', email: '', phone: '', role: '' });
      setShowAddEmployeeModal(false);
      showToast('Employee added successfully!', 'success');
    } catch (error: any) {
      console.error('Error adding employee:', error);
      showToast(error.message || 'Failed to add employee', 'error');
    }
  };

  useEffect(() => {
    const defectData = sessionStorage.getItem('defectItem');
    if (defectData) {
      try {
        const defect = JSON.parse(defectData);
        if (defect.store) {
          const outlet = outlets.find(o => o.name === defect.store || o.id.toString() === defect.store);
          if (outlet) setSelectedOutlet(outlet.id.toString());
        }
        setProduct(defect.productName);
        setSelectedProductId(defect.productId);
        setSellingPrice(defect.sellingPrice || 0);
        setQuantity(1);
        setDefectiveProduct(defect);
        showToast('Defective product loaded. Complete the sale.', 'success');
      } catch (error) {
        console.error('Error parsing defect data:', error);
      }
    }
  }, [outlets]);

  useEffect(() => {
    const role = localStorage.getItem('userRole') || '';
    const storeId = localStorage.getItem('storeId') || '';
    const name = localStorage.getItem('userName') || '';
    setUserRole(role);
    setUserStoreId(storeId);
    setUserName(name);

    fetchOutlets(role, storeId);
    loadDailyCashSummary();
    fetchEmployees();
    fetchPaymentMethods(); // ✅ ADD THIS
  }, []);

  useEffect(() => {
    if (selectedOutlet) {
      fetchProducts();
    }
  }, [selectedOutlet]);

  const fetchOutlets = async (role: string, storeId: string) => {
    try {
      const response = await storeService.getStores({ is_active: true });
      
      if (!response.success) {
        showToast('Failed to load stores', 'error');
        return;
      }
      
      let stores = [];
      if (Array.isArray(response.data)) {
        stores = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        stores = response.data.data;
      } else if (response.data && typeof response.data === 'object') {
        stores = [response.data];
      }
      
      setOutlets(stores);
      
      if (stores.length === 0) {
        showToast('No stores found', 'error');
        return;
      }
      
      if (role === 'store_manager' && storeId) {
        const userStore = stores.find((store: Store) => String(store.id) === String(storeId));
        if (userStore) {
          setSelectedOutlet(String(userStore.id));
        }
      } else if (storeId) {
        const userStore = stores.find((store: Store) => String(store.id) === String(storeId));
        if (userStore) {
          setSelectedOutlet(String(userStore.id));
        }
      }
    } catch (error) {
      console.error('Error fetching outlets:', error);
      showToast('Failed to load stores', 'error');
      setOutlets([]);
    }
  };

  const fetchProducts = async () => {
    if (!selectedOutlet) {
      console.log('No outlet selected');
      return;
    }

    try {
      const result = await productService.getAll({
        is_archived: false,
        per_page: 1000,
      });
      
      let productsList: Product[] = [];
      
      if (Array.isArray(result)) {
        productsList = result;
      } else if (result && typeof result === 'object') {
        if (Array.isArray((result as any).data)) {
          productsList = (result as any).data;
        } 
        else if ((result as any).data && Array.isArray((result as any).data.data)) {
          productsList = (result as any).data.data;
        }
      }
      
      const productsWithBatches = await Promise.all(
        productsList.map(async (product: Product) => {
          try {
            const batchResponse = await batchService.getBatches({
              product_id: product.id,
              store_id: parseInt(selectedOutlet),
              status: 'available',
              per_page: 100
            });
            
            console.log(`Batches for product ${product.name}:`, batchResponse);
            
            const batches = batchResponse.success && batchResponse.data?.data 
              ? batchResponse.data.data.filter((batch: Batch) => batch.quantity > 0)
              : [];
            
            return {
              ...product,
              batches: batches
            };
          } catch (error) {
            console.error(`Error loading batches for product ${product.id}:`, error);
            return {
              ...product,
              batches: []
            };
          }
        })
      );
      
      console.log('Products with batches:', productsWithBatches);
      setProducts(productsWithBatches);
    } catch (error) {
      console.error('Error fetching products:', error);
      showToast('Failed to load products', 'error');
      setProducts([]);
    }
  };

  const loadDailyCashSummary = () => {
    const today = new Date().toISOString().split('T')[0];
    const savedSummary = localStorage.getItem(`cashSummary_${today}`);
    if (savedSummary) {
      try {
        const parsed = JSON.parse(savedSummary);
        setDailyCashSummary({
          receivedNotes: { ...emptyNotes, ...parsed.receivedNotes },
          returnedNotes: { ...emptyNotes, ...parsed.returnedNotes },
          totalReceived: parsed.totalReceived || 0,
          totalReturned: parsed.totalReturned || 0,
          netCash: parsed.netCash || 0,
          transactionCount: parsed.transactionCount || 0
        });
      } catch (error) {
        console.error('Error loading cash summary:', error);
      }
    }
  };

  const updateSummary = (entryNotes: NoteCounts, entryReturnNotes: NoteCounts | undefined, entryTotal: number, entryReturn: number, entryNet: number) => {
    const newReceived = { ...dailyCashSummary.receivedNotes };
    for (let key in entryNotes) {
      newReceived[key as keyof NoteCounts] += entryNotes[key as keyof NoteCounts];
    }

    const newReturned = { ...dailyCashSummary.returnedNotes };
    if (entryReturnNotes) {
      for (let key in entryReturnNotes) {
        newReturned[key as keyof NoteCounts] += entryReturnNotes[key as keyof NoteCounts];
      }
    }

    const newSummary = {
      receivedNotes: newReceived,
      returnedNotes: newReturned,
      totalReceived: dailyCashSummary.totalReceived + entryTotal,
      totalReturned: dailyCashSummary.totalReturned + entryReturn,
      netCash: dailyCashSummary.netCash + entryNet,
      transactionCount: dailyCashSummary.transactionCount + 1
    };

    setDailyCashSummary(newSummary);
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`cashSummary_${today}`, JSON.stringify(newSummary));
  };

  const recordCashPayment = () => {
    if (cashFromNotes <= 0) return;

    const netCash = cashFromNotes - returnCashFromNotes;

    const notes: NoteCounts = {
      note1000,
      note500,
      note200,
      note100,
      note50,
      note20,
      note10,
      note5,
      note2,
      note1
    };

    const returnNotes: NoteCounts | undefined = returnCashFromNotes > 0 ? {
      note1000: returnNote1000,
      note500: returnNote500,
      note200: returnNote200,
      note100: returnNote100,
      note50: returnNote50,
      note20: returnNote20,
      note10: returnNote10,
      note5: returnNote5,
      note2: returnNote2,
      note1: returnNote1
    } : undefined;

    updateSummary(notes, returnNotes, cashFromNotes, returnCashFromNotes, netCash);
  };

  const downloadCashCountPDF = () => {
    const today = new Date().toISOString().split('T')[0];
    const outletData = outlets.find(o => o.id.toString() === selectedOutlet);

    const savedSummary = localStorage.getItem(`cashSummary_${today}`);
    let summaryData = dailyCashSummary;
    if (savedSummary) {
      try {
        const parsed = JSON.parse(savedSummary);
        summaryData = {
          receivedNotes: { ...emptyNotes, ...parsed.receivedNotes },
          returnedNotes: { ...emptyNotes, ...parsed.returnedNotes },
          totalReceived: parsed.totalReceived || 0,
          totalReturned: parsed.totalReturned || 0,
          netCash: parsed.netCash || 0,
          transactionCount: parsed.transactionCount || 0
        };
      } catch (error) {
        console.error('Error parsing saved summary:', error);
        showToast('Error loading cash summary for PDF', 'error');
        return;
      }
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    const year = new Date().getFullYear();
    doc.text(`Deshio Daily Cash Count Report - ${year}`, 20, 20);
    doc.setFontSize(12);
    doc.text(`Date: ${today}`, 20, 30);
    doc.text(`Outlet: ${outletData?.name || 'Unknown'}`, 20, 40);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 50);

    doc.setFontSize(14);
    doc.text(`Total Cash Received: Tk${summaryData.totalReceived.toFixed(2)}`, 20, 70);
    doc.text(`Total Change Returned: Tk${summaryData.totalReturned.toFixed(2)}`, 20, 80);
    doc.text(`Net Cash Collected: Tk${summaryData.netCash.toFixed(2)}`, 20, 90);
    doc.text(`Total Transactions: ${summaryData.transactionCount || 0}`, 20, 100);

    doc.setFontSize(12);
    doc.text('Cash Received - Note Breakdown', 20, 120);

    const colWidths = [40, 40, 60];
    let yPos = 130;
    doc.setLineWidth(0.2);
    doc.rect(20, yPos - 5, colWidths[0], 10);
    doc.rect(20 + colWidths[0], yPos - 5, colWidths[1], 10);
    doc.rect(20 + colWidths[0] + colWidths[1], yPos - 5, colWidths[2], 10);
    doc.text('Cash Note', 25, yPos + 2);
    doc.text('Count', 65, yPos + 2);
    doc.text('Total', 105, yPos + 2);
    yPos += 10;

    const received = summaryData.receivedNotes;
    const denominations = [1000, 500, 200, 100, 50, 20, 10, 5, 2, 1];
    denominations.forEach(denom => {
      const count = (received as any)[`note${denom}`] || 0;
      if (count > 0) {
        const total = count * denom;
        doc.rect(20, yPos - 5, colWidths[0], 10);
        doc.rect(20 + colWidths[0], yPos - 5, colWidths[1], 10);
        doc.rect(20 + colWidths[0] + colWidths[1], yPos - 5, colWidths[2], 10);
        doc.text(`Tk${denom}`, 25, yPos + 2);
        doc.text(`${count}`, 65, yPos + 2);
        doc.text(`Tk${total.toFixed(2)}`, 105, yPos + 2);
        yPos += 10;
      }
    });

    doc.rect(20, yPos - 5, colWidths[0] + colWidths[1], 10);
    doc.rect(20 + colWidths[0] + colWidths[1], yPos - 5, colWidths[2], 10);
    doc.text('Total Received:', 25, yPos + 2);
    doc.text(`Tk${summaryData.totalReceived.toFixed(2)}`, 105, yPos + 2);
    yPos += 20;

    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.text('Change Returned - Note Breakdown', 20, yPos);
    yPos += 10;
    doc.rect(20, yPos - 5, colWidths[0], 10);
    doc.rect(20 + colWidths[0], yPos - 5, colWidths[1], 10);
    doc.rect(20 + colWidths[0] + colWidths[1], yPos - 5, colWidths[2], 10);
    doc.text('Cash Note', 25, yPos + 2);
    doc.text('Count', 65, yPos + 2);
    doc.text('Total', 105, yPos + 2);
    yPos += 10;

    const returned = summaryData.returnedNotes;
    denominations.forEach(denom => {
      const count = (returned as any)[`note${denom}`] || 0;
      if (count > 0) {
        const total = count * denom;
        doc.rect(20, yPos - 5, colWidths[0], 10);
        doc.rect(20 + colWidths[0], yPos - 5, colWidths[1], 10);
        doc.rect(20 + colWidths[0] + colWidths[1], yPos - 5, colWidths[2], 10);
        doc.text(`Tk${denom}`, 25, yPos + 2);
        doc.text(`${count}`, 65, yPos + 2);
        doc.text(`Tk${total.toFixed(2)}`, 105, yPos + 2);
        yPos += 10;
      }
    });

    doc.rect(20, yPos - 5, colWidths[0] + colWidths[1], 10);
    doc.rect(20 + colWidths[0] + colWidths[1], yPos - 5, colWidths[2], 10);
    doc.text('Total Returned:', 25, yPos + 2);
    doc.text(`Tk${summaryData.totalReturned.toFixed(2)}`, 105, yPos + 2);
    yPos += 20;

    if (yPos > 230) {
      doc.addPage();
      yPos = 20;
    }

    doc.text('Net Cash in Drawer - Note Breakdown', 20, yPos);
    yPos += 10;
    doc.rect(20, yPos - 5, colWidths[0], 10);
    doc.rect(20 + colWidths[0], yPos - 5, colWidths[1], 10);
    doc.rect(20 + colWidths[0] + colWidths[1], yPos - 5, colWidths[2], 10);
    doc.text('Cash Note', 25, yPos + 2);
    doc.text('Net Count', 65, yPos + 2);
    doc.text('Net Total', 105, yPos + 2);
    yPos += 10;

    let netTotal = 0;
    denominations.forEach(denom => {
      const recCount = (received as any)[`note${denom}`] || 0;
      const retCount = (returned as any)[`note${denom}`] || 0;
      const netCount = recCount - retCount;
      if (netCount !== 0) {
        const netAmount = netCount * denom;
        doc.rect(20, yPos - 5, colWidths[0], 10);
        doc.rect(20 + colWidths[0], yPos - 5, colWidths[1], 10);
        doc.rect(20 + colWidths[0] + colWidths[1], yPos - 5, colWidths[2], 10);
        doc.text(`Tk${denom}`, 25, yPos + 2);
        doc.text(`${netCount}`, 65, yPos + 2);
        doc.text(`Tk${netAmount.toFixed(2)}`, 105, yPos + 2);
        netTotal += netAmount;
        yPos += 10;
        
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
      }
    });

    doc.rect(20, yPos - 5, colWidths[0] + colWidths[1], 10);
    doc.rect(20 + colWidths[0] + colWidths[1], yPos - 5, colWidths[2], 10);
    doc.text('Total Net Cash:', 25, yPos + 2);
    doc.text(`Tk${netTotal.toFixed(2)}`, 105, yPos + 2);

    doc.save(`cash_count_${today}.pdf`);
  };

  const getAvailableProducts = () => {
    return products.filter(p => p.batches && p.batches.length > 0);
  };

  useEffect(() => {
    if (sellingPrice > 0 && quantity > 0) {
      const baseAmount = sellingPrice * quantity;
      let discount = 0;
      if (discountPercent > 0) {
        discount = (baseAmount * discountPercent) / 100;
      } else if (discountAmount > 0) {
        discount = discountAmount;
      }
      setAmount(baseAmount - discount);
    } else {
      setAmount(0);
    }
  }, [sellingPrice, quantity, discountPercent, discountAmount]);

  const handleProductSelect = (productName: string) => {
    setProduct(productName);
    const selectedProd = products.find(p => p.name === productName);
    
    console.log('Selected product:', selectedProd);
    
    if (selectedProd) {
      setSelectedProductId(selectedProd.id);
      
      if (selectedProd.batches && selectedProd.batches.length > 0) {
        const firstBatch = selectedProd.batches[0];
        console.log('First batch:', firstBatch);
        console.log('Sell price:', firstBatch.sell_price);
        
        setSelectedBatch(firstBatch);
        
        const priceString = String(firstBatch.sell_price).replace(/,/g, '');
        const price = parseFloat(priceString) || 0;
        
        console.log('Parsed price:', price); 
        setSellingPrice(price);
      } else {
        console.log('No batches found for this product');
        setSelectedBatch(null);
        setSellingPrice(0);
        showToast('No available batches for this product', 'error');
      }
    }
  };

  const addDefectiveToCart = () => {
    if (!defectiveProduct || !sellingPrice || sellingPrice <= 0) {
      showToast('Defective product price is required', 'error');
      return;
    }
    if (!selectedOutlet) {
      showToast('Please select an outlet', 'error');
      return;
    }
    
    const parsedPrice = typeof sellingPrice === 'string' 
      ? parseFloat(String(sellingPrice).replace(/,/g, '')) 
      : sellingPrice;
    
    const newItem: CartItem = {
      id: Date.now() + Math.random(),
      productId: defectiveProduct.productId,
      productName: defectiveProduct.productName,
      batchId: 0,
      batchNumber: 'DEFECTIVE',
      size: '',
      qty: 1,
      price: parsedPrice,
      discount: 0,
      amount: parsedPrice,
      availableQty: 1,
      isDefective: true,
      defectId: defectiveProduct.id,
      barcode: defectiveProduct.barcode
    };
    
    setCart([...cart, newItem]);
    showToast('Defective product added to cart', 'success');
    setProduct('');
    setSelectedProductId(null);
    setSelectedBatch(null);
    setSellingPrice(0);
    setQuantity(0);
    setDefectiveProduct(null);
    sessionStorage.removeItem('defectItem');
  };

  const addToCart = () => {
    if (defectiveProduct && selectedProductId === defectiveProduct.productId) {
      return addDefectiveToCart();
    }
    
    if (!product || !selectedProductId) {
      showToast('Please select a product', 'error');
      return;
    }
    
    if (!selectedBatch) {
      showToast('No batch selected for this product', 'error');
      return;
    }
    
    if (sellingPrice <= 0 || quantity <= 0) {
      showToast('Please enter valid price and quantity', 'error');
      return;
    }
    
    if (!selectedOutlet) {
      showToast('Please select an outlet', 'error');
      return;
    }

    if (quantity > selectedBatch.quantity) {
      showToast(`Only ${selectedBatch.quantity} units available in this batch`, 'error');
      return;
    }

    const baseAmount = sellingPrice * quantity;
    const discountValue = discountPercent > 0 ? (baseAmount * discountPercent) / 100 : discountAmount;

    const newItem: CartItem = {
      id: Date.now() + Math.random(),
      productId: selectedProductId,
      productName: product,
      batchId: selectedBatch.id,
      batchNumber: selectedBatch.batch_number,
      size: '',
      qty: quantity,
      price: sellingPrice,
      discount: discountValue,
      amount: baseAmount - discountValue,
      availableQty: selectedBatch.quantity,
      isDefective: false,
    };
    
    setCart([...cart, newItem]);
    setProduct('');
    setSelectedProductId(null);
    setSelectedBatch(null);
    setSellingPrice(0);
    setQuantity(0);
    setDiscountPercent(0);
    setDiscountAmount(0);
    setAmount(0);
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.amount, 0);
  const totalDiscount = cart.reduce((sum, item) => sum + item.discount, 0);
  const vat = (subtotal * vatRate) / 100;
  const total = subtotal + vat + transportCost;
  
  const cashFromNotes = (note1000 * 1000) + (note500 * 500) + (note200 * 200) + 
                     (note100 * 100) + (note50 * 50) + (note20 * 20) + 
                     (note10 * 10) + (note5 * 5) + (note2 * 2) + (note1 * 1);

  const returnCashFromNotes = (returnNote1000 * 1000) + (returnNote500 * 500) + (returnNote200 * 200) + 
                     (returnNote100 * 100) + (returnNote50 * 50) + (returnNote20 * 20) + 
                     (returnNote10 * 10) + (returnNote5 * 5) + (returnNote2 * 2) + (returnNote1 * 1);

  const effectiveCash = cashFromNotes > 0 ? cashFromNotes : cashPaid;
  const totalPaid = effectiveCash + cardPaid + bkashPaid + nagadPaid;
  const due = total - totalPaid + transactionFee;
  const change = due < 0 ? Math.abs(due) : 0;

  // ✅ COMPLETE FIXED handleSell FUNCTION
  const handleSell = async () => {
    if (!selectedOutlet) {
      showToast('Please select an outlet', 'error');
      return;
    }
    if (cart.length === 0) {
      showToast('Please add products to cart', 'error');
      return;
    }
    if (!selectedEmployee) {
      showToast('Please select an employee', 'error');
      return;
    }

    const finalCash = cashFromNotes > 0 ? cashFromNotes : cashPaid;
    const finalTotalPaid = finalCash + cardPaid + bkashPaid + nagadPaid;
    const finalDue = total - finalTotalPaid + transactionFee;

    if (finalDue > 0 && !confirm(`There is an outstanding amount of ৳${finalDue.toFixed(2)}. Continue?`)) {
      return;
    }

    setIsProcessing(true);

    try {
      const cashReceived = cashFromNotes > 0 ? [
        { denomination: 1000, quantity: note1000, type: 'note' as const },
        { denomination: 500, quantity: note500, type: 'note' as const },
        { denomination: 200, quantity: note200, type: 'note' as const },
        { denomination: 100, quantity: note100, type: 'note' as const },
        { denomination: 50, quantity: note50, type: 'note' as const },
        { denomination: 20, quantity: note20, type: 'note' as const },
        { denomination: 10, quantity: note10, type: 'note' as const },
        { denomination: 5, quantity: note5, type: 'note' as const },
        { denomination: 2, quantity: note2, type: 'note' as const },
        { denomination: 1, quantity: note1, type: 'note' as const },
      ].filter(d => d.quantity > 0) : undefined;

      const cashChange = returnCashFromNotes > 0 ? [
        { denomination: 1000, quantity: returnNote1000, type: 'note' as const },
        { denomination: 500, quantity: returnNote500, type: 'note' as const },
        { denomination: 200, quantity: returnNote200, type: 'note' as const },
        { denomination: 100, quantity: returnNote100, type: 'note' as const },
        { denomination: 50, quantity: returnNote50, type: 'note' as const },
        { denomination: 20, quantity: returnNote20, type: 'note' as const },
        { denomination: 10, quantity: returnNote10, type: 'note' as const },
        { denomination: 5, quantity: returnNote5, type: 'note' as const },
        { denomination: 2, quantity: returnNote2, type: 'note' as const },
        { denomination: 1, quantity: returnNote1, type: 'note' as const },
      ].filter(d => d.quantity > 0) : undefined;

      const orderPayload = {
        order_type: 'counter' as const,
        customer: customerName || mobileNo ? {
          name: customerName || 'Walk-in Customer',
          phone: mobileNo || '01XXXXXXXXX',
          email: undefined,
          address: address || undefined,
        } : undefined,
        store_id: parseInt(selectedOutlet),
        salesman_id: parseInt(selectedEmployee),
        items: cart.map(item => ({
          product_id: item.productId,
          batch_id: item.batchId,
          quantity: item.qty,
          unit_price: item.price,
          discount_amount: item.discount || 0,
          tax_amount: 0,
          ...(item.barcode ? { barcode: item.barcode } : {}),
        })),
        discount_amount: totalDiscount,
        shipping_amount: transportCost,
        notes: `VAT: ${vatRate}%${address ? `, Address: ${address}` : ''}`,
      };

      console.log('📦 Creating order...');
      const order = await orderService.create(orderPayload);
      console.log('✅ Order created:', order.order_number);
      showToast(`Order #${order.order_number} created!`, 'success');

      // ✅ FIXED PAYMENT PROCESSING
      if (finalTotalPaid > 0) {
        type PaymentSplit = {
          payment_method_id: number;
          amount: number;
          cash_received?: Array<{
            denomination: number;
            quantity: number;
            type: 'note' | 'coin';
          }>;
          cash_change?: Array<{
            denomination: number;
            quantity: number;
            type: 'note' | 'coin';
          }>;
        };

        const paymentSplits: PaymentSplit[] = [];
        
        if (finalCash > 0) {
          const cashSplit: PaymentSplit = {
            payment_method_id: paymentMethods.cash || 1,
            amount: finalCash,
          };
          if (cashReceived) cashSplit.cash_received = cashReceived;
          if (cashChange) cashSplit.cash_change = cashChange;
          console.log('💵 Cash split:', cashSplit);
          paymentSplits.push(cashSplit);
        }
        
        if (cardPaid > 0) {
          const cardSplit: PaymentSplit = {
            payment_method_id: paymentMethods.card || 2,
            amount: cardPaid,
          };
          console.log('💳 Card split:', cardSplit);
          paymentSplits.push(cardSplit);
        }
        
        if (bkashPaid > 0) {
          const bkashSplit: PaymentSplit = {
            payment_method_id: paymentMethods.mobileWallet || 7,
            amount: bkashPaid,
          };
          console.log('📱 bKash split:', bkashSplit);
          paymentSplits.push(bkashSplit);
        }
        
        if (nagadPaid > 0) {
          const nagadSplit: PaymentSplit = {
            payment_method_id: paymentMethods.mobileWallet || 7,
            amount: nagadPaid,
          };
          console.log('📱 Nagad split:', nagadSplit);
          paymentSplits.push(nagadSplit);
        }

        console.log('📋 Payment splits:', JSON.stringify(paymentSplits, null, 2));

        if (paymentSplits.length === 0) {
          console.log('⚠️ No payments to process');
        } else if (paymentSplits.length === 1) {
          console.log('💳 Processing single payment...');
          
          const payment = paymentSplits[0];
          
          await paymentService.process(order.id, {
            payment_method_id: payment.payment_method_id,
            amount: payment.amount,
            payment_type: (finalDue <= 0 ? 'full' : 'partial') as 'full' | 'partial',
            auto_complete: true,
            ...(payment.cash_received && { cash_received: payment.cash_received }),
            ...(payment.cash_change && { cash_change: payment.cash_change }),
          });
          
          console.log('✅ Single payment processed');
        } else {
          console.log('💳💳 Processing split payment...');
          
          await paymentService.processSplit(order.id, {
            total_amount: finalTotalPaid,
            payment_type: finalDue <= 0 ? 'full' : 'partial',
            auto_complete: true,
            splits: paymentSplits,
          });
          
          console.log('✅ Split payment processed');
        }
      }

      console.log('🏁 Completing order...');
      await orderService.complete(order.id);
      console.log('✅ Order completed');

      if (finalCash > 0 && cashFromNotes > 0) {
        recordCashPayment();
      } else {
        setDailyCashSummary(prev => {
          const newSummary = {...prev, transactionCount: (prev.transactionCount || 0) + 1};
          const today = new Date().toISOString().split('T')[0];
          localStorage.setItem(`cashSummary_${today}`, JSON.stringify(newSummary));
          return newSummary;
        });
      }

      showToast(`Order #${order.order_number} completed successfully!`, 'success');
      
      resetForm();
      fetchProducts();

    } catch (error: any) {
      console.error('❌ Sale error:', error);
      showToast(error.message || 'Failed to complete sale', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setCart([]);
    setCustomerName('');
    setMobileNo('');
    setAddress('');
    setCashPaid(0);
    setCardPaid(0);
    setBkashPaid(0);
    setNagadPaid(0);
    setTransactionFee(0);
    setTransportCost(0);
    setNote1000(0);
    setNote500(0);
    setNote200(0);
    setNote100(0);
    setNote50(0);
    setNote20(0);
    setNote10(0);
    setNote5(0);
    setNote2(0);
    setNote1(0);
    setShowNoteCounter(false);
    setReturnNote1000(0);
    setReturnNote500(0);
    setReturnNote200(0);
    setReturnNote100(0);
    setReturnNote50(0);
    setReturnNote20(0);
    setReturnNote10(0);
    setReturnNote5(0);
    setReturnNote2(0);
    setReturnNote1(0);
    setShowReturnCounter(false);
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <div className="flex-1 flex flex-col">
          <Header darkMode={darkMode} setDarkMode={setDarkMode} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          <main className="flex-1 overflow-auto p-6">
            <div className="fixed top-4 right-4 z-50 space-y-2">
              {toasts.map((toast) => (
                <div key={toast.id} className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${toast.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
                  {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" /> : <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />}
                  <p className={`text-sm font-medium ${toast.type === 'success' ? 'text-green-900 dark:text-green-300' : 'text-red-900 dark:text-red-300'}`}>{toast.message}</p>
                  <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} className={toast.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}><X className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Point of Sale</h1>
                {dailyCashSummary.totalReceived > 0 && (
                  <button
                    onClick={downloadCashCountPDF}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download Daily Cash PDF
                  </button>
                )}
              </div>  
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sales By</label>
                  <input type="text" value={userRole === 'store_manager' ? userName : 'Admin'} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Employee <span className="text-red-500">*</span>
                  </label>
                  <select 
                    value={selectedEmployee} 
                    onChange={(e) => {
                      if (e.target.value === 'add_new') {
                        setShowAddEmployeeModal(true);
                        setSelectedEmployee('');
                      } else {
                        setSelectedEmployee(e.target.value);
                      }
                    }} 
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select Employee</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} - {emp.role}
                      </option>
                    ))}
                    <option value="add_new">+ Add New Employee</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Outlet <span className="text-red-500">*</span></label>
                  <select value={selectedOutlet} onChange={(e) => setSelectedOutlet(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option value="">Choose an Outlet</option>
                    {outlets.map((outlet) => (<option key={outlet.id} value={outlet.id}>{outlet.name} - {outlet.address}</option>))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date <span className="text-red-500">*</span></label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
              </div>
            </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 space-y-6">
                  <div className={`bg-white dark:bg-gray-800 rounded-lg border ${defectiveProduct ? 'border-orange-300 dark:border-orange-700 shadow-lg' : 'border-gray-200 dark:border-gray-700'}`}>
                    <div className={`px-4 py-3 border-b flex items-center justify-between ${defectiveProduct ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700' : 'border-gray-200 dark:border-gray-700'}`}>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-medium text-gray-900 dark:text-white">Sales Information</h2>
                        {defectiveProduct && <span className="px-2 py-1 bg-orange-500 text-white text-xs font-medium rounded">Defective Product</span>}
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-4">
                      {defectiveProduct && (
                        <div className="col-span-2 mb-2 p-3 bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 rounded-md">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                              <span className="text-sm font-medium text-orange-900 dark:text-orange-200">Selling Defective Item</span>
                            </div>
                            <div className="text-xs text-orange-700 dark:text-orange-400">Barcode: <span className="font-mono font-bold">{defectiveProduct.barcode}</span></div>
                          </div>
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Customer</label>
                        <input type="text" placeholder="Search Customer" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Product {defectiveProduct && <span className="text-orange-600">(Defective - No Stock)</span>}
                          {selectedBatch && <span className="text-xs text-gray-500 ml-2">(Stock: {selectedBatch.quantity})</span>}
                        </label>
                        {defectiveProduct ? (
                          <input 
                            type="text" 
                            value={product} 
                            readOnly 
                            className="w-full px-3 py-2 border border-orange-300 dark:border-orange-600 rounded-md bg-orange-50 dark:bg-orange-900/20 text-orange-900 dark:text-orange-200 font-medium text-sm cursor-not-allowed" 
                          />
                        ) : (
                          <select value={product} onChange={(e) => handleProductSelect(e.target.value)} disabled={!selectedOutlet} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm disabled:bg-gray-100 disabled:dark:bg-gray-600">
                            <option value="">Select Product</option>
                            {getAvailableProducts().map((prod) => (<option key={prod.id} value={prod.name}>{prod.name} ({prod.batches?.length || 0} batches)</option>))}
                          </select>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                        <input type="text" placeholder="Customer Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Selling Price</label>
                        <input type="number" value={sellingPrice} onChange={(e) => setSellingPrice(Number(e.target.value))} readOnly={!!defectiveProduct} className={`w-full px-3 py-2 border rounded-md text-sm ${defectiveProduct ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-600 text-orange-900 dark:text-orange-200 font-medium cursor-not-allowed' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'}`} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mobile No</label>
                        <input type="text" placeholder="Mobile No" value={mobileNo} onChange={(e) => setMobileNo(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
                        <input type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} readOnly={!!defectiveProduct} className={`w-full px-3 py-2 border rounded-md text-sm ${defectiveProduct ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-600 text-orange-900 dark:text-orange-200 font-medium cursor-not-allowed' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'}`} />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                        <textarea placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Discount %</label>
                          <input type="number" value={discountPercent} onChange={(e) => { setDiscountPercent(Number(e.target.value)); setDiscountAmount(0); }} disabled={!!defectiveProduct} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm disabled:opacity-50" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tk.</label>
                          <input type="number" value={discountAmount} onChange={(e) => { setDiscountAmount(Number(e.target.value)); setDiscountPercent(0); }} disabled={!!defectiveProduct} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm disabled:opacity-50" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                        <input type="number" value={amount.toFixed(2)} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                      </div>
                      <div className="col-span-2 flex justify-end">
                        <button onClick={addToCart} className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-medium">Add to Cart</button>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Product Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Batch</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Qty</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Price</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Discount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                      {cart.length === 0 ? (
                          <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">No products added to cart</td></tr>
                        ) : (
                          cart.map((item) => (
                            <tr key={item.id} className={`border-t border-gray-200 dark:border-gray-700 ${item.isDefective ? 'bg-orange-50 dark:bg-orange-900/10' : ''}`}>
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                {item.productName}
                                {item.isDefective && <span className="ml-2 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs rounded">Defective</span>}
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">{item.batchNumber}</td>
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{item.qty}</td>
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{item.price}</td>
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{item.discount.toFixed(2)}</td>
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{item.amount.toFixed(2)}</td>
                              <td className="px-4 py-3">
                                <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 h-fit">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h2 className="text-sm font-medium text-gray-900 dark:text-white">Amount Details</h2>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300">Sub Total</span>
                      <span className="text-gray-900 dark:text-white font-medium">৳{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300">Total Discount</span>
                      <span className="text-gray-900 dark:text-white font-medium">৳{totalDiscount.toFixed(2)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Vat</label>
                        <input type="number" value={vat.toFixed(2)} readOnly className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Vat Rate %</label>
                        <input type="number" value={vatRate} onChange={(e) => setVatRate(Number(e.target.value))} className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Transport Cost</label>
                      <input type="number" value={transportCost} onChange={(e) => setTransportCost(Number(e.target.value))} className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                    </div>
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between text-base mb-2">
                        <span className="font-semibold text-gray-900 dark:text-white">Total</span>
                        <span className="font-semibold text-gray-900 dark:text-white">৳{total.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Cash Payment</label>
                        <button
                          onClick={() => setShowNoteCounter(!showNoteCounter)}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30"
                        >
                          <Calculator className="w-3 h-3" />
                          {showNoteCounter ? 'Hide' : 'Count Notes'}
                        </button>
                      </div>
                      
                      {showNoteCounter ? (
                        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-3 space-y-2">
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">৳1000 ×</label>
                              <input type="number" min="0" value={note1000} onChange={(e) => setNote1000(Number(e.target.value))} className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">৳500 ×</label>
                              <input type="number" min="0" value={note500} onChange={(e) => setNote500(Number(e.target.value))} className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">৳200 ×</label>
                              <input type="number" min="0" value={note200} onChange={(e) => setNote200(Number(e.target.value))} className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">৳100 ×</label>
                              <input type="number" min="0" value={note100} onChange={(e) => setNote100(Number(e.target.value))} className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">৳50 ×</label>
                              <input type="number" min="0" value={note50} onChange={(e) => setNote50(Number(e.target.value))} className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">৳20 ×</label>
                              <input type="number" min="0" value={note20} onChange={(e) => setNote20(Number(e.target.value))} className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">৳10 ×</label>
                              <input type="number" min="0" value={note10} onChange={(e) => setNote10(Number(e.target.value))} className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">৳5 ×</label>
                              <input type="number" min="0" value={note5} onChange={(e) => setNote5(Number(e.target.value))} className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                            </div>
                            <div>
                              <label className="block text-xs text-xs text-gray-700 dark:text-gray-300 mb-1">৳2 ×</label>
                              <input type="number" min="0" value={note2} onChange={(e) => setNote2(Number(e.target.value))} className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                            </div>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-blue-200 dark:border-blue-800">
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Total Cash:</span>
                            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">৳{cashFromNotes.toFixed(2)}</span>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Cash Paid</label>
                          <input 
                            type="number" 
                            value={cashFromNotes > 0 ? cashFromNotes : cashPaid} 
                            onChange={(e) => {
                              setCashPaid(Number(e.target.value));
                              setNote1000(0);
                              setNote500(0);
                              setNote200(0);
                              setNote100(0);
                              setNote50(0);
                              setNote20(0);
                              setNote10(0);
                              setNote5(0);
                              setNote2(0);
                              setNote1(0);
                            }} 
                            className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" 
                          />
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Card Paid</label>
                        <input type="number" value={cardPaid} onChange={(e) => setCardPaid(Number(e.target.value))} className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Bkash Paid</label>
                        <input type="number" value={bkashPaid} onChange={(e) => setBkashPaid(Number(e.target.value))} className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Nagad Paid</label>
                        <input type="number" value={nagadPaid} onChange={(e) => setNagadPaid(Number(e.target.value))} className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Transaction Fee</label>
                        <input type="number" value={transactionFee} onChange={(e) => setTransactionFee(Number(e.target.value))} className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700 dark:text-gray-300">Total Paid</span>
                        <span className="text-gray-900 dark:text-white font-medium">৳{totalPaid.toFixed(2)}</span>
                      </div>
                      {change > 0 && (
                        <div className="mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-semibold text-yellow-900 dark:text-yellow-200">Change to Return</span>
                            <span className="text-lg font-bold text-yellow-700 dark:text-yellow-400">৳{change.toFixed(2)}</span>
                          </div>
                          <button
                            onClick={() => setShowReturnCounter(!showReturnCounter)}
                            className="w-full flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded hover:bg-yellow-200 dark:hover:bg-yellow-900/50"
                          >
                            <Calculator className="w-3 h-3" />
                            {showReturnCounter ? 'Hide' : 'Count Return Notes'}
                          </button>
                          {showReturnCounter && (
                            <div className="mt-2 bg-white dark:bg-gray-800 border border-yellow-300 dark:border-yellow-700 rounded-lg p-3 space-y-2">
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">৳1000 ×</label>
                                  <input type="number" min="0" value={returnNote1000} onChange={(e) => setReturnNote1000(Number(e.target.value))} className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">৳500 ×</label>
                                  <input type="number" min="0" value={returnNote500} onChange={(e) => setReturnNote500(Number(e.target.value))} className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">৳200 ×</label>
                                  <input type="number" min="0" value={returnNote200} onChange={(e) => setReturnNote200(Number(e.target.value))} className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">৳100 ×</label>
                                  <input type="number" min="0" value={returnNote100} onChange={(e) => setReturnNote100(Number(e.target.value))} className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">৳50 ×</label>
                                  <input type="number" min="0" value={returnNote50} onChange={(e) => setReturnNote50(Number(e.target.value))} className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">৳20 ×</label>
                                  <input type="number" min="0" value={returnNote20} onChange={(e) => setReturnNote20(Number(e.target.value))} className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">৳10 ×</label>
                                  <input type="number" min="0" value={returnNote10} onChange={(e) => setReturnNote10(Number(e.target.value))} className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">৳5 ×</label>
                                  <input type="number" min="0" value={returnNote5} onChange={(e) => setReturnNote5(Number(e.target.value))} className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">৳2 ×</label>
                                  <input type="number" min="0" value={returnNote2} onChange={(e) => setReturnNote2(Number(e.target.value))} className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">৳1 ×</label>
                                  <input type="number" min="0" value={returnNote1} onChange={(e) => setReturnNote1(Number(e.target.value))} className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                                </div>
                              </div>
                              <div className="flex justify-between items-center pt-2 border-t border-yellow-200 dark:border-yellow-800">
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Total Return:</span>
                                <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">৳{returnCashFromNotes.toFixed(2)}</span>
                              </div>
                              {returnCashFromNotes !== change && (
                                <div className="text-xs text-red-600 dark:text-red-400 text-center">
                                  ⚠ Return amount should equal change: ৳{change.toFixed(2)}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex justify-between text-base">
                        <span className="font-semibold text-gray-900 dark:text-white">Due</span>
                        <span className={`font-bold ${due > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>৳{due.toFixed(2)}</span>
                      </div>
                    </div>
                    <button 
                      onClick={handleSell} 
                      disabled={isProcessing}
                      className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-md text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? 'Processing...' : 'Complete Sale'}
                    </button>
                  </div>
                </div>
              </div>
          </main>
        </div>
      </div>

      {showAddEmployeeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-800">
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add New Employee</h2>
              </div>
              <button
                onClick={() => {
                  setShowAddEmployeeModal(false);
                  setNewEmployee({ name: '', email: '', phone: '', role: '' });
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                  placeholder="Enter employee name"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                  placeholder="employee@example.com"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={newEmployee.phone}
                  onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                  placeholder="017XXXXXXXX"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={newEmployee.role}
                  onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Role</option>
                  <option value="Sales Executive">Sales Executive</option>
                  <option value="Sales Associate">Sales Associate</option>
                  <option value="Store Assistant">Store Assistant</option>
                  <option value="Cashier">Cashier</option>
                </select>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 rounded-b-2xl flex gap-3">
              <button
                onClick={() => {
                  setShowAddEmployeeModal(false);
                  setNewEmployee({ name: '', email: '', phone: '', role: '' });
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEmployee}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Add Employee
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}