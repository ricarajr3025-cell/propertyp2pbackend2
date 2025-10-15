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
import Marketplace from "./components/Marketplace";
import PublishAdType from "./components/PublishAdType";
import PublishItem from "./components/PublishItem";
import PublishVehicle from "./components/PublishVehicle";
import RentalPropertyList from "./components/RentalPropertyList";
import VehicleDetail from "./components/VehicleDetail";
import MessagesList from "./components/MessagesList"; // ✅ CAMBIADO de VehicleChatList a MessagesList
import PropertyDetail from "./components/PropertyDetail"; // ✅ NUEVO
import RentalPropertyDetail from "./components/RentalPropertyDetail"; // ✅ NUEVO
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [userId, setUserId] = useState(localStorage.getItem('userId'));
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
        {/* ============================================
            RUTAS PÚBLICAS
            ============================================ */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login setToken={setToken} backendUrl={backendUrl} />} />
        <Route path="/forgot-password" element={<ForgotPassword backendUrl={backendUrl} />} />
        <Route path="/reset-password" element={<ResetPassword backendUrl={backendUrl} />} />
        <Route path="/register" element={<Register setToken={setToken} backendUrl={backendUrl} />} />

        {/* Marketplace (público) */}
        <Route path="/marketplace" element={<Marketplace backendUrl={backendUrl} />} />

        {/* ============================================
            DETALLES (públicos pero con funcionalidades limitadas)
            ============================================ */}
        
        {/* Detalle de vehículo */}
        <Route
          path="/vehicle/:id"
          element={
            <VehicleDetail
              backendUrl={backendUrl}
              token={token}
              userId={userId}
            />
          }
        />

        {/* ✅ NUEVO: Detalle de propiedad en venta */}
        <Route
          path="/property/:id"
          element={
            <PropertyDetail
              backendUrl={backendUrl}
              token={token}
              userId={userId}
            />
          }
        />

        {/* ✅ NUEVO: Detalle de propiedad en alquiler */}
        <Route
          path="/rental-property/:id"
          element={
            <RentalPropertyDetail
              backendUrl={backendUrl}
              token={token}
              userId={userId}
            />
          }
        />

        {/* ============================================
            SISTEMA DE MENSAJES UNIFICADO
            ============================================ */}
        
        {/* ✅ ACTUALIZADO: Lista unificada de mensajes (requiere autenticación) */}
        <Route
          path="/messages"
          element={
            token ? (
              <MessagesList
                backendUrl={backendUrl}
                token={token}
                userId={userId}
              />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* ============================================
            RUTAS PROTEGIDAS (requieren autenticación)
            ============================================ */}
        
        {/* Propiedades en venta */}
        <Route
          path="/properties"
          element={
            token ? (
              <PropertyList token={token} backendUrl={backendUrl} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Propiedades en alquiler */}
        <Route
          path="/rental-properties"
          element={
            token ? (
              <RentalPropertyList
                token={token}
                backendUrl={backendUrl}
                userId={userId}
              />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Publicar anuncio */}
        <Route
          path="/publish"
          element={
            token ? (
              <PublishAdType />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Publicar items */}
        <Route
          path="/publish/items"
          element={
            token ? (
              <PublishItem token={token} backendUrl={backendUrl} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Publicar vehículo */}
        <Route
          path="/publish/vehicles"
          element={
            token ? (
              <PublishVehicle token={token} backendUrl={backendUrl} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Publicar propiedad en venta */}
        <Route
          path="/publish/homes/sale"
          element={
            token ? (
              <PublishPropertySale token={token} backendUrl={backendUrl} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Publicar propiedad en alquiler */}
        <Route
          path="/publish/homes/rent"
          element={
            token ? (
              <PublishPropertyRent token={token} backendUrl={backendUrl} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Transacciones */}
        <Route
          path="/transactions"
          element={
            token ? (
              <TransactionSection token={token} backendUrl={backendUrl} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Perfil de usuario */}
        <Route
          path="/profile"
          element={
            token ? (
              <Profile token={token} backendUrl={backendUrl} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* ============================================
            PANEL DE ADMINISTRACIÓN
            ============================================ */}
        <Route path="/admin" element={<AdminPanel />} />

        {/* ============================================
            RUTA POR DEFECTO
            ============================================ */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;