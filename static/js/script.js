// ============================================
// VARIÁVEIS GLOBAIS
// ============================================

// Esta variável será definida pelo template
// O template index.html define window.USUARIO_LOGADO
var USUARIO_LOGADO = window.USUARIO_LOGADO || false;

console.log('DEBUG script.js: USUARIO_LOGADO =', USUARIO_LOGADO);
console.log('DEBUG script.js: window.USUARIO_LOGADO =', window.USUARIO_LOGADO);

// ============================================
// FUNÇÕES GERAIS DO SISTEMA
// ============================================

// Data atual no rodapé
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

// ============================================
// FUNÇÕES DO MODAL
// ============================================

// Função ORIGINAL mostrarModal - apenas abre o modal
function mostrarModalOriginal() {
    console.log('DEBUG: mostrarModalOriginal chamada');
    document.getElementById('modalCondominio').style.display = 'block';
    document.body.style.overflow = 'hidden';
    resetFormSteps();
    return true;
}

// Função PROTEGIDA mostrarModal - verifica login antes
function mostrarModal() {
    console.log('DEBUG: mostrarModal protegida chamada, USUARIO_LOGADO =', USUARIO_LOGADO);

    if (!USUARIO_LOGADO) {
        alert('Para adicionar um novo condomínio, é necessário fazer login no sistema.');
        window.location.href = '/login';
        return false;
    }

    return mostrarModalOriginal();
}

function fecharModal() {
    document.getElementById('modalCondominio').style.display = 'none';
    document.body.style.overflow = 'auto';
    limparFormulario();
    resetFormSteps();
}

function limparFormulario() {
    const form = document.getElementById('formCondominio');
    if (form) {
        form.reset();
        toggleACSInfo(true); // Reset para estado inicial
    }
}

function resetFormSteps() {
    currentStep = 1;
    document.getElementById('step1').style.display = 'block';
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step3').style.display = 'none';
    updateNavigation();
}

// ============================================
// FUNÇÕES PARA CÁLCULO DE COBERTURA
// ============================================

let currentStep = 1;
const totalSteps = 3;

function nextStep() {
    // Validar passo atual antes de avançar
    if (currentStep === 1 && !validarPasso1()) {
        alert('Preencha todos os campos obrigatórios do passo 1');
        return;
    }

    if (currentStep === 2 && !validarPasso2()) {
        return;
    }

    if (currentStep < totalSteps) {
        document.getElementById(`step${currentStep}`).style.display = 'none';
        currentStep++;
        document.getElementById(`step${currentStep}`).style.display = 'block';
        updateNavigation();
    }
}

function prevStep() {
    if (currentStep > 1) {
        document.getElementById(`step${currentStep}`).style.display = 'none';
        currentStep--;
        document.getElementById(`step${currentStep}`).style.display = 'block';
        updateNavigation();
    }
}

function updateNavigation() {
    const btnPrev = document.querySelector('.btn-prev');
    const btnNext = document.querySelector('.btn-next');
    const finalActions = document.getElementById('finalActions');

    if (currentStep === 1) {
        btnPrev.style.display = 'none';
    } else {
        btnPrev.style.display = 'flex';
    }

    if (currentStep === totalSteps) {
        btnNext.style.display = 'none';
        if (finalActions) finalActions.style.display = 'flex';
    } else {
        btnNext.style.display = 'flex';
        if (finalActions) finalActions.style.display = 'none';
    }
}

function validarPasso1() {
    const nome = document.getElementById('nomeCondominio');
    const torres = document.getElementById('torres');
    const apartamentos = document.getElementById('apartamentos');
    const moradores = document.getElementById('moradores');

    if (!nome.value.trim()) {
        nome.focus();
        return false;
    }
    if (!torres.value || torres.value <= 0) {
        torres.focus();
        return false;
    }
    if (!apartamentos.value || apartamentos.value <= 0) {
        apartamentos.focus();
        return false;
    }
    if (!moradores.value || moradores.value <= 0) {
        moradores.focus();
        return false;
    }

    return true;
}

