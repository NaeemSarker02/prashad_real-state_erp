import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Eye, Trash2, X, PlusCircle } from 'lucide-react';
import logo from '/assets/logo.png';

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

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [viewProject, setViewProject] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    valuation: '',
    ownership_id: '',
    user_id: '',
    owner_percentage: '',
    note: '',
    status: true,
    is_completed: false,
    image: null,
    contract_documents: [],
  });
  const [ownerships, setOwnerships] = useState([]);
  const [users, setUsers] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

  // Fetch projects from API using Axios
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/projects`, {
        headers: { Accept: 'application/json' },
      });
      const responseData = response.data;

      console.log('Projects API response:', JSON.stringify(responseData, null, 2));

      let projectsData = [];
      if (Array.isArray(responseData)) {
        projectsData = responseData; // Direct array: [...]
      } else if (responseData.data && Array.isArray(responseData.data)) {
        projectsData = responseData.data; // { data: [...] }
      } else if (responseData.projects && Array.isArray(responseData.projects)) {
        projectsData = responseData.projects; // { projects: [...] }
      } else if (responseData.result && Array.isArray(responseData.result)) {
        projectsData = responseData.result; // { result: [...] }
      } else if (responseData.status && responseData.data && Array.isArray(responseData.data.projects)) {
        projectsData = responseData.data.projects; // { status: true, data: { projects: [...] } }
      } else if (responseData.status && responseData.data && Array.isArray(responseData.data.data)) {
        projectsData = responseData.data.data; // { status: true, data: { data: [...] } }
      } else {
        console.warn('Unexpected API response format:', responseData);
        setError('Invalid projects data format from API');
        setProjects([]);
        return;
      }

      setProjects(projectsData);
      setError(null);
    } catch (error) {
      console.error('Error fetching projects:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      setError(error.response?.data?.message || error.message || 'Failed to fetch projects');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all ownerships and users
  const fetchOwnershipsAndUsers = useCallback(async () => {
    try {
      setLoading(true);
      const ownershipResponse = await axios.get(`${API_BASE_URL}/ownerships?limit=0`, {
        headers: { Accept: 'application/json' },
      });
      console.log('Ownerships API response:', JSON.stringify(ownershipResponse.data, null, 2));
      setOwnerships(
        Array.isArray(ownershipResponse.data)
          ? ownershipResponse.data
          : ownershipResponse.data.data || ownershipResponse.data.ownerships || []
      );

      const userResponse = await axios.get(`${API_BASE_URL}/users?limit=0`, {
        headers: { Accept: 'application/json' },
      });
      console.log('Users API response:', JSON.stringify(userResponse.data, null, 2));
      setUsers(
        Array.isArray(userResponse.data)
          ? userResponse.data
          : userResponse.data.data || userResponse.data.users || []
      );
    } catch (error) {
      console.error('Error fetching ownerships or users:', error);
      setError(error.response?.data?.message || error.message || 'Failed to fetch ownerships or users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    fetchOwnershipsAndUsers();
  }, [fetchProjects, fetchOwnershipsAndUsers]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  // Handle image upload
  const handleImageUpload = (e) => {
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

    setFormData((prev) => ({
      ...prev,
      image: file,
    }));
  };

  // Handle contract documents upload
  const handleContractDocumentsUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const validFiles = files.filter((file) => {
      const isValidType = file.type === 'application/pdf' || file.type.startsWith('image/');
      const isValidSize = file.size <= 10 * 1024 * 1024;
      if (!isValidType) {
        setValidationErrors((prev) => ({ ...prev, contract_documents: ['Only PDF or image files are allowed'] }));
      }
      if (!isValidSize) {
        setValidationErrors((prev) => ({ ...prev, contract_documents: ['Each file must be less than 10MB'] }));
      }
      return isValidType && isValidSize;
    });

    setFormData((prev) => ({
      ...prev,
      contract_documents: [...prev.contract_documents, ...validFiles],
    }));
  };

  // Remove contract document
  const removeContractDocument = (index) => {
    setFormData((prev) => ({
      ...prev,
      contract_documents: prev.contract_documents.filter((_, i) => i !== index),
    }));
  };

  // Create a new project
  const createProject = async (e) => {
    e.preventDefault();
    try {
      setButtonLoading(true);
      setValidationErrors({});

      const errors = {};
      if (!formData.name.trim()) errors.name = ['Project name is required'];
      if (!formData.valuation || isNaN(formData.valuation) || parseFloat(formData.valuation) <= 0) {
        errors.valuation = ['Valuation must be a positive number'];
      }
      if (!formData.ownership_id || !ownerships.some((o) => o.id.toString() === formData.ownership_id)) {
        errors.ownership_id = ['Please select a valid ownership'];
      }
      if (!formData.user_id || !users.some((u) => u.id.toString() === formData.user_id)) {
        errors.user_id = ['Please select a valid user'];
      }
      if (
        !formData.owner_percentage ||
        isNaN(formData.owner_percentage) ||
        parseFloat(formData.owner_percentage) < 0 ||
        parseFloat(formData.owner_percentage) > 100
      ) {
        errors.owner_percentage = ['Owner percentage must be between 0 and 100'];
      }
      if (formData.image && !(formData.image instanceof File)) {
        errors.image = ['Invalid image file'];
      }
      if (formData.contract_documents.some((doc) => !(doc instanceof File))) {
        errors.contract_documents = ['Invalid contract document files'];
      }

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        throw new Error('Validation failed. Please check your inputs.');
      }

      const data = new FormData();
      data.append('name', formData.name.trim());
      data.append('location', formData.location.trim() || '');
      data.append('valuation', parseFloat(formData.valuation).toFixed(2));
      data.append('ownership_id', formData.ownership_id);
      data.append('user_id', formData.user_id);
      data.append('owner_percentage', parseFloat(formData.owner_percentage).toFixed(2));
      data.append('note', formData.note.trim() || '');
      data.append('status', formData.status ? '1' : '0');
      data.append('is_completed', formData.is_completed ? '1' : '0');

      if (formData.image instanceof File) {
        data.append('image', formData.image);
      }

      formData.contract_documents.forEach((file, index) => {
        if (file instanceof File) {
          data.append(`contract_documents[${index}]`, file);
        }
      });

      console.log('FormData entries:');
      for (let pair of data.entries()) {
        console.log(`${pair[0]}: ${pair[1]}`);
      }

      const response = await axios.post(`${API_BASE_URL}/projects`, data, {
        headers: { Accept: 'application/json' },
      });
      console.log('Create Project API Response:', JSON.stringify(response.data, null, 2));

      if (response.status !== 201) {
        if (response.status === 422 && response.data.errors) {
          setValidationErrors(response.data.errors);
          throw new Error('Validation failed. Please check your inputs.');
        }
        throw new Error(response.data.message || 'Failed to create project');
      }

      await fetchProjects();
      setShowModal(false);
      resetForm();
      setSuccessMessage('Project successfully created!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setError(error.response?.data?.message || error.message);
      console.error('Error creating project:', error);
    } finally {
      setButtonLoading(false);
    }
  };

  // Update a project
  const updateProject = async (e) => {
    e.preventDefault();
    try {
      setButtonLoading(true);
      setValidationErrors({});

      const errors = {};
      if (!formData.name.trim()) errors.name = ['Project name is required'];
      if (!formData.valuation || isNaN(formData.valuation) || parseFloat(formData.valuation) <= 0) {
        errors.valuation = ['Valuation must be a positive number'];
      }
      if (!formData.ownership_id || !ownerships.some((o) => o.id.toString() === formData.ownership_id)) {
        errors.ownership_id = ['Please select a valid ownership'];
      }
      if (!formData.user_id || !users.some((u) => u.id.toString() === formData.user_id)) {
        errors.user_id = ['Please select a valid user'];
      }
      if (
        !formData.owner_percentage ||
        isNaN(formData.owner_percentage) ||
        parseFloat(formData.owner_percentage) < 0 ||
        parseFloat(formData.owner_percentage) > 100
      ) {
        errors.owner_percentage = ['Owner percentage must be between 0 and 100'];
      }
      if (formData.image && !(formData.image instanceof File) && !formData.image?.startsWith('http')) {
        errors.image = ['Invalid image file'];
      }
      if (
        formData.contract_documents.some(
          (doc) => !(doc instanceof File) && !doc?.endsWith('.jpg') && !doc?.endsWith('.png') && !doc?.endsWith('.jpeg')
        )
      ) {
        errors.contract_documents = ['Invalid contract document files'];
      }

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        throw new Error('Validation failed. Please check your inputs.');
      }

      const data = new FormData();
      data.append('name', formData.name.trim());
      data.append('location', formData.location.trim() || '');
      data.append('valuation', parseFloat(formData.valuation).toFixed(2));
      data.append('ownership_id', formData.ownership_id);
      data.append('user_id', formData.user_id);
      data.append('owner_percentage', parseFloat(formData.owner_percentage).toFixed(2));
      data.append('note', formData.note.trim() || '');
      data.append('status', formData.status ? '1' : '0');
      data.append('is_completed', formData.is_completed ? '1' : '0');
      data.append('_method', 'PUT');

      if (formData.image instanceof File) {
        data.append('image', formData.image);
      }

      formData.contract_documents.forEach((file, index) => {
        if (file instanceof File) {
          data.append(`contract_documents[${index}]`, file);
        }
      });

      console.log('FormData entries:');
      for (let pair of data.entries()) {
        console.log(`${pair[0]}: ${pair[1]}`);
      }

      const response = await axios.post(`${API_BASE_URL}/projects/${editingProject.id}`, data, {
        headers: { Accept: 'application/json' },
      });
      console.log('Update Project API Response:', JSON.stringify(response.data, null, 2));

      if (response.status !== 200) {
        if (response.status === 422 && response.data.errors) {
          setValidationErrors(response.data.errors);
          throw new Error('Validation failed. Please check your inputs.');
        }
        throw new Error(response.data.message || 'Failed to update project');
      }

      await fetchProjects();
      setShowModal(false);
      setEditingProject(null);
      resetForm();
      setSuccessMessage('Project successfully updated!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setError(error.response?.data?.message || error.message);
      console.error('Error updating project:', error);
    } finally {
      setButtonLoading(false);
    }
  };

  // Delete a project
  const deleteProject = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;

    try {
      setButtonLoading(true);
      const response = await axios.delete(`${API_BASE_URL}/projects/${id}`, {
        headers: { Accept: 'application/json' },
      });

      if (response.status !== 200) {
        throw new Error(response.data.message || 'Failed to delete project');
      }

      await fetchProjects();
      setSuccessMessage('Project successfully deleted!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setError(error.response?.data?.message || error.message);
      console.error('Error deleting project:', error);
    } finally {
      setButtonLoading(false);
    }
  };

  // Reset form data
  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      valuation: '',
      ownership_id: '',
      user_id: '',
      owner_percentage: '',
      note: '',
      status: true,
      is_completed: false,
      image: null,
      contract_documents: [],
    });
    setValidationErrors({});
    setShowModal(false);
    setEditingProject(null);
  };

  // Open modal for editing
  const openEditModal = (project) => {
    setEditingProject(project);
    setFormData({
      name: project.name || '',
      location: project.location || '',
      valuation: parseFloat(project.valuation || 0).toFixed(2),
      ownership_id: project.ownership_id?.toString() || '',
      user_id: project.user_id?.toString() || '',
      owner_percentage: parseFloat(project.owner_percentage || 0).toFixed(2),
      note: project.note || '',
      status: !!project.status,
      is_completed: !!project.is_completed,
      image: project.image || null,
      contract_documents: Array.isArray(project.contract_documents) ? project.contract_documents : [],
    });
    setShowModal(true);
  };

  // Open view modal
  const openViewModal = (project) => {
    setViewProject(project);
    setShowViewModal(true);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  // Animation variants
  const loaderVariants = {
    animate: {
      rotate: 360,
      transition: { repeat: Infinity, duration: 1, ease: 'linear' },
    },
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const toastVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: 50, transition: { duration: 0.3 } },
  };

  if (loading) {
    return (
      <motion.div
        className="flex flex-col justify-center items-center h-64"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="relative" variants={loaderVariants} animate="animate">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </motion.div>
        <motion.p
          className="mt-4 text-gray-600 text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Loading Projects...
        </motion.p>
      </motion.div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
        <motion.button
          onClick={() => {
            setError(null); // Clear error before retry
            fetchProjects();
            fetchOwnershipsAndUsers();
          }}
          className="mt-2 bg-red-500 text-white px-4 py-2 rounded"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Try Again
        </motion.button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <motion.div
        className="p-6 bg-gray-50 min-h-screen relative"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Success Notification */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg flex items-center z-50"
              variants={toastVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <svg
                className="h-5 w-5 text-green-500 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{successMessage}</span>
              <button onClick={() => setSuccessMessage(null)} className="ml-2">
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Projects</h1>
            <p className="text-gray-500 mt-1">Manage your real estate investments</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setEditingProject(null);
              resetForm();
              setShowModal(true);
              console.log('Opening New Project modal');
              console.log('Ownerships in dropdown:', JSON.stringify(ownerships, null, 2));
              console.log('Users in dropdown:', JSON.stringify(users, null, 2));
            }}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium shadow-md hover:bg-blue-700 transition-colors flex items-center mt-4 sm:mt-0"
          >
            <PlusCircle size={20} className="mr-2" />
            New Project
          </motion.button>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 gap-6">
          <AnimatePresence>
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={openEditModal}
                onDelete={deleteProject}
                onView={openViewModal}
                formatCurrency={formatCurrency}
                onNavigate={() => navigate(`/real-estate/floors/${project.id}`)}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        <AnimatePresence>
          {projects.length === 0 && (
            <motion.div
              className="text-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <svg
                className="h-16 w-16 mx-auto text-gray-400"
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
              <h3 className="mt-4 text-lg font-medium text-gray-900">No projects yet</h3>
              <p className="mt-1 text-gray-500">Get started by creating a new project.</p>
              <motion.button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                  console.log('Opening New Project modal (empty state)');
                  console.log('Ownerships in dropdown:', JSON.stringify(ownerships, null, 2));
                  console.log('Users in dropdown:', JSON.stringify(users, null, 2));
                }}
                className="mt-6 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <PlusCircle size={16} className="mr-2" />
                Create Project
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create/Edit Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-auto p-6"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {editingProject ? 'Edit Project' : 'Create New Project'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setEditingProject(null);
                      resetForm();
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={24} />
                  </button>
                </div>

                {Object.keys(validationErrors).length > 0 && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    <strong className="font-bold">Validation Errors: </strong>
                    <ul className="list-disc list-inside">
                      {Object.entries(validationErrors).map(([field, errors]) => (
                        <li key={field}>
                          {field}: {errors.join(', ')}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <form onSubmit={editingProject ? updateProject : createProject}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Project Name</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                        {validationErrors.name && (
                          <p className="text-red-500 text-xs mt-1">{validationErrors.name[0]}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Location</label>
                        <input
                          type="text"
                          name="location"
                          value={formData.location}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        {validationErrors.location && (
                          <p className="text-red-500 text-xs mt-1">{validationErrors.location[0]}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Valuation (BDT)</label>
                        <input
                          type="number"
                          name="valuation"
                          value={formData.valuation}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          required
                          step="0.01"
                          min="0"
                        />
                        {validationErrors.valuation && (
                          <p className="text-red-500 text-xs mt-1">{validationErrors.valuation[0]}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Ownership</label>
                        <select
                          name="ownership_id"
                          value={formData.ownership_id}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          required
                        >
                          <option value="">Select Ownership</option>
                          {ownerships.map((ownership) => (
                            <option key={ownership.id} value={ownership.id.toString()}>
                              {ownership.name || 'N/A'}
                            </option>
                          ))}
                        </select>
                        {validationErrors.ownership_id && (
                          <p className="text-red-500 text-xs mt-1">{validationErrors.ownership_id[0]}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">User</label>
                        <select
                          name="user_id"
                          value={formData.user_id}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          required
                        >
                          <option value="">Select User</option>
                          {users.map((user) => (
                            <option key={user.id} value={user.id.toString()}>
                              {user.name || 'N/A'}
                            </option>
                          ))}
                        </select>
                        {validationErrors.user_id && (
                          <p className="text-red-500 text-xs mt-1">{validationErrors.user_id[0]}</p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Owner Percentage</label>
                        <input
                          type="number"
                          name="owner_percentage"
                          value={formData.owner_percentage}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          required
                          step="0.01"
                          max="100"
                          min="0"
                        />
                        {validationErrors.owner_percentage && (
                          <p className="text-red-500 text-xs mt-1">{validationErrors.owner_percentage[0]}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Project Image</label>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/jpg"
                          onChange={handleImageUpload}
                          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {formData.image && typeof formData.image === 'string' && (
                          <div className="mt-2">
                            <img src={formData.image} alt="Preview" className="h-20 w-20 object-cover rounded-md" />
                          </div>
                        )}
                        {formData.image instanceof File && (
                          <div className="mt-2">
                            <img
                              src={URL.createObjectURL(formData.image)}
                              alt="Preview"
                              className="h-20 w-20 object-cover rounded-md"
                            />
                          </div>
                        )}
                        {validationErrors.image && (
                          <p className="text-red-500 text-xs mt-1">{validationErrors.image[0]}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Contract Documents</label>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/jpg,application/pdf"
                          multiple
                          onChange={handleContractDocumentsUpload}
                          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          {formData.contract_documents.map((doc, index) => (
                            <div key={index} className="relative">
                              {typeof doc === 'string' && doc.endsWith('.pdf') ? (
                                <div className="border rounded-md p-2 flex items-center">
                                  <svg
                                    className="h-6 w-6 text-red-500 mr-2"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                    />
                                  </svg>
                                  <span className="text-xs truncate">Document {index + 1}</span>
                                </div>
                              ) : typeof doc === 'string' ? (
                                <img
                                  src={doc}
                                  alt={`Contract doc ${index + 1}`}
                                  className="h-20 w-full object-cover rounded-md"
                                />
                              ) : doc instanceof File && doc.type === 'application/pdf' ? (
                                <div className="border rounded-md p-2 flex items-center">
                                  <svg
                                    className="h-6 w-6 text-red-500 mr-2"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                    />
                                  </svg>
                                  <span className="text-xs truncate">{doc.name}</span>
                                </div>
                              ) : (
                                <img
                                  src={URL.createObjectURL(doc)}
                                  alt={`Contract doc ${index + 1}`}
                                  className="h-20 w-full object-cover rounded-md"
                                />
                              )}
                              <motion.button
                                type="button"
                                onClick={() => removeContractDocument(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <X size={16} />
                              </motion.button>
                            </div>
                          ))}
                        </div>
                        {validationErrors.contract_documents && (
                          <p className="text-red-500 text-xs mt-1">{validationErrors.contract_documents[0]}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Notes</label>
                        <textarea
                          name="note"
                          value={formData.note}
                          onChange={handleInputChange}
                          rows={3}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        {validationErrors.note && (
                          <p className="text-red-500 text-xs mt-1">{validationErrors.note[0]}</p>
                        )}
                      </div>
                      <div className="flex items-center">
                        <input
                          id="status"
                          name="status"
                          type="checkbox"
                          checked={formData.status}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="status" className="ml-2 block text-sm text-gray-900">
                          Active Status
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="is_completed"
                          name="is_completed"
                          type="checkbox"
                          checked={formData.is_completed}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="is_completed" className="ml-2 block text-sm text-gray-900">
                          Project Completed
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end space-x-3">
                    <motion.button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setEditingProject(null);
                        resetForm();
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={buttonLoading}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={buttonLoading}
                    >
                      {buttonLoading ? (
                        <>
                          <motion.div
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                            variants={loaderVariants}
                            animate="animate"
                          />
                          Processing...
                        </>
                      ) : editingProject ? (
                        'Update'
                      ) : (
                        'Create'
                      )}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* View Modal */}
        <AnimatePresence>
          {showViewModal && viewProject && (
            <motion.div
              className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-auto p-6"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">{viewProject.name || 'Unnamed Project'}</h3>
                  <button onClick={() => setShowViewModal(false)} className="text-gray-500 hover:text-gray-700">
                    <X size={24} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-700">
                      <strong>Location:</strong> {viewProject.location || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Valuation:</strong> {formatCurrency(viewProject.valuation)}
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Owner:</strong> {viewProject.ownership?.name || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Owner Percentage:</strong> {viewProject.owner_percentage || 0}%
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Note:</strong> {viewProject.note || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Completed:</strong> {viewProject.is_completed ? 'Yes' : 'No'}
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Status:</strong>{' '}
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          viewProject.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {viewProject.status ? 'Active' : 'Inactive'}
                      </span>
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Created By:</strong> {viewProject.user?.name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Project Image:</p>
                    <img
                      src={
                        viewProject.image ||
                        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
                      }
                      alt={viewProject.name || 'Project'}
                      className="h-40 w-full object-cover rounded-md mb-4"
                    />
                    <p className="text-sm font-medium text-gray-700 mb-2">Contract Documents:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {Array.isArray(viewProject.contract_documents) &&
                      viewProject.contract_documents.length > 0 ? (
                        viewProject.contract_documents.map((doc, index) => (
                          <a key={index} href={doc} target="_blank" rel="noopener noreferrer">
                            {doc.endsWith('.pdf') ? (
                              <div className="border rounded-md p-2 flex items-center">
                                <svg
                                  className="h-6 w-6 text-red-500 mr-2"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                  />
                                </svg>
                                <span className="text-xs truncate">Document {index + 1}</span>
                              </div>
                            ) : (
                              <img
                                src={doc}
                                alt={`Document ${index + 1}`}
                                className="h-20 w-full object-cover rounded-md"
                              />
                            )}
                          </a>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No contract documents available</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <motion.button
                    onClick={() => setShowViewModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Close
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      setShowViewModal(false);
                      navigate(`/real-estate/floors/${viewProject.id}`);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    View Floors
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </ErrorBoundary>
  );
};

const ProjectCard = ({ project, onEdit, onDelete, onView, formatCurrency, onNavigate }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow project-card"
    >
      <div className="flex flex-col lg:flex-row">
        <div className="lg:w-2/5">
          <img
            src={
              project.image ||
              'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
            }
            alt={project.name || 'Project'}
            className="w-full h-60 lg:h-full object-cover"
          />
        </div>
        <div className="lg:w-3/5 p-6 flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  project.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}
              >
                {project.status ? 'Active' : 'Inactive'}
              </span>
              {project.is_completed && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ml-2">
                  Completed
                </span>
              )}
            </div>
            <div className="flex space-x-2">
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  onView(project);
                }}
                className="text-blue-600 hover:text-blue-800"
                title="View project"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Eye size={20} />
              </motion.button>
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(project);
                }}
                className="text-blue-600 hover:text-blue-800"
                title="Edit project"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </motion.button>
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(project.id);
                }}
                className="text-red-600 hover:text-red-800"
                title="Delete project"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Trash2 size={20} />
              </motion.button>
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">{project.name || 'Unnamed Project'}</h3>
          <div className="flex space-x-2 mb-4">
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onView(project);
              }}
              className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              View Details
            </motion.button>
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate();
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              View Project
            </motion.button>
          </div>
          <div className="flex items-center text-gray-600 mb-2">
            <svg
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="text-sm">{project.location || 'N/A'}</span>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500">Valuation</p>
              <p className="font-semibold">{formatCurrency(project.valuation)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Ownership</p>
              <p className="font-semibold">{project.owner_percentage || 0}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Owner</p>
              <p className="font-semibold">{project.ownership?.name || 'N/A'}</p>
            </div>
          </div>
          {project.note && (
            <div className="mb-4">
              <p className="text-xs text-gray-500">Notes</p>
              <p className="text-sm text-gray-700">{project.note}</p>
            </div>
          )}
          {Array.isArray(project.contract_documents) && project.contract_documents.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-500">Contract Documents</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {project.contract_documents.map((doc, index) => (
                  <a
                    key={index}
                    href={doc}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-2 py-1 bg-gray-100 rounded-md text-xs text-gray-700 hover:bg-gray-200"
                  >
                    {doc.endsWith('.pdf') ? (
                      <>
                        <svg
                          className="h-4 w-4 mr-1 text-red-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                        Document {index + 1}
                      </>
                    ) : (
                      <img
                        src={doc}
                        alt={`Contract doc ${index + 1}`}
                        className="h-12 w-12 object-cover rounded-md"
                      />
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}
          <div className="border-t border-gray-100 pt-4 mt-auto">
            <p className="text-gray-500 text-sm mb-2 text-center">- Developer -</p>
            <div className="flex justify-center">
              <img src={logo} alt="Developer Logo" className="h-16 w-auto" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Projects;