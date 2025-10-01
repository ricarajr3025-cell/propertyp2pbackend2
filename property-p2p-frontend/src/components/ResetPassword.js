import React, { useState } from 'react';
import axios from 'axios';

export default function ResetPassword({ backendUrl }) {
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  const submit = async (e) => {
    e.preventDefault();
    const res = await axios.post(`${backendUrl}/api/auth/reset-password`, { token, password });
    setMsg(res.data.message);
  };

  return (
    <div>
      <h2>Establece una nueva contraseña</h2>
      <form onSubmit={submit}>
        <input
          type="password"
          placeholder="Nueva contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button type="submit">Cambiar contraseña</button>
      </form>
      {msg && <p>{msg}</p>}
    </div>
  );
}
