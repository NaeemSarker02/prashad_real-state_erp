import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Eye, X, Trash2, PlusCircle, Pencil, ArrowLeft } from 'lucide-react';
import { FaBuilding } from 'react-icons/fa';
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

// Utility function for retrying API calls with exponential backoff
const fetchWithRetry = async (url, maxRetries = 3, baseDelay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.get(url, {
        headers: { Accept: 'application/json' },
      });
      return response;
    } catch (error) {
      if (error.response?.status === 429 && attempt < maxRetries) {
        const delay = baseDelay * 2 ** (attempt - 1);
        console.log(`Rate limit hit for ${url}, retrying after ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
};

// Utility function for adding delays
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Simple cache implementation
const createCache = (maxAge = 300000) => {
  let cache = {};
  return {
    get: (key) => {
      const item = cache[key];
      if (item && Date.now() - item.timestamp < maxAge) {
        return item.data;
      }
      return null;
    },
    set: (key, data) => {
      cache[key] = { data, timestamp: Date.now() };
    },
    clear: () => {
      cache = {};
    },
  };
};

const Floors = () => {
  const { project_id } = useParams();
  const [floors, setFloors] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [editingFloor, setEditingFloor] = useState(null);
  const [viewFloor, setViewFloor] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [floorToDelete, setFloorToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // New state for submission status
  const [formData, setFormData] = useState({
    project_id: project_id || '',
    floor_name: '',
    user_id: '',
    status: true,
    floor_plan_image: null,
  });
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
  const projectsCache = createCache();
  const usersCache = createCache();

  const fetchFloors = useCallback(async () => {
    if (!project_id) {
      setError('No project selected. Please go back to the projects page.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      console.log(`Fetching all floors for filtering by project_id: ${project_id}`);
      const response = await fetchWithRetry(`${API_BASE_URL}/floors?limit=0`);
      const allFloors = Array.isArray(response.data) ? response.data : response.data.data || [];
      const filteredFloors = allFloors.filter(floor => floor.project_id.toString() === project_id);
      console.log(`Filtered ${filteredFloors.length} floors for project_id ${project_id}:`, filteredFloors);
      setFloors(filteredFloors);
      setError(null);
    } catch (err) {
      console.error('Error fetching floors:', err);
      setError(
        err.response?.status === 429
          ? 'Too many requests. Please wait a moment and try again.'
          : err.response?.data?.message || `Failed to fetch floors for project ID ${project_id}`
      );
    } finally {
      setLoading(false);
    }
  }, [project_id]);

  const fetchDropdownData = useCallback(async () => {
    try {
      const cachedProjects = projectsCache.get('projects');
      const cachedUsers = usersCache.get('users');

      if (cachedProjects && cachedUsers) {
        setProjects(cachedProjects);
        setUsers(cachedUsers);
        return;
      }

      setLoading(true);
      const [projectsResponse, usersResponse] = await Promise.all([
        fetchWithRetry(`${API_BASE_URL}/projects?limit=0`),
        fetchWithRetry(`${API_BASE_URL}/users?limit=0`),
      ]);

      const projectsData = Array.isArray(projectsResponse.data)
        ? projectsResponse.data
        : projectsResponse.data.data || [];
      const usersData = Array.isArray(usersResponse.data)
        ? usersResponse.data
        : usersResponse.data.data || [];

      setProjects(projectsData);
      setUsers(usersData);

      projectsCache.set('projects', projectsData);
      usersCache.set('users', usersData);
      setError(null);
    } catch (err) {
      console.error('Error fetching dropdown data:', err);
      setError(
        err.response?.status === 429
          ? 'Too many requests. Please wait a moment and try again.'
          : err.response?.data?.message || 'Failed to fetch dropdown data'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFloors();
    fetchDropdownData();
  }, [fetchFloors, fetchDropdownData]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setValidationErrors((prev) => ({
          ...prev,
          floor_plan_image: ['Only image files are allowed'],
        }));
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setValidationErrors((prev) => ({
          ...prev,
          floor_plan_image: ['Image size must be less than 10MB'],
        }));
        return;
      }
    }
    setFormData((prev) => ({
      ...prev,
      floor_plan_image: file,
    }));
    if (validationErrors.floor_plan_image) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.floor_plan_image;
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.floor_name.trim()) {
      errors.floor_name = ['Floor name is required'];
    }
    if (!formData.project_id || !projects.some((p) => p.id.toString() === formData.project_id)) {
      errors.project_id = ['Please select a valid project'];
    }
    if (!formData.user_id || !users.some((u) => u.id.toString() === formData.user_id)) {
      errors.user_id = ['Please select a valid user'];
    }
    return errors;
  };

  const handleCreateFloor = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true); // Disable button
      setValidationErrors({});
      const errors = validateForm();
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        setError('Please fix the validation errors');
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('project_id', project_id);
      formDataToSend.append('floor_name', formData.floor_name.trim());
      formDataToSend.append('user_id', formData.user_id);
      formDataToSend.append('status', formData.status ? 1 : 0);
      if (formData.floor_plan_image instanceof File) {
        formDataToSend.append('floor_plan_image', formData.floor_plan_image);
      }

      const response = await axios.post(`${API_BASE_URL}/floors`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Accept: 'application/json',
        },
      });

      if (response.status !== 201) {
        throw new Error(response.data.message || 'Failed to create floor');
      }

      setIsCreateModalOpen(false);
      resetForm();
      fetchFloors();
    } catch (err) {
      console.error('Error creating floor:', err);
      if (err.response?.status === 422) {
        setValidationErrors(err.response.data.errors || {});
        setError('Please fix the validation errors');
      } else if (err.response?.status === 429) {
        setError('Too many requests. Please wait a moment and try again.');
      } else {
        setError(err.response?.data?.message || 'Failed to create floor');
      }
    } finally {
      setIsSubmitting(false); // Re-enable button
    }
  };

  const handleUpdateFloor = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true); // Disable button
      setValidationErrors({});
      const errors = validateForm();
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        setError('Please fix the validation errors');
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('project_id', project_id);
      formDataToSend.append('floor_name', formData.floor_name.trim());
      formDataToSend.append('user_id', formData.user_id);
      formDataToSend.append('status', formData.status ? 1 : 0);
      if (formData.floor_plan_image instanceof File) {
        formDataToSend.append('floor_plan_image', formData.floor_plan_image);
      }
      formDataToSend.append('_method', 'PUT');

      const response = await axios.post(`${API_BASE_URL}/floors/${editingFloor.id}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Accept: 'application/json',
        },
      });

      if (response.status !== 200) {
        throw new Error(response.data.message || 'Failed to update floor');
      }

      setEditingFloor(null);
      resetForm();
      fetchFloors();
    } catch (err) {
      console.error('Error updating floor:', err);
      if (err.response?.status === 422) {
        setValidationErrors(err.response.data.errors || {});
        setError('Please fix the validation errors');
      } else if (err.response?.status === 429) {
        setError('Too many requests. Please wait a moment and try again.');
      } else {
        setError(err.response?.data?.message || 'Failed to update floor');
      }
    } finally {
      setIsSubmitting(false); // Re-enable button
    }
  };

  const handleDeleteFloor = async () => {
    try {
      console.log('Deleting floor with ID:', floorToDelete.id);
      const response = await axios.delete(`${API_BASE_URL}/floors/${floorToDelete.id}`, {
        headers: { Accept: 'application/json' },
      });

      console.log('Delete response:', response.data);
      if (response.status !== 200) {
        throw new Error(response.data.message || 'Failed to delete floor');
      }

      setIsDeleteModalOpen(false);
      setFloorToDelete(null);
      fetchFloors();
    } catch (err) {
      console.error('Error deleting floor:', err);
      setError(
        err.response?.status === 429
          ? 'Too many requests. Please wait a moment and try again.'
          : err.response?.data?.message || 'Failed to delete floor'
      );
    }
  };

  const openEditModal = (floor) => {
    setEditingFloor(floor);
    setFormData({
      project_id: floor.project_id?.toString() || project_id || '',
      floor_name: floor.floor_name || '',
      user_id: floor.user_id?.toString() || '',
      status: floor.status || true,
      floor_plan_image: null,
    });
    setValidationErrors({});
    setIsCreateModalOpen(true);
  };

  const openViewModal = (floor) => {
    setViewFloor(floor);
    setIsViewModalOpen(true);
  };

  const navigateToBlocks = (floorId) => {
    navigate(`/real-estate/blocks/${project_id}/${floorId}`);
  };

  const openDeleteModal = (floor) => {
    setFloorToDelete(floor);
    setIsDeleteModalOpen(true);
  };

  const resetForm = () => {
    setIsCreateModalOpen(false);
    setIsViewModalOpen(false);
    setEditingFloor(null);
    setViewFloor(null);
    setIsDeleteModalOpen(false);
    setFormData({
      project_id: project_id || '',
      floor_name: '',
      user_id: '',
      status: true,
      floor_plan_image: null,
    });
    setValidationErrors({});
  };

  const handleBackToProjects = () => {
    navigate('/real-estate/projects');
  };

  if (!project_id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Project Selected</h2>
          <p className="text-gray-600 mb-6">
            Please select a project to view its floors.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBackToProjects}
            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:shadow-lg"
          >
            Go to Projects
          </motion.button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && floors.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex justify-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                fetchFloors();
                fetchDropdownData();
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Retry
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBackToProjects}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
            >
              Back to Projects
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  const projectName = projects.find((p) => p.id.toString() === project_id)?.name || 'Selected Project';

  return (
    <ErrorBoundary>
      <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBackToProjects}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mr-4"
            >
              <ArrowLeft size={20} />
              Back to Projects
            </motion.button>
            <h1 className="text-3xl font-bold text-gray-800">
              Floors for {projectName}
            </h1>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCreateModalOpen(true)}
            className="flex h-13 w-35 items-center gap-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-xl shadow-md hover:shadow-lg"
          >
            <PlusCircle size={20} />
            Add New
          </motion.button>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-100 text-red-700 p-4 rounded-xl mb-6 shadow-sm relative"
          >
            {error}
            <button
              onClick={() => setError(null)}
              className="absolute top-0 right-0 p-2"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}

        {/* Floors Grid - UPDATED DESIGN WITH OCEAN WAVE WATERMARK */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <AnimatePresence>
            {floors.map((floor, index) => (
              <motion.div
                key={floor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="relative bg-white rounded-lg shadow-md p-3 border border-gray-200 hover:shadow-lg transition-all duration-300 cursor-pointer h-40 overflow-hidden"
                onClick={() => navigateToBlocks(floor.id)}
              >
                {/* Ocean Wave Watermark - Covers entire card */}
                <div className="absolute inset-0 opacity-15 pointer-events-none">
                  <img 
                    src="https://img.freepik.com/free-vector/blue-fluid-background-frame_53876-99019.jpg" 
                    alt="watermark" 
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* View icon at top right corner */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    openViewModal(floor);
                  }}
                  className="absolute top-2 right-2 p-1 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 z-10"
                  title="View Details"
                >
                  <Eye size={14} />
                </motion.button>

                <div className="flex flex-col items-center justify-center h-full pt-4 relative z-1">
                  <div className="w-12 h-12 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 mb-2">
                    <FaBuilding className="text-xl" />
                  </div>
                  <h3 className="text-md font-semibold text-gray-800 text-center">
                    {floor.floor_name?.trim() === '1st'
                      ? '1st Floor'
                      : floor.floor_name?.trim() === '2nd'
                      ? '2nd Floor'
                      : floor.floor_name?.trim() === '3rd'
                      ? '3rd Floor'
                      : floor.floor_name?.trim() || (index === 0 ? 'Ground Floor' : `${getOrdinal(index)} Floor`)}
                  </h3>
                  <div className="flex justify-center gap-1 mt-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(floor);
                      }}
                      className="p-1 bg-indigo-100 text-indigo-600 rounded-full hover:bg-indigo-200"
                      title="Edit Floor"
                    >
                      <Pencil size={12} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteModal(floor);
                      }}
                      className="p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                      title="Delete Floor"
                    >
                      <Trash2 size={12} />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        {/* End Floors Grid */}

        {/* Empty State */}
        {floors.length === 0 && !loading && (
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
            <h3 className="mt-2 text-xl font-medium text-gray-900">No floors found for {projectName}</h3>
            <p className="mt-2 text-sm text-gray-500">Get started by creating a new floor for this project.</p>
            <div className="mt-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <PlusCircle size={16} className="mr-2" />
                Add New Floor
              </motion.button>
            </div>
          </div>
        )}
        {/* End Empty State */}

        {/* Create/Edit Modal */}
        {(isCreateModalOpen || editingFloor) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 backdrop-blur-xl bg-opacity-40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={resetForm}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-8 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingFloor ? 'Edit Floor' : 'Create New Floor'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={editingFloor ? handleUpdateFloor : handleCreateFloor} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Floor Name *</label>
                  <input
                    type="text"
                    id="floor_name"
                    name="floor_name"
                    value={formData.floor_name}
                    onChange={handleInputChange}
                    className={`mt-1 p-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      validationErrors.floor_name ? 'border-red-500' : ''
                    }`}
                    required
                  />
                  {validationErrors.floor_name && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.floor_name[0]}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Project *</label>
                  <select
                    id="project_id"
                    name="project_id"
                    value={formData.project_id}
                    onChange={handleInputChange}
                    className={`mt-1 p-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      validationErrors.project_id ? 'border-red-500' : ''
                    }`}
                    disabled
                  >
                    <option value={project_id}>{projectName}</option>
                  </select>
                  {validationErrors.project_id && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.project_id[0]}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">User *</label>
                  <select
                    id="user_id"
                    name="user_id"
                    value={formData.user_id}
                    onChange={handleInputChange}
                    className={`mt-1 p-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      validationErrors.user_id ? 'border-red-500' : ''
                    }`}
                    required
                  >
                    <option value="">Select User</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id.toString()}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                  {validationErrors.user_id && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.user_id[0]}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Floor Plan Image</label>
                  <input
                    type="file"
                    id="floor_plan_image"
                    name="floor_plan_image"
                    onChange={handleImageChange}
                    accept="image/jpeg,image/png,image/jpg"
                    className={`mt-1 p-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      validationErrors.floor_plan_image ? 'border-red-500' : ''
                    }`}
                  />
                  {validationErrors.floor_plan_image && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.floor_plan_image[0]}</p>
                  )}
                  {formData.floor_plan_image instanceof File && (
                    <div className="mt-2">
                      <img
                        src={URL.createObjectURL(formData.floor_plan_image)}
                        alt="Preview"
                        className="h-20 object-contain"
                      />
                    </div>
                  )}
                  {editingFloor && editingFloor.floor_plan_image && !formData.floor_plan_image && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">Current Image:</p>
                      <img
                        src={editingFloor.floor_plan_image}
                        alt="Current floor plan"
                        className="h-20 object-contain mt-1"
                      />
                    </div>
                  )}
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="status"
                    name="status"
                    checked={formData.status}
                    onChange={handleInputChange}
                    className="mr-2 leading-tight"
                  />
                  <label htmlFor="status" className="text-sm text-gray-700">
                    Active
                  </label>
                </div>
                <div className="flex justify-end gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: isSubmitting ? 1 : 1.05 }}
                    whileTap={{ scale: isSubmitting ? 1 : 0.95 }}
                    type="submit"
                    className={`px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:shadow-lg ${
                      isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={isSubmitting}
                  >
                    {editingFloor ? 'Update' : 'Create'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
        {/* End Create/Edit Modal */}

        {/* View Modal */}
        {isViewModalOpen && viewFloor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {viewFloor.floor_name?.trim() === '1st'
                    ? '1st Floor'
                    : viewFloor.floor_name?.trim() === '2nd'
                    ? '2nd Floor'
                    : viewFloor.floor_name?.trim() === '3rd'
                    ? '3rd Floor'
                    : viewFloor.floor_name?.trim() || (floors.indexOf(viewFloor) === 0 ? 'Ground Floor' : `${getOrdinal(floors.indexOf(viewFloor))} Floor`)}
                </h2>
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4">
                <p className="text-sm text-gray-600"><strong>Project:</strong> {viewFloor.project?.name || projectName}</p>
                <p className="text-sm text-gray-600"><strong>Created by:</strong> {viewFloor.user?.name || 'N/A'}</p>
                <p className="text-sm text-gray-600">
                  <strong>Status:</strong>{' '}
                  <span
                    className={`px-2 py-1 rounded-full text-sm ${
                      viewFloor.status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {viewFloor.status ? 'Active' : 'Inactive'}
                  </span>
                </p>
                {viewFloor.floor_plan_image && (
                  <div>
                    <p className="text-sm text-gray-600"><strong>Floor Plan:</strong></p>
                    <img
                      src={viewFloor.floor_plan_image}
                      alt="Floor plan"
                      className="h-40 w-full object-contain mt-1 rounded"
                    />
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                >
                  Close
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigateToBlocks(viewFloor.id)}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:shadow-lg"
                >
                  View Blocks
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
        {/* End View Modal */}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && floorToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-8"
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Confirm Deletion</h2>
              <p className="mb-6 text-gray-600">
                Are you sure you want to delete the floor "
                {floorToDelete.floor_name?.trim() === '1st'
                  ? '1st Floor'
                  : floorToDelete.floor_name?.trim() === '2nd'
                  ? '2nd Floor'
                  : floorToDelete.floor_name?.trim() === '3rd'
                  ? '3rd Floor'
                  : floorToDelete.floor_name?.trim() || (floors.indexOf(floorToDelete) === 0 ? 'Ground Floor' : `${getOrdinal(floors.indexOf(floorToDelete))} Floor`)}
                "? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDeleteFloor}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
        {/* End Delete Confirmation Modal */}
      </div>
      {/* End Main Container */}
    </ErrorBoundary>
  );
};

// Helper function to convert index to ordinal
const getOrdinal = (n) => {
  const ordinals = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth'];
  return ordinals[n - 1] || `${n}th`;
};

export default Floors;