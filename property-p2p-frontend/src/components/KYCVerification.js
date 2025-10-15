import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './KYCVerification.css';

export default function KYCVerification({ token, backendUrl }) {
  const [step, setStep] = useState(1);
  const [kycStatus, setKycStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Step 1: Información personal
  const [personalInfo, setPersonalInfo] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    nationality: 'Colombia',
    address: '',
    city: '',
    postalCode: '',
    country: 'Colombia'
  });

  // Step 2: Documento
  const [documentInfo, setDocumentInfo] = useState({
    documentType: 'national_id',
    documentNumber: '',
    expiryDate: '',
    frontImage: null,
    backImage: null
  });

  // Step 3: Selfie
  const [selfieFile, setSelfieFile] = useState(null);
  const [withDocument, setWithDocument] = useState(true);

  // Step 4: Prueba de domicilio
  const [proofInfo, setProofInfo] = useState({
    proofType: 'utility_bill',
    proofDate: '',
    proofImage: null
  });

  useEffect(() => {
    loadKYCStatus();
  }, []);

  const loadKYCStatus = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/kyc/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setKycStatus(response.data);
      
      // Determinar en qué paso debe estar
      if (response.data.status === 'approved') {
        setStep(5); // Mostrar pantalla de verificado
      } else if (response.data.status === 'reviewing') {
        setStep(5); // Mostrar pantalla de revisión
      } else if (response.data.hasProofOfAddress) {
        setStep(5);
      } else if (response.data.hasSelfie) {
        setStep(4);
      } else if (response.data.hasDocument) {
        setStep(3);
      } else if (response.data.personalInfo?.firstName) {
        setStep(2);
      }
    } catch (err) {
      console.error('Error al cargar estado KYC:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${backendUrl}/api/kyc/step1-personal-info`,
        personalInfo,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStep(2);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al guardar información');
    }
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();
    if (!documentInfo.frontImage) {
      alert('Debes subir la imagen frontal de tu documento');
      return;
    }

    const formData = new FormData();
    formData.append('documentType', documentInfo.documentType);
    formData.append('documentNumber', documentInfo.documentNumber);
    formData.append('expiryDate', documentInfo.expiryDate);
    formData.append('frontImage', documentInfo.frontImage);
    if (documentInfo.backImage) {
      formData.append('backImage', documentInfo.backImage);
    }

    try {
      await axios.post(
        `${backendUrl}/api/kyc/step2-document`,
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          } 
        }
      );
      setStep(3);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al subir documento');
    }
  };

  const handleStep3Submit = async (e) => {
    e.preventDefault();
    if (!selfieFile) {
      alert('Debes tomar una selfie');
      return;
    }

    const formData = new FormData();
    formData.append('selfie', selfieFile);
    formData.append('withDocument', withDocument);

    try {
      await axios.post(
        `${backendUrl}/api/kyc/step3-selfie`,
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          } 
        }
      );
      setStep(4);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al subir selfie');
    }
  };

  const handleStep4Submit = async (e) => {
    e.preventDefault();
    if (!proofInfo.proofImage) {
      alert('Debes subir tu comprobante de domicilio');
      return;
    }

    const formData = new FormData();
    formData.append('proofType', proofInfo.proofType);
    formData.append('proofDate', proofInfo.proofDate);
    formData.append('proofImage', proofInfo.proofImage);

    try {
      await axios.post(
        `${backendUrl}/api/kyc/step4-proof-address`,
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          } 
        }
      );
      setStep(5);
      loadKYCStatus();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al subir comprobante');
    }
  };

  if (loading) {
    return (
      <div className="kyc-loading">
        <div className="spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="kyc-container">
      <div className="kyc-header">
        <button className="kyc-back" onClick={() => navigate('/profile')}>
          ← Volver al perfil
        </button>
        <h1>🔐 Verificación de Identidad</h1>
        <p className="kyc-subtitle">
          Verifica tu identidad para ganar la confianza de otros usuarios
        </p>
      </div>

      <div className="kyc-progress">
        <div className={`progress-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
          <div className="step-circle">1</div>
          <span>Info Personal</span>
        </div>
        <div className={`progress-line ${step > 1 ? 'completed' : ''}`}></div>
        <div className={`progress-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
          <div className="step-circle">2</div>
          <span>Documento</span>
        </div>
        <div className={`progress-line ${step > 2 ? 'completed' : ''}`}></div>
        <div className={`progress-step ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
          <div className="step-circle">3</div>
          <span>Selfie</span>
        </div>
        <div className={`progress-line ${step > 3 ? 'completed' : ''}`}></div>
        <div className={`progress-step ${step >= 4 ? 'active' : ''} ${step > 4 ? 'completed' : ''}`}>
          <div className="step-circle">4</div>
          <span>Comprobante</span>
        </div>
      </div>

      <div className="kyc-content">
        {/* PASO 1: INFORMACIÓN PERSONAL */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="kyc-form">
            <h2>Información Personal</h2>
            <div className="form-row">
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  type="text"
                  value={personalInfo.firstName}
                  onChange={(e) => setPersonalInfo({...personalInfo, firstName: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Apellido *</label>
                <input
                  type="text"
                  value={personalInfo.lastName}
                  onChange={(e) => setPersonalInfo({...personalInfo, lastName: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Fecha de Nacimiento *</label>
                <input
                  type="date"
                  value={personalInfo.dateOfBirth}
                  onChange={(e) => setPersonalInfo({...personalInfo, dateOfBirth: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Nacionalidad *</label>
                <select
                  value={personalInfo.nationality}
                  onChange={(e) => setPersonalInfo({...personalInfo, nationality: e.target.value})}
                  required
                >
                  <option value="Colombia">Colombia</option>
                  <option value="Venezuela">Venezuela</option>
                  <option value="Perú">Perú</option>
                  <option value="Ecuador">Ecuador</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Dirección *</label>
              <input
                type="text"
                value={personalInfo.address}
                onChange={(e) => setPersonalInfo({...personalInfo, address: e.target.value})}
                placeholder="Calle, número, apartamento"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Ciudad *</label>
                <input
                  type="text"
                  value={personalInfo.city}
                  onChange={(e) => setPersonalInfo({...personalInfo, city: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Código Postal</label>
                <input
                  type="text"
                  value={personalInfo.postalCode}
                  onChange={(e) => setPersonalInfo({...personalInfo, postalCode: e.target.value})}
                />
              </div>
            </div>

            <button type="submit" className="btn-next">
              Continuar →
            </button>
          </form>
        )}

        {/* PASO 2: DOCUMENTO */}
        {step === 2 && (
          <form onSubmit={handleStep2Submit} className="kyc-form">
            <h2>Documento de Identidad</h2>
            
            <div className="form-group">
              <label>Tipo de Documento *</label>
              <select
                value={documentInfo.documentType}
                onChange={(e) => setDocumentInfo({...documentInfo, documentType: e.target.value})}
                required
              >
                <option value="national_id">Cédula de Ciudadanía</option>
                <option value="passport">Pasaporte</option>
                <option value="drivers_license">Licencia de Conducir</option>
              </select>
            </div>

            <div className="form-group">
              <label>Número de Documento *</label>
              <input
                type="text"
                value={documentInfo.documentNumber}
                onChange={(e) => setDocumentInfo({...documentInfo, documentNumber: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>Fecha de Vencimiento</label>
              <input
                type="date"
                value={documentInfo.expiryDate}
                onChange={(e) => setDocumentInfo({...documentInfo, expiryDate: e.target.value})}
              />
            </div>

            <div className="file-upload-section">
              <label>Foto Frontal del Documento *</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setDocumentInfo({...documentInfo, frontImage: e.target.files[0]})}
                required
              />
              {documentInfo.frontImage && (
                <div className="file-preview">✅ {documentInfo.frontImage.name}</div>
              )}
            </div>

            <div className="file-upload-section">
              <label>Foto Trasera del Documento (opcional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setDocumentInfo({...documentInfo, backImage: e.target.files[0]})}
              />
              {documentInfo.backImage && (
                <div className="file-preview">✅ {documentInfo.backImage.name}</div>
              )}
            </div>

            <button type="submit" className="btn-next">
              Continuar →
            </button>
          </form>
        )}

        {/* PASO 3: SELFIE */}
        {step === 3 && (
          <form onSubmit={handleStep3Submit} className="kyc-form">
            <h2>Selfie de Verificación</h2>
            <p className="kyc-instructions">
              Toma una selfie clara sosteniendo tu documento de identidad junto a tu rostro
            </p>

            <div className="file-upload-section">
              <label>Subir Selfie *</label>
              <input
                type="file"
                accept="image/*"
                capture="user"
                onChange={(e) => setSelfieFile(e.target.files[0])}
                required
              />
              {selfieFile && (
                <div className="file-preview">✅ {selfieFile.name}</div>
              )}
            </div>

            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={withDocument}
                  onChange={(e) => setWithDocument(e.target.checked)}
                />
                Estoy sosteniendo mi documento en la selfie
              </label>
            </div>

            <button type="submit" className="btn-next">
              Continuar →
            </button>
          </form>
        )}

        {/* PASO 4: PRUEBA DE DOMICILIO */}
        {step === 4 && (
          <form onSubmit={handleStep4Submit} className="kyc-form">
            <h2>Comprobante de Domicilio</h2>
            <p className="kyc-instructions">
              Sube un documento oficial que demuestre tu dirección (factura de servicios, extracto bancario, etc.)
            </p>

            <div className="form-group">
              <label>Tipo de Comprobante *</label>
              <select
                value={proofInfo.proofType}
                onChange={(e) => setProofInfo({...proofInfo, proofType: e.target.value})}
                required
              >
                <option value="utility_bill">Factura de Servicios</option>
                <option value="bank_statement">Extracto Bancario</option>
                <option value="government_letter">Documento Gubernamental</option>
              </select>
            </div>

            <div className="form-group">
              <label>Fecha del Documento *</label>
              <input
                type="date"
                value={proofInfo.proofDate}
                onChange={(e) => setProofInfo({...proofInfo, proofDate: e.target.value})}
                required
              />
            </div>

            <div className="file-upload-section">
              <label>Subir Comprobante *</label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setProofInfo({...proofInfo, proofImage: e.target.files[0]})}
                required
              />
              {proofInfo.proofImage && (
                <div className="file-preview">✅ {proofInfo.proofImage.name}</div>
              )}
            </div>

            <button type="submit" className="btn-next">
              Enviar Verificación →
            </button>
          </form>
        )}

        {/* PASO 5: ESTADO */}
        {step === 5 && (
          <div className="kyc-status">
            {kycStatus?.status === 'approved' && (
              <div className="status-approved">
                <div className="status-icon">✅</div>
                <h2>¡Verificación Aprobada!</h2>
                <p>Tu cuenta ha sido verificada exitosamente</p>
                <div className="verified-badge-large">
                  🎖️ VERIFICADO
                </div>
                <button className="btn-back" onClick={() => navigate('/profile')}>
                  Volver al Perfil
                </button>
              </div>
            )}

            {kycStatus?.status === 'reviewing' && (
              <div className="status-reviewing">
                <div className="status-icon">⏳</div>
                <h2>Verificación en Revisión</h2>
                <p>Estamos revisando tu información. Esto puede tardar entre 24-48 horas.</p>
                <button className="btn-back" onClick={() => navigate('/profile')}>
                  Volver al Perfil
                </button>
              </div>
            )}

            {kycStatus?.status === 'rejected' && (
              <div className="status-rejected">
                <div className="status-icon">❌</div>
                <h2>Verificación Rechazada</h2>
                <p className="rejection-reason">{kycStatus.rejectionReason}</p>
                <button className="btn-retry" onClick={() => setStep(1)}>
                  Intentar de Nuevo
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
