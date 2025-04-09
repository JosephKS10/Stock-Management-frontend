import React, {useState, useEffect} from 'react';
import AdminNavbar from '../../components/AdminNavbar/AdminNavbar';
import "./CalenderScreen.css"
function CalenderScreen() {
    const [isMobile, setIsMobile] = useState(window.innerWidth >= 768);
  
    useEffect(() => {
          const handleResize = () => {
            setIsMobile(window.innerWidth >= 768);
          };
      
          window.addEventListener("resize", handleResize);
          return () => window.removeEventListener("resize", handleResize);
        }, []);
    
         if (!isMobile) {
        return (
          <div className="warning-screen">
            <h1 style={{ fontSize: "2.5rem" }}>
              This page is only accessible on <span className="indigo-blue">Desktop devices</span>
            </h1>
          </div>
        );
      }
  return (
    <div className="admin-layout">
      <AdminNavbar />
      
      <main className="admin-content">
        <h1>Calendar</h1>
       
      </main>
    </div>
  )
}

export default CalenderScreen
