// static/js/condominios.js - VERSÃO CORRIGIDA E COMPLETA

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
        currentStep: 1,
        isLoading: false,
        modalOpen: false
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
     * Mostra modal de novo condomínio com múltiplas etapas
     */
    function showCreateModal() {
        if (!canPerformAction()) return false;

        state.currentStep = 1;
        state.modalOpen = true;

        // Cria conteúdo do modal moderno com 3 etapas
        const modalContent = `
        <div class="modal-header">
            <div class="modal-header-content">
                <div class="modal-icon">
                    <i class="fas fa-plus-circle"></i>
                </div>
                <div>
                    <h3>Novo Condomínio</h3>
                    <p class="modal-subtitle">Complete as etapas para adicionar um novo condomínio</p>
                </div>
            </div>
            <button class="modal-close" onclick="CondominiosPage.closeModal()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="modal-body">
            <div class="form-steps-indicator">
                <div class="step active" data-step="1">
                    <div class="step-number">1</div>
                    <div class="step-label">Informações Básicas</div>
                </div>
                <div class="step" data-step="2">
                    <div class="step-number">2</div>
                    <div class="step-label">Cobertura ACS</div>
                </div>
                <div class="step" data-step="3">
                    <div class="step-number">3</div>
                    <div class="step-label">Dados de Saúde</div>
                </div>
            </div>

            <form id="formNovoCondominio" class="modal-form modern-form">
                <!-- ETAPA 1: Informações Básicas -->
                <div class="form-step active" id="step1">
                    <div class="form-section">
                        <h4 class="form-section-title">
                            <i class="fas fa-info-circle"></i>
                            Informações Básicas
                        </h4>
                        
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="nomeCondominio" class="form-label">
                                    <i class="fas fa-building"></i>
                                    Nome do Condomínio *
                                </label>
                                <input type="text" id="nomeCondominio" class="form-input" required 
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
                </div>

                <!-- ETAPA 2: Cobertura por ACS -->
                <div class="form-step" id="step2" style="display: none;">
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
                                        <input type="radio" name="tem_acs" value="sim" checked onchange="CondominiosPage._toggleACSFields(true)">
                                        <div class="radio-content">
                                            <i class="fas fa-user-check"></i>
                                            <div>
                                                <strong>Com ACS</strong>
                                                <small>Existe ACS trabalhando neste condomínio</small>
                                            </div>
                                        </div>
                                    </label>
                                    <label class="radio-option">
                                        <input type="radio" name="tem_acs" value="nao" onchange="CondominiosPage._toggleACSFields(false)">
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

                        <div id="acs-fields" style="margin-top: 20px;">
                            <div class="form-grid columns-2">
                                <div class="form-group">
                                    <label for="acs_responsavel" class="form-label">
                                        <i class="fas fa-user-md"></i>
                                        Nome do ACS
                                    </label>
                                    <input type="text" id="acs_responsavel" class="form-input" 
                                           placeholder="Ex: Maria Silva">
                                </div>
                                <div class="form-group">
                                    <label for="blocos_ativos" class="form-label">
                                        <i class="fas fa-map-marker-alt"></i>
                                        Blocos Atendidos
                                    </label>
                                    <input type="text" id="blocos_ativos" class="form-input" 
                                           placeholder="Ex: 1-13 ou 1,2,3,5-8" onchange="CondominiosPage._calcularCobertura()">
                                    <div class="form-hint">Informe os blocos que o ACS atende</div>
                                </div>
                            </div>
                            
                            <div class="cobertura-preview">
                                <div class="preview-header">
                                    <h5><i class="fas fa-chart-pie"></i> Prévia da Cobertura</h5>
                                </div>
                                <div class="preview-content">
                                    <div class="cobertura-visual">
                                        <div class="cobertura-barra">
                                            <div class="coberto" id="preview-coberto" style="width: 0%"></div>
                                            <div class="descoberto" id="preview-descoberto" style="width: 100%"></div>
                                        </div>
                                        <div class="cobertura-numbers">
                                            <span id="text-coberto">0 blocos cobertos (0%)</span>
                                            <span id="text-descoberto">0 blocos descobertos (0%)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ETAPA 3: Dados de Saúde -->
                <div class="form-step" id="step3" style="display: none;">
                    <div class="form-section">
                        <h4 class="form-section-title">
                            <i class="fas fa-heartbeat"></i>
                            Dados de Saúde da População
                        </h4>
                        
                        <div class="form-grid columns-3">
                            <div class="form-group">
                                <label for="hipertensos" class="form-label">
                                    <i class="fas fa-heartbeat"></i>
                                    Hipertensos
                                </label>
                                <input type="number" id="hipertensos" class="form-input" min="0" value="0">
                                <div class="form-hint">Número de hipertensos registrados</div>
                            </div>
                            <div class="form-group">
                                <label for="diabeticos" class="form-label">
                                    <i class="fas fa-prescription-bottle"></i>
                                    Diabéticos
                                </label>
                                <input type="number" id="diabeticos" class="form-input" min="0" value="0">
                                <div class="form-hint">Número de diabéticos registrados</div>
                            </div>
                            <div class="form-group">
                                <label for="gestantes" class="form-label">
                                    <i class="fas fa-female"></i>
                                    Gestantes
                                </label>
                                <input type="number" id="gestantes" class="form-input" min="0" value="0">
                                <div class="form-hint">Número de gestantes registradas</div>
                            </div>
                        </div>
                        
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="prioridade" class="form-label">
                                    <i class="fas fa-exclamation-triangle"></i>
                                    Nível de Prioridade
                                </label>
                                <select id="prioridade" class="form-select">
                                    <option value="baixa">Baixa</option>
                                    <option value="media" selected>Média</option>
                                    <option value="alta">Alta</option>
                                </select>
                                <div class="form-hint">Defina a prioridade de atendimento</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Navegação entre etapas -->
                <div class="form-navigation">
                    <button type="button" class="btn-secondary btn-prev" id="btnVoltar" style="display: none;">
                        <i class="fas fa-arrow-left"></i> Voltar
                    </button>
                    <button type="button" class="btn-primary btn-next" id="btnProximaEtapa">
                        Próxima Etapa <i class="fas fa-arrow-right"></i>
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

            // Configura eventos do formulário
            const form = document.getElementById('formNovoCondominio');
            if (form) {
                form.addEventListener('submit', handleCreateSubmit);
            }

            // Configura eventos para os campos
            const blocosInput = document.getElementById('blocos_ativos');
            if (blocosInput) {
                blocosInput.addEventListener('input', calcularCoberturaPreview);
            }

            const torresInput = document.getElementById('torres');
            if (torresInput) {
                torresInput.addEventListener('input', calcularCoberturaPreview);
            }

            // Configura botões de navegação
            configurarBotoesNavegacao();
        }

        return true;
    }

    /**
     * Configura os botões de navegação do modal
     */
    function configurarBotoesNavegacao() {
        const btnVoltar = document.getElementById('btnVoltar');
        const btnProxima = document.getElementById('btnProximaEtapa');

        if (btnVoltar) {
            btnVoltar.onclick = function () {
                navegarEtapa('prev');
            };
        }

        if (btnProxima) {
            btnProxima.onclick = function () {
                if (state.currentStep === 3) {
                    // Última etapa: valida e salva os dados
                    if (validarEtapaAtual(3)) {
                        // Dispara o evento de submit do formulário
                        const submitEvent = new Event('submit', { cancelable: true });
                        const form = document.getElementById('formNovoCondominio');
                        if (form) {
                            form.dispatchEvent(submitEvent);
                        }
                    }
                } else {
                    // Outras etapas: navega para próxima
                    navegarEtapa('next');
                }
            };
        }

        // Atualiza texto dos botões
        atualizarTextoBotoes();
    }

    /**
     * Atualiza texto dos botões de navegação
     */
    function atualizarTextoBotoes() {
        const btnProxima = document.getElementById('btnProximaEtapa');
        if (btnProxima) {
            if (state.currentStep === 3) {
                btnProxima.innerHTML = 'Finalizar <i class="fas fa-check"></i>';
            } else {
                btnProxima.innerHTML = 'Próxima Etapa <i class="fas fa-arrow-right"></i>';
            }
        }

        const btnVoltar = document.getElementById('btnVoltar');
        if (btnVoltar) {
            btnVoltar.style.display = state.currentStep > 1 ? 'inline-flex' : 'none';
        }
    }

    /**
     * Navega entre etapas do formulário
     */
    function navegarEtapa(direction) {
        const currentStep = state.currentStep;
        const totalSteps = 3;

        // Valida etapa atual antes de sair
        if (!validarEtapaAtual(currentStep)) {
            return;
        }

        let newStep;
        if (direction === 'next') {
            newStep = currentStep + 1;
        } else if (direction === 'prev') {
            newStep = currentStep - 1;
        } else {
            newStep = parseInt(direction);
        }

        // Limites
        if (newStep < 1 || newStep > totalSteps) return;

        // Oculta etapa atual
        const currentStepEl = document.getElementById(`step${currentStep}`);
        const currentStepIndicator = document.querySelector(`.step[data-step="${currentStep}"]`);

        if (currentStepEl) {
            currentStepEl.classList.remove('active');
            currentStepEl.style.display = 'none';
        }

        if (currentStepIndicator) currentStepIndicator.classList.remove('active');

        // Mostra nova etapa
        const newStepEl = document.getElementById(`step${newStep}`);
        const newStepIndicator = document.querySelector(`.step[data-step="${newStep}"]`);

        if (newStepEl) {
            newStepEl.classList.add('active');
            newStepEl.style.display = 'block';
        }

        if (newStepIndicator) newStepIndicator.classList.add('active');

        // Atualiza estado
        state.currentStep = newStep;

        // Atualiza botões de navegação
        atualizarTextoBotoes();
    }

    /**
     * Valida etapa atual antes de avançar
     */
    function validarEtapaAtual(step) {
        switch (step) {
            case 1:
                // Valida informações básicas
                const nome = document.getElementById('nomeCondominio');
                const torres = document.getElementById('torres');
                const apartamentos = document.getElementById('apartamentos');
                const moradores = document.getElementById('moradores');

                const campos = [
                    { campo: nome, mensagem: 'Nome do condomínio é obrigatório' },
                    { campo: torres, mensagem: 'Total de blocos é obrigatório' },
                    { campo: apartamentos, mensagem: 'Total de apartamentos é obrigatório' },
                    { campo: moradores, mensagem: 'Total de moradores é obrigatório' }
                ];

                for (const item of campos) {
                    if (!item.campo || !item.campo.value || item.campo.value.trim() === '') {
                        showNotification(`❌ ${item.mensagem}`, 'error');
                        if (item.campo) {
                            highlightField(item.campo.id, 'error');
                            item.campo.focus();
                        }
                        return false;
                    }

                    if (item.campo && item.campo.type === 'number' && parseInt(item.campo.value) <= 0) {
                        const label = item.campo.previousElementSibling?.textContent || 'Campo';
                        showNotification(`❌ ${label} deve ser maior que zero`, 'error');
                        highlightField(item.campo.id, 'error');
                        item.campo.focus();
                        return false;
                    }
                }
                return true;

            case 2:
                // Validação da etapa 2 (opcional)
                return true;

            case 3:
                // Validação da etapa 3 (opcional)
                return true;

            default:
                return true;
        }
    }

    /**
     * Calcula prévia da cobertura
     */
    function calcularCoberturaPreview() {
        const torresInput = document.getElementById('torres');
        const blocosInput = document.getElementById('blocos_ativos');

        if (!torresInput || !blocosInput) return;

        const totalTorres = parseInt(torresInput.value) || 0;
        const blocosCobertosText = blocosInput.value.trim();

        if (totalTorres <= 0) {
            atualizarPreviewCobertura(0, totalTorres);
            return;
        }

        // Se não há texto de blocos cobertos, retorna 0
        if (!blocosCobertosText) {
            atualizarPreviewCobertura(0, totalTorres);
            return;
        }

        let blocosCobertos = 0;

        try {
            // Divide por vírgula ou ponto e vírgula
            const partes = blocosCobertosText.split(/[,;]/).map(p => p.trim()).filter(p => p.length > 0);

            // Conjunto para evitar duplicatas
            const numerosCobertos = new Set();

            for (const parte of partes) {
                if (parte.includes('-')) {
                    // Faixa (ex: 1-5 ou 1 - 5)
                    const faixa = parte.split('-').map(n => n.trim()).filter(n => n.length > 0);
                    if (faixa.length === 2) {
                        const inicio = parseInt(faixa[0]);
                        const fim = parseInt(faixa[1]);

                        if (!isNaN(inicio) && !isNaN(fim) && inicio <= fim) {
                            // Adiciona todos os números da faixa
                            for (let i = inicio; i <= fim; i++) {
                                if (i >= 1 && i <= totalTorres) {
                                    numerosCobertos.add(i);
                                }
                            }
                        }
                    }
                } else {
                    // Número único
                    const num = parseInt(parte);
                    if (!isNaN(num) && num >= 1 && num <= totalTorres) {
                        numerosCobertos.add(num);
                    }
                }
            }

            // Conta os blocos cobertos únicos
            blocosCobertos = numerosCobertos.size;

        } catch (e) {
            console.warn('Erro ao calcular blocos cobertos:', e);
            // Em caso de erro, mostra 0%
            blocosCobertos = 0;
        }

        // Limita ao total de torres
        blocosCobertos = Math.min(blocosCobertos, totalTorres);

        atualizarPreviewCobertura(blocosCobertos, totalTorres);
    }

    /**
 * Atualiza visualização da cobertura
 */
    function atualizarPreviewCobertura(cobertos, total) {
        const percentual = total > 0 ? Math.round((cobertos / total) * 100) : 0;
        const descobertos = total - cobertos;

        // Atualiza barras
        const barraCoberto = document.getElementById('preview-coberto');
        const barraDescoberto = document.getElementById('preview-descoberto');

        if (barraCoberto) barraCoberto.style.width = `${percentual}%`;
        if (barraDescoberto) barraDescoberto.style.width = `${100 - percentual}%`;

        // Atualiza textos
        const textCoberto = document.getElementById('text-coberto');
        const textDescoberto = document.getElementById('text-descoberto');

        if (textCoberto) {
            textCoberto.textContent = `${cobertos} bloco${cobertos !== 1 ? 's' : ''} coberto${cobertos !== 1 ? 's' : ''} (${percentual}%)`;
        }

        if (textDescoberto) {
            textDescoberto.textContent = `${descobertos} bloco${descobertos !== 1 ? 's' : ''} descoberto${descobertos !== 1 ? 's' : ''} (${100 - percentual}%)`;
        }

        // Mostra alerta se o cálculo parece errado
        if (total > 0 && cobertos === 0 && document.getElementById('blocos_ativos')?.value.trim()) {
            console.warn('⚠️ Cálculo pode estar errado. Verifique o formato dos blocos.');
        }
    }

    /**
     * Alterna campos de ACS
     */
    function toggleACSFields(temACS) {
        const acsFields = document.getElementById('acs-fields');
        if (acsFields) {
            acsFields.style.display = temACS ? 'block' : 'none';
        }

        // Se não tem ACS, limpa os campos
        if (!temACS) {
            const acsResponsavel = document.getElementById('acs_responsavel');
            const blocosAtivos = document.getElementById('blocos_ativos');

            if (acsResponsavel) acsResponsavel.value = '';
            if (blocosAtivos) blocosAtivos.value = '';

            const torresInput = document.getElementById('torres');
            const totalTorres = torresInput ? parseInt(torresInput.value) || 0 : 0;
            atualizarPreviewCobertura(0, totalTorres);
        }
    }

    /**
     * Manipula envio do formulário de criação
     */
    async function handleCreateSubmit(event) {
        event.preventDefault();

        if (state.isLoading) return;
        state.isLoading = true;

        // Encontra ou cria botão de submit
        let submitBtn = document.getElementById('submitBtn');
        let originalText = '';

        if (!submitBtn) {
            // Cria um botão temporário para mostrar estado de carregamento
            submitBtn = document.createElement('button');
            submitBtn.id = 'submitBtn';
            submitBtn.type = 'submit';
            submitBtn.style.display = 'none';
            document.body.appendChild(submitBtn);
        }

        originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
        submitBtn.disabled = true;

        // Coleta dados - NÃO calcular cobertura aqui, o backend fará isso
        const data = {
            nome: document.getElementById('nomeCondominio')?.value || '',
            torres: parseInt(document.getElementById('torres')?.value) || 0,
            apartamentos: parseInt(document.getElementById('apartamentos')?.value) || 0,
            moradores: parseInt(document.getElementById('moradores')?.value) || 0,
            hipertensos: parseInt(document.getElementById('hipertensos')?.value) || 0,
            diabeticos: parseInt(document.getElementById('diabeticos')?.value) || 0,
            gestantes: parseInt(document.getElementById('gestantes')?.value) || 0,
            prioridade: document.getElementById('prioridade')?.value || 'media',
            acs_responsavel: document.getElementById('acs_responsavel')?.value || null,
            blocos_ativos: document.getElementById('blocos_ativos')?.value || '',
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

            // Remove o botão temporário se foi criado
            if (submitBtn.parentElement && submitBtn.id === 'submitBtn' && submitBtn.style.display === 'none') {
                submitBtn.remove();
            }
        }
    }

    /**
     * Valida formulário de criação
     */
    function validateCreateForm(data) {
        const errors = [];

        if (!data.nome || data.nome.trim().length < 3) {
            errors.push('Nome deve ter pelo menos 3 caracteres');
            highlightField('nomeCondominio', 'error');
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
            field.style.boxShadow = type === 'error' ? '0 0 0 2px rgba(231, 76, 60, 0.2)' : '0 0 0 2px rgba(46, 204, 113, 0.2)';
            setTimeout(() => {
                field.style.borderColor = '';
                field.style.boxShadow = '';
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
            modal.style.transform = 'scale(0.95)';
            setTimeout(() => {
                modal.style.display = 'none';
                modal.style.opacity = '1';
                modal.style.transform = 'scale(1)';
                modal.querySelector('.modal-content').innerHTML = '';
                state.modalOpen = false;
                state.currentStep = 1;
            }, 300);
        }
    }

    /**
     * Aplica filtros à tabela de forma otimizada
     */
    function applyFilters() {
        const status = state.filters.status || 'todos';
        const prioridade = state.filters.prioridade || 'todos';
        const acs = state.filters.acs || 'todos';
        const cobertura = parseInt(state.filters.cobertura || 0);

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
        saveFilters();
    }

    /**
     * Salva filtros no localStorage
     */
    function saveFilters() {
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
            } catch (e) {
                console.warn('⚠️ Erro ao carregar filtros:', e);
            }
        }
    }

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
        showNotification(`👁️ Visualizando detalhes do condomínio ID: ${id}`, 'info');
        // Implementar modal de detalhes
        // window.location.href = `/condominio/${id}`;
    }

    /**
     * Filtro rápido
     */
    function filtrar(tipo) {
        const buttons = document.querySelectorAll('.filter-btn');
        buttons.forEach(btn => btn.classList.remove('active'));

        const target = event?.target || document.querySelector(`[onclick*="${tipo}"]`);
        if (target) target.classList.add('active');

        switch (tipo) {
            case 'alta':
                state.filters.prioridade = 'alta';
                state.filters.status = 'todos';
                break;
            case 'cobertura':
                ordenarPorCobertura();
                return;
            case 'todos':
            default:
                state.filters.status = 'todos';
                state.filters.prioridade = 'todos';
                state.filters.acs = 'todos';
                state.filters.cobertura = 0;
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
                            <label for="edit-blocos_ativos" class="form-label">
                                <i class="fas fa-map-marker-alt"></i>
                                Blocos Atendidos
                            </label>
                            <input type="text" id="edit-blocos_ativos" class="form-input" 
                                   value="${condominio.blocos_ativos || ''}" 
                                   placeholder="Ex: 1-13 ou 1,2,3,5-8" 
                                   onchange="CondominiosPage._calcularEditCobertura()">
                            <div class="form-hint">Informe os blocos que o ACS atende</div>
                        </div>
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

        // Insere no modal de edição
        const modal = document.getElementById('modalEditarCondominio');
        if (modal) {
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
        }

        return true;
    }

    /**
 * Calcula prévia da cobertura no modal de edição
 */
    function calcularEditCobertura() {
        const torresInput = document.getElementById('edit-torres');
        const blocosInput = document.getElementById('edit-blocos_ativos');

        if (!torresInput || !blocosInput) return;

        const totalTorres = parseInt(torresInput.value) || 0;
        const blocosCobertosText = blocosInput.value.trim();

        if (totalTorres <= 0) {
            atualizarEditPreviewCobertura(0, totalTorres);
            return;
        }

        // Se não há texto de blocos cobertos, retorna 0
        if (!blocosCobertosText) {
            atualizarEditPreviewCobertura(0, totalTorres);
            return;
        }

        let blocosCobertos = 0;

        try {
            // Divide por vírgula ou ponto e vírgula
            const partes = blocosCobertosText.split(/[,;]/).map(p => p.trim()).filter(p => p.length > 0);

            // Conjunto para evitar duplicatas
            const numerosCobertos = new Set();

            for (const parte of partes) {
                if (parte.includes('-')) {
                    // Faixa (ex: 1-5 ou 1 - 5)
                    const faixa = parte.split('-').map(n => n.trim()).filter(n => n.length > 0);
                    if (faixa.length === 2) {
                        const inicio = parseInt(faixa[0]);
                        const fim = parseInt(faixa[1]);

                        if (!isNaN(inicio) && !isNaN(fim) && inicio <= fim) {
                            // Adiciona todos os números da faixa
                            for (let i = inicio; i <= fim; i++) {
                                if (i >= 1 && i <= totalTorres) {
                                    numerosCobertos.add(i);
                                }
                            }
                        }
                    }
                } else {
                    // Número único
                    const num = parseInt(parte);
                    if (!isNaN(num) && num >= 1 && num <= totalTorres) {
                        numerosCobertos.add(num);
                    }
                }
            }

            // Conta os blocos cobertos únicos
            blocosCobertos = numerosCobertos.size;

        } catch (e) {
            console.warn('Erro ao calcular blocos cobertos:', e);
            blocosCobertos = 0;
        }

        // Limita ao total de torres
        blocosCobertos = Math.min(blocosCobertos, totalTorres);

        atualizarEditPreviewCobertura(blocosCobertos, totalTorres);
    }

    /**
 * Atualiza visualização da cobertura no modal de edição
 */
    function atualizarEditPreviewCobertura(cobertos, total) {
        const percentual = total > 0 ? Math.round((cobertos / total) * 100) : 0;
        const descobertos = total - cobertos;

        // Atualiza barras
        const barraCoberto = document.getElementById('edit-preview-coberto');
        const barraDescoberto = document.getElementById('edit-preview-descoberto');

        if (barraCoberto) barraCoberto.style.width = `${percentual}%`;
        if (barraDescoberto) barraDescoberto.style.width = `${100 - percentual}%`;

        // Atualiza textos
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
            // Coleta dados
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

            // Validação básica
            if (!data.nome || data.nome.trim().length < 3) {
                showNotification('❌ Nome deve ter pelo menos 3 caracteres', 'error');
                highlightField('edit-nome', 'error');
                throw new Error('Nome inválido');
            }

            if (data.torres <= 0) {
                showNotification('❌ Total de blocos deve ser maior que zero', 'error');
                highlightField('edit-torres', 'error');
                throw new Error('Blocos inválidos');
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
            if (error.message !== 'Nome inválido' && error.message !== 'Blocos inválidos') {
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

    /**
 * Alterna campos de ACS no modal de edição
 */
    function toggleEditACSFields(temACS) {
        const acsFields = document.getElementById('edit-acs-fields');
        if (acsFields) {
            acsFields.style.display = temACS ? 'block' : 'none';
        }

        // Se não tem ACS, limpa os campos
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
 * Atualiza o card visualmente sem recarregar a página
 */
    function atualizarCardVisualmente(id, dados) {
        // Atualizar no grid de cards
        const card = document.querySelector(`.condominio-card[data-id="${id}"]`);
        if (card) {
            // Atualizar atributos de dados
            card.setAttribute('data-cobertura', dados.cobertura);
            card.setAttribute('data-prioridade', dados.prioridade);
            card.setAttribute('data-status', dados.status_cobertura);
            card.setAttribute('data-acs', dados.acs_responsavel ? 'com_acs' : 'sem_acs');

            // Atualizar nome no cabeçalho
            const headerH3 = card.querySelector('.condominio-header h3');
            if (headerH3) headerH3.textContent = dados.nome;

            // Atualizar badges de prioridade e status
            const badgePriority = card.querySelector('.badge.priority-' + dados.prioridade);
            if (badgePriority) badgePriority.textContent = dados.prioridade.toUpperCase();

            const badgeStatus = card.querySelector('.badge.status-' + dados.status_cobertura);
            if (badgeStatus) {
                if (dados.status_cobertura === 'completo') {
                    badgeStatus.innerHTML = '<i class="fas fa-check-circle"></i> COBERTO';
                } else if (dados.status_cobertura === 'parcial') {
                    badgeStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i> PARCIAL';
                } else {
                    badgeStatus.innerHTML = '<i class="fas fa-times-circle"></i> DESCOBERTO';
                }
            }

            // Atualizar informações básicas
            const infoValues = card.querySelectorAll('.info-value');
            if (infoValues.length >= 4) {
                infoValues[0].textContent = dados.torres; // Blocos
                infoValues[1].textContent = dados.apartamentos; // Apartamentos
                infoValues[2].textContent = dados.moradores; // Moradores

                // ACS
                const acsSpan = card.querySelector('.info-item:nth-child(4) .info-value');
                if (acsSpan) {
                    if (dados.acs_responsavel) {
                        acsSpan.innerHTML = `<span title="${dados.acs_responsavel}">${dados.acs_responsavel.length > 15 ? dados.acs_responsavel.substring(0, 15) + '...' : dados.acs_responsavel}</span>`;
                    } else {
                        acsSpan.innerHTML = '<span class="sem-acs">Sem ACS</span>';
                    }
                }
            }

            // Atualizar dados de saúde (mini gráfico)
            const saudeBars = card.querySelectorAll('.saude-bar');
            const saudeLabels = card.querySelectorAll('.saude-labels span');

            if (saudeBars.length >= 3 && dados.moradores > 0) {
                const hipertensosPercent = (dados.hipertensos / dados.moradores * 100).toFixed(1);
                const diabeticosPercent = (dados.diabeticos / dados.moradores * 100).toFixed(1);
                const gestantesPercent = (dados.gestantes / dados.moradores * 100).toFixed(1);

                saudeBars[0].style.height = `${hipertensosPercent}%`;
                saudeBars[1].style.height = `${diabeticosPercent}%`;
                saudeBars[2].style.height = `${gestantesPercent}%`;
            }

            if (saudeLabels.length >= 3) {
                saudeLabels[0].textContent = `${dados.hipertensos} Hipertensos`;
                saudeLabels[1].textContent = `${dados.diabeticos} Diabéticos`;
                saudeLabels[2].textContent = `${dados.gestantes} Gestantes`;
            }

            // Atualizar cobertura
            const coberturaPercent = card.querySelector('.cobertura-percent');
            if (coberturaPercent) coberturaPercent.textContent = `${dados.cobertura}%`;

            const cobertoBar = card.querySelector('.coberto');
            const descobertoBar = card.querySelector('.descoberto');
            if (cobertoBar && descobertoBar) {
                cobertoBar.style.width = `${dados.cobertura}%`;
                descobertoBar.style.width = `${100 - dados.cobertura}%`;
            }

            const coberturaNumbers = card.querySelectorAll('.cobertura-numbers span');
            if (coberturaNumbers.length >= 2) {
                coberturaNumbers[0].textContent = `${dados.blocos_cobertos} blocos cobertos`;
                coberturaNumbers[1].textContent = `${dados.blocos_descobertos} blocos descobertos`;
            }

            // Atualizar rodapé
            const statusIndicator = card.querySelector('.status-indicator');
            if (statusIndicator) {
                if (dados.status_cobertura === 'completo') {
                    statusIndicator.innerHTML = '<i class="fas fa-check-circle"></i> COBERTO';
                } else if (dados.status_cobertura === 'parcial') {
                    statusIndicator.innerHTML = '<i class="fas fa-exclamation-triangle"></i> PARCIAL';
                } else {
                    statusIndicator.innerHTML = '<i class="fas fa-times-circle"></i> DESCOBERTO';
                }
            }

            const ultimaVisitaSpan = card.querySelector('.ultima-visita span');
            if (ultimaVisitaSpan) {
                ultimaVisitaSpan.textContent = dados.ultima_visita;
            }

            // Efeito visual de atualização
            card.classList.add('updated');
            setTimeout(() => card.classList.remove('updated'), 1000);

            console.log('DEBUG: Card atualizado visualmente');
        }

        // Atualizar na tabela também
        const tableRow = document.querySelector(`tr[data-id="${id}"]`);
        if (tableRow) {
            // Atualizar atributos da linha
            tableRow.setAttribute('data-cobertura', dados.cobertura);
            tableRow.setAttribute('data-status', dados.status_cobertura);
            tableRow.setAttribute('data-prioridade', dados.prioridade);
            tableRow.setAttribute('data-acs', dados.acs_responsavel ? 'com_acs' : 'sem_acs');

            // Atualizar células da tabela
            const cells = tableRow.querySelectorAll('td');
            if (cells.length >= 9) {
                // Coluna 1: Nome e apartamentos
                cells[0].innerHTML = `
                <strong>${dados.nome}</strong>
                <div>${dados.apartamentos} aptos</div>
            `;

                // Coluna 2: Status
                let statusIcon = '';
                if (dados.status_cobertura === 'completo') {
                    statusIcon = '<i class="fas fa-check-circle"></i> COBERTO';
                } else if (dados.status_cobertura === 'parcial') {
                    statusIcon = '<i class="fas fa-exclamation-triangle"></i> PARCIAL';
                } else {
                    statusIcon = '<i class="fas fa-times-circle"></i> DESCOBERTO';
                }

                cells[1].innerHTML = `<span class="table-badge badge-status-${dados.status_cobertura}">${statusIcon}</span>`;

                // Coluna 3: Prioridade
                cells[2].innerHTML = `<span class="table-badge badge-priority-${dados.prioridade}">${dados.prioridade.toUpperCase()}</span>`;

                // Coluna 4: ACS
                if (dados.acs_responsavel) {
                    cells[3].innerHTML = `
                    <div class="acs-nome">${dados.acs_responsavel}</div>
                    <div class="acs-blocos">${dados.blocos_ativos || ''}</div>
                `;
                } else {
                    cells[3].innerHTML = '<span class="sem-acs"><i class="fas fa-user-times"></i> Sem ACS</span>';
                }

                // Coluna 5: Blocos
                cells[4].innerHTML = `
                <div>
                    <span class="coberto"><i class="fas fa-check"></i> ${dados.blocos_cobertos}</span> cobertos
                </div>
                <div>
                    <span class="descoberto"><i class="fas fa-times"></i> ${dados.blocos_descobertos}</span> descobertos
                </div>
            `;

                // Coluna 6: Cobertura
                cells[5].innerHTML = `
                <div class="cobertura-cell">
                    <span>${dados.cobertura}%</span>
                    <div class="mini-progress-table">
                        <div class="mini-progress-bar-table" style="width: ${dados.cobertura}%"></div>
                    </div>
                </div>
            `;

                // Coluna 7: Moradores
                const avgPorApto = dados.apartamentos > 0 ? (dados.moradores / dados.apartamentos).toFixed(1) : 0;
                cells[6].innerHTML = `
                <div class="moradores-count">${dados.moradores}</div>
                <div class="moradores-avg">${avgPorApto} por apto</div>
            `;

                // Coluna 8: Saúde
                cells[7].innerHTML = `
                <div class="saude-indicadores">
                    <div title="Hipertensos">
                        <div class="hipertensos">${dados.hipertensos}</div>
                        <i class="fas fa-heartbeat"></i>
                    </div>
                    <div title="Diabéticos">
                        <div class="diabeticos">${dados.diabeticos}</div>
                        <i class="fas fa-prescription-bottle"></i>
                    </div>
                    <div title="Gestantes">
                        <div class="gestantes">${dados.gestantes}</div>
                        <i class="fas fa-female"></i>
                    </div>
                </div>
            `;
            }

            // Efeito visual na tabela
            tableRow.classList.add('updated');
            setTimeout(() => tableRow.classList.remove('updated'), 1000);
        }

        // Atualizar contadores e resumo
        setTimeout(() => {
            if (typeof applyFilters === 'function') {
                applyFilters();
            }
        }, 500);
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
            state.filters = {
                status: 'todos',
                prioridade: 'todos',
                acs: 'todos',
                cobertura: 0
            };
            applyFilters();
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
        * Fecha modal de edição
         */
        closeEditModal: function () {
            closeEditModal();
        },

        /**
         * Confirmar exclusão
         */
        confirmarExclusao: function (id, nome) {
            confirmarExclusao(id, nome);
        },
        /**
        * calcuar edição
        */
        _calcularEditCobertura: function () {
            calcularEditCobertura();
        },

        /**
         * Funções internas para uso no HTML
         */
        _navegarEtapa: function (direction) {
            navegarEtapa(direction);
        },

        _toggleACSFields: function (temACS) {
            toggleACSFields(temACS);
        },

        _calcularCobertura: function () {
            calcularCoberturaPreview();
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
