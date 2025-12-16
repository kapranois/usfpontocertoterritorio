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

// ============================================
// FUNÇÕES DE VERIFICAÇÃO DE USUÁRIO
// ============================================

/**
 * Verifica se usuário pode realizar ação (GLOBAL - versão simplificada)
 */
function podeRealizarAcao() {
    if (!window.APP_CONFIG) {
        console.error('APP_CONFIG não definido');
        return false;
    }

    // 1. Verifica se é convidado
    if (window.APP_CONFIG.nivel_usuario === 'convidado') {
        alert('🔒 Modo Visitante\n\nVocê está no modo de visualização apenas. Para realizar esta ação, faça login como usuário cadastrado.');
        return false;
    }

    // 2. Verifica se está logado
    if (!window.APP_CONFIG.usuario_logado) {
        alert('🔒 Para realizar esta ação, faça login no sistema');
        setTimeout(() => {
            window.location.href = '/login';
        }, 1500);
        return false;
    }

    return true;
}

/**
 * Valida se usuário está logado (simplificado)
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
    const container = document.querySelector('.user-dropdown-container');

    // Verifica se o menu já está aberto
    if (dropdown?.classList.contains('show')) {
        closeUserMenu();
    } else {
        // Fechar outros dropdowns abertos
        closeAllDropdowns();

        // Abre o menu atual
        if (dropdown) dropdown.classList.add('show');
        if (container) container.classList.add('active');

        // Fecha o menu se clicar fora
        document.addEventListener('click', function closeDropdown(e) {
            if (!container?.contains(e.target)) {
                closeUserMenu();
                document.removeEventListener('click', closeDropdown);
            }
        });

        // Adicionar overlay apenas em mobile
        if (window.innerWidth <= 768) {
            const overlay = document.createElement('div');
            overlay.className = 'user-dropdown-overlay show';
            overlay.onclick = closeUserMenu;
            document.body.appendChild(overlay);
        }
    }
}

function closeUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    const container = document.querySelector('.user-dropdown-container');

    // Remove classes
    if (dropdown) dropdown.classList.remove('show');
    if (container) container.classList.remove('active');

    // Remove overlay se existir
    const overlay = document.querySelector('.user-dropdown-overlay');
    if (overlay) overlay.remove();
}

function closeAllDropdowns() {
    // Fecha todos os dropdowns de usuário
    document.querySelectorAll('.user-dropdown-menu.show').forEach(dropdown => {
        dropdown.classList.remove('show');
    });

    document.querySelectorAll('.user-dropdown-container.active').forEach(container => {
        container.classList.remove('active');
    });

    // Remove overlays
    document.querySelectorAll('.user-dropdown-overlay').forEach(overlay => {
        overlay.remove();
    });
}

// Fecha dropdown ao pressionar ESC
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        closeUserMenu();
    }
});

// Fecha dropdown ao mudar de página
window.addEventListener('beforeunload', closeUserMenu);

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

// Mobile Navigation
function initMobileNavigation() {
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        // Adiciona botão de menu na bottom nav se não existir
        const bottomNav = document.querySelector('.bottom-nav');
        const menuItems = bottomNav.querySelectorAll('.nav-item');
        
        // Se já tem 4 itens (sem menu), adiciona o botão de menu
        if (menuItems.length === 4) {
            const menuItem = document.createElement('a');
            menuItem.href = '#';
            menuItem.className = 'nav-item';
            menuItem.id = 'mobileMenuBtn';
            menuItem.innerHTML = `
                <i class="fas fa-bars"></i>
                <span>Menu</span>
            `;
            bottomNav.appendChild(menuItem);
            
            // Evento para abrir menu
            menuItem.addEventListener('click', function(e) {
                e.preventDefault();
                openMobileMenu();
            });
        }
        
        // Remove o item "Menu" se já existir (quando redimensiona)
        const existingMenuBtn = document.getElementById('mobileMenuBtn');
        if (existingMenuBtn && !isMobile) {
            existingMenuBtn.remove();
        }
    }
}

// Funções do menu mobile
function openMobileMenu() {
    const overlay = document.getElementById('mobileMenuOverlay');
    const panel = document.getElementById('mobileMenuPanel');
    
    overlay.style.display = 'block';
    setTimeout(() => {
        overlay.style.opacity = '1';
        panel.classList.add('active');
    }, 10);
    
    // Fecha ao clicar no overlay
    overlay.addEventListener('click', closeMobileMenu);
    
    // Fecha ao clicar no botão X
    const closeBtn = document.getElementById('closeMobileMenu');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeMobileMenu);
    }
}

function closeMobileMenu() {
    const overlay = document.getElementById('mobileMenuOverlay');
    const panel = document.getElementById('mobileMenuPanel');
    
    panel.classList.remove('active');
    overlay.style.opacity = '0';
    setTimeout(() => {
        overlay.style.display = 'none';
    }, 300);
}

// Inicializa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    initMobileNavigation();
    
    // Re-inicializa ao redimensionar
    window.addEventListener('resize', function() {
        initMobileNavigation();
    });
    
    // Fecha menu ao pressionar ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeMobileMenu();
        }
    });
});
// ============================================
// INICIALIZAÇÃO GLOBAL
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
window.podeRealizarAcao = podeRealizarAcao;
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
