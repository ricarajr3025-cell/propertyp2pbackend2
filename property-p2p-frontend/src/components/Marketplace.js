import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Marketplace.css";

// Categorías principales
const categories = [
  { name: "Propiedades", icon: "🏠" },
  { name: "Vehículos", icon: "🚗" },
  { name: "Electrónicos", icon: "💻" },
  { name: "Hogar", icon: "🛋️" },
  { name: "Juguetes", icon: "🧸" },
  { name: "Ropa y Moda", icon: "👗" },
  { name: "Deportes", icon: "⚽" },
  { name: "Servicios", icon: "🔧" },
  { name: "Otros", icon: "📦" },
];

// Categorías de vehículos (igual que publicar vehículo)
const vehicleCategories = [
  "Auto", "Moto", "Camioneta", "Camión", "Bus", "Bicicleta", "Cuatrimoto", "SUV", "Pickup", "Van", "Tractor", "Otro"
];

export default function Marketplace({ backendUrl }) {
  const [selected, setSelected] = useState(null);
  const [showPropertyOptions, setShowPropertyOptions] = useState(false);
  const [showVehicleOptions, setShowVehicleOptions] = useState(false);
  const [selectedVehicleCategory, setSelectedVehicleCategory] = useState(null);
  const [showVehicleFilter, setShowVehicleFilter] = useState(false);
  const [vehicleListings, setVehicleListings] = useState([]);
  const [generalListings, setGeneralListings] = useState([]);
  const navigate = useNavigate();

  // Cargar vehículos del backend
  useEffect(() => {
    if (selected === "Vehículos") {
      fetch(`${backendUrl}/api/vehicles`)
        .then(res => res.json())
        .then(data => setVehicleListings(Array.isArray(data) ? data : []));
    }
  }, [selected, backendUrl]);

  // Cargar mock/demo para otras categorías (puedes poner tu backend aquí)
  useEffect(() => {
    if (!selected || selected !== "Vehículos") {
      setGeneralListings([
        { id: 1, title: "Casa en Bogotá", price: 350000000, category: "Propiedades", img: "/demo/casa.jpg" },
        { id: 2, title: "Mazda 3 2019", price: 68000000, category: "Vehículos", img: "/demo/mazda.jpg" },
        { id: 3, title: "Laptop ASUS", price: 1800000, category: "Electrónicos", img: "/demo/laptop.jpg" },
        { id: 4, title: "Sofá 3 puestos", price: 400000, category: "Hogar", img: "/demo/sofa.jpg" },
        { id: 5, title: "Bicicleta Trek", price: 1200000, category: "Deportes", img: "/demo/bici.jpg" },
      ]);
    }
  }, [selected]);

  // Filtrar vehículos por categoría seleccionada
  const filteredVehicles = selectedVehicleCategory
    ? vehicleListings.filter(v => v.category === selectedVehicleCategory)
    : vehicleListings;

  // Filtrar por categoría para mock/demo de otros
  const listings = selected && selected !== "Vehículos"
    ? generalListings.filter(l => l.category === selected)
    : generalListings;

  return (
    <div className="marketplace-main">
      <div className="marketplace-header">
        <h2>Marketplace</h2>
        <button
          className="marketplace-categories-btn"
          onClick={() => {
            setSelected(null);
            setShowPropertyOptions(false);
            setShowVehicleOptions(false);
            setSelectedVehicleCategory(null);
          }}
        >
          <span style={{ fontSize: 20, marginRight: 6 }}>📂</span>
          Categorías
        </button>
      </div>
      <div className="marketplace-categories">
        {categories.map(cat =>
          cat.name === "Propiedades" ? (
            <button
              key={cat.name}
              className={`category-btn${selected === cat.name ? " selected" : ""}`}
              onClick={() => {
                setShowPropertyOptions(!showPropertyOptions);
                setSelected(cat.name);
                setShowVehicleOptions(false);
                setShowVehicleFilter(false);
              }}
            >
              <span style={{ fontSize: 24 }}>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ) : cat.name === "Vehículos" ? (
            <button
              key={cat.name}
              className={`category-btn${selected === cat.name ? " selected" : ""}`}
              onClick={() => {
                setShowVehicleOptions(!showVehicleOptions);
                setSelected(cat.name);
                setShowPropertyOptions(false);
                setShowVehicleFilter(false);
              }}
            >
              <span style={{ fontSize: 24 }}>{cat.icon}</span>
              <span>{cat.name}</span>
              {/* Botón de filtro tipo cono */}
              <button
                style={{
                  marginLeft: 10,
                  background: "#eee",
                  border: "none",
                  borderRadius: "50%",
                  padding: "2px 8px",
                  fontSize: "1.2em",
                  cursor: "pointer"
                }}
                onClick={e => {
                  e.stopPropagation();
                  setShowVehicleFilter(v => !v);
                }}
                aria-label="Filtrar categorías"
              >
                🔽
              </button>
            </button>
          ) : (
            <button
              key={cat.name}
              className={`category-btn${selected === cat.name ? " selected" : ""}`}
              onClick={() => {
                setSelected(cat.name);
                setShowPropertyOptions(false);
                setShowVehicleOptions(false);
                setShowVehicleFilter(false);
                setSelectedVehicleCategory(null);
              }}
            >
              <span style={{ fontSize: 24 }}>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          )
        )}
      </div>
      {/* Opciones para propiedades */}
      {showPropertyOptions && (
        <div className="property-options">
          <button
            className="property-option-btn"
            onClick={() => navigate("/properties")}
          >
            Propiedades en venta
          </button>
          <button
            className="property-option-btn"
            onClick={() => navigate("/rental-properties")}
          >
            Propiedades en alquiler
          </button>
        </div>
      )}
      {/* Banner de categorías de vehículos tipo filtro/cono */}
      {selected === "Vehículos" && showVehicleFilter && (
        <div className="vehicle-filter-dropdown" style={{
          display: "flex",
          gap: "12px",
          margin: "16px 0",
          flexWrap: "wrap",
          justifyContent: "center"
        }}>
          <button className="property-option-btn" onClick={() => navigate("/publish/vehicles")}>Publicar Vehículo</button>
          {vehicleCategories.map(cat => (
            <button key={cat}
              className={`property-option-btn${selectedVehicleCategory === cat ? " selected" : ""}`}
              style={{ background: selectedVehicleCategory === cat ? "#512E8C" : "#6C2DC7" }}
              onClick={() => setSelectedVehicleCategory(cat)}>
              {cat}
            </button>
          ))}
          <button className="property-option-btn" style={{ background: "#444" }} onClick={() => setSelectedVehicleCategory(null)}>
            Todas las categorías
          </button>
        </div>
      )}
      {/* Listado general excepto vehículos */}
      {selected !== "Vehículos" && (
        <div className="marketplace-listings">
          {listings.map(item => (
            <div key={item.id} className="marketplace-card">
              <img src={item.img} alt={item.title} className="marketplace-img" />
              <div className="marketplace-info">
                <div className="marketplace-title">{item.title}</div>
                <div className="marketplace-price">${item.price.toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Listado de vehículos publicados */}
      {selected === "Vehículos" && (
        <div className="marketplace-listings">
          {filteredVehicles.length === 0 && <div style={{padding:"32px", textAlign:"center", color:"#888"}}>No hay vehículos publicados.</div>}
          {filteredVehicles.map(item => (
            <div
              key={item._id}
              className="marketplace-card"
              onClick={() => navigate(`/vehicle/${item._id}`)} // <-- CORRECCIÓN: Navega al detalle del vehículo
              style={{ cursor: "pointer" }}
            >
              <img src={item.images?.[0] ? `${backendUrl}/${item.images[0]}` : "/demo/mazda.jpg"} alt={item.title} className="marketplace-img" />
              <div className="marketplace-info">
                <div className="marketplace-title">{item.title}</div>
                <div className="marketplace-price">${item.price?.toLocaleString()}</div>
                <div><b>Categoría:</b> {item.category}</div>
                <div><b>Ubicación:</b> {item.location}</div>
                <div><b>Vendedor:</b> {item.owner?.email || item.owner?.username || "Anónimo"}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}