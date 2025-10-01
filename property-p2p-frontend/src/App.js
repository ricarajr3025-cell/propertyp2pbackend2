import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Header from './components/Header'; // Nuevo header tipo KeyHome
import Footer from './components/Footer';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import PropertyList from './components/PropertyList';
import PublishProperty from './components/PublishProperty';
import TransactionSection from './components/TransactionSection';
import Profile from './components/Profile';
import getBackendPort from './getBackendPort';
import AdminPanel from './components/AdminPanel';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';

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
      {/* Pasa el token al Header para mostrar menú contextual */}
      <Header token={token} />
      <div className="main-banner">
        <img src="/banner.jpg" alt="Banner" className="banner-img" />
        <div className="banner-text">
          <h1>Bienvenido a PropertyP2P</h1>
          <p>Compra, vende o alquila propiedades de forma segura y directa.</p>
        </div>
      </div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/login"
          element={<Login setToken={setToken} backendUrl={backendUrl} />}
        />
        <Route
          path="/forgot-password"
          element={<ForgotPassword backendUrl={backendUrl} />}
        />
        <Route
          path="/reset-password"
          element={<ResetPassword backendUrl={backendUrl} />}
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
        <Route path="/admin" element={<AdminPanel />}
        />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;