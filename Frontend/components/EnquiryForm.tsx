'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { atmApi } from '@/lib/api';

export function EnquiryForm() {

const [formData, setFormData] = useState({
acc_no: '',
pin: '',
});

const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState('');
const [balance, setBalance] = useState('');

const handleSubmit = async (e: React.FormEvent) => {

e.preventDefault();

setIsLoading(true);
setError('');
setBalance('');

try {

  const enquiryData = {
    acc_no: formData.acc_no.trim(),
    pin: formData.pin.trim(),
  };

  // FIXED TYPE
  const result = await atmApi.enquiry(enquiryData) as { balance: string };

  // FIXED FIELD
  setBalance(result.balance);

  setFormData({ acc_no: '', pin: '' });

} catch (err) {

  setError(
    err instanceof Error
      ? err.message
      : 'Balance enquiry failed'
  );

} finally {

  setIsLoading(false);

}


};

const handleChange =
(field: keyof typeof formData) =>
(e: React.ChangeEvent<HTMLInputElement>) => {

  setFormData(prev => ({
    ...prev,
    [field]: e.target.value
  }));

};


return (
<Card className="shadow-lg border-0 bg-white">

  <CardHeader className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-t-lg">

    <div className="flex items-center space-x-3">

      <Search className="h-6 w-6" />

      <div>
        <CardTitle className="text-xl">
          Balance Enquiry
        </CardTitle>

        <CardDescription className="text-indigo-100">
          Check your current account balance
        </CardDescription>
      </div>

    </div>

  </CardHeader>


  <CardContent className="p-6">

    <form onSubmit={handleSubmit} className="space-y-4">

      <div className="space-y-2">

        <Label htmlFor="account" className="text-sm font-medium">
          Account Number
        </Label>

        <Input
          id="account"
          type="text"
          value={formData.acc_no}
          onChange={handleChange('acc_no')}
          placeholder="e.g., AC1001"
          required
        />

      </div>


      <div className="space-y-2">

        <Label htmlFor="pin" className="text-sm font-medium">
          4-Digit PIN
        </Label>

        <Input
          id="pin"
          type="password"
          value={formData.pin}
          onChange={handleChange('pin')}
          placeholder="••••"
          maxLength={4}
          pattern="[0-9]{4}"
          required
        />

      </div>


      {error && (

        <Alert variant="destructive">

          <AlertCircle className="h-4 w-4" />

          <AlertDescription>
            {error}
          </AlertDescription>

        </Alert>

      )}


      {balance && (

        <Alert className="border-indigo-200 bg-indigo-50 text-indigo-800">

          <CheckCircle2 className="h-4 w-4 text-indigo-600" />

          <AlertDescription className="font-medium text-lg">
            {balance}
          </AlertDescription>

        </Alert>

      )}


      <Button
        type="submit"
        className="w-full bg-indigo-600 hover:bg-indigo-700"
        disabled={isLoading}
      >

        {isLoading
          ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking Balance...
            </>
          )
          : 'Check Balance'}

      </Button>

    </form>

  </CardContent>

</Card>


);
}
