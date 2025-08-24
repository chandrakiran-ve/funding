'use client';

import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { ArrowRight, BarChart3, Brain, Shield, Users, TrendingUp, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-cyan-400/10 to-blue-600/10 rounded-full blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-4 sm:p-6 lg:px-8">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-base sm:text-lg">VE</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent truncate">
              Vision Empower Trust
            </div>
            <div className="text-xs sm:text-sm text-slate-600 hidden sm:block">Fundraising Intelligence Platform</div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4">
          <SignInButton mode="modal">
            <Button variant="ghost" className="text-slate-700 hover:text-blue-600 hover:bg-blue-50 text-sm sm:text-base px-2 sm:px-4">
              Sign In
            </Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base px-3 sm:px-4">
              <span className="hidden sm:inline">Request Access</span>
              <span className="sm:hidden">Access</span>
              <ArrowRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </SignUpButton>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-16 sm:pb-24">
        <div className="text-center">
          <div className="inline-flex items-center px-3 sm:px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-blue-200/50 shadow-sm mb-6 sm:mb-8">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            <span className="text-xs sm:text-sm font-medium text-slate-700">Internal Platform - Vision Empower Trust</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-slate-900 mb-4 sm:mb-6 leading-tight px-2">
            <span className="block">Fundraising Intelligence</span>
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent block">
              Management System
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-slate-600 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed px-4">
            Comprehensive platform for Vision Empower Trust team members to manage fundraising operations, 
            track contributions, analyze donor data, and optimize campaign performance.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12 sm:mb-16 px-4">
            <SignInButton mode="modal">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105">
                Access Dashboard
                <ArrowRight className="ml-2 h-4 sm:h-5 w-4 sm:w-5" />
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-slate-300 text-slate-700 hover:bg-slate-50 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg backdrop-blur-sm">
                Request Account
              </Button>
            </SignUpButton>
          </div>

          {/* Organization Info */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-8 shadow-lg border border-white/50 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8">
              <div className="text-center p-2">
                <div className="text-xl sm:text-2xl font-bold text-blue-600 mb-1 sm:mb-2">Team Access</div>
                <div className="text-sm sm:text-base text-slate-600">Authorized Personnel Only</div>
              </div>
              <div className="text-center p-2">
                <div className="text-xl sm:text-2xl font-bold text-indigo-600 mb-1 sm:mb-2">Secure Platform</div>
                <div className="text-sm sm:text-base text-slate-600">Enterprise-Grade Security</div>
              </div>
              <div className="text-center p-2">
                <div className="text-xl sm:text-2xl font-bold text-purple-600 mb-1 sm:mb-2">Real-Time Data</div>
                <div className="text-sm sm:text-base text-slate-600">Live Campaign Tracking</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 sm:mb-4 px-4">
            Platform Capabilities
          </h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto px-4">
            Comprehensive tools designed specifically for Vision Empower Trust's fundraising operations
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* AI Assistant */}
          <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 sm:hover:-translate-y-2 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-200">
                <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2 sm:mb-3">AI Assistant</h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Intelligent insights and recommendations to optimize fundraising strategies and identify high-potential prospects.
              </p>
            </CardContent>
          </Card>

          {/* Analytics Dashboard */}
          <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 sm:hover:-translate-y-2 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-200">
                <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2 sm:mb-3">Analytics & Reporting</h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Comprehensive dashboards and detailed reports to track campaign performance and donor engagement metrics.
              </p>
            </CardContent>
          </Card>

          {/* Donor Management */}
          <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 sm:hover:-translate-y-2 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-200">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2 sm:mb-3">Donor Management</h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Centralized donor database with relationship tracking, communication history, and engagement scoring.
              </p>
            </CardContent>
          </Card>

          {/* Campaign Tracking */}
          <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 sm:hover:-translate-y-2 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-200">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2 sm:mb-3">Campaign Tracking</h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Real-time monitoring of fundraising campaigns with goal tracking and performance indicators.
              </p>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 sm:hover:-translate-y-2 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-200">
                <Database className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2 sm:mb-3">Data Management</h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Secure data storage and management with automated backups and compliance with data protection regulations.
              </p>
            </CardContent>
          </Card>

          {/* Security & Access */}
          <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 sm:hover:-translate-y-2 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-200">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2 sm:mb-3">Security & Access Control</h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Role-based access control with multi-factor authentication and audit logging for all platform activities.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Access Information */}
      <div className="relative z-10 bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-700 py-12 sm:py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6">
            Access Your Dashboard
          </h2>
          <p className="text-base sm:text-lg text-blue-100 mb-8 sm:mb-10 max-w-2xl mx-auto">
            Vision Empower Trust team members can sign in to access the fundraising intelligence platform.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <SignInButton mode="modal">
              <Button size="lg" className="w-full sm:w-auto bg-white text-blue-700 hover:bg-blue-50 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105">
                Sign In to Platform
                <ArrowRight className="ml-2 h-4 sm:h-5 w-4 sm:w-5" />
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-white text-white hover:bg-white hover:text-blue-700 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold backdrop-blur-sm">
                Request New Account
              </Button>
            </SignUpButton>
          </div>
          
          <div className="mt-6 sm:mt-8 text-xs sm:text-sm text-blue-200">
            Need help accessing your account? Contact the IT administrator.
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 bg-slate-900 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-3 md:mb-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs sm:text-sm">VE</span>
              </div>
              <div>
                <div className="text-base sm:text-lg font-semibold text-white">Vision Empower Trust</div>
                <div className="text-xs text-slate-400">Internal Platform</div>
              </div>
            </div>
            <div className="text-slate-400 text-xs sm:text-sm text-center md:text-right">
              © 2024 Vision Empower Trust. Internal use only.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}