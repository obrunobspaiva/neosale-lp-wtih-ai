// Format date for display
export function formatDate(dateStr) {
    const [year, month, day] = dateStr.split('-');
    const date = new Date(year, month - 1, day);
    return `${day} de ${date.toLocaleString('pt-BR', { month: 'long' })}, ${year}`;
}

// Generate Google Calendar link
export function generateCalendarLink(data) {
    const [year, month, day] = data.data_agendamento.split('-');
    const [hours, minutes] = data.horario_agendamento.split(':');

    const startDate = new Date(year, month - 1, day, hours, minutes);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    const formatGoogleDate = (date) => {
        return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };

    const startStr = formatGoogleDate(startDate);
    const endStr = formatGoogleDate(endDate);

    const title = encodeURIComponent('Consultoria NeoSale AI - Automação de Vendas');
    const details = encodeURIComponent(`Reunião de diagnóstico com a equipe NeoSale AI para análise de automação de vendas no WhatsApp.

Participante: ${data.nome}
Empresa: ${data.empresa}

O link da reunião será enviado por email e WhatsApp.`);
    const location = encodeURIComponent('Online - Link será enviado');

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&location=${location}`;
}

// Validate input
export function validateInput(field, value) {
    switch (field) {
        case 'nome':
            const nameParts = value.trim().split(/\s+/);
            if (nameParts.length < 2 || nameParts[1].length < 2) {
                return { valid: false, message: 'Por favor, digite seu nome completo (nome e sobrenome).' };
            }
            return { valid: true };
        case 'telefone':
            const phone = value.replace(/\D/g, '');
            if (phone.length < 10 || phone.length > 11) {
                return { valid: false, message: 'Por favor, digite um WhatsApp válido com DDD (ex: 11 99999-9999).' };
            }
            const ddd = parseInt(phone.substring(0, 2));
            if (ddd < 11 || ddd > 99) {
                return { valid: false, message: 'DDD inválido. Por favor, digite um WhatsApp válido com DDD.' };
            }
            return { valid: true };
        case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                return { valid: false, message: 'Por favor, digite um e-mail válido.' };
            }
            return { valid: true };
        default:
            return { valid: true };
    }
}

// Phone mask
export function applyPhoneMask(value) {
    let cleaned = value.replace(/\D/g, '');
    if (cleaned.length > 11) cleaned = cleaned.slice(0, 11);

    if (cleaned.length === 0) return '';
    if (cleaned.length <= 2) return '(' + cleaned;
    if (cleaned.length <= 7) return '(' + cleaned.slice(0, 2) + ') ' + cleaned.slice(2);
    return '(' + cleaned.slice(0, 2) + ') ' + cleaned.slice(2, 7) + '-' + cleaned.slice(7);
}

// Split text into smaller messages
export function splitTextIntoMessages(text) {
    const maxLength = 150;
    const parts = [];
    const paragraphs = text.split(/\n\n+/);

    for (const paragraph of paragraphs) {
        if (paragraph.length <= maxLength) {
            parts.push(paragraph.trim());
        } else {
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
