import React from 'react';
import { Shield, Eye, Lock, Database, Users, FileText, AlertTriangle } from 'lucide-react';

const PrivacyPolicyView = () => {
  return (
    <div 
      className="min-h-screen w-full max-w-4xl mx-auto p-6 sm:p-8 md:p-10 rounded-2xl shadow-2xl"
      style={{
        background: 'linear-gradient(145deg, rgba(18, 18, 27, 0.95), rgba(40, 25, 60, 0.95))',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        margin: '2rem auto'
      }}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">Datenschutzerklärung</h1>
        <p className="mt-4 text-purple-300">Zuletzt aktualisiert: 15. Juni 2024</p>
      </div>

      <div className="space-y-6 text-gray-300">
        
        {/* Einleitung */}
        <div className="p-6 rounded-lg bg-black bg-opacity-20">
          <h2 className="text-2xl font-semibold text-white mb-3">1. Einleitung und Geltungsbereich</h2>
          <p>
            Diese Datenschutzerklärung klärt Sie über die Art, den Umfang und Zweck der Verarbeitung von personenbezogenen Daten (nachfolgend "Daten") innerhalb unseres Onlineangebotes PulseManager (nachfolgend "Webseite", "Service") und der mit ihr verbundenen Funktionen und Inhalte auf. Wir nehmen den Schutz Ihrer persönlichen Daten sehr ernst und behandeln Ihre personenbezogenen Daten vertraulich und entsprechend der gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.
          </p>
        </div>

        {/* Keine Speicherung sensibler Daten */}
        <div className="p-6 rounded-lg bg-black bg-opacity-20">
          <h2 className="text-2xl font-semibold text-white mb-3">2. Grundsatz: Keine Speicherung kritischer Daten</h2>
          <p>
            <strong>Wir speichern keine Wallet-Adressen, privaten Schlüssel oder andere kritische Blockchain-bezogene Daten in unserer Datenbank.</strong> Die von Ihnen eingegebenen Wallet-Adressen werden ausschließlich zur Laufzeit für API-Abfragen bei Moralis verwendet und danach sofort verworfen. Es findet keine dauerhafte Verknüpfung zwischen Ihrer E-Mail-Adresse und Ihren Wallet-Adressen auf unseren Servern statt.
          </p>
        </div>

        {/* Welche Daten wir erheben */}
        <div className="p-6 rounded-lg bg-black bg-opacity-20">
          <h2 className="text-2xl font-semibold text-white mb-3">3. Daten, die wir verarbeiten</h2>
          <ul className="list-disc list-inside space-y-2 pl-4">
            <li><strong>Kontaktdaten:</strong> E-Mail-Adresse und Passwort (gehasht) bei der Registrierung.</li>
            <li><strong>Nutzungsdaten:</strong> Aufgerufene Webseiten, Zugriffszeiten, Klickverhalten (anonymisiert zur Verbesserung des Dienstes).</li>
            <li><strong>Metadaten:</strong> Geräte-Informationen, IP-Adressen (ausschließlich zur Gefahrenabwehr und für maximal 7 Tage).</li>
            <li><strong>Transaktionsdaten (temporär):</strong> Für die Dauer der Sitzung und zur Erstellung des Steuerreports werden Transaktionsdaten über die Moralis-API abgerufen. Diese werden NICHT dauerhaft gespeichert.</li>
          </ul>
        </div>

        {/* Zweck der Datenverarbeitung */}
        <div className="p-6 rounded-lg bg-black bg-opacity-20">
          <h2 className="text-2xl font-semibold text-white mb-3">4. Zweck der Verarbeitung</h2>
          <p>
            Die Verarbeitung Ihrer Daten erfolgt ausschließlich zu folgenden Zwecken:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-4 mt-2">
            <li>Zurverfügungstellung des Onlineangebotes, seiner Funktionen und Inhalte.</li>
            <li>Beantwortung von Kontaktanfragen und Kommunikation mit Nutzern.</li>
            <li>Sicherheitsmaßnahmen zur Abwehr von Angriffen und zur Sicherstellung der Systemstabilität.</li>
            <li>Erstellung von anonymisierten Nutzungsstatistiken zur Optimierung unseres Angebots.</li>
            <li>Abwicklung von Premium-Mitgliedschaften.</li>
          </ul>
        </div>
        
        {/* Datensicherheit */}
        <div className="p-6 rounded-lg bg-black bg-opacity-20 border border-yellow-500/50">
            <h2 className="text-2xl font-semibold text-white mb-3">5. Datensicherheit und externe APIs</h2>
            <p>
                Wir setzen technische und organisatorische Sicherheitsmaßnahmen ein, um Ihre durch uns verwalteten Daten gegen zufällige oder vorsätzliche Manipulationen, Verlust, Zerstörung oder gegen den Zugriff unberechtigter Personen zu schützen. Unsere Webseite nutzt zur Abfrage von Blockchain-Daten die API von Moralis. Wir übermitteln hierfür die von Ihnen eingegebene Wallet-Adresse. Wir haben keinen Einfluss darauf, wie Moralis diese Daten verarbeitet. Bitte beachten Sie die Datenschutzerklärung von Moralis.
            </p>
        </div>

        {/* Haftungsausschluss */}
        <div className="p-6 rounded-lg bg-red-900 bg-opacity-40 border border-red-500/50">
          <h2 className="text-2xl font-semibold text-white mb-3">6. Wichtiger Haftungsausschluss</h2>
          <p>
            Die über PulseManager generierten Berichte stellen <strong>keine Steuerberatung</strong> dar und ersetzen nicht die Konsultation eines qualifizierten Steuerberaters. Die bereitgestellten Daten dienen lediglich als Hilfsmittel. Wir übernehmen keine Haftung für die Richtigkeit, Vollständigkeit oder Aktualität der durch externe APIs (z.B. Moralis, CoinGecko) gelieferten Daten und die daraus resultierenden steuerlichen Berechnungen. Die Nutzung des Dienstes erfolgt auf eigene Gefahr.
          </p>
        </div>

      </div>
    </div>
  );
};

export default PrivacyPolicyView;
