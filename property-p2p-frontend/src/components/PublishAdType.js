import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PublishAdType.css";

export default function PublishAdType() {
  const navigate = useNavigate();
  const [showHomeOptions, setShowHomeOptions] = useState(false);

  return (
    <div className="publish-ad-type-container">
      <h2>Create new listing</h2>
      <div className="publish-ad-type-list">
        <button className="publish-ad-type-btn" onClick={() => navigate("/publish/items")}>
          <span className="publish-ad-type-icon">🛍️</span>
          <div>
            <div className="publish-ad-type-label">Items</div>
            <div className="publish-ad-type-desc">Todo lo demás: electrónicos, hogar, deportes, servicios, ropa, juguetes, etc.</div>
          </div>
        </button>
        <button className="publish-ad-type-btn" onClick={() => navigate("/publish/vehicles")}>
          <span className="publish-ad-type-icon">🚗</span>
          <div>
            <div className="publish-ad-type-label">Vehicles</div>
            <div className="publish-ad-type-desc">Carros, motos, bicicletas, vehículos náuticos, etc.</div>
          </div>
        </button>
        <button
          className="publish-ad-type-btn"
          onClick={() => setShowHomeOptions(!showHomeOptions)}
        >
          <span className="publish-ad-type-icon">🏠</span>
          <div>
            <div className="publish-ad-type-label">Homes for sale or rent</div>
            <div className="publish-ad-type-desc">
              Propiedades, casas, apartamentos, lotes en venta o alquiler.
            </div>
          </div>
        </button>
        {showHomeOptions && (
          <div className="home-options">
            <button
              className="home-option-btn"
              onClick={() => navigate("/publish/homes/sale")}
            >
              Publicar propiedad en venta
            </button>
            <button
              className="home-option-btn"
              onClick={() => navigate("/publish/homes/rent")}
            >
              Publicar propiedad en alquiler
            </button>
          </div>
        )}
      </div>
    </div>
  );
}