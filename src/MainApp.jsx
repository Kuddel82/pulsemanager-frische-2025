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
  const [currentView, setCurrentView] = useState('dashboard'); // dashboard, wallet, roi, academy, tax

  // PulseChain Ecosystem Portfolio
  const portfolioData = [
    { symbol: 'PLS', name: 'PulseChain', amount: 2500000, price: 0.000085, change24h: 15.67, icon: '◉' },
    { symbol: 'PLSX', name: 'PulseX', amount: 450000, price: 0.000021, change24h: -2.34, icon: '✕' },
    { symbol: 'HEX', name: 'HEX', amount: 125000, price: 0.0045, change24h: 8.91, icon: '⬟' },
    { symbol: 'INC', name: 'Incentive', amount: 75000, price: 0.000012, change24h: 12.45, icon: '💎' },
    { symbol: 'LOAN', name: 'Liquid Loans', amount: 35000, price: 0.000098, change24h: -0.87, icon: '🏦' },
    { symbol: 'SPARK', name: 'Spark', amount: 850000, price: 0.0000034, change24h: 5.23, icon: '⚡' },
    { symbol: 'TONI', name: 'Toni', amount: 180000, price: 0.000067, change24h: -3.12, icon: '🎭' },
    { symbol: 'MAXI', name: 'Maximus', amount: 42000, price: 0.00015, change24h: 7.89, icon: '👑' }
  ];

  const totalPortfolioValue = portfolioData.reduce((total, coin) => 
    total + (coin.amount * coin.price), 0
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLogin) {
      console.log('Login:', { email, password });
      setUserEmail(email);
      setIsLoggedIn(true);
      setCurrentView('dashboard');
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
    setCurrentView('dashboard');
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatNumber = (value, decimals = 4) => {
    return new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  };

  // WALLET VIEW - PULSECHAIN FOKUS
  if (isLoggedIn && currentView === 'wallet') {
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setCurrentView('dashboard')}
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              ← Dashboard
            </button>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#1f2937',
              margin: 0
            }}>
              ◉ PulseChain Portfolio
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              {userEmail}
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

        {/* Wallet Content */}
        <div style={{ padding: '2rem' }}>
          {/* Portfolio Summary */}
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            marginBottom: '2rem',
            border: '2px solid #9333ea'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '1rem'
            }}>
              🚀 PulseChain Ecosystem Portfolio
            </h2>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: '#9333ea',
              marginBottom: '0.5rem'
            }}>
              {formatCurrency(totalPortfolioValue)}
            </div>
            <p style={{ color: '#6b7280', margin: 0 }}>
              Gesamtwert Ihrer PulseChain Assets
            </p>
          </div>

          {/* Holdings Table */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '1.5rem 2rem',
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: '#f8fafc'
            }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: 'bold',
                color: '#1f2937',
                margin: 0
              }}>
                📊 Ihre PulseChain Assets
              </h3>
            </div>
            
            {/* Table Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1.5fr 1fr 1.5fr 1fr 1fr',
              padding: '1rem 2rem',
              backgroundColor: '#9333ea',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: 'bold'
            }}>
              <div>Asset</div>
              <div>Menge</div>
              <div>Preis</div>
              <div>Wert</div>
              <div>24h %</div>
              <div>Portfolio %</div>
            </div>

            {/* Table Rows */}
            {portfolioData.map((coin, index) => {
              const value = coin.amount * coin.price;
              const portfolioPercent = (value / totalPortfolioValue) * 100;
              const isPositive = coin.change24h > 0;
              
              return (
                <div key={coin.symbol} style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1.5fr 1fr 1.5fr 1fr 1fr',
                  padding: '1rem 2rem',
                  borderBottom: index < portfolioData.length - 1 ? '1px solid #e5e7eb' : 'none',
                  alignItems: 'center',
                  backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb'
                }}>
                  {/* Asset */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>{coin.icon}</span>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#1f2937', fontSize: '1rem' }}>{coin.symbol}</div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{coin.name}</div>
                    </div>
                  </div>
                  
                  {/* Menge */}
                  <div style={{ color: '#1f2937', fontWeight: '500' }}>
                    {formatNumber(coin.amount, 0)}
                  </div>
                  
                  {/* Preis */}
                  <div style={{ color: '#1f2937', fontSize: '0.875rem' }}>
                    ${coin.price.toFixed(8)}
                  </div>
                  
                  {/* Wert */}
                  <div style={{ fontWeight: 'bold', color: '#1f2937' }}>
                    {formatCurrency(value)}
                  </div>
                  
                  {/* 24h Change */}
                  <div style={{ 
                    color: isPositive ? '#10b981' : '#ef4444',
                    fontWeight: 'bold',
                    fontSize: '0.875rem'
                  }}>
                    {isPositive ? '+' : ''}{coin.change24h.toFixed(2)}%
                  </div>
                  
                  {/* Portfolio % */}
                  <div style={{ 
                    color: '#6b7280',
                    fontWeight: '500',
                    fontSize: '0.875rem'
                  }}>
                    {portfolioPercent.toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>

          {/* Portfolio Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem',
            marginTop: '2rem'
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📈</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                {portfolioData.filter(coin => coin.change24h > 0).length}
              </div>
              <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Assets im Plus</div>
            </div>

            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎯</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#9333ea' }}>
                {portfolioData.length}
              </div>
              <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Total Assets</div>
            </div>

            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚡</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
                PulseChain
              </div>
              <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Blockchain</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // DASHBOARD ANSICHT
  if (isLoggedIn && currentView === 'dashboard') {
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
              Verwalten Sie Ihr PulseChain Portfolio und verfolgen Sie Ihre Assets.
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
              border: '2px solid #9333ea'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '2rem', marginRight: '0.75rem' }}>◉</span>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                  PulseChain Portfolio
                </h3>
              </div>
              <p style={{ color: '#6b7280', marginBottom: '1rem', fontSize: '0.875rem' }}>
                Übersicht Ihrer PulseChain Ecosystem Assets und Portfolio-Performance.
              </p>
              <button 
                onClick={() => setCurrentView('wallet')}
                style={{
                  backgroundColor: '#9333ea',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                Portfolio anzeigen
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
                ROI anzeigen (Coming Soon)
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
                Lernen Sie mehr über PulseChain und das Ecosystem.
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
                Kurse starten (Coming Soon)
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
                Generieren Sie Steuerberichte für Ihre PulseChain Transaktionen.
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
                Report erstellen (Coming Soon)
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