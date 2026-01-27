// System prompt for Maya
export const SYSTEM_PROMPT = `Você é a Maya, assistente virtual da NeoSale AI - uma plataforma que transforma WhatsApp em máquina de vendas com IA.

PERSONALIDADE:
- Simpática, profissional e objetiva
- Use linguagem informal mas respeitosa
- Seja entusiasmada sobre tecnologia e resultados
- Mantenha respostas curtas (máximo 2-3 frases)

OBJETIVO:
Você está qualificando um lead para agendar uma consultoria gratuita de IA. Colete os dados de forma natural e conversacional.

REGRAS:
1. NUNCA invente dados do lead
2. NUNCA fale sobre preços ou valores
3. Sempre peça apenas UM dado por vez
4. Elogie brevemente a empresa/cargo quando apropriado
5. Mantenha o foco no próximo campo a ser coletado
6. Use emojis com moderação (máximo 1 por mensagem)
7. NUNCA use markdown (asteriscos, hashtags, crases) - use apenas texto simples
8. Para destacar palavras, use tags HTML como strong

CONTEXTO DA NEOSALE:
- Automatiza vendas no WhatsApp com agentes de IA
- Qualifica leads automaticamente
- Agenda reuniões sem intervenção humana
- Faz follow-up inteligente
- Clientes economizam R$8.000 a R$15.000/mês em média`;

// Steps configuration
export const STEPS = [
    { field: 'telefone', type: 'phone', placeholder: '(11) 99999-9999' },
    { field: 'nome', type: 'text', placeholder: 'Digite seu nome completo...' },
    { field: 'email', type: 'email', placeholder: 'seu@email.com' },
    { field: 'empresa', type: 'text', placeholder: 'Digite o nome da sua empresa...' },
    {
        field: 'segmento',
        type: 'select',
        options: ['Advocacia', 'Agronegócio', 'Alimentação', 'Automotivo', 'Beleza', 'Consultoria', 'Contabilidade', 'Educação', 'E-commerce', 'Imobiliário', 'Indústria', 'Saúde', 'Serviços', 'Tecnologia', 'Varejo', 'Outro']
    },
    {
        field: 'cargo',
        type: 'options',
        options: ['Sócio ou Fundador', 'Presidente ou CEO', 'C-Level', 'Diretor', 'Gerente', 'Analista']
    },
    {
        field: 'faturamento',
        type: 'select',
        placeholder: 'Selecione o faturamento anual',
        options: ['Até R$500 mil/ano', 'R$500 mil a R$1 milhão/ano', 'R$1 a R$5 milhões/ano', 'R$5 a R$10 milhões/ano', 'R$10 a R$50 milhões/ano', 'R$50 a R$100 milhões/ano', 'Acima de R$100 milhões/ano', 'Ainda não faturo']
    },
    {
        field: 'colaboradores',
        type: 'options',
        options: ['1 a 5', '6 a 10', '11 a 20', '20 a 50', '50 a 100', '100 a 300', '300+']
    },
    { field: 'agendamento', type: 'calendar' },
    { field: 'confirmacao', type: 'confirmation' }
];

// Field prompts for AI
export const FIELD_PROMPTS = {
    nome: `O lead acabou de informar o telefone. Agora peça o nome completo dele de forma simpática.`,
    email: (firstName) => `O lead ${firstName} informou o nome. Agora peça o email dele.`,
    empresa: (firstName) => `O lead ${firstName} informou o email. Agora pergunte qual é a empresa dele.`,
    segmento: (firstName, empresa) => `O lead ${firstName} trabalha na empresa "${empresa}". Elogie brevemente o nome da empresa e pergunte qual é o segmento de atuação.`,
    cargo: (firstName, empresa, segmento) => `O lead ${firstName} trabalha na empresa "${empresa}" do segmento "${segmento}". Agora pergunte qual é o cargo dele na empresa.`,
    faturamento: (firstName, empresa, cargo) => `O lead ${firstName} é ${cargo} na empresa "${empresa}". Elogie brevemente a posição estratégica dele e pergunte qual é o faturamento anual da empresa.`,
    colaboradores: (firstName, faturamento) => `O lead ${firstName} informou que a empresa fatura "${faturamento}". Estamos quase finalizando! Pergunte quantos colaboradores a empresa possui.`
};

// Fallback responses
export const FALLBACK_RESPONSES = {
    nome: `Ótimo! Qual é o seu nome completo?`,
    email: (firstName) => `Show, ${firstName}! Me passa seu email?`,
    empresa: `Ótimo! Qual o nome da sua empresa?`,
    segmento: (empresa) => `Legal! Qual o segmento da ${empresa}?`,
    cargo: (empresa) => `E qual é o seu cargo na ${empresa}?`,
    faturamento: `Qual é o faturamento anual da empresa?`,
    colaboradores: `Quantos colaboradores a empresa possui?`
};

// Colaboradores mapping
export const COLABORADORES_MAPPING = {
    '1 a 5': 3,
    '6 a 10': 8,
    '11 a 20': 15,
    '20 a 50': 35,
    '50 a 100': 75,
    '100 a 300': 200,
    '300+': 400
};

export const convertColaboradoresToNumber = (colaboradores) => {
    return COLABORADORES_MAPPING[colaboradores] || 1;
};

export const convertColaboradoresFromNumber = (value) => {
    const num = parseInt(value);
    if (num <= 5) return '1 a 5';
    if (num <= 10) return '6 a 10';
    if (num <= 20) return '11 a 20';
    if (num <= 50) return '20 a 50';
    if (num <= 100) return '50 a 100';
    if (num <= 300) return '100 a 300';
    return '300+';
};
