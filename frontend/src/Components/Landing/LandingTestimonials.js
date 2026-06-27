import React from 'react';
import { Quote, Star } from 'lucide-react';

const LandingTestimonials = () => {
  return (
    <section className="py-24 bg-navy-900 text-white relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 right-0 p-12 opacity-10">
        <Quote className="w-64 h-64 text-white" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">What our students say</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Testimonial 1 */}
          <div className="bg-navy-800 p-8 rounded-2xl border border-navy-700">
            <div className="flex text-coral mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
            </div>
            <p className="text-lg text-slate-200 mb-6 italic">
              "The courses are incredible. I needed advanced Rust skills for my software engineering job, and within 3 months I was leading complex projects confidently."
            </p>
            <div className="flex items-center gap-4">
              <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="User" className="w-12 h-12 rounded-full border-2 border-navy-700" />
              <div>
                <h4 className="font-medium text-white">Carlos M.</h4>
                <span className="text-sm text-slate-400">Software Developer, Brazil</span>
              </div>
            </div>
          </div>

          {/* Testimonial 2 */}
          <div className="bg-navy-800 p-8 rounded-2xl border border-navy-700">
            <div className="flex text-coral mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
            </div>
            <p className="text-lg text-slate-200 mb-6 italic">
              "I was overwhelmed by microservices, but the hands-on labs and expert validation made me feel safe. Now I'm architecting global systems!"
            </p>
            <div className="flex items-center gap-4">
              <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="User" className="w-12 h-12 rounded-full border-2 border-navy-700" />
              <div>
                <h4 className="font-medium text-white">Yuki T.</h4>
                <span className="text-sm text-slate-400">Systems Architect, Japan</span>
              </div>
            </div>
          </div>

          {/* Testimonial 3 */}
          <div className="bg-navy-800 p-8 rounded-2xl border border-navy-700">
            <div className="flex text-coral mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
            </div>
            <p className="text-lg text-slate-200 mb-6 italic">
              "SkillForge's Data Science course helped me secure a promotion. The hands-on SQL and optimization models were exactly what I needed."
            </p>
            <div className="flex items-center gap-4">
              <img src="https://randomuser.me/api/portraits/women/68.jpg" alt="User" className="w-12 h-12 rounded-full border-2 border-navy-700" />
              <div>
                <h4 className="font-medium text-white">Sarah L.</h4>
                <span className="text-sm text-slate-400">Data Engineer, Germany</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingTestimonials;
