import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { useDebounce } from 'use-debounce';

// Create Axios instance for universal API calls
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/$/, '')
    : 'http://192.168.0.101:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

const Ownership = () => {
  const [ownerships, setOwnerships] = useState([]);
  const [allOwnerships, setAllOwnerships] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword] = useDebounce(keyword, 300);
  const [form, setForm] = useState({
    id: null,
    name: '',
    phone: '',
    gender: '',
    email: '',
    nid: '',
    user_id: '',
    image: null,
    contract_image: [],
    status: true,
  });
  const [formErrors, setFormErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteOwnershipId, setDeleteOwnershipId] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [contractPreviews, setContractPreviews] = useState([]);

  const filterAndSortOwnershipsByRelevance = (ownerships, searchTerm) => {
    if (!searchTerm.trim()) return ownerships;
    const lowerSearch = searchTerm.toLowerCase();

    const filteredOwnerships = ownerships.filter((ownership) => {
      const name = (ownership.name || '').toLowerCase();
      const email = (ownership.email || '').toLowerCase();
      const phone = (ownership.phone || '').toLowerCase();
      const nid = (ownership.nid || '').toLowerCase();
      const gender = (ownership.gender || '').toLowerCase();
      return (
        name.includes(lowerSearch) ||
        email.includes(lowerSearch) ||
        phone.includes(lowerSearch) ||
        nid.includes(lowerSearch) ||
        gender.includes(lowerSearch)
      );
    });

    return filteredOwnerships.sort((a, b) => {
      const aName = (a.name || '').toLowerCase();
      const bName = (b.name || '').toLowerCase();
      const aEmail = (a.email || '').toLowerCase();
      const bEmail = (b.email || '').toLowerCase();

      if (aName === lowerSearch && bName !== lowerSearch) return -1;
      if (bName === lowerSearch && aName !== lowerSearch) return 1;
      if (aEmail === lowerSearch && bEmail !== lowerSearch) return -1;
      if (bEmail === lowerSearch && aEmail !== lowerSearch) return 1;

      if (aName.startsWith(lowerSearch) && !bName.startsWith(lowerSearch)) return -1;
      if (bName.startsWith(lowerSearch) && !aName.startsWith(lowerSearch)) return 1;
      if (aEmail.startsWith(lowerSearch) && !bEmail.startsWith(lowerSearch)) return -1;
      if (bEmail.startsWith(lowerSearch) && !aEmail.startsWith(lowerSearch)) return 1;

      if (aName.includes(lowerSearch) && !bName.includes(lowerSearch)) return -1;
      if (bName.includes(lowerSearch) && !aName.includes(lowerSearch)) return 1;
      if (aEmail.includes(lowerSearch) && !bEmail.includes(lowerSearch)) return -1;
      if (bEmail.includes(lowerSearch) && !aEmail.includes(lowerSearch)) return 1;

      return aName.localeCompare(bName);
    });
  };

  const fetchOwnerships = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/ownerships?limit=0');
      setAllOwnerships(data.data || data || []);
      setOwnerships(data.data || data || []);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch ownerships';
      setError(errorMessage);
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users?limit=0');
      // Handle different possible response structures
      const userList = Array.isArray(data.data?.data)
        ? data.data.data
        : Array.isArray(data.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : [];
      setUsers(userList);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch users';
      toast.error(`Error: ${errorMessage}`);
      setUsers([]);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchOwnerships();
  }, []);

  useEffect(() => {
    if (debouncedKeyword.trim().length < 2 && debouncedKeyword !== '') {
      setOwnerships([]);
      return;
    }
    const filteredOwnerships = filterAndSortOwnershipsByRelevance(allOwnerships, debouncedKeyword);
    setOwnerships(filteredOwnerships);
  }, [debouncedKeyword, allOwnerships]);

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file' && name === 'image' && files[0]) {
      const file = files[0];
      setForm((prev) => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else if (type === 'file' && name === 'contract_image' && files.length > 0) {
      const validFiles = Array.from(files).filter((file) =>
        ['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)
      );
      setForm((prev) => ({ ...prev, contract_image: validFiles }));
      const readers = validFiles.map((file) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
      });
      Promise.all(readers).then((previews) => setContractPreviews(previews));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
      if (type === 'file' && !files[0]) {
        if (name === 'image') setImagePreview(null);
        if (name === 'contract_image') setContractPreviews([]);
      }
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleImageDelete = () => {
    setForm((prev) => ({ ...prev, image: null }));
    setImagePreview(null);
  };

  const handleContractDelete = (index) => {
    setForm((prev) => {
      const newFiles = [...prev.contract_image];
      newFiles.splice(index, 1);
      return { ...prev, contract_image: newFiles };
    });
    setContractPreviews((prev) => {
      const newPreviews = [...prev];
      newPreviews.splice(index, 1);
      return newPreviews;
    });
  };

  const validateForm = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Name is required';
    if (!form.email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errors.email = 'Invalid email format';
    if (!form.user_id) errors.user_id = 'User is required';
    if (form.image && !['image/jpeg', 'image/png', 'image/jpg'].includes(form.image?.type)) {
      errors.image = 'Image must be JPEG, PNG, or JPG';
    }
    if (form.contract_image.some((file) => !['image/jpeg', 'image/png', 'image/jpg'].includes(file.type))) {
      errors.contract_image = 'Contract images must be JPEG, PNG, or JPG';
    }
    return errors;
  };

  const resetForm = () => {
    setForm({
      id: null,
      name: '',
      phone: '',
      gender: '',
      email: '',
      nid: '',
      user_id: '',
      image: null,
      contract_image: [],
      status: true,
    });
    setFormErrors({});
    setIsEditing(false);
    setImagePreview(null);
    setContractPreviews([]);
    setSelectedUser('');
    setShowForm(false);
  };

  const openEditForm = (ownership) => {
    setForm({
      id: ownership.id,
      name: ownership.name || '',
      phone: ownership.phone || '',
      gender: ownership.gender || '',
      email: ownership.email || '',
      nid: ownership.nid || '',
      user_id: ownership.user_id ? String(ownership.user_id) : '',
      image: null,
      contract_image: [],
      status: ownership.status ?? true,
    });
    setFormErrors({});
    setIsEditing(true);
    setShowForm(true);
    setImagePreview(ownership.image || null);
    setContractPreviews(ownership.contract_image || []);
    setSelectedUser(ownership.user_id ? String(ownership.user_id) : '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('email', form.email);
    if (form.phone) formData.append('phone', form.phone);
    if (form.gender) formData.append('gender', form.gender);
    if (form.nid) formData.append('nid', form.nid);
    formData.append('user_id', form.user_id);
    if (form.image) formData.append('image', form.image);
    form.contract_image.forEach((file) => formData.append('contract_image[]', file));
    formData.append('status', form.status ? 1 : 0);

    try {
      setLoading(true);
      if (isEditing) {
        formData.append('_method', 'PUT');
        const { data } = await api.post(`/ownerships/${form.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success(data.message || 'Ownership updated successfully');
      } else {
        const { data } = await api.post('/ownerships', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success(data.message || 'Ownership created successfully');
      }
      resetForm();
      fetchOwnerships();
    } catch (err) {
      if (err.response?.status === 422) {
        setFormErrors(err.response.data.errors);
      } else {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to save ownership';
        toast.error(`Error: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      const { data } = await api.delete(`/ownerships/${deleteOwnershipId}`);
      toast.success(data.message || 'Ownership deleted successfully');
      setIsDeleteModalOpen(false);
      fetchOwnerships();
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete ownership';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
      setDeleteOwnershipId(null);
    }
  };

  const openDeleteModal = (id) => {
    setDeleteOwnershipId(id);
    setIsDeleteModalOpen(true);
  };

  const handleUserSelect = (e) => {
    const userId = e.target.value;
    setSelectedUser(userId);
    setForm((prev) => ({ ...prev, user_id: userId }));
    if (userId) {
      const ownership = allOwnerships.find((o) => o.user_id === Number(userId));
      if (ownership) {
        openEditForm(ownership);
      } else {
        setIsEditing(false);
        setShowForm(true);
      }
    } else {
      resetForm();
    }
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
      setContractPreviews([]);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-8 lg:p-10 bg-transparent">
      <ToastContainer position="top-right" autoClose={3000} />
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8">Ownership Management</h1>

      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-white bg-opacity-90 p-4 rounded-xl shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-2/3">
          <div className="relative w-full md:w-1/3">
            <input
              type="text"
              placeholder="Filter ownerships (min 2 characters)..."
              value={keyword}
              onChange={(e) => {
                const trimmedValue = e.target.value.trimStart();
                setKeyword(trimmedValue);
                if (trimmedValue === '') {
                  setOwnerships(allOwnerships);
                }
              }}
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-700 placeholder-gray-400"
              disabled={loading}
            />
          </div>
          <div className="w-full md:w-1/3">
            <select
              value={selectedUser}
              onChange={handleUserSelect}
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-700 ${
                users.length === 0 ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              disabled={loading || users.length === 0}
            >
              <option value="">Select a user</option>
              {users.map((user) => (
                <option key={user.id} value={String(user.id)}>
                  {user.name || 'N/A'} ({user.email || 'N/A'})
                </option>
              ))}
            </select>
            {users.length === 0 && (
              <p className="text-red-500 text-sm mt-2">No users available</p>
            )}
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            resetForm();
            setShowForm(true);
            setSelectedUser('');
          }}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          disabled={loading}
        >
          <FiPlus className="inline mr-2" /> Create Ownership
        </motion.button>
      </div>

      <div className="bg-white bg-opacity-90 rounded-xl shadow-sm overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">ID</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">Name</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">Phone</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">Gender</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">Email</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">NID</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">User</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">Image</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">Contracts</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="11" className="text-center py-6 text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="11" className="text-center py-6 text-red-500">
                  {error}
                </td>
              </tr>
            ) : ownerships.length === 0 ? (
              <tr>
                <td colSpan="11" className="text-center py-6 text-gray-500">
                  {debouncedKeyword.trim() ? `No ownerships found for "${debouncedKeyword}"` : 'No ownerships found'}
                </td>
              </tr>
            ) : (
              ownerships.map((ownership) => (
                <motion.tr
                  key={ownership.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-6 py-4 text-sm text-gray-700">{ownership.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{ownership.name || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{ownership.phone || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{ownership.gender || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{ownership.email || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{ownership.nid || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {ownership.user?.name || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {ownership.image ? (
                      <img src={ownership.image} alt="Ownership" className="w-10 h-10 rounded object-cover" />
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {ownership.contract_image?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {ownership.contract_image.map((url, i) => (
                          <img key={i} src={url} alt="Contract" className="w-8 h-8 rounded object-cover" />
                        ))}
                      </div>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        ownership.status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {ownership.status ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        openEditForm(ownership);
                        setSelectedUser(ownership.user_id ? String(ownership.user_id) : '');
                      }}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                      disabled={loading}
                    >
                      Edit
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openDeleteModal(ownership.id)}
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
                {isEditing ? 'Edit Ownership' : 'Create Ownership'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter name"
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
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Email <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter email"
                    value={form.email}
                    onChange={handleInputChange}
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-700 ${
                      formErrors.email ? 'border-red-600' : 'border-gray-200'
                    }`}
                    disabled={loading}
                  />
                  {formErrors.email && (
                    <p className="text-red-500 text-sm mt-2">{formErrors.email}</p>
                  )}
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-600 mb-2">Phone</label>
                  <input
                    type="text"
                    name="phone"
                    placeholder="Enter phone"
                    value={form.phone}
                    onChange={handleInputChange}
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-700 ${
                      formErrors.phone ? 'border-red-600' : 'border-gray-200'
                    }`}
                    disabled={loading}
                  />
                  {formErrors.phone && (
                    <p className="text-red-500 text-sm mt-2">{formErrors.phone}</p>
                  )}
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-600 mb-2">Gender</label>
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleInputChange}
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-700 ${
                      formErrors.gender ? 'border-red-600' : 'border-gray-200'
                    }`}
                    disabled={loading}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {formErrors.gender && (
                    <p className="text-red-500 text-sm mt-2">{formErrors.gender}</p>
                  )}
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-600 mb-2">NID</label>
                  <input
                    type="text"
                    name="nid"
                    placeholder="Enter NID number"
                    value={form.nid}
                    onChange={handleInputChange}
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-700 ${
                      formErrors.nid ? 'border-red-600' : 'border-gray-200'
                    }`}
                    disabled={loading}
                  />
                  {formErrors.nid && (
                    <p className="text-red-500 text-sm mt-2">{formErrors.nid}</p>
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
                    disabled={loading || users.length === 0}
                  >
                    <option value="">Select User</option>
                    {users.map((user) => (
                      <option key={user.id} value={String(user.id)}>
                        {user.name || 'N/A'} ({user.email || 'N/A'})
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
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-600 mb-2">Contract Images</label>
                  <input
                    type="file"
                    name="contract_image"
                    multiple
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handleInputChange}
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-700 ${
                      formErrors.contract_image ? 'border-red-600' : 'border-gray-200'
                    }`}
                    disabled={loading}
                  />
                  {formErrors.contract_image && (
                    <p className="text-red-500 text-sm mt-2">{formErrors.contract_image}</p>
                  )}
                  {contractPreviews.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-600 mb-2">Contract Previews</p>
                      <div className="flex flex-wrap gap-4">
                        {contractPreviews.map((prev, i) => (
                          <div key={i} className="flex flex-col items-center">
                            <img
                              src={prev}
                              alt="Contract Preview"
                              className="w-20 h-20 rounded-lg object-cover border border-gray-200"
                            />
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              type="button"
                              onClick={() => handleContractDelete(i)}
                              className="bg-red-600 text-white p-1 rounded mt-2 hover:bg-red-700 transition-colors"
                              disabled={loading}
                              title="Delete Contract Image"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </motion.button>
                          </div>
                        ))}
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
                    onClick={resetForm}
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
                Are you sure you want to delete this ownership? This action cannot be undone.
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

export default Ownership;