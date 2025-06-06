import React, { createContext, useContext, useState } from 'react';

interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  duration: string;
  level: string;
  rating: number;
  enrolled: boolean;
  progress: number;
  image: string;
  content?: {
    id: string;
    title: string;
    type: 'video' | 'text' | 'quiz';
    duration?: string;
    completed: boolean;
  }[];
}

interface CourseContextType {
  courses: Course[];
  enrollCourse: (courseId: string) => void;
  unenrollCourse: (courseId: string) => void;
  updateProgress: (courseId: string, contentId: string) => void;
  getCourse: (courseId: string) => Course | undefined;
}

const initialCourses: Course[] = [
  {
    id: '1',
    title: 'Kryptowährungen Grundlagen',
    description: 'Lerne die Grundlagen von Kryptowährungen und Blockchain-Technologie.',
    instructor: 'Dr. Max Mustermann',
    duration: '4 Wochen',
    level: 'Anfänger',
    rating: 4.8,
    enrolled: true,
    progress: 75,
    image: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    content: [
      {
        id: '1-1',
        title: 'Einführung in Kryptowährungen',
        type: 'video',
        duration: '15:00',
        completed: true
      },
      {
        id: '1-2',
        title: 'Was ist Blockchain?',
        type: 'text',
        completed: true
      },
      {
        id: '1-3',
        title: 'Grundlegende Konzepte',
        type: 'quiz',
        completed: false
      },
      {
        id: '1-4',
        title: 'Wallets und Sicherheit',
        type: 'video',
        duration: '20:00',
        completed: false
      }
    ]
  },
  {
    id: '2',
    title: 'DeFi Trading Strategien',
    description: 'Fortgeschrittene Trading-Strategien für DeFi-Protokolle.',
    instructor: 'Sarah Schmidt',
    duration: '6 Wochen',
    level: 'Fortgeschritten',
    rating: 4.9,
    enrolled: false,
    progress: 0,
    image: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    content: [
      {
        id: '2-1',
        title: 'DeFi Protokolle verstehen',
        type: 'video',
        duration: '20:00',
        completed: false
      },
      {
        id: '2-2',
        title: 'Liquidität und Yield Farming',
        type: 'text',
        completed: false
      },
      {
        id: '2-3',
        title: 'Risikomanagement',
        type: 'quiz',
        completed: false
      },
      {
        id: '2-4',
        title: 'Advanced Trading Strategien',
        type: 'video',
        duration: '25:00',
        completed: false
      }
    ]
  },
  {
    id: '3',
    title: 'NFTs und digitale Kunst',
    description: 'Verstehe die Welt der NFTs und wie du in digitale Kunst investieren kannst.',
    instructor: 'Michael Weber',
    duration: '3 Wochen',
    level: 'Mittel',
    rating: 4.7,
    enrolled: true,
    progress: 30,
    image: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    content: [
      {
        id: '3-1',
        title: 'NFTs erklärt',
        type: 'video',
        duration: '18:00',
        completed: true
      },
      {
        id: '3-2',
        title: 'Digitale Kunst verstehen',
        type: 'text',
        completed: false
      },
      {
        id: '3-3',
        title: 'NFT Marktplätze',
        type: 'quiz',
        completed: false
      },
      {
        id: '3-4',
        title: 'NFT Investment Strategien',
        type: 'video',
        duration: '22:00',
        completed: false
      }
    ]
  },
  {
    id: '4',
    title: 'Pulsechain: Die Zukunft des DeFi',
    description: 'Entdecke die Pulsechain, ihre Coins und wie du von den ROI-Druckern profitieren kannst.',
    instructor: 'Alex Schmidt',
    duration: '5 Wochen',
    level: 'Mittel',
    rating: 4.9,
    enrolled: false,
    progress: 0,
    image: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    content: [
      {
        id: '4-1',
        title: 'Einführung in Pulsechain',
        type: 'video',
        duration: '20:00',
        completed: false
      },
      {
        id: '4-2',
        title: 'Top Pulsechain Coins',
        type: 'text',
        completed: false
      },
      {
        id: '4-3',
        title: 'ROI-Drucker verstehen',
        type: 'video',
        duration: '25:00',
        completed: false
      },
      {
        id: '4-4',
        title: 'Pulsechain DeFi Protokolle',
        type: 'text',
        completed: false
      },
      {
        id: '4-5',
        title: 'Investment Strategien',
        type: 'video',
        duration: '30:00',
        completed: false
      },
      {
        id: '4-6',
        title: 'Risikomanagement und Sicherheit',
        type: 'quiz',
        completed: false
      }
    ]
  }
];

const CourseContext = createContext<CourseContextType | undefined>(undefined);

export function CourseProvider({ children }: { children: React.ReactNode }) {
  const [courses, setCourses] = useState<Course[]>(initialCourses);

  const enrollCourse = (courseId: string) => {
    setCourses(courses.map(course => 
      course.id === courseId 
        ? { ...course, enrolled: true }
        : course
    ));
  };

  const unenrollCourse = (courseId: string) => {
    setCourses(courses.map(course => 
      course.id === courseId 
        ? { ...course, enrolled: false, progress: 0 }
        : course
    ));
  };

  const updateProgress = (courseId: string, contentId: string) => {
    setCourses(courses.map(course => {
      if (course.id === courseId && course.content) {
        const updatedContent = course.content.map(item => 
          item.id === contentId ? { ...item, completed: true } : item
        );
        const completedCount = updatedContent.filter(item => item.completed).length;
        const progress = Math.round((completedCount / updatedContent.length) * 100);
        return { ...course, content: updatedContent, progress };
      }
      return course;
    }));
  };

  const getCourse = (courseId: string) => {
    return courses.find(course => course.id === courseId);
  };

  return (
    <CourseContext.Provider value={{ courses, enrollCourse, unenrollCourse, updateProgress, getCourse }}>
      {children}
    </CourseContext.Provider>
  );
}

export const useCourses = () => {
  const context = useContext(CourseContext);
  if (context === undefined) {
    throw new Error('useCourses must be used within a CourseProvider');
  }
  return context;
}; 