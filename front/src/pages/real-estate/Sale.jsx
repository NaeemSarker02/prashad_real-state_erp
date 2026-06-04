import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FiPlus, FiTrash2, FiEdit, FiSearch, FiFilter, FiChevronLeft, FiChevronRight, FiX, FiDollarSign, FiUser, FiHome } from 'react-icons/fi';
import { useDebounce } from 'use-debounce';

const Sale = () => {
  const [sales, setSales] = useState([]);
  const [leads, setLeads] = useState([]);
  const [units, setUnits] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [status, setStatus] = useState('');
  const [form, setForm] = useState({
    id: null,
    lead_id: '',
    unit_id: '',
    total_amount: '',
    down_payment: '',
    monthly_charges: '',
    total_installments: '',
    monthly_paid_on: '',
    total_duration: '',
    employee_id: '',
    user_id: '',
    status: true,
  });
  const [formErrors, setFormErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteSaleId, setDeleteSaleId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const [debouncedKeyword] = useDebounce(keyword, 300);
  const [debouncedCustomerId] = useDebounce(customerId, 300);
  const [debouncedUnitId] = useDebounce(unitId, 300);
  const [debouncedEmployeeId] = useDebounce(employeeId, 300);
  const [debouncedPaymentStatus] = useDebounce(paymentStatus, 300);
  const [debouncedStatus] = useDebounce(status, 300);

  const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://192.168.0.249:8000/api';

  const filterParams = useMemo(() => ({
    keyword: debouncedKeyword,
    customer_id: debouncedCustomerId,
    unit_id: debouncedUnitId,
    employee_id: debouncedEmployeeId,
    payment_status: debouncedPaymentStatus,
    status: debouncedStatus !== '' ? (debouncedStatus ? 1 : 0) : '',
    limit: perPage,
    page,
  }), [debouncedKeyword, debouncedCustomerId, debouncedUnitId, debouncedEmployeeId, debouncedPaymentStatus, debouncedStatus, perPage, page]);

  const fetchSales = async (params, signal) => {
    if (params.keyword && params.keyword.trim().length < 2) {
      setSales([]);
      setTotalPages(1);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    setError(null);
    try {
      const searchParams = new URLSearchParams({
        limit: params.limit,
        page: params.page,
        ...(params.keyword && { keyword: params.keyword }),
        ...(params.customer_id && { customer_id: params.customer_id }),
        ...(params.unit_id && { unit_id: params.unit_id }),
        ...(params.employee_id && { employee_id: params.employee_id }),
        ...(params.payment_status && { payment_status: params.payment_status }),
        ...(params.status !== '' && { status: params.status }),
      });
      const endpoint = params.keyword || params.customer_id || params.unit_id || params.employee_id || params.payment_status || params.status !== ''
        ? `${baseUrl}/sales/search?${searchParams}`
        : `${baseUrl}/sales?${searchParams}`;
      const { data } = await axios.get(endpoint, { signal });
      setSales(data.data || []);
      setTotalPages(data.last_page || 1);
    } catch (err) {
      if (err.name === 'AbortError' || err.name === 'CanceledError') return;
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch sales';
      setError(errorMessage);
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setSearchLoading(false);
    }
  };

  const fetchDependencies = async () => {
    if (leads.length > 0 && units.length > 0 && employees.length > 0 && users.length > 0) return;
    setLoading(true);
    const controller = new AbortController();
    try {
      const [leadsRes, unitsRes, employeesRes, usersRes] = await Promise.all([
        axios.get(`${baseUrl}/leads?limit=0`, { signal: controller.signal }),
        axios.get(`${baseUrl}/units?limit=0`, { signal: controller.signal }),
        axios.get(`${baseUrl}/employees?limit=0`, { signal: controller.signal }),
        axios.get(`${baseUrl}/users?limit=0`, { signal: controller.signal }),
      ]);
      setLeads(leadsRes.data?.data || leadsRes.data || []);
      setUnits(unitsRes.data?.data || unitsRes.data || []);
      setEmployees(employeesRes.data?.data || employeesRes.data || []);
      setUsers(usersRes.data?.data || usersRes.data || []);
      setForm((prev) => ({ ...prev, user_id: usersRes.data?.data?.[0]?.id || usersRes.data?.[0]?.id || '' }));
    } catch (err) {
      if (err.name === 'AbortError' || err.name === 'CanceledError') return;
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch dependencies';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
      controller.abort();
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchSales(filterParams, controller.signal);
    return () => controller.abort();
  }, [filterParams]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setFormErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validateForm = () => {
    const errors = {};
    if (!form.lead_id) errors.lead_id = 'Lead is required';
    if (!form.unit_id) errors.unit_id = 'Unit is required';
    if (!form.total_amount) errors.total_amount = 'Total amount is required';
    else if (isNaN(form.total_amount) || Number(form.total_amount) < 0) errors.total_amount = 'Total amount must be a non-negative number';
    if (form.down_payment && (isNaN(form.down_payment) || Number(form.down_payment) < 0)) errors.down_payment = 'Down payment must be a non-negative number';
    if (form.monthly_charges && (isNaN(form.monthly_charges) || Number(form.monthly_charges) < 0)) errors.monthly_charges = 'Monthly charges must be a non-negative number';
    if (form.total_installments && (isNaN(form.total_installments) || Number(form.total_installments) < 0)) errors.total_installments = 'Total installments must be a non-negative integer';
    if (form.monthly_paid_on && (isNaN(form.monthly_paid_on) || Number(form.monthly_paid_on) < 1 || Number(form.monthly_paid_on) > 31)) errors.monthly_paid_on = 'Monthly paid on must be between 1 and 31';
    if (form.total_duration && (isNaN(form.total_duration) || Number(form.total_duration) < 0)) errors.total_duration = 'Total duration must be a non-negative integer';
    if (!form.user_id) errors.user_id = 'User is required';
    return errors;
  };

  const resetForm = () => {
    setForm({
      id: null,
      lead_id: '',
      unit_id: '',
      total_amount: '',
      down_payment: '',
      monthly_charges: '',
      total_installments: '',
      monthly_paid_on: '',
      total_duration: '',
      employee_id: '',
      user_id: users[0]?.id || '',
      status: true,
    });
    setFormErrors({});
    setIsEditing(false);
  };

  const openEditForm = (sale) => {
    setForm({
      id: sale.id,
      lead_id: sale.customer?.lead_id || sale.lead_id || '',
      unit_id: sale.unit_id || '',
      total_amount: sale.total_amount || '',
      down_payment: sale.down_payment || '',
      monthly_charges: sale.monthly_charges || '',
      total_installments: sale.total_installments || '',
      monthly_paid_on: sale.monthly_paid_on || '',
      total_duration: sale.total_duration || '',
      employee_id: sale.employee_id || '',
      user_id: sale.user_id || '',
      status: sale.status ?? true,
    });
    setFormErrors({});
    setIsEditing(true);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const formData = new FormData();
    formData.append('lead_id', form.lead_id);
    formData.append('unit_id', form.unit_id);
    formData.append('total_amount', form.total_amount || '0');
    formData.append('down_payment', form.down_payment || '0');
    formData.append('monthly_charges', form.monthly_charges || '0');
    formData.append('total_installments', form.total_installments || '0');
    if (form.monthly_paid_on) formData.append('monthly_paid_on', form.monthly_paid_on);
    formData.append('total_duration', form.total_duration || '0');
    if (form.employee_id) formData.append('employee_id', form.employee_id);
    formData.append('user_id', form.user_id);
    formData.append('status', form.status ? 1 : 0);

    try {
      setLoading(true);
      if (isEditing) {
        formData.append('_method', 'PUT');
        const { data } = await axios.post(`${baseUrl}/sales/${form.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success(data.message || 'Sale updated successfully');
      } else {
        const { data } = await axios.post(`${baseUrl}/sales`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success(data.message || 'Sale created successfully');
      }
      resetForm();
      setShowForm(false);
      setPage(1);
      fetchSales(filterParams);
    } catch (err) {
      if (err.response?.status === 422) {
        setFormErrors(err.response.data.errors || {});
        toast.error('Please check the form for errors.');
      } else {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to save sale';
        toast.error(`Error: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      const { data } = await axios.delete(`${baseUrl}/sales/${deleteSaleId}`);
      toast.success(data.message || 'Sale deleted successfully');
      setIsDeleteModalOpen(false);
      if (sales.length === 1 && page > 1) {
        setPage(page - 1);
      }
      fetchSales(filterParams);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete sale';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
      setDeleteSaleId(null);
    }
  };

  const openDeleteModal = (id) => {
    setDeleteSaleId(id);
    setIsDeleteModalOpen(true);
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.3 } },
  };

  const filterContainerVariants = {
    hidden: { opacity: 0, scaleY: 0.8 },
    visible: { opacity: 1, scaleY: 1, transition: { duration: 0.25, ease: 'easeOut' } },
    exit: { opacity: 0, scaleY: 0.8, transition: { duration: 0.25, ease: 'easeIn' } },
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowForm(false);
      setIsDeleteModalOpen(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const getPaymentStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'partial': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-8 lg:p-10 bg-transparent">
      <ToastContainer position="top-right" autoClose={3000} />
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8">Sales Management</h1>

      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-white bg-opacity-90 p-4 rounded-xl shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-2/3">
          <div className="relative w-full md:w-1/3">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search sales (min 2 characters)..."
              value={keyword}
              onChange={(e) => {
                const trimmedValue = e.target.value.trimStart();
                setKeyword(trimmedValue);
                if (trimmedValue === '') {
                  setPage(1);
                }
              }}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-700 placeholder-gray-400"
              disabled={loading}
            />
            {searchLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              <FiFilter className="text-base" />
              <span>Filters</span>
            </motion.button>
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-700 text-sm"
              disabled={loading}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          disabled={loading}
        >
          <FiPlus className="inline mr-2" /> Create Sale
        </motion.button>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            layout
            variants={filterContainerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ transformOrigin: 'top' }}
            className="mb-6 bg-white bg-opacity-90 p-3 rounded-lg shadow"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Customer</label>
                <select
                  value={customerId}
                  onChange={(e) => {
                    setCustomerId(e.target.value);
                    setPage(1);
                  }}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white text-gray-700 text-sm hover:bg-gray-50"
                  disabled={loading}
                >
                  <option value="">All Customers</option>
                  {leads.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.name || 'Unnamed Lead'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Unit</label>
                <select
                  value={unitId}
                  onChange={(e) => {
                    setUnitId(e.target.value);
                    setPage(1);
                  }}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white text-gray-700 text-sm hover:bg-gray-50"
                  disabled={loading}
                >
                  <option value="">All Units</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name || 'Unnamed Unit'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Employee</label>
                <select
                  value={employeeId}
                  onChange={(e) => {
                    setEmployeeId(e.target.value);
                    setPage(1);
                  }}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white text-gray-700 text-sm hover:bg-gray-50"
                  disabled={loading}
                >
                  <option value="">All Employees</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name || 'Unnamed Employee'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Payment Status</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => {
                    setPaymentStatus(e.target.value);
                    setPage(1);
                  }}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white text-gray-700 text-sm hover:bg-gray-50"
                  disabled={loading}
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="partial">Partial</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Active Status</label>
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setPage(1);
                  }}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white text-gray-700 text-sm hover:bg-gray-50"
                  disabled={loading}
                >
                  <option value="">All Status</option>
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white bg-opacity-90 rounded-xl shadow-sm overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">ID</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">Customer</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">Unit</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">Total Amount</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">Down Payment</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">Monthly Charges</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">Payment Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading || searchLoading ? (
              <tr>
                <td colSpan="9" className="text-center py-6 text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="9" className="text-center py-6 text-red-500">
                  {error}
                </td>
              </tr>
            ) : sales.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center py-6 text-gray-500">
                  {debouncedKeyword.trim() ? `No sales found for "${debouncedKeyword}"` : 'No sales found'}
                </td>
              </tr>
            ) : (
              sales.map((sale) => (
                <motion.tr
                  key={sale.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-6 py-4 text-sm text-gray-700">#{sale.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <FiUser className="text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <div className="font-medium text-gray-900">{sale.customer?.name || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                        <FiHome className="text-green-600" />
                      </div>
                      <div className="ml-3">
                        <div className="font-medium text-gray-900">{sale.unit?.name || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <div className="flex items-center">
                      <FiDollarSign className="text-gray-400 mr-1" />
                      {formatCurrency(sale.total_amount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{formatCurrency(sale.down_payment)}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{formatCurrency(sale.monthly_charges)}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(sale.payment_status)}`}>
                      {sale.payment_status || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        sale.status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {sale.status ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openEditForm(sale)}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                      disabled={loading}
                    >
                      <FiEdit className="inline" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openDeleteModal(sale.id)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                      disabled={loading}
                    >
                      <FiTrash2 className="inline" />
                    </motion.button>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center mt-8">
        <nav className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setPage(page - 1)}
            disabled={page === 1 || loading || searchLoading}
            className={`px-5 py-2 rounded-lg text-sm font-medium ${
              page === 1 || loading || searchLoading
                ? 'bg-gray-300 text-gray-900 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <FiChevronLeft className="inline mr-1" /> Previous
          </motion.button>
          {[...Array(totalPages).keys()].map((p) => (
            <motion.button
              key={p + 1}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPage(p + 1)}
              className={`px-5 py-2 rounded-lg text-sm font-medium ${
                page === p + 1
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              disabled={loading || searchLoading}
            >
              {p + 1}
            </motion.button>
          ))}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages || loading || searchLoading}
            className={`px-5 py-2 rounded-lg text-sm font-medium ${
              page === totalPages || loading || searchLoading
                ? 'bg-gray-300 text-gray-900 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Next <FiChevronRight className="inline ml-1" />
          </motion.button>
        </nav>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleBackdropClick}
            className="fixed inset-0 bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className="bg-white bg-opacity-90 rounded-xl p-8 w-full max-w-lg shadow-lg max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {isEditing ? 'Edit Sale' : 'Create Sale'}
                </h2>
                <button
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Lead <span className="text-red-600">*</span>
                  </label>
                  <select
                    name="lead_id"
                    value={form.lead_id}
                    onChange={handleInputChange}
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-700 ${
                      formErrors.lead_id ? 'border-red-600' : 'border-gray-200'
                    }`}
                    disabled={loading}
                  >
                    <option value="">Select Lead</option>
                    {leads.map((lead) => (
                      <option key={lead.id} value={lead.id}>
                        {lead.name || 'Unnamed Lead'}
                      </option>
                    ))}
                  </select>
                  {formErrors.lead_id && (
                    <p className="text-red-500 text-sm mt-2">{formErrors.lead_id}</p>
                  )}
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Unit <span className="text-red-600">*</span>
                  </label>
                  <select
                    name="unit_id"
                    value={form.unit_id}
                    onChange={handleInputChange}
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-700 ${
                      formErrors.unit_id ? 'border-red-600' : 'border-gray-200'
                    }`}
                    disabled={loading}
                  >
                    <option value="">Select Unit</option>
                    {units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name || 'Unnamed Unit'}
                      </option>
                    ))}
                  </select>
                  {formErrors.unit_id && (
                    <p className="text-red-500 text-sm mt-2">{formErrors.unit_id}</p>
                  )}
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Total Amount <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiDollarSign className="text-gray-400" />
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="total_amount"
                      placeholder="0.00"
                      value={form.total_amount}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-700 ${
                        formErrors.total_amount ? 'border-red-600' : 'border-gray-200'
                      }`}
                      disabled={loading}
                    />
                  </div>
                  {formErrors.total_amount && (
                    <p className="text-red-500 text-sm mt-2">{formErrors.total_amount}</p>
                  )}
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-600 mb-2">Down Payment</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiDollarSign className="text-gray-400" />
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="down_payment"
                      placeholder="0.00"
                      value={form.down_payment}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-700 ${
                        formErrors.down_payment ? 'border-red-600' : 'border-gray-200'
                      }`}
                      disabled={loading}
                    />
                  </div>
                  {formErrors.down_payment && (
                    <p className="text-red-500 text-sm mt-2">{formErrors.down_payment}</p>
                  )}
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-600 mb-2">Monthly Charges</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiDollarSign className="text-gray-400" />
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="monthly_charges"
                      placeholder="0.00"
                      value={form.monthly_charges}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-700 ${
                        formErrors.monthly_charges ? 'border-red-600' : 'border-gray-200'
                      }`}
                      disabled={loading}
        />
                  </div>
                  {formErrors.monthly_charges && (
                    <p className="text-red-500 text-sm mt-2">{formErrors.monthly_charges}</p>
                  )}
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-600 mb-2">Total Installments</label>
                  <input
                    type="number"
                    min="0"
                    name="total_installments"
                    placeholder="0"
                    value={form.total_installments}
                    onChange={handleInputChange}
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-700 ${
                      formErrors.total_installments ? 'border-red-600' : 'border-gray-200'
                    }`}
                    disabled={loading}
                  />
                  {formErrors.total_installments && (
                    <p className="text-red-500 text-sm mt-2">{formErrors.total_installments}</p>
                  )}
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-600 mb-2">Monthly Paid On</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    name="monthly_paid_on"
                    placeholder="Day of month (1-31)"
                    value={form.monthly_paid_on}
                    onChange={handleInputChange}
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-700 ${
                      formErrors.monthly_paid_on ? 'border-red-600' : 'border-gray-200'
                    }`}
                    disabled={loading}
                  />
                  {formErrors.monthly_paid_on && (
                    <p className="text-red-500 text-sm mt-2">{formErrors.monthly_paid_on}</p>
                  )}
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-600 mb-2">Total Duration</label>
                  <input
                    type="number"
                    min="0"
                    name="total_duration"
                    placeholder="0"
                    value={form.total_duration}
                    onChange={handleInputChange}
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-700 ${
                      formErrors.total_duration ? 'border-red-600' : 'border-gray-200'
                    }`}
                    disabled={loading}
                  />
                  {formErrors.total_duration && (
                    <p className="text-red-500 text-sm mt-2">{formErrors.total_duration}</p>
                  )}
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-600 mb-2">Employee</label>
                  <select
                    name="employee_id"
                    value={form.employee_id}
                    onChange={handleInputChange}
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-700 ${
                      formErrors.employee_id ? 'border-red-600' : 'border-gray-200'
                    }`}
                    disabled={loading}
                  >
                    <option value="">Select Employee</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name || 'Unnamed Employee'}
                      </option>
                    ))}
                  </select>
                  {formErrors.employee_id && (
                    <p className="text-red-500 text-sm mt-2">{formErrors.employee_id}</p>
                  )}
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    User <span className="text-red-600">*</span>
                  </label>
                  <select
                    name="user_id"
                    value={form.user_id}
                    onChange={handleInputChange}
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-700 ${
                      formErrors.user_id ? 'border-red-600' : 'border-gray-200'
                    }`}
                    disabled={loading}
                  >
                    <option value="">Select User</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name || 'Unnamed User'} ({user.email || 'N/A'})
                      </option>
                    ))}
                  </select>
                  {formErrors.user_id && (
                    <p className="text-red-500 text-sm mt-2">{formErrors.user_id}</p>
                  )}
                </div>
                <div className="mb-6 flex items-center">
                  <input
                    type="checkbox"
                    name="status"
                    checked={form.status}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-400 border-gray-300 rounded"
                    disabled={loading}
                  />
                  <label className="ml-2 text-sm font-medium text-gray-600">Active</label>
                </div>
                <div className="flex justify-end gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => {
                      resetForm();
                      setShowForm(false);
                    }}
                    className="bg-gray-200 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                    disabled={loading}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className={`px-5 py-2 rounded-lg text-white font-medium ${
                      loading || Object.keys(validateForm()).length > 0
                        ? 'bg-blue-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    disabled={loading || Object.keys(validateForm()).length > 0}
                  >
                    {loading
                      ? isEditing
                        ? 'Updating...'
                        : 'Creating...'
                      : isEditing
                      ? 'Update'
                      : 'Create'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDeleteModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleBackdropClick}
            className="fixed inset-0 bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className="bg-white bg-opacity-90 rounded-xl p-8 w-full max-w-md shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Confirm Deletion</h2>
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete this sale? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="bg-gray-200 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDelete}
                  className={`px-5 py-2 rounded-lg text-white font-medium ${
                    loading ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                  }`}
                  disabled={loading}
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Sale;