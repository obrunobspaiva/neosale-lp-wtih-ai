import React, { useState, useEffect, useRef } from 'react';
import BotMessage from './components/BotMessage';
import UserMessage from './components/UserMessage';
import TypingIndicator from './components/TypingIndicator';
import ChatInput from './components/ChatInput';
import Calendar from './components/Calendar';
import Confirmation from './components/Confirmation';
import SuccessScreen from './components/SuccessScreen';
import ExistingLeadConfirmation from './components/ExistingLeadConfirmation';

import { STEPS, FIELD_PROMPTS, FALLBACK_RESPONSES, convertColaboradoresFromNumber, convertColaboradoresToNumber } from './utils/constants';
import { registerEarlyLead, updateLeadField, updateLead, submitFinalLead, sendToWebhook } from './utils/api';
import { callOpenAI, generateInitialMessage, generateSchedulingMessage } from './utils/openai';
import { validateInput, splitTextIntoMessages, formatDate } from './utils/helpers';

export default function App() {
    const [messages, setMessages] = useState([]);
    const [step, setStep] = useState(0);
    const [data, setData] = useState({
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
    });
    const [leadId, setLeadId] = useState(null);
    const [leadData, setLeadData] = useState(null);
    const [phoneFormatted, setPhoneFormatted] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [inputVisible, setInputVisible] = useState(false);
    const [inputType, setInputType] = useState('text');
    const [inputPlaceholder, setInputPlaceholder] = useState('');
    const [inputOptions, setInputOptions] = useState([]);
    const [showCalendar, setShowCalendar] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [conversationHistory, setConversationHistory] = useState([]);
    
    // Existing lead flow states
    const [existingLead, setExistingLead] = useState(false);
    const [showExistingLeadConfirm, setShowExistingLeadConfirm] = useState(false);
    const [updatingExistingLead, setUpdatingExistingLead] = useState(false);
    const [currentFieldToUpdate, setCurrentFieldToUpdate] = useState(null);
    const [awaitingMoreUpdates, setAwaitingMoreUpdates] = useState(false);

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping, showCalendar, showConfirmation]);

    // Initialize chat
    const initialized = useRef(false);
    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;
        
        const initChat = async () => {
            setIsTyping(true);
            const initialMessage = generateInitialMessage();
            await addBotMessages(initialMessage);
            setIsTyping(false);
            showInputForStep(0);
        };
        
        setTimeout(initChat, 500);
    }, []);

    const addBotMessages = async (text) => {
        const parts = splitTextIntoMessages(text);
        
        for (let i = 0; i < parts.length; i++) {
            setIsTyping(true);
            const typingTime = Math.min(1500 + parts[i].length * 20, 4000);
            await new Promise(resolve => setTimeout(resolve, typingTime));
            setIsTyping(false);
            setMessages(prev => [...prev, { type: 'bot', text: parts[i] }]);
            
            if (i < parts.length - 1) {
                const delayTime = Math.min(800 + parts[i].length * 8, 2500);
                await new Promise(resolve => setTimeout(resolve, delayTime));
            }
        }
    };

    const addUserMessage = (text) => {
        setMessages(prev => [...prev, { type: 'user', text }]);
    };

    const showInputForStep = (stepIndex) => {
        if (stepIndex >= STEPS.length) return;
        
        const currentStep = STEPS[stepIndex];
        
        if (currentStep.type === 'calendar') {
            setShowCalendar(true);
            setInputVisible(false);
        } else if (currentStep.type === 'confirmation') {
            setShowConfirmation(true);
            setInputVisible(false);
        } else {
            setInputType(currentStep.type);
            setInputPlaceholder(currentStep.placeholder || '');
            setInputOptions(currentStep.options || []);
            setInputVisible(true);
        }
    };

    const generateAIResponse = async (nextField) => {
        const { nome, empresa, segmento, cargo, faturamento } = data;
        const firstName = nome ? nome.split(' ')[0] : '';

        if (nextField === 'agendamento') {
            return await generateSchedulingMessage(data);
        }
        if (nextField === 'confirmacao') {
            return '';
        }

        const prompts = {
            nome: FIELD_PROMPTS.nome,
            email: FIELD_PROMPTS.email(firstName),
            empresa: FIELD_PROMPTS.empresa(firstName),
            segmento: FIELD_PROMPTS.segmento(firstName, empresa),
            cargo: FIELD_PROMPTS.cargo(firstName, empresa, segmento),
            faturamento: FIELD_PROMPTS.faturamento(firstName, empresa, cargo),
            colaboradores: FIELD_PROMPTS.colaboradores(firstName, faturamento)
        };

        const userPrompt = prompts[nextField] || `Peça o próximo dado: ${nextField}`;

        try {
            const response = await callOpenAI(userPrompt, conversationHistory);
            return response;
        } catch (error) {
            console.error('Erro ao gerar resposta AI:', error);
            const fallbacks = {
                nome: FALLBACK_RESPONSES.nome,
                email: FALLBACK_RESPONSES.email(firstName),
                empresa: FALLBACK_RESPONSES.empresa,
                segmento: FALLBACK_RESPONSES.segmento(empresa),
                cargo: FALLBACK_RESPONSES.cargo(empresa),
                faturamento: FALLBACK_RESPONSES.faturamento,
                colaboradores: FALLBACK_RESPONSES.colaboradores
            };
            return fallbacks[nextField] || 'Vamos continuar...';
        }
    };

    const showNextStep = async (newStep) => {
        if (newStep >= STEPS.length) {
            return;
        }

        // Skip phone step if already filled
        if (STEPS[newStep].field === 'telefone' && data.telefone) {
            showNextStep(newStep + 1);
            return;
        }

        const currentStep = STEPS[newStep];
        
        if (currentStep.field !== 'confirmacao') {
            setIsTyping(true);
            const response = await generateAIResponse(currentStep.field);
            await addBotMessages(response);
            setIsTyping(false);
        }

        showInputForStep(newStep);
    };

    const handleInputSubmit = async (value) => {
        // Handle field update for existing lead
        if (currentFieldToUpdate) {
            addUserMessage(value);
            setInputVisible(false);
            await handleFieldUpdateValue(value);
            return;
        }

        const currentStep = STEPS[step];

        // Validate input
        const validation = validateInput(currentStep.field, value);
        if (!validation.valid) {
            setIsTyping(true);
            await addBotMessages(validation.message);
            setIsTyping(false);
            showInputForStep(step);
            return;
        }

        addUserMessage(value);
        setInputVisible(false);

        // Update data
        const newData = { ...data, [currentStep.field]: value };
        setData(newData);

        // Register lead after telefone
        if (currentStep.field === 'telefone' && !leadId) {
            const result = await registerEarlyLead(value);
            setPhoneFormatted(result.phoneFormatted);
            
            if (result.exists && result.lead) {
                setLeadId(result.lead.id);
                setLeadData(result.lead);
                setExistingLead(true);
                
                // Pre-fill data from existing lead
                const prefilledData = { ...newData };
                if (result.lead.nome) prefilledData.nome = result.lead.nome;
                if (result.lead.email) prefilledData.email = result.lead.email;
                if (result.lead.empresa) prefilledData.empresa = result.lead.empresa;
                if (result.lead.cargo) prefilledData.cargo = result.lead.cargo;
                if (result.lead.segmento) prefilledData.segmento = result.lead.segmento;
                if (result.lead.faturamento) prefilledData.faturamento = result.lead.faturamento;
                if (result.lead.numero_funcionarios) {
                    prefilledData.colaboradores = convertColaboradoresFromNumber(result.lead.numero_funcionarios);
                }
                setData(prefilledData);
                
                setShowExistingLeadConfirm(true);
                return;
            } else if (result.leadId) {
                setLeadId(result.leadId);
                if (result.lead) {
                    setLeadData(result.lead);
                    // Pre-fill data
                    const prefilledData = { ...newData };
                    if (result.lead.nome) prefilledData.nome = result.lead.nome;
                    setData(prefilledData);
                }
            }
        }

        // Update lead field via API
        if (leadId && currentStep.field !== 'telefone') {
            await updateLeadField(leadId, currentStep.field, value);
        }

        // Move to next step
        const nextStep = step + 1;
        setStep(nextStep);
        await showNextStep(nextStep);
    };

    const handleExistingLeadConfirm = async () => {
        setShowExistingLeadConfirm(false);
        await addBotMessages('Perfeito! Vamos continuar de onde paramos.');
        skipToNextEmptyField();
    };

    const handleExistingLeadUpdate = async () => {
        setShowExistingLeadConfirm(false);
        setUpdatingExistingLead(true);
        await addBotMessages('Sem problemas! Vamos atualizar seus dados. O que você gostaria de corrigir?');
        setInputType('options');
        setInputOptions(['Nome', 'Email', 'Empresa', 'Cargo', 'Faturamento', 'Colaboradores', 'Tudo está errado']);
        setInputVisible(true);
    };

    const handleFieldUpdateSelection = async (field) => {
        addUserMessage(field);
        setInputVisible(false);

        if (field === 'Tudo está errado') {
            const telefone = data.telefone;
            setStep(1);
            setExistingLead(false);
            setUpdatingExistingLead(false);
            setData(prev => ({ ...prev, telefone }));
            await addBotMessages('Ok, vamos recomeçar! Qual é o seu nome completo?');
            setInputType('text');
            setInputPlaceholder('Digite seu nome completo...');
            setInputVisible(true);
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

        setCurrentFieldToUpdate(fieldMap[field]);

        if (field === 'Faturamento') {
            await addBotMessages('Certo! Qual é o faturamento anual correto da empresa?');
            setInputType('select');
            setInputOptions(['Até R$500 mil/ano', 'R$500 mil a R$1 milhão/ano', 'R$1 a R$5 milhões/ano', 'R$5 a R$10 milhões/ano', 'R$10 a R$50 milhões/ano', 'R$50 a R$100 milhões/ano', 'Acima de R$100 milhões/ano', 'Ainda não faturo']);
            setInputVisible(true);
            return;
        }

        if (field === 'Colaboradores') {
            await addBotMessages('Certo! Quantos colaboradores a empresa possui?');
            setInputType('options');
            setInputOptions(['1 a 5', '6 a 10', '11 a 20', '20 a 50', '50 a 100', '100 a 300', '300+']);
            setInputVisible(true);
            return;
        }

        await addBotMessages(`Certo! Qual é o seu ${field.toLowerCase()} correto?`);
        const placeholders = {
            'Nome': 'Digite seu nome completo...',
            'Email': 'seu@email.com',
            'Empresa': 'Nome da sua empresa...',
            'Cargo': 'Seu cargo...'
        };
        setInputType(field === 'Email' ? 'email' : 'text');
        setInputPlaceholder(placeholders[field]);
        setInputVisible(true);
    };

    const handleFieldUpdateValue = async (value) => {
        const field = currentFieldToUpdate;

        // Validate email
        if (field === 'email') {
            const validation = validateInput('email', value);
            if (!validation.valid) {
                await addBotMessages(validation.message);
                setInputType('email');
                setInputPlaceholder('seu@email.com');
                setInputVisible(true);
                return;
            }
        }

        // Update data
        setData(prev => ({ ...prev, [field]: value }));

        // Update via API
        let apiField = field;
        let apiValue = value;
        if (field === 'colaboradores') {
            apiField = 'numero_funcionarios';
            apiValue = convertColaboradoresToNumber(value);
        }
        await updateLead(leadId, { [apiField]: apiValue });

        const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
        await addBotMessages(`Pronto! ${fieldName} atualizado. Deseja corrigir mais algum dado?`);

        setCurrentFieldToUpdate(null);
        setAwaitingMoreUpdates(true);
        setInputType('options');
        setInputOptions(['Sim, corrigir outro', 'Não, continuar']);
        setInputVisible(true);
    };

    const handleMoreUpdatesResponse = async (response) => {
        addUserMessage(response);
        setInputVisible(false);
        setAwaitingMoreUpdates(false);

        if (response === 'Sim, corrigir outro') {
            setUpdatingExistingLead(true);
            await addBotMessages('O que você gostaria de corrigir?');
            setInputType('options');
            setInputOptions(['Nome', 'Email', 'Empresa', 'Cargo', 'Faturamento', 'Colaboradores', 'Tudo está errado']);
            setInputVisible(true);
        } else {
            setUpdatingExistingLead(false);
            await addBotMessages('Ótimo! Vamos continuar.');
            skipToNextEmptyField();
        }
    };

    const skipToNextEmptyField = () => {
        const fieldsToCheck = [
            { step: 2, field: 'email', value: data.email },
            { step: 3, field: 'empresa', value: data.empresa },
            { step: 4, field: 'segmento', value: data.segmento },
            { step: 5, field: 'cargo', value: data.cargo },
            { step: 6, field: 'faturamento', value: data.faturamento },
            { step: 7, field: 'colaboradores', value: data.colaboradores }
        ];

        for (const check of fieldsToCheck) {
            if (!check.value) {
                setStep(check.step);
                showNextStep(check.step);
                return;
            }
        }

        // All fields filled, go to calendar
        setStep(8);
        showNextStep(8);
    };

    const handleOptionClick = async (value) => {
        if (awaitingMoreUpdates) {
            await handleMoreUpdatesResponse(value);
            return;
        }

        if (updatingExistingLead && !currentFieldToUpdate) {
            await handleFieldUpdateSelection(value);
            return;
        }

        await handleInputSubmit(value);
    };

    const handleCalendarSelect = async (date, time) => {
        setShowCalendar(false);
        const newData = { ...data, data_agendamento: date, horario_agendamento: time };
        setData(newData);

        const dateStr = formatDate(date);
        addUserMessage(`${dateStr} às ${time}`);

        // Update lead with scheduling info
        if (leadId) {
            await updateLead(leadId, {
                data_agendamento: date,
                horario_agendamento: time
            });
        }

        const nextStep = step + 1;
        setStep(nextStep);
        setShowConfirmation(true);
    };

    const handleConfirmation = async () => {
        setConfirmLoading(true);

        const result = await submitFinalLead(leadId, data);

        if (result.success) {
            await sendToWebhook(leadId, data);
            setShowConfirmation(false);
            setShowSuccess(true);
        } else {
            setConfirmLoading(false);
            await addBotMessages(`Ops! ${result.error}. Por favor, tente novamente ou entre em contato conosco.`);
        }
    };

    // Custom input handler that routes to appropriate handler
    const handleInput = async (value) => {
        if (awaitingMoreUpdates || (updatingExistingLead && !currentFieldToUpdate)) {
            await handleOptionClick(value);
        } else {
            await handleInputSubmit(value);
        }
    };

    if (showSuccess) {
        return (
            <main>
                <div className="chat-container">
                    <div className="chat-messages">
                        <SuccessScreen data={data} />
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main>
            <div className="chat-container">
                <div className="chat-messages">
                    {messages.map((msg, idx) => (
                        msg.type === 'bot' 
                            ? <BotMessage key={idx} text={msg.text} />
                            : <UserMessage key={idx} text={msg.text} />
                    ))}
                    
                    {isTyping && <TypingIndicator />}
                    
                    {showExistingLeadConfirm && leadData && (
                        <ExistingLeadConfirmation 
                            lead={leadData}
                            onConfirm={handleExistingLeadConfirm}
                            onUpdate={handleExistingLeadUpdate}
                        />
                    )}
                    
                    {showCalendar && (
                        <Calendar onSelect={handleCalendarSelect} />
                    )}
                    
                    {showConfirmation && (
                        <Confirmation 
                            data={data} 
                            onConfirm={handleConfirmation}
                            loading={confirmLoading}
                        />
                    )}
                    
                    <div ref={messagesEndRef} />
                </div>

                <ChatInput
                    type={inputType}
                    placeholder={inputPlaceholder}
                    options={inputOptions}
                    onSubmit={handleInput}
                    visible={inputVisible}
                    currentField={STEPS[step]?.field}
                />
            </div>
        </main>
    );
}
