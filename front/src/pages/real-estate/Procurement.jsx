import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { useDebounce } from 'use-debounce';

const Procurement = () => {
  const [procurements, setProcurements] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [paymentTypes, setPaymentTypes] = useState([]);
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
    project_id: '',
    receipt_image: [],
    status: true,
    user_id: '',
    notes: '',
    transactions: [{ payment_type_id: '', amount: '' }],
  });
  const [formErrors, setFormErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteProcurementId, setDeleteProcurementId] = useState(null);
  const [imagePreviews, setImagePreviews] = useState([]);

  const baseUrl = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/$/, '')
    : 'http://192.168.0.107:8000/api';

  const filterAndSortProcurementsByRelevance = (procurements, searchTerm) => {
    if (!searchTerm.trim()) return procurements;
    const lowerSearch = searchTerm.toLowerCase();

    const filteredProcurements = procurements.filter((procurement) => {
      const amount = (procurement.amount || '').toString().toLowerCase();
      const notes = (procurement.notes || '').toLowerCase();
      return amount.includes(lowerSearch) || notes.includes(lowerSearch);
    });

    return filteredProcurements.sort((a, b) => {
      const aAmount = (a.amount || '').toString().toLowerCase();
      const bAmount = (b.amount || '').toString().toLowerCase();
      if (aAmount === lowerSearch && bAmount !== lowerSearch) return -1;
      if (bAmount === lowerSearch && aAmount !== lowerSearch) return 1;
      if (aAmount.startsWith(lowerSearch) && !bAmount.startsWith(lowerSearch)) return -1;
      if (bAmount.startsWith(lowerSearch) && !aAmount.startsWith(lowerSearch)) return 1;
      return aAmount.localeCompare(bAmount);
    });
  };

  const fetchProcurements = async () => {
    if (debouncedKeyword.trim().length < 2 && debouncedKeyword !== '') {
      setProcurements([]);
      setTotalPages(1);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    setError(null);
    try {
      const endpoint = debouncedKeyword.trim()
        ? `${baseUrl}/procurements/search?limit=${perPage}&page=${page}&keyword=${encodeURIComponent(debouncedKeyword)}`
        : `${baseUrl}/procurements?limit=${perPage}&page=${page}`;
      const { data } = await axios.get(endpoint);
      const sortedProcurements = filterAndSortProcurementsByRelevance(data.data || data || [], debouncedKeyword);
      setProcurements(sortedProcurements);
      setTotalPages(data.last_page || 1);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch procurements';
      setError(errorMessage);
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setSearchLoading(false);
    }
  };

  const fetchDependencies = async () => {
    if (projects.length > 0 && users.length > 0 && paymentTypes.length > 0) return;
    setLoading(true);
    try {
      const [projectsRes, usersRes, paymentTypesRes] = await Promise.all([
        axios.get(`${baseUrl}/projects?limit=0`),
        axios.get(`${baseUrl}/users?limit=0`),
        axios.get(`${baseUrl}/payment-types?limit=0`),
      ]);
      setProjects(projectsRes.data?.data || projectsRes.data || []);
      setUsers(usersRes.data?.data || usersRes.data || []);
      setPaymentTypes(paymentTypesRes.data?.data || paymentTypesRes.data || []);
      setForm((prev) => ({
        ...prev,
        project_id: projectsRes.data?.data?.[0]?.id || projectsRes.data?.[0]?.id || '',
        user_id: usersRes.data?.data?.[0]?.id || usersRes.data?.[0]?.id || '',
        transactions: [{ payment_type_id: paymentTypesRes.data?.data?.[0]?.id || paymentTypesRes.data?.[0]?.id || '', amount: '' }],
      }));
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
    fetchProcurements();
  }, [page, perPage, debouncedKeyword]);

  const handleInputChange = (e, index = null) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file' && name === 'receipt_image' && files.length > 0) {
      const validFiles = Array.from(files).filter((file) => {
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (!validTypes.includes(file.type)) {
          toast.error(`File ${file.name} is not a valid type (jpg, png, jpeg allowed)`);
          return false;
        }
        if (file.size > maxSize) {
          toast.error(`File ${file.name} exceeds 10MB limit`);
          return false;
        }
        return true;
      });
      setForm((prev) => ({ ...prev, receipt_image: validFiles }));
      const previews = validFiles.map((file) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve({ url: reader.result, name: file.name });
          reader.readAsDataURL(file);
        });
      });
      Promise.all(previews).then((results) => setImagePreviews(results));
    } else if (name.startsWith('transactions') && !isEditing) {
      const [_, field, idx] = name.split('.');
      const newTransactions = [...form.transactions];
      newTransactions[index][field] = value;
      setForm((prev) => ({ ...prev, transactions: newTransactions }));
      setFormErrors((prev) => ({ ...prev, [`transactions.${index}.${field}`]: null }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
      if (type === 'file' && !files.length) {
        setForm((prev) => ({ ...prev, receipt_image: [] }));
        setImagePreviews([]);
      }
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const addTransaction = () => {
    if (!isEditing) {
      setForm((prev) => ({
        ...prev,
        transactions: [...prev.transactions, { payment_type_id: paymentTypes[0]?.id || '', amount: '' }],
      }));
    }
  };

  const removeTransaction = (index) => {
    if (!isEditing) {
      setForm((prev) => ({
        ...prev,
        transactions: prev.transactions.filter((_, i) => i !== index),
      }));
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        Object.keys(newErrors).forEach((key) => {
          if (key.startsWith(`transactions.${index}.`)) {
            delete newErrors[key];
          }
        });
        return newErrors;
      });
    }
  };

  const handleImageDelete = (index) => {
    setForm((prev) => {
      const newFiles = [...prev.receipt_image];
      newFiles.splice(index, 1);
      return { ...prev, receipt_image: newFiles };
    });
    setImagePreviews((prev) => {
      const newPreviews = [...prev];
      newPreviews.splice(index, 1);
      return newPreviews;
    });
  };

  const validateForm = () => {
    const errors = {};
    if (!form.project_id) errors.project_id = 'Project is required';
    if (!form.user_id) errors.user_id = 'User is required';
    if (form.receipt_image.some((file) => !['image/jpeg', 'image/png', 'image/jpg'].includes(file.type))) {
      errors.receipt_image = 'Receipt images must be JPEG, PNG, or JPG';
    }
    if (!isEditing && form.transactions.length === 0) {
      errors.transactions = 'At least one transaction is required';
    } else if (!isEditing) {
      form.transactions.forEach((txn, index) => {
        if (!txn.payment_type_id) {
          errors[`transactions.${index}.payment_type_id`] = 'Payment type is required';
        }
        if (!txn.amount || isNaN(txn.amount) || parseFloat(txn.amount) <= 0) {
          errors[`transactions.${index}.amount`] = 'Amount must be a positive number';
        }
      });
    }
    return errors;
  };

  const resetForm = () => {
    setForm({
      id: null,
      project_id: projects[0]?.id || '',
      receipt_image: [],
      status: true,
      user_id: users[0]?.id || '',
      notes: '',
      transactions: isEditing ? [] : [{ payment_type_id: paymentTypes[0]?.id || '', amount: '' }],
    });
    setFormErrors({});
    setIsEditing(false);
    setImagePreviews([]);
  };

  const openEditForm = (procurement) => {
    setForm({
      id: procurement.id,
      project_id: procurement.project_id || '',
      receipt_image: [],
      status: procurement.status ?? true,
      user_id: procurement.user_id || '',
      notes: procurement.notes || '',
      transactions: [], // No transactions in edit mode
    });
    setFormErrors({});
    setIsEditing(true);
    setShowForm(true);
    setImagePreviews(procurement.receipt_image?.map((url) => ({ url, name: url.split('/').pop() })) || []);
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
  formData.append('project_id', form.project_id);
  if (form.notes) formData.append('notes', form.notes);
  formData.append('status', form.status ? '1' : '0');
  formData.append('user_id', form.user_id);
  if (form.receipt_image && form.receipt_image.length > 0) {
    form.receipt_image.forEach((file, index) => {
      formData.append(`receipt_image[${index}]`, file);
    });
  }
  if (!isEditing) {
    form.transactions.forEach((txn, index) => {
      formData.append(`transactions[${index}][payment_type_id]`, txn.payment_type_id);
      formData.append(`transactions[${index}][amount]`, txn.amount);
    });
  } else {
    formData.append('_method', 'PUT'); // Add _method=PUT for update
  }

  try {
    setLoading(true);
    if (isEditing) {
      await axios.post(`${baseUrl}/procurements/${form.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Procurement updated successfully');
    } else {
      await axios.post(`${baseUrl}/procurements`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Procurement created successfully');
    }
    resetForm();
    setShowForm(false);
    fetchProcurements();
  } catch (err) {
    if (err.response?.status === 422) {
      setFormErrors(err.response.data.errors || {});
      const errorMessages = Object.values(err.response.data.errors || {}).flat().join(', ');
      toast.error(`Validation Error: ${errorMessages || 'Please check the form'}`);
    } else {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to save procurement';
      toast.error(`Error: ${errorMessage}`);
    }
  } finally {
    setLoading(false);
  }
};

  const handleDelete = async () => {
    try {
      setLoading(true);
      const { data } = await axios.delete(`${baseUrl}/procurements/${deleteProcurementId}`);
      toast.success(data.message || 'Procurement deleted successfully');
      setIsDeleteModalOpen(false);
      if (procurements.length === 1 && page > 1) {
        setPage(page - 1);
      }
      fetchProcurements();
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete procurement';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
      setDeleteProcurementId(null);
    }
  };

  const openDeleteModal = (id) => {
    setDeleteProcurementId(id);
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
      setImagePreviews([]);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-8 lg:p-10 bg-transparent">
      <ToastContainer position="top-right" autoClose={3000} />
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8">Procurement Management</h1>

      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-white bg-opacity-90 p-4 rounded-xl shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-2/3">
          <div className="relative w-full md:w-1/2">
            <input
              type="text"
              placeholder="Search procurements (min 2 characters)..."
              value={keyword}
              onChange={(e) => {
                const trimmedValue = e.target.value.trimStart();
                setKeyword(trimmedValue);
                if (trimmedValue === '') {
                  setPage(1);
                  fetchProcurements();
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
          <FiPlus className="inline mr-2" /> Create Procurement
        </motion.button>
      </div>

      <div className="bg-white bg-opacity-90 rounded-xl shadow-sm overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">ID</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">Project</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">Total Amount</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">Receipt Images</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">User</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">Notes</th>
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
            ) : procurements.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-6 text-gray-500">
                  {debouncedKeyword.trim() ? `No procurements found for "${debouncedKeyword}"` : 'No procurements found'}
                </td>
              </tr>
            ) : (
              procurements.map((procurement) => (
                <motion.tr
                  key={procurement.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-6 py-4 text-sm text-gray-700">{procurement.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {procurement.project ? `${procurement.project.name} (ID: ${procurement.project.id})` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{procurement.amount ? `$${procurement.amount}` : 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {procurement.receipt_image?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {procurement.receipt_image.map((url, i) => (
                          <img key={i} src={url} alt="Receipt" className="w-8 h-8 rounded object-cover" />
                        ))}
                      </div>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        procurement.status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {procurement.status ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {procurement.user?.name || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{procurement.notes ? procurement.notes.substring(0, 50) + '...' : 'N/A'}</td>
                  <td className="px-6 py-4 text-sm flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openEditForm(procurement)}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                      disabled={loading}
                    >
                      Edit
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openDeleteModal(procurement.id)}
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
                {isEditing ? 'Edit Procurement' : 'Create Procurement'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Project <span className="text-red-600">*</span>
                  </label>
                  <select
                    name="project_id"
                    value={form.project_id}
                    onChange={handleInputChange}
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-700 ${
                      formErrors.project_id ? 'border-red-600' : 'border-gray-200'
                    }`}
                    disabled={loading}
                  >
                    <option value="">Select Project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name} (ID: {project.id})
                      </option>
                    ))}
                  </select>
                  {formErrors.project_id && (
                    <p className="text-red-500 text-sm mt-2">{formErrors.project_id}</p>
                  )}
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-600 mb-2">Receipt Images</label>
                  <input
                    type="file"
                    name="receipt_image"
                    multiple
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handleInputChange}
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-700 ${
                      formErrors.receipt_image ? 'border-red-600' : 'border-gray-200'
                    }`}
                    disabled={loading}
                  />
                  {formErrors.receipt_image && (
                    <p className="text-red-500 text-sm mt-2">{formErrors.receipt_image}</p>
                  )}
                  {imagePreviews.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-600 mb-2">Receipt Previews</p>
                      <div className="flex flex-wrap gap-4">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="flex flex-col items-center">
                            <img
                              src={preview.url}
                              alt={preview.name}
                              className="w-20 h-20 rounded-lg object-cover border border-gray-200"
                            />
                            <p className="text-xs text-gray-600 mt-1 truncate w-20">{preview.name}</p>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              type="button"
                              onClick={() => handleImageDelete(index)}
                              className="bg-red-600 text-white p-1 rounded mt-2 hover:bg-red-700 transition-colors"
                              disabled={loading}
                              title="Delete Receipt Image"
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
                  <label className="block text-sm font-medium text-gray-600 mb-2">Status</label>
                  <input
                    type="checkbox"
                    name="status"
                    checked={form.status}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-400 border-gray-300 rounded"
                    disabled={loading}
                  />
                  <span className="ml-2 text-sm text-gray-600">{form.status ? 'Active' : 'Inactive'}</span>
                  {formErrors.status && (
                    <p className="text-red-500 text-sm mt-2">{formErrors.status}</p>
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
                {!isEditing && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Transactions <span className="text-red-600">*</span>
                    </label>
                    {form.transactions.map((txn, index) => (
                      <div key={index} className="flex gap-3 mb-3 items-start">
                        <div className="flex-1">
                          <select
                            name={`transactions.payment_type_id.${index}`}
                            value={txn.payment_type_id}
                            onChange={(e) => handleInputChange(e, index)}
                            className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-700 ${
                              formErrors[`transactions.${index}.payment_type_id`] ? 'border-red-600' : 'border-gray-200'
                            }`}
                            disabled={loading}
                          >
                            <option value="">Select Payment Type</option>
                            {paymentTypes.map((pt) => (
                              <option key={pt.id} value={pt.id}>
                                {pt.name || 'Unnamed Payment Type'}
                              </option>
                            ))}
                          </select>
                          {formErrors[`transactions.${index}.payment_type_id`] && (
                            <p className="text-red-500 text-sm mt-2">{formErrors[`transactions.${index}.payment_type_id`]}</p>
                          )}
                        </div>
                        <div className="flex-1">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            name={`transactions.amount.${index}`}
                            placeholder="Amount"
                            value={txn.amount}
                            onChange={(e) => handleInputChange(e, index)}
                            className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-700 ${
                              formErrors[`transactions.${index}.amount`] ? 'border-red-600' : 'border-gray-200'
                            }`}
                            disabled={loading}
                          />
                          {formErrors[`transactions.${index}.amount`] && (
                            <p className="text-red-500 text-sm mt-2">{formErrors[`transactions.${index}.amount`]}</p>
                          )}
                        </div>
                        {form.transactions.length > 1 && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            onClick={() => removeTransaction(index)}
                            className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-colors"
                            disabled={loading}
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </motion.button>
                        )}
                      </div>
                    ))}
                    {formErrors.transactions && (
                      <p className="text-red-500 text-sm mt-2">{formErrors.transactions}</p>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={addTransaction}
                      className="mt-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                      disabled={loading}
                    >
                      <FiPlus className="inline mr-2" /> Add Transaction
                    </motion.button>
                  </div>
                )}
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Confirm Deletion</h2>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete this procurement? This action cannot be undone.
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

export default Procurement;