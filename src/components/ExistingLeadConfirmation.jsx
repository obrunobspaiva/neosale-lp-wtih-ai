import React from 'react';
import mayaImg from '../assets/maya.jpeg';
import { convertColaboradoresFromNumber } from '../utils/constants';

export default function ExistingLeadConfirmation({ lead, onConfirm, onUpdate }) {
    const firstName = lead.nome ? lead.nome.split(' ')[0] : 'você';
    const colaboradoresDisplay = lead.numero_funcionarios 
        ? convertColaboradoresFromNumber(lead.numero_funcionarios) 
        : null;

    return (
        <div className="message message-bot">
            <div className="bot-avatar">
                <img src={mayaImg} alt="Maya" />
            </div>
            <div className="bot-content">
                <div className="bot-text">
                    Opa, {firstName}! Encontrei seus dados aqui na nossa base. Deixa eu confirmar se está tudo certo:
                </div>
                <div className="lead-confirmation-card">
                    {lead.nome && (
                        <div className="confirmation-row">
                            <strong>Nome:</strong> {lead.nome}
                        </div>
                    )}
                    {lead.telefone && (
                        <div className="confirmation-row">
                            <strong>Telefone:</strong> {lead.telefone}
                        </div>
                    )}
                    {lead.email && (
                        <div className="confirmation-row">
                            <strong>Email:</strong> {lead.email}
                        </div>
                    )}
                    {lead.empresa && (
                        <div className="confirmation-row">
                            <strong>Empresa:</strong> {lead.empresa}
                        </div>
                    )}
                    {lead.cargo && (
                        <div className="confirmation-row">
                            <strong>Cargo:</strong> {lead.cargo}
                        </div>
                    )}
                    {lead.faturamento && (
                        <div className="confirmation-row">
                            <strong>Faturamento:</strong> {lead.faturamento}
                        </div>
                    )}
                    {colaboradoresDisplay && (
                        <div className="confirmation-row">
                            <strong>Colaboradores:</strong> {colaboradoresDisplay}
                        </div>
                    )}
                </div>
                <div className="bot-text">Esses dados estão corretos?</div>
                <div className="options-wrapper" style={{ marginTop: '12px', justifyContent: 'flex-start' }}>
                    <button className="option-btn" onClick={onConfirm}>
                        Sim, estão corretos!
                    </button>
                    <button className="option-btn" onClick={onUpdate}>
                        Preciso atualizar alguns dados
                    </button>
                </div>
            </div>
        </div>
    );
}
