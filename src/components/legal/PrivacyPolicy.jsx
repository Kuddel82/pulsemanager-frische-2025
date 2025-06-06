import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

function PrivacyPolicy() {
  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Datenschutzerklärung</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-4">1. Verantwortlicher</h2>
          <p>
            [Ihr Unternehmen]<br />
            [Adresse]<br />
            E-Mail: [E-Mail-Adresse]<br />
            Telefon: [Telefonnummer]
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">2. Erhebung und Verarbeitung personenbezogener Daten</h2>
          <p>
            2.1 Bei der Nutzung unserer Plattform erheben wir folgende personenbezogene Daten:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Name und E-Mail-Adresse bei der Registrierung</li>
            <li>Wallet-Adressen und Transaktionsdaten</li>
            <li>Nutzungsdaten der Plattform</li>
            <li>Zahlungsinformationen (PayPal)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">3. Zweck der Datenverarbeitung</h2>
          <p>
            3.1 Die Verarbeitung Ihrer Daten erfolgt zu folgenden Zwecken:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Bereitstellung und Verwaltung Ihres Nutzerkontos</li>
            <li>Durchführung des Abonnements und der Zahlungsabwicklung</li>
            <li>Analyse und Verbesserung unserer Dienstleistungen</li>
            <li>Erfüllung gesetzlicher Verpflichtungen</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">4. Rechtsgrundlagen</h2>
          <p>
            Die Verarbeitung Ihrer Daten erfolgt auf folgenden Rechtsgrundlagen:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Einwilligung (Art. 6 Abs. 1 lit. a DSGVO)</li>
            <li>Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO)</li>
            <li>Gesetzliche Verpflichtungen (Art. 6 Abs. 1 lit. c DSGVO)</li>
            <li>Berechtigte Interessen (Art. 6 Abs. 1 lit. f DSGVO)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">5. Datenspeicherung und -löschung</h2>
          <p>
            5.1 Ihre Daten werden nur so lange gespeichert, wie es für die genannten Zwecke erforderlich ist.
          </p>
          <p>
            5.2 Nach Beendigung des Nutzungsverhältnisses werden Ihre Daten nach Ablauf der gesetzlichen 
            Aufbewahrungsfristen gelöscht.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">6. Datensicherheit</h2>
          <p>
            Wir setzen technische und organisatorische Sicherheitsmaßnahmen ein, um Ihre Daten gegen 
            Manipulation, Verlust oder unberechtigten Zugriff zu schützen.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">7. Ihre Rechte</h2>
          <p>
            Sie haben folgende Rechte:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Recht auf Auskunft (Art. 15 DSGVO)</li>
            <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
            <li>Recht auf Löschung (Art. 17 DSGVO)</li>
            <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
            <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
            <li>Widerspruchsrecht (Art. 21 DSGVO)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">8. Cookies und Tracking</h2>
          <p>
            Wir verwenden Cookies und ähnliche Technologien, um die Nutzung unserer Plattform zu 
            verbessern. Sie können die Verwendung von Cookies in Ihren Browsereinstellungen 
            deaktivieren.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">9. Änderungen der Datenschutzerklärung</h2>
          <p>
            Wir behalten uns vor, diese Datenschutzerklärung anzupassen. Die aktuelle Version ist 
            stets auf unserer Plattform verfügbar.
          </p>
        </section>

        <div className="text-sm text-muted-foreground mt-8">
          <p>Stand: {new Date().toLocaleDateString()}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default PrivacyPolicy; 