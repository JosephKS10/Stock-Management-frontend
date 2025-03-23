import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import SiteAuth from "./pages/SiteAuth/SiteAuth";
import CleanerOrder from "./pages/CleanerOrder/CleanerOrder";
import AdminAuth from "./pages/AdminAuth/AdminAuth";
import AdminDashboard from "./pages/AdminDashboard/AdminDashboard";
import AdminOrderSummary from "./pages/AdminOrderSummary/AdminOrderSummary";
import CalendarScreen from "./pages/CalendarScreen/CalenderScreen";
import OrderHistory from "./pages/OrderHistory/OrderHistory";
import AddSite from "./pages/AddSite/AddSite";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SiteAuth />} />
        <Route path="/cleaner-order" element={<CleanerOrder />} />
        <Route path="/admin-auth" element={<AdminAuth />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/admin-order-summary" element={<AdminOrderSummary />} />
        <Route path="/calendar" element={<CalendarScreen />} />
        <Route path="/order-history" element={<OrderHistory />} />
        <Route path="/add-site" element={<AddSite />} />
      </Routes>
    </Router>
  );
}

export default App;
