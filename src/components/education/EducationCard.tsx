import React from 'react';
import { GraduationCap, Calendar } from 'lucide-react';

interface Education {
  degree: string;
  school: string;
  period: string;
  location: string;
  details: string[];
}

interface EducationCardProps {
  education: Education;
}

export function EducationCard({ education }: EducationCardProps) {
  return (
    <div className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-blue-100 rounded-full">
          <GraduationCap className="w-6 h-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-gray-900">{education.degree}</h3>
          <div className="flex items-center gap-2 mt-2 text-blue-600">
            <span className="font-medium">{education.school}</span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>{education.period}</span>
            <span>•</span>
            <span>{education.location}</span>
          </div>
          <ul className="mt-4 space-y-2">
            {education.details.map((detail, i) => (
              <li key={i} className="text-gray-600">• {detail}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}