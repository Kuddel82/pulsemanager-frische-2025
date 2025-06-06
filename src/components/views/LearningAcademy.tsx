import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Book, GraduationCap, Award, ChevronRight, CheckCircle2, Coins, TrendingUp, Shield, Play, FileText, HelpCircle, XCircle, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';

interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'text' | 'quiz';
  content: string;
  videoId?: string;
  quiz?: {
    question: string;
    options: string[];
    correctAnswer: number;
  }[];
  completed: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string;
  duration: string;
  completed: boolean;
  lessons: Lesson[];
}

const DE_BLOCKCHAIN_VIDEO = 'qkR0b6l6S5k'; // Blockchain einfach erklärt (deutsch)

export const LearningAcademy: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [progress, setProgress] = useState(0);

  const calculateProgress = (course: Course) => {
    const completedLessons = course.lessons.filter(lesson => lesson.completed).length;
    return (completedLessons / course.lessons.length) * 100;
  };

  const handleLessonComplete = (courseId: string, lessonId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (course) {
      const lesson = course.lessons.find(l => l.id === lessonId);
      if (lesson) {
        lesson.completed = true;
        setProgress(calculateProgress(course));
      }
    }
    setSelectedLesson(null);
    setSelectedAnswers([]);
    setShowResults(false);
  };

  const handleQuizSubmit = () => {
    if (selectedLesson && selectedLesson.quiz) {
      const allCorrect = selectedLesson.quiz.every(
        (question, index) => selectedAnswers[index] === question.correctAnswer
      );
      setShowResults(true);
      if (allCorrect) {
        setTimeout(() => {
          handleLessonComplete(selectedCourse!.id, selectedLesson.id);
        }, 1200);
      }
    }
  };

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    if (showResults) return;
    setSelectedAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[questionIndex] = answerIndex;
      return newAnswers;
    });
  };

  const getCourseIcon = (courseId: string) => {
    switch (courseId) {
      case 'pulsechain-basics':
        return <Coins className="h-5 w-5 text-primary" />;
      case 'roi-tokens':
        return <TrendingUp className="h-5 w-5 text-primary" />;
      case 'ecosystem-projects':
        return <Shield className="h-5 w-5 text-primary" />;
      case 'trading-strategies':
        return <Book className="h-5 w-5 text-primary" />;
      default:
        return <Book className="h-5 w-5 text-primary" />;
    }
  };

  const courses: Course[] = [
    {
      id: 'pulsechain-basics',
      title: t('academy.courses.pulsechain-basics.title'),
      description: t('academy.courses.pulsechain-basics.description'),
      duration: t('academy.courses.pulsechain-basics.duration'),
      completed: false,
      lessons: [
        {
          id: 'video-pulsechain',
          title: t('academy.courses.pulsechain-basics.lessons.video-pulsechain.title'),
          type: 'video',
          content: t('academy.courses.pulsechain-basics.lessons.video-pulsechain.content'),
          videoId: 'a-T_r3Ax1g8',
          completed: false
        },
        {
          id: 'text-pulsechain',
          title: t('academy.courses.pulsechain-basics.lessons.text-pulsechain.title'),
          type: 'text',
          content: t('academy.courses.pulsechain-basics.lessons.text-pulsechain.content'),
          completed: false
        },
        {
          id: 'quiz-pulsechain',
          title: t('academy.courses.pulsechain-basics.lessons.quiz-pulsechain.title'),
          type: 'quiz',
          content: '',
          quiz: [
            {
              question: t('academy.courses.pulsechain-basics.lessons.quiz-pulsechain.questions.0.question'),
              options: [
                t('academy.courses.pulsechain-basics.lessons.quiz-pulsechain.questions.0.options.0'),
                t('academy.courses.pulsechain-basics.lessons.quiz-pulsechain.questions.0.options.1'),
                t('academy.courses.pulsechain-basics.lessons.quiz-pulsechain.questions.0.options.2')
              ],
              correctAnswer: 2
            },
            {
              question: t('academy.courses.pulsechain-basics.lessons.quiz-pulsechain.questions.1.question'),
              options: [
                t('academy.courses.pulsechain-basics.lessons.quiz-pulsechain.questions.1.options.0'),
                t('academy.courses.pulsechain-basics.lessons.quiz-pulsechain.questions.1.options.1'),
                t('academy.courses.pulsechain-basics.lessons.quiz-pulsechain.questions.1.options.2')
              ],
              correctAnswer: 1
            },
            {
              question: t('academy.courses.pulsechain-basics.lessons.quiz-pulsechain.questions.2.question'),
              options: [
                t('academy.courses.pulsechain-basics.lessons.quiz-pulsechain.questions.2.options.0'),
                t('academy.courses.pulsechain-basics.lessons.quiz-pulsechain.questions.2.options.1'),
                t('academy.courses.pulsechain-basics.lessons.quiz-pulsechain.questions.2.options.2')
              ],
              correctAnswer: 1
            },
            {
              question: t('academy.courses.pulsechain-basics.lessons.quiz-pulsechain.questions.3.question'),
              options: [
                t('academy.courses.pulsechain-basics.lessons.quiz-pulsechain.questions.3.options.0'),
                t('academy.courses.pulsechain-basics.lessons.quiz-pulsechain.questions.3.options.1'),
                t('academy.courses.pulsechain-basics.lessons.quiz-pulsechain.questions.3.options.2')
              ],
              correctAnswer: 1
            }
          ],
          completed: false
        }
      ]
    },
    {
      id: 'roi-tokens',
      title: t('academy.courses.roi-tokens.title'),
      description: t('academy.courses.roi-tokens.description'),
      duration: t('academy.courses.roi-tokens.duration'),
      completed: false,
      lessons: [
        {
          id: 'video-roi',
          title: t('academy.courses.roi-tokens.lessons.video-roi.title'),
          type: 'video',
          content: t('academy.courses.roi-tokens.lessons.video-roi.content'),
          videoId: 'LiDC_hVwzAw',
          completed: false
        },
        {
          id: 'text-roi',
          title: t('academy.courses.roi-tokens.lessons.text-roi.title'),
          type: 'text',
          content: t('academy.courses.roi-tokens.lessons.text-roi.content'),
          completed: false
        },
        {
          id: 'quiz-roi',
          title: t('academy.courses.roi-tokens.lessons.quiz-roi.title'),
          type: 'quiz',
          content: '',
          quiz: [
            {
              question: t('academy.courses.roi-tokens.lessons.quiz-roi.questions.0.question'),
              options: [
                t('academy.courses.roi-tokens.lessons.quiz-roi.questions.0.options.0'),
                t('academy.courses.roi-tokens.lessons.quiz-roi.questions.0.options.1'),
                t('academy.courses.roi-tokens.lessons.quiz-roi.questions.0.options.2')
              ],
              correctAnswer: 1
            },
            {
              question: t('academy.courses.roi-tokens.lessons.quiz-roi.questions.1.question'),
              options: [
                t('academy.courses.roi-tokens.lessons.quiz-roi.questions.1.options.0'),
                t('academy.courses.roi-tokens.lessons.quiz-roi.questions.1.options.1'),
                t('academy.courses.roi-tokens.lessons.quiz-roi.questions.1.options.2')
              ],
              correctAnswer: 0
            },
            {
              question: t('academy.courses.roi-tokens.lessons.quiz-roi.questions.2.question'),
              options: [
                t('academy.courses.roi-tokens.lessons.quiz-roi.questions.2.options.0'),
                t('academy.courses.roi-tokens.lessons.quiz-roi.questions.2.options.1'),
                t('academy.courses.roi-tokens.lessons.quiz-roi.questions.2.options.2')
              ],
              correctAnswer: 1
            },
            {
              question: t('academy.courses.roi-tokens.lessons.quiz-roi.questions.3.question'),
              options: [
                t('academy.courses.roi-tokens.lessons.quiz-roi.questions.3.options.0'),
                t('academy.courses.roi-tokens.lessons.quiz-roi.questions.3.options.1'),
                t('academy.courses.roi-tokens.lessons.quiz-roi.questions.3.options.2')
              ],
              correctAnswer: 0
            }
          ],
          completed: false
        }
      ]
    },
    {
      id: 'ecosystem-projects',
      title: t('academy.courses.ecosystem-projects.title'),
      description: t('academy.courses.ecosystem-projects.description'),
      duration: t('academy.courses.ecosystem-projects.duration'),
      completed: false,
      lessons: [
        {
          id: 'video-ecosystem',
          title: t('academy.courses.ecosystem-projects.lessons.video-ecosystem.title'),
          type: 'video',
          content: t('academy.courses.ecosystem-projects.lessons.video-ecosystem.content'),
          videoId: '1U5xiqvvy8I',
          completed: false
        },
        {
          id: 'text-ecosystem',
          title: t('academy.courses.ecosystem-projects.lessons.text-ecosystem.title'),
          type: 'text',
          content: t('academy.courses.ecosystem-projects.lessons.text-ecosystem.content'),
          completed: false
        },
        {
          id: 'quiz-ecosystem',
          title: t('academy.courses.ecosystem-projects.lessons.quiz-ecosystem.title'),
          type: 'quiz',
          content: '',
          quiz: [
            {
              question: t('academy.courses.ecosystem-projects.lessons.quiz-ecosystem.questions.0.question'),
              options: [
                t('academy.courses.ecosystem-projects.lessons.quiz-ecosystem.questions.0.options.0'),
                t('academy.courses.ecosystem-projects.lessons.quiz-ecosystem.questions.0.options.1'),
                t('academy.courses.ecosystem-projects.lessons.quiz-ecosystem.questions.0.options.2')
              ],
              correctAnswer: 1
            },
            {
              question: t('academy.courses.ecosystem-projects.lessons.quiz-ecosystem.questions.1.question'),
              options: [
                t('academy.courses.ecosystem-projects.lessons.quiz-ecosystem.questions.1.options.0'),
                t('academy.courses.ecosystem-projects.lessons.quiz-ecosystem.questions.1.options.1'),
                t('academy.courses.ecosystem-projects.lessons.quiz-ecosystem.questions.1.options.2')
              ],
              correctAnswer: 0
            },
            {
              question: t('academy.courses.ecosystem-projects.lessons.quiz-ecosystem.questions.2.question'),
              options: [
                t('academy.courses.ecosystem-projects.lessons.quiz-ecosystem.questions.2.options.0'),
                t('academy.courses.ecosystem-projects.lessons.quiz-ecosystem.questions.2.options.1'),
                t('academy.courses.ecosystem-projects.lessons.quiz-ecosystem.questions.2.options.2')
              ],
              correctAnswer: 1
            },
            {
              question: t('academy.courses.ecosystem-projects.lessons.quiz-ecosystem.questions.3.question'),
              options: [
                t('academy.courses.ecosystem-projects.lessons.quiz-ecosystem.questions.3.options.0'),
                t('academy.courses.ecosystem-projects.lessons.quiz-ecosystem.questions.3.options.1'),
                t('academy.courses.ecosystem-projects.lessons.quiz-ecosystem.questions.3.options.2')
              ],
              correctAnswer: 1
            }
          ],
          completed: false
        }
      ]
    },
    {
      id: 'trading-strategies',
      title: t('academy.courses.trading-strategies.title'),
      description: t('academy.courses.trading-strategies.description'),
      duration: t('academy.courses.trading-strategies.duration'),
      completed: false,
      lessons: [
        {
          id: 'video-trading',
          title: t('academy.courses.trading-strategies.lessons.video-trading.title'),
          type: 'video',
          content: t('academy.courses.trading-strategies.lessons.video-trading.content'),
          videoId: 'wAGXPr0anGg',
          completed: false
        },
        {
          id: 'text-trading',
          title: t('academy.courses.trading-strategies.lessons.text-trading.title'),
          type: 'text',
          content: t('academy.courses.trading-strategies.lessons.text-trading.content'),
          completed: false
        },
        {
          id: 'quiz-trading',
          title: t('academy.courses.trading-strategies.lessons.quiz-trading.title'),
          type: 'quiz',
          content: '',
          quiz: [
            {
              question: t('academy.courses.trading-strategies.lessons.quiz-trading.questions.0.question'),
              options: [
                t('academy.courses.trading-strategies.lessons.quiz-trading.questions.0.options.0'),
                t('academy.courses.trading-strategies.lessons.quiz-trading.questions.0.options.1'),
                t('academy.courses.trading-strategies.lessons.quiz-trading.questions.0.options.2')
              ],
              correctAnswer: 1
            },
            {
              question: t('academy.courses.trading-strategies.lessons.quiz-trading.questions.1.question'),
              options: [
                t('academy.courses.trading-strategies.lessons.quiz-trading.questions.1.options.0'),
                t('academy.courses.trading-strategies.lessons.quiz-trading.questions.1.options.1'),
                t('academy.courses.trading-strategies.lessons.quiz-trading.questions.1.options.2')
              ],
              correctAnswer: 1
            },
            {
              question: t('academy.courses.trading-strategies.lessons.quiz-trading.questions.2.question'),
              options: [
                t('academy.courses.trading-strategies.lessons.quiz-trading.questions.2.options.0'),
                t('academy.courses.trading-strategies.lessons.quiz-trading.questions.2.options.1'),
                t('academy.courses.trading-strategies.lessons.quiz-trading.questions.2.options.2')
              ],
              correctAnswer: 0
            },
            {
              question: t('academy.courses.trading-strategies.lessons.quiz-trading.questions.3.question'),
              options: [
                t('academy.courses.trading-strategies.lessons.quiz-trading.questions.3.options.0'),
                t('academy.courses.trading-strategies.lessons.quiz-trading.questions.3.options.1'),
                t('academy.courses.trading-strategies.lessons.quiz-trading.questions.3.options.2')
              ],
              correctAnswer: 1
            }
          ],
          completed: false
        }
      ]
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Tabs defaultValue="courses" className="space-y-6">
        <TabsList>
          <TabsTrigger value="courses">{t('academy.courses', 'Kurse')}</TabsTrigger>
          <TabsTrigger value="progress">{t('academy.progress', 'Fortschritt')}</TabsTrigger>
          <TabsTrigger value="certificates">{t('academy.certificates', 'Zertifikate')}</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(course => (
              <Card
                key={course.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => { setSelectedCourse(course); setSelectedLesson(null); }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getCourseIcon(course.id)}
                    {course.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{course.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {t('academy.duration', 'Dauer')}: {course.duration}
                    </span>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('academy.progress', 'Ihr Fortschritt')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {courses.map(course => (
                  <div key={course.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{course.title}</span>
                      <span className="text-sm text-muted-foreground">
                        {Math.round(calculateProgress(course))}%
                      </span>
                    </div>
                    <Progress value={calculateProgress(course)} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certificates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('academy.certificates', 'Ihre Zertifikate')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Award className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {t('academy.noCertificates', 'Sobald Sie einen Kurs abgeschlossen haben, erscheint hier Ihr Zertifikat.')}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedCourse && !selectedLesson && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{selectedCourse.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedCourse.lessons.map(lesson => (
                <div
                  key={lesson.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h3 className="font-medium">{lesson.title}</h3>
                    {lesson.type === 'text' ? (
                      <div className="prose dark:prose-invert max-w-none text-sm text-muted-foreground">
                        <ReactMarkdown>{lesson.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">{lesson.content}</p>
                    )}
                  </div>
                  <Button
                    variant={lesson.completed ? "outline" : "default"}
                    onClick={() => setSelectedLesson(lesson)}
                    className="flex items-center gap-2"
                  >
                    {lesson.completed ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Abgeschlossen
                      </>
                    ) : (
                      'Lektion starten'
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedLesson && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{selectedLesson.title}</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedLesson.type === 'video' && selectedLesson.videoId && (
              <div className="space-y-4">
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${selectedLesson.videoId}?modestbranding=1&rel=0`}
                    title={selectedLesson.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                    loading="lazy"
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => window.open(`https://www.youtube.com/watch?v=${selectedLesson.videoId}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Auf YouTube ansehen
                  </Button>
                </div>
                <div className="prose dark:prose-invert max-w-none">
                  <ReactMarkdown>
                    {selectedLesson.content}
                  </ReactMarkdown>
                </div>
                <Button 
                  className="w-full mt-4"
                  onClick={() => handleLessonComplete(selectedCourse.id, selectedLesson.id)}
                >
                  Lektion abschließen
                </Button>
              </div>
            )}
            {selectedLesson.type === 'text' && (
              <div className="space-y-4">
                <div className="prose dark:prose-invert max-w-none">
                  <ReactMarkdown>
                    {selectedLesson.content}
                  </ReactMarkdown>
                </div>
                <Button 
                  className="w-full mt-4"
                  onClick={() => handleLessonComplete(selectedCourse.id, selectedLesson.id)}
                >
                  Lektion abschließen
                </Button>
              </div>
            )}
            {selectedLesson.type === 'quiz' && selectedLesson.quiz && (
              <div className="space-y-6">
                {selectedLesson.quiz.map((question, index) => {
                  const isSelected = selectedAnswers[index] !== undefined;
                  const isCorrect = selectedAnswers[index] === question.correctAnswer;
                  const showCorrect = showResults && isCorrect;
                  const showIncorrect = showResults && isSelected && !isCorrect;
                  return (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle>Frage {index + 1}</CardTitle>
                        <div className="text-muted-foreground">{question.question}</div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {question.options.map((option, optionIndex) => (
                            <Button
                              key={optionIndex}
                              variant={selectedAnswers[index] === optionIndex ? "default" : "outline"}
                              className={`w-full justify-start ${showCorrect && optionIndex === question.correctAnswer ? 'bg-green-500 hover:bg-green-600' : ''} ${showIncorrect && optionIndex === selectedAnswers[index] ? 'bg-red-500 hover:bg-red-600' : ''}`}
                              onClick={() => handleAnswerSelect(index, optionIndex)}
                              disabled={showResults}
                            >
                              <div className="flex items-center gap-2">
                                {showCorrect && optionIndex === question.correctAnswer && <CheckCircle2 className="h-4 w-4" />}
                                {showIncorrect && optionIndex === selectedAnswers[index] && <XCircle className="h-4 w-4" />}
                                {option}
                              </div>
                            </Button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                <Button
                  className="w-full"
                  onClick={handleQuizSubmit}
                  disabled={selectedAnswers.length !== selectedLesson.quiz.length}
                >
                  Quiz abschließen
                </Button>
                {showResults && (
                  <div className="text-center mt-4">
                    {selectedLesson.quiz.every((q, i) => selectedAnswers[i] === q.correctAnswer)
                      ? <span className="text-green-500 font-bold">Alle Antworten richtig! 🎉</span>
                      : <span className="text-red-500 font-bold">Einige Antworten sind falsch. Bitte versuche es erneut.</span>
                    }
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 