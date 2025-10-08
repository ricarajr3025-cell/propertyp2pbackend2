import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ChatBox from './ChatBox';

export default function TransactionSection({ token, backendUrl }) {
  const [transactions, setTransactions] = useState([]);
  const [selectedTx, setSelectedTx] = useState(null);

  // Decodificar el ID del usuario desde el token JWT
  const userId = JSON.parse(atob(token.split('.')[1])).id;

  useEffect(() => {
    axios.get(`${backendUrl}/api/transactions`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setTransactions(res.data));
  }, [token, selectedTx, backendUrl]);

  // Simulación de pago en testnet
  const payTransaction = async (tx) => {
    alert('Simulando pago en testnet Ethereum (USDT ficticio)...');
    try {
      await axios.post(`${backendUrl}/api/transactions/${tx._id}/pay`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Pago simulado realizado. Ahora puedes liberar fondos.');
      setSelectedTx(null); // refresca
    } catch (err) {
      alert('Error al simular pago');
    }
  };

  const releaseFunds = async (tx) => {
    await axios.post(`${backendUrl}/api/transactions/${tx._id}/release`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    alert('Fondos liberados');
    setSelectedTx(null); // refresca
  };

  const appeal = async (tx) => {
    const reason = prompt('Motivo de apelación:');
    await axios.post(`${backendUrl}/api/transactions/${tx._id}/appeal`, { reason }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    alert('Apelación enviada');
    setSelectedTx(null); // refresca
  };

  return (
    <div>
      <h2>Mis transacciones</h2>
      <ul>
        {transactions.map(tx => (
          <li key={tx._id}>
            <span>{tx.property.title} - Estado: {tx.status}</span>
            <button onClick={() => setSelectedTx(tx)}>Ver Chat</button>
            {/* Botón de pago SOLO si es comprador y la transacción está pendiente */}
            {tx.buyer._id === userId && tx.status === 'pending' && !tx.paid &&
              <button onClick={() => payTransaction(tx)}>Realizar Pago</button>
            }
            {/* Liberar fondos SOLO si es comprador, transacción pagada y escrow activo */}
            {tx.buyer._id === userId && tx.status === 'paid' && tx.escrow &&
              <button onClick={() => releaseFunds(tx)}>Liberar Fondos</button>
            }
            {/* Apelar si la transacción está pendiente */}
            {tx.status === 'pending' &&
              <button onClick={() => appeal(tx)}>Apelar</button>
            }
          </li>
        ))}
      </ul>
      {/* Mostrar chat de la transacción seleccionada */}
      {selectedTx && <ChatBox transaction={selectedTx} token={token} userId={userId} backendUrl={backendUrl} />}
    </div>
  );
}