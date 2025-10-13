import React, { useState } from "react";
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

// Ejemplo demo de anuncios (solo para mostrar cards, puedes eliminar si usas backend)
const mockListings = [
  { id: 1, title: "Casa en Bogotá", price: 350000000, category: "Propiedades", img: "/demo/casa.jpg" },
  { id: 2, title: "Mazda 3 2019", price: 68000000, category: "Vehículos", img: "/demo/mazda.jpg" },
  { id: 3, title: "Laptop ASUS", price: 1800000, category: "Electrónicos", img: "/demo/laptop.jpg" },
  { id: 4, title: "Sofá 3 puestos", price: 400000, category: "Hogar", img: "/demo/sofa.jpg" },
  { id: 5, title: "Bicicleta Trek", price: 1200000, category: "Deportes", img: "/demo/bici.jpg" },
];

export default function Marketplace() {
  const [selected, setSelected] = useState(null);
  const [showPropertyOptions, setShowPropertyOptions] = useState(false);
  const navigate = useNavigate();

  // Filtrar por categoría para mock/demo
  const listings = selected
    ? mockListings.filter(l => l.category === selected)
    : mockListings;

  return (
    <div className="marketplace-main">
      <div className="marketplace-header">
        <h2>Marketplace</h2>
        <button
          className="marketplace-categories-btn"
          onClick={() => setSelected(null)}
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
              onClick={() => setShowPropertyOptions(!showPropertyOptions)}
            >
              <span style={{ fontSize: 24 }}>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ) : (
            <button
              key={cat.name}
              className={`category-btn${selected === cat.name ? " selected" : ""}`}
              onClick={() => setSelected(cat.name)}
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
    </div>
  );
}