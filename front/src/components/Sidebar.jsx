import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import menuItemsData from '../data/menuItems.json';
import logo from '/assets/logo.png';
import {
  ChevronDown,
  ChevronRight,
  Home,
  Building,
  Users,
  Settings,
  BarChart3,
  Menu,
  PieChart,
  Shield,
  DollarSign,
  ClipboardList,
  FileText,
  X,
  MapPin,
  Heart
} from 'lucide-react';

// Icon mapping object
const iconComponents = {
  PieChart,
  Home,
  Building,
  Users,
  Settings,
  BarChart3,
  Shield,
  DollarSign,
  FileText,
  ClipboardList
};

const MenuItem = ({ item, isSidebarExpanded, isActive, onClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Check if any child is active
  const hasActiveChild = item.children 
    ? item.children.some(child => location.pathname === child.path)
    : false;

  const toggleDropdown = (e) => {
    e.stopPropagation();
    if (item.children) {
      setIsOpen(!isOpen);
    } else {
      onClick(item.title);
    }
  };

  const IconComponent = iconComponents[item.icon] || PieChart;

  return (
    <div className="mb-1 relative">
      {item.children ? (
        <motion.div
          className={`flex items-center p-2.5 rounded-lg cursor-pointer transition-all duration-200 relative z-10 ${
            isActive || hasActiveChild
              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm' 
              : 'text-gray-600 hover:bg-gray-50'
          } ${isSidebarExpanded ? 'justify-between' : 'justify-center'}`}
          onClick={toggleDropdown}
          whileHover={{ x: isSidebarExpanded ? 3 : 0 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center">
            <div className={`p-1 rounded-md ${
              isActive || hasActiveChild
                ? 'bg-blue-100 text-blue-600' 
                : 'bg-gray-100 text-gray-500'
            }`}>
              <IconComponent size={16} />
            </div>
            {isSidebarExpanded && (
              <motion.span 
                className="ml-2.5 text-sm font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {item.title}
              </motion.span>
            )}
          </div>
          {isSidebarExpanded && item.children && (
            <motion.span 
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className={isActive || hasActiveChild ? "text-blue-400" : "text-gray-400"}
            >
              <ChevronDown size={14} />
            </motion.span>
          )}
        </motion.div>
      ) : (
        <Link to={item.path}>
          <motion.div
            className={`flex items-center p-2.5 rounded-lg cursor-pointer transition-all duration-200 relative z-10 ${
              isActive
                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm' 
                : 'text-gray-600 hover:bg-gray-50'
            } ${isSidebarExpanded ? 'justify-between' : 'justify-center'}`}
            onClick={() => onClick(item.title)}
            whileHover={{ x: isSidebarExpanded ? 3 : 0 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center">
              <div className={`p-1 rounded-md ${
                isActive
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-gray-100 text-gray-500'
              }`}>
                <IconComponent size={16} />
              </div>
              {isSidebarExpanded && (
                <motion.span 
                  className="ml-2.5 text-sm font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {item.title}
                </motion.span>
              )}
            </div>
          </motion.div>
        </Link>
      )}

      <AnimatePresence>
        {isSidebarExpanded && item.children && isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="ml-6 border-l-2 border-blue-100 pl-2 mt-1 relative z-10"
          >
            {item.children.map((child, index) => {
              const isChildActive = location.pathname === child.path;
              
              return (
                <Link key={index} to={child.path}>
                  <motion.div
                    className={`flex items-center py-2 px-2.5 rounded-md cursor-pointer text-xs transition-colors mb-0.5 group ${
                      isChildActive 
                        ? ' text-blue-700' 
                        : ''
                    }`}
                    whileHover={{ x: 4 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full mr-2 ${
                      isChildActive 
                        ? 'bg-blue-500' 
                        : 'bg-blue-300 group-hover:bg-blue-500 transition-colors'
                    }`}></div>
                    <span className={`${
                      isChildActive 
                        ? 'text-blue-700 font-medium' 
                        : 'text-gray-600 group-hover:text-blue-700 transition-colors'
                    }`}>{child.title}</span>
                  </motion.div>
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Sidebar = ({ isExpanded, toggleSidebar }) => {
  const [activeItem, setActiveItem] = useState('Dashboard');
  const location = useLocation();
  
  const { menuItems } = menuItemsData;

  const handleItemClick = (title) => {
    setActiveItem(title);
  };

  return (
    <motion.div
      className="w_image bg-white h-screen shadow-xl flex flex-col z-20 relative overflow-hidden"
      initial={false}
      animate={{ width: isExpanded ? 260 : 70 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-gray-100 relative z-10 bg-white/95">
        {isExpanded ? (
          <motion.div 
            className="flex items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="ml-2.5">
              <h1 className="text-lg font-bold text-gray-800">
                <img src={logo} alt="" width={100} />
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">Management System</p>
            </div>
          </motion.div>
        ) : (
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
            {/* <span className="text-white font-bold text-sm">PM</span> */}
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1 rounded-md hover:bg-gray-100 transition-colors text-gray-500 hover:text-blue-600"
        >
          {isExpanded ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2.5 relative z-10">
        {menuItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          
          return (
            <MenuItem 
              key={index} 
              item={item} 
              isSidebarExpanded={isExpanded} 
              isActive={isActive}
              onClick={handleItemClick}
            />
          );
        })}
      </nav>
    </motion.div>
  );
};

export default Sidebar;