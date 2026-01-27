import { CONFIG } from '../config';
import { convertColaboradoresToNumber } from './constants';

// Register lead early with telefone
// First tries GET to check if lead exists, only POSTs if not found
export async function registerEarlyLead(telefone) {
    const phoneClean = telefone.replace(/\D/g, '');
    const phoneFormatted = phoneClean.startsWith('55') ? phoneClean : '55' + phoneClean;

    try {
        // First, try to fetch existing lead by phone
        const existingLead = await fetchLeadByPhone(phoneFormatted);
        
        if (existingLead) {
            // Lead already exists, return it
            return { exists: true, lead: existingLead, phoneFormatted };
        }

        // Lead not found, create new one via POST
        const payload = {
            nome: '',
            telefone: phoneFormatted,
            origem: 'neosale-lp-maya',
            qualificacao: 'Novo'
        };

        const response = await fetch(CONFIG.API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'cliente_id': CONFIG.CLIENTE_ID
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok && data.success !== false) {
            const leadId = data.id || data.lead_id || data.data?.id || null;
            const leadData = await fetchLeadByPhone(phoneFormatted);
            return { exists: false, leadId, lead: leadData, phoneFormatted };
        }
        
        return { exists: false, leadId: null, lead: null, phoneFormatted };
    } catch (error) {
        console.error('Erro ao registrar lead inicial:', error);
        return { exists: false, leadId: null, lead: null, phoneFormatted };
    }
}

// Fetch lead by phone number
export async function fetchLeadByPhone(telefone) {
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
            localStorage.setItem('neosale_lead', JSON.stringify(result.data));
            return result.data;
        }
        return null;
    } catch (error) {
        console.error('Erro ao buscar lead por telefone:', error);
        return null;
    }
}

// Update lead via PUT
export async function updateLead(leadId, fieldsToUpdate) {
    if (!leadId) {
        console.error('No lead ID to update');
        return false;
    }

    try {
        const response = await fetch(`${CONFIG.API_ENDPOINT}/${leadId}`, {
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

// Update a single field on the lead
export async function updateLeadField(leadId, field, value) {
    if (!leadId) return;

    const fieldMapping = {
        nome: 'nome',
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
    if (field === 'colaboradores') {
        apiValue = convertColaboradoresToNumber(value);
    }

    try {
        await updateLead(leadId, { [apiField]: apiValue });
        console.log(`Campo ${field} atualizado no lead`);
    } catch (error) {
        console.error(`Erro ao atualizar campo ${field}:`, error);
    }
}

// Submit final lead data
export async function submitFinalLead(leadId, data) {
    const { nome, telefone, email, empresa, segmento, cargo, faturamento, colaboradores, data_agendamento, horario_agendamento } = data;

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
        let responseData;

        if (leadId) {
            response = await fetch(`${CONFIG.API_ENDPOINT}/${leadId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'cliente_id': CONFIG.CLIENTE_ID
                },
                body: JSON.stringify(payload)
            });
            responseData = await response.json();
            console.log('Lead atualizado via PUT:', responseData);
        } else {
            response = await fetch(CONFIG.API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'cliente_id': CONFIG.CLIENTE_ID
                },
                body: JSON.stringify(payload)
            });
            responseData = await response.json();
        }

        if (!response.ok || responseData.success === false) {
            throw new Error(responseData.message || 'Erro ao enviar dados');
        }

        // Refresh lead data
        await fetchLeadByPhone(phoneFormatted);

        return { success: true, data: responseData };
    } catch (error) {
        console.error('Erro:', error);
        return { success: false, error: error.message };
    }
}

// Send data to webhook
export async function sendToWebhook(leadId, data) {
    const { nome, telefone, email, empresa, segmento, cargo, faturamento, colaboradores, data_agendamento, horario_agendamento } = data;

    const phoneClean = telefone.replace(/\D/g, '');
    const phoneFormatted = phoneClean.startsWith('55') ? phoneClean : '55' + phoneClean;

    const webhookPayload = {
        lead: {
            id: leadId,
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
        origem: 'neosale-lp-maya',
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
    }
}
