'use client';

import { useState } from 'react';
import Image from "next/image";   // <— added for logo support
import { CreateAccount } from './CreateAccount';
import { CreateUser } from './createUser';
import { TransactionForm } from './TransactionForm';
import { UpdateInfo } from './UpdateInfo';
import { TransferForm } from './TransferForm';
import { EnquiryForm } from './EnquiryForm';
import { ChangePinForm } from './ChangePinForm';
import { TransactionHistory } from './TransactionHistory';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { API_BASE_URL } from '@/lib/config';

import {
  UserPlus,
  Shield,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowRightLeft,
  Settings,
  Users,
  Search,
  KeyRound,
  History,
  LogOut
} from 'lucide-react';

type ActiveTab =
  | 'overview'
  | 'create-account'
  | 'create-user'
  | 'deposit'
  | 'withdraw'
  | 'transfer'
  | 'update'
  | 'enquiry'
  | 'changepin'
  | 'history';

interface DashboardProps {
  role?: string;
  userName?: string;
  onLogout?: () => void;
}

export function ATMDashboard({ role, userName, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {}

    if (onLogout) onLogout();
  };

  const menuItems = [
    ...(role === 'admin'
      ? [
          {
            id: 'create-user' as const,
            label: 'Create User',
            icon: Shield,
            color: 'bg-pink-500 hover:bg-pink-600',
            description: 'Create new system user'
          },
        ]
      : []),

    ...(role !== 'customer' ? [{
      id: 'create-account' as const,
      label: 'Create Account',
      icon: UserPlus,
      color: 'bg-emerald-500 hover:bg-emerald-600',
      description: 'Register new account holder'
    }] : []),

    {
      id: 'deposit' as const,
      label: 'Deposit Money',
      icon: ArrowDownCircle,
      color: 'bg-emerald-500 hover:bg-emerald-600',
      description: 'Add funds to account'
    },
    {
      id: 'withdraw' as const,
      label: 'Withdraw Money',
      icon: ArrowUpCircle,
      color: 'bg-red-500 hover:bg-red-600',
      description: 'Withdraw funds from account'
    },
    {
      id: 'transfer' as const,
      label: 'Transfer Money',
      icon: ArrowRightLeft,
      color: 'bg-purple-500 hover:bg-purple-600',
      description: 'Transfer between accounts'
    },
    {
      id: 'update' as const,
      label: 'Update Info',
      icon: Settings,
      color: 'bg-blue-500 hover:bg-blue-600',
      description: 'Update mobile or email'
    },
    {
      id: 'enquiry' as const,
      label: 'Balance Enquiry',
      icon: Search,
      color: 'bg-indigo-500 hover:bg-indigo-600',
      description: 'Check account balance'
    },
    {
      id: 'changepin' as const,
      label: 'Change PIN',
      icon: KeyRound,
      color: 'bg-orange-500 hover:bg-orange-600',
      description: 'Update account PIN'
    },
    {
      id: 'history' as const,
      label: 'Transaction History',
      icon: History,
      color: 'bg-slate-500 hover:bg-slate-600',
      description: 'View transaction history'
    }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'create-user':
        if (role !== 'admin') return <div className="p-6 text-red-600 font-semibold">Access Denied</div>;
        return <CreateUser />;

      case 'create-account':
        return <CreateAccount />;

      case 'deposit':
        return <TransactionForm type="deposit" />;

      case 'withdraw':
        return <TransactionForm type="withdraw" />;

      case 'transfer':
        return <TransferForm />;

      case 'update':
        return <UpdateInfo />;

      case 'enquiry':
        return <EnquiryForm />;

      case 'changepin':
        return <ChangePinForm />;

      case 'history':
        return <TransactionHistory />;

      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Card
                  key={item.id}
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 border-0 bg-white hover:scale-[1.02]"
                  onClick={() => setActiveTab(item.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-lg ${item.color} flex items-center justify-center`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900">{item.label}</h3>
                        <p className="text-sm text-gray-600">{item.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* LEFT HEADER (Logo + Title) */}
            <div className="flex items-center space-x-4">
              <Image
                src="/branding/logo-symbol-dark.png"
                width={40}
                height={40}
                alt="RupeeWave Logo"
                className="rounded-md"
              />

              <div>
                <h1 className="text-xl font-bold text-gray-900">RupeeWave</h1>
                <p className="text-sm text-gray-600">Secure Banking System</p>
              </div>
            </div>

            {/* RIGHT HEADER (Auth + Logout) */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-emerald-500" />
                <span className="text-sm text-gray-600">
                  Authenticated ({role}) - {userName}
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </Button>
            </div>

          </div>
        </div>
      </div>

      {/* Navigation */}
      {activeTab !== 'overview' && (
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-1 h-12">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('overview')}
                className="text-blue-600 hover:text-blue-800"
              >
                ← Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' ? (
          <div className="space-y-8">

            {/* Welcome Section */}
            <div className="text-center space-y-4">
              <div className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                <Users className="h-10 w-10 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">
                  Welcome to RupeeWave
                </h2>
                <p className="text-lg text-gray-600 mt-2">
                  Manage accounts, process transactions, and update customer information
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h3>
              {renderContent()}
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">{renderContent()}</div>
        )}
      </div>
    </div>
  );
}
