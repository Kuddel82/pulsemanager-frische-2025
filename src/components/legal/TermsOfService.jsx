import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

function TermsOfService() {
  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Allgemeine Geschäftsbedingungen</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-4">1. Geltungsbereich</h2>
          <p>
            Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für die Nutzung der Webseite PulseManager.vip 
            (nachfolgend "Plattform" genannt) und die damit verbundenen Dienstleistungen. Anbieter ist 
            [Ihr Unternehmen] (nachfolgend "Anbieter" genannt).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">2. Leistungsbeschreibung</h2>
          <p>
            Die Plattform bietet Tools und Services für die Verwaltung und Analyse von Kryptowährungen, 
            insbesondere im Zusammenhang mit der PulseChain-Blockchain. Die Nutzung der Plattform erfordert 
            eine Registrierung und ist nach einer 3-tägigen Testphase kostenpflichtig.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">3. Registrierung und Nutzung</h2>
          <p>
            3.1 Die Nutzung der Plattform erfordert eine Registrierung. Der Nutzer verpflichtet sich, 
            wahrheitsgemäße Angaben zu machen und diese aktuell zu halten.
          </p>
          <p>
            3.2 Nach der Registrierung erhält der Nutzer einen 3-tägigen kostenlosen Testzugang.
          </p>
          <p>
            3.3 Nach Ablauf der Testphase ist für die weitere Nutzung ein kostenpflichtiges Abonnement 
            erforderlich.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">4. Abonnement und Zahlungsbedingungen</h2>
          <p>
            4.1 Das Abonnement kostet 9,90 € pro Monat und wird über PayPal abgerechnet.
          </p>
          <p>
            4.2 Die Zahlung erfolgt im Voraus für den jeweiligen Abrechnungszeitraum.
          </p>
          <p>
            4.3 Das Abonnement verlängert sich automatisch um einen weiteren Monat, wenn es nicht 
            spätestens 24 Stunden vor Ablauf der aktuellen Abrechnungsperiode gekündigt wird.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">5. Kündigung</h2>
          <p>
            5.1 Das Abonnement kann jederzeit mit einer Frist von 24 Stunden zum Ende der 
            Abrechnungsperiode gekündigt werden.
          </p>
          <p>
            5.2 Der Anbieter behält sich das Recht vor, das Abonnement bei Verstoß gegen diese AGB 
            fristlos zu kündigen.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">6. Haftung</h2>
          <p>
            6.1 Der Anbieter haftet unbeschränkt für Schäden aus der Verletzung des Lebens, des Körpers 
            oder der Gesundheit.
          </p>
          <p>
            6.2 Für sonstige Schäden haftet der Anbieter nur bei Vorsatz oder grober Fahrlässigkeit.
          </p>
          <p>
            6.3 Die Haftung für die Verfügbarkeit und Funktionalität der Plattform ist auf Vorsatz und 
            grobe Fahrlässigkeit beschränkt.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">7. Datenschutz</h2>
          <p>
            Die Erhebung und Verarbeitung personenbezogener Daten erfolgt gemäß unserer 
            Datenschutzerklärung und den geltenden Datenschutzgesetzen.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">8. Änderungen der AGB</h2>
          <p>
            Der Anbieter behält sich vor, diese AGB jederzeit zu ändern. Die Nutzer werden über 
            Änderungen rechtzeitig informiert.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">9. Schlussbestimmungen</h2>
          <p>
            9.1 Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.
          </p>
          <p>
            9.2 Sollten einzelne Bestimmungen dieser AGB unwirksam sein, bleibt die Wirksamkeit der 
            übrigen Bestimmungen unberührt.
          </p>
        </section>

        <div className="text-sm text-muted-foreground mt-8">
          <p>Stand: {new Date().toLocaleDateString()}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default TermsOfService; 