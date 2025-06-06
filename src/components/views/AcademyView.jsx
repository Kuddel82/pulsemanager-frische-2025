import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Search, ChevronsRight, Youtube, FileText, CreditCard, PlayCircle, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; 
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAppContext } from '@/contexts/AppContext';

const courses = [
  {
    id: 1,
    title: 'Einführung in PulseChain',
    description: 'Lernen Sie die Grundlagen der PulseChain-Blockchain und ihre einzigartigen Features kennen.',
    videoUrl: 'https://www.youtube.com/embed/VIDEO_ID_1',
    duration: '45 Minuten',
    level: 'Anfänger'
  },
  {
    id: 2,
    title: 'Richard Heart & Die Vision',
    description: 'Tauchen Sie ein in die Vision von Richard Heart und die Zukunft der PulseChain.',
    videoUrl: 'https://www.youtube.com/embed/VIDEO_ID_2',
    duration: '60 Minuten',
    level: 'Alle Level'
  },
  {
    id: 3,
    title: 'Finvesta & Jesus Escobar',
    description: 'Erfahren Sie mehr über Finvesta und die Rolle von Jesus Escobar im PulseChain-Ökosystem.',
    videoUrl: 'https://www.youtube.com/embed/VIDEO_ID_3',
    duration: '30 Minuten',
    level: 'Fortgeschritten'
  },
  {
    id: 4,
    title: 'ROI Token & Tresore',
    description: 'Tiefgehende Analyse der ROI Token und der Tresor-Funktionalitäten.',
    videoUrl: 'https://www.youtube.com/embed/VIDEO_ID_4',
    duration: '90 Minuten',
    level: 'Fortgeschritten'
  }
];

const communityHighlights = [
  {
    title: 'PulseChain Community',
    description: 'Die größte und aktivste Community im Krypto-Space',
    icon: Users
  },
  {
    title: 'Entwickler-Ökosystem',
    description: 'Ein wachsendes Netzwerk von Entwicklern und Projekten',
    icon: BookOpen
  },
  {
    title: 'Bildungsressourcen',
    description: 'Umfangreiche Lernmaterialien und Tutorials',
    icon: PlayCircle
  }
];

const AcademyView = () => {
  const { language, translations } = useAppContext();
  const t = translations[language] || translations['en'];

  const academySections = [
    { 
      id: "basics", 
      titleKey: "academySectionPulseChainBasics", 
      iconComponent: BookOpen, 
      content: [
        { type: "article", titleKey: "academyPulseChainIntroTitle", descriptionKey: "academyPulseChainIntroContent" },
        { type: "video", titleKey: "academyPulseChainWalletsTitle", descriptionKey: "academyPulseChainWalletsContent", videoUrl: "https://www.youtube.com/embed/f8gLg_W2g1E" }, 
      ]
    },
    { 
      id: "defi", 
      titleKey: "academySectionDeFiIntro", 
      iconComponent: BookOpen, // Placeholder, replace with specific DeFi icon if available
      content: [
        { type: "article", titleKey: "academyDeFiWhatIsTitle", descriptionKey: "academyDeFiWhatIsContent" },
        { type: "article", titleKey: "academyDeFiRisksTitle", descriptionKey: "academyDeFiRisksContent" },
        { type: "video", titleKey: "academyDeFiVideoTitle", descriptionKey: "academyDeFiVideoContent", videoUrl: "https://www.youtube.com/embed/k9rR0gZ1u3A" }, 
      ]
    },
    { 
      id: "tangem", 
      titleKey: "academySectionTangemTitle", 
      iconComponent: CreditCard,
      content: [
        { type: "article", titleKey: "academyTangemIntroTitle", descriptionKey: "academyTangemIntroContent" },
        { type: "video", titleKey: "academyTangemVideoSetupTitle", descriptionKey: "academyTangemVideoSetupContent", videoUrl: "https://www.youtube.com/embed/TjOj4N0oOqQ" }, 
      ]
    },
    { 
      id: "security", 
      titleKey: "academySectionSecurity", 
      iconComponent: BookOpen, // Placeholder
      content: [
        { type: "article", titleKey: "academySecurityBestPracticesTitle", descriptionKey: "academySecurityBestPracticesContent" },
        { type: "article", titleKey: "academySecurityScamsTitle", descriptionKey: "academySecurityScamsContent" },
        { type: "video", titleKey: "academySecurityVideoTitle", descriptionKey: "academySecurityVideoContent", videoUrl: "https://www.youtube.com/embed/HhX_HYy9bH8" }, 
      ]
    },
    { 
      id: "advanced", 
      titleKey: "academySectionAdvanced", 
      iconComponent: BookOpen, // Placeholder
      content: [
        { type: "article", titleKey: "academyAdvancedYieldFarmingTitle", descriptionKey: "academyAdvancedYieldFarmingContent" },
        { type: "video", titleKey: "academyAdvancedBridgeTitle", descriptionKey: "academyAdvancedBridgeContent", videoUrl: "https://www.youtube.com/embed/J4mk3j0qjV4" }, 
      ]
    },
  ];

  const hasContent = academySections.some(section => t[section.titleKey]);
  if (!hasContent) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Demo: Akademie</h2>
        <p className="mb-4">Die Akademie-Inhalte sind aktuell nicht verfügbar. Bitte prüfe die Übersetzungsdateien oder lade die Seite neu.</p>
        <div className="bg-background/70 dark:bg-slate-700/50 p-6 rounded shadow inline-block">
          <h3 className="font-semibold mb-2">Beispiel-Kurs: PulseChain Basics</h3>
          <p>Was ist PulseChain? Wie funktioniert DeFi? Lerne die Grundlagen in interaktiven Kursen und Videos.</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="h-full flex flex-col"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div className="flex items-center mb-4 sm:mb-0">
          <BookOpen className="h-8 w-8 text-primary mr-3" />
          <h1 className="text-3xl font-bold gradient-text">{t.learningAcademyViewTitle || "Learning Academy"}</h1>
        </div>
        <div className="flex items-center w-full sm:w-auto max-w-sm">
          <Input type="search" placeholder={t.learningAcademySearchPlaceholder || "Search articles..."} className="mr-2" />
          <Button variant="outline" size="icon"><Search className="h-4 w-4" /></Button>
        </div>
      </div>

      <p className="text-lg text-foreground/80 mb-8">
        {t.learningAcademyViewDescription || "Expand your knowledge with our curated resources."}
      </p>

      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold tracking-tight">PulseChain Akademie</h2>
        </div>

        {/* Community Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {communityHighlights.map((highlight, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <highlight.icon className="h-6 w-6 text-primary" />
                  <CardTitle className="text-xl">{highlight.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{highlight.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Kursliste */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((course) => (
            <Card key={course.id}>
              <CardHeader>
                <CardTitle>{course.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{course.description}</p>
                <div className="aspect-video">
                  <iframe
                    src={course.videoUrl}
                    title={course.title}
                    className="w-full h-full rounded-lg"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>{course.duration}</span>
                  <span>{course.level}</span>
                </div>
                <Button className="w-full">Kurs starten</Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Zusätzliche Ressourcen */}
        <Card>
          <CardHeader>
            <CardTitle>Zusätzliche Ressourcen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Offizielle Dokumentation</h3>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>PulseChain Whitepaper</li>
                  <li>Technische Dokumentation</li>
                  <li>API-Referenz</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Community-Ressourcen</h3>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Community-Foren</li>
                  <li>Discord-Server</li>
                  <li>Telegram-Gruppen</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default AcademyView;
