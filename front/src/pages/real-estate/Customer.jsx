import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FiPlus, FiTrash2, FiEdit, FiSearch, FiFilter, FiChevronLeft, FiChevronRight, FiX, FiUser, FiMail } from 'react-icons/fi';
import { useDebounce } from 'use-debounce';

const Customer = () => {
  const [customers, setCustomers] = useState([]);
  const [users, setUsers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [leadIdFilter, setLeadIdFilter] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [debouncedKeyword] = useDebounce(keyword, 300);
  const [debouncedNameFilter] = useDebounce(nameFilter, 300);
  const [debouncedEmailFilter] = useDebounce(emailFilter, 300);
  const [debouncedLeadIdFilter] = useDebounce(leadIdFilter, 300);
  const [debouncedUserIdFilter] = useDebounce(userIdFilter, 300);
  const [debouncedStatusFilter] = useDebounce(statusFilter, 300);
  const [form, setForm] = useState({
    id: null,
    name: '',
    email: '',
    lead_id: '',
    user_id: '',
    image: null,
    status: true,
  });
  const [formErrors, setFormErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteCustomerId, setDeleteCustomerId] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://192.168.0.249:8000/api';

  const filterParams = {
    keyword: debouncedKeyword,
    name: debouncedNameFilter,
    email: debouncedEmailFilter,
    lead_id: debouncedLeadIdFilter,
    user_id: debouncedUserIdFilter,
    status: debouncedStatusFilter !== '' ? (debouncedStatusFilter ? 1 : 0) : '',
    limit: perPage,
    page,
  };

  const fetchCustomers = async () => {
    if (filterParams.keyword.trim().length < 2 && filterParams.keyword !== '' && !filterParams.name && !filterParams.email && !filterParams.lead_id && !filterParams.user_id && !filterParams.status) {
      setCustomers([]);
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
        ...(filterParams.name && { name: filterParams.name }),
        ...(filterParams.email && { email: filterParams.email }),
        ...(filterParams.lead_id && { lead_id: filterParams.lead_id }),
        ...(filterParams.user_id && { user_id: filterParams.user_id }),
        ...(filterParams.status !== '' && { status: filterParams.status }),
      });
      const endpoint = filterParams.keyword || filterParams.name || filterParams.email || filterParams.lead_id || filterParams.user_id || filterParams.status !== ''
        ? `${baseUrl}/customers/search?${searchParams}`
        : `${baseUrl}/customers?${searchParams}`;
      const { data } = await axios.get(endpoint);
      setCustomers(data.data?.data || data.data || []);
      setTotalPages(data.data?.last_page || data.last_page || 1);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch customers';
      setError(errorMessage);
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setSearchLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (users.length > 0) return;
    setLoading(true);
    try {
      const { data } = await axios.get(`${baseUrl}/users?limit=0`);
      setUsers(data.data || data || []);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch users';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeads = async () => {
    if (leads.length > 0) return;
    setLoading(true);
    try {
      const { data } = await axios.get(`${baseUrl}/leads?limit=0`);
      setLeads(data.data || data || []);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch leads';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchLeads();
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [page, perPage, debouncedKeyword, debouncedNameFilter, debouncedEmailFilter, debouncedLeadIdFilter, debouncedUserIdFilter, debouncedStatusFilter]);

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file' && name === 'image' && files[0]) {
      const file = files[0];
      setForm((prev) => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
      if (type === 'file' && !files[0]) {
        setImagePreview(null);
      }
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleImageDelete = () => {
    setForm((prev) => ({ ...prev, image: null }));
    setImagePreview(null);
  };

  const validateForm = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Name is required';
    if (!form.email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errors.email = 'Invalid email format';
    if (!form.lead_id) errors.lead_id = 'Lead is required';
    if (!form.user_id) errors.user_id = 'User is required';
    if (form.image && !['image/jpeg', 'image/png', 'image/jpg'].includes(form.image?.type)) {
      errors.image = 'Image must be JPEG, PNG, or JPG';
    }
    return errors;
  };

  const resetForm = () => {
    setForm({
      id: null,
      name: '',
      email: '',
      lead_id: '',
      user_id: '',
      image: null,
      status: true,
    });
    setFormErrors({});
    setIsEditing(false);
    setImagePreview(null);
  };

  const openEditForm = (customer) => {
    setForm({
      id: customer.id,
      name: customer.name || '',
      email: customer.email || '',
      lead_id: customer.lead_id || '',
      user_id: customer.user_id || '',
      image: null,
      status: customer.status ?? true,
    });
    setFormErrors({});
    setIsEditing(true);
    setShowForm(true);
    setImagePreview(customer.image || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const formData = new FormData();
    formData.append('name', form.name || '');
    formData.append('email', form.email || '');
    formData.append('lead_id', form.lead_id || '');
    formData.append('user_id', form.user_id || '');
    if (form.image) formData.append('image', form.image);
    formData.append('status', form.status ? 1 : 0);

    try {
      setLoading(true);
      if (isEditing) {
        formData.append('_method', 'PUT');
        const { data } = await axios.post(`${baseUrl}/customers/${form.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success(data.message || 'Customer updated successfully');
      } else {
        const { data } = await axios.post(`${baseUrl}/customers`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success(data.message || 'Customer created successfully');
      }
      resetForm();
      setShowForm(false);
      setPage(1);
      fetchCustomers();
    } catch (err) {
      if (err.response?.status === 422) {
        const backendErrors = err.response.data.errors || {};
        const formattedErrors = {};
        Object.keys(backendErrors).forEach((key) => {
          formattedErrors[key] = backendErrors[key][0];
        });
        setFormErrors(formattedErrors);
        toast.error('Validation failed. Please check the form.');
      } else {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to save customer';
        toast.error(`Error: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      const { data } = await axios.delete(`${baseUrl}/customers/${deleteCustomerId}`);
      toast.success(data.message || 'Customer deleted successfully');
      setIsDeleteModalOpen(false);
      if (customers.length === 1 && page > 1) {
        setPage(page - 1);
      }
      fetchCustomers();
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete customer';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
      setDeleteCustomerId(null);
    }
  };

  const openDeleteModal = (id) => {
    setDeleteCustomerId(id);
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
      setImagePreview(null);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-8 lg:p-10 bg-transparent">
      <ToastContainer position="top-right" autoClose={3000} />
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8">Customer Management</h1>

      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-white bg-opacity-90 p-4 rounded-xl shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-2/3">
          <div className="relative w-full md:w-1/3">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search customers (min 2 characters)..."
              value={keyword}
              onChange={(e) => {
                const trimmedValue = e.target.value.trimStart();
                setKeyword(trimmedValue);
                if (trimmedValue === '') {
                  setPage(1);
                  fetchCustomers();
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
          <FiPlus className="inline mr-2" /> Create Customer
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
                <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                <input
                  type="text"
                  value={nameFilter}
                  onChange={(e) => {
                    setNameFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white text-gray-700 text-sm hover:bg-gray-50"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  value={emailFilter}
                  onChange={(e) => {
                    setEmailFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white text-gray-700 text-sm hover:bg-gray-50"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Lead</label>
                <select
                  value={leadIdFilter}
                  onChange={(e) => {
                    setLeadIdFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white text-gray-700 text-sm hover:bg-gray-50"
                  disabled={loading}
                >
                  <option value="">All Leads</option>
                  {leads.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.name || 'Unnamed Lead'}
                    </option>
                  ))}
                </select>
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
                <label className="block text-xs font-medium text-gray-600 mb-1">Active Status</label>
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
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">Name</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">Email</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">Lead</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">User</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">Image</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading || searchLoading ? (
              <tr>
                <td colSpan="8" className="text-center py-6 text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="8" className="text-center py-6 text-red-500">
                  {error}
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-6 text-gray-500">
                  {debouncedKeyword.trim() || debouncedNameFilter || debouncedEmailFilter || debouncedLeadIdFilter || debouncedUserIdFilter || debouncedStatusFilter
                    ? 'No customers found'
                    : 'No customers found'}
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <motion.tr
                  key={customer.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-6 py-4 text-sm text-gray-700">#{customer.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <FiUser className="text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <div className="font-medium text-gray-900">{customer.name || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <FiMail className="text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <div className="font-medium text-gray-900">{customer.email || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{customer.lead?.name || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{customer.user?.name || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {customer.image ? (
                      <img src={customer.image} alt="Customer" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        customer.status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {customer.status ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openEditForm(customer)}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                      disabled={loading}
                    >
                      <FiEdit className="inline" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openDeleteModal(customer.id)}
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
                  {isEditing ? 'Edit Customer' : 'Create Customer'}
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
                    Name <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      placeholder="Enter name"
                      value={form.name}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-700 ${
                        formErrors.name ? 'border-red-600' : 'border-gray-200'
                      }`}
                      disabled={loading}
                    />
                  </div>
                  {formErrors.name && (
                    <p className="text-red-500 text-sm mt-2">{formErrors.name}</p>
                  )}
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Email <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMail className="text-gray-400" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      placeholder="Enter email"
                      value={form.email}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-700 ${
                        formErrors.email ? 'border-red-600' : 'border-gray-200'
                      }`}
                      disabled={loading}
                    />
                  </div>
                  {formErrors.email && (
                    <p className="text-red-500 text-sm mt-2">{formErrors.email}</p>
                  )}
                </div>
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
                        {user.name || 'Unnamed User'}
                      </option>
                    ))}
                  </select>
                  {formErrors.user_id && (
                    <p className="text-red-500 text-sm mt-2">{formErrors.user_id}</p>
                  )}
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-600 mb-2">Image</label>
                  <input
                    type="file"
                    name="image"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handleInputChange}
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-700 ${
                      formErrors.image ? 'border-red-600' : 'border-gray-200'
                    }`}
                    disabled={loading}
                  />
                  {formErrors.image && (
                    <p className="text-red-500 text-sm mt-2">{formErrors.image}</p>
                  )}
                  {imagePreview && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-600 mb-2">Image Preview</p>
                      <div className="flex items-center gap-4">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-32 h-32 rounded-lg object-cover border border-gray-200"
                        />
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={handleImageDelete}
                          className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-colors"
                          disabled={loading}
                          title="Delete Image"
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </motion.button>
                      </div>
                    </div>
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
                Are you sure you want to delete this customer? This action cannot be undone.
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

export default Customer;