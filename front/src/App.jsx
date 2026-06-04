import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Roles from './pages/developer/Role';
import Users from './pages/developer/User';
import PaymentTypes from './pages/developer/PaymentType';
import Ownerships from './pages/developer/Ownership';
import Customer from './pages/real-estate/Customer';
import Projects from './pages/real-estate/Projects';
import Floors from './pages/real-estate/Floors';
import BlocksAndUnits from './pages/real-estate/BlocksAndUnits';
import Lead from './pages/real-estate/Lead';
import Sale from './pages/real-estate/Sale';
import Employees from './pages/administration/Employees';
import Units from './pages/real-estate/Units';
import Installment from './pages/real-estate/Installment';
import Procurement from './pages/real-estate/Procurement';

function App() {
  return (
    <Router>
      <Routes>
        {/* Root route with dashboard */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
        </Route>

        {/* Developer-related routes */}
        <Route path="/developer" element={<Layout />}>
          <Route path="roles" element={<Roles />} />
          <Route path="users" element={<Users />} />
          <Route path="payment-types" element={<PaymentTypes />} />
          <Route path="ownerships" element={<Ownerships />} />
        </Route>

        {/* Administration-related routes */}
        <Route path="/administration" element={<Layout />}>
          <Route path="employees" element={<Employees />} />
        </Route>

        {/* Real estate-related routes */}
        <Route path="/real-estate" element={<Layout />}>
          <Route path="leads" element={<Lead />} />
          <Route path="customers" element={<Customer />} />
          <Route path="projects" element={<Projects />} />
          <Route path="installment" element={<Installment />} />
          <Route path="sale" element={<Sale />} />
          <Route path="procurement" element={<Procurement />} />
          <Route path="floors/:project_id" element={<Floors />} />
          <Route path="blocks/:project_id/:floor_id" element={<BlocksAndUnits />} />
          <Route path="units" element={<Units />} /> {/* General units list */}
          <Route path="units/:unit_id" element={<Units />} /> {/* Unit detail view */}
          <Route path="sales" element={<Sale />} />
          <Route path="*" element={<Projects />} /> {/* Fallback to Projects for unmatched real-estate routes */}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;