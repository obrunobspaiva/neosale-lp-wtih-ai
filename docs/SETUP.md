# 🛠️ Setup - NeoSale LP Maya

## Pré-requisitos

- Node.js 18+
- npm 9+
- OpenAI API Key

## Instalação

```bash
npm install
```

## Configurar OpenAI

Crie `.env.local`:

```env
VITE_OPENAI_API_KEY=sk-proj-seu-token-aqui
```

**Como obter token:**
1. Abra https://platform.openai.com/api-keys
2. Clique "Create new secret key"
3. Copie o token
4. Cole em `.env.local`

## Iniciar Desenvolvimento

```bash
npm run dev
```

Acesse `http://localhost:5173` ou `http://localhost:3000`

### Hot Module Replacement

Alterações em código recarregam automaticamente no navegador.

## Build para Produção

```bash
npm run build
```

Gera versão otimizada em `dist/`

## Testar Build Localmente

```bash
npm run preview
```

Simula servidor de produção em `http://localhost:4173`

## Troubleshooting

### "OpenAI API error"
```bash
# Verificar variável
cat .env.local | grep VITE_OPENAI_API_KEY

# Verificar se token é válido
# https://platform.openai.com/account/api-keys
```

### "Port 5173 already in use"
```bash
npm run dev -- --port 3001
```

### "Cannot find module"
```bash
rm -rf node_modules
npm install
```

---

Veja README.md para mais informações.
