export default function LoginPage() {
  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Login Container */}
        <div className="bg-white border-2 border-neutral-300 p-8">
          {/* Title */}
          <h1 className="text-2xl font-mono text-neutral-900 mb-8">Bem-vindo</h1>

          {/* Form */}
          <form className="space-y-6">
            {/* Username Field */}
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-mono text-neutral-700">
                Nome de usuário
              </label>
              <input
                id="username"
                type="text"
                className="w-full border-2 border-neutral-300 bg-white px-3 py-2 text-neutral-900 font-mono text-sm focus:outline-none focus:border-neutral-500"
                placeholder="usuário"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-mono text-neutral-700">
                Senha
              </label>
              <input
                id="password"
                type="password"
                className="w-full border-2 border-neutral-300 bg-white px-3 py-2 text-neutral-900 font-mono text-sm focus:outline-none focus:border-neutral-500"
                placeholder="••••••••"
              />
            </div>

            <a
              href="/dashboard"
              className="block w-full bg-neutral-900 text-white font-mono text-sm py-3 border-2 border-neutral-900 hover:bg-neutral-800 transition-colors text-center"
            >
              Entrar
            </a>

            {/* Forgot Password Link */}
            <div className="text-center">
              <a href="#" className="text-sm font-mono text-neutral-600 underline hover:text-neutral-900">
                Esqueceu a senha?
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
