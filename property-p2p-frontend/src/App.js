import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import PropertyList from './components/PropertyList';
import PublishPropertySale from './components/PublishPropertySale';
import PublishPropertyRent from './components/PublishPropertyRent';
import TransactionSection from './components/TransactionSection';
import Profile from './components/Profile';
import getBackendPort from './getBackendPort';
import AdminPanel from './components/AdminPanel';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import './App.css';
import Marketplace from "./components/Marketplace";
import PublishAdType from "./components/PublishAdType";
import PublishItem from "./components/PublishItem";
import PublishVehicle from "./components/PublishVehicle";

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
      <Header token={token} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login setToken={setToken} backendUrl={backendUrl} />} />
        <Route path="/forgot-password" element={<ForgotPassword backendUrl={backendUrl} />} />
        <Route path="/reset-password" element={<ResetPassword backendUrl={backendUrl} />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/register" element={<Register setToken={setToken} backendUrl={backendUrl} />} />
        <Route path="/properties" element={token ? <PropertyList token={token} backendUrl={backendUrl} /> : <Navigate to="/login" />} />
        <Route path="/publish" element={token ? <PublishAdType /> : <Navigate to="/login" />} />
        <Route path="/publish/items" element={token ? <PublishItem token={token} backendUrl={backendUrl} /> : <Navigate to="/login" />} />
        <Route path="/publish/vehicles" element={token ? <PublishVehicle token={token} backendUrl={backendUrl} /> : <Navigate to="/login" />} />
        <Route path="/publish/homes/sale" element={token ? <PublishPropertySale token={token} backendUrl={backendUrl} /> : <Navigate to="/login" />} />
        <Route path="/publish/homes/rent" element={token ? <PublishPropertyRent token={token} backendUrl={backendUrl} /> : <Navigate to="/login" />} />
        <Route path="/transactions" element={token ? <TransactionSection token={token} backendUrl={backendUrl} /> : <Navigate to="/login" />} />
        <Route path="/profile" element={token ? <Profile token={token} backendUrl={backendUrl} /> : <Navigate to="/login" />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;