export default async function getBackendPort() {
  const res = await fetch('http://localhost:3005/api/port');
  const data = await res.json();
  return data.port;
}
