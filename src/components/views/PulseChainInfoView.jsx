import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { ArrowRight, Users, Heart, Shield, TrendingUp } from 'lucide-react';

const sections = [
  {
    title: 'Die PulseChain Community',
    description: 'Die PulseChain Community ist eine der stärksten und engagiertesten Communities im Krypto-Space. Mit über einer Million aktiver Mitglieder weltweit, die sich für die Vision von Richard Heart begeistern, bildet sie das Fundament für den Erfolg des Ökosystems.',
    icon: Users,
    features: [
      'Weltweite Präsenz in über 100 Ländern',
      'Aktive Entwickler-Community',
      'Regelmäßige Community-Events und Meetups',
      'Starke Social Media Präsenz'
    ]
  },
  {
    title: 'Richard Heart & Die Vision',
    description: 'Richard Heart, der visionäre Gründer von PulseChain, hat ein einzigartiges Ökosystem geschaffen, das auf Effizienz, Sicherheit und Benutzerfreundlichkeit basiert. Seine Vision einer dezentralisierten Finanzwelt hat Millionen von Menschen inspiriert.',
    icon: Heart,
    features: [
      'Revolutionäre Blockchain-Technologie',
      'Fokus auf Benutzerfreundlichkeit',
      'Nachhaltiges Tokenomics-Modell',
      'Langfristige Entwicklungsstrategie'
    ]
  },
  {
    title: 'Finvesta & Jesus Escobar',
    description: 'Finvesta, unter der Leitung von Jesus Escobar, spielt eine zentrale Rolle im PulseChain-Ökosystem. Als einer der wichtigsten Partner bringt Finvesta Expertise in Finanzdienstleistungen und Blockchain-Technologie ein.',
    icon: Shield,
    features: [
      'Professionelles Finanzmanagement',
      'Innovative DeFi-Lösungen',
      'Sichere Asset-Verwaltung',
      'Strategische Partnerschaften'
    ]
  },
  {
    title: 'ROI Token & Tresore',
    description: 'Die ROI Token und das Tresor-System sind einzigartige Innovationen im PulseChain-Ökosystem. Sie bieten neue Möglichkeiten für Asset-Management und Sicherheit in der dezentralisierten Finanzwelt.',
    icon: TrendingUp,
    features: [
      'Automatisierte ROI-Berechnung',
      'Sichere Tresor-Lösungen',
      'Transparente Transaktionen',
      'Innovative Staking-Mechanismen'
    ]
  }
];

export function PulseChainInfoView() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Was ist PulseChain?</h2>
      </div>

      {/* Einführung */}
      <Card>
        <CardHeader>
          <CardTitle>Die Revolutionäre Blockchain</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            PulseChain ist eine revolutionäre Blockchain-Plattform, die von Richard Heart entwickelt wurde. 
            Sie bietet eine effizientere, schnellere und kostengünstigere Alternative zu Ethereum, 
            mit besonderem Fokus auf Benutzerfreundlichkeit und Skalierbarkeit.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-primary/5 rounded-lg">
              <h3 className="font-semibold mb-2">Schnell</h3>
              <p className="text-sm text-muted-foreground">
                Transaktionen in Sekunden statt Minuten
              </p>
            </div>
            <div className="p-4 bg-primary/5 rounded-lg">
              <h3 className="font-semibold mb-2">Günstig</h3>
              <p className="text-sm text-muted-foreground">
                Minimale Transaktionsgebühren
              </p>
            </div>
            <div className="p-4 bg-primary/5 rounded-lg">
              <h3 className="font-semibold mb-2">Sicher</h3>
              <p className="text-sm text-muted-foreground">
                Fortschrittliche Sicherheitsfeatures
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hauptsektionen */}
      {sections.map((section, index) => (
        <Card key={index}>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <section.icon className="h-6 w-6 text-primary" />
              <CardTitle>{section.title}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{section.description}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {section.features.map((feature, featureIndex) => (
                <div key={featureIndex} className="flex items-start space-x-2">
                  <ArrowRight className="h-5 w-5 text-primary mt-0.5" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Call to Action */}
      <Card className="bg-primary/5">
        <CardContent className="py-8 text-center space-y-4">
          <h3 className="text-xl font-semibold">Bereit für PulseChain?</h3>
          <p className="text-muted-foreground">
            Entdecken Sie die Möglichkeiten der PulseChain und werden Sie Teil der Community.
          </p>
          <div className="flex justify-center space-x-4">
            <Button>Mehr erfahren</Button>
            <Button variant="outline">Community beitreten</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PulseChainInfoView;
