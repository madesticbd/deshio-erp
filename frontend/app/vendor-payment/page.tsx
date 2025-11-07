'use client';

import { useState } from 'react';
import { X, Plus, DollarSign, ShoppingCart, Eye } from 'lucide-react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';

interface Vendor {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  total: number;
  paid: number;
}

export default function VendorPaymentPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const [vendors, setVendors] = useState<Vendor[]>([
    { 
      id: 1, 
      name: 'ABC Traders', 
      phone: '+880 1712-345678',
      email: 'contact@abctraders.com',
      address: '123 Main St, Dhaka',
      total: 10000, 
      paid: 7000 
    },
    { 
      id: 2, 
      name: 'XYZ Supplies', 
      phone: '+880 1898-765432',
      email: 'info@xyzsupplies.com',
      address: '456 Commerce Ave, Dhaka',
      total: 5000, 
      paid: 5000 
    },
  ]);

  // Modal states
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [showAddPurchase, setShowAddPurchase] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showViewVendor, setShowViewVendor] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  // Form states
  const [vendorForm, setVendorForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });
  const [purchaseVendorId, setPurchaseVendorId] = useState('');
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [paymentType, setPaymentType] = useState('due');
  const [partialAmount, setPartialAmount] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');

  const handleAddVendor = () => {
    if (!vendorForm.name.trim()) return;

    const newVendor: Vendor = {
      id: Math.max(...vendors.map(v => v.id), 0) + 1,
      name: vendorForm.name.trim(),
      phone: vendorForm.phone.trim(),
      email: vendorForm.email.trim(),
      address: vendorForm.address.trim(),
      total: 0,
      paid: 0,
    };

    setVendors([...vendors, newVendor]);
    setVendorForm({ name: '', phone: '', email: '', address: '' });
    setShowAddVendor(false);
  };

  const handleAddPurchase = () => {
    const amount = parseFloat(purchaseAmount);
    if (!purchaseVendorId || isNaN(amount) || amount <= 0) return;

    let paidAmount = 0;
    
    if (paymentType === 'full') {
      paidAmount = amount;
    } else if (paymentType === 'partial') {
      const partial = parseFloat(partialAmount);
      if (isNaN(partial) || partial < 0 || partial > amount) return;
      paidAmount = partial;
    }

    setVendors((prev) =>
      prev.map((v) =>
        v.id === parseInt(purchaseVendorId)
          ? { 
              ...v, 
              total: v.total + amount,
              paid: v.paid + paidAmount
            }
          : v
      )
    );

    setPurchaseVendorId('');
    setPurchaseAmount('');
    setPaymentType('due');
    setPartialAmount('');
    setShowAddPurchase(false);
  };

  const handlePayment = () => {
    const amount = parseFloat(paymentAmount);
    if (!selectedVendor || isNaN(amount) || amount <= 0) return;

    setVendors((prev) =>
      prev.map((v) =>
        v.id === selectedVendor.id
          ? { ...v, paid: Math.min(v.total, v.paid + amount) }
          : v
      )
    );

    setPaymentAmount('');
    setSelectedVendor(null);
    setShowPayment(false);
  };

  const openPaymentModal = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setShowPayment(true);
    setPaymentAmount('');
  };

  const openViewVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setShowViewVendor(true);
  };

  const Modal = ({ isOpen, onClose, title, children, size = 'md' }: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: 'md' | 'lg';
  }) => {
    if (!isOpen) return null;

    const sizeClasses = {
      'md': 'max-w-md',
      'lg': 'max-w-lg'
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-0">
        <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full ${sizeClasses[size]} mx-4 max-h-[90vh] overflow-y-auto`}>
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>
    );
  };

  return (
    <div className={`${darkMode ? 'dark' : ''} flex min-h-screen`}>
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors">
        <Header
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        <main className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
              Vendor Payment Tracker
            </h1>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddVendor(true)}
                className="flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Vendor
              </button>
              <button
                onClick={() => setShowAddPurchase(true)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <ShoppingCart className="w-4 h-4" />
                New Purchase
              </button>
            </div>
          </div>

          <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <table className="min-w-full text-sm text-left text-gray-700 dark:text-gray-300">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3">Vendor</th>
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3">Total Amount</th>
                  <th className="px-6 py-3">Amount Paid</th>
                  <th className="px-6 py-3">Amount Due</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((vendor) => {
                  const due = vendor.total - vendor.paid;
                  return (
                    <tr
                      key={vendor.id}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                    >
                      <td className="px-6 py-3">
                        <div className="font-medium">{vendor.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{vendor.phone}</div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="text-xs">{vendor.email}</div>
                      </td>
                      <td className="px-6 py-3">৳{vendor.total.toFixed(2)}</td>
                      <td className="px-6 py-3 text-green-600 dark:text-green-400">
                        ৳{vendor.paid.toFixed(2)}
                      </td>
                      <td
                        className={`px-6 py-3 font-semibold ${
                          due > 0
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-green-600 dark:text-green-400'
                        }`}
                      >
                        ৳{due.toFixed(2)}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openViewVendor(vendor)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </button>
                          {due > 0 ? (
                            <button
                              onClick={() => openPaymentModal(vendor)}
                              className="flex items-center gap-1 bg-gray-900 hover:bg-gray-700 text-white text-xs px-3 py-2 rounded-lg transition-colors"
                            >
                              ৳
                              Pay Due
                            </button>
                          ) : (
                            <span className="text-gray-400 text-xs">Paid in full</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* Add Vendor Modal */}
      <Modal
        isOpen={showAddVendor}
        onClose={() => {
          setShowAddVendor(false);
          setVendorForm({ name: '', phone: '', email: '', address: '' });
        }}
        title="Add New Vendor"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Vendor Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={vendorForm.name}
              onChange={(e) => setVendorForm({...vendorForm, name: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              placeholder="Enter vendor name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={vendorForm.phone}
              onChange={(e) => setVendorForm({...vendorForm, phone: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              placeholder="+880 1xxx-xxxxxx"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={vendorForm.email}
              onChange={(e) => setVendorForm({...vendorForm, email: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              placeholder="vendor@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Address
            </label>
            <textarea
              value={vendorForm.address}
              onChange={(e) => setVendorForm({...vendorForm, address: e.target.value})}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-gray-500 focus:border-transparent resize-none"
              placeholder="Enter vendor address"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              onClick={() => {
                setShowAddVendor(false);
                setVendorForm({ name: '', phone: '', email: '', address: '' });
              }}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddVendor}
              className="px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Add Vendor
            </button>
          </div>
        </div>
      </Modal>

      {/* View Vendor Modal */}
      <Modal
        isOpen={showViewVendor}
        onClose={() => setShowViewVendor(false)}
        title="Vendor Details"
        size="lg"
      >
        {selectedVendor && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Vendor Name</p>
                <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  {selectedVendor.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Phone Number</p>
                <p className="text-base text-gray-900 dark:text-gray-100">
                  {selectedVendor.phone || 'N/A'}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Email Address</p>
              <p className="text-base text-gray-900 dark:text-gray-100">
                {selectedVendor.email || 'N/A'}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Address</p>
              <p className="text-base text-gray-900 dark:text-gray-100">
                {selectedVendor.address || 'N/A'}
              </p>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                Payment Summary
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Amount</p>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    ৳{selectedVendor.total.toFixed(2)}
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Amount Paid</p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    ৳{selectedVendor.paid.toFixed(2)}
                  </p>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Amount Due</p>
                  <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                    ৳{(selectedVendor.total - selectedVendor.paid).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setShowViewVendor(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Purchase Modal */}
      <Modal
        isOpen={showAddPurchase}
        onClose={() => {
          setShowAddPurchase(false);
          setPurchaseVendorId('');
          setPurchaseAmount('');
          setPaymentType('due');
          setPartialAmount('');
        }}
        title="Add New Purchase"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Vendor
            </label>
            <select
              value={purchaseVendorId}
              onChange={(e) => setPurchaseVendorId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Choose a vendor</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Purchase Amount
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={purchaseAmount}
              onChange={(e) => setPurchaseAmount(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Payment Status
            </label>
            <div className="space-y-3">
              <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <input
                  type="radio"
                  name="paymentType"
                  value="full"
                  checked={paymentType === 'full'}
                  onChange={(e) => setPaymentType(e.target.value)}
                  className="w-4 h-4 text-green-600 focus:ring-green-500"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Paying in Full
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Complete payment at time of purchase
                  </div>
                </div>
              </label>

              <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <input
                  type="radio"
                  name="paymentType"
                  value="partial"
                  checked={paymentType === 'partial'}
                  onChange={(e) => setPaymentType(e.target.value)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <div className="ml-3 flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Partial Payment
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Pay partial amount now, rest on due
                  </div>
                </div>
              </label>

              {paymentType === 'partial' && (
                <div className="ml-7 mt-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={purchaseAmount || 0}
                    value={partialAmount}
                    onChange={(e) => setPartialAmount(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter partial amount"
                  />
                </div>
              )}

              <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <input
                  type="radio"
                  name="paymentType"
                  value="due"
                  checked={paymentType === 'due'}
                  onChange={(e) => setPaymentType(e.target.value)}
                  className="w-4 h-4 text-yellow-600 focus:ring-yellow-500"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Buy on Due
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Pay later, full amount on due
                  </div>
                </div>
              </label>
            </div>
          </div>

          {purchaseAmount && (
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Purchase Amount:</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  ৳{parseFloat(purchaseAmount || '0').toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Paying Now:</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  ৳{paymentType === 'full' 
                   ? parseFloat(purchaseAmount || '0').toFixed(2)
                    : paymentType === 'partial'
                    ? parseFloat(partialAmount || '0').toFixed(2)
                    : '0.00'}
                </span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-gray-200 dark:border-gray-600">
                <span className="text-gray-600 dark:text-gray-400">Remaining Due:</span>
                <span className="font-bold text-yellow-600 dark:text-yellow-400">
                  ৳{paymentType === 'full'
                    ? '0.00'
                    : paymentType === 'partial'
                    ? (parseFloat(purchaseAmount || '0') - parseFloat(partialAmount || '0')).toFixed(2)
                    : parseFloat(purchaseAmount || '0').toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => {
                setShowAddPurchase(false);
                setPurchaseVendorId('');
                setPurchaseAmount('');
                setPaymentType('due');
                setPartialAmount('');
              }}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddPurchase}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              Add Purchase
            </button>
          </div>
        </div>
      </Modal>

      {/* Payment Modal */}
      <Modal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        title="Make Payment"
      >
        {selectedVendor && (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Vendor</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {selectedVendor.name}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Amount Due</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                ৳{(selectedVendor.total - selectedVendor.paid).toFixed(2)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Payment Amount
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={selectedVendor.total - selectedVendor.paid}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePayment()}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowPayment(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                className="px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}