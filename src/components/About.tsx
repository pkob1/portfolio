import React from 'react';
import { Shield, BookLock, Target } from 'lucide-react';

export default function About() {
  return (
    <section id="about" className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-16">Areas of Expertise</h2>
        <div className="grid md:grid-cols-3 gap-12">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-4">Security Analysis</h3>
            <p className="text-gray-600">Specializing in IT security, risk management, and comprehensive threat analysis.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
              <BookLock className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-4">Compliance</h3>
            <p className="text-gray-600">Expert in ISO 27001 and ISO 22301 frameworks, ensuring regulatory alignment.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
              <Target className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-4">Risk Management</h3>
            <p className="text-gray-600">Strategic approach to identifying, assessing, and mitigating security risks.</p>
          </div>
        </div>
      </div>
    </section>
  );
}