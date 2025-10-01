import React, { useState } from 'react';
import axios from 'axios';

export default function ForgotPassword({ backendUrl }) {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const res = await axios.post(`${backendUrl}/api/auth/forgot-password`, { email });
    setMsg(res.data.message);
  };

  return (
    <div>
      <h2>Recuperar contraseña</h2>
      <form onSubmit={submit}>
        <input
          type="email"
          placeholder="Correo registrado"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <button type="submit">Enviar enlace</button>
      </form>
      {msg && <p>{msg}</p>}
    </div>
  );
}
