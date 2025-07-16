import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Política de Privacidade</h1>
        <p className="text-gray-700 mb-4">
          Esta Política de Privacidade descreve como `catolibot.vercel.app` coleta, usa e protege suas informações
          pessoais.
        </p>

        <h2 className="text-2xl font-semibold text-gray-800 mb-3 mt-6">1. Coleta de Informações</h2>
        <p className="text-gray-700 mb-4">
          Coletamos informações que você nos fornece diretamente, como nome, endereço de e-mail e número de telefone,
          quando você se registra em nosso serviço, preenche um formulário ou interage com nosso chatbot.
        </p>

        <h2 className="text-2xl font-semibold text-gray-800 mb-3 mt-6">2. Uso das Informações</h2>
        <p className="text-gray-700 mb-4">
          Utilizamos as informações coletadas para operar e manter nosso serviço, responder às suas perguntas e
          solicitações, enviar comunicações de marketing (com seu consentimento) e melhorar a experiência do usuário.
        </p>

        <h2 className="text-2xl font-semibold text-gray-800 mb-3 mt-6">3. Compartilhamento de Informações</h2>
        <p className="text-gray-700 mb-4">
          Não compartilhamos suas informações pessoais com terceiros, exceto quando necessário para fornecer nossos
          serviços (por exemplo, com provedores de serviços de mensagens como o WhatsApp), para cumprir obrigações
          legais ou com seu consentimento explícito.
        </p>

        <h2 className="text-2xl font-semibold text-gray-800 mb-3 mt-6">4. Seus Direitos (LGPD)</h2>
        <p className="text-gray-700 mb-4">
          De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem o direito de acessar, corrigir, excluir ou
          solicitar a portabilidade de seus dados pessoais. Para exercer esses direitos, entre em contato conosco
          através do e-mail fornecido na página de Contato.
        </p>

        <h2 className="text-2xl font-semibold text-gray-800 mb-3 mt-6">5. Segurança dos Dados</h2>
        <p className="text-gray-700 mb-4">
          Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações pessoais contra
          acesso não autorizado, alteração, divulgação ou destruição.
        </p>

        <h2 className="text-2xl font-semibold text-gray-800 mb-3 mt-6">6. Alterações nesta Política</h2>
        <p className="text-gray-700 mb-4">
          Podemos atualizar nossa Política de Privacidade periodicamente. Notificaremos você sobre quaisquer alterações
          publicando a nova Política de Privacidade nesta página.
        </p>

        <p className="text-gray-700 mt-8">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>

        <div className="mt-8 text-center">
          <Link href="/" passHref>
            <Button variant="outline">Voltar para a Página Inicial</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
