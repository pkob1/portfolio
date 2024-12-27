import React from 'react';
import { GraduationCap, Calendar, Award } from 'lucide-react';
import Section from './ui/Section';
import { EducationCard } from './education/EducationCard';

const education = [
  {
    degree: "Master of Science in Cybersecurity and Threat Intelligence",
    school: "University of Guelph",
    period: "Jan 2024 - Dec 2024",
    location: "Ontario, CA",
    details: [
      "Relevant coursework: Privacy and Compliance, Threat Intelligence and Risk Analysis",
      "Cybersecurity Defense, Security Monitoring and Threat Hunting"
    ]
  },
  {
    degree: "Bachelor of Science in Management Information System",
    school: "Ashesi University",
    period: "Aug 2018 - May 2022",
    details: [
      "Dean's list (Jan 2020 - May 2022)",
      "Leadership: Revamped ASC media strategies as Public Relations Representative, increasing business fair participation by 30%"
    ]
  }
];

export default function Education() {
  return (
    <Section id="education" className="bg-gray-50">
      <h2 className="text-4xl font-bold text-center mb-16">Education</h2>
      <div className="max-w-4xl mx-auto space-y-8">
        {education.map((edu, index) => (
          <EducationCard key={index} education={edu} />
        ))}
      </div>
    </Section>
  );
}
