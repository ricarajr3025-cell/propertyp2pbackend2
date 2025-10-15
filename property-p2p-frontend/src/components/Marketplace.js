import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Marketplace.css";

export default function Marketplace({ backendUrl }) {
  const [selected, setSelected] = useState("Vehículos");
  const [showPropertyOptions, setShowPropertyOptions] = useState(false);
  const [showVehicleFilter, setShowVehicleFilter] = useState(true);
  const [vehicles, setVehicles] = useState([]);
  const [properties, setProperties] = useState([]);
  const [rentalProperties, setRentalProperties] = useState([]);
  const [selectedVehicleCategory, setSelectedVehicleCategory] = useState(null);
  const navigate = useNavigate();

  const categories = ["Vehículos", "Propiedades", "Empleo"];
  const vehicleCategories = [
    "Auto", "Moto", "Camioneta", "Camión", "Bus", 
    "Bicicleta", "Cuatrimoto", "SUV", "Pickup", "Van", "Tractor", "Otro"
  ];

  const listings = [
    { id: 1, title: "Ejemplo Empleo", price: 1200000, img: "/demo/empleo.jpg" },
  ];

  useEffect(() => {
    if (selected === "Vehículos") {
      loadVehicles();
    } else if (selected === "Propiedades") {
      loadProperties();
      loadRentalProperties();
    }
  }, [selected]);

  const loadVehicles = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/vehicles`);
      setVehicles(response.data);
    } catch (err) {
      console.error("Error al cargar vehículos:", err);
    }
  };

  const loadProperties = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/properties`);
      setProperties(response.data);
    } catch (err) {
      console.error("Error al cargar propiedades:", err);
    }
  };

  const loadRentalProperties = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/rental-properties`);
      setRentalProperties(response.data);
    } catch (err) {
      console.error("Error al cargar propiedades en alquiler:", err);
    }
  };

  const filteredVehicles = selectedVehicleCategory
    ? vehicles.filter(v => v.category === selectedVehicleCategory)
    : vehicles;

  const handleCategorySelect = (cat) => {
    setSelected(cat);
    if (cat === "Propiedades") {
      setShowPropertyOptions(true);
      setShowVehicleFilter(false);
    } else if (cat === "Vehículos") {
      setShowPropertyOptions(false);
      setShowVehicleFilter(true);
    } else {
      setShowPropertyOptions(false);
      setShowVehicleFilter(false);
    }
  };

  return (
    <div className="marketplace-main">
      <div className="marketplace-header">
        <button className="marketplace-categories-btn">Categorías</button>
      </div>

      {/* Categorías principales */}
      <div className="marketplace-categories">
        {categories.map((cat) =>
          cat === "Propiedades" ? (
            <button
              key={cat}
              className={`category-btn${selected === cat ? " selected" : ""}`}
              onClick={() => handleCategorySelect(cat)}
            >
              {cat === "Vehículos" && "🚗"}
              {cat === "Propiedades" && "🏠"}
              {cat === "Empleo" && "💼"}
              {cat}
            </button>
          ) : (
            <button
              key={cat}
              className={`category-btn${selected === cat ? " selected" : ""}`}
              onClick={() => handleCategorySelect(cat)}
            >
              {cat === "Vehículos" && "🚗"}
              {cat === "Propiedades" && "🏠"}
              {cat === "Empleo" && "💼"}
              {cat}
            </button>
          )
        )}
      </div>

      {/* Opciones para propiedades (Venta / Alquiler) */}
      {showPropertyOptions && (
        <div className="property-options">
          <button
            className="property-option-btn"
            onClick={() => {
              // No navegar, solo mostrar en esta página
            }}
          >
            Ver todas las propiedades
          </button>
        </div>
      )}

      {/* Banner de categorías de vehículos tipo filtro */}
      {selected === "Vehículos" && showVehicleFilter && (
        <div className="vehicle-filter-dropdown">
          <button 
            className="property-option-btn" 
            onClick={() => navigate("/publish/vehicles")}
          >
            Publicar Vehículo
          </button>
          {vehicleCategories.map(cat => (
            <button
              key={cat}
              className={`property-option-btn${selectedVehicleCategory === cat ? " selected" : ""}`}
              style={{ background: selectedVehicleCategory === cat ? "#512E8C" : "#6C2DC7" }}
              onClick={() => setSelectedVehicleCategory(cat)}
            >
              {cat}
            </button>
          ))}
          <button
            className="property-option-btn"
            style={{ background: "#444" }}
            onClick={() => setSelectedVehicleCategory(null)}
          >
            Todas las categorías
          </button>
        </div>
      )}

      {/* ============================================
          LISTADO DE VEHÍCULOS
          ============================================ */}
      {selected === "Vehículos" && (
        <div className="marketplace-listings">
          {filteredVehicles.length === 0 && (
            <div className="no-items-message">
              No hay vehículos publicados.
            </div>
          )}
          {filteredVehicles.map(item => (
            <div
              key={item._id}
              className="marketplace-card"
              onClick={() => navigate(`/vehicle/${item._id}`)}
              style={{ cursor: "pointer" }}
            >
              <img
                src={item.images?.[0] ? `${backendUrl}/${item.images[0]}` : "/demo/mazda.jpg"}
                alt={item.title}
                className="marketplace-img"
              />
              <div className="marketplace-info">
                <div className="marketplace-title">{item.title}</div>
                <div className="marketplace-price">${item.price?.toLocaleString('es-CO')}</div>
                <div className="marketplace-meta">
                  <span>🚗 {item.category}</span>
                  <span>📍 {item.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ============================================
          LISTADO DE PROPIEDADES (VENTA Y ALQUILER)
          ============================================ */}
      {selected === "Propiedades" && (
        <>
          {/* Propiedades en Venta */}
          <div className="properties-section">
            <div className="section-header">
              <h2>🏠 Propiedades en Venta</h2>
              <button
                className="view-all-btn"
                onClick={() => navigate("/properties")}
              >
                Ver todas
              </button>
            </div>
            <div className="marketplace-listings">
              {properties.length === 0 && (
                <div className="no-items-message">
                  No hay propiedades en venta publicadas.
                </div>
              )}
              {properties.slice(0, 6).map(item => (
                <div
                  key={item._id}
                  className="marketplace-card"
                  onClick={() => navigate(`/property/${item._id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <img
                    src={item.images?.[0] ? `${backendUrl}/${item.images[0]}` : "/demo/house.jpg"}
                    alt={item.title}
                    className="marketplace-img"
                  />
                  <div className="marketplace-info">
                    <div className="marketplace-title">{item.title}</div>
                    <div className="marketplace-price">${item.price?.toLocaleString('es-CO')}</div>
                    <div className="marketplace-meta">
                      <span>🏠 {item.propertyType}</span>
                      <span>📍 {item.location}</span>
                    </div>
                    <div className="marketplace-status">
                      {item.available ? '✅ Disponible' : '❌ No disponible'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Propiedades en Alquiler */}
          <div className="properties-section" style={{ marginTop: "40px" }}>
            <div className="section-header">
              <h2>🏘️ Propiedades en Alquiler</h2>
              <button
                className="view-all-btn"
                onClick={() => navigate("/rental-properties")}
              >
                Ver todas
              </button>
            </div>
            <div className="marketplace-listings">
              {rentalProperties.length === 0 && (
                <div className="no-items-message">
                  No hay propiedades en alquiler publicadas.
                </div>
              )}
              {rentalProperties.slice(0, 6).map(item => (
                <div
                  key={item._id}
                  className="marketplace-card"
                  onClick={() => navigate(`/rental-property/${item._id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <img
                    src={item.images?.[0] ? `${backendUrl}/${item.images[0]}` : "/demo/house.jpg"}
                    alt={item.title}
                    className="marketplace-img"
                  />
                  <div className="marketplace-info">
                    <div className="marketplace-title">{item.title}</div>
                    <div className="marketplace-price">${item.price?.toLocaleString('es-CO')}/mes</div>
                    <div className="marketplace-meta">
                      <span>🏘️ {item.propertyType}</span>
                      <span>📍 {item.location}</span>
                    </div>
                    <div className="marketplace-status">
                      {item.available ? '✅ Disponible' : '❌ No disponible'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ============================================
          LISTADO GENERAL (EMPLEO, ETC)
          ============================================ */}
      {selected !== "Vehículos" && selected !== "Propiedades" && (
        <div className="marketplace-listings">
          {listings.map(item => (
            <div key={item.id} className="marketplace-card">
              <img src={item.img} alt={item.title} className="marketplace-img" />
              <div className="marketplace-info">
                <div className="marketplace-title">{item.title}</div>
                <div className="marketplace-price">${item.price?.toLocaleString('es-CO')}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
