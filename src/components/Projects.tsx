import React from 'react';
import { ExternalLink, BookOpen, Github, Brain, Shield } from 'lucide-react';
import Section from './ui/Section';
import { ProjectCard } from './projects/ProjectCard';

const projects = [
  {
    title: "Enhancing Usability of LLMs for Fake News Detection",
    description: "Evaluated five LLMs using the TruthSeeker dataset to identify usability gaps in fake news detection. Proposed improvements to enhance performance, input flexibility, and real-world applicability.",
    type: "Research",
    image: "https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?auto=format&fit=crop&w=800&q=80",
    icon: BookOpen
  },
  {
    title: "Evaluating Video Gaming Privacy Policies",
    description: "Analyzed privacy policies of major gaming companies, highlighting gaps in transparency and user rights. Recommended improvements for compliance with OECD privacy principles and future automation using NLP.",
    type: "Research",
    image: "https://images.unsplash.com/photo-1556438064-2d7646166914?auto=format&fit=crop&w=800&q=80",
    icon: BookOpen
  },
  {
    title: "Critical Infrastructure Security",
    description: "Research on penetration testing and exploit development perspectives for critical infrastructure security, providing insights into improving security measures.",
    type: "Research",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80",
    links: {
      PDF: "https://arxiv.org/pdf/2407.17256"
    }
  },
  {
    title: "Phishing URL Detection",
    description: "Developed machine learning models (Random Forest, Naive Bayes) to detect phishing URLs, enhancing organizational cybersecurity strategies.",
    type: "Technical Project",
    image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80",
    links: {
      github: "https://github.com/pkob1/AI_ML_Phishing_Detection.git"
    }
  }
];

export default function Projects() {
  return (
    <Section id="projects" className="bg-white">
      <h2 className="text-4xl font-bold text-center mb-16">Projects & Research</h2>
      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {projects.map((project, index) => (
          <ProjectCard key={index} project={project} />
        ))}
      </div>
    </Section>
  );
}