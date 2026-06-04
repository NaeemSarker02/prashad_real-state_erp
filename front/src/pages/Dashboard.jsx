import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState('3:42:15 PM');
  const [showModal, setShowModal] = useState(false);
  const [dateInfo, setDateInfo] = useState('');
  const [isDaytime, setIsDaytime] = useState(true);

  useEffect(() => {
    // Update clock in real-time with seconds
    const updateClock = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12;
      
      setCurrentTime(`${formattedHours}:${minutes}:${seconds} ${ampm}`);
      
      // Set date information
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      setDateInfo(now.toLocaleDateString('en-US', options));
      
      // Determine if it's daytime (6 AM to 6 PM)
      setIsDaytime(hours >= 6 && hours < 18);
    };

    updateClock();
    const intervalId = setInterval(updateClock, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const menuOptions = [
    {
      title: 'Employee',
      icon: '/assets/latest-icons/project-manager.png',
      link: '/employee',
      color: 'from-blue-500/80 to-blue-700/80',
      animationDelay: '0.1s'
    },
    {
      title: 'Projects',
      icon: '/assets/latest-icons/skyscraper.png',
      link: '/projects',
      color: 'from-purple-500/80 to-purple-700/80',
      animationDelay: '0.2s'
    },
    {
      title: 'Procurement',
      icon: '/assets/latest-icons/accounting.png',
      link: '/procurement',
      color: 'from-green-500/80 to-green-700/80',
      animationDelay: '0.3s'
    },
    {
      title: 'Leads',
      icon: '/assets/latest-icons/attraction.png',
      link: '/leads',
      color: 'from-amber-500/80 to-amber-600/80',
      animationDelay: '0.5s'
    },
    {
      title: 'Payroll',
      icon: '/assets/latest-icons/freelancer.png',
      link: '/payroll',
      color: 'from-rose-500/80 to-rose-700/80',
      animationDelay: '0.6s'
    },
    {
      title: 'Report',
      icon: '/assets/latest-icons/statistics.png',
      link: '/report',
      color: 'from-indigo-500/80 to-indigo-700/80',
      animationDelay: '0.4s'
    },
    {
      title: 'Rental Project',
      icon: '/assets/new-icons/rent.png',
      link: '/rental-project',
      color: 'from-pink-500/80 to-pink-700/80',
      animationDelay: '0.4s'
    },
    {
      title: 'Tracking',
      icon: '/assets/latest-icons/navigation.png',
      link: null,
      color: 'from-gray-600/80 to-gray-800/80',
      animationDelay: '0.7s',
      modal: true
    }
  ];

  // Weather icons based on time of day
  const weatherIcon = isDaytime ? '/assets/latest-icons/day.png' : '/assets/latest-icons/night.png';
  const weatherCondition = isDaytime ? 'Sunny' : 'Clear';
  const temperature = isDaytime ? '78°F' : '65°F';

  return (
    <div className={`min-h-screen p-4 transition-colors duration-1000 `}>
      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section with Glass Effect */}
        <div className={`bg-gradient-to-r ${isDaytime ? 'from-blue-600/90 to-indigo-700/90' : 'from-blue-800/90 to-indigo-900/90'} rounded-3xl shadow-2xl p-6 mb-8 relative overflow-hidden text-white backdrop-blur-md border `}>
  
          
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h2 className="text-2xl md:text-3xl font-bold">
                Welcome, Sakibur Rahman Saikat
              </h2>
              <p className={`mt-1 ${isDaytime ? 'text-blue-100' : 'text-blue-200'}`}>{dateInfo}</p>
              <div className="flex items-end mt-4">
                <span className="text-4xl md:text-5xl font-light tracking-tight">{currentTime.split(' ')[0]}</span>
                <span className="text-xl ml-2 mb-1">{currentTime.split(' ')[1]}</span>
              </div>
            </div>
            <div className="flex-shrink-0">
              <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md border border-white/20">
                <img 
                  src={weatherIcon} 
                  alt="Weather" 
                  width="100"
                  className="filter brightness-0 invert mx-auto"
                />
                <div className="text-center mt-2">
                  <p className="text-xs mt-1">{isDaytime ? 'Day' : 'Night'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Options with Glass Effect */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {menuOptions.map((option, index) => (
            option.modal ? (
              <div
                key={index}
                className="backdrop-blur-md rounded-3xl shadow-lg overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl group border border-white/30"
                style={{ animationDelay: option.animationDelay }}
                onClick={() => setShowModal(true)}
              >
                <div className={`h-2 bg-gradient-to-r ${option.color}`}></div>
                <div className="p-5 flex flex-col items-center">
                  <div className="w-20 h-20 flex items-center justify-center mb-4 rounded-3xl bg-white/70 backdrop-blur-sm group-hover:bg-white/90 transition-all duration-300 shadow-inner">
                    <img src={option.icon} alt={option.title} className="w-12 h-12 object-contain" />
                  </div>
                  <span className="font-semibold text-gray-800 text-center group-hover:text-indigo-600 transition-colors duration-300">
                    {option.title}
                  </span>
                </div>
              </div>
            ) : (
              <Link
                key={index}
                to={option.link}
                className="backdrop-blur-md rounded-3xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-xl group border border-white/30"
                style={{ animationDelay: option.animationDelay }}
              >
                <div className={`h-2 bg-gradient-to-r ${option.color}`}></div>
                <div className="p-5 flex flex-col items-center">
                  <div className="w-20 h-20 flex items-center justify-center mb-4 rounded-3xl bg-white/70 backdrop-blur-sm group-hover:bg-white/90 transition-all duration-300 shadow-inner">
                    <img src={option.icon} alt={option.title} className="w-12 h-12 object-contain" />
                  </div>
                  <span className="font-semibold text-gray-800 text-center group-hover:text-indigo-600 transition-colors duration-300">
                    {option.title}
                  </span>
                </div>
              </Link>
            )
          ))}
        </div>
      </div>

      {/* Modal with Glass Effect */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-md">
          <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-6 max-w-md w-full mx-4 transform transition-all duration-300 scale-95 animate-in fade-in-90 border border-white/30">
            <div className="flex justify-center mb-5">
              <div className="w-24 h-24 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-inner">
                <img 
                  src="/assets/latest-icons/navigation.png" 
                  alt="Tracking" 
                  className="w-14 h-14 object-contain"
                />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
              Under Development!
            </h1>
            <p className="text-gray-600 text-center mb-6">
              This feature is currently in development and will be available soon.
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => setShowModal(false)}
                className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-md hover:shadow-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;