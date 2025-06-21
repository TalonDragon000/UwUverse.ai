import React, { useState } from 'react';
import { Mail, MessageCircle, Phone, MapPin } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import { motion } from 'framer-motion';

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create mailto link with form data
    const mailtoLink = `mailto:support@uwuverse.ai?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
    )}`;
    
    window.location.href = mailtoLink;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const contactMethods = [
    {
      icon: <Mail className="h-8 w-8 text-pink-400" />,
      title: "Email Support",
      description: "Get help with your account, billing, or technical issues",
      contact: "support@uwuverse.ai",
      action: () => window.location.href = 'mailto:support@uwuverse.ai'
    },
    {
      icon: <MessageCircle className="h-8 w-8 text-blue-400" />,
      title: "General Inquiries",
      description: "Questions about our platform or partnership opportunities",
      contact: "hello@uwuverse.ai",
      action: () => window.location.href = 'mailto:hello@uwuverse.ai'
    },
    {
      icon: <Phone className="h-8 w-8 text-green-400" />,
      title: "Enterprise Sales",
      description: "Custom solutions for businesses and organizations",
      contact: "enterprise@uwuverse.ai",
      action: () => window.location.href = 'mailto:enterprise@uwuverse.ai?subject=Enterprise Inquiry'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-20 pb-10">
        {/* Hero Section */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent">
                Get in Touch
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                We're here to help! Reach out to us for support, questions, or just to say hello.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Contact Methods */}
        <section className="py-16 px-4 bg-gradient-to-b from-transparent to-pink-100/50 dark:to-pink-900/30">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {contactMethods.map((method, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  viewport={{ once: true }}
                  className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                  onClick={method.action}
                >
                  <div className="flex justify-center mb-4">
                    {method.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{method.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">{method.description}</p>
                  <p className="text-pink-600 dark:text-pink-400 font-medium">{method.contact}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Send us a Message
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Fill out the form below and we'll get back to you as soon as possible
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8"
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Your Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="uwu-input w-full"
                      placeholder="Enter your full name"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="uwu-input w-full"
                      placeholder="Enter your email address"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Subject
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="uwu-input w-full"
                  >
                    <option value="">Select a subject</option>
                    <option value="Technical Support">Technical Support</option>
                    <option value="Billing Question">Billing Question</option>
                    <option value="Feature Request">Feature Request</option>
                    <option value="Bug Report">Bug Report</option>
                    <option value="Enterprise Inquiry">Enterprise Inquiry</option>
                    <option value="Partnership">Partnership</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="uwu-input w-full"
                    placeholder="Tell us how we can help you..."
                  />
                </div>

                <div className="text-center">
                  <button
                    type="submit"
                    className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-pink-400 to-purple-500 hover:from-pink-500 hover:to-purple-600 text-white rounded-full font-medium transition-all duration-200 transform hover:scale-105"
                  >
                    <Mail className="h-5 w-5 mr-2" />
                    Send Message
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </section>

        {/* Additional Info */}
        <section className="py-16 px-4 bg-gradient-to-b from-pink-100/50 to-transparent dark:from-pink-900/30">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-r from-pink-50 to-lavender-50 dark:from-pink-900/20 dark:to-lavender-900/20 rounded-2xl p-8">
              <MapPin className="h-12 w-12 text-pink-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-4">Our Response Time</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                We typically respond to all inquiries within 24 hours during business days. 
                For urgent technical issues, please mark your subject as "Urgent" and we'll prioritize your request.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Business Hours: Monday - Friday, 9:00 AM - 6:00 PM PST
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ContactPage;