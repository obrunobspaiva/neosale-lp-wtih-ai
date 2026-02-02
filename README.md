# 🤖 NeoSale LP Maya

Landing page interativa com chat IA integrado. Vite 5 + React 18 + OpenAI.

**Versão:** 1.0.0 | **Status:** Ativo | **Stack:** Vite 5 + React 18 + OpenAI API

## 🚀 Início Rápido

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173` ou `http://localhost:3000`

## 📁 Estrutura

```
src/
├── App.jsx                  # Main component
├── main.jsx                 # Entry point
├── index.css                # Global styles
├── components/              # Componentes reutilizáveis
├── assets/                  # Imagens e mídia
└── utils/                   # Helper functions
```

## 🔧 Configuração

### `.env.local`

```env
VITE_OPENAI_API_KEY=sk-proj-seu-token
```

**Obter token:**
1. https://platform.openai.com/api-keys
2. Create new secret key
3. Copie em .env.local

## 🎯 Recursos

- ✅ Chat IA interativo
- ✅ Busca semântica
- ✅ Integração OpenAI
- ✅ Responsivo
- ✅ Sem TypeScript (JSX puro)

## 📚 Documentação

- [SETUP.md](docs/SETUP.md) - Setup detalhado
- [ENVIRONMENT.md](docs/ENVIRONMENT.md) - Variáveis

## 🚢 Deployment

```bash
npm run build               # Build otimizado
npm run preview             # Preview do build
npm run deploy              # Docker deploy
```

## 📦 Dependências

- **react:** v18
- **vite:** v5
- **@vitejs/plugin-react:** Fast refresh

## 📝 Licença

MIT

---

**Mantido por:** Equipe NeoSale
**Última atualização:** Fevereiro 2026
