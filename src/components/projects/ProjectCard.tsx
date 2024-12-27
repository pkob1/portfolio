import React from 'react';
import { ExternalLink, BookOpen, Github, FileText, LucideIcon } from 'lucide-react';

interface ProjectLinks {
  github?: string;
  demo?: string;
  PDF?: string;
}

interface Project {
  title: string;
  description: string;
  type: string;
  image: string;
  links?: ProjectLinks;
  icon?: LucideIcon;
}

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const Icon = project.icon || BookOpen;

  return (
    <div className="bg-gray-50 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
      <img src={project.image} alt={project.title} className="w-full h-48 object-cover" />
      <div className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <Icon size={20} className="text-blue-600" />
          <span className="text-sm font-medium text-blue-600">{project.type}</span>
        </div>
        <h3 className="text-xl font-semibold mb-2">{project.title}</h3>
        <p className="text-gray-600 mb-4">{project.description}</p>
        {project.links && (
          <div className="flex gap-4">
            {project.links.github && (
              <a
                href={project.links.github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <Github size={20} />
                <span>Code</span>
              </a>
            )}
            {project.links.demo && (
              <a
                href={project.links.demo}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <ExternalLink size={20} />
                <span>Live Demo</span>
              </a>
            )}
            {project.links.PDF && (
              <a
                href={project.links.PDF}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <FileText size={20} />
                <span>Paper</span>
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}