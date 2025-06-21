import React from 'react';
import { FileText, AlertTriangle, Shield, Users, DollarSign, Lock, ExternalLink, Scale } from 'lucide-react';

const TermsOfServiceView = () => {
  return (
    <div className="min-h-screen pulse-text bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-8">
        
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <FileText className="h-12 w-12 text-green-400" />
              <h1 className="text-4xl font-bold pulse-title">Allgemeine Geschäftsbedingungen</h1>
            </div>
            <p className="text-lg pulse-text-secondary">
              Nutzungsbedingungen für PulseManager Community Edition
            </p>
            <p className="text-sm pulse-text-secondary mt-2">
              Stand: {new Date().toLocaleDateString('de-DE')}
            </p>
          </div>

          {/* Wichtige Hinweise */}
          <div className="pulse-card p-6 border-l-4 border-red-400">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-red-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold pulse-text mb-2">⚠️ Wichtige rechtliche Hinweise</h3>
                <ul className="space-y-2 text-sm pulse-text-secondary">
                  <li>• <strong>Keine Steuerberatung:</strong> PulseManager bietet keine steuerliche Beratung. Alle Daten müssen von einem Steuerberater geprüft werden.</li>
                  <li>• <strong>Keine Anlageberatung:</strong> Wir sind nicht am Kauf/Verkauf von Tokens beteiligt und geben keine Anlageempfehlungen.</li>
                  <li>• <strong>Keine Haftung für externe Links:</strong> Wir übernehmen keine Verantwortung für externe Dienste (PulseX, Bridge, etc.).</li>
                  <li>• <strong>Wallet-Daten:</strong> Alle ausgelesenen Wallet-Daten sind unverbindlich und müssen verifiziert werden.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 1. Geltungsbereich */}
          <div className="pulse-card p-6">
            <h2 className="text-2xl font-bold pulse-title mb-4 flex items-center gap-3">
              <Scale className="h-6 w-6 text-blue-400" />
              1. Geltungsbereich und Anbieter
            </h2>
            <div className="space-y-3 pulse-text-secondary">
              <p><strong>Anbieter:</strong> PulseManager Community Edition</p>
              <p><strong>Dienstleistung:</strong> Portfolio-Tracking und Steuerreport-Generierung für PulseChain-Assets</p>
              <p><strong>Geltungsbereich:</strong> Diese AGBs gelten für die Nutzung der PulseManager-App und aller damit verbundenen Dienste.</p>
              <p><strong>Rechtssystem:</strong> Deutsches Recht, soweit nicht zwingendes Recht entgegensteht.</p>
            </div>
          </div>

          {/* 2. Leistungsbeschreibung */}
          <div className="pulse-card p-6">
            <h2 className="text-2xl font-bold pulse-title mb-4 flex items-center gap-3">
              <FileText className="h-6 w-6 text-green-400" />
              2. Leistungsbeschreibung
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold pulse-text mb-2">📊 Portfolio-Tracking</h3>
                <ul className="space-y-1 pulse-text-secondary">
                  <li>• Anzeige von PulseChain-Wallet-Balances</li>
                  <li>• Token-Wert-Berechnungen basierend auf aktuellen Marktpreisen</li>
                  <li>• Transaktionshistorie und ROI-Berechnungen</li>
                  <li>• Portfolio-Performance-Tracking</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold pulse-text mb-2">📋 Steuerreport-Generierung</h3>
                <ul className="space-y-1 pulse-text-secondary">
                  <li>• Automatische Generierung von Steuerreports</li>
                  <li>• FIFO-Berechnungen nach deutschem Steuerrecht</li>
                  <li>• Export-Funktionen (PDF, CSV)</li>
                  <li>• Unterstützung bei der Steuererklärung</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold pulse-text mb-2">🔗 Externe Dienste</h3>
                <ul className="space-y-1 pulse-text-secondary">
                  <li>• Links zu PulseX (DEX)</li>
                  <li>• Links zu PulseChain Bridge</li>
                  <li>• Links zu WGEP-Token-Informationen</li>
                  <li>• Weitere PulseChain-Ökosystem-Dienste</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 3. Nutzungsbedingungen */}
          <div className="pulse-card p-6">
            <h2 className="text-2xl font-bold pulse-title mb-4 flex items-center gap-3">
              <Users className="h-6 w-6 text-purple-400" />
              3. Nutzungsbedingungen
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold pulse-text mb-2">✅ Erlaubte Nutzung</h3>
                <ul className="space-y-1 pulse-text-secondary">
                  <li>• Persönliche Portfolio-Verwaltung</li>
                  <li>• Steuerreport-Generierung für eigene Zwecke</li>
                  <li>• Nutzung der App-Features im Rahmen der Bestimmungen</li>
                  <li>• Zugriff auf externe Dienste über bereitgestellte Links</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold pulse-text mb-2">❌ Verbotene Nutzung</h3>
                <ul className="space-y-1 pulse-text-secondary">
                  <li>• Kommerzielle Nutzung ohne Genehmigung</li>
                  <li>• Manipulation der App oder API-Zugriffe</li>
                  <li>• Verbreitung von Schadsoftware oder Spam</li>
                  <li>• Verletzung von geistigen Eigentumsrechten</li>
                  <li>• Nutzung für illegale Aktivitäten</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 4. Haftungsausschlüsse */}
          <div className="pulse-card p-6">
            <h2 className="text-2xl font-bold pulse-title mb-4 flex items-center gap-3">
              <Shield className="h-6 w-6 text-red-400" />
              4. Haftungsausschlüsse und -beschränkungen
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold pulse-text mb-2">🚫 Keine Steuerberatung</h3>
                <ul className="space-y-1 pulse-text-secondary">
                  <li>• PulseManager bietet keine steuerliche Beratung</li>
                  <li>• Alle generierten Daten müssen von einem Steuerberater geprüft werden</li>
                  <li>• Wir übernehmen keine Verantwortung für steuerliche Konsequenzen</li>
                  <li>• Nutzer sind selbst für die korrekte Steuererklärung verantwortlich</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold pulse-text mb-2">🚫 Keine Anlageberatung</h3>
                <ul className="space-y-1 pulse-text-secondary">
                  <li>• Wir sind nicht am Kauf/Verkauf von Tokens beteiligt</li>
                  <li>• Keine Anlageempfehlungen oder Investment-Beratung</li>
                  <li>• Alle Investment-Entscheidungen liegen beim Nutzer</li>
                  <li>• Wir übernehmen keine Verantwortung für Investment-Verluste</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold pulse-text mb-2">🔗 Externe Links</h3>
                <ul className="space-y-1 pulse-text-secondary">
                  <li>• PulseX, PulseChain Bridge, WGEP sind externe Dienste</li>
                  <li>• Wir übernehmen keine Verantwortung für deren Funktionalität</li>
                  <li>• Keine Haftung für Schäden durch externe Dienste</li>
                  <li>• Nutzer nutzen externe Dienste auf eigene Gefahr</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold pulse-text mb-2">📊 Daten-Genauigkeit</h3>
                <ul className="space-y-1 pulse-text-secondary">
                  <li>• Wallet-Daten basieren auf öffentlichen Blockchain-Daten</li>
                  <li>• Preis-Daten können verzögert oder ungenau sein</li>
                  <li>• Alle Daten sind unverbindlich und müssen verifiziert werden</li>
                  <li>• Keine Garantie für Vollständigkeit oder Richtigkeit</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 5. Datenschutz */}
          <div className="pulse-card p-6">
            <h2 className="text-2xl font-bold pulse-title mb-4 flex items-center gap-3">
              <Lock className="h-6 w-6 text-blue-400" />
              5. Datenschutz und Datensicherheit
            </h2>
            <div className="space-y-3 pulse-text-secondary">
              <p>• <strong>DSGVO-Konformität:</strong> Alle Datenverarbeitungen erfolgen nach DSGVO-Standards</p>
              <p>• <strong>Verschlüsselung:</strong> Alle Datenübertragungen sind SSL/TLS-verschlüsselt</p>
              <p>• <strong>Keine privaten Schlüssel:</strong> Wir speichern niemals private Schlüssel oder Seed-Phrasen</p>
              <p>• <strong>Minimale Datensammlung:</strong> Nur notwendige Daten werden verarbeitet</p>
              <p>• <strong>Löschung auf Anfrage:</strong> Nutzer können ihre Daten jederzeit löschen lassen</p>
            </div>
          </div>

          {/* 6. Geistiges Eigentum */}
          <div className="pulse-card p-6">
            <h2 className="text-2xl font-bold pulse-title mb-4 flex items-center gap-3">
              <FileText className="h-6 w-6 text-purple-400" />
              6. Geistiges Eigentum
            </h2>
            <div className="space-y-3 pulse-text-secondary">
              <p>• <strong>Urheberrecht:</strong> PulseManager und alle Inhalte sind urheberrechtlich geschützt</p>
              <p>• <strong>Lizenz:</strong> Nutzer erhalten eine beschränkte, nicht-exklusive Lizenz zur Nutzung</p>
              <p>• <strong>Keine Weitergabe:</strong> Code, Design und Inhalte dürfen nicht weitergegeben werden</p>
              <p>• <strong>Markenrechte:</strong> PulseManager ist eine geschützte Marke</p>
              <p>• <strong>Externe Inhalte:</strong> Externe Dienste unterliegen deren eigenen Rechten</p>
            </div>
          </div>

          {/* 7. Zahlungen und Abonnements */}
          <div className="pulse-card p-6">
            <h2 className="text-2xl font-bold pulse-title mb-4 flex items-center gap-3">
              <DollarSign className="h-6 w-6 text-green-400" />
              7. Zahlungen und Premium-Features
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold pulse-text mb-2">💳 Zahlungsabwicklung</h3>
                <ul className="space-y-1 pulse-text-secondary">
                  <li>• Zahlungen werden über sichere Drittanbieter abgewickelt</li>
                  <li>• Wir speichern keine Kreditkartendaten</li>
                  <li>• Alle Preise verstehen sich inklusive gesetzlicher Mehrwertsteuer</li>
                  <li>• Abonnements können jederzeit gekündigt werden</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold pulse-text mb-2">⭐ Premium-Features</h3>
                <ul className="space-y-1 pulse-text-secondary">
                  <li>• Erweiterte Steuerreport-Funktionen</li>
                  <li>• Unbegrenzte Portfolio-Tracking</li>
                  <li>• Prioritäts-Support</li>
                  <li>• Erweiterte Export-Optionen</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 8. Kündigung */}
          <div className="pulse-card p-6">
            <h2 className="text-2xl font-bold pulse-title mb-4 flex items-center gap-3">
              <Users className="h-6 w-6 text-orange-400" />
              8. Kündigung und Beendigung
            </h2>
            <div className="space-y-3 pulse-text-secondary">
              <p>• <strong>Kündigung durch Nutzer:</strong> Jederzeit ohne Angabe von Gründen möglich</p>
              <p>• <strong>Kündigung durch Anbieter:</strong> Bei Verstoß gegen AGBs oder missbräuchlicher Nutzung</p>
              <p>• <strong>Datenlöschung:</strong> Nach Kündigung werden alle Nutzerdaten gelöscht</p>
              <p>• <strong>Rückerstattung:</strong> Keine Rückerstattung bei vorzeitiger Kündigung</p>
              <p>• <strong>Übergangsfrist:</strong> 30 Tage Übergangsfrist bei Anbieter-Kündigung</p>
            </div>
          </div>

          {/* 9. Schlussbestimmungen */}
          <div className="pulse-card p-6">
            <h2 className="text-2xl font-bold pulse-title mb-4 flex items-center gap-3">
              <Scale className="h-6 w-6 text-indigo-400" />
              9. Schlussbestimmungen
            </h2>
            <div className="space-y-3 pulse-text-secondary">
              <p>• <strong>Gerichtsstand:</strong> Deutschland, soweit gesetzlich zulässig</p>
              <p>• <strong>Teilunwirksamkeit:</strong> Unwirksame Klauseln berühren nicht die Gültigkeit der übrigen AGBs</p>
              <p>• <strong>Änderungen:</strong> AGBs können mit 30-tägiger Frist geändert werden</p>
              <p>• <strong>Vollständigkeit:</strong> Diese AGBs enthalten alle wesentlichen Vereinbarungen</p>
              <p>• <strong>Kontakt:</strong> Bei Fragen kontaktieren Sie uns über die App-Funktionen</p>
              <p><strong>Letzte Aktualisierung:</strong> {new Date().toLocaleDateString('de-DE')}</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TermsOfServiceView;
