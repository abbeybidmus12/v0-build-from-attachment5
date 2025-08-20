"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Calendar, Mail, Flag, CheckCircle, MessageSquare } from "lucide-react"

interface Response {
  id: string
  formId: string
  formTitle: string
  submittedAt: string
  status: "new" | "read" | "flagged"
  respondentEmail: string
  responses: Record<string, string>
}

interface ResponseDetailModalProps {
  response: Response
  onClose: () => void
  onStatusChange: (status: Response["status"]) => void
}

const statusConfig = {
  new: { label: "New", variant: "default" as const, icon: MessageSquare },
  read: { label: "Read", variant: "secondary" as const, icon: CheckCircle },
  flagged: { label: "Flagged", variant: "destructive" as const, icon: Flag },
}

export function ResponseDetailModal({ response, onClose, onStatusChange }: ResponseDetailModalProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const StatusIcon = statusConfig[response.status].icon

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="font-heading text-xl">{response.formTitle}</DialogTitle>
              <DialogDescription className="mt-1">Response ID: {response.id}</DialogDescription>
            </div>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Response Metadata */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Response Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Respondent</p>
                    <p className="font-medium">{response.respondentEmail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Submitted</p>
                    <p className="font-medium">{formatDate(response.submittedAt)}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusIcon className="h-4 w-4" />
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge variant={statusConfig[response.status].variant}>{statusConfig[response.status].label}</Badge>
                </div>
                <Select value={response.status} onValueChange={onStatusChange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                    <SelectItem value="flagged">Flagged</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Response Data */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Form Responses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(response.responses).map(([question, answer]) => (
                <div key={question} className="border-b border-border pb-4 last:border-b-0 last:pb-0">
                  <p className="font-medium text-foreground mb-2">{question}</p>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-foreground whitespace-pre-wrap">{answer}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                // TODO: Implement export single response
                console.log("Exporting response:", response.id)
              }}
            >
              Export Response
            </Button>
            {response.status !== "read" && <Button onClick={() => onStatusChange("read")}>Mark as Read</Button>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
