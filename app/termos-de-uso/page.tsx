import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Termos de Uso</h1>
        <p className="text-gray-700 mb-4">
          Bem-vindo(a) ao `catolibot.vercel.app`. Ao acessar ou usar nosso serviço, você concorda em cumprir e estar
          vinculado(a) aos seguintes Termos de Uso.
        </p>

        <h2 className="text-2xl font-semibold text-gray-800 mb-3 mt-6">1. Aceitação dos Termos</h2>
        <p className="text-gray-700 mb-4">
          Ao utilizar nosso serviço, você reconhece que leu, entendeu e concorda em estar vinculado(a) a estes Termos de
          Uso, bem como à nossa Política de Privacidade. Se você não concorda com estes termos, por favor, não use nosso
          serviço.
        </p>

        <h2 className="text-2xl font-semibold text-gray-800 mb-3 mt-6">2. Uso do Serviço</h2>
        <p className="text-gray-700 mb-4">
          Nosso serviço é fornecido para fins de comunicação e automação de mensagens via WhatsApp. Você concorda em
          usar o serviço apenas para fins lícitos e de maneira que não infrinja os direitos de terceiros ou restrinja o
          uso e o desfrute do serviço por qualquer terceiro.
        </p>

        <h2 className="text-2xl font-semibold text-gray-800 mb-3 mt-6">3. Conduta do Usuário</h2>
        <p className="text-gray-700 mb-4">
          Você concorda em não:
          <ul className="list-disc list-inside ml-4 mt-2">
            <li>Enviar mensagens de spam ou não solicitadas.</li>
            <li>Violar quaisquer leis ou regulamentos aplicáveis.</li>
            <li>Tentar obter acesso não autorizado a sistemas ou redes.</li>
            <li>Interferir ou interromper a integridade ou o desempenho do serviço.</li>
          </ul>
        </p>

        <h2 className="text-2xl font-semibold text-gray-800 mb-3 mt-6">4. Propriedade Intelectual</h2>
        <p className="text-gray-700 mb-4">
          Todo o conteúdo e materiais disponíveis no serviço, incluindo, mas não se limitando a textos, gráficos,
          logotipos, ícones, imagens e software, são propriedade de `catolibot.vercel.app` ou de seus licenciadores e
          são protegidos por leis de direitos autorais e outras leis de propriedade intelectual.
        </p>

        <h2 className="text-2xl font-semibold text-gray-800 mb-3 mt-6">5. Limitação de Responsabilidade</h2>
        <p className="text-gray-700 mb-4">
          O serviço é fornecido "como está" e "conforme disponível", sem garantias de qualquer tipo. Não garantimos que
          o serviço será ininterrupto, livre de erros ou seguro. Em nenhuma circunstância `catolibot.vercel.app` será
          responsável por quaisquer danos diretos, indiretos, incidentais, especiais ou consequenciais resultantes do
          uso ou da incapacidade de usar o serviço.
        </p>

        <h2 className="text-2xl font-semibold text-gray-800 mb-3 mt-6">6. Alterações nos Termos</h2>
        <p className="text-gray-700 mb-4">
          Reservamo-nos o direito de modificar estes Termos de Uso a qualquer momento. Quaisquer alterações serão
          efetivas imediatamente após a publicação dos termos revisados em nosso site. Seu uso continuado do serviço
          após a publicação de alterações constitui sua aceitação de tais alterações.
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
