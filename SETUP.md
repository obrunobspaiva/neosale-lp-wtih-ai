# Setup - Copiar Imagens

Antes de rodar o projeto, copie as imagens do projeto original:

## Windows Explorer

1. Copie `neosale-lp-maya\maya.jpeg` para `neosale-lp-react\src\assets\maya.jpeg`
2. Copie `neosale-lp-maya\icone-azul.png` para `neosale-lp-react\public\icone-azul.png`

## Ou via CMD/PowerShell

```powershell
copy "c:\Users\Asus\source\neosale\neosale-lp-maya\maya.jpeg" "c:\Users\Asus\source\neosale\neosale-lp-react\src\assets\maya.jpeg"
copy "c:\Users\Asus\source\neosale\neosale-lp-maya\icone-azul.png" "c:\Users\Asus\source\neosale\neosale-lp-react\public\icone-azul.png"
```

## Depois

1. Crie `.env` baseado em `.env.example`
2. `npm install`
3. `npm run dev`
