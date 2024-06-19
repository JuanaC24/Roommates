# Roommates API

Este proyecto es una API REST para gestionar roommates y sus gastos. Incluye funcionalidades para agregar, editar y eliminar roommates y gastos, así como enviar correos electrónicos de notificación cuando se registra un nuevo gasto.

## Requisitos

- Node.js
- npm (Node Package Manager)

## Instalación

1. Clona el repositorio:
    ```sh
    git clone https://github.com/JuanaC24/roommates.git
    cd tu_repositorio
    ```

2. Instala las dependencias:
    ```sh
    npm install
    ```

3. Crea un archivo `.env` en la raíz del proyecto con las siguientes variables de entorno:
    ```
    EMAIL_USER=tu_email@gmail.com
    EMAIL_PASS=tu_contraseña
    ```

4. Crea los archivos `roommates.json` y `gastos.json` en la raíz del proyecto con contenido inicial vacío:
    ```json
    // roommates.json
    {
      "roommates": []
    }
    ```

    ```json
    // gastos.json
    {
      "gastos": []
    }
    ```

## Uso

1. Inicia el servidor:
    ```sh
    node server.js
    ```

2. El servidor estará corriendo en `http://localhost:3000`.

## Endpoints de la API

### Roommates

- **GET /roommates**: Devuelve todos los roommates almacenados en el servidor.

    **Ejemplo de respuesta:**
    ```json
    {
      "roommates": [
        {
          "id": "123e4567-e89b-12d3-a456-426614174000",
          "nombre": "John Doe",
          "email": "john.doe@example.com",
          "debe": 0,
          "recibe": 0
        }
      ]
    }
    ```

- **POST /roommate**: Añade un nuevo roommate generado aleatoriamente.

    **Ejemplo de respuesta:**
    ```json
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "nombre": "John Doe",
      "email": "john.doe@example.com",
      "debe": 0,
      "recibe": 0
    }
    ```

### Gastos

- **GET /gastos**: Devuelve todos los gastos almacenados en el archivo `gastos.json`.

    **Ejemplo de respuesta:**
    ```json
    {
      "gastos": [
        {
          "id": "123e4567-e89b-12d3-a456-426614174000",
          "roommate": "John Doe",
          "descripcion": "Compra de alimentos",
          "monto": 50
        }
      ]
    }
    ```

- **POST /gasto**: Recibe el payload con los datos del gasto y los almacena en un archivo JSON (`gastos.json`). Además, envía un correo electrónico de notificación a todos los roommates.

    **Ejemplo de payload:**
    ```json
    {
      "roommate": "John Doe",
      "descripcion": "Compra de alimentos",
      "monto": 50
    }
    ```

    **Ejemplo de respuesta:**
    ```json
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "roommate": "John Doe",
      "descripcion": "Compra de alimentos",
      "monto": 50,
      "correoResultado": {
        "success": true,
        "message": "Correo enviado a: john.doe@example.com"
      }
    }
    ```

- **PUT /gasto/:id**: Recibe el payload de la consulta y modifica los datos almacenados en el servidor (`gastos.json`).

    **Ejemplo de payload:**
    ```json
    {
      "roommate": "John Doe",
      "descripcion": "Compra de alimentos actualizada",
      "monto": 75
    }
    ```

    **Ejemplo de respuesta:**
    ```json
    {
      "message": "Gasto actualizado correctamente",
      "gasto": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "roommate": "John Doe",
        "descripcion": "Compra de alimentos actualizada",
        "monto": 75
      }
    }
    ```

- **DELETE /gasto**: Recibe el id del gasto usando las Query Strings y lo elimina del historial de gastos (`gastos.json`).

    **Ejemplo de request:**
    ```sh
    DELETE /gasto?id=123e4567-e89b-12d3-a456-426614174000
    ```

    **Ejemplo de respuesta:**
    ```json
    {
      "message": "Gasto eliminado correctamente"
    }
    ```

## Manejo de Errores

Los errores son capturados y manejados para devolver los códigos de estado HTTP correspondientes:

- **400 Bad Request**: Datos inválidos en el payload.
- **404 Not Found**: Gasto no encontrado.
- **500 Internal Server Error**: Error interno del servidor.

## Registro de Envío de Correos

Los intentos de envío de correos se registran en un archivo `email_logs.txt` en la raíz del proyecto, incluyendo tanto los éxitos como los errores.

