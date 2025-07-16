"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Send, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function SendMessagePage() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<"success" | "error" | null>(null)
  const [statusMessage, setStatusMessage] = useState("")

  const sendMessage = async () => {
    if (!phoneNumber || !message) {
      setStatus("error")
      setStatusMessage("Número e mensagem são obrigatórios")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/send-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: phoneNumber,
          message: message,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setStatus("success")
        setStatusMessage("Mensagem enviada com sucesso!")
        setMessage("")
      } else {
        setStatus("error")
        setStatusMessage(result.error || "Erro ao enviar mensagem")
      }
    } catch (error) {
      setStatus("error")
      setStatusMessage("Erro ao enviar mensagem")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/" className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Enviar Mensagem WhatsApp</h1>
          <p className="text-gray-600">Envie mensagens diretamente para seus contatos</p>
        </div>

        {status && (
          <Alert className={`mb-6 ${status === "success" ? "border-green-500" : "border-red-500"}`}>
            <AlertDescription className={status === "success" ? "text-green-700" : "text-red-700"}>
              {statusMessage}
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Nova Mensagem
            </CardTitle>
            <CardDescription>Digite o número do destinatário e sua mensagem</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="phone">Número do WhatsApp</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="5511999999999 (com código do país)"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <p className="text-sm text-gray-500 mt-1">Formato: código do país + DDD + número (ex: 5511999999999)</p>
            </div>

            <div>
              <Label htmlFor="message">Mensagem</Label>
              <Textarea
                id="message"
                placeholder="Digite sua mensagem aqui..."
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <Button onClick={sendMessage} disabled={loading || !phoneNumber || !message} className="w-full">
              {loading ? "Enviando..." : "Enviar Mensagem"}
            </Button>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Dicas Importantes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>• O número deve incluir o código do país (Brasil: 55)</p>
            <p>• Exemplo: 5511999999999 para um número de São Paulo</p>
            <p>• Certifique-se de que o número está registrado no WhatsApp</p>
            <p>• Mensagens só podem ser enviadas para números que já iniciaram conversa com seu WhatsApp Business</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
