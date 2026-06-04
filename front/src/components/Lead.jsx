import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { useDebounce } from 'use-debounce';

const Lead = () => {
  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);
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
    contact: '',
    gender: '',
    email: '',
    nid: '',
    monthly_salary: '',
    occupation: '',
    background_history: '',
    user_id: '',
    image: null,
    documents: [],
    status: true,
  });
  const [formErrors, setFormErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLeadId, setDeleteLeadId] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [documentPreviews, setDocumentPreviews] = useState([]);

  const APIUrl = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/$/, '')
    : 'http://192.168.0.107:8000/api';

  const filterAndSortLeadsByRelevance = (leads, searchTerm) => {
    if (!searchTerm.trim()) return leads;
    const lowerSearch = searchTerm.toLowerCase();

    // Filter leads that match the search term
    const filteredLeads = leads.filter((lead) => {
      const name = (lead.name || '').toLowerCase();
      const email = (lead.email || '').toLowerCase();
      const contact = (lead.contact || '').toLowerCase();
      const nid = (lead.nid || '').toLowerCase();
      const gender = (lead.gender || '').toLowerCase();
      const occupation = (lead.occupation || '').toLowerCase();
      const status = lead.status ? 'true' : 'false';
      return (
        name.includes(lowerSearch) ||
        email.includes(lowerSearch) ||
        contact.includes(lowerSearch) ||
        nid.includes(lowerSearch) ||
        gender.includes(lowerSearch) ||
        occupation.includes(lowerSearch) ||
        status.includes(lowerSearch)
      );
    });

    // Sort filtered leads by relevance
    return filteredLeads.sort((a, b) => {
      const aName = (a.name || '').toLowerCase();
      const bName = (b.name || '').toLowerCase();
      const aEmail = (a.email || '').toLowerCase();
      const bEmail = (b.email || '').toLowerCase();

      // Priority 1: Exact matches for name or email
      if (aName === lowerSearch && bName !== lowerSearch) return -1;
      if (bName === lowerSearch && aName !== lowerSearch) return 1;
      if (aEmail === lowerSearch && bEmail !== lowerSearch) return -1;
      if (bEmail === lowerSearch && aEmail !== lowerSearch) return 1;

      // Priority 2: Name or email starts with search term
      if (aName.startsWith(lowerSearch) && !bName.startsWith(lowerSearch)) return -1;
      if (bName.startsWith(lowerSearch) && !aName.startsWith(lowerSearch)) return 1;
      if (aEmail.startsWith(lowerSearch) && !bEmail.startsWith(lowerSearch)) return -1;
      if (bEmail.startsWith(lowerSearch) && !aEmail.startsWith(lowerSearch)) return 1;

      // Priority 3: Name or email contains search term
      if (aName.includes(lowerSearch) && !bName.includes(lowerSearch)) return -1;
      if (bName.includes(lowerSearch) && !aName.includes(lowerSearch)) return 1;
      if (aEmail.includes(lowerSearch) && !bEmail.includes(lowerSearch)) return -1;
      if (bEmail.includes(lowerSearch) && !aEmail.includes(lowerSearch)) return 1;

      // Priority 4: Alphabetical order by name
      return aName.localeCompare(bName);
    });
  };

  const fetchLeads = async () => {
    if (debouncedKeyword.trim().length < 2 && debouncedKeyword !== '') {
      setLeads([]);
      setTotalPages(1);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    setError(null);
    try {
      const endpoint = debouncedKeyword.trim()
        ? `${APIUrl}/leads/search?limit=${perPage}&page=${page}&keyword=${encodeURIComponent(debouncedKeyword)}`
        : `${APIUrl}/leads?limit=${perPage}&page=${page}`;
      const { data } = await axios.get(endpoint);
      const sortedLeads = filterAndSortLeadsByRelevance(data.data || [], debouncedKeyword);
      setLeads(sortedLeads);
      setTotalPages(data.last_page || 1);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch leads';
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
      const { data } = await axios.get(`${APIUrl}/users?limit=0`);
      setUsers(data || []);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch users';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [page, perPage, debouncedKeyword]);

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file' && name === 'image' && files[0]) {
      const file = files[0];
      setForm((prev) => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else if (type === 'file' && name === 'documents' && files.length > 0) {
      const validFiles = Array.from(files).filter((file) =>
        ['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)
      );
      setForm((prev) => ({ ...prev, documents: validFiles }));
      const readers = validFiles.map((file) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
      });
      Promise.all(readers).then((previews) => setDocumentPreviews(previews));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
      if (type === 'file' && !files[0]) {
        if (name === 'image') setImagePreview(null);
        if (name === 'documents') setDocumentPreviews([]);
      }
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleImageDelete = () => {
    setForm((prev) => ({ ...prev, image: null }));
    setImagePreview(null);
  };

  const handleDocumentDelete = (index) => {
    setForm((prev) => {
      const newFiles = [...prev.documents];
      newFiles.splice(index, 1);
      return { ...prev, documents: newFiles };
    });
    setDocumentPreviews((prev) => {
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
    if (form.documents.some((file) => !['image/jpeg', 'image/png', 'image/jpg'].includes(file.type))) {
      errors.documents = 'Documents must be JPEG, PNG, or JPG';
    }
    return errors;
  };

  const resetForm = () => {
    setForm({
      id: null,
      name: '',
      contact: '',
      gender: '',
      email: '',
      nid: '',
      monthly_salary: '',
      occupation: '',
      background_history: '',
      user_id: '',
      image: null,
      documents: [],
      status: true,
    });
    setFormErrors({});
    setIsEditing(false);
    setImagePreview(null);
    setDocumentPreviews([]);
  };

  const openEditForm = (lead) => {
    setForm({
      id: lead.id,
      name: lead.name || '',
      contact: lead.contact || '',
      gender: lead.gender || '',
      email: lead.email || '',
      nid: lead.nid || '',
      monthly_salary: lead.monthly_salary || '',
      occupation: lead.occupation || '',
      background_history: lead.background_history || '',
      user_id: lead.user_id || '',
      image: null,
      documents: [],
      status: lead.status ?? true,
    });
    setFormErrors({});
    setIsEditing(true);
    setShowForm(true);
    setImagePreview(lead.image || null);
    setDocumentPreviews(lead.documents || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('email', form.email);
    if (form.contact) formData.append('contact', form.contact);
    if (form.gender) formData.append('gender', form.gender);
    if (form.nid) formData.append('nid', form.nid);
    if (form.monthly_salary) formData.append('monthly_salary', form.monthly_salary);
    if (form.occupation) formData.append('occupation', form.occupation);
    if (form.background_history) formData.append('background_history', form.background_history);
    formData.append('user_id', form.user_id);
    if (form.image) formData.append('image', form.image);
    form.documents.forEach((file) => formData.append('documents[]', file));
    formData.append('status', form.status ? 1 : 0);

    try {
      setLoading(true);
      if (isEditing) {
        formData.append('_method', 'PUT');
        const { data } = await axios.post(`${APIUrl}/leads/${form.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success(data.message || 'Lead updated successfully');
      } else {
        const { data } = await axios.post(`${APIUrl}/leads`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success(data.message || 'Lead created successfully');
      }
      resetForm();
      setShowForm(false);
      fetchLeads();
    } catch (err) {
      if (err.response?.status === 422) {
        setFormErrors(err.response.data.errors);
      } else {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to save lead';
        toast.error(`Error: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      const { data } = await axios.delete(`${APIUrl}/leads/${deleteLeadId}`);
      toast.success(data.message || 'Lead deleted successfully');
      setIsDeleteModalOpen(false);
      if (leads.length === 1 && page > 1) {
        setPage(page - 1);
      }
      fetchLeads();
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete lead';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
      setDeleteLeadId(null);
    }
  };

  const openDeleteModal = (id) => {
    setDeleteLeadId(id);
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
      setDocumentPreviews([]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8 lg:p-10">
      <ToastContainer position="top-right" autoClose={3000} />
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8">Lead Management</h1>

      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-white p-4 rounded-xl shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-2/3">
          <div className="relative w-full md:w-1/2">
            <input
              type="text"
              placeholder="Search leads (min 2 characters)..."
              value={keyword}
              onChange={(e) => {
                const trimmedValue = e.target.value.trimStart();
                setKeyword(trimmedValue);
                if (trimmedValue === '') {
                  setPage(1);
                  fetchLeads();
                }
              }}
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-700 placeholder-gray-400"
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
          <FiPlus className="inline mr-2" /> Create Lead
        </motion.button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">ID</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">Name</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">Contact</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">Gender</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">Email</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">NID</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">Monthly Salary</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">Occupation</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">Background History</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">User</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">Image</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">Documents</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold bg-blue-100 text-blue-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading || searchLoading ? (
              <tr>
                <td colSpan="14" className="text-center py-6 text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="14" className="text-center py-6 text-red-500">
                  {error}
                </td>
              </tr>
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan="14" className="text-center py-6 text-gray-500">
                  {debouncedKeyword.trim() ? `No leads found for "${debouncedKeyword}"` : 'No leads found'}
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <motion.tr
                  key={lead.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-6 py-4 text-sm text-gray-700">{lead.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{lead.name || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{lead.contact || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{lead.gender || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{lead.email || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{lead.nid || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{lead.monthly_salary ? `$${lead.monthly_salary}` : 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{lead.occupation || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{lead.background_history ? lead.background_history.substring(0, 50) + '...' : 'N/A'}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {lead.user?.name || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {lead.image ? (
                      <img src={lead.image} alt="Lead" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {lead.documents?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {lead.documents.map((url, i) => (
                          <img key={i} src={url} alt="Document" className="w-8 h-8 rounded object-cover" />
                        ))}
                      </div>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        lead.status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {lead.status ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openEditForm(lead)}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                      disabled={loading}
                    >
                      Edit
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openDeleteModal(lead.id)}
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
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
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
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
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
              className="bg-white rounded-xl p-8 w-full max-w-lg shadow-lg max-h-[80vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {isEditing ? 'Edit Lead' : 'Create Lead'}
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
                  <label className="block text-sm font-medium text-gray-600 mb-2">Contact</label>
                  <input
                    type="text"
                    name="contact"
                    placeholder="Enter contact"
                    value={form.contact}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-700"
                    disabled={loading}
                  />
                  {formErrors.contact && (
                    <p className="text-red-500 text-sm mt-2">{formErrors.contact}</p>
                  )}
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-600 mb-2">Gender</label>
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-700"
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
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-700"
                    disabled={loading}
                  />
                  {formErrors.nid && (
                    <p className="text-red-500 text-sm mt-2">{formErrors.nid}</p>
                  )}
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-600 mb-2">Monthly Salary</label>
                  <input
                    type="number"
                    name="monthly_salary"
                    placeholder="Enter monthly salary"
                    value={form.monthly_salary}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-700"
                    disabled={loading}
                  />
                  {formErrors.monthly_salary && (
                    <p className="text-red-500 text-sm mt-2">{formErrors.monthly_salary}</p>
                  )}
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-600 mb-2">Occupation</label>
                  <input
                    type="text"
                    name="occupation"
                    placeholder="Enter occupation"
                    value={form.occupation}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-700"
                    disabled={loading}
                  />
                  {formErrors.occupation && (
                    <p className="text-red-500 text-sm mt-2">{formErrors.occupation}</p>
                  )}
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-600 mb-2">Background History</label>
                  <textarea
                    name="background_history"
                    placeholder="Enter background history"
                    value={form.background_history}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-700"
                    disabled={loading}
                  />
                  {formErrors.background_history && (
                    <p className="text-red-500 text-sm mt-2">{formErrors.background_history}</p>
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
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-600 mb-2">Documents</label>
                  <input
                    type="file"
                    name="documents"
                    multiple
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handleInputChange}
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-700 ${
                      formErrors.documents ? 'border-red-600' : 'border-gray-200'
                    }`}
                    disabled={loading}
                  />
                  {formErrors.documents && (
                    <p className="text-red-500 text-sm mt-2">{formErrors.documents}</p>
                  )}
                  {documentPreviews.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-600 mb-2">Document Previews</p>
                      <div className="flex flex-wrap gap-4">
                        {documentPreviews.map((prev, i) => (
                          <div key={i} className="flex flex-col items-center">
                            <img
                              src={prev}
                              alt="Document Preview"
                              className="w-20 h-20 rounded-lg object-cover border border-gray-200"
                            />
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              type="button"
                              onClick={() => handleDocumentDelete(i)}
                              className="bg-red-600 text-white p-1 rounded mt-2 hover:bg-red-700 transition-colors"
                              disabled={loading}
                              title="Delete Document Image"
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
              className="bg-white rounded-xl p-8 w-full max-w-md shadow-lg"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Confirm Deletion</h2>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete this lead? This action cannot be undone.
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

export default Lead;