function validarPasso2() {
    const temACS = document.querySelector('input[name="tem_acs"]:checked').value === 'sim';

    if (temACS) {
        const nomeACS = document.getElementById('nomeACS');
        const blocosCobertos = document.getElementById('blocosCobertos');

        if (!nomeACS.value.trim()) {
            alert('Informe o nome do ACS');
            nomeACS.focus();
            return false;
        }

        if (!blocosCobertos.value.trim()) {
            alert('Informe os blocos atendidos pelo ACS');
            blocosCobertos.focus();
            return false;
        }
    }

    return true;
}

function toggleACSInfo(hasACS) {
    const acsInfo = document.getElementById('acsInfo');
    const nomeACS = document.getElementById('nomeACS');
    const blocosCobertos = document.getElementById('blocosCobertos');

    if (hasACS) {
        if (acsInfo) acsInfo.style.display = 'block';
        if (nomeACS) nomeACS.required = true;
        if (blocosCobertos) blocosCobertos.required = true;
        calcularCobertura();
    } else {
        if (acsInfo) acsInfo.style.display = 'none';
        if (nomeACS) nomeACS.required = false;
        if (blocosCobertos) blocosCobertos.required = false;

        const totalTorres = parseInt(document.getElementById('torres').value) || 0;
        if (document.getElementById('blocosDescobertos')) {
            document.getElementById('blocosDescobertos').value = `Todos os ${totalTorres} blocos descobertos`;
        }
        updateCoberturaVisual(totalTorres, 0);
    }
}

function calcularCobertura() {
    const totalTorres = parseInt(document.getElementById('torres').value) || 0;
    const blocosCobertosStr = document.getElementById('blocosCobertos')?.value || '';

    if (totalTorres <= 0 || !blocosCobertosStr) {
        updateCoberturaVisual(totalTorres, 0);
        return;
    }

    let blocosCobertos = 0;

    try {
        const partes = blocosCobertosStr.split(',');

        for (let parte of partes) {
            parte = parte.trim();
            if (parte.includes('-')) {
                const [inicio, fim] = parte.split('-').map(Number);
                if (!isNaN(inicio) && !isNaN(fim) && inicio <= fim) {
                    blocosCobertos += (fim - inicio + 1);
                }
            } else if (!isNaN(Number(parte))) {
                blocosCobertos += 1;
            }
        }
    } catch (error) {
        console.error('Erro ao calcular blocos:', error);
        blocosCobertos = 0;
    }

    const blocosDescobertos = totalTorres - blocosCobertos;
    const blocosDescobertosInput = document.getElementById('blocosDescobertos');

    if (blocosDescobertosInput) {
        if (blocosDescobertos > 0) {
            blocosDescobertosInput.value = `${blocosDescobertos} blocos descobertos`;
        } else if (blocosDescobertos === 0) {
            blocosDescobertosInput.value = 'Todos blocos cobertos ✓';
        } else {
            blocosDescobertosInput.value = 'Erro no cálculo';
        }
    }

    updateCoberturaVisual(totalTorres, blocosCobertos);
}

function updateCoberturaVisual(total, cobertos) {
    if (total <= 0) total = 1;

    const percentCoberto = (cobertos / total) * 100;
    const percentDescoberto = 100 - percentCoberto;

    const cobertoBar = document.getElementById('cobertoBar');
    const descobertoBar = document.getElementById('descobertoBar');
    const cobertoText = document.getElementById('cobertoText');
    const descobertoText = document.getElementById('descobertoText');

    if (cobertoBar) cobertoBar.style.width = `${percentCoberto}%`;
    if (descobertoBar) descobertoBar.style.width = `${percentDescoberto}%`;

    if (cobertoText) {
        cobertoText.textContent = `${cobertos} blocos cobertos (${percentCoberto.toFixed(1)}%)`;
    }
    if (descobertoText) {
        descobertoText.textContent = `${total - cobertos} blocos descobertos (${percentDescoberto.toFixed(1)}%)`;
    }
}

// ============================================
// FORMULÁRIO DE ENVIO
// ============================================

