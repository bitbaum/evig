'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw } from 'lucide-react'
import { formatDateShort } from '@/lib/date-formats'
import { useRefunds } from '@/hooks/useRefunds'
import type { RefundAction } from '@/hooks/useRefunds'

export default function RefundManager() {
  const { refunds, isLoading: loading, processingId: processing, error, fetchRefunds, updateRefund } = useRefunds()

  useEffect(() => {
    fetchRefunds()
  }, [fetchRefunds])

  const handleRefundAction = (refundId: string, action: RefundAction, notes?: string) => {
    updateRefund(refundId, action, notes)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'requested':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Angefragt</Badge>
      case 'approved':
        return <Badge variant="outline" className="text-blue-700 border-blue-300"><CheckCircle className="w-3 h-3 mr-1" />Genehmigt</Badge>
      case 'processing':
        return <Badge variant="outline" className="text-yellow-700 border-yellow-300"><RefreshCw className="w-3 h-3 mr-1" />In Bearbeitung</Badge>
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Abgeschlossen</Badge>
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Abgelehnt</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getReasonText = (reason: string) => {
    switch (reason) {
      case 'customer_request':
        return 'Kundenwunsch'
      case 'service_cancelled':
        return 'Service storniert'
      case 'service_not_completed':
        return 'Service nicht erbracht'
      case 'duplicate_charge':
        return 'Doppelte Belastung'
      case 'fraud':
        return 'Betrug'
      case 'other':
        return 'Sonstiges'
      default:
        return reason
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin mr-3" />
          Lade Rückerstattungen...
        </CardContent>
      </Card>
    )
  }

  const pendingRefunds = refunds.filter(r => r.status === 'requested')
  const approvedRefunds = refunds.filter(r => r.status === 'approved')
  const processingRefunds = refunds.filter(r => r.status === 'processing')
  const completedRefunds = refunds.filter(r => ['completed', 'rejected'].includes(r.status))

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Rückerstattungs-Management</CardTitle>
          <CardDescription>
            Verwalten und bearbeiten Sie Rückerstattungsanfragen
          </CardDescription>
        </CardHeader>
      </Card>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending" className="relative">
            Ausstehend
            {pendingRefunds.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                {pendingRefunds.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Genehmigt</TabsTrigger>
          <TabsTrigger value="processing">In Bearbeitung</TabsTrigger>
          <TabsTrigger value="completed">Abgeschlossen</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingRefunds.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                Keine ausstehenden Rückerstattungen
              </CardContent>
            </Card>
          ) : (
            pendingRefunds.map(refund => (
              <Card key={refund.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{refund.refund_number}</CardTitle>
                      <CardDescription>
                        {refund.customer_name} ({refund.customer_email})
                      </CardDescription>
                    </div>
                    {getStatusBadge(refund.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Originalbetrag:</span>
                      <p className="text-gray-600">{refund.original_amount} {refund.currency}</p>
                    </div>
                    <div>
                      <span className="font-medium">Rückerstattung:</span>
                      <p className="text-gray-600">{refund.refund_amount} {refund.currency}</p>
                    </div>
                    <div>
                      <span className="font-medium">Grund:</span>
                      <p className="text-gray-600">{getReasonText(refund.reason)}</p>
                    </div>
                    <div>
                      <span className="font-medium">Angefragt am:</span>
                      <p className="text-gray-600">{formatDateShort(refund.created_at)}</p>
                    </div>
                  </div>

                  {refund.reason_details && (
                    <div>
                      <span className="font-medium">Details:</span>
                      <p className="text-gray-600 text-sm mt-1">{refund.reason_details}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      onClick={() => handleRefundAction(refund.id, 'approve', 'Approved via admin panel')}
                      disabled={processing === refund.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {processing === refund.id ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      Genehmigen
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleRefundAction(refund.id, 'reject', 'Rejected via admin panel')}
                      disabled={processing === refund.id}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Ablehnen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedRefunds.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                Keine genehmigten Rückerstattungen
              </CardContent>
            </Card>
          ) : (
            approvedRefunds.map(refund => (
              <Card key={refund.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{refund.refund_number}</CardTitle>
                      <CardDescription>
                        {refund.customer_name} • Genehmigt von {refund.approved_by_name}
                      </CardDescription>
                    </div>
                    {getStatusBadge(refund.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{refund.refund_amount} {refund.currency}</p>
                      <p className="text-sm text-gray-600">{getReasonText(refund.reason)}</p>
                    </div>
                    <Button
                      onClick={() => handleRefundAction(refund.id, 'process', 'Processed via admin panel')}
                      disabled={processing === refund.id}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {processing === refund.id ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      Bearbeiten
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="processing" className="space-y-4">
          {processingRefunds.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                Keine Rückerstattungen in Bearbeitung
              </CardContent>
            </Card>
          ) : (
            processingRefunds.map(refund => (
              <Card key={refund.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{refund.refund_number}</CardTitle>
                      <CardDescription>
                        {refund.customer_name} • Wird bearbeitet
                      </CardDescription>
                    </div>
                    {getStatusBadge(refund.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{refund.refund_amount} {refund.currency}</p>
                      <p className="text-sm text-gray-600">{getReasonText(refund.reason)}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      Seit {formatDateShort(refund.processed_at || refund.created_at)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedRefunds.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                Keine abgeschlossenen Rückerstattungen
              </CardContent>
            </Card>
          ) : (
            completedRefunds.slice(0, 10).map(refund => (
              <Card key={refund.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{refund.refund_number}</CardTitle>
                      <CardDescription>
                        {refund.customer_name} • {refund.status === 'completed' ? 'Abgeschlossen' : 'Abgelehnt'}
                      </CardDescription>
                    </div>
                    {getStatusBadge(refund.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{refund.refund_amount} {refund.currency}</p>
                      <p className="text-sm text-gray-600">{getReasonText(refund.reason)}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDateShort(refund.processed_at || refund.created_at)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}