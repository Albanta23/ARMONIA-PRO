# Makefile para automatizar integración de Auth0 en Vite/React

install-auth0:
	npm install @auth0/auth0-react

setup-auth0-env:
	echo 'VITE_AUTH0_DOMAIN=tu-dominio.auth0.com' >> .env.local
	echo 'VITE_AUTH0_CLIENT_ID=tu-client-id' >> .env.local

# Puedes agregar más reglas para copiar plantillas de componentes o configuración

# Uso:
# make install-auth0      # Instala el SDK de Auth0
# make setup-auth0-env    # Añade variables de entorno (edita los valores reales)
