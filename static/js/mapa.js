// Sistema de Mapa para Territorialização
document.addEventListener('DOMContentLoaded', function () {
    // Variáveis globais
    let map;
    let drawnItems = L.featureGroup();
    let selectedColor = '#3498db';
    let colors = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c'];
    let currentAreaId = null;
    let isEditing = false;
    let isFullscreen = false;

    // COORDENADAS DE CAMAÇARI
    const CAMACARI_COORDS = {
        lat: -12.713122,
        lng: -38.314544,
        zoom: 16
    };

    // Inicialização
    function init() {
        console.log('Iniciando sistema de mapa...');
        initMap();
        setupColorPicker();
        setupEventListeners();
        loadAreas();
        checkPermissions();
    }

    // Inicializar mapa
    function initMap() {
        try {
            console.log('Criando mapa...', CAMACARI_COORDS);

            // Criar mapa centralizado em Camaçari
            map = L.map('map', {
                center: [CAMACARI_COORDS.lat, CAMACARI_COORDS.lng],
                zoom: CAMACARI_COORDS.zoom,
                zoomControl: true,
                preferCanvas: true
            });

            // Tile layer do OpenStreetMap
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                maxZoom: 19,
                id: 'osm.streets'
            }).addTo(map);

            // Adicionar layer para itens desenhados
            drawnItems.addTo(map);

        } catch (error) {
            console.error('❌ Erro ao inicializar mapa:', error);
            alert('Erro ao carregar o mapa: ' + error.message);
        }
    }

    // Configurar seletor de cores
    function setupColorPicker() {
        const colorPicker = document.getElementById('color-picker');

        colors.forEach(color => {
            const div = document.createElement('div');
            div.className = 'color-option';
            div.style.backgroundColor = color;
            div.dataset.color = color;
            div.title = color;

            if (color === selectedColor) {
                div.classList.add('selected');
            }

            div.addEventListener('click', function () {
                selectedColor = this.dataset.color;
                updateColorPicker();
            });

            colorPicker.appendChild(div);
        });
    }

    // Atualizar seletor de cores
    function updateColorPicker() {
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.toggle('selected', option.dataset.color === selectedColor);
        });
    }

    // Configurar eventos
    function setupEventListeners() {
        // Botões de desenho
        document.getElementById('btn-draw-polygon').addEventListener('click', function () {
            startDrawing('polygon');
        });

        document.getElementById('btn-draw-rectangle').addEventListener('click', function () {
            startDrawing('rectangle');
        });

        document.getElementById('btn-draw-circle').addEventListener('click', function () {
            startDrawing('circle');
        });

        document.getElementById('btn-edit').addEventListener('click', function () {
            toggleEditMode();
        });

        document.getElementById('btn-delete').addEventListener('click', function () {
            if (confirm('Clique em uma área para excluir')) {
                isEditing = true;
                map.once('click', handleAreaDelete);
            }
        });

        // Botão salvar área
        document.getElementById('btn-save-area').addEventListener('click', saveCurrentArea);

        // Botão limpar formulário
        document.getElementById('btn-clear-form').addEventListener('click', clearForm);

        // Botão tela cheia
        document.getElementById('fullscreen-toggle').addEventListener('click', toggleFullscreen);

        // Modal
        document.getElementById('btn-cancel-delete').addEventListener('click', hideModal);
        document.getElementById('confirm-modal').addEventListener('click', function (e) {
            if (e.target === this) hideModal();
        });

        // Eventos do mapa
        map.on('draw:created', function (e) {
            const layer = e.layer;
            layer.setStyle({
                color: selectedColor,
                fillColor: selectedColor,
                fillOpacity: 0.4,
                weight: 2
            });

            // Adicionar popup
            layer.bindPopup('<b>Nova Área</b><br>Preencha os dados e salve');

            drawnItems.addLayer(layer);

            // Preencher nome automático
            const areaCount = document.querySelectorAll('.area-item').length;
            document.getElementById('area-name').value = `Área ${areaCount + 1}`;
            document.getElementById('area-description').focus();
        });

        // Tecla ESC para sair da tela cheia
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && isFullscreen) {
                toggleFullscreen();
            }
        });
    }

    // Toggle tela cheia
    function toggleFullscreen() {
        const mapPage = document.querySelector('.map-page');
        const mapContainer = document.querySelector('.map-container');
        const mapElement = document.getElementById('map');
        const fullscreenToggle = document.getElementById('fullscreen-toggle');
        const header = document.querySelector('.map-header');

        if (!isFullscreen) {
            // Entrar em modo tela cheia
            mapPage.classList.add('modo-tela-cheia');

            // Esconder cabeçalho
            if (header) {
                header.style.display = 'none';
            }

            // Atualizar botão
            fullscreenToggle.innerHTML = '<i class="fas fa-compress"></i><span class="btn-text">Sair da Tela Cheia</span>';

            // Ajustar tamanho do mapa
            setTimeout(() => {
                if (map) {
                    map.invalidateSize();
                }
            }, 100);

            showMessage('Modo tela cheia ativado. Pressione ESC para sair.', 'info', 2000);
            isFullscreen = true;
        } else {
            // Sair do modo tela cheia
            mapPage.classList.remove('modo-tela-cheia');

            // Mostrar cabeçalho
            if (header) {
                header.style.display = 'block';
            }

            // Atualizar botão
            fullscreenToggle.innerHTML = '<i class="fas fa-expand"></i><span class="btn-text">Tela Cheia</span>';

            // Ajustar tamanho do mapa
            setTimeout(() => {
                if (map) {
                    map.invalidateSize();
                }
            }, 100);

            isFullscreen = false;
        }
    }

    // Iniciar desenho
    function startDrawing(type) {
        let drawOptions;

        switch (type) {
            case 'polygon':
                drawOptions = {
                    shapeOptions: {
                        color: selectedColor,
                        fillColor: selectedColor,
                        fillOpacity: 0.4
                    }
                };
                new L.Draw.Polygon(map, drawOptions).enable();
                break;

            case 'rectangle':
                drawOptions = {
                    shapeOptions: {
                        color: selectedColor,
                        fillColor: selectedColor,
                        fillOpacity: 0.4
                    }
                };
                new L.Draw.Rectangle(map, drawOptions).enable();
                break;

            case 'circle':
                drawOptions = {
                    shapeOptions: {
                        color: selectedColor,
                        fillColor: selectedColor,
                        fillOpacity: 0.4
                    }
                };
                new L.Draw.Circle(map, drawOptions).enable();
                break;
        }
    }

    // Alternar modo de edição
    function toggleEditMode() {
        isEditing = !isEditing;
        const btn = document.getElementById('btn-edit');

        if (isEditing) {
            btn.classList.add('active');
            btn.innerHTML = '<i class="fas fa-times"></i> Cancelar Edição';
            alert('Clique em uma área para editar suas propriedades');
        } else {
            btn.classList.remove('active');
            btn.innerHTML = '<i class="fas fa-edit"></i> Editar Área';
        }
    }

    // Manipular exclusão de área
    function handleAreaDelete(e) {
        const clickedLayer = findLayerAtPoint(e.latlng);
        if (clickedLayer && clickedLayer.areaId) {
            showDeleteConfirmation(clickedLayer.areaId);
        }
        isEditing = false;
    }

    // Encontrar layer em um ponto
    function findLayerAtPoint(latlng) {
        let foundLayer = null;

        drawnItems.eachLayer(function (layer) {
            if (layer.getBounds && layer.getBounds().contains(latlng)) {
                foundLayer = layer;
            } else if (layer.getLatLng && layer.getLatLng().distanceTo(latlng) < 10) {
                foundLayer = layer;
            }
        });

        return foundLayer;
    }

    // Mostrar confirmação de exclusão
    function showDeleteConfirmation(areaId) {
        currentAreaId = areaId;
        document.getElementById('confirm-modal').style.display = 'flex';

        document.getElementById('btn-confirm-delete').onclick = function () {
            deleteArea(areaId);
            hideModal();
        };
    }

    // Esconder modal
    function hideModal() {
        document.getElementById('confirm-modal').style.display = 'none';
        currentAreaId = null;
    }

    // Carregar áreas do servidor
    async function loadAreas() {
        try {
            const response = await fetch('/api/areas-territoriais');
            if (!response.ok) {
                throw new Error('Erro ao carregar áreas');
            }

            const areas = await response.json();
            renderAreas(areas);

        } catch (error) {
            console.error('Erro ao carregar áreas:', error);
            showMessage('Erro ao carregar áreas. Verifique o console.', 'error');
        }
    }

    // Renderizar áreas no mapa e na lista
    function renderAreas(areas) {
        // Limpar áreas existentes
        drawnItems.clearLayers();

        // Adicionar cada área
        areas.forEach(area => {
            addAreaToMap(area);
        });

        // Atualizar lista
        updateAreasList(areas);
    }

    // Adicionar área ao mapa
    function addAreaToMap(area) {
        try {
            const layer = L.geoJSON(area.geojson, {
                style: {
                    color: area.cor,
                    fillColor: area.cor,
                    fillOpacity: 0.4,
                    weight: 2
                }
            }).addTo(drawnItems);

            // Adicionar popup
            layer.bindPopup(`
                <div style="min-width: 200px;">
                    <h4 style="margin: 0 0 10px 0; color: ${area.cor}">${area.nome}</h4>
                    <p><strong>Tipo:</strong> ${formatAreaType(area.tipo)}</p>
                    <p><strong>Descrição:</strong> ${area.descricao || 'Sem descrição'}</p>
                    ${area.agente_saude_id ? `<p><strong>Agente:</strong> ${area.agente_saude_id}</p>` : ''}
                </div>
            `);

            // Armazenar dados da área
            layer.areaId = area.id;
            layer.areaData = area;

            // Adicionar evento de clique
            layer.on('click', function (e) {
                if (isEditing) {
                    editArea(area.id);
                }
            });

        } catch (error) {
            console.error('Erro ao adicionar área ao mapa:', error);
        }
    }

    // Atualizar lista de áreas
    function updateAreasList(areas) {
        const areasList = document.getElementById('areas-list');
        const noAreas = areasList.querySelector('.no-areas');

        if (areas.length === 0) {
            if (!noAreas) {
                areasList.innerHTML = `
                    <div class="no-areas">
                        <i class="fas fa-map"></i>
                        <p>Nenhuma área salva ainda.<br>Desenhe uma área no mapa!</p>
                    </div>
                `;
            }
            return;
        }

        // Remover mensagem de "nenhuma área"
        if (noAreas) {
            noAreas.remove();
        }

        // Ordenar por nome
        areas.sort((a, b) => a.nome.localeCompare(b.nome));

        areasList.innerHTML = areas.map(area => `
            <div class="area-item" data-id="${area.id}" style="border-left-color: ${area.cor}">
                <div class="area-header">
                    <div class="area-name">${area.nome}</div>
                    <div class="area-type">${formatAreaType(area.tipo)}</div>
                </div>
                ${area.descricao ? `<div class="area-description">${area.descricao}</div>` : ''}
                <div class="area-actions">
                    <button class="area-action-btn" onclick="zoomToArea(${area.id})" title="Zoom">
                        <i class="fas fa-search-plus"></i>
                    </button>
                    ${window.APP_CONFIG.usuario_logado && window.APP_CONFIG.nivel_usuario !== 'convidado' ? `
                        <button class="area-action-btn" onclick="editArea(${area.id})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="area-action-btn" onclick="confirmDeleteArea(${area.id})" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');

        // Atualizar contador
        updateAreasCount(areas.length);
    }

    // Atualizar contador de áreas
    function updateAreasCount(count) {
        const countElement = document.getElementById('areas-count');
        if (countElement) {
            countElement.textContent = count;
        }
    }

    // Formatar tipo de área
    function formatAreaType(type) {
        const types = {
            'bairro': 'Bairro',
            'comunidade': 'Comunidade',
            'microarea': 'Microárea',
            'setor': 'Setor',
            'condominio': 'Condomínio',
            'outro': 'Outro'
        };
        return types[type] || type;
    }

    // Salvar área atual
    async function saveCurrentArea() {
        const layers = drawnItems.getLayers();
        if (layers.length === 0) {
            showMessage('Desenhe uma área no mapa primeiro!', 'warning');
            return;
        }

        const lastLayer = layers[layers.length - 1];
        const geojson = lastLayer.toGeoJSON();

        const areaData = {
            nome: document.getElementById('area-name').value.trim(),
            tipo: document.getElementById('area-type').value,
            cor: selectedColor,
            descricao: document.getElementById('area-description').value.trim(),
            agente_saude_id: document.getElementById('agente-id').value.trim() || null,
            geojson: geojson,
            equipe: window.APP_CONFIG.nome_equipe.toLowerCase().replace(/\s+/g, '')
        };

        if (!areaData.nome) {
            showMessage('Por favor, informe um nome para a área', 'warning');
            document.getElementById('area-name').focus();
            return;
        }

        try {
            const response = await fetch('/api/salvar-area', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(areaData)
            });

            const result = await response.json();

            if (result.status === 'sucesso') {
                showMessage('Área salva com sucesso!', 'success');
                clearForm();
                loadAreas(); // Recarregar áreas
            } else {
                showMessage('Erro: ' + result.mensagem, 'error');
            }
        } catch (error) {
            showMessage('Erro ao salvar: ' + error.message, 'error');
        }
    }

    // Editar área
    async function editArea(areaId) {
        try {
            const response = await fetch('/api/areas-territoriais');
            const areas = await response.json();

            const area = areas.find(a => a.id === areaId);
            if (area) {
                // Preencher formulário
                document.getElementById('area-name').value = area.nome;
                document.getElementById('area-type').value = area.tipo;
                document.getElementById('area-description').value = area.descricao || '';
                document.getElementById('agente-id').value = area.agente_saude_id || '';

                // Selecionar cor
                selectedColor = area.cor;
                updateColorPicker();

                // Rolar para o formulário
                document.getElementById('area-name').focus();

                showMessage(`Editando área: ${area.nome}`, 'info');
            }
        } catch (error) {
            console.error('Erro ao carregar área para edição:', error);
        }
    }

    // Zoom para área
    function zoomToArea(areaId) {
        drawnItems.eachLayer(function (layer) {
            if (layer.areaId === areaId) {
                if (layer.getBounds) {
                    map.fitBounds(layer.getBounds());
                    layer.openPopup();
                }
                return false; // Parar iteração
            }
        });
    }

    // Confirmar exclusão (para botões na lista)
    window.confirmDeleteArea = function (areaId) {
        currentAreaId = areaId;
        document.getElementById('confirm-modal').style.display = 'flex';

        document.getElementById('btn-confirm-delete').onclick = function () {
            deleteArea(areaId);
            hideModal();
        };
    };

    // Excluir área
    async function deleteArea(areaId) {
        try {
            const response = await fetch(`/api/excluir-area/${areaId}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.status === 'sucesso') {
                showMessage('Área excluída com sucesso!', 'success');
                loadAreas(); // Recarregar áreas
            } else {
                showMessage('Erro: ' + result.mensagem, 'error');
            }
        } catch (error) {
            showMessage('Erro ao excluir: ' + error.message, 'error');
        }
    }

    // Limpar formulário
    function clearForm() {
        document.getElementById('area-name').value = '';
        document.getElementById('area-description').value = '';
        document.getElementById('agente-id').value = '';
        document.getElementById('area-type').value = 'bairro';
        selectedColor = '#3498db';
        updateColorPicker();
    }

    // Verificar permissões
    function checkPermissions() {
        if (!window.APP_CONFIG.usuario_logado || window.APP_CONFIG.nivel_usuario === 'convidado') {
            disableEditing();
        }
    }

    // Desabilitar edição para convidados
    function disableEditing() {
        const editButtons = ['btn-draw-polygon', 'btn-draw-rectangle', 'btn-draw-circle',
            'btn-edit', 'btn-delete', 'btn-save-area'];

        editButtons.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.disabled = true;
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
                btn.title = 'Modo visitante: apenas visualização';
            }
        });

        // Desabilitar campos do formulário
        const formFields = ['area-name', 'area-type', 'area-description', 'agente-id'];
        formFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.disabled = true;
                field.placeholder = 'Modo visitante';
            }
        });
    }

    // Função para mostrar mensagens
    function showMessage(text, type = 'info', duration = 3000) {
        const existingMessages = document.querySelectorAll('.custom-message');
        existingMessages.forEach(msg => msg.remove());

        const messageDiv = document.createElement('div');
        messageDiv.className = 'custom-message';
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 15px 25px;
            border-radius: 10px;
            color: white;
            font-weight: 600;
            z-index: 100000;
            box-shadow: 0 6px 20px rgba(0,0,0,0.25);
            animation: slideDown 0.4s ease;
            font-size: 16px;
            text-align: center;
            min-width: 300px;
            max-width: 80%;
            backdrop-filter: blur(10px);
            display: flex;
            align-items: center;
            gap: 12px;
        `;

        const colors = {
            success: 'linear-gradient(135deg, #27ae60, #2ecc71)',
            error: 'linear-gradient(135deg, #e74c3c, #c0392b)',
            warning: 'linear-gradient(135deg, #f39c12, #e67e22)',
            info: 'linear-gradient(135deg, #3498db, #2980b9)'
        };

        messageDiv.style.background = colors[type] || colors.info;

        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        messageDiv.innerHTML = `
            <span style="font-size: 20px;">${icons[type] || 'ℹ️'}</span>
            <span>${text}</span>
        `;

        document.body.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.style.animation = 'slideUp 0.4s ease';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 400);
        }, duration);

        if (!document.querySelector('#custom-animations')) {
            const style = document.createElement('style');
            style.id = 'custom-animations';
            style.textContent = `
                @keyframes slideDown {
                    from { transform: translate(-50%, -100%); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }
                @keyframes slideUp {
                    from { transform: translate(-50%, 0); opacity: 1; }
                    to { transform: translate(-50%, -100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Inicializar
    init();
});
