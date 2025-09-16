import React from "react";
import { FileText, Upload, Users, TrendingUp } from "lucide-react";

export default function Home() {
  const stats = [
    {
      title: 'Total Templates',
      value: '24',
      change: '+12%',
      changeType: 'positive',
      icon: FileText,
      color: 'bg-blue-500',
    },
    {
      title: 'Uploads Today',
      value: '8',
      change: '+23%',
      changeType: 'positive',
      icon: Upload,
      color: 'bg-green-500',
    },
    {
      title: 'Active Users',
      value: '156',
      change: '+5%',
      changeType: 'positive',
      icon: Users,
      color: 'bg-purple-500',
    },
    {
      title: 'Success Rate',
      value: '98.5%',
      change: '+2.1%',
      changeType: 'positive',
      icon: TrendingUp,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome back!</h2>
        <p className="text-gray-600">Here's what's happening with your notary business today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`${stat.color} rounded-lg p-3`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <div className="flex items-center">
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                    <span className={`ml-2 text-sm font-medium ${
                      stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Templates */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Templates</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[
                { name: 'Employment Contract', uploaded: '2 hours ago', status: 'Active' },
                { name: 'NDA Template', uploaded: '5 hours ago', status: 'Active' },
                { name: 'Lease Agreement', uploaded: '1 day ago', status: 'Active' },
              ].map((template, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{template.name}</p>
                      <p className="text-sm text-gray-500">{template.uploaded}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {template.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <button className="w-full flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                <Upload className="w-5 h-5 text-blue-600" />
                <span className="ml-3 text-sm font-medium text-blue-900">Upload New Template</span>
              </button>
              <button className="w-full flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                <FileText className="w-5 h-5 text-green-600" />
                <span className="ml-3 text-sm font-medium text-green-900">View All Templates</span>
              </button>
              <button className="w-full flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                <Users className="w-5 h-5 text-purple-600" />
                <span className="ml-3 text-sm font-medium text-purple-900">Manage Users</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
