const CondominiosPage = (function () {
    // Estado da aplicação
    let state = {
        filters: {
            status: 'todos',
            microarea: 'todos',
            acs: 'todos',
            cobertura: 0
        },
        isLoading: false,
        modalOpen: false,
        editingId: null
    };

    // ============================================
    // FUNÇÕES PRIVADAS
    // ============================================

    /**
     * Inicializa a página
     */
    function init() {
        console.log('📍 Página de condomínios inicializada');
        console.log('👤 Configuração do usuário:', window.APP_CONFIG);

        setupEventListeners();
        setupModalCloseHandlers();
        checkPermissions();
        updateCurrentDate();
        setupCardButtons();
    }

    /**
     * Configura manipuladores para fechar modais
     */
    function setupModalCloseHandlers() {
        // Fechar modal ao clicar fora
        document.addEventListener('click', function (event) {
            const modal = document.getElementById('modalCondominio');
            if (modal && event.target === modal) {
                closeModal();
            }

            const editModal = document.getElementById('modalEditarCondominio');
            if (editModal && event.target === editModal) {
                closeEditModal();
            }
        });

        // Fechar com ESC
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
                closeModal();
                closeEditModal();
            }
        });
    }

    /**
     * Configura eventos com delegação moderna
     */
    function setupEventListeners() {
        // Delegação de eventos para ações
        document.addEventListener('click', handleActionClick);

        // Botão de novo condomínio (se existir)
        const btnNovo = document.querySelector('.btn-add-condominio');
        if (btnNovo) {
            btnNovo.addEventListener('click', function (e) {
                e.preventDefault();
                showCreateModal();
            });
        }
    }

    /**
     * Configura botões dos cards
     */
    function setupCardButtons() {
        document.addEventListener('click', function (event) {
            const target = event.target;

            // Verificar se clicou em um botão de ação nos cards
            if (target.closest('.action-btn-small')) {
                const button = target.closest('.action-btn-small');
                const id = button.getAttribute('data-id');

                if (!id) return;

                // Determinar tipo de ação
                if (button.classList.contains('edit')) {
                    event.preventDefault();
                    editarCondominio(id);
                } else if (button.classList.contains('delete')) {
                    event.preventDefault();
                    const card = button.closest('.condominio-card-modern');
                    const nome = card ? card.querySelector('.card-title').textContent : 'Condomínio';
                    confirmarExclusao(id, nome);
                } else if (button.classList.contains('view')) {
                    event.preventDefault();
                    verDetalhes(id);
                }
            }
        });
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
     * Atualiza data atual específica para a página
     */
    function updateCurrentDate() {
        const dateElement = document.querySelector('.stats-badges .stat-badge:last-child span');
        if (dateElement) {
            dateElement.textContent = new Date().toLocaleDateString('pt-BR');
        }
    }

    /**
     * Verifica permissões específicas da página
     */
    function checkPermissions() {
        console.log('Verificando permissões para condomínios...');
    }

    // ============================================
    // FUNÇÕES DE PERMISSÃO ESPECÍFICAS
    // ============================================

    /**
     * Verifica se usuário pode realizar ação (ESPECÍFICO PARA CONDOMÍNIOS)
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

    // ============================================
    // FUNÇÕES DE NOTIFICAÇÃO (ESPECÍFICAS)
    // ============================================

    /**
     * Mostra notificação elegante (ESPECÍFICO PARA CONDOMÍNIOS)
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
     * Mostra modal para convidado (ESPECÍFICO PARA CONDOMÍNIOS)
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
                <button class="modal-close" onclick="this.closest('.modal').remove()">
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

    // ============================================
    // FUNÇÕES DE FORMULÁRIO (ESPECÍFICAS PARA CONDOMÍNIOS)
    // ============================================

    /**
     * Destaca campo com feedback visual (ESPECÍFICO)
     */
    function highlightField(fieldId, type) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.style.borderColor = type === 'error' ? '#e74c3c' : '#2ecc71';
            field.style.boxShadow = type === 'error' ? '0 0 0 2px rgba(231, 76, 60, 0.2)' : '0 0 0 2px rgba(46, 204, 113, 0.2)';
            setTimeout(() => {
                field.style.borderColor = '';
                field.style.boxShadow = '';
            }, 3000);
        }
    }

    // ============================================
    // FUNÇÕES DE MODAL DE CRIAÇÃO (USANDO HTML)
    // ============================================

    /**
     * Mostra modal de novo condomínio (usa o modal do HTML)
     */
    function showCreateModal() {
        if (!canPerformAction()) return false;

        // Usa o modal existente no HTML
        const modal = document.getElementById('modalCondominio');
        if (!modal) {
            console.error('Modal não encontrado no HTML');
            return false;
        }

        // Mostra o modal
        modal.classList.add('active');
        state.modalOpen = true;

        return true;
    }

    /**
     * Fecha modal de criação
     */
    function closeModal() {
        const modal = document.getElementById('modalCondominio');
        if (modal) {
            modal.classList.remove('active');
            state.modalOpen = false;
        }
    }

    // ============================================
    // FUNÇÕES DE EDIÇÃO DE CONDOMÍNIO
    // ============================================

    /**
     * Edita condomínio
     */
    async function editarCondominio(id) {
        if (!canPerformAction()) return;

        try {
            showNotification('Carregando dados do condomínio...', 'info');

            // Buscar dados do condomínio
            const response = await fetch(`/api/condominio/${id}`);
            if (!response.ok) {
                throw new Error('Condomínio não encontrado');
            }

            const condominio = await response.json();
            showModalEdicao(condominio);

        } catch (error) {
            console.error('Erro:', error);
            showNotification('❌ Erro ao carregar dados do condomínio', 'error');
        }
    }

    /**
     * Mostra modal de edição de condomínio
     */
    function showModalEdicao(condominio) {
        state.modalOpen = true;
        state.editingId = condominio.id;

        // Cria conteúdo do modal de edição
        const modalContent = `
    <div class="modal-header">
        <div class="modal-header-content">
            <div class="modal-icon">
                <i class="fas fa-edit"></i>
            </div>
            <div>
                <h3>Editar Condomínio</h3>
                <p class="modal-subtitle">Atualize as informações do condomínio</p>
                <p class="modal-subtitle" style="font-size: 0.9rem; color: #666;">
                    ID: ${condominio.id} • ${condominio.nome}
                </p>
            </div>
        </div>
        <button class="modal-close" onclick="CondominiosPage.closeEditModal()">
            <i class="fas fa-times"></i>
        </button>
    </div>
    <div class="modal-body">
        <form id="formEditarCondominio" class="modal-form modern-form">
            <!-- Informações Básicas -->
            <div class="form-section">
                <h4 class="form-section-title">
                    <i class="fas fa-info-circle"></i>
                    Informações Básicas
                </h4>
                
                <div class="form-grid">
                    <div class="form-group">
                        <label for="edit-nome" class="form-label">
                            <i class="fas fa-building"></i>
                            Nome do Condomínio *
                        </label>
                        <input type="text" id="edit-nome" class="form-input" required 
                               value="${condominio.nome}" placeholder="Nome do condomínio">
                    </div>
                </div>
                
                <div class="form-grid columns-3">
                    <div class="form-group">
                        <label for="edit-torres" class="form-label">
                            <i class="fas fa-layer-group"></i>
                            Total de Blocos *
                        </label>
                        <input type="number" id="edit-torres" class="form-input" min="1" required 
                               value="${condominio.torres}" placeholder="Total de blocos">
                    </div>
                    <div class="form-group">
                        <label for="edit-apartamentos" class="form-label">
                            <i class="fas fa-door-closed"></i>
                            Total de Apartamentos *
                        </label>
                        <input type="number" id="edit-apartamentos" class="form-input" min="1" required 
                               value="${condominio.apartamentos}" placeholder="Total de apartamentos">
                    </div>
                    <div class="form-group">
                        <label for="edit-moradores" class="form-label">
                            <i class="fas fa-users"></i>
                            Total de Moradores *
                        </label>
                        <input type="number" id="edit-moradores" class="form-input" min="1" required 
                               value="${condominio.moradores}" placeholder="Total de moradores">
                    </div>
                </div>
            </div>

            <!-- Cobertura por ACS -->
            <div class="form-section">
                <h4 class="form-section-title">
                    <i class="fas fa-user-md"></i>
                    Cobertura por Agente Comunitário de Saúde
                </h4>
                
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label">Condomínio possui ACS?</label>
                        <div class="radio-group">
                            <label class="radio-option">
                                <input type="radio" name="edit-tem_acs" value="sim" 
                                       ${condominio.acs_responsavel ? 'checked' : ''} 
                                       onchange="CondominiosPage._toggleEditACSFields(true)">
                                <div class="radio-content">
                                    <i class="fas fa-user-check"></i>
                                    <div>
                                        <strong>Com ACS</strong>
                                        <small>Existe ACS trabalhando neste condomínio</small>
                                    </div>
                                </div>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="edit-tem_acs" value="nao" 
                                       ${!condominio.acs_responsavel ? 'checked' : ''} 
                                       onchange="CondominiosPage._toggleEditACSFields(false)">
                                <div class="radio-content">
                                    <i class="fas fa-user-times"></i>
                                    <div>
                                        <strong>Sem ACS</strong>
                                        <small>Não há ACS trabalhando neste condomínio</small>
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                <div id="edit-acs-fields" style="margin-top: 20px; display: ${condominio.acs_responsavel ? 'block' : 'none'}">
                    <div class="form-grid columns-2">
                        <div class="form-group">
                            <label for="edit-acs_responsavel" class="form-label">
                                <i class="fas fa-user-md"></i>
                                Nome do ACS
                            </label>
                            <input type="text" id="edit-acs_responsavel" class="form-input" 
                                   value="${condominio.acs_responsavel || ''}" 
                                   placeholder="Ex: Maria Silva">
                        </div>
<div class="form-group">
    <label for="edit-blocos_cobertos" class="form-label">
        <i class="fas fa-map-marker-alt"></i>
        Blocos Cobertos
    </label>
    <input type="number" id="edit-blocos_cobertos" class="form-input"
           min="0" max="${condominio.torres}"
           value="${condominio.blocos_cobertos || 0}" 
           onchange="CondominiosPage._calcularEditCobertura()">
    <div class="form-hint">Número de blocos cobertos pelo ACS</div>
</div>
<div class="form-group">
    <label for="edit-blocos_descobertos" class="form-label">
        <i class="fas fa-map-marker-alt"></i>
        Blocos Descobertos
    </label>
    <input type="number" id="edit-blocos_descobertos" class="form-input"
           min="0" max="${condominio.torres}"
           value="${condominio.blocos_descobertos || condominio.torres || 0}" 
           onchange="CondominiosPage._calcularEditCobertura()">
    <div class="form-hint">Número de blocos não cobertos</div>
</div>
                    <div class="cobertura-preview">
                        <div class="preview-header">
                            <h5><i class="fas fa-chart-pie"></i> Prévia da Cobertura</h5>
                            <span class="current-coverage">
                                Atual: ${condominio.cobertura || 0}% (${condominio.blocos_cobertos || 0}/${condominio.torres || 0} blocos)
                            </span>
                        </div>
                        <div class="preview-content">
                            <div class="cobertura-visual">
                                <div class="cobertura-barra">
                                    <div class="coberto" id="edit-preview-coberto" 
                                         style="width: ${condominio.cobertura || 0}%"></div>
                                    <div class="descoberto" id="edit-preview-descoberto" 
                                         style="width: ${100 - (condominio.cobertura || 0)}%"></div>
                                </div>
                                <div class="cobertura-numbers">
                                    <span id="edit-text-coberto">${condominio.blocos_cobertos || 0} blocos cobertos (${condominio.cobertura || 0}%)</span>
                                    <span id="edit-text-descoberto">${condominio.blocos_descobertos || condominio.torres || 0} blocos descobertos (${100 - (condominio.cobertura || 0)}%)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Dados de Saúde -->
            <div class="form-section">
                <h4 class="form-section-title">
                    <i class="fas fa-heartbeat"></i>
                    Dados de Saúde da População
                </h4>
                
                <div class="form-grid columns-3">
                    <div class="form-group">
                        <label for="edit-hipertensos" class="form-label">
                            <i class="fas fa-heartbeat"></i>
                            Hipertensos
                        </label>
                        <input type="number" id="edit-hipertensos" class="form-input" min="0" 
                               value="${condominio.hipertensos || 0}">
                        <div class="form-hint">Número de hipertensos registrados</div>
                    </div>
                    <div class="form-group">
                        <label for="edit-diabeticos" class="form-label">
                            <i class="fas fa-prescription-bottle"></i>
                            Diabéticos
                        </label>
                        <input type="number" id="edit-diabeticos" class="form-input" min="0" 
                               value="${condominio.diabeticos || 0}">
                        <div class="form-hint">Número de diabéticos registrados</div>
                    </div>
                    <div class="form-group">
                        <label for="edit-gestantes" class="form-label">
                            <i class="fas fa-female"></i>
                            Gestantes
                        </label>
                        <input type="number" id="edit-gestantes" class="form-input" min="0" 
                               value="${condominio.gestantes || 0}">
                        <div class="form-hint">Número de gestantes registradas</div>
                    </div>
                </div>
                
                <div class="form-grid">
                    <div class="form-group">
                        <label for="edit-prioridade" class="form-label">
                            <i class="fas fa-exclamation-triangle"></i>
                            Nível de Prioridade
                        </label>
                        <select id="edit-prioridade" class="form-select">
                            <option value="baixa" ${condominio.prioridade === 'baixa' ? 'selected' : ''}>Baixa</option>
                            <option value="media" ${(!condominio.prioridade || condominio.prioridade === 'media') ? 'selected' : ''}>Média</option>
                            <option value="alta" ${condominio.prioridade === 'alta' ? 'selected' : ''}>Alta</option>
                        </select>
                        <div class="form-hint">Defina a prioridade de atendimento</div>
                    </div>
                </div>
            </div>

            <!-- Última Visita -->
            <div class="form-section">
                <h4 class="form-section-title">
                    <i class="far fa-calendar-alt"></i>
                    Última Visita
                </h4>
                
                <div class="form-grid">
                    <div class="form-group">
                        <label for="edit-ultima_visita" class="form-label">
                            <i class="far fa-calendar"></i>
                            Data da Última Visita
                        </label>
                        <input type="date" id="edit-ultima_visita" class="form-input" 
                               value="${condominio.ultima_visita || new Date().toISOString().split('T')[0]}">
                        <div class="form-hint">Data da última visita realizada</div>
                    </div>
                </div>
            </div>

            <!-- Botões de ação -->
            <div class="form-actions" style="display: flex; justify-content: flex-end; gap: 15px; margin-top: 30px;">
                <button type="button" class="btn-secondary" onclick="CondominiosPage.closeEditModal()">
                    <i class="fas fa-times"></i> Cancelar
                </button>
                <button type="submit" class="btn-primary" id="edit-submitBtn">
                    <i class="fas fa-save"></i> Salvar Alterações
                </button>
            </div>
        </form>
    </div>
</div>
`;

        // Cria ou obtém o modal de edição
        let modal = document.getElementById('modalEditarCondominio');
        if (!modal) {
            // Cria o modal dinamicamente se não existir
            const modalHTML = `
            <div id="modalEditarCondominio" class="modal">
                <div class="modal-content" style="max-width: 800px;"></div>
            </div>
        `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            modal = document.getElementById('modalEditarCondominio');
        }

        modal.querySelector('.modal-content').innerHTML = modalContent;
        modal.style.display = 'block';

        // Configura eventos do formulário de edição
        const form = document.getElementById('formEditarCondominio');
        if (form) {
            form.addEventListener('submit', handleEditSubmit);
        }

        // Configura eventos para cálculo de cobertura
        const blocosInput = document.getElementById('edit-blocos_ativos');
        const torresInput = document.getElementById('edit-torres');

        if (blocosInput) {
            blocosInput.addEventListener('input', calcularEditCobertura);
        }
        if (torresInput) {
            torresInput.addEventListener('input', calcularEditCobertura);
        }

        return true;
    }

    /**
 * Manipula envio do formulário de edição
 */
    async function handleEditSubmit(event) {
        event.preventDefault();

        if (state.isLoading) return;
        state.isLoading = true;

        const submitBtn = document.getElementById('edit-submitBtn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
        submitBtn.disabled = true;

        try {
            // Coleta e CONVERTE dados
            const data = {
                nome: document.getElementById('edit-nome').value,
                torres: parseInt(document.getElementById('edit-torres').value) || 0,
                apartamentos: parseInt(document.getElementById('edit-apartamentos').value) || 0,
                moradores: parseInt(document.getElementById('edit-moradores').value) || 0,
                hipertensos: parseInt(document.getElementById('edit-hipertensos').value) || 0,
                diabeticos: parseInt(document.getElementById('edit-diabeticos').value) || 0,
                gestantes: parseInt(document.getElementById('edit-gestantes').value) || 0,
                prioridade: document.getElementById('edit-prioridade').value,
                ultima_visita: document.getElementById('edit-ultima_visita').value,
                acs_responsavel: document.getElementById('edit-acs_responsavel')?.value || null,
                blocos_ativos: document.getElementById('edit-blocos_ativos')?.value || ''
            };

            // CALCULAR COBERTURA NOVA LÓGICA
            const temACS = data.acs_responsavel && data.acs_responsavel.trim() !== '';
            const blocosAtivosArray = data.blocos_ativos.split(/[,;]/).map(p => p.trim()).filter(p => p.length > 0);

            let blocosCobertos = 0;
            if (temACS && data.blocos_ativos) {
                const numerosCobertos = new Set();

                for (const parte of blocosAtivosArray) {
                    if (parte.includes('-')) {
                        const faixa = parte.split('-').map(n => n.trim()).filter(n => n.length > 0);
                        if (faixa.length === 2) {
                            const inicio = parseInt(faixa[0]);
                            const fim = parseInt(faixa[1]);

                            if (!isNaN(inicio) && !isNaN(fim) && inicio <= fim) {
                                for (let i = inicio; i <= fim; i++) {
                                    if (i >= 1 && i <= data.torres) {
                                        numerosCobertos.add(i);
                                    }
                                }
                            }
                        }
                    } else {
                        const num = parseInt(parte);
                        if (!isNaN(num) && num >= 1 && num <= data.torres) {
                            numerosCobertos.add(num);
                        }
                    }
                }

                blocosCobertos = numerosCobertos.size;
            }

            // Calcular percentual
            const cobertura = data.torres > 0 ? Math.round((blocosCobertos / data.torres) * 100) : 0;
            data.cobertura = cobertura;
            data.blocos_cobertos = blocosCobertos;
            data.blocos_descobertos = data.torres - blocosCobertos;

            // Determinar status
            if (cobertura >= 67) {
                data.status_cobertura = 'completo';
            } else if (cobertura >= 34) {
                data.status_cobertura = 'parcial';
            } else {
                data.status_cobertura = 'descoberto';
            }

            // Validação básica
            const erros = [];

            if (!data.nome || data.nome.trim().length < 3) {
                erros.push('Nome deve ter pelo menos 3 caracteres');
                highlightField('edit-nome', 'error');
            }

            if (data.torres <= 0) {
                erros.push('Total de blocos deve ser maior que zero');
                highlightField('edit-torres', 'error');
            }

            if (data.apartamentos <= 0) {
                erros.push('Total de apartamentos deve ser maior que zero');
            }

            if (data.moradores <= 0) {
                erros.push('Total de moradores deve ser maior que zero');
            }

            // Validação ACS
            if (temACS && blocosCobertos <= 0) {
                erros.push('Se há ACS responsável, deve informar blocos atendidos válidos');
            }

            if (erros.length > 0) {
                showNotification('❌ ' + erros.join('<br>'), 'error');
                throw new Error('Erros de validação');
            }

            // Envia para API
            const response = await fetch(`/api/atualizar-condominio/${state.editingId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.status === 'sucesso') {
                showNotification('✅ Condomínio atualizado com sucesso!', 'success');
                closeEditModal();

                // Recarrega a página após 1.5 segundos
                setTimeout(() => location.reload(), 1500);
            } else {
                showNotification(`❌ ${result.mensagem}`, 'error');
            }

        } catch (error) {
            console.error('Erro ao atualizar condomínio:', error);
            if (error.message !== 'Erros de validação') {
                showNotification('❌ Erro ao atualizar condomínio', 'error');
            }
        } finally {
            state.isLoading = false;
            if (submitBtn) {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        }
    }

    /**
     * Calcula prévia da cobertura no modal de edição
     */
    function calcularEditCobertura() {
        const torresInput = document.getElementById('edit-torres');
        const cobertosInput = document.getElementById('edit-blocos_cobertos');
        const descobertosInput = document.getElementById('edit-blocos_descobertos');

        if (!torresInput || !cobertosInput) return;

        const totalTorres = parseInt(torresInput.value) || 0;
        const cobertos = parseInt(cobertosInput.value) || 0;

        // Ajustar valores para garantir consistência
        const cobertosEfetivos = Math.min(cobertos, totalTorres);
        const descobertos = totalTorres - cobertosEfetivos;

        if (cobertosInput) cobertosInput.value = cobertosEfetivos;
        if (descobertosInput) descobertosInput.value = descobertos;

        atualizarEditPreviewCobertura(cobertosEfetivos, totalTorres);
    }

    /**
     * Atualiza visualização da cobertura no modal de edição
     */
    function atualizarEditPreviewCobertura(cobertos, total) {
        const percentual = total > 0 ? Math.round((cobertos / total) * 100) : 0;
        const descobertos = total - cobertos;

        const barraCoberto = document.getElementById('edit-preview-coberto');
        const barraDescoberto = document.getElementById('edit-preview-descoberto');

        if (barraCoberto) barraCoberto.style.width = `${percentual}%`;
        if (barraDescoberto) barraDescoberto.style.width = `${100 - percentual}%`;

        const textCoberto = document.getElementById('edit-text-coberto');
        const textDescoberto = document.getElementById('edit-text-descoberto');

        if (textCoberto) {
            textCoberto.textContent = `${cobertos} bloco${cobertos !== 1 ? 's' : ''} coberto${cobertos !== 1 ? 's' : ''} (${percentual}%)`;
        }

        if (textDescoberto) {
            textDescoberto.textContent = `${descobertos} bloco${descobertos !== 1 ? 's' : ''} descoberto${descobertos !== 1 ? 's' : ''} (${100 - percentual}%)`;
        }
    }

    /**
     * Alterna campos de ACS no modal de edição
     */
    function toggleEditACSFields(temACS) {
        const acsFields = document.getElementById('edit-acs-fields');
        if (acsFields) {
            acsFields.style.display = temACS ? 'block' : 'none';
        }

        if (!temACS) {
            const acsResponsavel = document.getElementById('edit-acs_responsavel');
            const blocosAtivos = document.getElementById('edit-blocos_ativos');

            if (acsResponsavel) acsResponsavel.value = '';
            if (blocosAtivos) blocosAtivos.value = '';

            const torresInput = document.getElementById('edit-torres');
            const totalTorres = torresInput ? parseInt(torresInput.value) || 0 : 0;
            atualizarEditPreviewCobertura(0, totalTorres);
        }
    }

    /**
     * Fecha modal de edição
     */
    function closeEditModal() {
        const modal = document.getElementById('modalEditarCondominio');
        if (modal) {
            modal.style.opacity = '0';
            modal.style.transform = 'scale(0.95)';
            setTimeout(() => {
                modal.style.display = 'none';
                modal.style.opacity = '1';
                modal.style.transform = 'scale(1)';
                modal.querySelector('.modal-content').innerHTML = '';
                state.modalOpen = false;
                state.editingId = null;
            }, 300);
        }
    }

    // ============================================
    // FUNÇÕES DE EXCLUSÃO
    // ============================================

    /**
     * Exclui condomínio
     */
    async function excluirCondominio(id) {
        try {
            // Adiciona feedback visual
            showNotification('⏳ Excluindo condomínio...', 'info');

            // Desabilita botões para evitar duplo clique
            const deleteBtn = document.querySelector(`.btn-delete[data-id="${id}"]`);
            if (deleteBtn) deleteBtn.disabled = true;

            // Faz a requisição DELETE
            const response = await fetch(`/api/excluir-condominio/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const result = await response.json();

            if (result.status === 'sucesso') {
                showNotification('✅ Condomínio excluído com sucesso!', 'success');

                // Remove da tabela com animação
                const row = document.querySelector(`tr[data-id="${id}"]`);
                if (row) {
                    row.style.opacity = '0';
                    row.style.transform = 'translateX(-20px)';
                    setTimeout(() => {
                        row.remove();
                        updateCounters(); // Atualiza contadores
                    }, 300);
                }

                // Remove card se existir (visualização alternativa)
                const card = document.querySelector(`.card[data-id="${id}"]`);
                if (card) {
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.8)';
                    setTimeout(() => card.remove(), 300);
                }

            } else {
                showNotification(`❌ ${result.mensagem}`, 'error');
                // Reabilita botão se falhou
                if (deleteBtn) deleteBtn.disabled = false;
            }

        } catch (error) {
            console.error('Erro ao excluir:', error);
            showNotification('❌ Erro ao conectar com o servidor', 'error');

            // Reabilita botão em caso de erro
            const deleteBtn = document.querySelector(`.btn-delete[data-id="${id}"]`);
            if (deleteBtn) deleteBtn.disabled = false;
        }
    }

    /**
     * Atualiza contadores após exclusão
     */
    function updateCounters() {
        // Atualiza contador de condomínios
        const totalCondominios = document.querySelectorAll('tr[data-id]').length;
        const counterElement = document.querySelector('.total-condominios');
        if (counterElement) {
            counterElement.textContent = totalCondominios;
        }
    }

    /**
     * Confirma exclusão com modal elegante
     */
    async function confirmarExclusao(id, nome) {
        if (!canPerformAction()) return;

        try {
            // Usando SweetAlert2 para confirmação mais elegante
            if (typeof Swal !== 'undefined') {
                const result = await Swal.fire({
                    title: 'Excluir Condomínio',
                    html: `Tem certeza que deseja excluir o condomínio?<br><br>
                      <strong>"${nome}"</strong><br><br>
                      Esta ação não pode ser desfeita.`,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Sim, excluir',
                    cancelButtonText: 'Cancelar',
                    confirmButtonColor: '#e74c3c',
                    cancelButtonColor: '#7f8c8d',
                    reverseButtons: true
                });

                if (result.isConfirmed) {
                    await excluirCondominio(id);
                }
            } else {
                // Fallback para confirm padrão
                if (confirm(`🗑️ Tem certeza que deseja excluir o condomínio?\n\n"${nome}"\n\nEsta ação não pode ser desfeita.`)) {
                    await excluirCondominio(id);
                }
            }
        } catch (error) {
            console.error('Erro na confirmação:', error);
        }
    }

    // ============================================
    // FUNÇÕES AUXILIARES
    // ============================================

    /**
     * Ver detalhes do condomínio
     */
    function verDetalhes(id) {
        showNotification(`👁️ Visualizando detalhes do condomínio ID: ${id}`, 'info');
        // Aqui você pode implementar a lógica para mostrar detalhes
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
         * Mostra modal de novo condomínio (usa o modal do HTML)
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
         * Fecha modal de criação
         */
        closeModal: function () {
            closeModal();
        },

        /**
         * Fecha modal de edição
         */
        closeEditModal: function () {
            closeEditModal();
        },

        /**
         * Alterna campos de ACS (para compatibilidade)
         */
        toggleACSFields: function (temACS) {
            // Esta função agora está no JavaScript inline do HTML
            console.log('toggleACSFields chamado:', temACS);
        },

        /**
         * Calcular cobertura (para compatibilidade)
         */
        calcularCobertura: function () {
            // Esta função agora está no JavaScript inline do HTML
            console.log('calcularCobertura chamado');
        },

        /**
         * Navegar entre etapas (para compatibilidade)
         */
        navegarEtapa: function (direction) {
            // Esta função agora está no JavaScript inline do HTML
            console.log('navegarEtapa chamado:', direction);
        },

        /**
         * Alterna campos de ACS no modal de edição
         */
        toggleEditACSFields: function (temACS) {
            toggleEditACSFields(temACS);
        },

        /**
         * Calcular cobertura no modal de edição
         */
        calcularEditCobertura: function () {
            calcularEditCobertura();
        },

        /**
         * Aplica filtro rápido
         */
        filtrar: function (tipo) {
            console.log('Filtrar por:', tipo);
            // Implementação do filtro
        },

        /**
         * Ver detalhes do condomínio
         */
        verDetalhes: function (id) {
            verDetalhes(id);
        },

        /**
         * Editar condomínio
         */
        editarCondominio: function (id) {
            editarCondominio(id);
        },

        /**
         * Confirmar exclusão
         */
        confirmarExclusao: function (id, nome) {
            confirmarExclusao(id, nome);
        },

        /**
         * Mostrar notificação
         */
        showNotification: function (message, type) {
            showNotification(message, type);
        }
    };
})();

// Inicializa quando o script carrega
CondominiosPage.initialize();

// Torna disponível globalmente
window.CondominiosPage = CondominiosPage;
