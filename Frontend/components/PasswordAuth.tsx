'use client';

import { useState } from 'react';
import Image from "next/image";   // ✅ added
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { atmApi } from '@/lib/api';

interface PasswordAuthProps {
  onAuthenticated: (role: string, userName: string) => void;
}

export function PasswordAuth({ onAuthenticated }: PasswordAuthProps) {
  const [formData, setFormData] = useState({
    userId: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await atmApi.login(formData.userId, formData.password);
      onAuthenticated(res.role, res.user_name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/95 backdrop-blur">
        <CardHeader className="text-center space-y-4">
          
          {/* ✅ Replaced credit-card icon with RupeeWave logo */}
          <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center bg-transparent">
            <Image
              src="/branding/logo-symbol-dark.png"
              width={70}
              height={70}
              alt="RupeeWave Logo"
              className="opacity-90"
            />
          </div>

          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              RupeeWave Login
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Enter your User ID and Password to access RupeeWave services
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="UserID">User ID</Label>
              <Input
                id="UserID"
                type="text"
                value={formData.userId}
                onChange={handleChange('userId')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={handleChange('password')}
                required
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-blue-900 hover:bg-blue-800"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Login to ATM'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
