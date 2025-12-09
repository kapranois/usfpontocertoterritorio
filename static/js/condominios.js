// static/js/condominios.js - VERSÃO MODERNA E OTIMIZADA

// ============================================
// MÓDULO PRINCIPAL MODERNO
// ============================================

const CondominiosPage = (function () {
    // Estado da aplicação
    let state = {
        filters: {
            status: 'todos',
            prioridade: 'todos',
            acs: 'todos',
            cobertura: 0
        },
        currentStep: 0,
        isLoading: false
    };

    // ============================================
    // FUNÇÕES PRIVADAS MODERNAS
    // ============================================

    /**
     * Inicializa a página com estilo moderno
     */
    function init() {
        console.log('📍 Página de condomínios inicializada');
        console.log('👤 Configuração do usuário:', window.APP_CONFIG);

        setupEventListeners();
        setupFilters();
        checkPermissions();
        updateCurrentDate();
        setupCardAnimations();
    }

    /**
     * Configura eventos com delegação moderna
     */
    function setupEventListeners() {
        // Filtros com debounce
        const filterElements = ['filterStatus', 'filterPrioridade', 'filterACS', 'filterCobertura'];
        filterElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', debounce(applyFilters, 300));
            }
        });

        // Delegação de eventos para ações
        document.addEventListener('click', handleActionClick);
    }

    /**
     * Manipula cliques em ações
     */
    function handleActionClick(event) {
        const target = event.target;

        // Editar
        if (target.closest('.btn-edit')) {
            event.preventDefault();
            const button = target.closest('.btn-edit');
            const id = button.getAttribute('data-id');
            if (id) editarCondominio(id);
            return;
        }

        // Excluir
        if (target.closest('.btn-delete')) {
            event.preventDefault();
            const button = target.closest('.btn-delete');
            const id = button.getAttribute('data-id');
            const nome = button.getAttribute('data-nome');
            if (id && nome) confirmarExclusao(id, nome);
            return;
        }

        // Visualizar
        if (target.closest('.btn-view')) {
            event.preventDefault();
            const button = target.closest('.btn-view');
            const id = button.getAttribute('data-id');
            if (id) verDetalhes(id);
            return;
        }
    }

    /**
     * Configura animações nos cards
     */
    function setupCardAnimations() {
        const cards = document.querySelectorAll('.condominio-card');
        cards.forEach((card, index) => {
            card.style.setProperty('--card-index', index);
        });
    }

    /**
     * Verifica permissões do usuário com UI visual
     */
    function checkPermissions() {
        if (!window.APP_CONFIG) {
            console.warn('⚠️ APP_CONFIG não definido');
            return;
        }

        // Se for convidado, desabilita botões com estilo visual
        if (window.APP_CONFIG.nivel_usuario === 'convidado') {
            document.querySelectorAll('.btn-edit, .btn-delete').forEach(btn => {
                btn.disabled = true;
                btn.classList.add('disabled');
                btn.title = 'Modo visitante: apenas visualização';
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
            });
        }
    }

    /**
     * Verifica se usuário pode realizar ação
     */
    function canPerformAction() {
        if (!window.APP_CONFIG) {
            showNotification('❌ Erro de configuração', 'error');
            return false;
        }

        // 1. Verifica se é convidado
        if (window.APP_CONFIG.nivel_usuario === 'convidado') {
            showModalConvidado();
            return false;
        }

        // 2. Verifica se está logado
        if (!window.APP_CONFIG.usuario_logado) {
            showNotification('🔒 Para realizar esta ação, faça login no sistema', 'info');
            setTimeout(() => {
                window.location.href = '/login';
            }, 1500);
            return false;
        }

        return true;
    }

    /**
     * Mostra modal de novo condomínio moderno
     */
    function showCreateModal() {
        if (!canPerformAction()) return false;

        // Cria conteúdo do modal moderno
        const modalContent = `
            <div class="modal-header">
                <div class="modal-header-content">
                    <div class="modal-icon">
                        <i class="fas fa-plus-circle"></i>
                    </div>
                    <div>
                        <h3>Novo Condomínio</h3>
                        <p class="modal-subtitle">Adicione um novo condomínio ao território</p>
                    </div>
                </div>
                <button class="modal-close" onclick="CondominiosPage.closeModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="formNovoCondominio" class="modal-form modern-form">
                    <div class="form-section">
                        <h4 class="form-section-title">
                            <i class="fas fa-info-circle"></i>
                            Informações Básicas
                        </h4>
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="nome" class="form-label">
                                    <i class="fas fa-building"></i>
                                    Nome do Condomínio *
                                </label>
                                <input type="text" id="nome" class="form-input" required 
                                       placeholder="Ex: Condomínio Lucaia">
                                <div class="form-hint">Nome completo do condomínio</div>
                            </div>
                        </div>
                        
                        <div class="form-grid columns-3">
                            <div class="form-group">
                                <label for="torres" class="form-label">
                                    <i class="fas fa-layer-group"></i>
                                    Total de Blocos *
                                </label>
                                <input type="number" id="torres" class="form-input" min="1" required 
                                       placeholder="Ex: 23">
                            </div>
                            <div class="form-group">
                                <label for="apartamentos" class="form-label">
                                    <i class="fas fa-door-closed"></i>
                                    Total de Apartamentos *
                                </label>
                                <input type="number" id="apartamentos" class="form-input" min="1" required 
                                       placeholder="Ex: 460">
                            </div>
                            <div class="form-group">
                                <label for="moradores" class="form-label">
                                    <i class="fas fa-users"></i>
                                    Total de Moradores *
                                </label>
                                <input type="number" id="moradores" class="form-input" min="1" required 
                                       placeholder="Ex: 1610">
                            </div>
                        </div>
                    </div>

                    <div class="form-actions modal-actions">
                        <button type="button" class="btn-secondary" onclick="CondominiosPage.closeModal()">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                        <button type="submit" class="btn-primary" id="submitBtn">
                            <i class="fas fa-save"></i> Salvar Condomínio
                        </button>
                    </div>
                </form>
            </div>
        `;

        // Insere no modal
        const modal = document.getElementById('modalCondominio');
        if (modal) {
            modal.querySelector('.modal-content').innerHTML = modalContent;
            modal.style.display = 'block';

            // Configura submit do formulário
            const form = document.getElementById('formNovoCondominio');
            if (form) {
                form.addEventListener('submit', handleCreateSubmit);
            }
        }

        return true;
    }

    /**
     * Manipula envio do formulário de criação
     */
    async function handleCreateSubmit(event) {
        event.preventDefault();

        if (state.isLoading) return;
        state.isLoading = true;

        const submitBtn = document.getElementById('submitBtn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
        submitBtn.disabled = true;

        // Coleta dados
        const data = {
            nome: document.getElementById('nome').value,
            torres: parseInt(document.getElementById('torres').value) || 0,
            apartamentos: parseInt(document.getElementById('apartamentos').value) || 0,
            moradores: parseInt(document.getElementById('moradores').value) || 0,
            hipertensos: 0,
            diabeticos: 0,
            gestantes: 0,
            prioridade: 'media',
            status_cobertura: 'descoberto',
            cobertura: 0,
            blocos_cobertos: 0,
            blocos_descobertos: parseInt(document.getElementById('torres').value) || 0,
            ultima_visita: new Date().toISOString().split('T')[0]
        };

        // Validação
        if (!validateCreateForm(data)) {
            state.isLoading = false;
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            return;
        }

        try {
            // Envia para API
            const response = await fetch('/api/novo-condominio', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.status === 'sucesso') {
                showNotification('✅ Condomínio adicionado com sucesso!', 'success');
                closeModal();
                // Recarrega a página após 1.5 segundos
                setTimeout(() => location.reload(), 1500);
            } else {
                showNotification(`❌ ${result.mensagem}`, 'error');
            }

        } catch (error) {
            console.error('Erro:', error);
            showNotification('❌ Erro ao conectar com o servidor', 'error');
        } finally {
            state.isLoading = false;
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    /**
     * Valida formulário de criação
     */
    function validateCreateForm(data) {
        const errors = [];

        if (!data.nome || data.nome.trim().length < 3) {
            errors.push('Nome deve ter pelo menos 3 caracteres');
            highlightField('nome', 'error');
        }

        if (data.torres <= 0) {
            errors.push('Total de blocos deve ser maior que zero');
            highlightField('torres', 'error');
        }

        if (data.apartamentos <= 0) {
            errors.push('Total de apartamentos deve ser maior que zero');
            highlightField('apartamentos', 'error');
        }

        if (data.moradores <= 0) {
            errors.push('Total de moradores deve ser maior que zero');
            highlightField('moradores', 'error');
        }

        if (errors.length > 0) {
            showNotification(errors.join('<br>'), 'error');
            return false;
        }

        return true;
    }

    /**
     * Destaca campo com feedback visual
     */
    function highlightField(fieldId, type) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.style.borderColor = type === 'error' ? '#e74c3c' : '#2ecc71';
            setTimeout(() => {
                field.style.borderColor = '';
            }, 3000);
        }
    }

    /**
     * Fecha modal com animação
     */
    function closeModal() {
        const modal = document.getElementById('modalCondominio');
        if (modal) {
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.style.display = 'none';
                modal.style.opacity = '1';
            }, 300);
        }
    }

    /**
     * Aplica filtros à tabela de forma otimizada
     */
    function applyFilters() {
        const status = document.getElementById('filterStatus')?.value || 'todos';
        const prioridade = document.getElementById('filterPrioridade')?.value || 'todos';
        const acs = document.getElementById('filterACS')?.value || 'todos';
        const cobertura = parseInt(document.getElementById('filterCobertura')?.value || 0);

        const rows = document.querySelectorAll('#condominiosTable tbody tr');
        let visibleCount = 0;

        rows.forEach(row => {
            const rowStatus = row.getAttribute('data-status');
            const rowPrioridade = row.getAttribute('data-prioridade');
            const rowAcs = row.getAttribute('data-acs');
            const rowCobertura = parseInt(row.getAttribute('data-cobertura') || 0);

            let mostrar = true;

            if (status !== 'todos' && rowStatus !== status) mostrar = false;
            if (prioridade !== 'todos' && rowPrioridade !== prioridade) mostrar = false;
            if (acs !== 'todos' && rowAcs !== acs) mostrar = false;
            if (rowCobertura < cobertura) mostrar = false;

            if (mostrar) {
                row.style.display = '';
                row.classList.add('fade-in');
                visibleCount++;
            } else {
                row.style.display = 'none';
                row.classList.remove('fade-in');
            }
        });

        // Atualiza contador
        updateCounter(visibleCount, rows.length);

        // Salva filtros
        saveFilters(status, prioridade, acs, cobertura);
    }

    /**
     * Salva filtros no localStorage
     */
    function saveFilters(status, prioridade, acs, cobertura) {
        state.filters = { status, prioridade, acs, cobertura };
        localStorage.setItem('condominios_filters', JSON.stringify(state.filters));
    }

    /**
     * Atualiza contador com animação
     */
    function updateCounter(visible, total) {
        const counter = document.querySelector('.items-counter');
        if (counter) {
            counter.textContent = `Mostrando ${visible} de ${total} condomínios`;
            counter.classList.add('updated');
            setTimeout(() => counter.classList.remove('updated'), 500);
        }
    }

    /**
     * Atualiza data atual
     */
    function updateCurrentDate() {
        const dateElement = document.getElementById('dataAtual');
        if (dateElement) {
            const now = new Date();
            const options = {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            };
            dateElement.textContent = now.toLocaleDateString('pt-BR', options);
        }
    }

    /**
     * Configura filtros iniciais
     */
    function setupFilters() {
        // Restaura valores salvos
        const savedFilters = localStorage.getItem('condominios_filters');
        if (savedFilters) {
            try {
                state.filters = JSON.parse(savedFilters);
                Object.keys(state.filters).forEach(key => {
                    const element = document.getElementById(`filter${key.charAt(0).toUpperCase() + key.slice(1)}`);
                    if (element) element.value = state.filters[key];
                });
            } catch (e) {
                console.warn('⚠️ Erro ao carregar filtros:', e);
            }
        }

        // Aplica filtros iniciais
        applyFilters();
    }

    /**
     * Edita condomínio
     */
    async function editarCondominio(id) {
        if (!canPerformAction()) return;

        try {
            showNotification('Carregando dados...', 'info');
            const response = await fetch(`/api/condominio/${id}`);
            const condominio = await response.json();

            // Aqui você implementaria a abertura do modal de edição
            // Por enquanto, apenas mostra uma mensagem
            showNotification(`✏️ Editando: ${condominio.nome}`, 'info');

        } catch (error) {
            console.error('Erro:', error);
            showNotification('❌ Erro ao carregar dados do condomínio', 'error');
        }
    }

    /**
     * Confirma exclusão com modal elegante
     */
    function confirmarExclusao(id, nome) {
        if (!canPerformAction()) return;

        if (confirm(`🗑️ Tem certeza que deseja excluir o condomínio?\n\n"${nome}"\n\nEsta ação não pode ser desfeita.`)) {
            excluirCondominio(id);
        }
    }

    /**
     * Exclui condomínio
     */
    async function excluirCondominio(id) {
        try {
            const response = await fetch(`/api/excluir-condominio/${id}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.status === 'sucesso') {
                showNotification('✅ Condomínio excluído com sucesso!', 'success');
                // Remove da tabela com animação
                const row = document.querySelector(`tr[data-id="${id}"]`);
                if (row) {
                    row.style.opacity = '0';
                    row.style.transform = 'translateX(-20px)';
                    setTimeout(() => row.remove(), 300);
                }
                // Atualiza contador
                setTimeout(applyFilters, 300);
            } else {
                showNotification(`❌ ${result.mensagem}`, 'error');
            }

        } catch (error) {
            console.error('Erro:', error);
            showNotification('❌ Erro ao conectar com o servidor', 'error');
        }
    }

    /**
     * Ver detalhes
     */
    function verDetalhes(id) {
        showNotification(`👁️ Visualizando detalhes do condomínio`, 'info');
        // Implementar modal de detalhes
    }

    /**
     * Filtro rápido
     */
    function filtrar(tipo) {
        const buttons = document.querySelectorAll('.filter-btn');
        buttons.forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');

        switch (tipo) {
            case 'alta':
                document.getElementById('filterPrioridade').value = 'alta';
                break;
            case 'cobertura':
                ordenarPorCobertura();
                return;
            case 'todos':
            default:
                document.getElementById('filterStatus').value = 'todos';
                document.getElementById('filterPrioridade').value = 'todos';
                document.getElementById('filterACS').value = 'todos';
                document.getElementById('filterCobertura').value = '0';
        }

        applyFilters();
    }

    /**
     * Ordena por cobertura
     */
    function ordenarPorCobertura() {
        const container = document.querySelector('.condominios-grid');
        if (!container) return;

        const cards = Array.from(container.children);
        cards.sort((a, b) => {
            const coberturaA = parseInt(a.getAttribute('data-cobertura')) || 0;
            const coberturaB = parseInt(b.getAttribute('data-cobertura')) || 0;
            return coberturaB - coberturaA; // Decrescente
        });

        cards.forEach((card, index) => {
            card.style.order = index;
            card.classList.add('reordering');
            setTimeout(() => card.classList.remove('reordering'), 500);
        });
    }

    /**
     * Mostra modal para convidado
     */
    function showModalConvidado() {
        const modalContent = `
            <div class="modal-header" style="background: linear-gradient(135deg, #ff9800, #f57c00);">
                <div class="modal-header-content">
                    <div class="modal-icon">
                        <i class="fas fa-lock"></i>
                    </div>
                    <div>
                        <h3>Modo Visitante</h3>
                        <p class="modal-subtitle">Apenas visualização disponível</p>
                    </div>
                </div>
                <button class="modal-close" onclick="this.closest('.modal').style.display='none'">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="convidado-modal-content">
                    <div class="convidado-icon">
                        <i class="fas fa-user-clock"></i>
                    </div>
                    <h4>Acesso Restrito</h4>
                    <p>Você está no modo de visualização apenas. Para adicionar ou editar condomínios, faça login como usuário cadastrado.</p>
                    
                    <div class="login-options">
                        <div class="login-option">
                            <strong><i class="fas fa-user-shield"></i> Administrador</strong>
                            <p>Usuário: <code>admin</code><br>Senha: <code>admin123</code></p>
                        </div>
                        <div class="login-option">
                            <strong><i class="fas fa-user-md"></i> ACS</strong>
                            <p>Usuário: <code>acs1</code><br>Senha: <code>acs123</code></p>
                        </div>
                    </div>
                    
                    <div class="modal-actions" style="justify-content: center;">
                        <a href="/login" class="btn-primary">
                            <i class="fas fa-sign-in-alt"></i> Ir para Login
                        </a>
                    </div>
                </div>
            </div>
        `;

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'modalConvidado';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                ${modalContent}
            </div>
        `;
        document.body.appendChild(modal);
        modal.style.display = 'block';
    }

    /**
     * Mostra notificação elegante
     */
    function showNotification(message, type = 'info') {
        // Remove notificações existentes
        document.querySelectorAll('.notification').forEach(n => n.remove());

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">
                    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                </div>
                <div class="notification-message">${message}</div>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        // Mostra com animação
        setTimeout(() => notification.classList.add('show'), 10);

        // Remove após 5 segundos
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    /**
     * Debounce para otimização de performance
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // ============================================
    // FUNÇÕES PÚBLICAS
    // ============================================

    return {
        /**
         * Inicializa a página
         */
        initialize: function () {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', init);
            } else {
                init();
            }
        },

        /**
         * Mostra modal de novo condomínio
         */
        mostrarModal: function () {
            return showCreateModal();
        },

        /**
         * Mostra alerta para convidados
         */
        mostrarModalConvidado: function () {
            showModalConvidado();
            return false;
        },

        /**
         * Fecha modal
         */
        closeModal: function () {
            closeModal();
        },

        /**
         * Aplica filtro rápido
         */
        filtrar: function (tipo) {
            filtrar(tipo);
        },

        /**
         * Atualiza filtros
         */
        atualizarFiltros: function () {
            applyFilters();
        },

        /**
         * Reinicia filtros
         */
        resetarFiltros: function () {
            document.getElementById('filterStatus').value = 'todos';
            document.getElementById('filterPrioridade').value = 'todos';
            document.getElementById('filterACS').value = 'todos';
            document.getElementById('filterCobertura').value = '0';
            applyFilters();
        }
    };
})();

