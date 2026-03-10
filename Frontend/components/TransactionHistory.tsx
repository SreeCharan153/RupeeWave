'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  History as HistoryIcon,
  Loader2,
  AlertCircle,
  ArrowUpCircle,
  ArrowDownCircle,
  ArrowRightLeft,
  Calendar,
  IndianRupee,
  RefreshCw
} from 'lucide-react';

import { atmApi } from '@/lib/api';


/* ---------------- TYPES ---------------- */

export interface HistoryEntry {
  id: number
  account_no: string
  action: string
  amount: number
  context?: string | null
  created_at: string
}

export type HistorySuccess = {
  history: HistoryEntry[]
}

export type HistoryError = {
  message?: string
  detail?: string
}

export type HistoryResponse = HistorySuccess | HistoryError


function isHistorySuccess(v: unknown): v is HistorySuccess {
  return (
    !!v &&
    typeof v === 'object' &&
    'history' in (v as any) &&
    Array.isArray((v as any).history)
  )
}


/* ---------------- HELPERS ---------------- */

function normalizeAction(raw: unknown): 'deposit' | 'withdraw' | 'transfer_in' | 'transfer_out' | 'other' {

  if (typeof raw !== 'string') return 'other'

  const s = raw.toLowerCase()

  if (s.includes('deposit')) return 'deposit'
  if (s.includes('withdraw')) return 'withdraw'
  if (s.includes('received')) return 'transfer_in'
  if (s.includes('transfer')) return 'transfer_out'

  return 'other'
}


export function TransactionHistory() {

  const [formData, setFormData] = useState({
    acc_no: '',
    pin: ''
  })

  const [isLoading, setIsLoading] = useState(false)

  const [error, setError] = useState('')

  const [transactions, setTransactions] = useState<HistoryEntry[]>([])


  /* ---------------- FETCH ---------------- */

  const fetchHistory = async () => {

    setIsLoading(true)
    setError('')

    try {

      const payload = {
        acc_no: formData.acc_no.trim(),
        pin: formData.pin.trim()
      }

      const result: unknown = await atmApi.history(payload)

      if (isHistorySuccess(result)) {

        setTransactions(result.history)

        if (result.history.length === 0) {
          setError('No transaction history found for this account.')
        }

      } else {

        const msg =
          (result as HistoryError)?.message ||
          (result as HistoryError)?.detail ||
          'Failed to fetch transaction history.'

        setError(msg)

      }

    } catch (err) {

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to fetch transaction history.'
      )

    } finally {
      setIsLoading(false)
    }

  }


  /* ---------------- HANDLERS ---------------- */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTransactions([])
    await fetchHistory()
  }

  const handleRefresh = async () => {
    await fetchHistory()
  }

  const handleChange =
    (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {

      setFormData(prev => ({
        ...prev,
        [field]: e.target.value
      }))

    }


  /* ---------------- UI HELPERS ---------------- */

  const getTransactionIcon = (actionRaw: unknown) => {

    const action = normalizeAction(actionRaw)

    switch (action) {
      case 'deposit':
        return <ArrowDownCircle className="h-4 w-4" />

      case 'withdraw':
        return <ArrowUpCircle className="h-4 w-4" />

      case 'transfer_in':
      case 'transfer_out':
        return <ArrowRightLeft className="h-4 w-4" />

      default:
        return <IndianRupee className="h-4 w-4" />
    }

  }


  const getTransactionColor = (actionRaw: unknown) => {

    const action = normalizeAction(actionRaw)

    switch (action) {

      case 'deposit':
      case 'transfer_in':
        return 'text-emerald-600'

      case 'withdraw':
      case 'transfer_out':
        return 'text-red-600'

      default:
        return 'text-gray-600'
    }

  }


  const formatDate = (timestampRaw: unknown) => {

    if (typeof timestampRaw !== 'string') return 'Invalid Date'

    const d = new Date(timestampRaw)

    return isNaN(d.getTime())
      ? timestampRaw
      : d.toLocaleString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })

  }


  const formatAmount = (amtRaw: unknown, actionRaw: unknown) => {

    if (typeof amtRaw !== 'number') return '₹0'

    const action = normalizeAction(actionRaw)

    const isCredit =
      action === 'deposit' || action === 'transfer_in'

    const prefix = isCredit ? '+' : '-'

    return `${prefix}₹${Math.abs(amtRaw).toLocaleString('en-IN')}`

  }


  const formDisabled =
    isLoading ||
    formData.acc_no.trim().length === 0 ||
    formData.pin.trim().length !== 4


  /* ---------------- UI ---------------- */

  return (

    <Card className="shadow-lg border-0 bg-white">

      <CardHeader className="bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-t-lg">

        <div className="flex items-center space-x-3">

          <HistoryIcon className="h-6 w-6" />

          <div>
            <CardTitle className="text-xl">
              Transaction History
            </CardTitle>

            <CardDescription className="text-slate-200">
              View your account transaction history
            </CardDescription>
          </div>

        </div>

      </CardHeader>


      <CardContent className="p-6">


        {/* FORM */}

        <form onSubmit={handleSubmit} className="space-y-4 mb-6">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="space-y-2">

              <Label>Account Number</Label>

              <Input
                type="text"
                value={formData.acc_no}
                onChange={handleChange('acc_no')}
                placeholder="e.g., AC10000000001"
                required
              />

            </div>


            <div className="space-y-2">

              <Label>4-Digit PIN</Label>

              <Input
                type="password"
                value={formData.pin}
                onChange={handleChange('pin')}
                placeholder="••••"
                maxLength={4}
                pattern="[0-9]{4}"
                required
              />

            </div>

          </div>


          <div className="flex space-x-2">

            <Button
              disabled={formDisabled}
              className="flex-1 bg-slate-600 hover:bg-slate-700"
            >

              {isLoading
                ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                )
                : 'Get History'}

            </Button>


            {transactions.length > 0 && (

              <Button
                onClick={handleRefresh}
                disabled={isLoading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >

                {isLoading
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <RefreshCw className="h-4 w-4" />}

              </Button>

            )}

          </div>

        </form>


        {/* ERROR */}

        {error && (

          <Alert variant="destructive" className="mb-4">

            <AlertCircle className="h-4 w-4" />

            <AlertDescription>
              {error}
            </AlertDescription>

          </Alert>

        )}


        {/* TRANSACTION LIST */}

        {transactions.length > 0 && (

          <div className="space-y-3 max-h-96 overflow-y-auto">

            {transactions.map((t) => {

              const { id, action, amount, created_at } = t

              return (

                <div
                  key={id}
                  className="p-4 bg-gray-50 rounded-lg flex justify-between border hover:bg-gray-100"
                >

                  <div className="flex items-center space-x-3">

                    {getTransactionIcon(action)}

                    <div>

                      <div className="font-medium capitalize">
                        {action || 'Unknown'}
                      </div>

                      <div className="flex items-center text-xs text-gray-500 mt-1">

                        <Calendar className="h-3 w-3 mr-1" />

                        {formatDate(created_at)}

                      </div>

                    </div>

                  </div>


                  <div className={`font-semibold ${getTransactionColor(action)}`}>

                    {formatAmount(amount, action)}

                  </div>

                </div>

              )

            })}

          </div>

        )}

      </CardContent>

    </Card>

  )
}