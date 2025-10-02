import React, { useState } from 'react';
import axios from 'axios';

export default function Register({ setToken, backendUrl }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // Nuevo campo
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Paso 1: Enviar código al correo
  const sendCode = async () => {
    setLoading(true);
    try {
      await axios.post(`${backendUrl}/api/auth/send-code`, { email });
      setCodeSent(true);
      setStep(2);
      setError('');
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo enviar el código. Verifica el correo.');
    }
    setLoading(false);
  };

  // Paso 2: Validar código recibido
  const verifyCode = async () => {
    setLoading(true);
    try {
      await axios.post(`${backendUrl}/api/auth/verify-code`, { email, code });
      setStep(3);
      setError('');
    } catch (e) {
      setError(e.response?.data?.message || 'Código incorrecto o expirado.');
    }
    setLoading(false);
  };

  // Validar contraseña segura
  const isValidPassword = (pw) => {
    return (
      pw.length >= 8 &&
      pw.length <= 128 &&
      /[0-9]/.test(pw) &&
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw)
    );
  };

  // Paso 3: Registrar usuario
  const register = async () => {
    if (!isValidPassword(password)) {
      setError('La contraseña debe tener entre 8 y 128 caracteres, al menos un número y un carácter especial.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${backendUrl}/api/auth/register`, { email, password });
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setError('');
      alert('¡Registro exitoso!');
    } catch (e) {
      setError(e.response?.data?.message || 'Error al registrar usuario.');
    }
    setLoading(false);
  };

  return (
    <div>
      <h2>Registro</h2>
      {step === 1 && (
        <>
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={loading}
          />
          <button onClick={sendCode} disabled={loading || !email}>Enviar código al correo</button>
        </>
      )}
      {step === 2 && (
        <>
          <input
            placeholder="Código recibido en tu correo"
            value={code}
            onChange={e => setCode(e.target.value)}
            disabled={loading}
          />
          <button onClick={verifyCode} disabled={loading || !code}>Validar código</button>
        </>
      )}
      {step === 3 && (
        <>
          <input
            type="password"
            placeholder="Contraseña segura"
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Confirmar contraseña"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            disabled={loading}
          />
          <button onClick={register} disabled={loading || !password || !confirmPassword}>Crear cuenta</button>
          <p>La contraseña debe tener entre 8 y 128 caracteres, al menos un número y un carácter especial.</p>
        </>
      )}
      {error && <p style={{color:'red'}}>{error}</p>}
      {loading && <p>Procesando...</p>}
    </div>
  );
}