import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

export default function Login({ setToken, backendUrl }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${backendUrl}/api/auth/login`, { email, password });
      setToken(res.data.token);
      localStorage.setItem('token', res.data.token);
      navigate('/properties');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Error de autenticación');
    }
  };

  return (
    <div>
      <h2>Iniciar sesión</h2>
      <form onSubmit={submit}>
        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        /><br />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        /><br />
        <button type="submit">Ingresar</button>
      </form>
      {msg && <p style={{ color: "red" }}>{msg}</p>}
      <div style={{ marginTop: '10px' }}>
        <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
      </div>
    </div>
  );
}