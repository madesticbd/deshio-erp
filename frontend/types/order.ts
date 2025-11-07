// types/order.ts - Updated with Store field

export interface Customer {
  name: string;
  email: string;
  phone: string;
}

export interface DeliveryAddress {
  division: string;
  district: string;
  city: string;
  zone: string;
  area?: string;
  address: string;
  postalCode: string;
}

export interface Product {
  id: number;
  productId?: number | string;
  productName: string;
  size: string;
  qty: number;
  price: number;
  amount: number;
  discount: number;
  barcodes?: string[];
  barcode?: string;
  isDefective?: boolean;
  defectId?: string;
}

export interface Amounts {
  subtotal: number;
  totalDiscount: number;
  vat: number;
  vatRate: number;
  transportCost: number;
  total: number;
}

export interface Payments {
  sslCommerz: number;
  advance: number;
  transactionId?: string;
  totalPaid: number;
  due: number;
}

export interface Store {
  id: string;
  name: string;
  location: string;
  type: string;
}

export interface Order {
  id: number;
  date: string;
  customer: Customer;
  deliveryAddress: DeliveryAddress;
  products: Product[];
  subtotal: number;
  amounts?: Amounts;
  payments: Payments;
  salesBy: string;
  status?: string;
  store?: Store; 
  createdAt?: string;
  updatedAt?: string;
}