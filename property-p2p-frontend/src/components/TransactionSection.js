import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ChatBox from './ChatBox';

export default function TransactionSection({ token, backendUrl }) {
  const [transactions, setTransactions] = useState([]);
  const [selectedTx, setSelectedTx] = useState(null);
  const userId = JSON.parse(atob(token.split('.')[1])).id;

  useEffect(() => {
    axios.get(`${backendUrl}/api/transactions`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setTransactions(res.data));
  }, [token, selectedTx, backendUrl]);

  const releaseFunds = async (tx) => {
    await axios.post(`${backendUrl}/api/transactions/${tx._id}/release`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    alert('Fondos liberados');
  };

  const appeal = async (tx) => {
    const reason = prompt('Motivo de apelación:');
    await axios.post(`${backendUrl}/api/transactions/${tx._id}/appeal`, { reason }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    alert('Apelación enviada');
  };

  return (
    <div>
      <h2>Mis transacciones</h2>
      <ul>
        {transactions.map(tx => (
          <li key={tx._id}>
            <span>{tx.property.title} - Estado: {tx.status}</span>
            <button onClick={() => setSelectedTx(tx)}>Ver Chat</button>
            {tx.seller._id === userId && tx.status === 'pending' && tx.escrow &&
              <button onClick={() => releaseFunds(tx)}>Liberar Fondos</button>
            }
            {tx.status === 'pending' &&
              <button onClick={() => appeal(tx)}>Apelar</button>
            }
          </li>
        ))}
      </ul>
      {selectedTx && <ChatBox transaction={selectedTx} token={token} userId={userId} backendUrl={backendUrl} />}
    </div>
  );
}
