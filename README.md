# Soir — Backend de Avaliações

Este diretório contém um servidor Node.js simples que armazena avaliações de produtos em SQLite e aceita upload de imagens.

Instalação e execução:

```bash
cd "c:\Users\josue\Desktop\Soir Alliv"
npm install
npm start
```

O servidor roda por padrão em `http://localhost:3000`.

API:
- `GET /api/reviews?productId=ID` — lista avaliações (opcionalmente filtradas por produto)
- `POST /api/reviews` — cria avaliação (multipart/form-data): campos `productId`, `name`, `text`, `rating`, e `image` (file)

Arquivos enviados são servidos em `/uploads/`.
