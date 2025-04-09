import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import './AdminNavbar.css';
import {  } from 'react-router-dom';


const AdminNavbar = () => {
  const navigate = useNavigate();
  const { logout } = useAdminAuth();
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/admin-dashboard' },
    { label: 'Calendar', path: '/calendar' },
    { label: 'Order History', path: '/order-history' },
    { label: 'Sites', path: '/add-site' }
  ];
   


  return (
    <nav className="admin-navbar">
      <div className="navbar-container">
        <div className="navbar-logo" onClick={() => navigate('/admin-dashboard')}>
          <img src="/logo.png" alt="Wally Cleaning Company" />
        </div>
        
        <div className="navbar-items">
          {navItems.map((item) => (
            <button 
              key={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </button>
          ))}
          
          <button className="nav-item logout" onClick={logout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;