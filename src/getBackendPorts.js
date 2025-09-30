export default async function getBackendPort() {
  // Cambia el host si tu backend no está en localhost
  const res = await fetch('http://localhost:3005/api/port');
  const data = await res.json();
  return data.port;
}
