document.addEventListener('DOMContentLoaded', function () {
    console.log('Iniciando mapa simplificado...');

    // Variáveis globais
    let map;
    let drawnItems = L.featureGroup();
    let selectedColor = '#3498db'; // Cor padrão
    let colors = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c'];
    let currentAreaId = null;
    let drawControl = null;
    let isDrawing = false;
    let isFullscreen = false;
    let currentPolygonLayer = null;
    let polygonDrawer = null;
    let selectedAreaForCard = null;

    // Coordenadas padrão (Camaçari)
    const DEFAULT_COORDS = {
        lat: -12.713122,
        lng: -38.314544,
        zoom: 16
    };

    // Inicialização
    function init() {
        console.log('Iniciando sistema de mapa simplificado...');
        initMap();
        setupColorPicker();
        setupEventListeners();
        loadAreas();
        checkPermissions();
    }

    // Inicializar mapa
    function initMap() {
        try {
            console.log('Criando mapa...');

            const mapContainer = document.getElementById('map');
            if (!mapContainer) {
                console.error('Container #map não encontrado!');
                return;
            }

            // Criar mapa
            map = L.map('map', {
                center: [DEFAULT_COORDS.lat, DEFAULT_COORDS.lng],
                zoom: DEFAULT_COORDS.zoom,
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

            // Configurar interações com os polígonos
            map.on('click', function (e) {
                // Se não estiver desenhando, verificar clique em polígono
                if (!isDrawing) {
                    const clickedLayer = findLayerAtPoint(e.latlng);
                    if (clickedLayer && clickedLayer.areaData) {
                        showAreaInfoCard(clickedLayer.areaData);
                    } else {
                        // Se clicar fora de um polígono, fechar card
                        closeAreaInfoCard();
                    }
                }
            });

            // Forçar redimensionamento
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
        const colorPicker = document.getElementById('color-picker-popup');
        if (!colorPicker) return;

        // Limpar cores existentes
        colorPicker.innerHTML = '';

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
                // Atualizar cor do polígono atual se estiver sendo editado
                updateCurrentPolygonColor();
            });

            colorPicker.appendChild(div);
        });
    }

    function updateColorPicker() {
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.toggle('selected', option.dataset.color === selectedColor);
        });
    }

    // Configurar eventos
    function setupEventListeners() {
        // Botão flutuante para criar mapa
        document.getElementById('btn-create-map').addEventListener('click', startDrawingMode);

        // Botão de edição de forma
        document.getElementById('btn-edit-shape').addEventListener('click', toggleEditMode);
        document.getElementById('btn-delete-shape').addEventListener('click', deleteCurrentShape);

        // Botões do popup
        document.getElementById('btn-save-popup').addEventListener('click', saveCurrentArea);
        document.getElementById('btn-delete-popup').addEventListener('click', deleteCurrentAreaFromPopup);
        document.getElementById('close-popup').addEventListener('click', closeEditPopup);

        // Botão tela cheia
        document.getElementById('fullscreen-toggle').addEventListener('click', toggleFullscreen);

        // Botões do card de informações
        document.getElementById('close-card').addEventListener('click', closeAreaInfoCard);
        document.getElementById('card-edit-btn').addEventListener('click', function () {
            if (selectedAreaForCard) {
                closeAreaInfoCard();
                openEditPopup(selectedAreaForCard);
            }
            // Fechar card quando clicar no overlay (se estiver visível)
            document.getElementById('popup-overlay').addEventListener('click', function () {
                closeAreaInfoCard();
            });
            // Modal do Street View
            document.getElementById('close-streetview').addEventListener('click', closeStreetViewModal);
            document.getElementById('streetview-modal').addEventListener('click', function (e) {
                if (e.target === this) closeStreetViewModal();
            });
        });

        // Toggle das ferramentas de edição
        const editToolsToggle = document.getElementById('edit-tools-toggle');
        if (editToolsToggle) {
            editToolsToggle.addEventListener('click', function () {
                const expandedTools = document.getElementById('edit-tools-expanded');
                const isVisible = expandedTools.style.display === 'block';
                expandedTools.style.display = isVisible ? 'none' : 'block';
                this.innerHTML = isVisible ?
                    '<i class="fas fa-pencil-alt"></i> Ferramentas de Edição' :
                    '<i class="fas fa-chevron-up"></i> Ocultar Ferramentas';
            });
        }

        // Modal de confirmação
        document.getElementById('btn-cancel-delete').addEventListener('click', hideModal);
        document.getElementById('confirm-modal').addEventListener('click', function (e) {
            if (e.target === this) hideModal();
        });

        // Overlay do popup
        document.getElementById('popup-overlay').addEventListener('click', closeEditPopup);

        // Tecla ESC para cancelar desenho ou fechar popup
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                if (isDrawing) {
                    cancelDrawing();
                } else if (window.currentEditControl) {
                    // Se está em modo de edição, cancelar
                    disableEditMode();
                    const cancelBtn = document.getElementById('cancel-edit-btn');
                    if (cancelBtn) cancelBtn.remove();
                } else {
                    closeEditPopup();
                    closeAreaInfoCard();
                }

                if (isFullscreen) {
                    toggleFullscreen();
                }
            }
        });

        // Tecla ESC para cancelar desenho ou fechar popup
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                if (isDrawing) {
                    cancelDrawing();
                } else {
                    closeEditPopup();
                }

                if (isFullscreen) {
                    toggleFullscreen();
                }
            }
        });

        // Redimensionar mapa
        window.addEventListener('resize', () => {
            if (map) {
                setTimeout(() => map.invalidateSize(), 250);
            }
        });
    }

    // Iniciar modo de desenho - ATIVA A FERRAMENTA DE POLÍGONO DIRETAMENTE
    function startDrawingMode() {
        if (isDrawing) {
            cancelDrawing();
            return;
        }

        isDrawing = true;
        console.log('Iniciando modo de desenho...');

        // MUDAR CURSOR DO MAPA PARA CRUZ
        document.getElementById('map').classList.add('map-drawing-mode');

        // Limpar qualquer polígono temporário anterior
        if (currentPolygonLayer) {
            drawnItems.removeLayer(currentPolygonLayer);
            currentPolygonLayer = null;
        }

        showMessage('Clique no mapa para começar a desenhar. Clique para adicionar pontos, duplo clique para finalizar.', 'info', 4000);

        // Ativar desenho de polígono DIRETAMENTE
        activatePolygonDrawing();
    }

    // Ativar desenho de polígono
    function activatePolygonDrawing() {
        // Remover controles anteriores
        if (polygonDrawer) {
            map.removeControl(polygonDrawer);
            polygonDrawer = null;
        }

        // Remover eventos anteriores
        map.off('draw:created');

        // Criar instância do controle de desenho
        polygonDrawer = new L.Draw.Polygon(map, {
            shapeOptions: {
                color: selectedColor,
                fillColor: selectedColor,
                fillOpacity: 0.4,
                weight: 2
            },
            showArea: true,
            metric: true,
            repeatMode: false
        });

        // Adicionar evento quando o desenho for concluído
        map.on('draw:created', function (e) {
            handlePolygonCreated(e);
        });

        // Habilitar o desenho
        polygonDrawer.enable();

        console.log('Ferramenta de polígono ativada');
    }

    // Lidar com polígono criado (quando usuário dá duplo clique para terminar)
    function handlePolygonCreated(e) {
        console.log('Polígono criado, abrindo edição...');

        const layer = e.layer;
        currentPolygonLayer = layer;

        // REMOVER CURSOR DE DESENHO (CRUZ)
        document.getElementById('map').classList.remove('map-drawing-mode');

        // Aplicar estilo SEM BORDAS
        layer.setStyle({
            color: 'transparent', // Borda transparente
            fillColor: selectedColor,
            fillOpacity: 0.4,
            weight: 0, // Espessura zero
            opacity: 0 // Opacidade zero
        });

        // Adicionar ao layer
        drawnItems.addLayer(layer);

        // Desativar a ferramenta de desenho
        if (polygonDrawer) {
            polygonDrawer.disable();
        }

        // MOSTRAR POPUP DE EDIÇÃO APÓS CRIAR O POLÍGONO
        setTimeout(() => {
            openEditPopup();

            // Gerar nome automático
            const areaNameInput = document.getElementById('area-name-popup');
            if (areaNameInput && !areaNameInput.value.trim()) {
                // Contar quantas áreas já existem
                let areaCount = 0;
                drawnItems.eachLayer(function (layer) {
                    if (layer.areaData) areaCount++;
                });
                areaNameInput.value = `Mapa ${areaCount + 1}`;
                areaNameInput.focus();
            }

            showMessage('Polígono criado! Preencha as informações abaixo.', 'success', 3000);
        }, 100);
    }

    // Alternar modo de edição de vértices - APENAS A ÁREA ATUAL
    function toggleEditMode() {
        console.log('Ativando modo de edição para a área atual...');

        // Verificar se há uma área selecionada para edição
        if (!currentPolygonLayer) {
            // Tentar encontrar pelo ID se não tiver o layer
            if (currentAreaId) {
                console.log('Procurando layer pelo ID:', currentAreaId);
                drawnItems.eachLayer(function (layer) {
                    if (layer.areaId === currentAreaId) {
                        currentPolygonLayer = layer;
                        console.log('Layer encontrado pelo ID:', layer);
                    }
                });
            }

            // Se ainda não encontrou, mostrar mensagem
            if (!currentPolygonLayer) {
                showMessage('Selecione uma área para editar primeiro!', 'warning');
                return;
            }
        }

        console.log('Editando área:', currentPolygonLayer.areaData?.nome || 'Sem nome');

        // Remover modo de edição anterior se existir
        if (window.currentEditControl) {
            window.currentEditControl.disable();
            window.currentEditControl = null;
        }

        // Aplicar estilo de edição APENAS à área atual
        currentPolygonLayer.setStyle({
            color: '#f39c12', // Borda laranja durante edição
            fillColor: currentPolygonLayer.options.fillColor || selectedColor,
            fillOpacity: 0.4,
            weight: 3, // Borda mais grossa
            opacity: 0.8
        });

        // Marcar como em edição
        currentPolygonLayer._editing = true;

        // Adicionar classe CSS para animação
        if (currentPolygonLayer._path) {
            currentPolygonLayer._path.classList.add('editing');
        }

        // Criar controle de edição
        window.currentEditControl = new L.EditToolbar.Edit(map, {
            featureGroup: drawnItems,
            selectedPathOptions: {
                color: '#e74c3c', // Cor diferente para o selecionado
                weight: 4
            }
        });

        // Quando a edição terminar, voltar ao estilo sem bordas
        map.on('editable:disable', function () {
            console.log('Modo de edição desativado');

            // Remover borda da área editada
            if (currentPolygonLayer && currentPolygonLayer._editing) {
                currentPolygonLayer.setStyle({
                    color: 'transparent',
                    fillColor: currentPolygonLayer.options.fillColor || selectedColor,
                    fillOpacity: 0.4,
                    weight: 0,
                    opacity: 0
                });

                // Remover classe CSS
                if (currentPolygonLayer._path) {
                    currentPolygonLayer._path.classList.remove('editing');
                }

                currentPolygonLayer._editing = false;
            }

            // Remover controle
            if (window.currentEditControl) {
                window.currentEditControl = null;
            }

            // Remover botão de cancelar
            const cancelBtn = document.getElementById('cancel-edit-btn');
            if (cancelBtn) cancelBtn.remove();
        });

        // Ativar modo de edição
        window.currentEditControl.enable();

        // Selecionar APENAS a área atual para edição
        window.currentEditControl._selectedFeatureGroup.addLayer(currentPolygonLayer);

        // Adicionar botão para cancelar edição
        addCancelEditButton();

        showMessage('Modo edição ativado. Arraste os pontos para modificar a forma.', 'info', 3000);
    }

    // Adicionar botão para cancelar edição
    function addCancelEditButton() {
        // Remover botão anterior se existir
        const oldBtn = document.getElementById('cancel-edit-btn');
        if (oldBtn) oldBtn.remove();

        // Criar novo botão
        const cancelBtn = document.createElement('button');
        cancelBtn.id = 'cancel-edit-btn';
        cancelBtn.innerHTML = '<i class="fas fa-times"></i> Cancelar Edição';
        cancelBtn.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #e74c3c;
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 8px;
            cursor: pointer;
            z-index: 1000;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
            display: flex;
            align-items: center;
            gap: 8px;
        `;

        cancelBtn.addEventListener('click', function () {
            disableEditMode();
            this.remove();
        });

        document.querySelector('.map-container').appendChild(cancelBtn);
    }

    // Desativar modo de edição
    function disableEditMode() {
        console.log('Desativando modo de edição...');

        if (window.currentEditControl) {
            window.currentEditControl.disable();
            window.currentEditControl = null;
        }

        // Remover bordas de todos os polígonos
        const layers = drawnItems.getLayers();
        layers.forEach(layer => {
            if (layer.setStyle) {
                layer.setStyle({
                    color: 'transparent',
                    fillColor: layer.options.fillColor || selectedColor,
                    fillOpacity: 0.4,
                    weight: 0,
                    opacity: 0
                });

                // Remover classe CSS
                if (layer._path) {
                    layer._path.classList.remove('editing');
                }

                layer._editing = false;
            }
        });

        showMessage('Modo edição desativado', 'info', 2000);
    }


    // Desativar modo de edição
    function disableEditMode() {
        console.log('Desativando modo de edição...');

        if (window.currentEditControl) {
            window.currentEditControl.disable();
            window.currentEditControl = null;
        }

        // Remover borda da área editada
        if (currentPolygonLayer && currentPolygonLayer._editing) {
            currentPolygonLayer.setStyle({
                color: 'transparent',
                fillColor: currentPolygonLayer.options.fillColor || selectedColor,
                fillOpacity: 0.4,
                weight: 0,
                opacity: 0
            });

            // Remover classe CSS
            if (currentPolygonLayer._path) {
                currentPolygonLayer._path.classList.remove('editing');
            }

            currentPolygonLayer._editing = false;
        }

        // Remover botão de cancelar
        const cancelBtn = document.getElementById('cancel-edit-btn');
        if (cancelBtn) cancelBtn.remove();

        showMessage('Modo edição desativado', 'info', 2000);
    }


    // Encontrar layer pelo ID da área
    function findLayerByAreaId(areaId) {
        let foundLayer = null;
        drawnItems.eachLayer(function (layer) {
            if (layer.areaId === areaId) {
                foundLayer = layer;
                return true; // Parar a iteração
            }
        });
        return foundLayer;
    }

    // Encontrar layer pelos dados da área
    function findLayerByAreaData(areaData) {
        let foundLayer = null;
        drawnItems.eachLayer(function (layer) {
            // Verificar por ID
            if (layer.areaId === areaData.id) {
                foundLayer = layer;
                return true;
            }
            // Verificar por nome (fallback)
            if (layer.areaData && layer.areaData.nome === areaData.nome) {
                foundLayer = layer;
                return true;
            }
        });
        return foundLayer;
    }

    // Deletar forma atual
    function deleteCurrentShape() {
        if (!currentPolygonLayer && !currentAreaId) {
            showMessage('Nenhuma área para excluir!', 'warning');
            return;
        }

        showDeleteConfirmation(currentAreaId);
    }

    // Abrir popup de edição
    function openEditPopup(areaData = null) {
        console.log('=== DEBUG openEditPopup ===');
        console.log('Dados recebidos:', areaData);

        const popup = document.getElementById('edit-popup');
        const overlay = document.getElementById('popup-overlay');

        popup.classList.add('active');
        overlay.classList.add('active');

        if (areaData) {
            console.log('🔄 MODO EDIÇÃO para área:', areaData.nome);

            // Preencher campos do formulário
            document.getElementById('area-name-popup').value = areaData.nome || '';
            document.getElementById('area-type-popup').value = areaData.tipo || 'bairro';
            document.getElementById('area-description-popup').value = areaData.descricao || '';
            document.getElementById('agente-id-popup').value = areaData.agente_saude_id || '';
            document.getElementById('streetview-link-popup').value = areaData.streetview_link || '';

            // Definir cor correta
            selectedColor = areaData.cor || '#3498db';
            updateColorPicker();

            // Definir ID da área
            currentAreaId = areaData.id;
            console.log('ID da área para edição:', currentAreaId);

            // Encontrar o layer no mapa
            let foundLayer = false;

            // Buscar pelo ID
            drawnItems.eachLayer(function (layer) {
                if (layer.areaId === areaData.id) {
                    currentPolygonLayer = layer;
                    foundLayer = true;
                    console.log('✅ Layer encontrado pelo ID');
                    return true;
                }
            });

            // Buscar pelo GeoJSON se não encontrou
            if (!foundLayer && areaData.geojson) {
                drawnItems.eachLayer(function (layer) {
                    try {
                        if (layer.toGeoJSON &&
                            JSON.stringify(layer.toGeoJSON()) === JSON.stringify(areaData.geojson)) {
                            currentPolygonLayer = layer;
                            layer.areaId = areaData.id; // Atribuir ID
                            layer.areaData = areaData; // Atribuir dados
                            foundLayer = true;
                            console.log('✅ Layer encontrado pelo GeoJSON');
                            return true;
                        }
                    } catch (e) {
                        console.warn('Erro ao comparar GeoJSON:', e);
                    }
                });
            }

            if (!foundLayer) {
                console.warn('⚠️ Não encontrou layer, tentando criar novo...');
                // Se não encontrou, criar um layer a partir do GeoJSON
                try {
                    currentPolygonLayer = L.geoJSON(areaData.geojson, {
                        style: {
                            color: 'transparent',
                            fillColor: areaData.cor || '#3498db',
                            fillOpacity: 0.4,
                            weight: 0,
                            opacity: 0
                        }
                    }).addTo(drawnItems);

                    currentPolygonLayer.areaId = areaData.id;
                    currentPolygonLayer.areaData = areaData;
                    console.log('✅ Layer criado a partir do GeoJSON');
                } catch (e) {
                    console.error('❌ Erro ao criar layer:', e);
                }
            }

            isDrawing = false;

            // Atualizar título
            document.querySelector('.popup-header h3').innerHTML =
                '<i class="fas fa-edit"></i> Editar Área: ' + (areaData.nome || 'Sem nome');

        } else {
            // NOVA CRIAÇÃO
            console.log('🆕 MODO CRIAÇÃO');
            clearForm();
            currentAreaId = null;
            document.querySelector('.popup-header h3').innerHTML =
                '<i class="fas fa-plus"></i> Nova Área';
        }

        // Focar no primeiro campo
        document.getElementById('area-name-popup').focus();
    }

    // Cancelar desenho
    function cancelDrawing() {
        isDrawing = false;

        // REMOVER CLASSE DO CURSOR DE DESENHO
        document.getElementById('map').classList.remove('map-drawing-mode');

        // Remover polígono temporário
        if (currentPolygonLayer) {
            drawnItems.removeLayer(currentPolygonLayer);
            currentPolygonLayer = null;
        }

        // Desabilitar ferramenta de desenho
        if (polygonDrawer) {
            polygonDrawer.disable();
            polygonDrawer = null;
        }

        // Remover eventos
        map.off('draw:created');

        showMessage('Desenho cancelado.', 'info', 2000);
    }

    // Mostrar card de informações da área
    function showAreaInfoCard(areaData) {
        selectedAreaForCard = areaData;

        currentAreaId = areaData.id;

        // Tentar encontrar o layer correspondente
        drawnItems.eachLayer(function (layer) {
            if (layer.areaId === areaData.id) {
                currentPolygonLayer = layer;
            }
        });

        // Preencher informações no card
        document.getElementById('card-area-name').textContent = areaData.nome || 'Sem nome';
        document.getElementById('card-area-type').textContent = formatAreaType(areaData.tipo);

        // Status
        const statusElement = document.getElementById('card-area-status');
        if (areaData.status === 'mapeada') {
            statusElement.textContent = '🟢 Mapeada';
            statusElement.style.color = '#27ae60';
        } else {
            statusElement.textContent = '🟡 Descoberta';
            statusElement.style.color = '#f39c12';
        }

        // Descrição
        const descElement = document.getElementById('card-area-description');
        descElement.textContent = areaData.descricao || 'Sem descrição';

        // Agente
        const agenteRow = document.getElementById('card-agente-row');
        const agenteElement = document.getElementById('card-area-agente');
        if (areaData.agente_saude_id) {
            agenteElement.textContent = areaData.agente_saude_id;
            agenteRow.style.display = 'flex';
        } else {
            agenteRow.style.display = 'none';
        }

        const streetviewRow = document.getElementById('card-streetview-row');
        const streetviewLink = document.getElementById('card-streetview-link');
        if (areaData.streetview_link) {
            // Muda o texto do link
            streetviewLink.textContent = 'Abrir Street View';
            streetviewLink.href = '#';

            // Remove target="_blank" e adiciona evento para abrir popup
            streetviewLink.removeAttribute('target');
            streetviewLink.onclick = function (e) {
                e.preventDefault();
                openStreetViewPopup(areaData.streetview_link);
                return false;
            };

            streetviewRow.style.display = 'flex';
        } else {
            streetviewRow.style.display = 'none';
        }

        // Detectar se popups estão bloqueados
        function arePopupsBlocked() {
            const testPopup = window.open('', '_blank', 'width=1,height=1');
            if (!testPopup || testPopup.closed || typeof testPopup.closed === 'undefined') {
                return true;
            }
            testPopup.close();
            return false;
        }


        // Mostrar card
        document.getElementById('area-info-card').classList.add('active');
    }

    // Fechar card de informações
    function closeAreaInfoCard() {
        document.getElementById('area-info-card').classList.remove('active');
        selectedAreaForCard = null;
    }

    // Salvar área atual
    // Salvar área atual - VERSÃO CORRIGIDA
    async function saveCurrentArea() {
        if (!currentPolygonLayer) {
            showMessage('Não há área para salvar!', 'warning');
            return;
        }

        // Obter o GeoJSON do polígono
        let geojson;
        try {
            geojson = currentPolygonLayer.toGeoJSON();
            console.log('GeoJSON gerado:', geojson);
        } catch (error) {
            console.error('Erro ao converter polígono para GeoJSON:', error);
            showMessage('Erro ao processar a área desenhada', 'error');
            return;
        }

        // Coletar dados do formulário
        const nome = document.getElementById('area-name-popup').value.trim();
        const tipo = document.getElementById('area-type-popup').value;
        const descricao = document.getElementById('area-description-popup').value.trim();
        const agente = document.getElementById('agente-id-popup').value.trim();
        const streetview = document.getElementById('streetview-link-popup').value.trim();

        // Preparar dados - CRÍTICO: diferenciar entre novo e edição
        let areaData = {
            nome: nome || 'Mapa sem descrição',
            tipo: tipo,
            cor: selectedColor,
            descricao: descricao,
            streetview_link: streetview || null,
            geojson: geojson,
            equipe: window.APP_CONFIG.nome_equipe.toLowerCase().replace(/\s+/g, ''),
            agente_saude_id: agente || null,
            status: agente ? 'mapeada' : 'descoberta'
        };

        // *** ALTERAÇÃO IMPORTANTE: SEMPRE enviar o ID se existir ***
        // O servidor deve usar este ID para identificar se é update (se ID existe) ou insert (se ID não existe)
        if (currentAreaId) {
            areaData.id = currentAreaId;
            console.log('EDITANDO área existente. ID:', currentAreaId);
        } else {
            console.log('CRIANDO nova área (sem ID)');
        }

        console.log('Enviando dados para salvar:', areaData);

        try {
            showMessage('Salvando área...', 'info', 2000);

            // *** ALTERAÇÃO: Enviar método POST sempre, mas o servidor deve tratar pelo ID ***
            const response = await fetch('/api/salvar-area', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(areaData)
            });

            // Verificar se a resposta é JSON
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await response.text();
                console.error('Resposta não é JSON:', text);
                throw new Error('Resposta do servidor não é JSON: ' + text.substring(0, 100));
            }

            const result = await response.json();
            console.log('Resposta do servidor:', result);

            if (result.status === 'sucesso') {
                showMessage(currentAreaId ? 'Área atualizada com sucesso!' : 'Área criada com sucesso!', 'success');

                // *** NOVO CÓDIGO: Remover a versão antiga se for edição ***
                if (currentAreaId) {
                    // Procurar e remover TODAS as áreas com o mesmo ID (exceto a atual)
                    const layersToRemove = [];
                    drawnItems.eachLayer(function (layer) {
                        if (layer.areaId === currentAreaId && layer !== currentPolygonLayer) {
                            layersToRemove.push(layer);
                        }
                    });

                    // Remover as áreas antigas
                    layersToRemove.forEach(layer => {
                        drawnItems.removeLayer(layer);
                        console.log('Área duplicada removida:', currentAreaId);
                    });
                }

                // Atualizar estilo para SEM BORDAS
                currentPolygonLayer.setStyle({
                    color: 'transparent',
                    fillColor: selectedColor,
                    fillOpacity: 0.4,
                    weight: 0,
                    opacity: 0
                });

                // Se for edição, remover versões duplicadas ***
                if (currentAreaId && currentPolygonLayer) {
                    drawnItems.eachLayer(function (layer) {
                        // Remover qualquer outro layer com o mesmo ID (exceto o atual)
                        if (layer.areaId === currentAreaId && layer !== currentPolygonLayer) {
                            drawnItems.removeLayer(layer);
                            console.log('Layer duplicado removido durante edição');
                        }
                    });
                }

                // *** ALTERAÇÃO: Atualizar areaData no layer com o novo ID se for criação ***
                if (!currentAreaId && result.id) {
                    currentPolygonLayer.areaId = result.id;
                    currentAreaId = result.id;

                    // Atualizar também areaData se existir
                    if (currentPolygonLayer.areaData) {
                        currentPolygonLayer.areaData.id = result.id;
                        currentPolygonLayer.areaData.nome = nome;
                        currentPolygonLayer.areaData.tipo = tipo;
                        currentPolygonLayer.areaData.cor = selectedColor;
                        currentPolygonLayer.areaData.descricao = descricao;
                        currentPolygonLayer.areaData.agente_saude_id = agente;
                        currentPolygonLayer.areaData.streetview_link = streetview;
                    }
                } else if (currentAreaId && currentPolygonLayer.areaData) {
                    // Se for edição, atualizar os dados no layer
                    currentPolygonLayer.areaData.nome = nome;
                    currentPolygonLayer.areaData.tipo = tipo;
                    currentPolygonLayer.areaData.cor = selectedColor;
                    currentPolygonLayer.areaData.descricao = descricao;
                    currentPolygonLayer.areaData.agente_saude_id = agente;
                    currentPolygonLayer.areaData.streetview_link = streetview;
                }

                closeEditPopup();

                // Resetar estado
                isDrawing = false;

                // REMOVER CURSOR DE DESENHO
                document.getElementById('map').classList.remove('map-drawing-mode');

                // Limpar o polígono temporário se for nova criação
                if (!areaData.id) {
                    currentPolygonLayer = null;
                }

                // Remover ferramenta de desenho
                if (polygonDrawer) {
                    polygonDrawer.disable();
                    polygonDrawer = null;
                }

                // Recarregar áreas para atualizar a lista
                setTimeout(() => {
                    loadAreas();
                }, 500);

            } else {
                console.error('Erro do servidor:', result);
                showMessage('Erro: ' + (result.mensagem || 'Erro desconhecido'), 'error');
            }
        } catch (error) {
            console.error('Erro ao salvar área:', error);
            showMessage('Erro ao salvar: ' + error.message, 'error');
        }
    }

    // Deletar área atual a partir do popup - VERSÃO CORRIGIDA
    async function deleteCurrentAreaFromPopup() {
        console.log('=== DEBUG DELETAR ===');
        console.log('currentAreaId:', currentAreaId);
        console.log('currentPolygonLayer:', currentPolygonLayer);

        // Se não tem ID mas tem layer, tentar pegar o ID do layer
        if (!currentAreaId && currentPolygonLayer && currentPolygonLayer.areaId) {
            currentAreaId = currentPolygonLayer.areaId;
            console.log('DEBUG: ID recuperado do layer:', currentAreaId);
        }

        // Se ainda não tem ID mas tem layer com areaData
        if (!currentAreaId && currentPolygonLayer && currentPolygonLayer.areaData) {
            currentAreaId = currentPolygonLayer.areaData.id;
            console.log('DEBUG: ID recuperado do areaData:', currentAreaId);
        }

        const hasAreaId = !!currentAreaId;
        const hasPolygonLayer = !!currentPolygonLayer;

        console.log('Verificações FINAIS: hasAreaId:', hasAreaId, 'hasPolygonLayer:', hasPolygonLayer);

        if (!hasAreaId && !hasPolygonLayer) {
            showMessage('Nenhuma área para deletar!', 'warning');
            return;
        }

        // Confirmar antes de deletar
        const areaName = document.getElementById('area-name-popup').value || 'esta área';
        if (!confirm(`Tem certeza que deseja deletar "${areaName}"?\nEsta ação não pode ser desfeita.`)) {
            return;
        }

        const deleteBtn = document.getElementById('btn-delete-popup');
        const originalText = deleteBtn ? deleteBtn.innerHTML : '';

        try {
            // Se TEM ID (área já salva), deletar do servidor
            if (currentAreaId) {
                console.log('DEBUG: Deletando área do servidor. ID:', currentAreaId);

                if (deleteBtn) {
                    deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deletando...';
                    deleteBtn.disabled = true;
                }

                showMessage('Deletando área do servidor...', 'info', 2000);

                // Chamar API para deletar
                const response = await fetch(`/api/excluir-area/${currentAreaId}`, {
                    method: 'DELETE'
                });

                console.log('DEBUG: Resposta do servidor - Status:', response.status);

                const result = await response.json();
                console.log('DEBUG: Resposta do servidor - JSON:', result);

                if (result.status === 'sucesso') {
                    showMessage('Área deletada com sucesso!', 'success');

                    // Remover do mapa
                    if (currentPolygonLayer) {
                        drawnItems.removeLayer(currentPolygonLayer);
                        console.log('DEBUG: Layer removido do mapa');
                    } else {
                        // Se não encontrou pelo layer, tentar remover pelo ID
                        drawnItems.eachLayer(function (layer) {
                            if (layer.areaId === currentAreaId) {
                                drawnItems.removeLayer(layer);
                                console.log('DEBUG: Layer removido pelo ID');
                            }
                        });
                    }

                    // Fechar popup
                    closeEditPopup();

                    // Resetar variáveis
                    currentPolygonLayer = null;
                    currentAreaId = null;
                    isDrawing = false;

                    // Recarregar áreas para atualizar do servidor
                    setTimeout(() => {
                        loadAreas();
                        console.log('DEBUG: Áreas recarregadas após deleção');
                    }, 500);

                } else {
                    throw new Error(result.mensagem || 'Erro desconhecido do servidor');
                }

            } else {
                // Se NÃO TEM ID (área nova não salva), apenas remover visualmente
                console.log('DEBUG: Removendo área não salva (sem ID)');
                showMessage('Área removida!', 'success');

                if (currentPolygonLayer) {
                    drawnItems.removeLayer(currentPolygonLayer);
                    console.log('DEBUG: Layer removido (área não salva)');
                }

                closeEditPopup();

                // Resetar variáveis
                currentPolygonLayer = null;
                currentAreaId = null;
                isDrawing = false;

                // Se tinha ferramenta de desenho ativa, remover
                if (polygonDrawer) {
                    polygonDrawer.disable();
                    polygonDrawer = null;
                    console.log('DEBUG: Ferramenta de desenho removida');
                }
            }

        } catch (error) {
            console.error('Erro ao deletar área:', error);
            showMessage('Erro ao deletar: ' + error.message, 'error');

            // Restaurar botão
            if (deleteBtn) {
                deleteBtn.innerHTML = originalText;
                deleteBtn.disabled = false;
            }
        }
    }

    // Fechar popup de edição
    function closeEditPopup() {
        console.log('Fechando popup de edição...');

        const popup = document.getElementById('edit-popup');
        const overlay = document.getElementById('popup-overlay');

        if (popup) {
            popup.classList.remove('active');
            console.log('Popup removido');
        } else {
            console.error('Elemento edit-popup não encontrado!');
        }

        if (overlay) {
            overlay.classList.remove('active');
            console.log('Overlay removido');
        } else {
            console.error('Elemento popup-overlay não encontrado!');
        }

        // Se estava desenhando e fecha sem salvar, cancela o desenho
        if (isDrawing && currentPolygonLayer) {
            console.log('Cancelando desenho não salvo...');

            // Remove o polígono temporário se não foi salvo
            drawnItems.removeLayer(currentPolygonLayer);
            currentPolygonLayer = null;
            isDrawing = false;

            // REMOVER CURSOR DE DESENHO
            const mapElement = document.getElementById('map');
            if (mapElement) {
                mapElement.classList.remove('map-drawing-mode');
            }

            // Remover ferramenta de desenho
            if (polygonDrawer) {
                polygonDrawer.disable();
                polygonDrawer = null;
            }

            console.log('Desenho cancelado');
        }

        console.log('Popup fechado com sucesso');
    }


    // Abrir Street View em popup do navegador
    function openStreetViewPopup(streetviewUrl) {
        // Configurações do popup
        const width = 1000;
        const height = 700;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;

        // Parâmetros do popup
        const features = [
            `width=${width}`,
            `height=${height}`,
            `left=${left}`,
            `top=${top}`,
            'scrollbars=yes',
            'resizable=yes',
            'toolbar=no',
            'location=no',
            'directories=no',
            'status=no',
            'menubar=no'
        ].join(',');

        try {
            // Abrir popup
            const popup = window.open(streetviewUrl, 'StreetViewPopup', features);

            if (!popup || popup.closed || typeof popup.closed === 'undefined') {
                // Se popup foi bloqueado, abre em nova aba
                showMessage('Popup bloqueado. Abrindo em nova aba...', 'warning', 3000);
                window.open(streetviewUrl, '_blank', 'noopener,noreferrer');
            } else {
                // Focar no popup
                popup.focus();
                showMessage('Street View aberto em nova janela', 'info', 2000);
            }
        } catch (error) {
            console.error('Erro ao abrir popup:', error);
            // Fallback: abrir em nova aba
            window.open(streetviewUrl, '_blank', 'noopener,noreferrer');
        }
    }

    // Mostrar mini mapa com localização
    function showMiniMap(lat, lng) {
        const miniMapContainer = document.getElementById('mini-map');
        const mapPreview = document.getElementById('map-mini-preview');

        if (!miniMapContainer || !mapPreview) return;

        // Mostrar container
        mapPreview.style.display = 'block';

        // Limpar mapa anterior
        miniMapContainer.innerHTML = '';

        try {
            // Criar mini mapa
            const miniMap = L.map('mini-map', {
                center: [lat, lng],
                zoom: 15,
                zoomControl: false,
                attributionControl: false,
                dragging: false,
                touchZoom: false,
                scrollWheelZoom: false,
                doubleClickZoom: false,
                boxZoom: false,
                keyboard: false
            });

            // Tile layer simplificado
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 18,
                attribution: ''
            }).addTo(miniMap);

            // Adicionar marcador
            L.marker([lat, lng], {
                icon: L.divIcon({
                    className: 'custom-marker',
                    html: '<div style="background: #e74c3c; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>',
                    iconSize: [26, 26],
                    iconAnchor: [13, 26]
                })
            }).addTo(miniMap);

            // Ajustar tamanho após um delay
            setTimeout(() => {
                miniMap.invalidateSize();
            }, 100);

        } catch (error) {
            console.error('Erro ao criar mini mapa:', error);
            mapPreview.style.display = 'none';
        }
    }

    // Fechar modal do Street View
    function closeStreetViewModal() {
        const modal = document.getElementById('streetview-modal');

        if (!modal) return;

        // Fechar modal
        modal.classList.remove('active');

        // Restaurar scroll da página
        document.body.style.overflow = '';

        // Limpar mini mapa
        const mapPreview = document.getElementById('map-mini-preview');
        if (mapPreview) {
            mapPreview.style.display = 'none';
            const miniMapContainer = document.getElementById('mini-map');
            if (miniMapContainer) {
                miniMapContainer.innerHTML = '';
            }
        }
    }

    // Carregar áreas existentes
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


    // Renderizar áreas no mapa
    function renderAreas(areas) {
        // Limpar áreas antigas
        drawnItems.clearLayers();

        areas.forEach(area => {
            addAreaToMap(area);
        });
    }


    // Adicionar área ao mapa
    function addAreaToMap(area) {
        try {        // *** NOVO: Remover área existente com mesmo ID antes de adicionar ***
            if (area.id) {
                drawnItems.eachLayer(function (layer) {
                    if (layer.areaId === area.id) {
                        drawnItems.removeLayer(layer);
                        console.log('Área existente removida para atualização:', area.id);
                    }
                });
            }
            const layer = L.geoJSON(area.geojson, {
                style: {
                    color: 'transparent', // BORDA TRANSPARENTE
                    fillColor: area.cor || '#3498db',
                    fillOpacity: 0.4, // Opacidade do preenchimento
                    weight: 0, // ESPESSURA DA BORDA = 0
                    opacity: 0 // OPACIDADE DA BORDA = 0
                }
            }).addTo(drawnItems);

            // classe NAME CSS para leaflet aceitar. 
            setTimeout(() => {
                if (layer._path) {
                    layer._path.classList.add('area-no-border');
                }
            }, 50);

            layer.areaId = area.id;
            layer.areaData = area;


            // Click para abrir card de informações
            layer.on('click', function (e) {
                e.originalEvent.stopPropagation();
                showAreaInfoCard(area);
            });
            // Adicionar efeito hover
            layer.on('mouseover', function () {
                this.setStyle({
                    fillOpacity: 0.6 // Mais opaco no hover
                });
            });

            layer.on('mouseout', function () {
                this.setStyle({
                    fillOpacity: 0.3 // Volta ao normal
                });
            });
        } catch (error) {
            console.error('Erro ao adicionar área ao mapa:', error);
        }
    }

    // Atualizar cor do polígono atual
    function updateCurrentPolygonColor() {
        if (currentPolygonLayer) {
            currentPolygonLayer.setStyle({
                color: 'transparent', // Mantém borda transparente
                fillColor: selectedColor,
                fillOpacity: 0.3,
                weight: 0,
                opacity: 0
            });
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

    // Limpar formulário
    function clearForm() {
        document.getElementById('area-name-popup').value = '';
        document.getElementById('area-type-popup').value = 'bairro';
        document.getElementById('area-description-popup').value = '';
        document.getElementById('agente-id-popup').value = '';
        document.getElementById('streetview-link-popup').value = '';

        // Mantém a cor padrão
        selectedColor = '#3498db';
        updateColorPicker();
    }

    // Verificar permissões
    function checkPermissions() {
        if (!window.APP_CONFIG.usuario_logado || window.APP_CONFIG.nivel_usuario === 'convidado') {
            disableEditing();
        }
    }

    function disableEditing() {
        document.getElementById('btn-create-map').disabled = true;
        document.getElementById('btn-create-map').style.opacity = '0.5';
        document.getElementById('btn-create-map').style.cursor = 'not-allowed';

        showMessage('Modo visitante: apenas visualização', 'info', 3000);
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

    // Mostrar mensagem
    function showMessage(text, type = 'info', duration = 3000) {
        const existingMessages = document.querySelectorAll('.custom-message');
        existingMessages.forEach(msg => msg.remove());

        const messageDiv = document.createElement('div');
        messageDiv.className = 'custom-message';
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 100000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideInRight 0.3s ease;
            font-size: 14px;
        `;

        const colors = {
            success: '#27ae60',
            error: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db'
        };

        messageDiv.style.backgroundColor = colors[type] || colors.info;
        messageDiv.innerHTML = text;

        document.body.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 300);
        }, duration);
    }

    // Tela cheia
    function toggleFullscreen() {
        const mapPage = document.querySelector('.map-page');
        const fullscreenToggle = document.getElementById('fullscreen-toggle');

        if (!isFullscreen) {
            mapPage.classList.add('modo-tela-cheia');
            fullscreenToggle.innerHTML = '<i class="fas fa-compress"></i><span class="btn-text">Sair da Tela Cheia</span>';
            isFullscreen = true;
        } else {
            mapPage.classList.remove('modo-tela-cheia');
            fullscreenToggle.innerHTML = '<i class="fas fa-expand"></i><span class="btn-text">Tela Cheia</span>';
            isFullscreen = false;
        }

        setTimeout(() => {
            if (map) {
                map.invalidateSize();
                map.setView([DEFAULT_COORDS.lat, DEFAULT_COORDS.lng], DEFAULT_COORDS.zoom);
            }
        }, 100);
    }

    // Modal de confirmação
    function showDeleteConfirmation(areaId) {
        currentAreaId = areaId;
        document.getElementById('confirm-modal').classList.add('active');
        document.getElementById('btn-confirm-delete').onclick = function () {
            deleteArea(areaId);
            hideModal();
        };
    }

    function hideModal() {
        document.getElementById('confirm-modal').classList.remove('active');
        currentAreaId = null;
    }

    async function deleteArea(areaId) {
        try {
            const response = await fetch(`/api/excluir-area/${areaId}`, { method: 'DELETE' });
            const result = await response.json();

            if (result.status === 'sucesso') {
                showMessage('Área excluída com sucesso!', 'success');

                // Remover do mapa
                drawnItems.eachLayer(function (layer) {
                    if (layer.areaId === areaId) {
                        drawnItems.removeLayer(layer);
                        if (layer === currentPolygonLayer) {
                            currentPolygonLayer = null;
                        }
                    }
                });

                closeEditPopup();
            } else {
                showMessage('Erro: ' + result.mensagem, 'error');
            }
        } catch (error) {
            showMessage('Erro ao excluir: ' + error.message, 'error');
        }
    }

    // Inicializar
    init();
});
