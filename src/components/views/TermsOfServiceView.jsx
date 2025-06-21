import React from 'react';
import { FileText, AlertTriangle, Users, Shield, Lock, Scale, Mail } from 'lucide-react';

const TermsOfServiceView = () => {
  return (
    <div className="min-h-screen pulse-text p-6 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-lg">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FileText className="h-12 w-12 text-blue-400" />
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

        {/* 1. Geltungsbereich */}
        <div className="pulse-card p-6">
          <h2 className="text-2xl font-bold pulse-title mb-4 flex items-center gap-3">
            <Scale className="h-6 w-6 text-blue-400" />
            1. Geltungsbereich
          </h2>
          <div className="space-y-3 pulse-text-secondary">
            <p>Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für die Nutzung der PulseManager Community Edition, einer Webanwendung zur Portfolio-Verwaltung und Steuerreport-Generierung für PulseChain-Assets.</p>
            <p><strong>Anbieter:</strong> PulseManager Community Edition</p>
            <p><strong>Zweck:</strong> Portfolio-Tracking und Steuerreport-Generierung für PulseChain-Assets</p>
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
              <h3 className="text-lg font-semibold pulse-text mb-2">💼 Portfolio-Management</h3>
              <ul className="space-y-1 pulse-text-secondary">
                <li>• Anzeige von Wallet-Balances und Token-Holdings</li>
                <li>• Portfolio-Wertberechnung in Echtzeit</li>
                <li>• Transaktionshistorie und Performance-Tracking</li>
                <li>• ROI-Berechnung und Performance-Analyse</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold pulse-text mb-2">📊 Steuerreport-Generierung</h3>
              <ul className="space-y-1 pulse-text-secondary">
                <li>• Automatische Erstellung von Steuerreports</li>
                <li>• FIFO-Berechnung nach deutschem Steuerrecht</li>
                <li>• PDF-Export für Steuerberater</li>
                <li>• DSGVO-konforme Datenverarbeitung</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold pulse-text mb-2">🔗 Externe Integrationen</h3>
              <ul className="space-y-1 pulse-text-secondary">
                <li>• PulseX DEX-Integration</li>
                <li>• PulseChain Bridge-Verbindung</li>
                <li>• WGEP Token-Tracking</li>
                <li>• Moralis API für Blockchain-Daten</li>
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
          <div className="space-y-3 pulse-text-secondary">
            <p>• <strong>Registrierung:</strong> Nutzung erfordert eine gültige E-Mail-Adresse und ein sicheres Passwort</p>
            <p>• <strong>Wallet-Adressen:</strong> Nur öffentliche Wallet-Adressen dürfen eingegeben werden</p>
            <p>• <strong>Verboten:</strong> Eingabe von privaten Schlüsseln oder Seed-Phrasen</p>
            <p>• <strong>Fair Use:</strong> Keine missbräuchliche Nutzung der API-Limits</p>
            <p>• <strong>Rechtmäßigkeit:</strong> Nur für legale Zwecke und im Einklang mit geltendem Recht</p>
          </div>
        </div>

        {/* 4. Haftungsausschluss */}
        <div className="pulse-card p-6 border-l-4 border-red-400">
          <h2 className="text-2xl font-bold pulse-title mb-4 flex items-center gap-3">
            <Shield className="h-6 w-6 text-red-400" />
            4. Haftungsausschluss
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold pulse-text mb-2">🚫 Keine Steuerberatung</h3>
              <p className="pulse-text-secondary">
                PulseManager bietet <strong>keine steuerliche Beratung</strong>. Alle generierten Berichte dienen ausschließlich als Hilfsmittel und ersetzen nicht die Konsultation eines qualifizierten Steuerberaters. Die Nutzer sind verpflichtet, alle Daten vor der Verwendung für steuerliche Zwecke von einem Steuerberater prüfen zu lassen.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold pulse-text mb-2">🚫 Keine Anlageberatung</h3>
              <p className="pulse-text-secondary">
                Wir sind <strong>nicht am Kauf oder Verkauf von Tokens beteiligt</strong> und bieten keine Anlageberatung. Alle Investment-Entscheidungen liegen ausschließlich in der Verantwortung der Nutzer.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold pulse-text mb-2">🚫 Keine Haftung für externe Dienste</h3>
              <p className="pulse-text-secondary">
                Wir übernehmen <strong>keine Verantwortung</strong> für externe Dienste wie PulseX, PulseChain Bridge, WGEP oder andere verlinkte Plattformen. Die Nutzung dieser Dienste erfolgt auf eigene Gefahr.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold pulse-text mb-2">🚫 Keine Garantie für Datenrichtigkeit</h3>
              <p className="pulse-text-secondary">
                Wir können <strong>keine Garantie</strong> für die Richtigkeit, Vollständigkeit oder Aktualität der durch externe APIs (Moralis, CoinGecko, etc.) gelieferten Daten geben. Alle Wallet-Daten sind unverbindlich und müssen verifiziert werden.
              </p>
            </div>
          </div>
        </div>

        {/* 5. Datenschutz */}
        <div className="pulse-card p-6">
          <h2 className="text-2xl font-bold pulse-title mb-4 flex items-center gap-3">
            <Lock className="h-6 w-6 text-blue-400" />
            5. Datenschutz
          </h2>
          <div className="space-y-3 pulse-text-secondary">
            <p>• <strong>DSGVO-Konformität:</strong> Alle Datenverarbeitungen erfolgen nach DSGVO-Standards</p>
            <p>• <strong>Keine Wallet-Speicherung:</strong> Wallet-Adressen werden nicht dauerhaft gespeichert</p>
            <p>• <strong>Verschlüsselung:</strong> Alle Datenübertragungen sind SSL/TLS-verschlüsselt</p>
            <p>• <strong>Minimale Datenerhebung:</strong> Nur notwendige Daten werden verarbeitet</p>
            <p>• <strong>Benutzerrechte:</strong> Volle DSGVO-Rechte (Auskunft, Löschung, etc.)</p>
          </div>
        </div>

        {/* 6. Geistiges Eigentum */}
        <div className="pulse-card p-6">
          <h2 className="text-2xl font-bold pulse-title mb-4 flex items-center gap-3">
            <FileText className="h-6 w-6 text-orange-400" />
            6. Geistiges Eigentum
          </h2>
          <div className="space-y-3 pulse-text-secondary">
            <p>• <strong>Urheberrecht:</strong> Alle Inhalte und Funktionen sind urheberrechtlich geschützt</p>
            <p>• <strong>Lizenz:</strong> Nutzung nur für persönliche, nicht-kommerzielle Zwecke</p>
            <p>• <strong>Verboten:</strong> Reverse Engineering, Kopieren oder Weiterverbreitung</p>
            <p>• <strong>Open Source:</strong> Einige Komponenten basieren auf Open-Source-Lizenzen</p>
          </div>
        </div>

        {/* 7. Kündigung */}
        <div className="pulse-card p-6">
          <h2 className="text-2xl font-bold pulse-title mb-4 flex items-center gap-3">
            <Users className="h-6 w-6 text-red-400" />
            7. Kündigung und Beendigung
          </h2>
          <div className="space-y-3 pulse-text-secondary">
            <p>• <strong>Jederzeit kündbar:</strong> Nutzer können ihren Account jederzeit löschen</p>
            <p>• <strong>Verstoß gegen AGB:</strong> Bei Verstoß gegen diese Bedingungen kann der Zugang gesperrt werden</p>
            <p>• <strong>Datenlöschung:</strong> Bei Kündigung werden alle persönlichen Daten gelöscht</p>
            <p>• <strong>Keine Rückerstattung:</strong> Bei kostenpflichtigen Features keine Rückerstattung bei Kündigung</p>
          </div>
        </div>

        {/* 8. Schlussbestimmungen */}
        <div className="pulse-card p-6">
          <h2 className="text-2xl font-bold pulse-title mb-4 flex items-center gap-3">
            <Scale className="h-6 w-6 text-purple-400" />
            8. Schlussbestimmungen
          </h2>
          <div className="space-y-3 pulse-text-secondary">
            <p>• <strong>Deutsches Recht:</strong> Diese AGB unterliegen deutschem Recht</p>
            <p>• <strong>Gerichtsstand:</strong> Gerichtsstand ist der Sitz des Anbieters</p>
            <p>• <strong>Änderungen:</strong> Diese AGB können jederzeit geändert werden</p>
            <p>• <strong>Teilunwirksamkeit:</strong> Bei Teilunwirksamkeit bleiben andere Teile gültig</p>
            <p>• <strong>Kontakt:</strong> Bei Fragen kontaktieren Sie uns über die App-Funktionen</p>
          </div>
        </div>

        {/* Kontakt */}
        <div className="pulse-card p-6">
          <h2 className="text-2xl font-bold pulse-title mb-4 flex items-center gap-3">
            <Mail className="h-6 w-6 text-green-400" />
            Kontakt
          </h2>
          <div className="space-y-3 pulse-text-secondary">
            <p>Bei Fragen zu diesen AGB kontaktieren Sie uns über die App-Funktionen.</p>
            <p><strong>Letzte Aktualisierung:</strong> {new Date().toLocaleDateString('de-DE')}</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TermsOfServiceView;
