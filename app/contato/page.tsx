import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Mail } from "lucide-react"

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md text-center">
        <Mail className="w-16 h-16 text-blue-600 mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Entre em Contato</h1>
        <p className="text-gray-700 mb-6">
          Se você tiver alguma dúvida, sugestão ou precisar de suporte, sinta-se à vontade para nos contatar.
        </p>
        <a href="mailto:guthierresc@hotmail.com" className="inline-block">
          <Button size="lg" className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Enviar E-mail para Guthierres
          </Button>
        </a>
        <div className="mt-8">
          <Link href="/" passHref>
            <Button variant="outline">Voltar para a Página Inicial</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
