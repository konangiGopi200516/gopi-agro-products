import React, { useEffect, useState } from 'react';
import { Users, MapPin, Star, Phone, Activity } from 'lucide-react';
import { API_BASE } from '../services/api';

const MeetFarmers = () => {
  const [farmers, setFarmers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/farmers`)
      .then(res => res.json())
      .then(data => {
        setFarmers(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface)]">
        <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 animate-fade-up">
          <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--color-text-primary)] mb-4 font-display">
            Meet Our Farmers
          </h1>
          <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
            Discover the hardworking people who grow the fresh, high-quality produce you enjoy every day.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {farmers.filter(f => f.status !== 'Inactive').map((farmer, idx) => (
            <div key={farmer.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-300 animate-fade-up" style={{ animationDelay: `${idx * 100}ms` }}>
              <div className="h-48 overflow-hidden">
                <img 
                  src={farmer.image || 'https://images.unsplash.com/photo-1595841696677-6489ff3f8cd1?auto=format&fit=crop&w=500'} 
                  alt={farmer.name} 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{farmer.name}</h3>
                    <p className="text-sm font-medium text-[#2D6A4F] mt-1">{farmer.field}</p>
                  </div>
                  <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-lg">
                    <Star className="text-yellow-400 w-4 h-4 mr-1 fill-current" />
                    <span className="font-bold text-sm text-yellow-700">{farmer.rating}</span>
                  </div>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                    {farmer.location}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Activity className="w-4 h-4 mr-2 text-gray-400" />
                    {farmer.experience} Experience
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                    {farmer.phone}
                  </div>
                </div>

                <button className="w-full py-2.5 bg-[#2D6A4F]/10 text-[#2D6A4F] font-semibold rounded-xl hover:bg-[#2D6A4F] hover:text-white transition-colors duration-300">
                  View Products
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MeetFarmers;
