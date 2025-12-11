// ============================================
// DASHBOARD FUNCTIONS - dashboard.js
// ============================================

const dashboard = (function () {
    'use strict';

    // Configurações
    const config = {
        refreshInterval: 300000, // 5 minutos
        animationDuration: 500
    };

    // Elementos do DOM
    let elements = {};

    // Inicialização
    function init() {
        console.log('Inicializando dashboard...');

        // Cache de elementos
        cacheElements();

        // Inicializar componentes
        initMetrics();
        initEquipe();
        initEventListeners();

        // Atualizar hora inicial
        updateLastUpdateTime();

        // Iniciar auto-atualização
        startAutoRefresh();

        console.log('Dashboard inicializado');
    }

    // Cache de elementos
    function cacheElements() {
        elements = {
            lastUpdateTime: document.getElementById('lastUpdateTime'),
            refreshButton: document.querySelector('.fa-sync-alt'),
            convidadoBanner: document.querySelector('.convidado-banner'),
            metricCards: document.querySelectorAll('.metric-card'),
            progressBars: document.querySelectorAll('.progress-bar'),
            chartFills: document.querySelectorAll('.chart-fill'),
            acsItems: document.querySelectorAll('.profissional-item-premium[data-acs]'),
            verMaisBtn: document.querySelector('.ver-mais-premium'),
            btnAdicionarACS: document.querySelector('.btn-adicionar-acs'),
            btnDesignarEnfermeiro: document.querySelector('.btn-designar-enfermeiro'),
            btnDesignarMedico: document.querySelector('.btn-designar-medico'),
            btnVerEnfermeiro: document.querySelector('.btn-ver-enfermeiro'),
            btnVerMedico: document.querySelector('.btn-ver-medico')
        };
    }

    // Inicializar métricas
    function initMetrics() {
        // Formatar números
        formatMetricNumbers();

        // Animar elementos
        animateMetrics();

        // Animar barras de progresso
        animateProgressBars();

        // Animar mini gráficos
        animateMiniCharts();
    }

    // Inicializar seção de equipe
    function initEquipe() {
        if (elements.acsItems) {
            elements.acsItems.forEach(item => {
                item.addEventListener('click', function () {
                    const acsData = this.getAttribute('data-acs');
                    mostrarDetalhesACS(acsData);
                });
            });
        }

        if (elements.verMaisBtn) {
            elements.verMaisBtn.addEventListener('click', function () {
                const acsData = this.getAttribute('data-acs-data');
                mostrarTodosACS(acsData);
            });
        }

        // Botões de equipe
        if (elements.btnAdicionarACS) {
            elements.btnAdicionarACS.addEventListener('click', mostrarModalAdicionarACS);
        }

        if (elements.btnDesignarEnfermeiro) {
            elements.btnDesignarEnfermeiro.addEventListener('click', mostrarModalDesignarEnfermeiro);
        }

        if (elements.btnDesignarMedico) {
            elements.btnDesignarMedico.addEventListener('click', mostrarModalDesignarMedico);
        }

        if (elements.btnVerEnfermeiro) {
            elements.btnVerEnfermeiro.addEventListener('click', function () {
                const enfermeiroData = this.getAttribute('data-enfermeiro');
                mostrarDetalhesEnfermeiro(enfermeiroData);
            });
        }

        if (elements.btnVerMedico) {
            elements.btnVerMedico.addEventListener('click', function () {
                const medicoData = this.getAttribute('data-medico');
                mostrarDetalhesMedico(medicoData);
            });
        }

        // Eventos para destaque
        document.querySelectorAll('.profissional-destaque[data-enfermeiro]').forEach(el => {
            el.addEventListener('click', function () {
                const enfermeiroData = this.getAttribute('data-enfermeiro');
                mostrarDetalhesEnfermeiro(enfermeiroData);
            });
        });

        document.querySelectorAll('.profissional-destaque[data-medico]').forEach(el => {
            el.addEventListener('click', function () {
                const medicoData = this.getAttribute('data-medico');
                mostrarDetalhesMedico(medicoData);
            });
        });
    }

    // Inicializar event listeners
    function initEventListeners() {
        // Botão de atualizar
        if (elements.refreshButton) {
            elements.refreshButton.addEventListener('click', atualizarMetricas);
        }

        // Formatação de números ao carregar
        window.addEventListener('load', formatMetricNumbers);
    }

    // Formatar números das métricas
    function formatMetricNumbers() {
        document.querySelectorAll('.metric-value').forEach(el => {
            const text = el.textContent.trim();
            if (text && !isNaN(text.replace('%', '').replace('.', '').replace(',', ''))) {
                const num = parseInt(text.replace('%', '').replace('.', '').replace(',', ''));
                if (!isNaN(num)) {
                    el.textContent = num.toLocaleString('pt-BR') + (text.includes('%') ? '%' : '');
                }
            }
        });
    }

    // Animar métricas
    function animateMetrics() {
        elements.metricCards.forEach((card, index) => {
            card.style.animationDelay = `${0.1 + (index * 0.1)}s`;
        });
    }

    // Animar barras de progresso
    function animateProgressBars() {
        elements.progressBars.forEach(bar => {
            const width = bar.getAttribute('data-width') || bar.style.width;
            bar.style.width = '0%';

            setTimeout(() => {
                bar.style.width = width + '%';
                bar.removeAttribute('data-width');
            }, config.animationDuration);
        });
    }

    // Animar mini gráficos
    function animateMiniCharts() {
        elements.chartFills.forEach(fill => {
            const height = fill.getAttribute('data-height') || fill.style.height;
            fill.style.height = '0%';

            setTimeout(() => {
                fill.style.height = height + '%';
                fill.removeAttribute('data-height');
            }, config.animationDuration * 1.5);
        });
    }

    // Atualizar hora da última atualização
    function updateLastUpdateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });

        if (elements.lastUpdateTime) {
            elements.lastUpdateTime.textContent = timeString;
        }
    }

    // Iniciar auto-atualização
    function startAutoRefresh() {
        setInterval(() => {
            updateLastUpdateTime();
        }, 60000); // Atualizar a cada minuto
    }

    // Função de atualização de métricas
    function atualizarMetricas() {
        if (!elements.refreshButton) return;

        // Adicionar classe de spinning
        elements.refreshButton.classList.add('fa-spin');

        // Simular requisição
        setTimeout(() => {
            // Remover spinning
            elements.refreshButton.classList.remove('fa-spin');

            // Atualizar hora
            updateLastUpdateTime();

            // Mostrar notificação
            showNotification('Métricas atualizadas com sucesso!', 'success');

            console.log('Métricas atualizadas');
        }, 1500);
    }

    // Função para mostrar notificação
    function showNotification(message, type) {
        // Remover notificações existentes
        document.querySelectorAll('.notification').forEach(n => n.remove());

        // Criar nova notificação
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        document.body.appendChild(notification);

        // Auto-remover após 3 segundos
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Função para mostrar todos os ACS
    function mostrarTodosACS(acsData) {
        try {
            const acs = typeof acsData === 'string' ? JSON.parse(acsData) : acsData;
            const acsAtivos = acs.filter(a => a.ativo);

            if (acsAtivos.length === 0) {
                alert('Nenhum ACS ativo nesta equipe.');
                return;
            }

            const modalContent = `
                <div class="modal" id="modalACS" style="display: block; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;">
                    <div class="modal-content" style="background: white; border-radius: 12px; padding: 25px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;">
                        <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                            <h3 style="margin: 0; display: flex; align-items: center; gap: 10px; color: #2c3e50;">
                                <i class="fas fa-user-md"></i> Agentes Comunitários de Saúde
                            </h3>
                            <button class="modal-close" onclick="document.getElementById('modalACS').remove()" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #7f8c8d;">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <p style="margin-bottom: 15px; color: #666;">
                                Total de ACS ativos: <strong>${acsAtivos.length}</strong>
                            </p>
                            <div class="acs-lista-modal" style="max-height: 400px; overflow-y: auto;">
                                ${acsAtivos.map((acs, index) => `
                                    <div class="acs-item-modal" style="display: flex; align-items: center; gap: 15px; padding: 12px; background: #f8f9fa; border-radius: 8px; margin-bottom: 10px; border: 1px solid #e9ecef;">
                                        <div class="acs-numero" style="width: 30px; height: 30px; background: #3498db; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.9rem;">
                                            ${index + 1}
                                        </div>
                                        <div class="acs-info" style="flex: 1;">
                                            <strong style="display: block; margin-bottom: 5px;">${acs.nome}</strong>
                                            <div class="acs-detalhes" style="display: flex; gap: 15px; margin-top: 5px; font-size: 0.85rem; color: #666;">
                                                <span style="display: flex; align-items: center; gap: 5px;">
                                                    <i class="fas fa-id-card"></i> ${acs.registro || 'Sem registro'}
                                                </span>
                                                ${acs.telefone ? `<span style="display: flex; align-items: center; gap: 5px;">
                                                    <i class="fas fa-phone"></i> ${acs.telefone}
                                                </span>` : ''}
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Remover modal existente
            const existingModal = document.getElementById('modalACS');
            if (existingModal) existingModal.remove();

            // Adicionar novo modal
            document.body.insertAdjacentHTML('beforeend', modalContent);
        } catch (error) {
            console.error('Erro ao mostrar ACS:', error);
            alert('Erro ao carregar lista de ACS.');
        }
    }

    // Função para mostrar detalhes do ACS
    function mostrarDetalhesACS(acsData) {
        try {
            const acs = typeof acsData === 'string' ? JSON.parse(acsData) : acsData;

            const modalContent = `
                <div class="modal" id="modalACSDetalhes" style="display: block; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;">
                    <div class="modal-content" style="background: white; border-radius: 12px; padding: 25px; max-width: 450px; width: 90%;">
                        <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                            <h3 style="margin: 0; display: flex; align-items: center; gap: 10px; color: #2c3e50;">
                                <i class="fas fa-user-md"></i> Detalhes do ACS
                            </h3>
                            <button class="modal-close" onclick="document.getElementById('modalACSDetalhes').remove()" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #7f8c8d;">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <div style="text-align: center; margin-bottom: 20px;">
                                <div style="width: 80px; height: 80px; background: #3498db; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; color: white; font-size: 2rem;">
                                    <i class="fas fa-user-md"></i>
                                </div>
                                <h4 style="margin: 0 0 5px 0; color: #2c3e50;">${acs.nome}</h4>
                                <p style="color: #7f8c8d; margin: 0;">Agente Comunitário de Saúde</p>
                            </div>
                            
                            <div style="background: #f8f9fa; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                                <h5 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 1rem;">Informações</h5>
                                <div style="display: grid; gap: 10px;">
                                    <div style="display: flex; align-items: center; gap: 10px;">
                                        <i class="fas fa-id-card" style="color: #3498db;"></i>
                                        <span style="flex: 1;">Registro:</span>
                                        <strong>${acs.registro || 'Não informado'}</strong>
                                    </div>
                                    ${acs.microarea ? `<div style="display: flex; align-items: center; gap: 10px;">
                                        <i class="fas fa-map-pin" style="color: #3498db;"></i>
                                        <span style="flex: 1;">Microárea:</span>
                                        <strong>${acs.microarea}</strong>
                                    </div>` : ''}
                                    ${acs.telefone ? `<div style="display: flex; align-items: center; gap: 10px;">
                                        <i class="fas fa-phone" style="color: #3498db;"></i>
                                        <span style="flex: 1;">Telefone:</span>
                                        <strong>${acs.telefone}</strong>
                                    </div>` : ''}
                                    ${acs.email ? `<div style="display: flex; align-items: center; gap: 10px;">
                                        <i class="fas fa-envelope" style="color: #3498db;"></i>
                                        <span style="flex: 1;">Email:</span>
                                        <strong>${acs.email}</strong>
                                    </div>` : ''}
                                </div>
                            </div>
                            
                            <div style="display: flex; gap: 10px; margin-top: 20px;">
                                <button onclick="document.getElementById('modalACSDetalhes').remove()" style="flex: 1; padding: 10px; background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 6px; cursor: pointer;">
                                    Fechar
                                </button>
                                <button onclick="dashboard.editarACS('${encodeURIComponent(JSON.stringify(acs))}')" style="flex: 1; padding: 10px; background: #3498db; color: white; border: none; border-radius: 6px; cursor: pointer;">
                                    Editar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Remover modal existente
            const existingModal = document.getElementById('modalACSDetalhes');
            if (existingModal) existingModal.remove();

            // Adicionar novo modal
            document.body.insertAdjacentHTML('beforeend', modalContent);
        } catch (error) {
            console.error('Erro ao mostrar detalhes do ACS:', error);
            alert('Erro ao carregar detalhes do ACS.');
        }
    }

    // Funções placeholder para modais (serão implementadas posteriormente)
    function mostrarModalAdicionarACS() {
        if (window.APP_CONFIG && !window.APP_CONFIG.usuario_logado) {
            alert('Para adicionar um ACS, faça login no sistema.');
            return;
        }
        alert('Funcionalidade de adicionar ACS será implementada em breve.');
    }

    function mostrarModalDesignarEnfermeiro() {
        if (window.APP_CONFIG && !window.APP_CONFIG.usuario_logado) {
            alert('Para designar um enfermeiro, faça login no sistema.');
            return;
        }
        alert('Funcionalidade de designar enfermeiro será implementada em breve.');
    }

    function mostrarModalDesignarMedico() {
        if (window.APP_CONFIG && !window.APP_CONFIG.usuario_logado) {
            alert('Para designar um médico, faça login no sistema.');
            return;
        }
        alert('Funcionalidade de designar médico será implementada em breve.');
    }

    function mostrarDetalhesEnfermeiro(enfermeiroData) {
        try {
            const enfermeiro = typeof enfermeiroData === 'string' ? JSON.parse(enfermeiroData) : enfermeiroData;
            alert(`Detalhes do Enfermeiro:\n\nNome: ${enfermeiro.nome}\nRegistro: ${enfermeiro.registro || 'N/I'}\nEspecialização: ${enfermeiro.especializacao || 'Não informada'}`);
        } catch (error) {
            console.error('Erro ao mostrar detalhes do enfermeiro:', error);
            alert('Erro ao carregar detalhes do enfermeiro.');
        }
    }

    function mostrarDetalhesMedico(medicoData) {
        try {
            const medico = typeof medicoData === 'string' ? JSON.parse(medicoData) : medicoData;
            alert(`Detalhes do Médico:\n\nNome: ${medico.nome}\nRegistro: ${medico.registro || 'N/I'}\nEspecialização: ${medico.especializacao || 'Não informada'}`);
        } catch (error) {
            console.error('Erro ao mostrar detalhes do médico:', error);
            alert('Erro ao carregar detalhes do médico.');
        }
    }

    // Função para editar ACS (placeholder)
    function editarACS(acsData) {
        console.log('Editar ACS:', acsData);
        // Implementar funcionalidade de edição
        alert('Funcionalidade de edição será implementada em breve.');
    }

    // Retornar API pública
    return {
        init,
        atualizarMetricas,
        showNotification,
        editarACS,
        mostrarTodosACS,
        mostrarDetalhesACS,
        mostrarModalAdicionarACS,
        mostrarModalDesignarEnfermeiro,
        mostrarModalDesignarMedico,
        mostrarDetalhesEnfermeiro,
        mostrarDetalhesMedico
    };
})();

// Exportar para escopo global
window.dashboard = dashboard;

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
        if (typeof dashboard !== 'undefined') {
            dashboard.init();
        }
    });
} else {
    if (typeof dashboard !== 'undefined') {
        dashboard.init();
    }
}
