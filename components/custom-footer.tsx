import Link from "next/link"

export default function CustomFooter() {
  return (
    <footer className="bg-gray-100 p-6 text-center text-gray-600 text-sm border-t border-gray-200">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="mb-2 md:mb-0">&copy; {new Date().getFullYear()} Todos os direitos reservados.</p>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          <Link href="/politica-de-privacidade" className="hover:underline">
            Política de Privacidade
          </Link>
          <Link href="/termos-de-uso" className="hover:underline">
            Termos de Uso
          </Link>
          <Link href="/contato" className="hover:underline">
            Contato
          </Link>
        </div>
        <p className="mt-2 md:mt-0">Desenvolvido por: Guthierres</p>
      </div>
    </footer>
  )
}
