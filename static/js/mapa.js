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
        document.getElementById('btn-cancel-popup').addEventListener('click', cancelDrawing);
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

        // Aplicar estilo com cor padrão
        layer.setStyle({
            color: selectedColor,
            fillColor: selectedColor,
            fillOpacity: 0.4,
            weight: 2
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

    // Alternar modo de edição de vértices
    function toggleEditMode() {
        if (drawnItems.getLayers().length === 0) {
            showMessage('Não há área para editar!', 'warning');
            return;
        }

        // Se estiver no popup editando um polígono específico
        if (currentPolygonLayer) {
            // Criar controle de edição
            const editControl = new L.EditToolbar.Edit(map, {
                featureGroup: drawnItems
            });

            // Ativar modo de edição
            editControl.enable();

            // Selecionar o polígono atual
            drawnItems.eachLayer(function (layer) {
                if (layer === currentPolygonLayer) {
                    editControl._selectedFeatureGroup.addLayer(layer);
                }
            });

            showMessage('Modo edição ativado. Arraste os pontos para modificar a forma.', 'info', 3000);
        }
    }

    // Deletar forma atual
    function deleteCurrentShape() {
        if (!currentPolygonLayer) {
            showMessage('Nenhuma área para excluir!', 'warning');
            return;
        }

        showDeleteConfirmation(currentAreaId);
    }

    // Abrir popup de edição
    function openEditPopup(areaData = null) {
        const popup = document.getElementById('edit-popup');
        const overlay = document.getElementById('popup-overlay');

        if (!popup || !overlay) {
            console.error('Elementos do popup não encontrados!');
            return;
        }

        popup.classList.add('active');
        overlay.classList.add('active');

        // Se for edição de um polígono existente
        if (areaData) {
            document.getElementById('area-name-popup').value = areaData.nome || '';
            document.getElementById('area-type-popup').value = areaData.tipo || 'bairro';
            document.getElementById('area-description-popup').value = areaData.descricao || '';
            document.getElementById('agente-id-popup').value = areaData.agente_saude_id || '';
            document.getElementById('streetview-link-popup').value = areaData.streetview_link || '';

            selectedColor = areaData.cor || selectedColor;
            updateColorPicker();

            currentAreaId = areaData.id;

            // Atualizar título do popup
            document.querySelector('.popup-header h3').innerHTML =
                '<i class="fas fa-edit"></i> Editar Área: ' + (areaData.nome || 'Sem nome');

            // Encontrar o layer correspondente
            drawnItems.eachLayer(function (layer) {
                if (layer.areaId === areaData.id) {
                    currentPolygonLayer = layer;
                }
            });

            isDrawing = false;
        } else {
            // Novo desenho - limpar formulário
            clearForm();
            currentAreaId = null;
            document.querySelector('.popup-header h3').innerHTML =
                '<i class="fas fa-plus"></i> Nova Área';
        }

        // Focar no primeiro campo
        document.getElementById('area-name-popup').focus();
    }

    // Fechar popup de edição
    function closeEditPopup() {
        const popup = document.getElementById('edit-popup');
        const overlay = document.getElementById('popup-overlay');

        popup.classList.remove('active');
        overlay.classList.remove('active');
        closeAreaInfoCard();

        // Se estava desenhando e fecha sem salvar, cancela o desenho
        if (isDrawing && currentPolygonLayer) {
            // Remove o polígono temporário se não foi salvo
            drawnItems.removeLayer(currentPolygonLayer);
            currentPolygonLayer = null;
            isDrawing = false;

            // REMOVER CURSOR DE DESENHO
            document.getElementById('map').classList.remove('map-drawing-mode');
        }
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

        // Street View (se existir) - AGORA ABRE MODAL DE PREVIEW
        const streetviewRow = document.getElementById('card-streetview-row');
        const streetviewLink = document.getElementById('card-streetview-link');
        if (areaData.streetview_link) {
            // Muda o texto do link
            streetviewLink.textContent = 'Abrir Street View';
            streetviewLink.href = '#';

            // Remove target="_blank" e adiciona evento para abrir modal
            streetviewLink.removeAttribute('target');
            streetviewLink.onclick = function (e) {
                e.preventDefault();
                openStreetViewModal(areaData.streetview_link);
                return false;
            };

            streetviewRow.style.display = 'flex';
        } else {
            streetviewRow.style.display = 'none';
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

        // Preparar dados (nenhum campo é obrigatório)
        let areaData = {
            nome: nome || 'Mapa sem descrição', // Nome padrão
            tipo: tipo,
            cor: selectedColor, // Usa a cor padrão ou escolhida
            descricao: descricao,
            streetview_link: streetview || null,
            geojson: geojson,
            equipe: window.APP_CONFIG.nome_equipe.toLowerCase().replace(/\s+/g, ''),
            agente_saude_id: agente || null,
            status: agente ? 'mapeada' : 'descoberta'
        };

        // Se já existe ID (edição), adicionar
        if (currentAreaId) {
            areaData.id = currentAreaId;
        }

        console.log('Enviando dados para salvar:', areaData);

        try {
            showMessage('Salvando área...', 'info', 2000);

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
                showMessage('Área salva com sucesso!', 'success');

                // Atualizar tooltip do polígono
                //currentPolygonLayer.bindTooltip(
                  //  `<b>${areaData.nome}</b><br>${formatAreaType(areaData.tipo)}<br>Clique para ver`,
                    //{ permanent: false, direction: 'center' }
                //  );

                // Adicionar dados da área ao layer
                //currentPolygonLayer.areaId = result.id || currentAreaId;
                //currentPolygonLayer.areaData = areaData;
                //currentPolygonLayer.areaData.id = result.id || currentAreaId;

                // Fechar popup
                closeEditPopup();

                // Resetar estado
                isDrawing = false;
                currentAreaId = null;

                // REMOVER CURSOR DE DESENHO
                document.getElementById('map').classList.remove('map-drawing-mode');

                // Limpar o polígono temporário
                currentPolygonLayer = null;

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

    // Abrir modal do Street View
    function openStreetViewModal(streetviewUrl) {
        const modal = document.getElementById('streetview-modal');
        const iframe = document.getElementById('streetview-iframe');
        const externalLink = document.getElementById('open-external-streetview');

        if (!modal || !iframe) return;

        // Configurar iframe
        iframe.src = streetviewUrl;

        // Configurar link externo
        externalLink.href = streetviewUrl;

        // Mostrar modal
        modal.classList.add('active');

        // Bloquear scroll da página
        document.body.style.overflow = 'hidden';
    }

    // Fechar modal do Street View
    function closeStreetViewModal() {
        const modal = document.getElementById('streetview-modal');
        const iframe = document.getElementById('streetview-iframe');

        if (!modal || !iframe) return;

        // Remover src do iframe para parar carregamento
        iframe.src = '';

        // Fechar modal
        modal.classList.remove('active');

        // Restaurar scroll da página
        document.body.style.overflow = '';
    }

    // Extrair coordenadas da URL do Google Maps (se possível)
    function extractCoordsFromUrl(url) {
        try {
            // Padrões comuns de URLs do Google Maps
            const patterns = [
                /@(-?\d+\.\d+),(-?\d+\.\d+),(\d+\.?\d*)z/, // @lat,lng,zoomz
                /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,          // !3dlat!4dlng
                /lat=(-?\d+\.\d+)&lng=(-?\d+\.\d+)/,       // lat=...&lng=...
                /q=(-?\d+\.\d+),(-?\d+\.\d+)/              // q=lat,lng
            ];

            for (const pattern of patterns) {
                const match = url.match(pattern);
                if (match) {
                    let lat, lng;

                    if (pattern.toString().includes('@')) {
                        // Formato: @lat,lng,zoomz
                        lat = parseFloat(match[1]);
                        lng = parseFloat(match[2]);
                    } else if (pattern.toString().includes('!3d')) {
                        // Formato: !3dlat!4dlng
                        lat = parseFloat(match[1]);
                        lng = parseFloat(match[2]);
                    } else if (pattern.toString().includes('lat=')) {
                        // Formato: lat=...&lng=...
                        lat = parseFloat(match[1]);
                        lng = parseFloat(match[2]);
                    } else {
                        // Formato: q=lat,lng
                        lat = parseFloat(match[1]);
                        lng = parseFloat(match[2]);
                    }

                    if (!isNaN(lat) && !isNaN(lng)) {
                        return { lat, lng };
                    }
                }
            }
        } catch (error) {
            console.error('Erro ao extrair coordenadas:', error);
        }

        return null;
    }

    // Abrir modal do Street View (agora é preview)
    function openStreetViewModal(streetviewUrl) {
        const modal = document.getElementById('streetview-modal');
        const urlDisplay = document.getElementById('streetview-url-display');
        const openTabBtn = document.getElementById('open-streetview-tab');
        const copyBtn = document.getElementById('copy-streetview-link');

        if (!modal || !urlDisplay) return;

        // Mostrar URL
        urlDisplay.textContent = streetviewUrl;

        // Configurar botão para abrir em nova aba
        openTabBtn.onclick = function () {
            window.open(streetviewUrl, '_blank', 'noopener,noreferrer');
            closeStreetViewModal();
        };

        // Configurar botão de copiar
        copyBtn.onclick = function () {
            navigator.clipboard.writeText(streetviewUrl)
                .then(() => {
                    showMessage('Link copiado para a área de transferência!', 'success');
                    copyBtn.innerHTML = '<i class="fas fa-check"></i> Copiado!';
                    setTimeout(() => {
                        copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copiar Link';
                    }, 2000);
                })
                .catch(err => {
                    console.error('Erro ao copiar:', err);
                    showMessage('Erro ao copiar link', 'error');
                });
        };

        // Tentar extrair coordenadas e mostrar mini mapa
        const coords = extractCoordsFromUrl(streetviewUrl);
        if (coords) {
            showMiniMap(coords.lat, coords.lng);
        } else {
            // Esconder mini mapa se não conseguir extrair coordenadas
            document.getElementById('map-mini-preview').style.display = 'none';
        }

        // Mostrar modal
        modal.classList.add('active');

        // Bloquear scroll da página
        document.body.style.overflow = 'hidden';
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
        try {
            const layer = L.geoJSON(area.geojson, {
                style: {
                    color: area.cor || '#3498db', // Cor padrão se não tiver
                    fillColor: area.cor || '#3498db',
                    fillOpacity: 0.4,
                    weight: 2
                }
            }).addTo(drawnItems);

            // Tooltip com informações básicas
            const tooltipContent = `
                <div style="text-align: center;">
                    <b>${area.nome}</b><br>
                    <small>${formatAreaType(area.tipo)}</small><br>
                    <small>${area.descricao || 'Clique para ver informações'}</small>
                </div>
            `;

            //layer.bindTooltip(tooltipContent, {
              //  permanent: false,
                //direction: 'center',
                //lassName: 'area-tooltip'
            //});

            layer.areaId = area.id;
            layer.areaData = area;

            // Click para abrir popup de edição
            layer.on('click', function (e) {
                e.originalEvent.stopPropagation(); // Evitar propagação para o mapa
                showAreaInfoCard(area);
            });

        } catch (error) {
            console.error('Erro ao adicionar área ao mapa:', error);
        }
    }

    // Atualizar cor do polígono atual
    function updateCurrentPolygonColor() {
        if (currentPolygonLayer) {
            currentPolygonLayer.setStyle({
                color: selectedColor,
                fillColor: selectedColor
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
