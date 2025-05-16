import React from 'react';

const MainLayout = ({ children }) => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', color: '#333' }}>
      <header style={{ backgroundColor: '#e0e0e0', padding: '16px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Recipe Tracker</h1>
        <nav>
          <ul style={{ display: 'flex', gap: '16px', listStyle: 'none', padding: 0 }}>
            <li><a href="/" style={{ color: '#007bff', textDecoration: 'none' }}>Home</a></li>
          </ul>
        </nav>
      </header>
      <main style={{ padding: '24px' }}>
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
