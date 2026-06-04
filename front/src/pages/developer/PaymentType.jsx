import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { useDebounce } from 'use-debounce';

const PaymentType = () => {
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword] = useDebounce(keyword, 300);
  const [form, setForm] = useState({
    id: null,
    name: '',
    type: '',
    account_number: '',
    image: null,
    status: true,
    user_id: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePaymentTypeId, setDeletePaymentTypeId] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const baseUrl = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/$/, '')
    : 'http://192.168.0.107:8000/api';

  const filterAndSortPaymentTypesByRelevance = (paymentTypes, searchTerm) => {
    if (!searchTerm.trim()) return paymentTypes;
    const lowerSearch = searchTerm.toLowerCase();

    const filteredPaymentTypes = paymentTypes.filter((paymentType) => {
      const name = (paymentType.name || '').toLowerCase();
      const type = (paymentType.type || '').toLowerCase();
      const accountNumber = (paymentType.account_number || '').toLowerCase();
      return name.includes(lowerSearch) || type.includes(lowerSearch) || accountNumber.includes(lowerSearch);
    });

    return filteredPaymentTypes.sort((a, b) => {
      const aName = (a.name || '').toLowerCase();
      const bName = (b.name || '').toLowerCase();

      if (aName === lowerSearch && bName !== lowerSearch) return -1;
      if (bName === lowerSearch && aName !== lowerSearch) return 1;

      if (aName.startsWith(lowerSearch) && !bName.startsWith(lowerSearch)) return -1;
      if (bName.startsWith(lowerSearch) && !aName.startsWith(lowerSearch)) return 1;

      if (aName.includes(lowerSearch) && !bName.includes(lowerSearch)) return -1;
      if (bName.includes(lowerSearch) && !aName.includes(lowerSearch)) return 1;

      return aName.localeCompare(bName);
    });
  };

  const fetchPaymentTypes = async () => {
    if (debouncedKeyword.trim().length < 2 && debouncedKeyword !== '') {
      setPaymentTypes([]);
      setTotalPages(1);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    setError(null);
    try {
      const endpoint = debouncedKeyword.trim()
        ? `${baseUrl}/payment-types/search?limit=${perPage}&page=${page}&keyword=${encodeURIComponent(debouncedKeyword)}`
        : `${baseUrl}/payment-types?limit=${perPage}&page=${page}`;
      const { data: paginator } = await axios.get(endpoint);
      const sortedPaymentTypes = filterAndSortPaymentTypesByRelevance(paginator.data || [], debouncedKeyword);
      setPaymentTypes(sortedPaymentTypes);
      setTotalPages(paginator.last_page || 1);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch payment types';
      setError(errorMessage);
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setSearchLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    if (allUsers.length > 0) return;
    setLoading(true);
    try {
      const { data } = await axios.get(`${baseUrl}/users?limit=0`);
      setAllUsers(data || []);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch users';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllUsers();
  }, []);

  useEffect(() => {
    fetchPaymentTypes();
  }, [page, perPage, debouncedKeyword]);

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file' && files[0]) {
      const file = files[0];
      setForm((prev) => ({ ...prev, [name]: file }));
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
      type: '',
      account_number: '',
      image: null,
      status: true,
      user_id: '',
    });
    setFormErrors({});
    setIsEditing(false);
    setImagePreview(null);
  };

  const openEditForm = (paymentType) => {
    setForm({
      id: paymentType.id,
      name: paymentType.name || '',
      type: paymentType.type || '',
      account_number: paymentType.account_number || '',
      image: null,
      status: paymentType.status ?? true,
      user_id: paymentType.user_id || '',
    });
    setFormErrors({});
    setIsEditing(true);
    setShowForm(true);
    setImagePreview(paymentType.image || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('type', form.type || '');
    formData.append('account_number', form.account_number || '');
    formData.append('user_id', form.user_id);
    if (form.image) formData.append('image', form.image);
    formData.append('status', form.status ? 1 : 0);

    try {
      setLoading(true);
      if (isEditing) {
        formData.append('_method', 'PUT');
        const { data } = await axios.post(`${baseUrl}/payment-types/${form.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success(data.message || 'Payment type updated successfully');
      } else {
        const { data } = await axios.post(`${baseUrl}/payment-types`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success(data.message || 'Payment type created successfully');
      }
      resetForm();
      setShowForm(false);
      fetchPaymentTypes();
    } catch (err) {
      if (err.response?.status === 422) {
        setFormErrors(err.response.data.errors);
      } else {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to save payment type';
        toast.error(`Error: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      const { data } = await axios.delete(`${baseUrl}/payment-types/${deletePaymentTypeId}`);
      toast.success(data.message || 'Payment type deleted successfully');
      setIsDeleteModalOpen(false);
      if (paymentTypes.length === 1 && page > 1) {
        setPage(page - 1);
      }
      fetchPaymentTypes();
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete payment type';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
      setDeletePaymentTypeId(null);
    }
  };

  const openDeleteModal = (id) => {
    setDeletePaymentTypeId(id);
    setIsDeleteModalOpen(true);
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.3 } },
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
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8">Payment Type Management</h1>

      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-white bg-opacity-90 p-4 rounded-xl shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-2/3">
          <div className="relative w-full md:w-1/2">
            <input
              type="text"
              placeholder="Search payment types (min 2 characters)..."
              value={keyword}
              onChange={(e) => {
                const trimmedValue = e.target.value.trimStart();
                setKeyword(trimmedValue);
                if (trimmedValue === '') {
                  setPage(1);
                  fetchPaymentTypes();
                }
              }}
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-700 placeholder-gray-400"
              disabled={loading}
            />
            {searchLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg
                  className="animate-spin h-5 w-5 text-blue-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-600">Items per page:</label>
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-700"
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
          <FiPlus className="inline mr-2" /> Create Payment Type
        </motion.button>
      </div>

      <div className="bg-white bg-opacity-90 rounded-xl shadow-sm overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">ID</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">Name</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">Type</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">Account Number</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">Image</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">User</th>
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
            ) : paymentTypes.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-6 text-gray-500">
                  {debouncedKeyword.trim() ? `No payment types found for "${debouncedKeyword}"` : 'No payment types found'}
                </td>
              </tr>
            ) : (
              paymentTypes.map((paymentType) => (
                <motion.tr
                  key={paymentType.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-6 py-4 text-sm text-gray-700">{paymentType.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{paymentType.name || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{paymentType.type || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{paymentType.account_number || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {paymentType.image ? (
                      <img src={paymentType.image} alt="Payment Type" className="w-10 h-10 rounded object-cover" />
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        paymentType.status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {paymentType.status ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {paymentType.user?.name || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openEditForm(paymentType)}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                      disabled={loading}
                    >
                      Edit
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openDeleteModal(paymentType.id)}
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
            Previous
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
            Next
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
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {isEditing ? 'Edit Payment Type' : 'Create Payment Type'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter payment type name"
                    value={form.name}
                    onChange={handleInputChange}
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-700 ${
                      formErrors.name ? 'border-red-600' : 'border-gray-200'
                    }`}
                    disabled={loading}
                  />
                  {formErrors.name && (
                    <p className="text-red-500 text-sm mt-2">{formErrors.name}</p>
                  )}
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-600 mb-2">Type</label>
                  <input
                    type="text"
                    name="type"
                    placeholder="Enter type"
                    value={form.type}
                    onChange={handleInputChange}
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-700 ${
                      formErrors.type ? 'border-red-600' : 'border-gray-200'
                    }`}
                    disabled={loading}
                  />
                  {formErrors.type && (
                    <p className="text-red-500 text-sm mt-2">{formErrors.type}</p>
                  )}
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-600 mb-2">Account Number</label>
                  <input
                    type="text"
                    name="account_number"
                    placeholder="Enter account number"
                    value={form.account_number}
                    onChange={handleInputChange}
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-700 ${
                      formErrors.account_number ? 'border-red-600' : 'border-gray-200'
                    }`}
                    disabled={loading}
                  />
                  {formErrors.account_number && (
                    <p className="text-red-500 text-sm mt-2">{formErrors.account_number}</p>
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
                    {allUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
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
                        : 'bg-blue-600 the-blue-700'
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Confirm Deletion</h2>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete this payment type? This action cannot be undone.
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

export default PaymentType;