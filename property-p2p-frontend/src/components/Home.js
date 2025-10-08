import React from 'react';

export default function Home() {
  return (
    <div style={{ textAlign: 'center' }}>
      <img
        src="/banner.jpg"
        alt="Banner Business P2P"
        style={{
          width: '100vw',          // Ajusta el tamaño aquí
          maxWidth: '100vw',
          height: '600px',
          display: 'block',
          margin: '0',
          borderRadius: '0',
          boxShadow: 'none'
        }}
      />
      <h2></h2>
      <p>Compra, vende o alquila bienes y servicios  de forma segura y directa.</p>
      <h2>Bienvenido</h2>
      <p>Compra y vende propiedades de forma segura con chat privado y contratos inteligentes.</p>
      <p>Regístrate o inicia sesión para comenzar.</p>
    </div>
  );
}
