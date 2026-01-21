(function () {
    // Configuration - uses window.ENV from config.js for sensitive data
    const CONFIG = {
        OPENAI_API_KEY: window.ENV?.OPENAI_API_KEY,
        OPENAI_MODEL: window.ENV?.OPENAI_MODEL,
        API_ENDPOINT: window.ENV?.API_ENDPOINT,
        CLIENTE_ID: window.ENV?.CLIENTE_ID
    };

    // System prompt for Maya
    const SYSTEM_PROMPT = `Você é a Maya, assistente virtual da NeoSale AI - uma plataforma que transforma WhatsApp em máquina de vendas com IA.

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

    // Initialize EmailJS
    if (typeof emailjs !== 'undefined') {
        emailjs.init(CONFIG.EMAILJS_PUBLIC_KEY);
    }

    // Conversation state
    const state = {
        step: 0,
        leadRegistered: false,
        leadId: null,
        data: {
            nome: '',
            telefone: '',
            email: '',
            empresa: '',
            segmento: '',
            cargo: '',
            faturamento: '',
            colaboradores: '',
            data_agendamento: '',
            horario_agendamento: ''
        },
        conversationHistory: []
    };

    // Steps configuration
    const STEPS = [
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

    // Segmentos mapping for context
    const SEGMENTOS_CONTEXT = {
        'Advocacia': 'escritórios de advocacia que precisam automatizar captação de clientes',
        'Agronegócio': 'empresas do agro que buscam escalar vendas',
        'Alimentação': 'restaurantes e food service que querem aumentar pedidos',
        'Automotivo': 'concessionárias e oficinas que precisam de mais leads',
        'Beleza': 'salões e clínicas de estética que querem lotar a agenda',
        'Consultoria': 'consultorias que precisam qualificar leads automaticamente',
        'Contabilidade': 'escritórios contábeis que querem escalar sem aumentar equipe',
        'Educação': 'escolas e cursos que precisam converter mais matrículas',
        'E-commerce': 'lojas online que querem recuperar carrinhos e aumentar vendas',
        'Imobiliário': 'imobiliárias e corretores que precisam de follow-up automático',
        'Indústria': 'indústrias que buscam automatizar vendas B2B',
        'Saúde': 'clínicas e consultórios que querem lotar a agenda',
        'Serviços': 'prestadores de serviço que precisam de mais clientes',
        'Tecnologia': 'empresas tech que querem escalar vendas com IA',
        'Varejo': 'lojas que querem vender mais pelo WhatsApp'
    };

    // DOM Elements
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const inputWrapper = document.getElementById('input-wrapper');
    const optionsWrapper = document.getElementById('options-wrapper');
    const selectWrapper = document.getElementById('select-wrapper');
    const selectInput = document.getElementById('select-input');

    // Initialize
    function init() {
        sendBtn.addEventListener('click', handleSend);
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSend();
        });
        selectInput.addEventListener('change', handleSelectChange);

        // Start conversation
        setTimeout(() => {
            showInitialMessage();
        }, 500);
    }

    // Get greeting based on time
    function getGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return 'Bom dia';
        if (hour < 18) return 'Boa tarde';
        return 'Boa noite';
    }

    // Show initial message
    async function showInitialMessage() {
        const greeting = getGreeting();

        try {
            // Generate initial message with AI
            const prompt = `Cumprimente o visitante com "${greeting}" e se apresente como Maya da NeoSale AI. Explique brevemente que vai criar um diagnóstico personalizado para automatizar vendas no WhatsApp. Termine pedindo o WhatsApp do visitante para facilitar a comunicação. Não mencione telefone, apenas WhatsApp.`;
            const message = await callOpenAI(prompt);
            await addBotMessage(message);
        } catch (error) {
            // Fallback message
            const message = `${greeting}! Sou a <strong>Maya</strong>, assistente virtual da <strong>NeoSale AI</strong>. Vou criar um diagnóstico personalizado para sua empresa - focado em <strong>automatizar vendas</strong>, <strong>qualificar leads</strong> e <strong>multiplicar seus resultados</strong> no WhatsApp.

Para começar, me passa seu WhatsApp? 😊`;
            await addBotMessage(message);
        }

        // Show input after messages are done
        showInput('phone', '(11) 99999-9999');
        scrollToBottom();
        userInput.focus();
    }

    // Split long text into smaller messages
    function splitTextIntoMessages(text) {
        // Split by sentences or line breaks
        const maxLength = 150;
        const parts = [];
        
        // First split by double line breaks (paragraphs)
        const paragraphs = text.split(/\n\n+/);
        
        for (const paragraph of paragraphs) {
            if (paragraph.length <= maxLength) {
                parts.push(paragraph.trim());
            } else {
                // Split by sentences
                const sentences = paragraph.split(/(?<=[.!?])\s+/);
                let currentPart = '';
                
                for (const sentence of sentences) {
                    if ((currentPart + ' ' + sentence).length <= maxLength) {
                        currentPart = currentPart ? currentPart + ' ' + sentence : sentence;
                    } else {
                        if (currentPart) parts.push(currentPart.trim());
                        currentPart = sentence;
                    }
                }
                if (currentPart) parts.push(currentPart.trim());
            }
        }
        
        return parts.filter(p => p.length > 0);
    }

    // Add bot message with typing effect
    async function addBotMessage(text, showTyping = true) {
        // Hide input while bot is typing
        showInput('none');
        
        const messages = splitTextIntoMessages(text);
        
        for (let i = 0; i < messages.length; i++) {
            await showTypingAndMessage(messages[i]);
            
            // Delay between messages - longer for longer messages
            if (i < messages.length - 1) {
                const delayTime = Math.min(500 + messages[i].length * 5, 1500);
                await new Promise(resolve => setTimeout(resolve, delayTime));
            }
        }
    }

    // Show typing indicator then message
    function showTypingAndMessage(text) {
        return new Promise(resolve => {
            const typingDiv = document.createElement('div');
            typingDiv.className = 'message message-bot typing-message';
            typingDiv.innerHTML = `
                <div class="bot-avatar">
                    <img src="maya.jpeg" alt="Maya">
                </div>
                <div class="bot-content">
                    <div class="typing-indicator">
                        <span></span><span></span><span></span>
                    </div>
                </div>
            `;
            chatMessages.appendChild(typingDiv);
            scrollToBottom();

            // Typing time proportional to message length
            const typingTime = Math.min(1000 + text.length * 15, 3000);
            
            setTimeout(() => {
                typingDiv.remove();
                appendBotMessage(text);
                resolve();
            }, typingTime);
        });
    }

    function appendBotMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message message-bot';
        messageDiv.innerHTML = `
            <div class="bot-avatar">
                <img src="maya.jpeg" alt="Maya">
            </div>
            <div class="bot-content">
                <div class="bot-text">${text}</div>
            </div>
        `;
        chatMessages.appendChild(messageDiv);
        scrollToBottom();
    }

    // Add user message
    function addUserMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message message-user';
        messageDiv.innerHTML = `<div class="user-bubble">${text}</div>`;
        chatMessages.appendChild(messageDiv);
        scrollToBottom();
    }

    // Scroll to bottom
    function scrollToBottom() {
        setTimeout(() => {
            window.scrollTo({
                top: document.body.scrollHeight,
                behavior: 'smooth'
            });
        }, 100);
    }

    // Show input based on type
    function showInput(type, placeholder = '', options = []) {
        const chatInputArea = document.getElementById('chat-input-area');
        inputWrapper.style.display = 'none';
        optionsWrapper.style.display = 'none';
        selectWrapper.style.display = 'none';

        if (type === 'none') {
            chatInputArea.style.display = 'none';
            return;
        }

        // Show the input area container
        chatInputArea.style.display = 'block';

        switch (type) {
            case 'text':
            case 'email':
            case 'phone':
                inputWrapper.style.display = 'flex';
                userInput.type = type === 'phone' ? 'tel' : type;
                userInput.placeholder = placeholder;
                userInput.value = '';
                userInput.focus();
                break;
            case 'options':
                optionsWrapper.style.display = 'flex';
                optionsWrapper.innerHTML = options.map(opt =>
                    `<button class="option-btn" data-value="${opt}">${opt}</button>`
                ).join('');
                optionsWrapper.querySelectorAll('.option-btn').forEach(btn => {
                    btn.addEventListener('click', () => handleOptionClick(btn.dataset.value));
                });
                break;
            case 'select':
                selectWrapper.style.display = 'block';
                selectInput.innerHTML = '<option value="">Selecione o segmento da sua empresa</option>' +
                    options.map(opt => `<option value="${opt}">${opt}</option>`).join('');
                break;
            case 'calendar':
                showCalendar();
                break;
            case 'confirmation':
                showConfirmation();
                break;
        }
    }

    // Handle send button
    function handleSend() {
        const value = userInput.value.trim();
        if (!value) return;

        // Check if we're updating a field for existing lead
        if (state.currentFieldToUpdate) {
            addUserMessage(value);
            showInput('none');
            handleFieldUpdateValue(value);
            return;
        }

        processUserInput(value);
    }

    // Handle option click
    async function handleOptionClick(value) {
        // Check for existing lead confirmation flow
        if (state.awaitingConfirmation) {
            addUserMessage(value);
            showInput('none');
            handleExistingLeadConfirmation(value);
            return;
        }

        // Check for field update selection
        if (state.updatingExistingLead && !state.currentFieldToUpdate) {
            addUserMessage(value);
            showInput('none');
            handleFieldUpdateSelection(value);
            return;
        }

        // Check for more updates response
        if (state.awaitingMoreUpdates) {
            addUserMessage(value);
            showInput('none');
            state.awaitingMoreUpdates = false;
            state.currentFieldToUpdate = null;

            if (value === 'Sim, corrigir outro') {
                state.updatingExistingLead = true;
                await addBotMessage('O que você gostaria de corrigir?');
                showInput('options', '', ['Nome', 'Email', 'Empresa', 'Cargo', 'Faturamento', 'Colaboradores', 'Tudo está errado']);
                scrollToBottom();
            } else {
                state.updatingExistingLead = false;
                await addBotMessage('Ótimo! Vamos continuar.');
                skipToNextEmptyField();
            }
            return;
        }

        processUserInput(value);
    }

    // Handle select change
    function handleSelectChange() {
        const value = selectInput.value;
        if (value) {
            processUserInput(value);
        }
    }

    // Process user input
    async function processUserInput(value) {
        const currentStep = STEPS[state.step];

        // Validate input
        if (!await validateInput(currentStep.field, value)) {
            return;
        }

        // Add user message
        addUserMessage(value);

        // Store data
        state.data[currentStep.field] = value;

        // Early lead registration after telefone is collected
        if (currentStep.field === 'telefone' && !state.leadRegistered) {
            await registerEarlyLead();

            // If existing lead found (409), show confirmation flow
            if (state.existingLead && state.leadData) {
                showInput('none');
                setTimeout(() => {
                    showExistingLeadConfirmation();
                }, 300);
                return;
            }
        }

        // Update lead with new field data via PUT (for fields after telefone)
        if (state.leadId && currentStep.field !== 'nome' && currentStep.field !== 'telefone') {
            await updateLeadField(currentStep.field, value);
        }


        // Hide current input
        showInput('none');

        // Move to next step
        state.step++;

        // Generate AI response and show next step
        setTimeout(async () => {
            await showNextStep();
        }, 300);
    }

    // Update a single field on the lead
    async function updateLeadField(field, value) {
        if (!state.leadId) return;

        // Map form fields to API fields
        const fieldMapping = {
            email: 'email',
            empresa: 'empresa',
            segmento: 'segmento',
            cargo: 'cargo',
            faturamento: 'faturamento',
            colaboradores: 'numero_funcionarios'
        };

        const apiField = fieldMapping[field];
        if (!apiField) return;

        let apiValue = value;

        // Convert colaboradores to numeric value (faturamento is string, no conversion needed)
        if (field === 'colaboradores') {
            apiValue = convertColaboradoresToNumber(value);
        }

        try {
            await updateLead({ [apiField]: apiValue });
            console.log(`Campo ${field} atualizado no lead`);
        } catch (error) {
            console.error(`Erro ao atualizar campo ${field}:`, error);
        }
    }

    // Convert colaboradores string to numeric value
    function convertColaboradoresToNumber(colaboradores) {
        const mapping = {
            '1 a 5': 3,
            '6 a 10': 8,
            '11 a 20': 15,
            '20 a 50': 35,
            '50 a 100': 75,
            '100 a 300': 200,
            '300+': 400
        };
        return mapping[colaboradores] || 1;
    }

    // Convert numero_funcionarios to display string
    function convertColaboradoresFromNumber(value) {
        const num = parseInt(value);
        if (num <= 5) return '1 a 5';
        if (num <= 10) return '6 a 10';
        if (num <= 20) return '11 a 20';
        if (num <= 50) return '20 a 50';
        if (num <= 100) return '50 a 100';
        if (num <= 300) return '100 a 300';
        return '300+';
    }

    // Show confirmation for existing lead
    async function showExistingLeadConfirmation() {
        const lead = state.leadData;
        const firstName = lead.nome ? lead.nome.split(' ')[0] : 'você';

        // Convert colaboradores from API value to display string (faturamento is already string)
        const colaboradoresDisplay = lead.numero_funcionarios ? convertColaboradoresFromNumber(lead.numero_funcionarios) : null;

        let confirmationRows = '';

        // Only show fields that have values
        if (lead.nome) {
            confirmationRows += `
    <div class="confirmation-row"><strong>Nome:</strong> ${lead.nome}</div>`;
        }
        if (lead.telefone) {
            confirmationRows += `
    <div class="confirmation-row"><strong>Telefone:</strong> ${lead.telefone}</div>`;
        }
        if (lead.email) {
            confirmationRows += `
    <div class="confirmation-row"><strong>Email:</strong> ${lead.email}</div>`;
        }
        if (lead.empresa) {
            confirmationRows += `
    <div class="confirmation-row"><strong>Empresa:</strong> ${lead.empresa}</div>`;
        }
        if (lead.cargo) {
            confirmationRows += `
    <div class="confirmation-row"><strong>Cargo:</strong> ${lead.cargo}</div>`;
        }
        if (lead.faturamento) {
            confirmationRows += `
    <div class="confirmation-row"><strong>Faturamento:</strong> ${lead.faturamento}</div>`;
        }
        if (colaboradoresDisplay) {
            confirmationRows += `
    <div class="confirmation-row"><strong>Colaboradores:</strong> ${colaboradoresDisplay}</div>`;
        }

        let message = `Opa, ${firstName}! Encontrei seus dados aqui na nossa base. Deixa eu confirmar se está tudo certo:

<div class="lead-confirmation-card">${confirmationRows}
</div>

Esses dados estão corretos?`;

        await addBotMessage(message);

        showInput('options', '', ['Sim, estão corretos!', 'Preciso atualizar alguns dados']);
        state.awaitingConfirmation = true;
        scrollToBottom();
    }

    // Handle existing lead confirmation response
    async function handleExistingLeadConfirmation(response) {
        state.awaitingConfirmation = false;

        if (response === 'Sim, estão corretos!') {
            // Data is correct, skip to fields not filled
            await addBotMessage('Perfeito! Vamos continuar de onde paramos.');

            // Find next step that needs data
            skipToNextEmptyField();
        } else {
            // User wants to update data
            state.updatingExistingLead = true;
            state.fieldsToUpdate = {};
            await addBotMessage('Sem problemas! Vamos atualizar seus dados. O que você gostaria de corrigir?');

            showInput('options', '', ['Nome', 'Email', 'Empresa', 'Cargo', 'Faturamento', 'Colaboradores', 'Tudo está errado']);
            scrollToBottom();
        }
    }

    // Handle field update selection
    async function handleFieldUpdateSelection(field) {
        if (field === 'Tudo está errado') {
            // Reset but keep phone number (never change phone)
            const telefone = state.data.telefone;
            state.step = 1; // Start from nome (step 1), skip telefone (step 0)
            state.existingLead = false;
            state.updatingExistingLead = false;
            state.data.telefone = telefone; // Preserve phone
            await addBotMessage('Ok, vamos recomeçar! Qual é o seu nome completo?');
            showInput('text', 'Digite seu nome completo...');
            scrollToBottom();
            return;
        }

        const fieldMap = {
            'Nome': 'nome',
            'Email': 'email',
            'Empresa': 'empresa',
            'Cargo': 'cargo',
            'Faturamento': 'faturamento',
            'Colaboradores': 'colaboradores'
        };

        state.currentFieldToUpdate = fieldMap[field];

        // For faturamento and colaboradores, show select/options instead of text input
        if (field === 'Faturamento') {
            await addBotMessage('Certo! Qual é o faturamento anual correto da empresa?');
            showInput('select', 'Selecione o faturamento anual', ['Até R$500 mil/ano', 'R$500 mil a R$1 milhão/ano', 'R$1 a R$5 milhões/ano', 'R$5 a R$10 milhões/ano', 'R$10 a R$50 milhões/ano', 'R$50 a R$100 milhões/ano', 'Acima de R$100 milhões/ano', 'Ainda não faturo']);
            scrollToBottom();
            return;
        }

        if (field === 'Colaboradores') {
            await addBotMessage('Certo! Quantos colaboradores a empresa possui?');
            showInput('options', '', ['1 a 5', '6 a 10', '11 a 20', '20 a 50', '50 a 100', '100 a 300', '300+']);
            scrollToBottom();
            return;
        }

        await addBotMessage(`Certo! Qual é o seu ${field.toLowerCase()} correto?`);

        const placeholder = {
            'Nome': 'Digite seu nome completo...',
            'Email': 'seu@email.com',
            'Empresa': 'Nome da sua empresa...',
            'Cargo': 'Seu cargo...'
        };
        showInput(field === 'Email' ? 'email' : 'text', placeholder[field]);
        scrollToBottom();
    }

    // Handle field update value
    async function handleFieldUpdateValue(value) {
        const field = state.currentFieldToUpdate;

        // Validate if email
        if (field === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                await addBotMessage('Por favor, digite um e-mail válido.');
                showInput('email', 'seu@email.com');
                scrollToBottom();
                return;
            }
        }

        // Update the field
        state.fieldsToUpdate[field] = value;
        state.data[field] = value;

        // Update via PUT with proper field mapping and conversion
        let apiField = field;
        let apiValue = value;

        if (field === 'colaboradores') {
            apiField = 'numero_funcionarios';
            apiValue = convertColaboradoresToNumber(value);
        }
        // faturamento is string, no conversion needed

        await updateLead({ [apiField]: apiValue });

        await addBotMessage(`Pronto! ${field.charAt(0).toUpperCase() + field.slice(1)} atualizado. Deseja corrigir mais algum dado?`);

        showInput('options', '', ['Sim, corrigir outro', 'Não, continuar']);
        scrollToBottom();

        state.awaitingMoreUpdates = true;
    }

    // Skip to next empty field
    function skipToNextEmptyField() {
        const lead = state.leadData;

        // Check which fields are already filled
        if (lead.email) state.data.email = lead.email;
        if (lead.empresa) state.data.empresa = lead.empresa;
        if (lead.segmento) state.data.segmento = lead.segmento;
        if (lead.cargo) state.data.cargo = lead.cargo;
        if (lead.faturamento) state.data.faturamento = lead.faturamento; // faturamento is string
        if (lead.numero_funcionarios) state.data.colaboradores = convertColaboradoresFromNumber(lead.numero_funcionarios);

        // Find first empty required field starting from email (step 2)
        const fieldsToCheck = [
            { step: 2, field: 'email', value: state.data.email },
            { step: 3, field: 'empresa', value: state.data.empresa },
            { step: 4, field: 'segmento', value: state.data.segmento },
            { step: 5, field: 'cargo', value: state.data.cargo },
            { step: 6, field: 'faturamento', value: state.data.faturamento },
            { step: 7, field: 'colaboradores', value: state.data.colaboradores }
        ];

        for (const check of fieldsToCheck) {
            if (!check.value) {
                state.step = check.step;
                setTimeout(async () => {
                    await showNextStep();
                }, 300);
                return;
            }
        }

        // All fields filled, go to calendar
        state.step = 8;
        setTimeout(async () => {
            await showNextStep();
        }, 300);
    }

    // Register lead early with nome and telefone
    async function registerEarlyLead() {
        const { nome, telefone } = state.data;
        const phoneClean = telefone.replace(/\D/g, '');
        const phoneFormatted = phoneClean.startsWith('55') ? phoneClean : '55' + phoneClean;
        state.phoneFormatted = phoneFormatted;

        const payload = {
            nome: nome,
            telefone: phoneFormatted,
            origem: 'neosale-lp-ai',
            qualificacao: 'Novo'
        };

        try {
            const response = await fetch(CONFIG.API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'cliente_id': CONFIG.CLIENTE_ID
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.status === 409) {
                // Lead already exists - fetch by phone
                await fetchLeadByPhone(phoneFormatted);
                state.existingLead = true;
            } else if (response.ok && data.success !== false) {
                state.leadRegistered = true;
                state.leadId = data.id || data.lead_id || data.data?.id || null;
                // Also fetch full lead data to store in localStorage
                await fetchLeadByPhone(phoneFormatted);
                console.log('Lead registrado com sucesso:', data);
            }
        } catch (error) {
            console.error('Erro ao registrar lead inicial:', error);
        }
    }

    // Fetch lead by phone number
    async function fetchLeadByPhone(telefone) {
        try {
            const response = await fetch(`${CONFIG.API_ENDPOINT.replace('/leads', '')}/leads/telefone/${telefone}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'cliente_id': CONFIG.CLIENTE_ID
                }
            });

            const result = await response.json();

            if (response.ok && result.success && result.data) {
                state.leadId = result.data.id;
                state.leadData = result.data;
                state.leadRegistered = true;

                // Store in localStorage
                localStorage.setItem('neosale_lead', JSON.stringify(result.data));
                console.log('Lead data stored in localStorage:', result.data);

                // Pre-fill state.data with existing lead info
                if (result.data.nome) state.data.nome = result.data.nome;
                if (result.data.email) state.data.email = result.data.email;
                if (result.data.empresa) state.data.empresa = result.data.empresa;
                if (result.data.cargo) state.data.cargo = result.data.cargo;
                if (result.data.segmento) state.data.segmento = result.data.segmento;
            }
        } catch (error) {
            console.error('Erro ao buscar lead por telefone:', error);
        }
    }

    // Update lead via PUT
    async function updateLead(fieldsToUpdate) {
        if (!state.leadId) {
            console.error('No lead ID to update');
            return false;
        }

        try {
            const response = await fetch(`${CONFIG.API_ENDPOINT}/${state.leadId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'cliente_id': CONFIG.CLIENTE_ID
                },
                body: JSON.stringify(fieldsToUpdate)
            });

            const data = await response.json();

            if (response.ok) {
                console.log('Lead atualizado com sucesso:', data);
                // Update localStorage
                const storedLead = JSON.parse(localStorage.getItem('neosale_lead') || '{}');
                Object.assign(storedLead, fieldsToUpdate);
                localStorage.setItem('neosale_lead', JSON.stringify(storedLead));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Erro ao atualizar lead:', error);
            return false;
        }
    }

    // Validate input
    async function validateInput(field, value) {
        switch (field) {
            case 'nome':
                if (value.length < 2) {
                    await addBotMessage('Por favor, digite seu nome completo.');
                    showInput('text', 'Digite seu nome completo...');
                    scrollToBottom();
                    return false;
                }
                return true;
            case 'telefone':
                const phone = value.replace(/\D/g, '');
                if (phone.length < 10) {
                    await addBotMessage('Por favor, digite um telefone válido com DDD.');
                    showInput('phone', '(11) 99999-9999');
                    scrollToBottom();
                    return false;
                }
                return true;
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    await addBotMessage('Por favor, digite um e-mail válido.');
                    showInput('email', 'seu@email.com');
                    scrollToBottom();
                    return false;
                }
                return true;
            default:
                return true;
        }
    }

    // Show next step
    async function showNextStep() {
        if (state.step >= STEPS.length) {
            await submitLead();
            return;
        }

        // Skip phone step if already filled (never ask for phone again)
        if (STEPS[state.step].field === 'telefone' && state.data.telefone) {
            state.step++;
            await showNextStep();
            return;
        }

        const currentStep = STEPS[state.step];
        const response = await generateAIResponse(currentStep.field);

        await addBotMessage(response);

        // For calendar, show it after the message
        if (currentStep.type === 'calendar') {
            showCalendar();
        } else {
            showInput(currentStep.type, currentStep.placeholder || '', currentStep.options || []);
        }
        scrollToBottom();
    }

    // Generate AI response using GPT-4o-mini
    async function generateAIResponse(nextField) {
        const { nome, telefone, email, empresa, segmento, cargo, faturamento, colaboradores } = state.data;
        const firstName = nome ? nome.split(' ')[0] : '';

        // Special cases
        if (nextField === 'agendamento') {
            return await generateSchedulingMessage();
        }
        if (nextField === 'confirmacao') {
            return '';
        }

        // Build context for the AI
        const fieldPrompts = {
            nome: `O lead acabou de informar o telefone. Agora peça o nome completo dele de forma simpática.`,
            email: `O lead ${firstName} informou o nome. Agora peça o email dele.`,
            empresa: `O lead ${firstName} informou o email. Agora pergunte qual é a empresa dele.`,
            segmento: `O lead ${firstName} trabalha na empresa "${empresa}". Elogie brevemente o nome da empresa e pergunte qual é o segmento de atuação.`,
            cargo: `O lead ${firstName} trabalha na empresa "${empresa}" do segmento "${segmento}". Agora pergunte qual é o cargo dele na empresa.`,
            faturamento: `O lead ${firstName} é ${cargo} na empresa "${empresa}". Elogie brevemente a posição estratégica dele e pergunte qual é o faturamento anual da empresa.`,
            colaboradores: `O lead ${firstName} informou que a empresa fatura "${faturamento}". Estamos quase finalizando! Pergunte quantos colaboradores a empresa possui.`
        };

        const userPrompt = fieldPrompts[nextField] || `Peça o próximo dado: ${nextField}`;

        try {
            const response = await callOpenAI(userPrompt);
            return response;
        } catch (error) {
            console.error('Erro ao gerar resposta AI:', error);
            // Fallback responses
            const fallbacks = {
                nome: `Ótimo! Qual é o seu nome completo?`,
                email: `Show, ${firstName}! Me passa seu email?`,
                empresa: `Ótimo! Qual o nome da sua empresa?`,
                segmento: `Legal! Qual o segmento da ${empresa}?`,
                cargo: `E qual é o seu cargo na ${empresa}?`,
                faturamento: `Qual é o faturamento anual da empresa?`,
                colaboradores: `Quantos colaboradores a empresa possui?`
            };
            return fallbacks[nextField] || 'Vamos continuar...';
        }
    }

    // Show typing indicator
    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message message-bot typing-message';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = `
            <div class="bot-avatar">
                <img src="maya.jpeg" alt="Maya">
            </div>
            <div class="bot-content">
                <div class="typing-indicator">
                    <span></span><span></span><span></span>
                </div>
            </div>
        `;
        chatMessages.appendChild(typingDiv);
        scrollToBottom();
        return typingDiv;
    }

    // Hide typing indicator
    function hideTypingIndicator() {
        const typingDiv = document.getElementById('typing-indicator');
        if (typingDiv) {
            typingDiv.remove();
        }
    }

    // Call OpenAI API
    async function callOpenAI(userMessage) {
        // Show typing indicator while waiting for API
        const typingIndicator = showTypingIndicator();

        try {
            // Add to conversation history
            state.conversationHistory.push({
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
                        ...state.conversationHistory
                    ],
                    max_tokens: 150,
                    temperature: 0.7
                })
            });

            // Hide typing indicator
            hideTypingIndicator();

            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.status}`);
            }

            const data = await response.json();
            let assistantMessage = data.choices[0].message.content;

            // Remove markdown formatting
            assistantMessage = removeMarkdown(assistantMessage);

            // Add assistant response to history
            state.conversationHistory.push({
                role: 'assistant',
                content: assistantMessage
            });

            return assistantMessage;
        } catch (error) {
            // Hide typing indicator on error
            hideTypingIndicator();
            throw error;
        }
    }

    // Remove markdown formatting from text
    function removeMarkdown(text) {
        return text
            // Convert **text** to <strong>text</strong>
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            // Convert *text* to <em>text</em>
            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
            // Remove # headers
            .replace(/^#{1,6}\s+/gm, '')
            // Remove code blocks
            .replace(/```[\s\S]*?```/g, '')
            // Remove inline code
            .replace(/`([^`]+)`/g, '$1')
            // Remove bullet points
            .replace(/^[\s]*[-*+]\s+/gm, '• ')
            // Clean up extra whitespace
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }

    // Generate scheduling message with company analysis
    async function generateSchedulingMessage() {
        const { nome, empresa, segmento, cargo, faturamento, colaboradores } = state.data;
        const firstName = nome.split(' ')[0];

        // Show typing indicator while analyzing
        showTypingIndicator();

        try {
            // Use GPT-4o-mini to analyze the company and generate personalized message
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

            // Hide typing indicator
            hideTypingIndicator();

            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.status}`);
            }

            const data = await response.json();
            return removeMarkdown(data.choices[0].message.content);

        } catch (error) {
            // Hide typing indicator on error
            hideTypingIndicator();

            console.error('Erro ao gerar análise da empresa:', error);
            // Fallback message - personalizado sem valores fixos
            return `Show, ${firstName}! Analisando o perfil da <strong>${empresa}</strong> no segmento de <strong>${segmento}</strong>, identificamos oportunidades significativas de automação.

Com ${colaboradores} colaboradores e seu porte de faturamento, empresas similares costumam perder até 40% dos leads por demora no atendimento via WhatsApp. A NeoSale pode mudar isso.

Temos apenas três vagas para diagnósticos personalizados esta semana - onde vamos calcular exatamente o potencial de ganho para a ${empresa}.

<strong>Agende abaixo o melhor dia para falar com a nossa equipe.</strong>`;
        }
    }

    // Show calendar
    function showCalendar() {
        const calendarHTML = generateCalendarHTML();

        const calendarDiv = document.createElement('div');
        calendarDiv.className = 'message message-bot';
        calendarDiv.innerHTML = `
            <div class="bot-avatar">
                <img src="maya.jpeg" alt="Maya">
            </div>
            <div class="bot-content">
                ${calendarHTML}
            </div>
        `;
        chatMessages.appendChild(calendarDiv);
        scrollToBottom();

        // Add calendar event listeners
        setupCalendarEvents();
    }

    // Generate calendar HTML
    function generateCalendarHTML() {
        const now = new Date();
        const month = now.toLocaleString('pt-BR', { month: 'long' });
        const year = now.getFullYear();

        const daysInMonth = new Date(year, now.getMonth() + 1, 0).getDate();
        const firstDay = new Date(year, now.getMonth(), 1).getDay();

        let daysHTML = '';
        const dayNames = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

        dayNames.forEach(day => {
            daysHTML += `<div class="calendar-day-header">${day}</div>`;
        });

        for (let i = 0; i < firstDay; i++) {
            daysHTML += '<div class="calendar-day disabled"></div>';
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, now.getMonth(), day);
            const dayOfWeek = date.getDay();
            // Disable: past days, weekends (Saturday=6, Sunday=0)
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isPast = date < new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const isDisabled = isPast || isWeekend;
            const dayClass = isDisabled ? 'calendar-day disabled' : 'calendar-day';
            daysHTML += `<div class="${dayClass}" data-date="${year}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}">${day}</div>`;
        }

        return `
            <div class="calendar-container" id="calendar-container">
                <div class="calendar-header">
                    <h3>${month} ${year}</h3>
                </div>
                <div class="calendar-grid">
                    ${daysHTML}
                </div>
                <div class="time-slots" id="time-slots" style="display: none;"></div>
                <button class="confirm-btn" id="calendar-confirm-btn" style="display: none; margin-top: 16px;">Continuar</button>
            </div>
        `;
    }

    // Setup calendar events
    function setupCalendarEvents() {
        const calendarDays = document.querySelectorAll('.calendar-day:not(.disabled)');
        const timeSlotsContainer = document.getElementById('time-slots');
        const confirmBtn = document.getElementById('calendar-confirm-btn');

        calendarDays.forEach(day => {
            day.addEventListener('click', () => {
                calendarDays.forEach(d => d.classList.remove('selected'));
                day.classList.add('selected');
                state.data.data_agendamento = day.dataset.date;

                // Show time slots
                showTimeSlots();
                
                // Scroll to bottom after selecting date
                scrollToBottom();
            });
        });

        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                if (state.data.data_agendamento && state.data.horario_agendamento) {
                    const dateStr = formatDate(state.data.data_agendamento);
                    addUserMessage(`${dateStr} às ${state.data.horario_agendamento}`);
                    state.step++;
                    setTimeout(() => showNextStep(), 300);
                }
            });
        }
    }

    // Show time slots
    function showTimeSlots() {
        const timeSlotsContainer = document.getElementById('time-slots');
        const confirmBtn = document.getElementById('calendar-confirm-btn');

        // Generate slots from 11:00 to 19:00 (every 30 min)
        const allSlots = [];
        for (let hour = 11; hour <= 19; hour++) {
            allSlots.push(`${String(hour).padStart(2, '0')}:00`);
            if (hour < 19) {
                allSlots.push(`${String(hour).padStart(2, '0')}:30`);
            }
        }

        // Filter slots if selected date is today
        const selectedDate = state.data.data_agendamento;
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        let availableSlots = allSlots;
        if (selectedDate === today) {
            const currentHour = now.getHours();
            const currentMinutes = now.getMinutes();

            availableSlots = allSlots.filter(slot => {
                const [slotHour, slotMinutes] = slot.split(':').map(Number);
                // Only show slots at least 30 minutes from now
                if (slotHour > currentHour) return true;
                if (slotHour === currentHour && slotMinutes > currentMinutes + 30) return true;
                return false;
            });
        }

        if (availableSlots.length === 0) {
            timeSlotsContainer.innerHTML = `
                <p style="grid-column: 1/-1; color: var(--text-gray); font-size: 0.875rem;">Não há horários disponíveis para hoje. Por favor, selecione outro dia.</p>
            `;
            timeSlotsContainer.style.display = 'block';
            confirmBtn.style.display = 'none';
            return;
        }

        timeSlotsContainer.innerHTML = `
            <h4 style="grid-column: 1/-1; margin-bottom: 8px; font-size: 0.875rem; color: var(--text-gray);">Horários Disponíveis</h4>
            ${availableSlots.map(slot => `<div class="time-slot" data-time="${slot}">${slot}</div>`).join('')}
        `;
        timeSlotsContainer.style.display = 'grid';

        timeSlotsContainer.querySelectorAll('.time-slot').forEach(slot => {
            slot.addEventListener('click', () => {
                timeSlotsContainer.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
                slot.classList.add('selected');
                state.data.horario_agendamento = slot.dataset.time;
                confirmBtn.style.display = 'block';
            });
        });
    }

    // Format date
    function formatDate(dateStr) {
        const [year, month, day] = dateStr.split('-');
        const date = new Date(year, month - 1, day);
        const weekday = date.toLocaleString('pt-BR', { weekday: 'long' });
        return `${day} de ${date.toLocaleString('pt-BR', { month: 'long' })}, ${year}`;
    }

    // Show confirmation
    function showConfirmation() {
        const { nome, email, telefone, empresa, segmento, cargo, data_agendamento, horario_agendamento } = state.data;
        const dateFormatted = formatDate(data_agendamento);

        const confirmationHTML = `
            <div class="confirmation-modal">
                <h3>Confirmar Agendamento</h3>
                <p>Verifique os dados e confirme sua call</p>
                
                <div class="confirmation-details">
                    <div class="confirmation-item">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>${dateFormatted} • ${horario_agendamento}</span>
                    </div>
                    <div class="confirmation-item">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>${nome}</span>
                    </div>
                    <div class="confirmation-item">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span>${email}</span>
                    </div>
                    <div class="confirmation-item">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span>+${telefone}</span>
                    </div>
                    <div class="confirmation-item">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span>${empresa}</span>
                    </div>
                    <div class="confirmation-item">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span>${cargo}</span>
                    </div>
                    <div class="confirmation-item">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <span>${segmento}</span>
                    </div>
                </div>

                <button class="confirm-btn" id="final-confirm-btn">Confirmar Agendamento</button>
            </div>
        `;

        const confirmDiv = document.createElement('div');
        confirmDiv.className = 'message message-bot';
        confirmDiv.innerHTML = `
            <div class="bot-avatar">
                <img src="maya.jpeg" alt="Maya">
            </div>
            <div class="bot-content">
                ${confirmationHTML}
            </div>
        `;
        chatMessages.appendChild(confirmDiv);
        scrollToBottom();

        document.getElementById('final-confirm-btn').addEventListener('click', () => {
            submitLead();
        });
    }

    // Submit lead to API (final update via PUT)
    async function submitLead() {
        const { nome, telefone, email, empresa, segmento, cargo, faturamento, colaboradores, data_agendamento, horario_agendamento } = state.data;

        const phoneClean = telefone.replace(/\D/g, '');
        const phoneFormatted = phoneClean.startsWith('55') ? phoneClean : '55' + phoneClean;

        const observacao = `Empresa: ${empresa} | Faturamento: ${faturamento} | Colaboradores: ${colaboradores} | Agendamento: ${data_agendamento} ${horario_agendamento}`;

        const payload = {
            nome: nome,
            telefone: phoneFormatted,
            email: email,
            empresa: empresa,
            segmento: segmento ? segmento.toLowerCase() : null,
            cargo: cargo ? cargo.toLowerCase() : null,
            observacao: observacao,
            status_agendamento: true
        };

        try {
            let response;
            let data;

            // If we have a lead ID, use PUT to update
            if (state.leadId) {
                response = await fetch(`${CONFIG.API_ENDPOINT}/${state.leadId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'cliente_id': CONFIG.CLIENTE_ID
                    },
                    body: JSON.stringify(payload)
                });
                data = await response.json();
                console.log('Lead atualizado via PUT:', data);
            } else {
                // Fallback to POST if no lead ID
                response = await fetch(CONFIG.API_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'cliente_id': CONFIG.CLIENTE_ID
                    },
                    body: JSON.stringify(payload)
                });
                data = await response.json();
            }

            if (!response.ok || data.success === false) {
                throw new Error(data.message || 'Erro ao enviar dados');
            }

            // Refresh lead data from API and update localStorage
            await refreshLeadData();

            // Send data to webhook
            await sendToWebhook();

            showSuccessScreen();

        } catch (error) {
            console.error('Erro:', error);
            addBotMessage(`Ops! ${error.message}. Por favor, tente novamente ou entre em contato conosco.`);
        }
    }

    // Refresh lead data from API and update localStorage
    async function refreshLeadData() {
        if (!state.phoneFormatted) return;

        try {
            const response = await fetch(`${CONFIG.API_ENDPOINT.replace('/leads', '')}/leads/telefone/${state.phoneFormatted}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'cliente_id': CONFIG.CLIENTE_ID
                }
            });

            const result = await response.json();

            if (response.ok && result.success && result.data) {
                localStorage.setItem('neosale_lead', JSON.stringify(result.data));
                state.leadData = result.data;
                console.log('Lead data refreshed in localStorage:', result.data);
            }
        } catch (error) {
            console.error('Erro ao atualizar dados do lead:', error);
        }
    }

    // Send data to webhook
    async function sendToWebhook() {
        const { nome, telefone, email, empresa, segmento, cargo, faturamento, colaboradores, data_agendamento, horario_agendamento } = state.data;

        const phoneClean = telefone.replace(/\D/g, '');
        const phoneFormatted = phoneClean.startsWith('55') ? phoneClean : '55' + phoneClean;

        const webhookPayload = {
            lead: {
                id: state.leadId,
                nome: nome,
                telefone: phoneFormatted,
                email: email,
                empresa: empresa,
                segmento: segmento,
                cargo: cargo,
                faturamento: faturamento,
                colaboradores: colaboradores
            },
            agendamento: {
                data: data_agendamento,
                horario: horario_agendamento,
                data_hora_completa: `${data_agendamento}T${horario_agendamento}:00`
            },
            origem: 'neosale-lp-ai',
            timestamp: new Date().toISOString()
        };

        try {
            const response = await fetch('https://project-n8n.ijend9.easypanel.host/webhook/lp-with-ai', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(webhookPayload)
            });

            if (response.ok) {
                console.log('Webhook enviado com sucesso');
            } else {
                console.error('Erro ao enviar webhook:', response.status);
            }
        } catch (error) {
            console.error('Erro ao enviar webhook:', error);
            // Don't throw - webhook failure shouldn't block the flow
        }
    }

    // Generate Google Calendar link for mobile
    function generateCalendarLink() {
        const [year, month, day] = state.data.data_agendamento.split('-');
        const [hours, minutes] = state.data.horario_agendamento.split(':');

        // Create start and end dates (1 hour meeting)
        const startDate = new Date(year, month - 1, day, hours, minutes);
        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // +1 hour

        // Format for Google Calendar (YYYYMMDDTHHmmss)
        const formatGoogleDate = (date) => {
            return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
        };

        const startStr = formatGoogleDate(startDate);
        const endStr = formatGoogleDate(endDate);

        const title = encodeURIComponent('Consultoria NeoSale AI - Automação de Vendas');
        const details = encodeURIComponent(`Reunião de diagnóstico com a equipe NeoSale AI para análise de automação de vendas no WhatsApp.

Participante: ${state.data.nome}
Empresa: ${state.data.empresa}

O link da reunião será enviado por email e WhatsApp.`);
        const location = encodeURIComponent('Online - Link será enviado');

        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&location=${location}`;
    }

    // Show success screen
    function showSuccessScreen() {
        const firstName = state.data.nome.split(' ')[0];
        const dateFormatted = formatDate(state.data.data_agendamento);
        const calendarLink = generateCalendarLink();

        chatMessages.innerHTML = `
            <div class="success-screen" style="padding: 0 12px;">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; margin-bottom: 12px;">
                    <h2 style="font-size: 1.25rem; margin: 0;">Obrigado, ${firstName}!</h2>
                </div>
                        
                <p style="color: var(--text-gray); font-size: 0.875rem; margin: 0;">Sua consultoria está confirmada</p>

                <div style="background: rgba(6, 182, 212, 0.1); border-radius: 8px; padding: 10px; margin-bottom: 12px;">
                    <p style="font-size: 0.8125rem; color: var(--accent); margin: 0;">
                        📅 ${dateFormatted} às ${state.data.horario_agendamento}
                    </p>
                </div>
                
                <p style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 4px;">
                    Você receberá o link por <strong style="color: var(--accent);">email</strong> e <strong style="color: #25D366;">WhatsApp</strong>
                </p>
                
                <div class="countdown" id="countdown" style="font-size: 1.5rem; margin-bottom: 4px;">00:00:00:00</div>
                <p style="font-size: 0.625rem; color: var(--text-muted); margin-bottom: 4px;">dias : horas : min : seg</p>
                
                <div style="display: flex; justify-content: center; gap: 20px; margin-bottom: 12px;">
                    <div style="text-align: center;">
                        <div style="width: 36px; height: 36px; background: rgba(6, 182, 212, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 4px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="var(--accent)" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <p style="font-size: 0.625rem; color: var(--text-gray);">Diagnóstico</p>
                    </div>
                    <div style="text-align: center;">
                        <div style="width: 36px; height: 36px; background: rgba(6, 182, 212, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 4px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="var(--accent)" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <p style="font-size: 0.625rem; color: var(--text-gray);">Oportunidades</p>
                    </div>
                    <div style="text-align: center;">
                        <div style="width: 36px; height: 36px; background: rgba(6, 182, 212, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 4px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="var(--accent)" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <p style="font-size: 0.625rem; color: var(--text-gray);">Plano</p>
                    </div>
                </div>
                
                <div style="background: var(--bg-card); border-radius: 8px; padding: 10px; text-align: left;">
                    <h4 style="font-size: 0.75rem; margin-bottom: 8px;">Próximos passos</h4>
                    <div style="display: flex; align-items: flex-start; gap: 6px; margin-bottom: 6px;">
                        <span style="color: var(--success); font-size: 0.75rem;">✓</span>
                        <span style="font-size: 0.6875rem; color: var(--text-gray);">Reunião confirmada</span>
                    </div>
                    <div style="display: flex; align-items: flex-start; gap: 6px; margin-bottom: 6px;">
                        <span style="font-size: 0.75rem;">📧</span>
                        <span style="font-size: 0.6875rem; color: var(--text-gray);">Link enviado por email</span>
                    </div>
                    <div style="display: flex; align-items: flex-start; gap: 6px; margin-bottom: 6px;">
                        <span style="font-size: 0.75rem;">📱</span>
                        <span style="font-size: 0.6875rem; color: var(--text-gray);">Confirmação por WhatsApp</span>
                    </div>
                    <div style="display: flex; align-items: flex-start; gap: 6px;">
                        <span style="font-size: 0.75rem;">💡</span>
                        <span style="font-size: 0.6875rem; color: var(--text-gray);">Prepare seus desafios com IA</span>
                    </div>
                </div>
            </div>
        `;

        // Hide input area
        document.getElementById('chat-input-area').style.display = 'none';

        // Start countdown
        startCountdown();
    }

    // Start countdown
    function startCountdown() {
        const [year, month, day] = state.data.data_agendamento.split('-');
        const [hours, minutes] = state.data.horario_agendamento.split(':');
        const targetDate = new Date(year, month - 1, day, hours, minutes);

        function updateCountdown() {
            const now = new Date();
            const diff = targetDate - now;

            if (diff <= 0) {
                document.getElementById('countdown').textContent = '00:00:00:00';
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hrs = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const secs = Math.floor((diff % (1000 * 60)) / 1000);

            document.getElementById('countdown').textContent =
                `${String(days).padStart(2, '0')}:${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }

        updateCountdown();
        setInterval(updateCountdown, 1000);
    }

    // Phone mask for input
    userInput.addEventListener('input', function (e) {
        // Only apply phone mask when in telefone step AND not updating another field
        if (STEPS[state.step]?.field === 'telefone' && !state.currentFieldToUpdate) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 11) value = value.slice(0, 11);

            if (value.length > 0) {
                if (value.length <= 2) {
                    value = '(' + value;
                } else if (value.length <= 7) {
                    value = '(' + value.slice(0, 2) + ') ' + value.slice(2);
                } else {
                    value = '(' + value.slice(0, 2) + ') ' + value.slice(2, 7) + '-' + value.slice(7);
                }
            }
            e.target.value = value;
        }
    });

    // Scroll to bottom when input is focused (mobile keyboard)
    userInput.addEventListener('focus', function () {
        setTimeout(() => {
            scrollToBottom();
        }, 300);
    });

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
