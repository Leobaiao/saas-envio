export default function SucessoPage() {
  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white border-2 border-neutral-300 p-8">
          <h1 className="text-2xl font-mono text-neutral-900 mb-4">Conta Criada!</h1>
          <div className="border-2 border-green-600 bg-green-50 p-4 mb-6">
            <p className="text-sm font-mono text-green-800">
              Verifique seu email para confirmar sua conta antes de fazer login.
            </p>
          </div>
          <p className="text-sm font-mono text-neutral-600 mb-6">
            Enviamos um link de confirmação para o seu email. Clique no link para ativar sua conta.
          </p>
          <a
            href="/"
            className="block w-full bg-neutral-900 text-white font-mono text-sm py-3 border-2 border-neutral-900 hover:bg-neutral-800 transition-colors text-center"
          >
            Voltar para Login
          </a>
        </div>
      </div>
    </div>
  )
}
