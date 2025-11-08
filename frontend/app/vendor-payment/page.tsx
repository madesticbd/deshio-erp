'use client';

import { useState, useEffect } from 'react';
import { X, Plus, DollarSign, ShoppingCart, MoreVertical, Eye, Receipt } from 'lucide-react';
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

interface Transaction {
  id: number;
  vendorId: number;
  type: 'purchase' | 'payment';
  amount: number;
  date: string;
  note?: string;
}

const Modal = ({ isOpen, onClose, title, children, size = 'md' }: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'md' | 'lg' | 'xl';
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    'md': 'max-w-md',
    'lg': 'max-w-lg',
    'xl': 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-md overflow-y-auto">
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full ${sizeClasses[size]} mx-4 max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

export default function VendorPaymentPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Load from localStorage on mount
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const savedVendors = localStorage.getItem('vendors');
    const savedTransactions = localStorage.getItem('vendorTransactions');

    if (savedVendors) {
      setVendors(JSON.parse(savedVendors));
    } else {
      setVendors([
        { id: 1, name: 'ABC Traders', phone: '+880 1712-345678', email: 'contact@abctraders.com', address: '123 Main St, Dhaka', total: 10000, paid: 7000 },
        { id: 2, name: 'XYZ Supplies', phone: '+880 1898-765432', email: 'info@xyzsupplies.com', address: '456 Commerce Ave, Dhaka', total: 5000, paid: 5000 },
      ]);
    }

    if (savedTransactions) {
      setTransactions(JSON.parse(savedTransactions));
    }
  }, []);
  

  // Save to localStorage whenever vendors or transactions change
  useEffect(() => {
    if (vendors.length > 0) {
      localStorage.setItem('vendors', JSON.stringify(vendors));
    }
  }, [vendors]);

  useEffect(() => {
    if (transactions.length > 0) {
      localStorage.setItem('vendorTransactions', JSON.stringify(transactions));
    }
  }, [transactions]);
  

  // Modal states
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [showAddPurchase, setShowAddPurchase] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showViewVendor, setShowViewVendor] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<number | null>(null);

  // Form states
  const [vendorForm, setVendorForm] = useState({ name: '', phone: '', email: '', address: '' });
  const [purchaseVendorId, setPurchaseVendorId] = useState('');
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [paymentType, setPaymentType] = useState('due');
  const [partialAmount, setPartialAmount] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');

  // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = () => {
        if (dropdownOpen !== null) {
          setDropdownOpen(null);
        }
      };

      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }, [dropdownOpen]);
  // Generate transaction ID
  const generateTransactionId = () => Math.max(...transactions.map(t => t.id), 0) + 1;

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
    let note = '';

    if (paymentType === 'full') {
      paidAmount = amount;
      note = 'Paid in full';
    } else if (paymentType === 'partial') {
      const partial = parseFloat(partialAmount);
      if (isNaN(partial) || partial < 0 || partial > amount) return;
      paidAmount = partial;
      note = `Partial payment: ৳${partial.toFixed(2)}`;
    } else {
      note = 'Buy on due';
    }

    const vendorId = parseInt(purchaseVendorId);
    const newTransactionId = generateTransactionId();

    // Add purchase transaction
    setTransactions(prev => [...prev, {
      id: newTransactionId,
      vendorId,
      type: 'purchase',
      amount,
      date: new Date().toISOString(),
      note
    }]);

    // Add payment transaction if any
    if (paidAmount > 0) {
      setTransactions(prev => [...prev, {
        id: generateTransactionId(),
        vendorId,
        type: 'payment',
        amount: paidAmount,
        date: new Date().toISOString(),
        note: 'Purchase payment'
      }]);
    }

    // Update vendor totals
    setVendors(prev =>
      prev.map(v =>
        v.id === vendorId
          ? { ...v, total: v.total + amount, paid: v.paid + paidAmount }
          : v
      )
    );

    // Reset form
    setPurchaseVendorId('');
    setPurchaseAmount('');
    setPaymentType('due');
    setPartialAmount('');
    setShowAddPurchase(false);
  };

  const handlePayment = () => {
    const amount = parseFloat(paymentAmount);
    if (!selectedVendor || isNaN(amount) || amount <= 0) return;

    const newTransaction: Transaction = {
      id: generateTransactionId(),
      vendorId: selectedVendor.id,
      type: 'payment',
      amount,
      date: new Date().toISOString(),
      note: 'Due payment'
    };

    setTransactions(prev => [...prev, newTransaction]);

    setVendors(prev =>
      prev.map(v =>
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

  const openTransactions = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setShowTransactions(true);
    setDropdownOpen(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
                  <th className="px-6 py-3 text-center">Actions</th>
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
                          

                          {due > 0 ? (
                            <button
                              onClick={() => openPaymentModal(vendor)}
                              className="flex items-center gap-1 bg-gray-900 hover:bg-gray-700 text-white text-xs px-3 py-2 rounded-lg transition-colors"
                            >
                              ৳ Pay Due
                            </button>
                          ) : (
                          <span className="text-gray-600 dark:text-gray-400 text-xs bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-lg">Paid in full</span>
                          )}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDropdownOpen(dropdownOpen === vendor.id ? null : vendor.id);
                              }}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                              title="More options"
                            >
                              <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </button>

                            {dropdownOpen === vendor.id && (
                              <div className="fixed mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
                                   style={{
                                     transform: 'translateX(-100%)',
                                     marginLeft: '-12px'
                                   }}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openViewVendor(vendor);
                                  }}
                                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-t-lg"
                                >
                                  <Eye className="w-4 h-4" />
                                  View Vendor Details
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openTransactions(vendor);
                                  }}
                                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-b-lg"
                                >
                                  <Receipt className="w-4 h-4" />
                                  View Transactions
                                </button>
                              </div>
                            )}
                          </div>
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

      {/* Transaction History Modal */}
      <Modal
        isOpen={showTransactions}
        onClose={() => setShowTransactions(false)}
        title="Transaction History"
      >
        {selectedVendor && (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Vendor</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {selectedVendor.name}
              </p>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {transactions
                .filter(t => t.vendorId === selectedVendor.id)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((trans) => (
                  <div
                    key={trans.id}
                    className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        trans.type === 'purchase' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-green-100 dark:bg-green-900/30'
                      }`}>
                        {trans.type === 'purchase' ? (
                          <ShoppingCart className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {trans.type === 'purchase' ? 'Purchase' : 'Payment'}
                        </p>
                        {trans.note && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">{trans.note}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        trans.type === 'purchase' ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'
                      }`}>
                        {trans.type === 'purchase' ? '+' : '-'}৳{trans.amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(trans.date)}
                      </p>
                    </div>
                  </div>
                ))}

              {transactions.filter(t => t.vendorId === selectedVendor.id).length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No transactions yet.
                </p>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setShowTransactions(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Vendor Modal */}
      <Modal
        isOpen={showAddVendor}
        onClose={() => {
          setShowAddVendor(false);
          setVendorForm({ name: '', phone: '', email: '', address: '' });
        }}
        title="Add New Vendor"
      >
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Vendor Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={vendorForm.name}
              onChange={(e) => setVendorForm({...vendorForm, name: e.target.value})}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              placeholder="Enter vendor name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={vendorForm.phone}
              onChange={(e) => setVendorForm({...vendorForm, phone: e.target.value})}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              placeholder="+880 1xxx-xxxxxx"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={vendorForm.email}
              onChange={(e) => setVendorForm({...vendorForm, email: e.target.value})}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              placeholder="vendor@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Address
            </label>
            <textarea
              value={vendorForm.address}
              onChange={(e) => setVendorForm({...vendorForm, address: e.target.value})}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-gray-500 focus:border-transparent resize-none"
              placeholder="Enter vendor address"
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
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
      >
        {selectedVendor && (
          <div className="space-y-3">
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
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Select Vendor
            </label>
            <select
              value={purchaseVendorId}
              onChange={(e) => setPurchaseVendorId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Purchase Amount
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={purchaseAmount}
              onChange={(e) => setPurchaseAmount(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Payment Status
            </label>
            <div className="space-y-2">
              <label className="flex items-center p-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <input
                  type="radio"
                  name="paymentType"
                  value="full"
                  checked={paymentType === 'full'}
                  onChange={(e) => setPaymentType(e.target.value)}
                  className="w-4 h-4 text-green-600 focus:ring-green-500"
                />
                <div className="ml-2">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Paying in Full
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Complete payment at time of purchase
                  </div>
                </div>
              </label>

              <label className="flex items-center p-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <input
                  type="radio"
                  name="paymentType"
                  value="partial"
                  checked={paymentType === 'partial'}
                  onChange={(e) => setPaymentType(e.target.value)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <div className="ml-2 flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Partial Payment
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Pay partial amount now, rest on due
                  </div>
                </div>
              </label>

              <div className={`ml-6 transition-all ${paymentType === 'partial' ? 'opacity-100 max-h-16' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={purchaseAmount || 0}
                  value={partialAmount}
                  onChange={(e) => setPartialAmount(e.target.value)}
                  disabled={paymentType !== 'partial'}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  placeholder="Enter partial amount"
                />
              </div>

              <label className="flex items-center p-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <input
                  type="radio"
                  name="paymentType"
                  value="due"
                  checked={paymentType === 'due'}
                  onChange={(e) => setPaymentType(e.target.value)}
                  className="w-4 h-4 text-yellow-600 focus:ring-yellow-500"
                />
                <div className="ml-2">
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
            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
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
              <div className="flex justify-between text-sm pt-1 border-t border-gray-200 dark:border-gray-600">
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