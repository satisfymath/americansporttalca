// Not Found page
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div>
      <h1>404 - Pagina no encontrada</h1>
      <Link to="/">Volver al inicio</Link>
    </div>
  )
}
