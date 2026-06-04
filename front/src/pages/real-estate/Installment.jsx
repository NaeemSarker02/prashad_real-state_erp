import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FiPlus, FiTrash2, FiEdit, FiSearch, FiFilter, FiChevronLeft, FiChevronRight, FiX, FiDollarSign, FiUser, FiCalendar } from 'react-icons/fi';
import { useDebounce } from 'use-debounce';

const Installment = () => {
  const [installments, setInstallments] = useState([]);
  const [sales, setSales] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [saleIdFilter, setSaleIdFilter] = useState('');
  const [installmentAmountFilter, setInstallmentAmountFilter] = useState('');
  const [paidAmountFilter, setPaidAmountFilter] = useState('');
  const [dueAmountFilter, setDueAmountFilter] = useState('');
  const [dueDateFilter, setDueDateFilter] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [debouncedKeyword] = useDebounce(keyword, 300);
  const [debouncedSaleIdFilter] = useDebounce(saleIdFilter, 300);
  const [debouncedInstallmentAmountFilter] = useDebounce(installmentAmountFilter, 300);
  const [debouncedPaidAmountFilter] = useDebounce(paidAmountFilter, 300);
  const [debouncedDueAmountFilter] = useDebounce(dueAmountFilter, 300);
  const [debouncedDueDateFilter] = useDebounce(dueDateFilter, 300);
  const [debouncedUserIdFilter] = useDebounce(userIdFilter, 300);
  const [debouncedStatusFilter] = useDebounce(statusFilter, 300);
  const [form, setForm] = useState({
    id: null,
    sale_id: '',
    installment_amount: '',
    paid_amount: '',
    due_amount: '',
    due_date: '',
    receipt_image: null,
    user_id: '',
    status: 'pending',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteInstallmentId, setDeleteInstallmentId] = useState(null);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://192.168.0.249:8000/api';

  const filterParams = {
    keyword: debouncedKeyword,
    sale_id: debouncedSaleIdFilter,
    installment_amount: debouncedInstallmentAmountFilter,
    paid_amount: debouncedPaidAmountFilter,
    due_amount: debouncedDueAmountFilter,
    due_date: debouncedDueDateFilter,
    user_id: debouncedUserIdFilter,
    status: debouncedStatusFilter,
    limit: perPage,
    page,
  };

  const fetchInstallments = async () => {
    if (filterParams.keyword.trim().length < 2 && filterParams.keyword !== '' && !filterParams.sale_id && !filterParams.installment_amount && !filterParams.paid_amount && !filterParams.due_amount && !filterParams.due_date && !filterParams.user_id && !filterParams.status) {
      setInstallments([]);
      setTotalPages(1);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    setError(null);
    try {
      const searchParams = new URLSearchParams({
        limit: filterParams.limit,
        page: filterParams.page,
        ...(filterParams.keyword && { keyword: filterParams.keyword }),
        ...(filterParams.sale_id && { sale_id: filterParams.sale_id }),
        ...(filterParams.installment_amount && { installment_amount: filterParams.installment_amount }),
        ...(filterParams.paid_amount && { paid_amount: filterParams.paid_amount }),
        ...(filterParams.due_amount && { due_amount: filterParams.due_amount }),
        ...(filterParams.due_date && { due_date: filterParams.due_date }),
        ...(filterParams.user_id && { user_id: filterParams.user_id }),
        ...(filterParams.status && { status: filterParams.status }),
      });
      const endpoint = filterParams.keyword || filterParams.sale_id || filterParams.installment_amount || filterParams.paid_amount || filterParams.due_amount || filterParams.due_date || filterParams.user_id || filterParams.status
        ? `${baseUrl}/installments/search?${searchParams}`
        : `${baseUrl}/installments?${searchParams}`;
      const { data } = await axios.get(endpoint, {
        headers: {
          // 'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setInstallments(data.data?.data || data.data || []);
      setTotalPages(data.data?.last_page || data.last_page || 1);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch installments';
      setError(errorMessage);
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setSearchLoading(false);
    }
  };

  const fetchDependencies = async () => {
    setLoading(true);
    try {
      const [salesRes, usersRes] = await Promise.all([
        axios.get(`${baseUrl}/sales?limit=0`, {
          headers: {
            // 'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }),
        axios.get(`${baseUrl}/users?limit=0`, {
          headers: {
            // 'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }),
      ]);
      setSales(salesRes.data?.data || salesRes.data || []);
      setUsers(usersRes.data?.data || usersRes.data || []);
      setForm((prev) => ({ ...prev, user_id: usersRes.data?.data?.[0]?.id || usersRes.data?.[0]?.id || '' }));
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch dependencies';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    fetchInstallments();
  }, [page, perPage, debouncedKeyword, debouncedSaleIdFilter, debouncedInstallmentAmountFilter, debouncedPaidAmountFilter, debouncedDueAmountFilter, debouncedDueDateFilter, debouncedUserIdFilter, debouncedStatusFilter]);

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file') {
      const validFiles = Array.from(files).filter((file) => {
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        const maxSize = 2 * 1024 * 1024; // 2MB
        if (!validTypes.includes(file.type)) {
          toast.error(`File ${file.name} is not a valid type (jpg, png, pdf allowed)`);
          return false;
        }
        if (file.size > maxSize) {
          toast.error(`File ${file.name} exceeds 2MB limit`);
          return false;
        }
        return true;
      });
      setForm((prev) => ({ ...prev, [name]: validFiles }));
      const previews = validFiles.map((file) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve({ url: reader.result, name: file.name });
          reader.readAsDataURL(file);
        });
      });
      Promise.all(previews).then((results) => setImagePreviews(results));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleImageDelete = (index) => {
    setForm((prev) => ({
      ...prev,
      receipt_image: prev.receipt_image.filter((_, i) => i !== index),
    }));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const errors = {};
    if (!form.sale_id) errors.sale_id = 'Sale is required';
    if (!form.installment_amount) errors.installment_amount = 'Installment amount is required';
    else if (isNaN(form.installment_amount) || parseFloat(form.installment_amount) <= 0)
      errors.installment_amount = 'Installment amount must be a positive number';
    if (form.paid_amount && (isNaN(form.paid_amount) || parseFloat(form.paid_amount) < 0))
      errors.paid_amount = 'Paid amount must be a non-negative number';
    if (form.due_amount && (isNaN(form.due_amount) || parseFloat(form.due_amount) < 0))
      errors.due_amount = 'Due amount must be a non-negative number';
    if (!form.due_date) errors.due_date = 'Due date is required';
    if (!form.user_id) errors.user_id = 'User is required';
    return errors;
  };

  const resetForm = () => {
    setForm({
      id: null,
      sale_id: '',
      installment_amount: '',
      paid_amount: '',
      due_amount: '',
      due_date: '',
      receipt_image: null,
      user_id: users[0]?.id || '',
      status: 'pending',
      notes: '',
    });
    setFormErrors({});
    setIsEditing(false);
    setImagePreviews([]);
  };

  const openEditForm = (installment) => {
    setForm({
      id: installment.id,
      sale_id: installment.sale_id || '',
      installment_amount: installment.installment_amount || '',
      paid_amount: installment.paid_amount || '',
      due_amount: installment.due_amount || '',
      due_date: installment.due_date ? installment.due_date.split('T')[0] : '',
      receipt_image: null,
      user_id: installment.user_id || '',
      status: installment.status || 'pending',
      notes: installment.notes || '',
    });
    setFormErrors({});
    setIsEditing(true);
    setShowForm(true);
    setImagePreviews([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error('Please correct the form errors');
      return;
    }

    const formData = new FormData();
    formData.append('sale_id', form.sale_id);
    formData.append('installment_amount', form.installment_amount);
    if (form.paid_amount) formData.append('paid_amount', form.paid_amount);
    if (form.due_amount) formData.append('due_amount', form.due_amount);
    if (form.due_date) formData.append('due_date', form.due_date);
    if (form.receipt_image && form.receipt_image.length > 0) {
      form.receipt_image.forEach((file) => formData.append('receipt_image[]', file));
    }
    formData.append('user_id', form.user_id);
    if (form.status) formData.append('status', form.status);
    if (form.notes) formData.append('notes', form.notes);

    try {
      setLoading(true);
      let newInstallment;
      if (isEditing && form.id) {
        formData.append('_method', 'PUT');
        const { data } = await axios.post(`${baseUrl}/installments/${form.id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            // 'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        newInstallment = data.data;
        toast.success(data.message || 'Installment updated successfully');
      } else {
        const { data } = await axios.post(`${baseUrl}/installments`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            // 'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        newInstallment = data.data;
        toast.success(data.message || 'Installment created successfully');
      }
      resetForm();
      setShowForm(false);
      setPage(1);
      fetchInstallments();
    } catch (err) {
      console.error('Submit Error:', err.response?.data || err);
      if (err.response?.status === 422) {
        const serverErrors = err.response.data.errors || {};
        setFormErrors(serverErrors);
        const errorMessages = Object.values(serverErrors).flat().join(', ');
        toast.error(`Validation Error: ${errorMessages || 'Please check the form'}`);
      } else if (err.response?.status === 500) {
        toast.error('Server error occurred. Please check the server logs.');
      } else if (err.response?.status === 404) {
        toast.error('Resource not found');
      } else {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to save installment';
        toast.error(`Error: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      const { data } = await axios.delete(`${baseUrl}/installments/${deleteInstallmentId}`, {
        headers: {
          // 'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      toast.success(data.message || 'Installment deleted successfully');
      setIsDeleteModalOpen(false);
      if (installments.length === 1 && page > 1) {
        setPage(page - 1);
      }
      fetchInstallments();
    } catch (err) {
      console.error('Delete Error:', err.response?.data || err);
      if (err.response?.status === 404) {
        toast.error('Installment not found');
      } else {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to delete installment';
        toast.error(`Error: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
      setDeleteInstallmentId(null);
    }
  };

  const openDeleteModal = (id) => {
    setDeleteInstallmentId(id);
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
      setImagePreviews([]);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-8 lg:p-10 bg-transparent">
      <ToastContainer position="top-right" autoClose={3000} />
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8">Installment Management</h1>

      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-white bg-opacity-90 p-4 rounded-xl shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-2/3">
          <div className="relative w-full md:w-1/3">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search installments (min 2 characters)..."
              value={keyword}
              onChange={(e) => {
                const trimmedValue = e.target.value.trimStart();
                setKeyword(trimmedValue);
                if (trimmedValue === '') {
                  setPage(1);
                  fetchInstallments();
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
          <FiPlus className="inline mr-2" /> Create Installment
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
                <label className="block text-xs font-medium text-gray-600 mb-1">Sale</label>
                <select
                  value={saleIdFilter}
                  onChange={(e) => {
                    setSaleIdFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white text-gray-700 text-sm hover:bg-gray-50"
                  disabled={loading}
                >
                  <option value="">All Sales</option>
                  {sales.map((sale) => (
                    <option key={sale.id} value={sale.id}>
                      Sale ID: {sale.id}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Installment Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={installmentAmountFilter}
                  onChange={(e) => {
                    setInstallmentAmountFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white text-gray-700 text-sm hover:bg-gray-50"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Paid Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={paidAmountFilter}
                  onChange={(e) => {
                    setPaidAmountFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white text-gray-700 text-sm hover:bg-gray-50"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Due Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={dueAmountFilter}
                  onChange={(e) => {
                    setDueAmountFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white text-gray-700 text-sm hover:bg-gray-50"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDateFilter}
                  onChange={(e) => {
                    setDueDateFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white text-gray-700 text-sm hover:bg-gray-50"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">User</label>
                <select
                  value={userIdFilter}
                  onChange={(e) => {
                    setUserIdFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white text-gray-700 text-sm hover:bg-gray-50"
                  disabled={loading}
                >
                  <option value="">All Users</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name || 'Unnamed User'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white text-gray-700 text-sm hover:bg-gray-50"
                  disabled={loading}
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="done">Done</option>
                  <option value="overdue">Overdue</option>
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
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">Sale</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">Installment Amount</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">Paid Amount</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">Due Amount</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">Due Date</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">User</th>
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
            ) : installments.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center py-6 text-gray-500">
                  {debouncedKeyword.trim() || debouncedSaleIdFilter || debouncedInstallmentAmountFilter || debouncedPaidAmountFilter || debouncedDueAmountFilter || debouncedDueDateFilter || debouncedUserIdFilter || debouncedStatusFilter
                    ? 'No installments found'
                    : 'No installments found'}
                </td>
              </tr>
            ) : (
              installments.map((installment) => (
                <motion.tr
                  key={installment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-6 py-4 text-sm text-gray-700">#{installment.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {installment.sale ? `Sale #${installment.sale.id}` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <FiDollarSign className="text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <div className="font-medium text-gray-900">{installment.installment_amount || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <FiDollarSign className="text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <div className="font-medium text-gray-900">{installment.paid_amount || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <FiDollarSign className="text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <div className="font-medium text-gray-900">{installment.due_amount || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <FiCalendar className="text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <div className="font-medium text-gray-900">
                          {installment.due_date ? new Date(installment.due_date).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        installment.status === 'done'
                          ? 'bg-green-100 text-green-700'
                          : installment.status === 'overdue'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {installment.status || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <FiUser className="text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <div className="font-medium text-gray-900">{installment.user?.name || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openEditForm(installment)}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                      disabled={loading}
                    >
                      <FiEdit className="inline" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openDeleteModal(installment.id)}
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
                  {isEditing ? 'Edit Installment' : 'Create Installment'}
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
                    Sale <span className="text-red-600">*</span>
                  </label>
                  <select
                    name="sale_id"
                    value={form.sale_id}
                    onChange={handleInputChange}
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-700 ${
                      formErrors.sale_id ? 'border-red-600' : 'border-gray-200'
                    }`}
                    disabled={loading}
                  >
                    <option value="">Select Sale</option>
                    {sales.map((sale) => (
                      <option key={sale.id} value={sale.id}>
                        Sale ID: {sale.id} - Customer ID: {sale.customer_id} - Amount: {sale.total_amount}
                      </option>
                    ))}
                  </select>
                  {formErrors.sale_id && (
                    <p className="text-red-500 text-sm mt-2">{formErrors.sale_id}</p>
                  )}
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Installment Amount <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiDollarSign className="text-gray-400" />
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="installment_amount"
                      placeholder="Enter installment amount"
                      value={form.installment_amount}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-700 ${
                        formErrors.installment_amount ? 'border-red-600' : 'border-gray-200'
                      }`}
                      disabled={loading}
                    />
                  </div>
                  {formErrors.installment_amount && (
                    <p className="text-red-500 text-sm mt-2">{formErrors.installment_amount}</p>
                  )}
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-600 mb-2">Paid Amount</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiDollarSign className="text-gray-400" />
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="paid_amount"
                      placeholder="Enter paid amount"
                      value={form.paid_amount}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-700 ${
                        formErrors.paid_amount ? 'border-red-600' : 'border-gray-200'
                      }`}
                      disabled={loading}
                    />
                  </div>
                  {formErrors.paid_amount && (
                    <p className="text-red-500 text-sm mt-2">{formErrors.paid_amount}</p>
                  )}
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-600 mb-2">Due Amount</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiDollarSign className="text-gray-400" />
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="due_amount"
                      placeholder="Enter due amount"
                      value={form.due_amount}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-700 ${
                        formErrors.due_amount ? 'border-red-600' : 'border-gray-200'
                      }`}
                      disabled={loading}
                    />
                  </div>
                  {formErrors.due_amount && (
                    <p className="text-red-500 text-sm mt-2">{formErrors.due_amount}</p>
                  )}
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Due Date <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiCalendar className="text-gray-400" />
                    </div>
                    <input
                      type="date"
                      name="due_date"
                      value={form.due_date}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-700 ${
                        formErrors.due_date ? 'border-red-600' : 'border-gray-200'
                      }`}
                      disabled={loading}
                    />
                  </div>
                  {formErrors.due_date && (
                    <p className="text-red-500 text-sm mt-2">{formErrors.due_date}</p>
                  )}
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-600 mb-2">Receipt Image</label>
                  <input
                    type="file"
                    name="receipt_image"
                    multiple
                    accept="image/jpeg,image/png,image/jpg,application/pdf"
                    onChange={handleInputChange}
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-700 ${
                      formErrors['receipt_image.0'] ? 'border-red-600' : 'border-gray-200'
                    }`}
                    disabled={loading}
                  />
                  {formErrors['receipt_image.0'] && (
                    <p className="text-red-500 text-sm mt-2">{formErrors['receipt_image.0']}</p>
                  )}
                  {imagePreviews.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-600 mb-2">Receipt Previews</p>
                      <div className="flex flex-wrap gap-4">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="flex flex-col items-center">
                            {preview.url.startsWith('data:image/') ? (
                              <img
                                src={preview.url}
                                alt={preview.name}
                                className="w-24 h-24 rounded-lg object-cover border border-gray-200"
                              />
                            ) : (
                              <div className="w-24 h-24 rounded-lg border border-gray-200 flex items-center justify-center bg-gray-100">
                                <span className="text-gray-500 text-sm">PDF</span>
                              </div>
                            )}
                            <p className="text-xs text-gray-600 mt-1 truncate w-24">{preview.name}</p>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              type="button"
                              onClick={() => handleImageDelete(index)}
                              className="bg-red-600 text-white p-1 rounded-full mt-2"
                              disabled={loading}
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </motion.button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    User <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="text-gray-400" />
                    </div>
                    <select
                      name="user_id"
                      value={form.user_id}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-700 ${
                        formErrors.user_id ? 'border-red-600' : 'border-gray-200'
                      }`}
                      disabled={loading}
                    >
                      <option value="">Select User</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name || 'Unnamed User'}
                        </option>
                      ))}
                    </select>
                  </div>
                  {formErrors.user_id && (
                    <p className="text-red-500 text-sm mt-2">{formErrors.user_id}</p>
                  )}
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-600 mb-2">Status</label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleInputChange}
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-700 ${
                      formErrors.status ? 'border-red-600' : 'border-gray-200'
                    }`}
                    disabled={loading}
                  >
                    <option value="pending">Pending</option>
                    <option value="done">Done</option>
                    <option value="overdue">Overdue</option>
                  </select>
                  {formErrors.status && (
                    <p className="text-red-500 text-sm mt-2">{formErrors.status}</p>
                  )}
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-600 mb-2">Notes</label>
                  <textarea
                    name="notes"
                    placeholder="Enter notes"
                    value={form.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-700 ${
                      formErrors.notes ? 'border-red-600' : 'border-gray-200'
                    }`}
                    disabled={loading}
                  />
                  {formErrors.notes && (
                    <p className="text-red-500 text-sm mt-2">{formErrors.notes}</p>
                  )}
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
                Are you sure you want to delete this installment? This action cannot be undone.
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

export default Installment;