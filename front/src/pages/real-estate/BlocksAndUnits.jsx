import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { X, Trash2, PlusCircle, Eye, ArrowLeft, PencilIcon } from 'lucide-react';
import { FaBuilding } from 'react-icons/fa';
import { useParams, useNavigate } from 'react-router-dom';

// Error Boundary Component (unchanged)
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

// Utility for retrying API calls (unchanged)
const fetchWithRetry = async (url, options = {}, maxRetries = 3, baseDelay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const token = localStorage.getItem('auth_token');
      return await axios(url, {
        headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
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

// Cache implementation (unchanged)
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

const BlocksAndUnits = () => {
  const { floor_id, project_id } = useParams();
  const navigate = useNavigate();
  const [blocks, setBlocks] = useState([]);
  const [units, setUnits] = useState({});
  const [floor, setFloor] = useState(null);
  const [project, setProject] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: null,
    data: null,
    selectedBlock: null,
  });
  const [blockFormData, setBlockFormData] = useState({
    project_id: project_id || '',
    floor_id: floor_id || '',
    block_name: '',
    user_id: '',
    status: true,
  });
  const [unitFormData, setUnitFormData] = useState({
    project_id: project_id || '',
    floor_id: floor_id || '',
    block_id: '',
    name: '',
    size: '',
    price: '',
    incentive_amount: '',
    for_owner: false,
    is_cancelled: false,
    user_id: '',
    image: null,
  });

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://192.168.0.101:8000/api';
  const usersCache = createCache();

  // Fetch floor and project details (unchanged)
  const fetchFloorAndProject = useCallback(async () => {
    if (!floor_id || !project_id) return;
    try {
      const [floorResponse, projectResponse] = await Promise.all([
        fetchWithRetry(`${API_BASE_URL}/floors/${floor_id}`),
        fetchWithRetry(`${API_BASE_URL}/projects/${project_id}`),
      ]);
      setFloor(floorResponse.data.data || floorResponse.data);
      setProject(projectResponse.data.data || projectResponse.data);
      setBlockFormData((prev) => ({ ...prev, project_id, floor_id }));
      setUnitFormData((prev) => ({ ...prev, project_id, floor_id }));
    } catch (err) {
      setError(
        err.response?.status === 429
          ? 'Too many requests. Please wait a moment and try again.'
          : err.response?.data?.message || 'Failed to fetch floor/project details'
      );
    }
  }, [floor_id, project_id]);

  // Fetch blocks with project_id and floor_id
  const fetchBlocks = useCallback(async () => {
    if (!floor_id || !project_id) {
      setError('Please select a project and floor to view blocks.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await fetchWithRetry(
        `${API_BASE_URL}/blocks?project_id=${project_id}&floor_id=${floor_id}`
      );
      const blocksData = Array.isArray(response.data.data) ? response.data.data : response.data || [];
      setBlocks(blocksData);
    } catch (err) {
      setError(
        err.response?.status === 429
          ? 'Too many requests. Please wait a moment and try again.'
          : err.response?.data?.message || 'Failed to fetch blocks'
      );
      setBlocks([]);
    } finally {
      setLoading(false);
    }
  }, [floor_id, project_id]);

  // Fetch units with project_id, floor_id, and block_id
  const fetchUnits = useCallback(async (blockId) => {
    if (!floor_id || !project_id || !blockId) {
      setError('Please select a project, floor, and block to view units.');
      return [];
    }
    try {
      const response = await fetchWithRetry(
        `${API_BASE_URL}/units?project_id=${project_id}&floor_id=${floor_id}&block_id=${blockId}`
      );
      return Array.isArray(response.data.data) ? response.data.data : response.data || [];
    } catch (err) {
      setError(
        err.response?.status === 429
          ? 'Too many requests. Please wait a moment and try again.'
          : err.response?.data?.message || 'Failed to fetch units'
      );
      return [];
    }
  }, [floor_id, project_id]);

  // Fetch users (unchanged)
  const fetchUsers = useCallback(async () => {
    try {
      const cachedUsers = usersCache.get('users');
      if (cachedUsers) {
        setUsers(cachedUsers);
        return;
      }
      const response = await fetchWithRetry(`${API_BASE_URL}/users?limit=0`);
      const usersData = Array.isArray(response.data) ? response.data : response.data.data || [];
      setUsers(usersData);
      usersCache.set('users', usersData);
    } catch (err) {
      setError(
        err.response?.status === 429
          ? 'Too many requests. Please wait a moment and try again.'
          : err.response?.data?.message || 'Failed to fetch users'
      );
      setUsers([]);
    }
  }, []);

  // Fetch units for all blocks after blocks are loaded
  useEffect(() => {
    if (!floor_id || !project_id || !blocks.length) return;
    const fetchAllUnits = async () => {
      const unitsByBlock = {};
      for (const block of blocks) {
        const blockUnits = await fetchUnits(block.id);
        unitsByBlock[block.id] = blockUnits;
      }
      setUnits(unitsByBlock);
    };
    fetchAllUnits();
  }, [blocks, fetchUnits, floor_id, project_id]);

  // Initial data fetch
  useEffect(() => {
    if (!floor_id || !project_id) {
      setError('Please select a project and floor from the Floors page.');
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchFloorAndProject(), fetchBlocks(), fetchUsers()]);
      } catch (err) {
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [fetchFloorAndProject, fetchBlocks, fetchUsers, floor_id, project_id]);

  // Form handling and validation (unchanged)
  const handleBlockInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBlockFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setValidationErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleUnitInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setUnitFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : files ? files[0] : value,
    }));
    setValidationErrors((prev) => ({ ...prev, [name]: null }));
  };

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
    setUnitFormData((prev) => ({ ...prev, image: file }));
    setValidationErrors((prev) => ({ ...prev, image: null }));
  };

  const validateBlockForm = () => {
    const errors = {};
    if (!blockFormData.block_name.trim()) errors.block_name = ['Block name is required'];
    if (!blockFormData.user_id) errors.user_id = ['Please select a valid user'];
    return errors;
  };

  const validateUnitForm = () => {
    const errors = {};
    if (!unitFormData.name.trim()) errors.name = ['Unit name is required'];
    if (!unitFormData.size || isNaN(parseFloat(unitFormData.size)) || parseFloat(unitFormData.size) <= 0)
      errors.size = ['Size must be a positive number'];
    if (!unitFormData.price || isNaN(parseFloat(unitFormData.price)) || parseFloat(unitFormData.price) < 0)
      errors.price = ['Price must be a non-negative number'];
    if (!unitFormData.user_id) errors.user_id = ['Please select a valid user'];
    if (!unitFormData.block_id || !blocks.some((b) => b.id.toString() === unitFormData.block_id))
      errors.block_id = ['Please select a valid block'];
    return errors;
  };

  // Handle block submission (unchanged)
  const handleBlockSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setValidationErrors({});
    const errors = validateBlockForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setError('Please fix the validation errors');
      setIsSubmitting(false);
      return;
    }
    try {
      const isEditing = modalState.mode === 'editBlock';
      const url = isEditing ? `${API_BASE_URL}/blocks/${modalState.data.id}` : `${API_BASE_URL}/blocks`;
      const response = await axios({
        method: isEditing ? 'PUT' : 'POST',
        url,
        data: blockFormData,
        headers: { Accept: 'application/json' },
      });
      if (response.status !== (isEditing ? 200 : 201)) {
        throw new Error(response.data.message || `Failed to ${isEditing ? 'update' : 'create'} block`);
      }
      setBlocks((prev) =>
        isEditing
          ? prev.map((b) => (b.id === modalState.data.id ? response.data.data : b))
          : [...prev, response.data.data]
      );
      setModalState({ isOpen: false, mode: null, data: null, selectedBlock: null });
      resetBlockForm();
    } catch (err) {
      if (err.response?.status === 422) {
        setValidationErrors(err.response.data.errors || {});
        setError('Please fix the validation errors');
      } else if (err.response?.status === 429) {
        setError('Too many requests. Please wait a moment and try again.');
      } else {
        setError(err.response?.data?.message || `Failed to ${modalState.mode === 'editBlock' ? 'update' : 'create'} block`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle unit submission (updated to refresh units for the specific block)
  const handleUnitSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setValidationErrors({});
    const errors = validateUnitForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setError('Please fix the validation errors');
      setIsSubmitting(false);
      return;
    }
    const data = new FormData();
    Object.entries(unitFormData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (key === 'size' || key === 'price' || key === 'incentive_amount') {
          data.append(key, parseFloat(value) || 0);
        } else if (key === 'for_owner' || key === 'is_cancelled') {
          data.append(key, value ? '1' : '0');
        } else {
          data.append(key, value);
        }
      }
    });
    try {
      const isEditing = modalState.mode === 'editUnit';
      const url = isEditing ? `${API_BASE_URL}/units/${modalState.data.id}` : `${API_BASE_URL}/units`;
      const response = await axios({
        method: isEditing ? 'PUT' : 'POST',
        url,
        data,
        headers: { 'Content-Type': 'multipart/form-data', Accept: 'application/json' },
      });
      if (response.status !== (isEditing ? 200 : 201)) {
        throw new Error(response.data.message || `Failed to ${isEditing ? 'update' : 'create'} unit`);
      }
      const blockId = unitFormData.block_id;
      const updatedUnits = await fetchUnits(blockId);
      setUnits((prev) => ({ ...prev, [blockId]: updatedUnits }));
      setModalState({ isOpen: false, mode: null, data: null, selectedBlock: null });
      resetUnitForm();
    } catch (err) {
      if (err.response?.status === 422) {
        setValidationErrors(err.response.data.errors || {});
        setError('Please fix the validation errors');
      } else if (err.response?.status === 429) {
        setError('Too many requests. Please wait a moment and try again.');
      } else {
        setError(err.response?.data?.message || `Failed to ${modalState.mode === 'editUnit' ? 'update' : 'create'} unit`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle block deletion (updated to clear units for the deleted block)
  const handleDeleteBlock = async () => {
    try {
      setIsSubmitting(true);
      const response = await axios.delete(`${API_BASE_URL}/blocks/${modalState.data.id}`, {
        headers: { Accept: 'application/json' },
      });
      if (response.status !== 200) throw new Error(response.data.message || 'Failed to delete block');
      setBlocks((prev) => prev.filter((b) => b.id !== modalState.data.id));
      setUnits((prev) => {
        const { [modalState.data.id]: _, ...rest } = prev;
        return rest;
      });
      setModalState({ isOpen: false, mode: null, data: null, selectedBlock: null });
    } catch (err) {
      setError(
        err.response?.status === 429
          ? 'Too many requests. Please wait a moment and try again.'
          : err.response?.data?.message || 'Failed to delete block'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle unit deletion (updated to refresh units for the specific block)
  const handleDeleteUnit = async () => {
    try {
      setIsSubmitting(true);
      const blockId = modalState.data.block_id.toString();
      const response = await axios.delete(`${API_BASE_URL}/units/${modalState.data.id}`, {
        headers: { Accept: 'application/json' },
      });
      if (response.status !== 200) throw new Error(response.data.message || 'Failed to delete unit');
      const updatedUnits = await fetchUnits(blockId);
      setUnits((prev) => ({ ...prev, [blockId]: updatedUnits }));
      setModalState({ isOpen: false, mode: null, data: null, selectedBlock: null });
    } catch (err) {
      setError(
        err.response?.status === 429
          ? 'Too many requests. Please wait a moment and try again.'
          : err.response?.data?.message || 'Failed to delete unit'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open modal (unchanged)
  const openModal = (mode, data = null, selectedBlock = null) => {
    if (mode === 'editBlock' && data) {
      setBlockFormData({
        project_id: data.project_id.toString(),
        floor_id: data.floor_id.toString(),
        block_name: data.block_name,
        user_id: data.user_id.toString(),
        status: !!data.status,
      });
    } else if (mode === 'createUnit' && data) {
      setUnitFormData((prev) => ({
        ...prev,
        block_id: data.id.toString(),
      }));
    } else if (mode === 'editUnit' && data) {
      setUnitFormData({
        project_id: data.project_id.toString(),
        floor_id: data.floor_id.toString(),
        block_id: data.block_id.toString(),
        name: data.name,
        size: data.size,
        price: data.price || '',
        incentive_amount: data.incentive_amount || '',
        for_owner: !!data.for_owner,
        is_cancelled: !!data.is_cancelled,
        user_id: data.user_id.toString(),
        image: null,
      });
    }
    setValidationErrors({});
    setModalState({ isOpen: true, mode, data, selectedBlock: selectedBlock || data });
  };

  // Reset forms (unchanged)
  const resetBlockForm = () => {
    setModalState({ isOpen: false, mode: null, data: null, selectedBlock: null });
    setBlockFormData({
      project_id: project_id || '',
      floor_id: floor_id || '',
      block_name: '',
      user_id: '',
      status: true,
    });
    setValidationErrors({});
  };

  const resetUnitForm = () => {
    setModalState({ isOpen: false, mode: null, data: null, selectedBlock: null });
    setUnitFormData({
      project_id: project_id || '',
      floor_id: floor_id || '',
      block_id: '',
      name: '',
      size: '',
      price: '',
      incentive_amount: '',
      for_owner: false,
      is_cancelled: false,
      user_id: '',
      image: null,
    });
    setValidationErrors({});
  };

  // Unit status utilities (unchanged)
  const getUnitStatusColor = (unit) => {
    if (unit.is_cancelled) return 'bg-gray-100 text-gray-700';
    if (unit.for_owner) return 'bg-red-500 text-white';
    return unit.user_id ? 'bg-black text-white' : 'bg-green-500 text-white';
  };

  const getUnitStatusText = (unit) => {
    if (unit.is_cancelled) return 'Cancelled';
    if (unit.for_owner) return 'Sold';
    return unit.user_id ? 'Land Owner' : 'Unsold';
  };

  // Navigation handlers (unchanged)
  const handleUnitClick = (unit) => {
    navigate(`/real-estate/projects/${project_id}/floors/${floor_id}/units/${unit.id}`);
  };

  const handleBackToFloors = () => {
    navigate(`/real-estate/projects/${project_id}/floors`);
  };

  const handleViewFloorPlan = () => {
    if (floor?.floor_plan_image) {
      window.open(floor.floor_plan_image, '_blank');
    } else {
      setError('No floor plan image available.');
    }
  };

  if (!floor_id || !project_id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Missing Selection</h2>
          <p className="text-gray-600 mb-6">Please select a project and floor from the Floors page.</p>
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
          {/* Header (unchanged) */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBackToFloors}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mr-4"
              >
                <ArrowLeft size={20} />
                Back to Floors
              </motion.button>
              <h1 className="text-3xl font-bold text-gray-800">{floor?.floor_name || 'Floor'}</h1>
            </div>
            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleViewFloorPlan}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                View Floor Plan
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => openModal('createBlock')}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700"
              >
                <PlusCircle size={20} />
                Add New Block
              </motion.button>
            </div>
          </div>

          {/* Error Message (unchanged) */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-100 text-red-700 p-4 rounded-xl mb-6 shadow-sm relative"
            >
              {error}
              <button onClick={() => setError(null)} className="absolute top-2 right-2">
                <X size={16} />
              </button>
            </motion.div>
          )}

          {/* Loading State (unchanged) */}
          {loading && (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}

          {/* Blocks and Units */}
          {!loading && !error && (
            <div className="space-y-6">
              {Array.isArray(blocks) && blocks.map((block) => (
                <div
                  key={block.id}
                  className="relative bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-all duration-300"
                >
                  <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
                  <div className="flex items-center justify-between mt-4">
                    <h3 className="text-xl font-bold text-gray-800">{block.block_name}</h3>
                    <FaBuilding className="text-3xl text-gray-500" />
                  </div>
                  <p className="text-gray-600 mt-2">
                    Status:{' '}
                    <span
                      className={`px-2 py-1 rounded-full text-sm ${
                        block.status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {block.status ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-gray-700">Units:</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 mt-2">
                      {units[block.id]?.map((unit) => (
                        <motion.div
                          key={unit.id}
                          className="relative bg-white p-2 rounded-lg shadow-sm cursor-pointer hover:bg-gray-50"
                          onClick={() => handleUnitClick(unit)}
                        >
                          <div
                            className={`w-full h-16 flex items-center justify-center text-sm font-medium rounded ${getUnitStatusColor(
                              unit
                            )}`}
                          >
                            {unit.name}
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              openModal('viewUnit', unit, blocks.find((b) => b.id.toString() === unit.block_id.toString()));
                            }}
                            className="absolute top-1 right-1 p-1 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200"
                            title="View Unit"
                          >
                            <Eye size={14} />
                          </motion.button>
                          <div className="flex justify-center gap-2 mt-1">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                openModal('editUnit', unit, blocks.find((b) => b.id.toString() === unit.block_id.toString()));
                              }}
                              className="p-1 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200"
                              title="Edit Unit"
                            >
                              <PencilIcon size={12} />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                openModal('deleteUnit', unit);
                              }}
                              className="p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                              title="Delete Unit"
                            >
                              <Trash2 size={12} />
                            </motion.button>
                          </div>
                        </motion.div>
                      )) || <p className="text-sm text-gray-500 mt-2">No units in this block.</p>}
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => openModal('editBlock', block)}
                      className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200"
                    >
                      <PencilIcon size={18} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => openModal('deleteBlock', block)}
                      className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                    >
                      <Trash2 size={18} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openModal('createUnit', block, block)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Add Unit
                    </motion.button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State (unchanged) */}
          {!loading && !error && blocks.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl shadow-lg">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-4 0H9m4 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v12m4 0V9"
                />
              </svg>
              <h3 className="mt-2 text-xl font-medium text-gray-900">No blocks found</h3>
              <p className="mt-2 text-sm text-gray-500">Get started by creating a new block for this floor.</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => openModal('createBlock')}
                className="mt-6 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusCircle size={16} className="mr-2" />
                Add New Block
              </motion.button>
            </div>
          )}

          {/* Block Create/Edit Modal (unchanged) */}
          {modalState.isOpen && (modalState.mode === 'createBlock' || modalState.mode === 'editBlock') && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={resetBlockForm}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {modalState.mode === 'editBlock' ? 'Edit Block' : 'Create New Block'}
                  </h2>
                  <button onClick={resetBlockForm} className="text-gray-500 hover:text-gray-700">
                    <X size={24} />
                  </button>
                </div>
                {error && (
                  <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">{error}</div>
                )}
                <form onSubmit={handleBlockSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Block Name *</label>
                    <input
                      type="text"
                      name="block_name"
                      value={blockFormData.block_name}
                      onChange={handleBlockInputChange}
                      className={`mt-1 p-3 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        validationErrors.block_name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    />
                    {validationErrors.block_name && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.block_name[0]}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Project *</label>
                    <input
                      type="text"
                      value={project?.name || 'Loading...'}
                      className="mt-1 p-3 w-full border border-gray-300 rounded-lg bg-gray-100"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Floor *</label>
                    <input
                      type="text"
                      value={floor?.floor_name || 'Loading...'}
                      className="mt-1 p-3 w-full border border-gray-300 rounded-lg bg-gray-100"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">User *</label>
                    <select
                      name="user_id"
                      value={blockFormData.user_id}
                      onChange={handleBlockInputChange}
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
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="status"
                      checked={blockFormData.status}
                      onChange={handleBlockInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">Active</label>
                  </div>
                  <div className="flex justify-end gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={resetBlockForm}
                      className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: isSubmitting ? 1 : 1.05 }}
                      whileTap={{ scale: isSubmitting ? 1 : 0.95 }}
                      type="submit"
                      className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ${
                        isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      disabled={isSubmitting}
                    >
                      {modalState.mode === 'editBlock' ? 'Update' : 'Create'}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}

          {/* Unit Create/Edit Modal (unchanged) */}
          {modalState.isOpen && (modalState.mode === 'createUnit' || modalState.mode === 'editUnit') && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={resetUnitForm}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {modalState.mode === 'editUnit' ? 'Edit Unit' : 'Create New Unit'}
                  </h2>
                  <button onClick={resetUnitForm} className="text-gray-500 hover:text-gray-700">
                    <X size={24} />
                  </button>
                </div>
                {error && (
                  <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">{error}</div>
                )}
                <form onSubmit={handleUnitSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Unit Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={unitFormData.name}
                      onChange={handleUnitInputChange}
                      className={`mt-1 p-3 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        validationErrors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    />
                    {validationErrors.name && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.name[0]}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Block *</label>
                    <input
                      type="text"
                      value={modalState.selectedBlock?.block_name || 'Loading...'}
                      className="mt-1 p-3 w-full border border-gray-300 rounded-lg bg-gray-100"
                      disabled
                    />
                    {validationErrors.block_id && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.block_id[0]}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Size (sqft) *</label>
                    <input
                      type="number"
                      name="size"
                      value={unitFormData.size}
                      onChange={handleUnitInputChange}
                      className={`mt-1 p-3 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        validationErrors.size ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                      min="1"
                      step="0.01"
                    />
                    {validationErrors.size && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.size[0]}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Price *</label>
                    <input
                      type="number"
                      name="price"
                      value={unitFormData.price}
                      onChange={handleUnitInputChange}
                      className={`mt-1 p-3 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        validationErrors.price ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                      min="0"
                      step="0.01"
                    />
                    {validationErrors.price && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.price[0]}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Incentive Amount</label>
                    <input
                      type="number"
                      name="incentive_amount"
                      value={unitFormData.incentive_amount}
                      onChange={handleUnitInputChange}
                      className="mt-1 p-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">User *</label>
                    <select
                      name="user_id"
                      value={unitFormData.user_id}
                      onChange={handleUnitInputChange}
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
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="for_owner"
                      checked={unitFormData.for_owner}
                      onChange={handleUnitInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">For Owner</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_cancelled"
                      checked={unitFormData.is_cancelled}
                      onChange={handleUnitInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">Cancelled</label>
                  </div>
                  <div>
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
                    {unitFormData.image instanceof File && (
                      <div className="mt-2">
                        <img
                          src={URL.createObjectURL(unitFormData.image)}
                          alt="Preview"
                          className="h-20 object-contain rounded"
                        />
                      </div>
                    )}
                    {modalState.mode === 'editUnit' && modalState.data?.image && !unitFormData.image && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">Current Image:</p>
                        <img
                          src={modalState.data.image}
                          alt="Current unit image"
                          className="h-20 object-contain rounded mt-1"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={resetUnitForm}
                      className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: isSubmitting ? 1 : 1.05 }}
                      whileTap={{ scale: isSubmitting ? 1 : 0.95 }}
                      type="submit"
                      className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ${
                        isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      disabled={isSubmitting}
                    >
                      {modalState.mode === 'editUnit' ? 'Update' : 'Create'}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}

          {/* Unit View Modal (unchanged) */}
          {modalState.isOpen && modalState.mode === 'viewUnit' && modalState.data && (
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
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">{modalState.data.name}</h2>
                  <button onClick={resetUnitForm} className="text-gray-500 hover:text-gray-700">
                    <X size={24} />
                  </button>
                </div>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    <strong>Block:</strong> {modalState.selectedBlock?.block_name || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Size:</strong> {modalState.data.size} sqft
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Price:</strong> {modalState.data.price || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Incentive:</strong> {modalState.data.incentive_amount || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Created by:</strong> {modalState.data.user?.name || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Status:</strong>{' '}
                    <span
                      className={`px-2 py-1 rounded-full text-sm ${getUnitStatusColor(modalState.data)}`}
                    >
                      {getUnitStatusText(modalState.data)}
                    </span>
                  </p>
                  {modalState.data.image && (
                    <div>
                      <p className="text-sm text-gray-600"><strong>Image:</strong></p>
                      <img
                        src={modalState.data.image}
                        alt="Unit image"
                        className="h-40 w-full object-contain rounded mt-1"
                      />
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={resetUnitForm}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                  >
                    Close
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleUnitClick(modalState.data)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    View Full Details
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Delete Block Modal (unchanged) */}
          {modalState.isOpen && modalState.mode === 'deleteBlock' && modalState.data && (
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
                  Are you sure you want to delete the block "{modalState.data.block_name}"? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={resetBlockForm}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: isSubmitting ? 1 : 1.05 }}
                    whileTap={{ scale: isSubmitting ? 1 : 0.95 }}
                    onClick={handleDeleteBlock}
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

          {/* Delete Unit Modal (unchanged) */}
          {modalState.isOpen && modalState.mode === 'deleteUnit' && modalState.data && (
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
                  Are you sure you want to delete the unit "{modalState.data.name}"? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={resetUnitForm}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: isSubmitting ? 1 : 1.05 }}
                    whileTap={{ scale: isSubmitting ? 1 : 0.95 }}
                    onClick={handleDeleteUnit}
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

export default BlocksAndUnits;