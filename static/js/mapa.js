document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM carregado, iniciando mapa...');

    // Variáveis globais
    let map;
    let drawnItems = L.featureGroup();
    let selectedColor = '#3498db';
    let colors = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c'];
    let currentAreaId = null;
    let isEditing = false;
    let isFullscreen = false;
    let sidebarVisibleInFullscreen = false;

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
        setupCustomAnimations();
    }

    // Inicializar mapa
    function initMap() {
        try {
            console.log('Criando mapa...', CAMACARI_COORDS);

            // Verificar se o container existe
            const mapContainer = document.getElementById('map');
            if (!mapContainer) {
                console.error('Container #map não encontrado!');
                return;
            }

            // Criar mapa centralizado em Camaçari
            map = L.map('map', {
                center: [CAMACARI_COORDS.lat, CAMACARI_COORDS.lng],
                zoom: CAMACARI_COORDS.zoom,
                zoomControl: true,
                preferCanvas: true
            });

            window._leafletMap = map;

            // Tile layer do OpenStreetMap
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                maxZoom: 19,
                id: 'osm.streets'
            }).addTo(map);

            // Adicionar layer para itens desenhados
            drawnItems.addTo(map);

            // Forçar redimensionamento após um pequeno delay
            setTimeout(() => {
                if (map) {
                    map.invalidateSize();
                    console.log('Mapa inicializado com sucesso!');
                }
            }, 100);

        } catch (error) {
            console.error('❌ Erro ao inicializar mapa:', error);
            showMessage('Erro ao carregar o mapa: ' + error.message, 'error');
        }
    }

    // Configurar seletor de cores
    function setupColorPicker() {
        const colorPicker = document.getElementById('color-picker');
        if (!colorPicker) {
            console.error('Elemento color-picker não encontrado!');
            return;
        }

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


    function updateColorPicker() {
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.toggle('selected', option.dataset.color === selectedColor);
        });
    }

    // ========== LÓGICA DE STATUS DA ÁREA ==========

    function setupAreaStatusLogic() {
        const agenteField = document.getElementById('agente-id');
        const microareaGroup = document.getElementById('microarea-group');
        const microareaField = document.getElementById('microarea');

        if (!agenteField || !microareaGroup || !microareaField) {
            console.error('Campos de ACS/microárea não encontrados!');
            return;
        }

        // Escutar mudanças no campo do agente
        agenteField.addEventListener('input', function () {
            if (this.value.trim() !== '') {
                // Tem ACS - mostrar campo de microárea
                microareaGroup.style.display = 'block';
                microareaField.required = true;
                areaStatus = 'mapeada';
            } else {
                // Não tem ACS - ocultar campo de microárea
                microareaGroup.style.display = 'none';
                microareaField.required = false;
                microareaField.value = '';
                areaStatus = 'descoberta';
            }
        });

        // Escutar no campo de microárea
        microareaField.addEventListener('change', function () {
            if (this.value !== '') {
                areaStatus = 'mapeada';
                // Se tiver microárea mas não tiver ACS, focar no campo ACS
                if (!agenteField.value.trim()) {
                    agenteField.placeholder = 'Informe o ACS desta microárea...';
                    agenteField.focus();
                }
            } else if (!agenteField.value.trim()) {
                areaStatus = 'descoberta';
            }
        });
    }

    // ========== CONFIGURAÇÃO DE EVENTOS ==========

    function setupEventListeners() {
        // Botões de desenho
        document.getElementById('btn-draw-polygon').addEventListener('click', () => startDrawing('polygon'));
        document.getElementById('btn-draw-rectangle').addEventListener('click', () => startDrawing('rectangle'));
        document.getElementById('btn-draw-circle').addEventListener('click', () => startDrawing('circle'));
        document.getElementById('btn-edit').addEventListener('click', toggleEditMode);
        document.getElementById('btn-delete').addEventListener('click', () => {
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

        // Redimensionar mapa quando a janela mudar
        window.addEventListener('resize', () => {
            if (map) {
                setTimeout(() => {
                    map.invalidateSize();
                }, 250);
            }
        });
    }

    // ========== FUNÇÕES DE DESENHO ==========

    function startDrawing(type) {
        let drawOptions = {
            shapeOptions: {
                color: selectedColor,
                fillColor: selectedColor,
                fillOpacity: 0.4
            }
        };

        switch (type) {
            case 'polygon':
                new L.Draw.Polygon(map, drawOptions).enable();
                break;
            case 'rectangle':
                new L.Draw.Rectangle(map, drawOptions).enable();
                break;
            case 'circle':
                new L.Draw.Circle(map, drawOptions).enable();
                break;
        }
    }

    function toggleEditMode() {
        isEditing = !isEditing;
        const btn = document.getElementById('btn-edit');

        if (isEditing) {
            btn.classList.add('active');
            btn.innerHTML = '<i class="fas fa-times"></i> Cancelar Edição';
            showMessage('Clique em uma área para editar suas propriedades', 'info');
        } else {
            btn.classList.remove('active');
            btn.innerHTML = '<i class="fas fa-edit"></i> Editar Área';
        }
    }

    // ========== FUNÇÕES DE ÁREAS ==========

    async function saveCurrentArea() {
        const layers = drawnItems.getLayers();
        if (layers.length === 0) {
            showMessage('Desenhe uma área no mapa primeiro!', 'warning');
            return;
        }

        const lastLayer = layers[layers.length - 1];
        const geojson = lastLayer.toGeoJSON();

        // Coletar dados
        const nome = document.getElementById('area-name').value.trim();
        const tipo = document.getElementById('area-type').value;
        const descricao = document.getElementById('area-description').value.trim();
        const agente = document.getElementById('agente-id').value.trim();
        const microarea = document.getElementById('microarea').value;
        const streetview = document.getElementById('streetview-link').value.trim();

        // Validações
        if (!nome) {
            showMessage('Por favor, informe um nome para a área', 'warning');
            document.getElementById('area-name').focus();
            return;
        }

        // Preparar dados
        let areaData = {
            nome: nome,
            tipo: tipo,
            cor: selectedColor,
            descricao: descricao,
            streetview_link: streetview || null,
            geojson: geojson,
            equipe: window.APP_CONFIG.nome_equipe.toLowerCase().replace(/\s+/g, ''),
            status: 'descoberta',
            microarea: null,
            agente_saude_id: null
        };

        // Lógica: Se tem microárea OU ACS, é área mapeada
        if (microarea || agente) {
            areaData.status = 'mapeada';

            // Validações específicas para áreas mapeadas
            if (agente && !microarea) {
                showMessage('Para vincular um ACS, selecione uma microárea', 'warning');
                document.getElementById('microarea').focus();
                return;
            }

            if (microarea && !agente) {
                showMessage('Para vincular uma microárea, informe o ACS responsável', 'warning');
                document.getElementById('agente-id').focus();
                return;
            }

            // Salvar dados de vinculação
            if (microarea) areaData.microarea = microarea;
            if (agente) areaData.agente_saude_id = agente;
        }

        console.log('Enviando dados:', areaData);

        try {
            const response = await fetch('/api/salvar-area', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(areaData)
            });

            const result = await response.json();

            if (result.status === 'sucesso') {
                const msg = areaData.status === 'mapeada'
                    ? 'Área mapeada salva com sucesso!'
                    : 'Área descoberta salva com sucesso!';
                showMessage(msg, 'success');
                clearForm();
                loadAreas();
            } else {
                showMessage('Erro: ' + result.mensagem, 'error');
            }
        } catch (error) {
            showMessage('Erro ao salvar: ' + error.message, 'error');
        }
    }

    async function loadAreas() {
        try {
            const response = await fetch('/api/areas-territoriais');
            if (!response.ok) throw new Error('Erro ao carregar áreas');

            const areas = await response.json();
            renderAreas(areas);

        } catch (error) {
            console.error('Erro ao carregar áreas:', error);
            showMessage('Erro ao carregar áreas. Verifique o console.', 'error');
        }
    }

    function renderAreas(areas) {
        drawnItems.clearLayers();
        areas.forEach(area => addAreaToMap(area));
        updateAreasList(areas);
    }

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

            // Conteúdo do popup
            let popupContent = `
                <div style="min-width: 250px;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                        <div style="width: 12px; height: 12px; background: ${area.cor}; border-radius: 50%;"></div>
                        <h4 style="margin: 0; color: ${area.cor}">${area.nome}</h4>
                    </div>
                    
                    <div style="background: ${area.status === 'mapeada' ? '#d4edda' : '#fff3cd'}; 
                                padding: 8px; border-radius: 6px; margin-bottom: 10px;">
                        <strong>Status:</strong> 
                        ${area.status === 'mapeada' ? '🟢 Área Mapeada' : '🟡 Área Descoberta'}
                    </div>
            `;

            if (area.status === 'mapeada') {
                popupContent += `
                    ${area.microarea ? `<p><strong>Microárea:</strong> ${area.microarea}</p>` : ''}
                    ${area.agente_saude_id ? `<p><strong>ACS:</strong> ${area.agente_saude_id}</p>` : ''}
                `;
            } else {
                popupContent += `<p><em>Área identificada sem vínculo com ACS</em></p>`;
            }

            popupContent += `
                    <p><strong>Tipo:</strong> ${formatAreaType(area.tipo)}</p>
                    ${area.descricao ? `<p><strong>Descrição:</strong> ${area.descricao}</p>` : ''}
            `;

            if (area.streetview_link) {
                popupContent += `
                    <div style="margin-top: 10px; border-top: 1px solid #eee; padding-top: 10px;">
                        <a href="${area.streetview_link}" 
                           target="_blank" 
                           rel="noopener noreferrer"
                           style="display: inline-flex; align-items: center; gap: 8px;
                                  background: #4285f4; color: white; padding: 8px 12px;
                                  border-radius: 6px; text-decoration: none; font-size: 14px;
                                  font-weight: 500; transition: background 0.3s;">
                            <i class="fas fa-street-view"></i>
                            Ver no Street View
                        </a>
                    </div>
                `;
            }

            popupContent += `</div>`;

            layer.bindPopup(popupContent);
            layer.areaId = area.id;
            layer.areaData = area;

            layer.on('click', function (e) {
                if (isEditing) {
                    editArea(area.id);
                }
            });

        } catch (error) {
            console.error('Erro ao adicionar área ao mapa:', error);
        }
    }

    async function editArea(areaId) {
        try {
            const response = await fetch(`/api/area/${areaId}`);
            const area = await response.json();

            if (area) {
                // Preencher formulário
                document.getElementById('area-name').value = area.nome;
                document.getElementById('area-type').value = area.tipo;
                document.getElementById('area-description').value = area.descricao || '';
                document.getElementById('streetview-link').value = area.streetview_link || '';
                document.getElementById('agente-id').value = area.agente_saude_id || '';
                document.getElementById('microarea').value = area.microarea || '';

                // Mostrar/ocultar campo de microárea
                const microareaGroup = document.getElementById('microarea-group');
                if (area.agente_saude_id || area.microarea) {
                    microareaGroup.style.display = 'block';
                    areaStatus = 'mapeada';
                } else {
                    microareaGroup.style.display = 'none';
                    areaStatus = 'descoberta';
                }

                // Cor
                selectedColor = area.cor;
                updateColorPicker();

                // Focar
                document.getElementById('area-name').focus();

                showMessage(`Editando área: ${area.nome}`, 'info');
            }
        } catch (error) {
            console.error('Erro ao carregar área para edição:', error);
        }
    }

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
            updateAreasCount(0);
            return;
        }

        // Remover mensagem de "nenhuma área"
        if (noAreas) noAreas.remove();

        // Ordenar: mapeadas primeiro
        areas.sort((a, b) => {
            if (a.status === b.status) return a.nome.localeCompare(b.nome);
            return a.status === 'mapeada' ? -1 : 1;
        });

        areasList.innerHTML = areas.map(area => `
            <div class="area-item" data-id="${area.id}" data-status="${area.status}" style="border-left-color: ${area.cor}">
                <div class="area-header">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div class="area-name">${area.nome}</div>
                        <span class="area-status ${area.status === 'mapeada' ? 'status-mapeada' : 'status-descoberta'}">
                            ${area.status === 'mapeada' ? 'Mapeada' : 'Descoberta'}
                        </span>
                    </div>
                    <div class="area-type">${formatAreaType(area.tipo)}</div>
                </div>
                
                ${area.microarea ? `
                    <div class="area-microarea" style="font-size: 13px; color: #3498db; margin: 5px 0;">
                        <i class="fas fa-map-marker-alt"></i> Microárea: ${area.microarea}
                    </div>
                ` : ''}
                
                ${area.agente_saude_id ? `
                    <div class="area-agente" style="font-size: 13px; color: #27ae60; margin: 5px 0;">
                        <i class="fas fa-user-md"></i> ACS: ${area.agente_saude_id}
                    </div>
                ` : ''}
                
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

        updateAreasCount(areas.length);
    }

    function updateAreasCount(count) {
        const countElement = document.getElementById('areas-count');
        if (countElement) countElement.textContent = count;
    }

    // ========== FUNÇÕES UTILITÁRIAS ==========

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

    function clearForm() {
        document.getElementById('area-name').value = '';
        document.getElementById('area-type').value = 'bairro';
        document.getElementById('area-description').value = '';
        document.getElementById('agente-id').value = '';
        document.getElementById('streetview-link').value = '';
        document.getElementById('microarea').value = '';

        // Resetar status
        areaStatus = 'descoberta';
        const microareaGroup = document.getElementById('microarea-group');
        if (microareaGroup) microareaGroup.style.display = 'none';

        selectedColor = '#3498db';
        updateColorPicker();
    }

    function checkPermissions() {
        if (!window.APP_CONFIG.usuario_logado || window.APP_CONFIG.nivel_usuario === 'convidado') {
            disableEditing();
        }
    }

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

        const formFields = ['area-name', 'area-type', 'area-description', 'agente-id', 'streetview-link', 'microarea'];
        formFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.disabled = true;
                field.placeholder = 'Modo visitante';
            }
        });
    }

    // ========== FUNÇÕES DE EXCLUSÃO ==========

    function handleAreaDelete(e) {
        const clickedLayer = findLayerAtPoint(e.latlng);
        if (clickedLayer && clickedLayer.areaId) {
            showDeleteConfirmation(clickedLayer.areaId);
        }
        isEditing = false;
    }

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

    function showDeleteConfirmation(areaId) {
        currentAreaId = areaId;
        document.getElementById('confirm-modal').style.display = 'flex';
        document.getElementById('btn-confirm-delete').onclick = function () {
            deleteArea(areaId);
            hideModal();
        };
    }

    function hideModal() {
        document.getElementById('confirm-modal').style.display = 'none';
        currentAreaId = null;
    }

    async function deleteArea(areaId) {
        try {
            const response = await fetch(`/api/excluir-area/${areaId}`, { method: 'DELETE' });
            const result = await response.json();

            if (result.status === 'sucesso') {
                showMessage('Área excluída com sucesso!', 'success');
                loadAreas();
            } else {
                showMessage('Erro: ' + result.mensagem, 'error');
            }
        } catch (error) {
            showMessage('Erro ao excluir: ' + error.message, 'error');
        }
    }

    // ========== FUNÇÕES DE TELA CHEIA ==========

    function toggleFullscreen() {
        const mapPage = document.querySelector('.map-page');
        const fullscreenToggle = document.getElementById('fullscreen-toggle');
        const header = document.querySelector('.map-header');
        const sidebar = document.querySelector('.map-sidebar');

        if (!isFullscreen) {
            // Entrar em modo tela cheia
            mapPage.classList.add('modo-tela-cheia');
            if (header) header.style.display = 'none';

            fullscreenToggle.innerHTML = '<i class="fas fa-compress"></i><span class="btn-text">Sair da Tela Cheia</span>';

            setTimeout(() => {
                if (map) {
                    map.invalidateSize();
                    map.setView([CAMACARI_COORDS.lat, CAMACARI_COORDS.lng], CAMACARI_COORDS.zoom);
                }
            }, 100);

            showMessage('Modo tela cheia ativado. Pressione ESC para sair.', 'info', 2000);
            isFullscreen = true;

        } else {
            // Sair do modo tela cheia
            mapPage.classList.remove('modo-tela-cheia');
            if (header) header.style.display = 'block';

            fullscreenToggle.innerHTML = '<i class="fas fa-expand"></i><span class="btn-text">Tela Cheia</span>';

            setTimeout(() => {
                if (map) {
                    map.invalidateSize();
                    map.setView([CAMACARI_COORDS.lat, CAMACARI_COORDS.lng], CAMACARI_COORDS.zoom);
                }
            }, 100);

            isFullscreen = false;
        }
    }

    // ========== FUNÇÕES DE MENSAGENS ==========

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
    }

    function setupCustomAnimations() {
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

    // ========== FUNÇÕES GLOBAIS ==========

    window.zoomToArea = function (areaId) {
        drawnItems.eachLayer(function (layer) {
            if (layer.areaId === areaId) {
                if (layer.getBounds) {
                    map.fitBounds(layer.getBounds());
                    layer.openPopup();
                }
                return false;
            }
        });
    };

    window.confirmDeleteArea = function (areaId) {
        currentAreaId = areaId;
        document.getElementById('confirm-modal').style.display = 'flex';
        document.getElementById('btn-confirm-delete').onclick = function () {
            deleteArea(areaId);
            hideModal();
        };
    };

    // ========== INICIALIZAÇÃO ==========

    init();
});
