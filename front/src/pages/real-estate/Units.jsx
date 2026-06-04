import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { X, Trash2, Edit, Loader2, ArrowLeft } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">Something went wrong. Please try again.</span>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Utility for retrying API calls with authentication
const fetchWithRetry = async (url, options = {}, maxRetries = 3, baseDelay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const token = localStorage.getItem('auth_token');
      return await axios(url, {
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...options,
      });
    } catch (error) {
      if (error.response?.status === 429 && attempt < maxRetries) {
        const delay = baseDelay * 2 ** (attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
};

// Cache implementation
const createCache = (maxAge = 300000) => {
  let cache = {};
  return {
    get: (key) => {
      const item = cache[key];
      if (item && Date.now() - item.timestamp < maxAge) return item.data;
      return null;
    },
    set: (key, data) => {
      cache[key] = { data, timestamp: Date.now() };
    },
  };
};

const Units = () => {
  const { project_id, floor_id, unit_id } = useParams();
  const navigate = useNavigate();
  const [unit, setUnit] = useState(null);
  const [project, setProject] = useState(null);
  const [floor, setFloor] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    project_id: project_id || '',
    floor_id: floor_id || '',
    block_id: '',
    name: '',
    size: '',
    user_id: '',
    incentive_amount: '',
    price: '',
    for_owner: false,
    is_cancelled: false,
    image: null,
  });
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: null, // 'editUnit', 'deleteUnit'
  });

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://192.168.0.101:8000/api';
  const usersCache = createCache();

  // Fetch project, floor, blocks, and users
  const fetchSupportingData = useCallback(async () => {
    if (!project_id || !floor_id) return;
    try {
      const [projectRes, floorRes, blocksRes, usersRes] = await Promise.all([
        fetchWithRetry(`${API_BASE_URL}/projects/${project_id}`),
        fetchWithRetry(`${API_BASE_URL}/floors/${floor_id}`),
        fetchWithRetry(`${API_BASE_URL}/blocks?project_id=${project_id}&floor_id=${floor_id}`),
        fetchWithRetry(`${API_BASE_URL}/users?limit=0`),
      ]);
      setProject(projectRes.data.data || projectRes.data);
      setFloor(floorRes.data.data || floorRes.data);
      setBlocks(Array.isArray(blocksRes.data.data) ? blocksRes.data.data : blocksRes.data || []);
      const cachedUsers = usersCache.get('users');
      if (cachedUsers) {
        setUsers(cachedUsers);
      } else {
        const usersData = Array.isArray(usersRes.data.data) ? usersRes.data.data : usersRes.data || [];
        setUsers(usersData);
        usersCache.set('users', usersData);
      }
    } catch (err) {
      setError(
        err.response?.status === 429
          ? 'Too many requests. Please wait a moment and try again.'
          : err.response?.data?.message || 'Failed to fetch supporting data'
      );
    }
  }, [project_id, floor_id]);

  // Fetch unit by ID
  const fetchUnitById = useCallback(async () => {
    if (!unit_id) return;
    try {
      const response = await fetchWithRetry(`${API_BASE_URL}/units/${unit_id}`);
      const fetchedUnit = response.data.data || response.data;
      setUnit(fetchedUnit);
      setFormData({
        project_id: fetchedUnit.project_id?.toString() || project_id || '',
        floor_id: fetchedUnit.floor_id?.toString() || floor_id || '',
        block_id: fetchedUnit.block_id?.toString() || '',
        name: fetchedUnit.name || '',
        size: fetchedUnit.size?.toString() || '',
        user_id: fetchedUnit.user_id?.toString() || '',
        incentive_amount: fetchedUnit.incentive_amount?.toString() || '',
        price: fetchedUnit.price?.toString() || '',
        for_owner: !!fetchedUnit.for_owner,
        is_cancelled: !!fetchedUnit.is_cancelled,
        image: null,
      });
    } catch (err) {
      setError(
        err.response?.status === 429
          ? 'Too many requests. Please wait a moment and try again.'
          : err.response?.data?.message || 'Failed to fetch unit details'
      );
    }
  }, [unit_id, project_id, floor_id]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : files ? files[0] : value,
    }));
    setValidationErrors((prev) => ({ ...prev, [name]: null }));
  };

  // Handle image validation
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setValidationErrors((prev) => ({ ...prev, image: ['Only image files are allowed'] }));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setValidationErrors((prev) => ({ ...prev, image: ['Image size must be less than 10MB'] }));
      return;
    }
    setFormData((prev) => ({ ...prev, image: file }));
    setValidationErrors((prev) => ({ ...prev, image: null }));
  };

  // Validate form
  const validateUnitForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = ['Unit name is required'];
    if (!formData.size || isNaN(parseFloat(formData.size)) || parseFloat(formData.size) <= 0)
      errors.size = ['Size must be greater than 0'];
    if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0)
      errors.price = ['Price must be greater than 0'];
    if (!formData.user_id) errors.user_id = ['Please select a valid user'];
    if (!formData.block_id || !blocks.some((b) => b.id.toString() === formData.block_id))
      errors.block_id = ['Please select a valid block'];
    if (!formData.project_id) errors.project_id = ['Project ID is required'];
    if (!formData.floor_id) errors.floor_id = ['Floor ID is required'];
    return errors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationErrors({});
    setError(null);
    const errors = validateUnitForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setError('Please fix the validation errors');
      return;
    }

    const data = new FormData();
    const fields = {
      project_id: formData.project_id,
      floor_id: formData.floor_id,
      block_id: formData.block_id,
      name: formData.name,
      size: parseFloat(formData.size),
      price: parseFloat(formData.price),
      incentive_amount: formData.incentive_amount ? parseFloat(formData.incentive_amount) : 0,
      user_id: formData.user_id,
      for_owner: formData.for_owner ? '1' : '0',
      is_cancelled: formData.is_cancelled ? '1' : '0',
    };
    console.log('FormData Payload:', fields); // Debug payload
    Object.entries(fields).forEach(([key, value]) => {
      data.append(key, value);
    });
    if (formData.image instanceof File) {
      data.append('image', formData.image);
    }

    try {
      setIsSubmitting(true);
      const response = await fetchWithRetry(`${API_BASE_URL}/units/${unit.id}`, {
        method: 'PUT',
        data,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (response.status !== 200) {
        throw new Error(response.data.message || 'Failed to update unit');
      }
      setUnit(response.data.data || response.data);
      setFormData({
        project_id: response.data.data.project_id?.toString() || project_id || '',
        floor_id: response.data.data.floor_id?.toString() || floor_id || '',
        block_id: response.data.data.block_id?.toString() || '',
        name: response.data.data.name || '',
        size: response.data.data.size?.toString() || '',
        user_id: response.data.data.user_id?.toString() || '',
        incentive_amount: response.data.data.incentive_amount?.toString() || '',
        price: response.data.data.price?.toString() || '',
        for_owner: !!response.data.data.for_owner,
        is_cancelled: !!response.data.data.is_cancelled,
        image: null,
      });
      setModalState({ isOpen: false, mode: null });
    } catch (err) {
      console.error('Update Unit Error:', err.response?.data); // Log backend errors
      if (err.response?.status === 422) {
        setValidationErrors(err.response.data.errors || {});
        setError(
          err.response.data.message || 'Validation failed. Please check the form data.'
        );
      } else if (err.response?.status === 429) {
        setError('Too many requests. Please wait a moment and try again.');
      } else if (err.response?.status === 401) {
        setError('Unauthorized. Please log in and try again.');
      } else {
        setError(err.response?.data?.message || 'Failed to update unit');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      setIsSubmitting(true);
      const response = await fetchWithRetry(`${API_BASE_URL}/units/${unit.id}`, {
        method: 'DELETE',
      });
      if (response.status !== 200) {
        throw new Error(response.data.message || 'Failed to delete unit');
      }
      navigate(`/real-estate/projects/${project_id}/floors/${floor_id}/blocks`);
    } catch (err) {
      console.error('Delete Unit Error:', err.response?.data);
      setError(
        err.response?.status === 429
          ? 'Too many requests. Please wait a moment and try again.'
          : err.response?.status === 401
          ? 'Unauthorized. Please log in and try again.'
          : err.response?.data?.message || 'Failed to delete unit'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open modal
  const openModal = (mode) => {
    if (mode === 'editUnit' && unit) {
      setFormData({
        project_id: unit.project_id?.toString() || project_id || '',
        floor_id: unit.floor_id?.toString() || floor_id || '',
        block_id: unit.block_id?.toString() || '',
        name: unit.name || '',
        size: unit.size?.toString() || '',
        user_id: unit.user_id?.toString() || '',
        incentive_amount: unit.incentive_amount?.toString() || '',
        price: unit.price?.toString() || '',
        for_owner: !!unit.for_owner,
        is_cancelled: !!unit.is_cancelled,
        image: null,
      });
    }
    setValidationErrors({});
    setError(null);
    setModalState({ isOpen: true, mode });
  };

  // Close modal
  const closeModal = () => {
    setModalState({ isOpen: false, mode: null });
    setValidationErrors({});
    setError(null);
  };

  // Unit status utilities
  const getUnitStatus = (unit) => {
    if (unit.is_cancelled) return { text: 'Cancelled', class: 'bg-gray-100 text-gray-700' };
    if (unit.for_owner) return { text: 'Sold', class: 'bg-red-500 text-white' };
    return unit.user_id ? { text: 'Land Owner', class: 'bg-black text-white' } : { text: 'Unsold', class: 'bg-green-500 text-white' };
  };

  // Initial fetch
  useEffect(() => {
    if (!project_id || !floor_id || !unit_id) {
      setError('Invalid project, floor, or unit ID.');
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchSupportingData(), fetchUnitById()]);
      } catch (err) {
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [fetchSupportingData, fetchUnitById, project_id, floor_id, unit_id]);

  // Animation variants
  const fieldVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  if (!project_id || !floor_id || !unit_id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Missing Selection</h2>
          <p className="text-gray-600 mb-6">Please select a project, floor, and unit.</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/real-estate/projects')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Projects
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-6">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(`/real-estate/projects/${project_id}/floors/${floor_id}/blocks`)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mr-4"
              >
                <ArrowLeft size={20} />
                Back to Blocks
              </motion.button>
              <h1 className="text-3xl font-bold text-gray-800">Unit Details</h1>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-100 text-red-700 p-4 rounded-xl mb-6 shadow-sm relative"
            >
              {error}
              {validationErrors && Object.keys(validationErrors).length > 0 && (
                <ul className="list-disc list-inside mt-2">
                  {Object.entries(validationErrors).map(([key, messages]) =>
                    messages.map((msg, idx) => (
                      <li key={`${key}-${idx}`} className="text-sm">{`${key}: ${msg}`}</li>
                    ))
                  )}
                </ul>
              )}
              <button onClick={() => setError(null)} className="absolute top-2 right-2">
                <X size={16} />
              </button>
            </motion.div>
          )}

          {loading && (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
            </div>
          )}

          {!loading && !error && unit && (
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">{unit.name}</h2>
              <div className="space-y-4">
                <p className="text-sm text-gray-600"><strong>Project:</strong> {project?.name || 'N/A'}</p>
                <p className="text-sm text-gray-600"><strong>Floor:</strong> {floor?.floor_name || 'N/A'}</p>
                <p className="text-sm text-gray-600"><strong>Block:</strong> {blocks.find((b) => b.id.toString() === unit.block_id?.toString())?.block_name || 'N/A'}</p>
                <p className="text-sm text-gray-600"><strong>Size:</strong> {unit.size} sqft</p>
                <p className="text-sm text-gray-600"><strong>Price:</strong> {unit.price || 'N/A'}</p>
                <p className="text-sm text-gray-600"><strong>Incentive:</strong> {unit.incentive_amount || 'N/A'}</p>
                <p className="text-sm text-gray-600"><strong>User:</strong> {users.find((u) => u.id.toString() === unit.user_id?.toString())?.name || 'N/A'}</p>
                <p className="text-sm text-gray-600">
                  <strong>Status:</strong>{' '}
                  <span className={`px-2 py-1 rounded-full text-sm ${getUnitStatus(unit).class}`}>
                    {getUnitStatus(unit).text}
                  </span>
                </p>
                {unit.image && (
                  <div>
                    <p className="text-sm text-gray-600"><strong>Image:</strong></p>
                    <img src={unit.image} alt="Unit image" className="h-40 w-full object-contain rounded mt-1" />
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => openModal('editUnit')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
                >
                  <Edit size={16} className="mr-2" /> Edit
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => openModal('deleteUnit')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center"
                >
                  <Trash2 size={16} className="mr-2" /> Delete
                </motion.button>
              </div>
            </div>
          )}

          {/* Edit Unit Modal */}
          {modalState.isOpen && modalState.mode === 'editUnit' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={closeModal}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Edit Unit</h2>
                  <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                    <X size={24} />
                  </button>
                </div>
                {error && (
                  <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
                    {error}
                    {validationErrors && Object.keys(validationErrors).length > 0 && (
                      <ul className="list-disc list-inside mt-2">
                        {Object.entries(validationErrors).map(([key, messages]) =>
                          messages.map((msg, idx) => (
                            <li key={`${key}-${idx}`} className="text-sm">{`${key}: ${msg}`}</li>
                          ))
                        )}
                      </ul>
                    )}
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <motion.div variants={fieldVariants}>
                    <label className="block text-sm font-medium text-gray-700">Unit Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`mt-1 p-3 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        validationErrors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    />
                    {validationErrors.name && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.name[0]}</p>
                    )}
                  </motion.div>
                  <motion.div variants={fieldVariants}>
                    <label className="block text-sm font-medium text-gray-700">Project *</label>
                    <input
                      type="text"
                      value={project?.name || 'Loading...'}
                      className="mt-1 p-3 w-full border border-gray-300 rounded-lg bg-gray-100"
                      disabled
                    />
                    {validationErrors.project_id && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.project_id[0]}</p>
                    )}
                  </motion.div>
                  <motion.div variants={fieldVariants}>
                    <label className="block text-sm font-medium text-gray-700">Floor *</label>
                    <input
                      type="text"
                      value={floor?.floor_name || 'Loading...'}
                      className="mt-1 p-3 w-full border border-gray-300 rounded-lg bg-gray-100"
                      disabled
                    />
                    {validationErrors.floor_id && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.floor_id[0]}</p>
                    )}
                  </motion.div>
                  <motion.div variants={fieldVariants}>
                    <label className="block text-sm font-medium text-gray-700">Block *</label>
                    <select
                      name="block_id"
                      value={formData.block_id}
                      onChange={handleInputChange}
                      className={`mt-1 p-3 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        validationErrors.block_id ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    >
                      <option value="">Select Block</option>
                      {blocks.map((block) => (
                        <option key={block.id} value={block.id.toString()}>
                          {block.block_name}
                        </option>
                      ))}
                    </select>
                    {validationErrors.block_id && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.block_id[0]}</p>
                    )}
                  </motion.div>
                  <motion.div variants={fieldVariants}>
                    <label className="block text-sm font-medium text-gray-700">Size (sqft) *</label>
                    <input
                      type="number"
                      name="size"
                      value={formData.size}
                      onChange={handleInputChange}
                      className={`mt-1 p-3 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        validationErrors.size ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                      min="0.01"
                      step="0.01"
                    />
                    {validationErrors.size && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.size[0]}</p>
                    )}
                  </motion.div>
                  <motion.div variants={fieldVariants}>
                    <label className="block text-sm font-medium text-gray-700">Price *</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      className={`mt-1 p-3 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        validationErrors.price ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                      min="0.01"
                      step="0.01"
                    />
                    {validationErrors.price && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.price[0]}</p>
                    )}
                  </motion.div>
                  <motion.div variants={fieldVariants}>
                    <label className="block text-sm font-medium text-gray-700">Incentive Amount</label>
                    <input
                      type="number"
                      name="incentive_amount"
                      value={formData.incentive_amount}
                      onChange={handleInputChange}
                      className="mt-1 p-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.01"
                    />
                    {validationErrors.incentive_amount && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.incentive_amount[0]}</p>
                    )}
                  </motion.div>
                  <motion.div variants={fieldVariants}>
                    <label className="block text-sm font-medium text-gray-700">User *</label>
                    <select
                      name="user_id"
                      value={formData.user_id}
                      onChange={handleInputChange}
                      className={`mt-1 p-3 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        validationErrors.user_id ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    >
                      <option value="">Select User</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id.toString()}>
                          {user.name || `User ${user.id}`}
                        </option>
                      ))}
                    </select>
                    {validationErrors.user_id && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.user_id[0]}</p>
                    )}
                  </motion.div>
                  <motion.div variants={fieldVariants} className="flex items-center">
                    <input
                      type="checkbox"
                      name="for_owner"
                      checked={formData.for_owner}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">For Owner</label>
                  </motion.div>
                  <motion.div variants={fieldVariants} className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_cancelled"
                      checked={formData.is_cancelled}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">Cancelled</label>
                  </motion.div>
                  <motion.div variants={fieldVariants}>
                    <label className="block text-sm font-medium text-gray-700">Image (Optional)</label>
                    <input
                      type="file"
                      name="image"
                      onChange={handleImageChange}
                      accept="image/jpeg,image/png,image/jpg"
                      className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {validationErrors.image && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.image[0]}</p>
                    )}
                    {formData.image instanceof File && (
                      <div className="mt-2">
                        <img
                          src={URL.createObjectURL(formData.image)}
                          alt="Preview"
                          className="h-20 object-contain rounded"
                        />
                      </div>
                    )}
                    {unit?.image && !formData.image && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">Current Image:</p>
                        <img
                          src={unit.image}
                          alt="Current unit image"
                          className="h-20 object-contain rounded mt-1"
                        />
                      </div>
                    )}
                  </motion.div>
                  <div className="flex justify-end gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: isSubmitting ? 1 : 1.05 }}
                      whileTap={{ scale: isSubmitting ? 1 : 0.95 }}
                      type="submit"
                      className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center ${
                        isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      disabled={isSubmitting}
                    >
                      {isSubmitting && <Loader2 className="animate-spin h-5 w-5 mr-2" />}
                      Update
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}

          {/* Delete Unit Modal */}
          {modalState.isOpen && modalState.mode === 'deleteUnit' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
              >
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Confirm Deletion</h2>
                <p className="mb-6 text-gray-600">
                  Are you sure you want to delete the unit "{unit.name}"? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: isSubmitting ? 1 : 1.05 }}
                    whileTap={{ scale: isSubmitting ? 1 : 0.95 }}
                    onClick={handleDelete}
                    className={`px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-700 ${
                      isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={isSubmitting}
                  >
                    Delete
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Units;