import AppRouter from './app/router'
import Shell from './app/layout/Shell'
import { initDbIfEmpty } from './app/state/storage'

// Inicializar DB al cargar la app
initDbIfEmpty()

function App() {
  return (
    <Shell>
      <AppRouter />
    </Shell>
  )
}

export default App
