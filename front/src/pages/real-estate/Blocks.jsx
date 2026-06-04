import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, Edit, Trash2, Search, X } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';

const Blocks = () => {
  const { floor_id } = useParams();
  const [blocks, setBlocks] = useState([]);
  const [units, setUnits] = useState([]);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [formData, setFormData] = useState({
    project_id: '',
    block_name: '',
    status: true,
    user_id: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentBlockId, setCurrentBlockId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

  // Fetch blocks for the specific floor
  const fetchBlocks = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/blocks?floor_id=${floor_id}&limit=0`);
      setBlocks(Array.isArray(response.data) ? response.data : response.data.data || []);
      setError(null);
    } catch (error) {
      setError('Failed to fetch blocks');
      console.error('Fetch blocks error:', error.response || error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all units for the floor
  const fetchUnits = async () => {
    try {
      const response = await axios.get(`${API_URL}/units?floor_id=${floor_id}&limit=0`);
      setUnits(Array.isArray(response.data) ? response.data : response.data.data || []);
      setError(null);
    } catch (error) {
      setError('Failed to fetch units');
      console.error('Fetch units error:', error.response || error);
    }
  };

  // Fetch all users
  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/users?limit=0`);
      setUsers(Array.isArray(response.data) ? response.data : response.data.data || []);
      setError(null);
      console.log('Fetched users:', response.data);
    } catch (error) {
      setError('Failed to fetch users');
      console.error('Fetch users error:', error.response || error);
    }
  };

  // Fetch all projects
  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API_URL}/projects?limit=0`);
      setProjects(Array.isArray(response.data) ? response.data : response.data.data || []);
      setError(null);
      console.log('Fetched projects:', response.data);
    } catch (error) {
      setError('Failed to fetch projects');
      console.error('Fetch projects error:', error.response || error);
    }
  };

  // Search blocks
  const searchBlocks = async (keyword) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/blocks/search?floor_id=${floor_id}&keyword=${keyword}`);
      setBlocks(Array.isArray(response.data.data) ? response.data.data : response.data || []);
      setError(null);
    } catch (error) {
      setError('Failed to search blocks');
      console.error('Search blocks error:', error.response || error);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission (create/update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      let response;
      if (isEditing) {
        response = await axios.put(`${API_URL}/blocks/${currentBlockId}`, { ...formData, floor_id });
      } else {
        response = await axios.post(`${API_URL}/blocks`, { ...formData, floor_id });
      }
      await fetchBlocks();
      resetForm();
      setError(null);
    } catch (error) {
      setError(error.response?.data?.errors || 'Failed to save block');
      console.error('Save block error:', error.response || error);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this block?')) {
      try {
        setLoading(true);
        await axios.delete(`${API_URL}/blocks/${id}`);
        await fetchBlocks();
        setError(null);
      } catch (error) {
        setError('Failed to delete block');
        console.error('Delete block error:', error.response || error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle edit
  const handleEdit = (block) => {
    setFormData({
      project_id: block.project_id || '',
      block_name: block.block_name || '',
      status: block.status,
      user_id: block.user_id || ''
    });
    setIsEditing(true);
    setCurrentBlockId(block.id);
    setShowForm(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      project_id: '',
      block_name: '',
      status: true,
      user_id: ''
    });
    setIsEditing(false);
    setCurrentBlockId(null);
    setShowForm(false);
  };

  // Handle search
  const handleSearch = (e) => {
    const keyword = e.target.value;
    setSearchTerm(keyword);
    if (keyword) {
      searchBlocks(keyword);
    } else {
      fetchBlocks();
    }
  };

  useEffect(() => {
    fetchBlocks();
    fetchUnits();
    fetchUsers();
    fetchProjects();
  }, [floor_id]);

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div className="relative w-1/3">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search blocks..."
            className="w-full p-3 pl-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-xl shadow-md hover:shadow-lg"
        >
          <PlusCircle size={20} />
          Add New Block
        </motion.button>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-100 text-red-700 p-4 rounded-xl mb-6 shadow-sm"
        >
          {typeof error === 'object' ? JSON.stringify(error) : error}
        </motion.div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-8 rounded-xl shadow-xl mb-8 max-w-2xl mx-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">{isEditing ? 'Edit Block' : 'Create Block'}</h2>
              <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Project</label>
                <select
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                  className="mt-1 p-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select a project</option>
                  {projects.length > 0 ? (
                    projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name} ({project.location})
                      </option>
                    ))
                  ) : (
                    <option disabled>No projects available</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Block Name</label>
                <input
                  type="text"
                  value={formData.block_name}
                  onChange={(e) => setFormData({ ...formData, block_name: e.target.value })}
                  className="mt-1 p-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value === 'true' })}
                  className="mt-1 p-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={true}>Active</option>
                  <option value={false}>Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">User</label>
                <select
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  className="mt-1 p-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select a user</option>
                  {users.length > 0 ? (
                    users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))
                  ) : (
                    <option disabled>No users available</option>
                  )}
                </select>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {loading ? 'Saving...' : isEditing ? 'Update Block' : 'Create Block'}
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {loading && (
        <div className="text-center text-gray-500 text-lg">Loading...</div>
      )}

      <div className="space-y-8">
        {blocks.map((block) => (
          <div key={block.id} className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">{block.block_name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {units
                  .filter((unit) => unit.block_id === block.id)
                  .map((unit) => (
                    <motion.div
                      key={unit.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="relative bg-white p-4 rounded-lg shadow-md hover:shadow-lg cursor-pointer"
                      whileHover={{ y: -5 }}
                      onClick={() => navigate(`/real-estate/units/${unit.id}`)}
                    >
                      <h3 className="text-xl font-semibold text-gray-800">{unit.name}</h3>
                    </motion.div>
                  ))}
              </AnimatePresence>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleEdit(block)}
                className="p-2 bg-indigo-100 text-indigo-600 rounded-full hover:bg-indigo-200"
              >
                <Edit size={18} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleDelete(block.id)}
                className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
              >
                <Trash2 size={18} />
              </motion.button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Blocks;