// ============================================
// INICIALIZAÇÃO E EXPOSIÇÃO
// ============================================

// Inicializa quando o script carrega
CondominiosPage.initialize();

// Expõe funções para o HTML
window.mostrarModal = function () {
    return CondominiosPage.mostrarModal();
};

window.mostrarModalConvidado = function () {
    return CondominiosPage.mostrarModalConvidado();
};

window.fecharModal = function () {
    return CondominiosPage.closeModal();
};

window.CondominiosPage = CondominiosPage;

// ============================================
// ESTILOS DINÂMICOS PARA NOTIFICAÇÕES
// ============================================

const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        transform: translateX(120%);
        transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    
    .notification.show {
        transform: translateX(0);
    }
    
    .notification-content {
        background: white;
        border-radius: 12px;
        padding: 15px 20px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        gap: 15px;
        border-left: 4px solid #3498db;
        min-width: 300px;
    }
    
    .notification-success .notification-content {
        border-left-color: #2ecc71;
    }
    
    .notification-error .notification-content {
        border-left-color: #e74c3c;
    }
    
    .notification-icon {
        font-size: 1.2rem;
    }
    
    .notification-success .notification-icon {
        color: #2ecc71;
    }
    
    .notification-error .notification-icon {
        color: #e74c3c;
    }
    
    .notification-message {
        flex: 1;
        font-weight: 500;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: #95a5a6;
        cursor: pointer;
        padding: 5px;
        border-radius: 6px;
        transition: all 0.2s;
    }
    
    .notification-close:hover {
        background: #f8f9fa;
        color: #e74c3c;
    }
`;

document.head.appendChild(notificationStyles);
