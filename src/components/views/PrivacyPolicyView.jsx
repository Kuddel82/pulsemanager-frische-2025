import React from 'react';
import { Shield, Eye, Lock, Database, Users, FileText, AlertTriangle } from 'lucide-react';

const PrivacyPolicyView = () => {
  return (
    <div className="min-h-screen pulse-text bg-black">
      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-8">
        
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Shield className="h-12 w-12 text-blue-400" />
              <h1 className="text-4xl font-bold pulse-title">Datenschutzbestimmungen</h1>
            </div>
            <p className="text-lg pulse-text-secondary">
              DSGVO-konforme Datenschutzerklärung für PulseManager
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
                <h3 className="text-lg font-semibold pulse-text mb-2">⚠️ Wichtige Hinweise</h3>
                <ul className="space-y-2 text-sm pulse-text-secondary">
                  <li>• <strong>Keine Steuerberatung:</strong> PulseManager bietet keine steuerliche Beratung. Alle Daten müssen von einem Steuerberater geprüft werden.</li>
                  <li>• <strong>Keine Haftung für externe Links:</strong> Wir übernehmen keine Verantwortung für externe Dienste (PulseX, Bridge, etc.).</li>
                  <li>• <strong>Keine Anlageberatung:</strong> Wir sind nicht am Kauf/Verkauf von Tokens beteiligt.</li>
                  <li>• <strong>Wallet-Daten:</strong> Alle ausgelesenen Wallet-Daten sind unverbindlich und müssen verifiziert werden.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 1. Verantwortlicher */}
          <div className="pulse-card p-6">
            <h2 className="text-2xl font-bold pulse-title mb-4 flex items-center gap-3">
              <Users className="h-6 w-6 text-blue-400" />
              1. Verantwortlicher für die Datenverarbeitung
            </h2>
            <div className="space-y-3 pulse-text-secondary">
              <p><strong>Diensteanbieter:</strong> PulseManager Community Edition</p>
              <p><strong>Kontakt:</strong> Über die App-Funktionen</p>
              <p><strong>Zweck:</strong> Portfolio-Tracking und Steuerreport-Generierung für PulseChain-Assets</p>
            </div>
          </div>

          {/* 2. Erhobene Daten */}
          <div className="pulse-card p-6">
            <h2 className="text-2xl font-bold pulse-title mb-4 flex items-center gap-3">
              <Database className="h-6 w-6 text-green-400" />
              2. Welche Daten erheben wir?
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold pulse-text mb-2">🔐 Authentifizierung</h3>
                <ul className="space-y-1 pulse-text-secondary">
                  <li>• E-Mail-Adresse für Login/Registrierung</li>
                  <li>• Passwort (verschlüsselt gespeichert)</li>
                  <li>• Session-Tokens für App-Zugang</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold pulse-text mb-2">💼 Portfolio-Daten</h3>
                <ul className="space-y-1 pulse-text-secondary">
                  <li>• Wallet-Adressen (öffentliche Blockchain-Daten)</li>
                  <li>• Token-Balances und Transaktionshistorie</li>
                  <li>• Portfolio-Werte und ROI-Berechnungen</li>
                  <li>• Steuerreport-Daten (freiwillig generiert)</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold pulse-text mb-2">📊 Nutzungsdaten</h3>
                <ul className="space-y-1 pulse-text-secondary">
                  <li>• App-Nutzung und Feature-Zugriffe</li>
                  <li>• Technische Logs für Stabilität</li>
                  <li>• Performance-Metriken</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 3. Rechtsgrundlagen */}
          <div className="pulse-card p-6">
            <h2 className="text-2xl font-bold pulse-title mb-4 flex items-center gap-3">
              <FileText className="h-6 w-6 text-purple-400" />
              3. Rechtsgrundlagen der Datenverarbeitung
            </h2>
            <div className="space-y-3 pulse-text-secondary">
              <p><strong>Art. 6 Abs. 1 lit. a DSGVO:</strong> Einwilligung für Premium-Features</p>
              <p><strong>Art. 6 Abs. 1 lit. b DSGVO:</strong> Vertragserfüllung für App-Nutzung</p>
              <p><strong>Art. 6 Abs. 1 lit. f DSGVO:</strong> Berechtigtes Interesse an App-Stabilität</p>
              <p><strong>Art. 6 Abs. 1 lit. c DSGVO:</strong> Rechtliche Verpflichtungen (Steuerrecht)</p>
            </div>
          </div>

          {/* 4. Zweck der Datenverarbeitung */}
          <div className="pulse-card p-6">
            <h2 className="text-2xl font-bold pulse-title mb-4 flex items-center gap-3">
              <Eye className="h-6 w-6 text-orange-400" />
              4. Zweck der Datenverarbeitung
            </h2>
            <div className="space-y-3 pulse-text-secondary">
              <p>• <strong>Portfolio-Tracking:</strong> Anzeige Ihrer PulseChain-Assets</p>
              <p>• <strong>ROI-Berechnung:</strong> Performance-Tracking Ihrer Investments</p>
              <p>• <strong>Steuerreport-Generierung:</strong> Unterstützung bei Steuererklärung</p>
              <p>• <strong>App-Funktionalität:</strong> Bereitstellung der PulseManager-Services</p>
              <p>• <strong>Technische Stabilität:</strong> Verbesserung der App-Performance</p>
            </div>
          </div>

          {/* 5. Datenweitergabe */}
          <div className="pulse-card p-6">
            <h2 className="text-2xl font-bold pulse-title mb-4 flex items-center gap-3">
              <Lock className="h-6 w-6 text-red-400" />
              5. Datenweitergabe und externe Dienste
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold pulse-text mb-2">🔗 Externe APIs</h3>
                <ul className="space-y-1 pulse-text-secondary">
                  <li>• <strong>Moralis API:</strong> Blockchain-Daten und Token-Preise</li>
                  <li>• <strong>Supabase:</strong> Datenbank-Speicherung</li>
                  <li>• <strong>Vercel:</strong> Hosting und CDN</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold pulse-text mb-2">⚠️ Keine Haftung für externe Links</h3>
                <ul className="space-y-1 pulse-text-secondary">
                  <li>• PulseX, PulseChain Bridge, WGEP sind externe Dienste</li>
                  <li>• Wir übernehmen keine Verantwortung für deren Datenschutz</li>
                  <li>• Bitte prüfen Sie die Datenschutzerklärungen der externen Anbieter</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 6. Ihre Rechte */}
          <div className="pulse-card p-6">
            <h2 className="text-2xl font-bold pulse-title mb-4 flex items-center gap-3">
              <Shield className="h-6 w-6 text-green-400" />
              6. Ihre Rechte nach der DSGVO
            </h2>
            <div className="space-y-3 pulse-text-secondary">
              <p><strong>Art. 15 DSGVO:</strong> Auskunftsrecht über verarbeitete Daten</p>
              <p><strong>Art. 16 DSGVO:</strong> Recht auf Berichtigung falscher Daten</p>
              <p><strong>Art. 17 DSGVO:</strong> Recht auf Löschung ("Recht auf Vergessenwerden")</p>
              <p><strong>Art. 18 DSGVO:</strong> Recht auf Einschränkung der Verarbeitung</p>
              <p><strong>Art. 20 DSGVO:</strong> Recht auf Datenübertragbarkeit</p>
              <p><strong>Art. 21 DSGVO:</strong> Widerspruchsrecht gegen Verarbeitung</p>
              <p><strong>Art. 22 DSGVO:</strong> Recht auf Entscheidungsfreiheit bei automatisierter Verarbeitung</p>
            </div>
          </div>

          {/* 7. Datensicherheit */}
          <div className="pulse-card p-6">
            <h2 className="text-2xl font-bold pulse-title mb-4 flex items-center gap-3">
              <Lock className="h-6 w-6 text-blue-400" />
              7. Datensicherheit
            </h2>
            <div className="space-y-3 pulse-text-secondary">
              <p>• <strong>Verschlüsselung:</strong> Alle Datenübertragungen sind SSL/TLS-verschlüsselt</p>
              <p>• <strong>Passwort-Sicherheit:</strong> Passwörter werden verschlüsselt gespeichert</p>
              <p>• <strong>Session-Management:</strong> Sichere Session-Tokens mit Ablaufzeiten</p>
              <p>• <strong>Regelmäßige Updates:</strong> Sicherheitsupdates und Patches</p>
              <p>• <strong>Backup-Sicherheit:</strong> Regelmäßige, verschlüsselte Backups</p>
            </div>
          </div>

          {/* 8. Kontakt */}
          <div className="pulse-card p-6">
            <h2 className="text-2xl font-bold pulse-title mb-4 flex items-center gap-3">
              <Users className="h-6 w-6 text-purple-400" />
              8. Kontakt und Beschwerderecht
            </h2>
            <div className="space-y-3 pulse-text-secondary">
              <p>Bei Fragen zum Datenschutz kontaktieren Sie uns über die App-Funktionen.</p>
              <p><strong>Aufsichtsbehörde:</strong> Sie haben das Recht, sich bei der zuständigen Datenschutzaufsichtsbehörde zu beschweren.</p>
              <p><strong>Letzte Aktualisierung:</strong> {new Date().toLocaleDateString('de-DE')}</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyView;
