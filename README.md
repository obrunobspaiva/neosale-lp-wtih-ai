# NeoSale LP React

Landing page da NeoSale AI com chat da Maya, recriada em React + Vite.

## Setup Local

1. Copie as imagens do projeto original:
   ```
   # Copie maya.jpeg para src/assets/
   # Copie icone-azul.png para public/
   ```

2. Crie o arquivo `.env` baseado no `.env.example`:
   ```
   VITE_OPENAI_API_KEY=sk-your-key
   VITE_OPENAI_MODEL=gpt-4o-mini
   VITE_API_ENDPOINT=https://your-api.com/leads
   VITE_CLIENTE_ID=your-cliente-id
   ```

3. Instale as dependências:
   ```bash
   npm install
   ```

4. Rode o projeto:
   ```bash
   npm run dev
   ```

## Deploy no EasyPanel

### Configuração de Build Args

No EasyPanel, configure as seguintes **Build Args** (não Environment Variables):

- `VITE_OPENAI_API_KEY` = sua chave OpenAI
- `VITE_OPENAI_MODEL` = gpt-4o-mini
- `VITE_API_ENDPOINT` = URL da sua API de leads
- `VITE_CLIENTE_ID` = seu cliente ID

**IMPORTANTE**: No Vite, as variáveis de ambiente são injetadas no build time, não em runtime. Por isso, você precisa configurar como **Build Args** no EasyPanel, não como Environment Variables.

### Passos no EasyPanel

1. Crie um novo serviço do tipo **App**
2. Conecte ao repositório Git
3. Vá em **Build** > **Build Args** e adicione as variáveis acima
4. Deploy!

## Estrutura do Projeto

```
src/
├── assets/          # Imagens (maya.jpeg)
├── components/      # Componentes React
│   ├── BotMessage.jsx
│   ├── Calendar.jsx
│   ├── ChatInput.jsx
│   ├── Confirmation.jsx
│   ├── ExistingLeadConfirmation.jsx
│   ├── SuccessScreen.jsx
│   ├── TypingIndicator.jsx
│   └── UserMessage.jsx
├── utils/           # Utilitários
│   ├── api.js       # Chamadas à API de leads
│   ├── constants.js # Constantes e configurações
│   ├── helpers.js   # Funções auxiliares
│   └── openai.js    # Integração com OpenAI
├── App.jsx          # Componente principal
├── config.js        # Configuração de ambiente
├── index.css        # Estilos globais
└── main.jsx         # Entry point
```

## Diferenças do Projeto Original

- **React + Vite** em vez de vanilla JS
- **Variáveis de ambiente** via `import.meta.env.VITE_*`
- **Build estático** - as variáveis são injetadas no build, não em runtime
- **Componentes modulares** - código mais organizado e manutenível
