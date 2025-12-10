// ============================================
// UTILITÁRIOS GERAIS DO SISTEMA - script.js
// ============================================

// ============================================
// FUNÇÕES GERAIS DO SISTEMA
// ============================================

/**
 * Atualiza data atual no rodapé
 */
function atualizarData() {
    const dataElement = document.getElementById('currentDate');
    if (dataElement) {
        const now = new Date();
        dataElement.textContent = now.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
}

/**
 * Formata números com separador de milhar
 */
function formatarNumero(num) {
    if (num === undefined || num === null) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Função para bloquear ações de convidado em outras páginas
 */
function bloquearAcaoConvidado() {
    if (window.APP_CONFIG?.nivel_usuario === 'convidado') {
        alert('🔒 Modo Visitante\n\nVocê está no modo de visualização apenas. Para realizar esta ação, faça login como usuário cadastrado.');
        return true;
    }
    return false;
}

// ============================================
// FUNÇÕES PARA MOBILE/RESPONSIVIDADE
// ============================================

/**
 * Detecta dispositivo móvel
 */
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Ajusta interface para mobile
 */
function adjustForMobile() {
    if (isMobileDevice()) {
        document.body.classList.add('mobile-device');

        // Ajusta modais
        const modal = document.querySelector('.modal-content');
        if (modal) {
            modal.style.maxHeight = '90vh';
            modal.style.overflowY = 'auto';
        }

        // Ajusta campos de formulário para evitar zoom
        document.querySelectorAll('input[type="text"], input[type="number"], input[type="email"], input[type="tel"], input[type="password"]').forEach(el => {
            el.style.fontSize = '16px'; // Previne zoom automático no iOS
        });

        // Ajusta selects
        document.querySelectorAll('select').forEach(el => {
            el.style.fontSize = '16px';
        });

        console.log('Modo mobile ativado');
    }
}

/**
 * Previne zoom duplo-tap em elementos interativos
 */
function setupMobileTouchEvents() {
    document.addEventListener('touchstart', function (event) {
        if (event.target.tagName === 'BUTTON' || event.target.tagName === 'A' || event.target.closest('button') || event.target.closest('a')) {
            const element = event.target.tagName === 'BUTTON' || event.target.tagName === 'A' ? event.target : event.target.closest('button') || event.target.closest('a');
            if (element) {
                element.style.transform = 'scale(0.98)';
                element.style.transition = 'transform 0.1s ease';
            }
        }
    });

    document.addEventListener('touchend', function (event) {
        if (event.target.tagName === 'BUTTON' || event.target.tagName === 'A' || event.target.closest('button') || event.target.closest('a')) {
            const element = event.target.tagName === 'BUTTON' || event.target.tagName === 'A' ? event.target : event.target.closest('button') || event.target.closest('a');
            if (element) {
                element.style.transform = '';
            }
        }
    });

    document.addEventListener('touchcancel', function (event) {
        if (event.target.tagName === 'BUTTON' || event.target.tagName === 'A' || event.target.closest('button') || event.target.closest('a')) {
            const element = event.target.tagName === 'BUTTON' || event.target.tagName === 'A' ? event.target : event.target.closest('button') || event.target.closest('a');
            if (element) {
                element.style.transform = '';
            }
        }
    });
}

// ============================================
// FUNÇÕES DE NOTIFICAÇÃO E ALERTA
// ============================================

/**
 * Mostra notificação de convidado
 */
function mostrarNotificacaoConvidado() {
    alert('🔒 Modo Visitante\n\nVocê está no modo de visualização apenas. Para adicionar ou editar conteúdo, faça login como usuário cadastrado.');
}

/**
 * Valida se usuário está logado
 */
function verificarLogin() {
    if (!window.APP_CONFIG?.usuario_logado) {
        alert('Para realizar esta ação, faça login no sistema.');
        window.location.href = '/login';
        return false;
    }
    return true;
}

// ============================================
// FUNÇÕES DE FORMULÁRIO GENÉRICAS
// ============================================

/**
 * Habilita/desabilita botão de envio com estado de carregamento
 */
function setButtonLoading(button, isLoading, loadingText = 'Carregando...', originalText = null) {
    if (!button) return;

    if (isLoading) {
        button.disabled = true;
        button.setAttribute('data-original-text', button.innerHTML);
        button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${loadingText}`;
    } else {
        button.disabled = false;
        button.innerHTML = originalText || button.getAttribute('data-original-text') || button.innerHTML;
    }
}

/**
 * Valida campo obrigatório
 */
function validarCampoObrigatorio(campo, mensagem) {
    if (!campo.value || campo.value.trim() === '') {
        campo.style.borderColor = '#ff4757';
        if (mensagem) alert(mensagem);
        campo.focus();
        return false;
    }
    campo.style.borderColor = '';
    return true;
}

/**
 * Valida número positivo
 */
function validarNumeroPositivo(campo, mensagem) {
    const valor = parseFloat(campo.value);
    if (isNaN(valor) || valor <= 0) {
        campo.style.borderColor = '#ff4757';
        if (mensagem) alert(mensagem);
        campo.focus();
        return false;
    }
    campo.style.borderColor = '';
    return true;
}

// ============================================
// FUNÇÕES DE NAVEGAÇÃO E UI
// ============================================

/**
 * Alterna visibilidade de elemento
 */
function toggleElement(id, show) {
    const element = document.getElementById(id);
    if (element) {
        element.style.display = show ? 'block' : 'none';
    }
}

/**
 * Adiciona classe temporariamente (para feedback visual)
 */
function addTemporaryClass(element, className, duration = 300) {
    if (!element) return;

    element.classList.add(className);
    setTimeout(() => {
        element.classList.remove(className);
    }, duration);
}

/**
 * Rola suavemente para elemento
 */
function scrollToElement(elementId, offset = 100) {
    const element = document.getElementById(elementId);
    if (element) {
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
}

// ============================================
// FUNÇÕES DE DROPDOWN DO USUÁRIO - SIMPLIFICADAS
// ============================================

/**
 * Alterna o menu do usuário
 */
function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    const trigger = document.querySelector('.user-menu-trigger');

    if (dropdown.classList.contains('show')) {
        closeUserMenu();
    } else {
        // Fechar outros dropdowns abertos
        closeAllDropdowns();

        dropdown.classList.add('show');
        trigger.classList.add('active');

        // Adicionar overlay apenas em mobile
        if (window.innerWidth <= 768) {
            const overlay = document.createElement('div');
            overlay.className = 'user-dropdown-overlay show';
            overlay.onclick = closeUserMenu;
            document.body.appendChild(overlay);
        }
    }
}

/**
 * Fecha o menu do usuário
 */
function closeUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    const trigger = document.querySelector('.user-menu-trigger');
    const overlay = document.querySelector('.user-dropdown-overlay');

    if (dropdown) {
        dropdown.classList.remove('show');
    }

    if (trigger) {
        trigger.classList.remove('active');
    }

    if (overlay) {
        overlay.remove();
    }
}

/**
 * Fecha todos os dropdowns abertos
 */
function closeAllDropdowns() {
    const dropdowns = document.querySelectorAll('.user-dropdown-menu.show');
    dropdowns.forEach(dropdown => {
        dropdown.classList.remove('show');
    });

    const triggers = document.querySelectorAll('.user-menu-trigger.active');
    triggers.forEach(trigger => {
        trigger.classList.remove('active');
    });

    const overlays = document.querySelectorAll('.user-dropdown-overlay');
    overlays.forEach(overlay => {
        overlay.remove();
    });
}

/**
 * Configura eventos do dropdown do usuário
 */
function setupUserDropdown() {
    // Fechar menu ao pressionar ESC
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            closeAllDropdowns();
        }
    });

    // Adicionar evento de clique nos itens do dropdown
    document.addEventListener('DOMContentLoaded', function () {
        const dropdownItems = document.querySelectorAll('.dropdown-item');
        dropdownItems.forEach(item => {
            item.addEventListener('click', function () {
                setTimeout(closeUserMenu, 300);
            });
        });

        // Fechar menu ao clicar fora (apenas em desktop)
        document.addEventListener('click', function (event) {
            if (window.innerWidth > 768) {
                const dropdown = document.getElementById('userDropdown');
                const trigger = document.querySelector('.user-menu-trigger');
                const container = document.querySelector('.user-dropdown-container');

                if (dropdown && dropdown.classList.contains('show') &&
                    !container.contains(event.target)) {
                    closeUserMenu();
                }
            }
        });

        // Reposicionar dropdown ao redimensionar janela
        window.addEventListener('resize', function () {
            closeAllDropdowns();
        });
    });
}

// ============================================
// INICIALIZAÇÃO
// ============================================

/**
 * Inicializa utilitários gerais
 */
function initGeneralUtilities() {
    console.log('Inicializando utilitários gerais...');

    // Atualizar data
    atualizarData();

    // Configurar para mobile
    adjustForMobile();
    setupMobileTouchEvents();

    // Configurar dropdown do usuário
    setupUserDropdown();

    // Ajustar ao redimensionar janela
    window.addEventListener('resize', adjustForMobile);
}

// ============================================
// EXPORTAÇÃO PARA USO GLOBAL
// ============================================

// Exportar funções utilitárias
window.formatarNumero = formatarNumero;
window.bloquearAcaoConvidado = bloquearAcaoConvidado;
window.mostrarNotificacaoConvidado = mostrarNotificacaoConvidado;
window.verificarLogin = verificarLogin;
window.setButtonLoading = setButtonLoading;
window.validarCampoObrigatorio = validarCampoObrigatorio;
window.validarNumeroPositivo = validarNumeroPositivo;
window.toggleElement = toggleElement;
window.addTemporaryClass = addTemporaryClass;
window.scrollToElement = scrollToElement;
window.toggleUserMenu = toggleUserMenu;
window.closeUserMenu = closeUserMenu;

// ============================================
// EXECUÇÃO AO CARREGAR
// ============================================

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGeneralUtilities);
} else {
    initGeneralUtilities();
}

// ============================================
// FUNÇÕES DE DEPURAÇÃO (apenas desenvolvimento)
// ============================================

/**
 * Loga configuração do usuário para debug
 */
function debugUserConfig() {
    if (window.APP_CONFIG) {
        console.log('Configuração do usuário:', window.APP_CONFIG);
        console.log('- Usuário logado:', window.APP_CONFIG.usuario_logado);
        console.log('- Nível:', window.APP_CONFIG.nivel_usuario);
    } else {
        console.warn('APP_CONFIG não definido');
    }
}

// Expor função de debug
window.debugUserConfig = debugUserConfig;
