import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import PropertyList from './components/PropertyList';
import PublishProperty from './components/PublishProperty';
import TransactionSection from './components/TransactionSection';
import Profile from './components/Profile';
import getBackendPort from './getBackendPort';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [backendUrl, setBackendUrl] = useState('http://localhost:3005');

  useEffect(() => {
    getBackendPort().then(port => {
      setBackendUrl(`http://localhost:${port}`);
    });
  }, []);

  return (
    <Router>
      <Navbar setToken={setToken} token={token} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/login"
          element={<Login setToken={setToken} backendUrl={backendUrl} />}
        />
        <Route
          path="/register"
          element={<Register setToken={setToken} backendUrl={backendUrl} />}
        />
        <Route
          path="/properties"
          element={token ? <PropertyList token={token} backendUrl={backendUrl} /> : <Navigate to="/login" />}
        />
        <Route
          path="/publish"
          element={token ? <PublishProperty token={token} backendUrl={backendUrl} /> : <Navigate to="/login" />}
        />
        <Route
          path="/transactions"
          element={token ? <TransactionSection token={token} backendUrl={backendUrl} /> : <Navigate to="/login" />}
        />
        <Route
          path="/profile"
          element={token ? <Profile token={token} backendUrl={backendUrl} /> : <Navigate to="/login" />}
        />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;