async function enviarFormulario() {
    console.log("DEBUG: enviarFormulario chamado, USUARIO_LOGADO =", USUARIO_LOGADO);

    // Verificar login antes de enviar
    if (!USUARIO_LOGADO) {
        alert('❌ Você precisa estar logado para adicionar condomínios.');
        window.location.href = '/login';
        return false;
    }

    const temACS = document.querySelector('input[name="tem_acs"]:checked').value === 'sim';
    const totalTorres = parseInt(document.getElementById('torres').value) || 0;
    const blocosCobertosStr = document.getElementById('blocosCobertos')?.value || '';

    // Calcular cobertura
    let blocosCobertos = 0;
    let statusCobertura = 'descoberto';

    if (temACS && blocosCobertosStr) {
        const partes = blocosCobertosStr.split(',');
        for (let parte of partes) {
            parte = parte.trim();
            if (parte.includes('-')) {
                const [inicio, fim] = parte.split('-').map(Number);
                if (!isNaN(inicio) && !isNaN(fim) && inicio <= fim) {
                    blocosCobertos += (fim - inicio + 1);
                }
            } else if (!isNaN(Number(parte))) {
                blocosCobertos += 1;
            }
        }

        if (blocosCobertos === 0) {
            statusCobertura = 'descoberto';
        } else if (blocosCobertos === totalTorres) {
            statusCobertura = 'completo';
        } else {
            statusCobertura = 'parcial';
        }
    }

    const percentCobertura = totalTorres > 0 ? Math.round((blocosCobertos / totalTorres) * 100) : 0;

    const condominio = {
        nome: document.getElementById('nomeCondominio').value,
        torres: totalTorres,
        blocos_cobertos: blocosCobertos,
        blocos_descobertos: totalTorres - blocosCobertos,
        acs_responsavel: temACS ? document.getElementById('nomeACS').value : null,
        blocos_ativos: temACS ? blocosCobertosStr : null,
        apartamentos: parseInt(document.getElementById('apartamentos').value) || 0,
        moradores: parseInt(document.getElementById('moradores').value) || 0,
        hipertensos: parseInt(document.getElementById('hipertensos').value) || 0,
        diabeticos: parseInt(document.getElementById('diabeticos').value) || 0,
        gestantes: parseInt(document.getElementById('gestantes').value) || 0,
        cobertura: percentCobertura,
        status_cobertura: statusCobertura,
        prioridade: document.getElementById('prioridade').value,
        ultima_visita: new Date().toISOString().split('T')[0]
    };

    console.log("DEBUG: Dados a enviar:", condominio);

    // Validar
    if (!condominio.nome || condominio.nome.trim() === '') {
        alert('O nome do condomínio é obrigatório!');
        return false;
    }

    if (condominio.apartamentos <= 0) {
        alert('Número de apartamentos inválido!');
        return false;
    }

    try {
        const btnSalvar = document.querySelector('.btn-salvar');
        const originalHTML = btnSalvar.innerHTML;
        btnSalvar.disabled = true;
        btnSalvar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

        // Enviar para API
        const response = await fetch('/api/novo-condominio', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(condominio)
        });

        const result = await response.json();
        console.log("DEBUG: Resposta da API:", result);

        if (result.status === 'sucesso') {
            alert('✅ Condomínio adicionado com sucesso!');
            fecharModal();

            // Recarregar após 1 segundo
            setTimeout(() => {
                window.location.reload();
            }, 1000);

            return true;
        } else {
            alert('❌ Erro: ' + result.mensagem);
            btnSalvar.disabled = false;
            btnSalvar.innerHTML = originalHTML;
            return false;
        }
    } catch (error) {
        console.error("Erro completo:", error);
        alert('❌ Erro de conexão: ' + error.message);
        const btnSalvar = document.querySelector('.btn-salvar');
        btnSalvar.disabled = false;
        btnSalvar.innerHTML = '<i class="fas fa-save"></i> Salvar Condomínio';
        return false;
    }
}

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    console.log('DEBUG: DOMContentLoaded, USUARIO_LOGADO =', USUARIO_LOGADO);

    // Atualizar data
    atualizarData();

    // Inicializar modal
    resetFormSteps();
    toggleACSInfo(true);

    // Configurar eventos
    const torresInput = document.getElementById('torres');
    const blocosCobertosInput = document.getElementById('blocosCobertos');

    if (torresInput) {
        torresInput.addEventListener('input', calcularCobertura);
    }

    if (blocosCobertosInput) {
        blocosCobertosInput.addEventListener('input', calcularCobertura);
    }

    // Fechar modal ao clicar fora
    window.addEventListener('click', function (event) {
        const modal = document.getElementById('modalCondominio');
        if (event.target === modal) {
            fecharModal();
        }
    });

    // Configurar formulário
    const formCondominio = document.getElementById('formCondominio');
    if (formCondominio) {
        formCondominio.addEventListener('submit', function (e) {
            e.preventDefault();
            enviarFormulario();
        });
    }

    // Configurar botão de adicionar
    const btnAdd = document.querySelector('.btn-add');
    if (btnAdd) {
        btnAdd.addEventListener('click', mostrarModal);
    }

    // Animar progress bars
    setTimeout(() => {
        const progressBars = document.querySelectorAll('.progress-bar, .mini-progress-bar');
        progressBars.forEach(bar => {
            const width = bar.style.width;
            if (width) {
                bar.style.width = '0';
                setTimeout(() => {
                    bar.style.width = width;
                }, 300);
            }
        });
    }, 500);

    // Verificar dados
    const condominiosGrid = document.querySelector('.condominios-grid');
    if (condominiosGrid && condominiosGrid.children.length === 0) {
        console.log('Nenhum condomínio cadastrado para esta equipe.');
    }

    // Log para debug
    console.log('DEBUG: Função mostrarModal disponível?', typeof mostrarModal);
    console.log('DEBUG: Função mostrarModalOriginal disponível?', typeof mostrarModalOriginal);
});

