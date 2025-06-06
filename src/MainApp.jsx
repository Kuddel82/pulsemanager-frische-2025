// COMPLETE LOGIN + DASHBOARD - BUILD TIME: 2025-01-07 02:45
// LOGIN WITH REGISTRATION AND DASHBOARD REDIRECT
import React, { useState } from 'react';

function MainApp() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLogin) {
      console.log('Login:', { email, password });
      setUserEmail(email);
      setIsLoggedIn(true);
    } else {
      if (password !== confirmPassword) {
        alert('Passwörter stimmen nicht überein!');
        return;
      }
      console.log('Register:', { email, password });
      alert(`Registrierung erfolgreich für: ${email}\nSie können sich jetzt anmelden!`);
      setIsLogin(true);
      setPassword('');
      setConfirmPassword('');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserEmail('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setIsLogin(true);
  };

  // DASHBOARD ANSICHT
  if (isLoggedIn) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: 'white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: '1rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#1f2937',
            margin: 0
          }}>
            🚀 PulseManager Dashboard
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              Willkommen, {userEmail}
            </span>
            <button
              onClick={handleLogout}
              style={{
                backgroundColor: '#ef4444',
                color: 'white',
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Dashboard Content */}
        <div style={{ padding: '2rem' }}>
          {/* Welcome Card */}
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            marginBottom: '2rem'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '0.5rem'
            }}>
              🎉 Willkommen im PulseManager!
            </h2>
            <p style={{ color: '#6b7280', margin: 0 }}>
              Sie sind erfolgreich angemeldet und bereit loszulegen!
            </p>
          </div>

          {/* Feature Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem'
          }}>
            {/* Wallet Card */}
            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '2rem', marginRight: '0.75rem' }}>💰</span>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                  Wallet Overview
                </h3>
              </div>
              <p style={{ color: '#6b7280', marginBottom: '1rem', fontSize: '0.875rem' }}>
                Verwalten Sie Ihre Kryptowährungen und verfolgen Sie Ihr Portfolio.
              </p>
              <button style={{
                backgroundColor: '#9333ea',
                color: 'white',
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                cursor: 'pointer',
                width: '100%'
              }}>
                Wallet öffnen
              </button>
            </div>

            {/* ROI Tracker Card */}
            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '2rem', marginRight: '0.75rem' }}>📈</span>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                  ROI Tracker
                </h3>
              </div>
              <p style={{ color: '#6b7280', marginBottom: '1rem', fontSize: '0.875rem' }}>
                Verfolgen Sie Ihre Investitionen und analysieren Sie Ihre Rendite.
              </p>
              <button style={{
                backgroundColor: '#10b981',
                color: 'white',
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                cursor: 'pointer',
                width: '100%'
              }}>
                ROI anzeigen
              </button>
            </div>

            {/* Academy Card */}
            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '2rem', marginRight: '0.75rem' }}>🎓</span>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                  Learning Academy
                </h3>
              </div>
              <p style={{ color: '#6b7280', marginBottom: '1rem', fontSize: '0.875rem' }}>
                Lernen Sie mehr über Kryptowährungen und Trading-Strategien.
              </p>
              <button style={{
                backgroundColor: '#f59e0b',
                color: 'white',
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                cursor: 'pointer',
                width: '100%'
              }}>
                Kurse starten
              </button>
            </div>

            {/* Tax Report Card */}
            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '2rem', marginRight: '0.75rem' }}>📊</span>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                  Tax Reports
                </h3>
              </div>
              <p style={{ color: '#6b7280', marginBottom: '1rem', fontSize: '0.875rem' }}>
                Generieren Sie Steuerberichte für Ihre Krypto-Transaktionen.
              </p>
              <button style={{
                backgroundColor: '#8b5cf6',
                color: 'white',
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                cursor: 'pointer',
                width: '100%'
              }}>
                Report erstellen
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // LOGIN/REGISTER ANSICHT
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #c084fc, #9333ea, #7c3aed)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '1rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: '#1f2937',
          marginBottom: '0.5rem',
          textAlign: 'center'
        }}>
          🚀 PulseManager
        </h1>
        <p style={{
          textAlign: 'center',
          color: '#6b7280',
          marginBottom: '1.5rem',
          fontSize: '0.875rem'
        }}>
          {isLogin ? 'Willkommen zurück!' : 'Erstelle deinen Account'}
        </p>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              E-Mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
              placeholder="deine@email.de"
              required
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Passwort
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isLogin ? "current-password" : "new-password"}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
              placeholder="••••••••"
              required
            />
          </div>
          {!isLogin && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Passwort bestätigen
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
                placeholder="••••••••"
                required
              />
            </div>
          )}
          <button
            type="submit"
            style={{
              width: '100%',
              backgroundColor: '#9333ea',
              color: 'white',
              padding: '0.75rem',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'block',
              marginBottom: '1rem'
            }}
          >
            {isLogin ? '🔥 Anmelden' : '✨ Registrieren'}
          </button>
        </form>
        <div style={{
          textAlign: 'center',
          fontSize: '0.875rem',
          color: '#6b7280'
        }}>
          {isLogin ? (
            <>
              Noch kein Account?{' '}
              <button
                onClick={() => setIsLogin(false)}
                style={{
                  color: '#9333ea',
                  fontWeight: 'bold',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Jetzt registrieren
              </button>
            </>
          ) : (
            <>
              Bereits registriert?{' '}
              <button
                onClick={() => setIsLogin(true)}
                style={{
                  color: '#9333ea',
                  fontWeight: 'bold',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Zur Anmeldung
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default MainApp; 