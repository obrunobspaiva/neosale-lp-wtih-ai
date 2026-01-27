import { CONFIG } from '../config';
import { SYSTEM_PROMPT } from './constants';

// Remove markdown formatting from text
export function removeMarkdown(text) {
    return text
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/^[\s]*[-*+]\s+/gm, '• ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

// Call OpenAI API
export async function callOpenAI(userMessage, conversationHistory = []) {
    conversationHistory.push({
        role: 'user',
        content: userMessage
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${CONFIG.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: CONFIG.OPENAI_MODEL,
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                ...conversationHistory
            ],
            max_tokens: 150,
            temperature: 0.7
        })
    });

    if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    let assistantMessage = data.choices[0].message.content;
    assistantMessage = removeMarkdown(assistantMessage);

    conversationHistory.push({
        role: 'assistant',
        content: assistantMessage
    });

    return assistantMessage;
}

// Generate scheduling message with company analysis
export async function generateSchedulingMessage(data) {
    const { nome, empresa, segmento, cargo, faturamento, colaboradores } = data;
    const firstName = nome.split(' ')[0];

    const analysisPrompt = `Você é a Maya da NeoSale AI. Faça uma análise REAL e PERSONALIZADA para o lead.

DADOS DO LEAD:
- Nome: ${nome}
- Empresa: ${empresa}
- Segmento: ${segmento}
- Cargo: ${cargo}
- Faturamento anual: ${faturamento}
- Número de colaboradores: ${colaboradores}

TAREFA - ANÁLISE PERSONALIZADA:
1. Analise o segmento "${segmento}" e identifique:
   - Principais dores de vendas desse segmento
   - Como empresas desse segmento perdem vendas por não responder rápido no WhatsApp
   - Oportunidades específicas de automação

2. Calcule uma estimativa de economia/ganho PERSONALIZADA baseada em:
   - Faturamento: ${faturamento} (use isso para estimar ticket médio e volume de leads)
   - Colaboradores: ${colaboradores} (considere quantos podem estar em vendas)
   - Segmento: ${segmento} (cada segmento tem margens e ciclos diferentes)
   - NUNCA use valores fixos como "R$ 8.000 a R$ 15.000" - calcule baseado nos dados reais

3. Crie uma mensagem que:
   - Cumprimente ${firstName} pelo nome
   - Mencione um insight específico sobre o segmento ${segmento}
   - Apresente a estimativa de economia/ganho calculada (valor único ou range pequeno baseado nos dados)
   - Explique brevemente de onde vem esse ganho (ex: "recuperando X% dos leads que não são respondidos em tempo")
   - Crie urgência com vagas limitadas
   - Termine pedindo para agendar

REGRAS:
- NUNCA use valores genéricos ou fixos
- Seja específico sobre o segmento e os desafios
- Use <strong></strong> para destacar valores e palavras importantes
- Máximo 4 parágrafos curtos
- Termine SEMPRE com: "<strong>Agende abaixo o melhor dia para falar com a nossa equipe.</strong>"

Gere a mensagem personalizada agora:`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: CONFIG.OPENAI_MODEL,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: analysisPrompt }
                ],
                max_tokens: 400,
                temperature: 0.8
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        return removeMarkdown(data.choices[0].message.content);

    } catch (error) {
        console.error('Erro ao gerar análise da empresa:', error);
        return `Show, ${firstName}! Analisando o perfil da <strong>${empresa}</strong> no segmento de <strong>${segmento}</strong>, identificamos oportunidades significativas de automação.

Com ${colaboradores} colaboradores e seu porte de faturamento, empresas similares costumam perder até 40% dos leads por demora no atendimento via WhatsApp. A NeoSale pode mudar isso.

Temos apenas três vagas para diagnósticos personalizados esta semana - onde vamos calcular exatamente o potencial de ganho para a ${empresa}.

<strong>Agende abaixo o melhor dia para falar com a nossa equipe.</strong>`;
    }
}

// Get greeting based on time
export function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
}

// Generate initial message (static, no API call)
export function generateInitialMessage() {
    const greeting = getGreeting();
    
    return `${greeting}! 😊 Eu sou a <strong>Maya</strong>, assistente virtual da <strong>NeoSale AI</strong>.

Vou criar um diagnóstico personalizado para sua empresa - focado em <strong>automatizar vendas</strong>, <strong>qualificar leads</strong> e <strong>multiplicar seus resultados</strong> no WhatsApp.

Para começar, me passa seu WhatsApp?`;
}
