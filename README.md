# American Sport Talca - Demo

Sistema de gestion para gimnasio. Demo funcional con persistencia en LocalStorage.

## Credenciales

- **Usuario:** demo / demo
- **Administrador:** admin / admin

## Comandos

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Build produccion
npm run build

# Preview build
npm run preview

# Tests
npm run test:run

# Type check
npm run typecheck
```

## Despliegue GitHub Pages

1. Hacer push a la rama `main`
2. El workflow de GitHub Actions construira y desplegara automaticamente
3. Activar GitHub Pages en Settings > Pages > Source: GitHub Actions

## Funcionalidades

- Ingreso por QR (muestra QR en Home que abre flujo de entrada/salida)
- Login solo con credenciales hardcodeadas
- Panel de usuario: estado de membresia, pagos, asistencias
- Panel admin: dashboard, gestion de socios, planilla de caja
- Persistencia local en navegador (LocalStorage key: ASG_DEMO_DB_V1)

## Disclaimer

Este es un DEMO para pruebas. No usar en produccion.
Todos los datos se almacenan localmente en el navegador.