// ============================================
// FUNÇÕES DE UTILIDADE (GLOBAIS)
// ============================================

function formatarNumero(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function filtrarPorPrioridade(prioridade) {
    const cards = document.querySelectorAll('.condominio-card');

    cards.forEach(card => {
        if (prioridade === 'todos') {
            card.style.display = 'block';
        } else {
            if (card.classList.contains(`priority-${prioridade}`)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        }
    });
}

// Exportar para uso global
window.mostrarModal = mostrarModal;
window.fecharModal = fecharModal;
window.nextStep = nextStep;
window.prevStep = prevStep;
window.toggleACSInfo = toggleACSInfo;
window.calcularCobertura = calcularCobertura;
window.filtrarPorPrioridade = filtrarPorPrioridade;
window.formatarNumero = formatarNumero;

// ============================================
// FUNÇÕES PARA MOBILE (mantenha as existentes)
// ============================================

// Detectar dispositivo móvel
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Ajustar interface para mobile
function adjustForMobile() {
    if (isMobileDevice()) {
        document.body.classList.add('mobile-device');

        const modal = document.querySelector('.modal-content');
        if (modal) {
            modal.style.maxHeight = '90vh';
            modal.style.overflowY = 'auto';
        }

        document.querySelectorAll('input, select, textarea').forEach(el => {
            el.style.fontSize = '16px';
        });

        console.log('Modo mobile ativado');
    }
}

// Prevenir zoom duplo-tap em botões
document.addEventListener('touchstart', function (event) {
    if (event.target.tagName === 'BUTTON' || event.target.tagName === 'A') {
        event.target.style.transform = 'scale(0.98)';
    }
});

document.addEventListener('touchend', function (event) {
    if (event.target.tagName === 'BUTTON' || event.target.tagName === 'A') {
        event.target.style.transform = '';
    }
});

// Swipe para fechar modal (opcional)
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
});

function handleSwipe() {
    const swipeThreshold = 100;
    const modal = document.getElementById('modalCondominio');

    if (modal && modal.style.display === 'block') {
        if (touchStartX - touchEndX > swipeThreshold) {
            fecharModal();
        }
    }
}

// Inicializar ajustes mobile
document.addEventListener('DOMContentLoaded', function () {
    adjustForMobile();
    window.addEventListener('resize', adjustForMobile);
});
