import React from 'react';
import { Mail, MapPin } from 'lucide-react';

export default function Contact() {
  return (
    <section id="contact" className="py-20 bg-gray-50">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-16">Get in Touch</h2>
        <div className="max-w-2xl mx-auto">
          <div className="grid gap-8">
            <a href="mailto:papa.orleans-bosomtwe@outlook.com" 
               className="flex items-center gap-4 p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <Mail className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="font-semibold">Email</h3>
                <p className="text-gray-600">papa.orleans-bosomtwe@outlook.com</p>
              </div>
            </a>
            <div className="flex items-center gap-4 p-6 bg-white rounded-lg shadow-md">
              <MapPin className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="font-semibold">Location</h3>
                <p className="text-gray-600">Ontario, Canada</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}