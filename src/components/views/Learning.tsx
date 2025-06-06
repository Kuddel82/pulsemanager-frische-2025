import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from 'react-i18next';
import { useCourses } from '@/lib/CourseProvider';
import { Clock, Star, Users, GraduationCap, TrendingUp, Shield, Coins, Crown, ArrowRight, BookOpen } from 'lucide-react';

export const Learning: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { courses, enrollCourse, unenrollCourse } = useCourses();

  const enrolledCourses = courses.filter(course => course.enrolled);
  const availableCourses = courses.filter(course => !course.enrolled);

  return (
    <div className="max-w-6xl mx-auto px-8 py-10">
      {/* Lernfortschritt */}
      <Card className="p-6 mb-8">
        <div className="flex items-center gap-4 mb-2">
          <BookOpen className="h-6 w-6 text-blue-400" />
          <span className="font-semibold text-white">Ihr Lernfortschritt</span>
        </div>
        <p className="text-foreground mb-4">Abgeschlossene Kurse</p>
        <Progress value={60} />
      </Card>
      {/* Kurse */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Kurs 1 */}
        <Card className="p-4 flex flex-col">
          <div className="bg-[#23263a] rounded-lg h-32 flex items-center justify-center mb-4">
            <span className="text-4xl text-foreground">▶</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Blockchain Grundlagen</h3>
          <p className="text-foreground text-sm mb-2">Lernen Sie die Grundprinzipien der Blockchain-Technologie und wie sie funktioniert.</p>
          <div className="flex items-center text-xs text-foreground mb-2 gap-4">
            <span>2 Stunden</span>
            <span>•</span>
            <span>Anfänger</span>
          </div>
          <Progress value={100} className="mb-3" />
          <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg">Jetzt starten</Button>
        </Card>
        {/* Kurs 2 */}
        <Card className="p-4 flex flex-col">
          <div className="bg-[#23263a] rounded-lg h-32 flex items-center justify-center mb-4">
            <span className="text-4xl text-foreground">▶</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-1">DeFi Einführung</h3>
          <p className="text-foreground text-sm mb-2">Entdecken Sie die Welt der dezentralen Finanzen und wie Sie davon profitieren können.</p>
          <div className="flex items-center text-xs text-foreground mb-2 gap-4">
            <span>3 Stunden</span>
            <span>•</span>
            <span>Fortgeschritten</span>
          </div>
          <Progress value={60} className="mb-3" />
          <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg">Jetzt starten</Button>
        </Card>
        {/* Kurs 3 */}
        <Card className="p-4 flex flex-col">
          <div className="bg-[#23263a] rounded-lg h-32 flex items-center justify-center mb-4">
            <span className="text-4xl text-foreground">▶</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-1">NFTs verstehen</h3>
          <p className="text-foreground text-sm mb-2">Alles über NFTs, ihre Bedeutung und wie Sie in sie investieren können.</p>
          <div className="flex items-center text-xs text-foreground mb-2 gap-4">
            <span>2.5 Stunden</span>
            <span>•</span>
            <span>Mittel</span>
          </div>
          <Progress value={30} className="mb-3" />
          <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg">Jetzt starten</Button>
        </Card>
      </div>
    </div>
  );
}; 