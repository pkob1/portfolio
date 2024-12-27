import React from 'react';

const experiences = [
  {
    title: "Information Security Analyst",
    company: "Margins Group",
    period: "Sep 2022 - Nov 2023",
    achievements: [
      "Conducted security incident investigations using Microsoft Sentinel, reducing response time by 80%",
      "Aligned IT systems with ISO 27001 and ISO 22301 standards",
      "Reduced non-compliant devices by 66% through endpoint security initiatives",
      "Decreased phishing incidents by 14% through security awareness training",
    ]
  },
  {
    title: "Summer Intern",
    company: "Perfect Business Services Limited",
    period: "Jun 2021 - Sep 2021",
    achievements: [
      "Supported network administration for secure computing environments",
      "Enhanced file-sharing protocols within Active Directory, improving efficiency by 20%",
    ]
  }
];

export default function Experience() {
  return (
    <section id="experience" className="py-20 bg-gray-50">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-16">Professional Experience</h2>
        <div className="max-w-4xl mx-auto space-y-12">
          {experiences.map((exp, index) => (
            <div key={index} className="bg-white p-8 rounded-lg shadow-lg">
              <div className="flex flex-wrap justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{exp.title}</h3>
                  <p className="text-lg text-blue-600">{exp.company}</p>
                </div>
                <span className="text-gray-500">{exp.period}</span>
              </div>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                {exp.achievements.map((achievement, i) => (
                  <li key={i}>{achievement}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}