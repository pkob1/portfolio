import React from 'react';
import { Shield, Linkedin, Mail, ChevronDown } from 'lucide-react';
import Container from './layout/Container';

export default function Hero() {
  return (
    <section className="min-h-screen flex flex-col justify-center relative bg-gradient-to-br from-slate-900 to-blue-900 text-white">
      <Container className="py-24">
        <div className="max-w-4xl">
          <div className="flex items-center gap-4 mb-6">
            <Shield className="w-12 h-12 text-blue-400" />
            <h2 className="text-2xl font-semibold">Cybersecurity Professional</h2>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-8">
            PAPA KOBINA
            <br />
            <span className="text-blue-400">ORLEANS-BOSOMTWE</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-12">
            Protecting digital assets through expert security analysis and compliance management
          </p>
          <div className="flex gap-6">
            <a 
              href="#contact" 
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              Get in Touch
            </a>
            <div className="flex gap-4">
              <a 
                href="https://www.linkedin.com/in/papakobosomtwe/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-3 hover:text-blue-400 transition-colors"
              >
                <Linkedin size={24} />
              </a>
              <a 
                href="mailto:papa.orleans-bosomtwe@outlook.com" 
                className="p-3 hover:text-blue-400 transition-colors"
              >
                <Mail size={24} />
              </a>
            </div>
          </div>
        </div>
      </Container>
      <a 
        href="#about" 
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce"
      >
        <ChevronDown size={32} className="text-blue-400" />
      </a>
    </section>
  );
}