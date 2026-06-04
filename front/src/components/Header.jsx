import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, User, Search, X, Settings, LogOut, HelpCircle, CreditCard, Mail } from 'lucide-react';

const NotificationDialog = ({ isOpen, onClose }) => {
  const notifications = [
    {
      id: 1,
      title: "New Lead Assignment",
      message: "You have been assigned a new lead for Skyline Apartments",
      time: "2 hours ago",
      read: false,
      icon: <User size={16} className="text-blue-500" />
    },
    {
      id: 2,
      title: "Payment Received",
      message: "Payment of $5,250 has been received for Unit #304",
      time: "5 hours ago",
      read: false,
      icon: <CreditCard size={16} className="text-green-500" />
    },
    {
      id: 3,
      title: "Meeting Reminder",
      message: "Client meeting with Sarah Johnson at 3:00 PM today",
      time: "Yesterday",
      read: true,
      icon: <Mail size={16} className="text-purple-500" />
    },
    {
      id: 4,
      title: "Document Approval",
      message: "Contract for Ocean View Villa needs your approval",
      time: "2 days ago",
      read: true,
      icon: <HelpCircle size={16} className="text-amber-500" />
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-30 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl z-50 border border-gray-100 overflow-hidden"
          >
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50">
              <h3 className="font-semibold text-gray-800">Notifications</h3>
              <button 
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-white transition-colors duration-200"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {notifications.map((notification) => (
                <motion.div 
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 cursor-pointer transition-colors duration-200 ${
                    notification.read ? 'bg-white' : 'bg-blue-50'
                  } hover:bg-gray-50`}
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5 flex-shrink-0">
                      {notification.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className={`text-sm font-medium ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <span className="text-xs text-gray-400 mt-2 block">{notification.time}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="p-3 border-t border-gray-100 bg-gray-50 text-center">
              <button className="text-blue-600 text-sm font-medium hover:text-blue-700 transition-colors duration-200">
                View all notifications
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const UserDialog = ({ isOpen, onClose }) => {
  const menuItems = [
    { label: 'Profile', icon: <User size={16} />, color: 'text-gray-700' },
    { label: 'Settings', icon: <Settings size={16} />, color: 'text-gray-700' },
    { label: 'Billing', icon: <CreditCard size={16} />, color: 'text-gray-700' },
    { label: 'Help & Support', icon: <HelpCircle size={16} />, color: 'text-gray-700' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-30 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl z-50 border border-gray-100 overflow-hidden"
          >
            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                  <User size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Sakib Saikat</h3>
                  <p className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-0.5 rounded-full inline-block mt-1">
                    Administrator
                  </p>
                </div>
              </div>
            </div>
            
            <div className="py-2">
              {menuItems.map((item, index) => (
                <motion.button
                  key={index}
                  className="w-full flex items-center space-x-3 text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 transition-colors duration-200"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <span className={item.color}>{item.icon}</span>
                  <span>{item.label}</span>
                </motion.button>
              ))}
            </div>
            
            <div className="p-3 border-t border-gray-100 bg-gray-50">
              <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm text-red-600 font-medium hover:bg-red-50 rounded-lg transition-colors duration-200">
                <LogOut size={16} />
                <span>Sign out</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const Header = () => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(2);

  // Close dialogs when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (isNotificationOpen) setIsNotificationOpen(false);
      if (isUserOpen) setIsUserOpen(false);
    };

    if (isNotificationOpen || isUserOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotificationOpen, isUserOpen]);

  return (
    <header className="bg-white shadow-sm z-30 sticky top-0">
      <div className="flex items-center justify-between p-4">
        {/* Search Bar */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search projects, clients, or documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative">
            <motion.button
              onClick={() => {
                setIsUserOpen(false);
                setIsNotificationOpen(!isNotificationOpen);
              }}
              className="p-2.5 rounded-xl hover:bg-gray-100 relative transition-colors duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Bell size={20} className="text-gray-600" />
              {unreadCount > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center shadow-sm"
                >
                  {unreadCount}
                </motion.span>
              )}
            </motion.button>
            
            <NotificationDialog 
              isOpen={isNotificationOpen} 
              onClose={() => setIsNotificationOpen(false)} 
            />
          </div>

          {/* User Profile */}
          <div className="relative">
            <motion.button
              onClick={() => {
                setIsNotificationOpen(false);
                setIsUserOpen(!isUserOpen);
              }}
              className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100 transition-colors duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-9 h-9 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                <User size={16} className="text-white" />
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium text-gray-800">Sakib Saikat</p>
                <p className="text-xs text-gray-500">Admin</p>
              </div>
            </motion.button>
            
            <UserDialog 
              isOpen={isUserOpen} 
              onClose={() => setIsUserOpen(false)} 
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;