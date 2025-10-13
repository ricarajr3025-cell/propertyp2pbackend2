import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ChatBox from './ChatBox';

export default function TransactionSection({ token, backendUrl }) {
  const [allTransactions, setAllTransactions] = useState([]);
  const [selectedTx, setSelectedTx] = useState(null);

  // Decodificar el ID del usuario desde el token JWT
  const userId = JSON.parse(atob(token.split('.')[1])).id;

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const [ventasRes, alquileresRes] = await Promise.all([
          axios.get(`${backendUrl}/api/transactions`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${backendUrl}/api/rental-transactions`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        const ventas = ventasRes.data.filter(tx => tx.type === 'venta');
        const alquileres = alquileresRes.data.filter(tx => tx.type === 'alquiler');
        setAllTransactions({ ventas, alquileres });
      } catch (err) {
        setAllTransactions({ ventas: [], alquileres: [] });
      }
    }
    fetchTransactions();
  }, [token, selectedTx, backendUrl]);

  // Simulación de pago en testnet (ventas)
  const payTransaction = async (tx) => {
    alert('Simulando pago en testnet Ethereum (USDT ficticio)...');
    try {
      await axios.post(`${backendUrl}/api/transactions/${tx._id}/pay`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Pago simulado realizado. Ahora puedes liberar fondos.');
      setSelectedTx(null);
    } catch (err) {
      alert('Error al simular pago');
    }
  };

  // Liberar fondos (ventas)
  const releaseFunds = async (tx) => {
    await axios.post(`${backendUrl}/api/transactions/${tx._id}/release`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    alert('Fondos liberados');
    setSelectedTx(null);
  };

  // Apelar transacción (ventas)
  const appeal = async (tx) => {
    const reason = prompt('Motivo de apelación:');
    await axios.post(`${backendUrl}/api/transactions/${tx._id}/appeal`, { reason }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    alert('Apelación enviada');
    setSelectedTx(null);
  };

  // Apelar transacción (alquiler)
  const appealRent = async (tx) => {
    const reason = prompt('Motivo de apelación:');
    await axios.post(`${backendUrl}/api/rental-transactions/${tx._id}/appeal`, { reason }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    alert('Apelación enviada');
    setSelectedTx(null);
  };

  // Cancelar transacción de alquiler
  const cancelRentTransaction = async (tx) => {
    if (window.confirm('¿Seguro que deseas cancelar esta transacción?')) {
      try {
        await axios.post(`${backendUrl}/api/rental-transactions/${tx._id}/cancel`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Transacción cancelada');
        setSelectedTx(null);
      } catch (err) {
        alert('Error al cancelar la transacción');
      }
    }
  };

  const ventas = allTransactions.ventas || [];
  const alquileres = allTransactions.alquileres || [];

  return (
    <div>
      <h2>Mis transacciones de Venta</h2>
      <ul>
        {ventas.map(tx => (
          <li key={tx._id}>
            <span>
              {tx.property?.title || "Propiedad eliminada"} - Estado: {tx.status}
            </span>
            <button onClick={() => setSelectedTx(tx)}>Ver Chat</button>
            {tx.buyer?._id === userId && tx.status === 'pending' && !tx.paid &&
              <button onClick={() => payTransaction(tx)}>Realizar Pago</button>
            }
            {tx.buyer?._id === userId && tx.status === 'paid' && tx.escrow &&
              <button onClick={() => releaseFunds(tx)}>Liberar Fondos</button>
            }
            {tx.status === 'pending' &&
              <button onClick={() => appeal(tx)}>Apelar</button>
            }
          </li>
        ))}
      </ul>
      <h2>Mis transacciones de Alquiler</h2>
      <ul>
        {alquileres.map(tx => (
          <li key={tx._id}>
            <span>
              {tx.property?.title || "Propiedad eliminada"} - Estado: {tx.status}
            </span>
            <button onClick={() => setSelectedTx(tx)}>Ver Chat</button>
            {tx.status === 'pending' &&
              <button onClick={() => appealRent(tx)}>Apelar</button>
            }
            {tx.status === 'pending' && tx.buyer?._id === userId &&
              <button 
                style={{ background: '#c00', color: '#fff', marginLeft: '8px' }}
                onClick={() => cancelRentTransaction(tx)}>
                Cancelar
              </button>
            }
          </li>
        ))}
      </ul>
      {selectedTx && (
        <ChatBox
          transaction={selectedTx}
          token={token}
          userId={userId}
          backendUrl={backendUrl}
        />
      )}
    </div>
  );
}