import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [errors, setErrors] = useState({}); // State for validation errors
  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    address: '',
    city: '',
    date_of_join: new Date().toISOString().split('T')[0],
    salary: '',
    bonus_percentage: '',
    performance: '',
    status: true,
    user_id: '',
    added_by: '', // Changed to match backend expectation
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const employeesResponse = await axios.get(`${import.meta.env.VITE_API_URL}/employees?limit=0`);
        setEmployees(employeesResponse.data);

        const usersResponse = await axios.get(`${import.meta.env.VITE_API_URL}/users?limit=0`);
        setUsers(usersResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error.response ? error.response.data : error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setErrors({}); // Clear previous errors
    try {
      const payload = {
        name: formData.name,
        designation: formData.designation,
        address: formData.address,
        city: formData.city,
        date_of_join: formData.date_of_join,
        salary: formData.salary ? parseFloat(formData.salary) : null,
        bonus_percentage: formData.bonus_percentage ? parseFloat(formData.bonus_percentage) : null,
        performance: formData.performance,
        status: formData.status,
        user_id: parseInt(formData.user_id),
        added_by: parseInt(formData.added_by), // Changed to added_by
      };
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/employees`, payload);
      setEmployees([...employees, response.data]);
      resetForm();
    } catch (error) {
      if (error.response && error.response.status === 422) {
        setErrors(error.response.data.errors || {});
        console.error('Validation errors:', error.response.data.errors);
      } else {
        console.error('Error creating employee:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
      }
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setErrors({}); // Clear previous errors
    try {
      const payload = {
        name: formData.name,
        designation: formData.designation,
        address: formData.address,
        city: formData.city,
        date_of_join: formData.date_of_join,
        salary: formData.salary ? parseFloat(formData.salary) : null,
        bonus_percentage: formData.bonus_percentage ? parseFloat(formData.bonus_percentage) : null,
        performance: formData.performance,
        status: formData.status,
        user_id: parseInt(formData.user_id),
        added_by: parseInt(formData.added_by), // Changed to added_by
      };
      const response = await axios.put(`${import.meta.env.VITE_API_URL}/employees/${editingEmployee.id}`, payload);
      setEmployees(employees.map(emp => emp.id === editingEmployee.id ? response.data : emp));
      resetForm();
    } catch (error) {
      if (error.response && error.response.status === 422) {
        setErrors(error.response.data.errors || {});
        console.error('Validation errors:', error.response.data.errors);
      } else {
        console.error('Error updating employee:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
      }
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/employees/${id}`);
      setEmployees(employees.filter(emp => emp.id !== id));
    } catch (error) {
      console.error('Error deleting employee:', error.response ? error.response.data : error.message);
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      designation: employee.designation,
      address: employee.address,
      city: employee.city,
      date_of_join: employee.date_of_join.split('T')[0],
      salary: employee.salary,
      bonus_percentage: employee.bonus_percentage,
      performance: employee.performance,
      status: employee.status,
      user_id: employee.user_id,
      added_by: employee.added_by_id, // Use added_by_id from employee data
    });
    setIsFormOpen(true);
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: undefined })); // Clear error for the field being edited
  };

  const resetForm = () => {
    setFormData({
      name: '',
      designation: '',
      address: '',
      city: '',
      date_of_join: new Date().toISOString().split('T')[0],
      salary: '',
      bonus_percentage: '',
      performance: '',
      status: true,
      user_id: '',
      added_by: '',
    });
    setEditingEmployee(null);
    setIsFormOpen(false);
    setErrors({});
  };

  if (loading) return <div className="text-center text-gray-600 py-12">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-blue-900">Employees</h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-orange-500 text-white px-4 py-2 sm:px-6 sm:py-2 rounded-lg shadow-md hover:bg-orange-600 transition duration-300 w-full sm:w-auto"
            onClick={() => { setIsFormOpen(true); setEditingEmployee(null); }}
          >
            Add Employee
          </motion.button>
        </div>

        <AnimatePresence>
          {isFormOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 50 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md sm:max-w-lg relative overflow-y-auto max-h-[90vh]"
              >
                <button
                  onClick={resetForm}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">
                  {editingEmployee ? 'Edit Employee' : 'Add Employee'}
                </h3>
                <form onSubmit={editingEmployee ? handleUpdate : handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter name"
                      className={`w-full p-3 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition text-sm sm:text-base`}
                      required
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name[0]}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                    <input
                      type="text"
                      name="designation"
                      value={formData.designation}
                      onChange={handleChange}
                      placeholder="Enter designation"
                      className={`w-full p-3 border ${errors.designation ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition text-sm sm:text-base`}
                      required
                    />
                    {errors.designation && <p className="text-red-500 text-xs mt-1">{errors.designation[0]}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Enter address"
                      className={`w-full p-3 border ${errors.address ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition text-sm sm:text-base`}
                    />
                    {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address[0]}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Enter city"
                      className={`w-full p-3 border ${errors.city ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition text-sm sm:text-base`}
                    />
                    {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city[0]}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Salary</label>
                    <input
                      type="number"
                      name="salary"
                      value={formData.salary}
                      onChange={handleChange}
                      placeholder="Enter salary"
                      className={`w-full p-3 border ${errors.salary ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition text-sm sm:text-base`}
                    />
                    {errors.salary && <p className="text-red-500 text-xs mt-1">{errors.salary[0]}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bonus Percentage</label>
                    <input
                      type="number"
                      name="bonus_percentage"
                      value={formData.bonus_percentage}
                      onChange={handleChange}
                      placeholder="Enter bonus %"
                      className={`w-full p-3 border ${errors.bonus_percentage ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition text-sm sm:text-base`}
                    />
                    {errors.bonus_percentage && <p className="text-red-500 text-xs mt-1">{errors.bonus_percentage[0]}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Performance</label>
                    <input
                      type="text"
                      name="performance"
                      value={formData.performance}
                      onChange={handleChange}
                      placeholder="Enter performance"
                      className={`w-full p-3 border ${errors.performance ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition text-sm sm:text-base`}
                    />
                    {errors.performance && <p className="text-red-500 text-xs mt-1">{errors.performance[0]}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Added By</label>
                    <select
                      name="added_by"
                      value={formData.added_by}
                      onChange={handleChange}
                      className={`w-full p-3 border ${errors.added_by ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition text-sm sm:text-base`}
                      required
                    >
                      <option value="">Select Added By</option>
                      {Array.isArray(users) && users.map(user => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))}
                    </select>
                    {errors.added_by && <p className="text-red-500 text-xs mt-1">{errors.added_by[0]}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                    <select
                      name="user_id"
                      value={formData.user_id}
                      onChange={handleChange}
                      className={`w-full p-3 border ${errors.user_id ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition text-sm sm:text-base`}
                      required
                    >
                      <option value="">Select User</option>
                      {Array.isArray(users) && users.map(user => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))}
                    </select>
                    {errors.user_id && <p className="text-red-500 text-xs mt-1">{errors.user_id[0]}</p>}
                  </div>
                  <div className="flex justify-end gap-4 mt-6">
                    <motion.button
                      type="button"
                      onClick={resetForm}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition duration-200 text-sm sm:text-base"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition duration-200 text-sm sm:text-base"
                    >
                      {editingEmployee ? 'Update' : 'Save'}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {employees.map((employee) => (
            <motion.div
              key={employee.id}
              className="bg-white rounded-xl shadow-lg p-4 sm:p-6 relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-pink-500"></div>
              <div className="flex justify-center mb-4">
                <img
                  src={employee.added_by?.image || 'https://via.placeholder.com/150'}
                  alt={employee.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full border-4 border-pink-500 object-cover"
                />
              </div>
              <div className="text-center">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 truncate">{employee.name}</h3>
                <p className="text-gray-600 text-sm sm:text-base">{employee.designation}</p>
                <p className="text-gray-500 text-xs sm:text-sm">Praasad Group of Companies</p>
              </div>
              <div className="flex justify-center mt-4 gap-2">
                <motion.button
                  className="bg-yellow-500 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-lg hover:bg-yellow-600 text-xs sm:text-sm"
                  onClick={() => handleEdit(employee)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Edit
                </motion.button>
                <motion.button
                  className="bg-red-500 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-lg hover:bg-red-600 text-xs sm:text-sm"
                  onClick={() => handleDelete(employee.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Delete
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Employees;