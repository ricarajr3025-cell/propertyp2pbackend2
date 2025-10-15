import React, { useState, useEffect } from 'react';
import './OfferModal.css';

export default function OfferModal({ 
  show, 
  onClose, 
  property, 
  onSubmit,
  backendUrl 
}) {
  const [selectedOption, setSelectedOption] = useState('listing_price');
  const [customAmount, setCustomAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const listingPrice = property?.price || 0;
  const lowerPrice = Math.floor(listingPrice * 0.9);
  const higherPrice = Math.floor(listingPrice * 1.05);

  useEffect(() => {
    if (show) {
      setSelectedOption('listing_price');
      setCustomAmount('');
    }
  }, [show]);

  const getSelectedAmount = () => {
    switch (selectedOption) {
      case 'lower_price':
        return lowerPrice;
      case 'listing_price':
        return listingPrice;
      case 'higher_price':
        return higherPrice;
      case 'custom':
        return parseInt(customAmount.replace(/[^0-9]/g, '')) || 0;
      default:
        return listingPrice;
    }
  };

  const handleCustomAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setCustomAmount(value);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleSubmit = async () => {
    const amount = getSelectedAmount();
    
    if (amount <= 0) {
      alert('Por favor ingresa un monto válido');
      return;
    }

    if (selectedOption === 'custom' && amount < listingPrice * 0.5) {
      const confirm = window.confirm(
        `Tu oferta es ${Math.floor(((listingPrice - amount) / listingPrice) * 100)}% menor que el precio publicado. ¿Deseas continuar?`
      );
      if (!confirm) return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(amount);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!show) return null;

  return (
    <div className="offer-modal-overlay" onClick={onClose}>
      <div className="offer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="offer-modal-header">
          <button className="offer-modal-close" onClick={onClose}>
            ✕
          </button>
          <h2>Tu Oferta</h2>
        </div>

        <div className="offer-modal-body">
          {/* Información de la propiedad */}
          <div className="offer-property-info">
            {property?.images && property.images[0] && (
              <img
                src={`${backendUrl}/${property.images[0]}`}
                alt={property.title}
                className="offer-property-image"
              />
            )}
            <div className="offer-property-details">
              <h3>{property?.title}</h3>
              <p className="offer-listing-price">
                {formatCurrency(listingPrice)}
              </p>
              <p className="offer-location">📍 {property?.location}</p>
            </div>
          </div>

          {/* Opciones de oferta */}
          <div className="offer-options">
            {/* Opción 1: 10% menos */}
            <label className="offer-option">
              <input
                type="radio"
                name="offer"
                value="lower_price"
                checked={selectedOption === 'lower_price'}
                onChange={() => setSelectedOption('lower_price')}
              />
              <div className="offer-option-content">
                <span className="offer-option-amount">
                  {formatCurrency(lowerPrice)}
                </span>
                <span className="offer-option-label">
                  (10% menos)
                </span>
              </div>
            </label>

            {/* Opción 2: Precio publicado */}
            <label className="offer-option offer-option-recommended">
              <input
                type="radio"
                name="offer"
                value="listing_price"
                checked={selectedOption === 'listing_price'}
                onChange={() => setSelectedOption('listing_price')}
              />
              <div className="offer-option-content">
                <span className="offer-option-amount">
                  {formatCurrency(listingPrice)}
                </span>
                <span className="offer-option-label offer-option-badge">
                  ✨ Precio publicado
                </span>
              </div>
            </label>

            {/* Opción 3: 5% más */}
            <label className="offer-option">
              <input
                type="radio"
                name="offer"
                value="higher_price"
                checked={selectedOption === 'higher_price'}
                onChange={() => setSelectedOption('higher_price')}
              />
              <div className="offer-option-content">
                <span className="offer-option-amount">
                  {formatCurrency(higherPrice)}
                </span>
                <span className="offer-option-label">
                  (5% más)
                </span>
              </div>
            </label>

            {/* Opción 4: Monto personalizado */}
            <label className="offer-option offer-option-custom">
              <input
                type="radio"
                name="offer"
                value="custom"
                checked={selectedOption === 'custom'}
                onChange={() => setSelectedOption('custom')}
              />
              <div className="offer-option-content">
                {selectedOption === 'custom' ? (
                  <input
                    type="text"
                    className="offer-custom-input"
                    placeholder="Ingresa tu oferta"
                    value={customAmount ? formatCurrency(parseInt(customAmount)) : ''}
                    onChange={handleCustomAmountChange}
                    autoFocus
                  />
                ) : (
                  <span className="offer-option-label-link">
                    Ofrecer un monto diferente
                  </span>
                )}
              </div>
            </label>
          </div>

          {/* Mensaje informativo */}
          <div className="offer-info-message">
            <p>
              Tu oferta no es un pago. Los detalles de compra se coordinan después con el vendedor.
            </p>
          </div>

          {/* Vista previa del monto seleccionado */}
          <div className="offer-summary">
            <div className="offer-summary-label">Tu oferta:</div>
            <div className="offer-summary-amount">
              {formatCurrency(getSelectedAmount())}
            </div>
            {selectedOption !== 'listing_price' && getSelectedAmount() > 0 && (
              <div className="offer-summary-diff">
                {getSelectedAmount() < listingPrice ? (
                  <span className="offer-diff-lower">
                    ↓ {formatCurrency(listingPrice - getSelectedAmount())} menos
                  </span>
                ) : (
                  <span className="offer-diff-higher">
                    ↑ {formatCurrency(getSelectedAmount() - listingPrice)} más
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="offer-modal-footer">
          <button
            className="btn-send-offer"
            onClick={handleSubmit}
            disabled={isSubmitting || getSelectedAmount() <= 0}
          >
            {isSubmitting ? '⏳ Enviando...' : '💬 Enviar Oferta'}
          </button>
        </div>
      </div>
    </div>
  );
}
