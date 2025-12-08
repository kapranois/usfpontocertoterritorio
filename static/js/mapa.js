// Mapa Leaflet
let map;
let markers = [];

// Coordenadas de exemplo (substitua pelas reais)
const coordenadasExemplo = [
    {
        nome: "Condomínio Parque Verde",
        lat: -23.550520,
        lng: -46.633308,
        hipertensos: 45,
        diabeticos: 28,
        gestantes: 12,
        prioridade: "alta"
    },
    {
        nome: "Residencial São José",
        lat: -23.551520,
        lng: -46.634308,
        hipertensos: 32,
        diabeticos: 18,
        gestantes: 8,
        prioridade: "media"
    },
    {
        nome: "Edifício Central Park",
        lat: -23.549520,
        lng: -46.632308,
        hipertensos: 15,
        diabeticos: 10,
        gestantes: 5,
        prioridade: "baixa"
    }
];

// Inicializar mapa
function initMap() {
    // Coordenadas centrais (ajuste para sua cidade)
    const centerLat = -23.550520;
    const centerLng = -46.633308;
    
    map = L.map('map').setView([centerLat, centerLng], 15);
    
    // Adicionar tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(map);
    
    // Adicionar marcadores
    adicionarMarcadores();
    
    // Configurar controles de filtro
    configurarFiltros();
}

// Adicionar marcadores ao mapa
function adicionarMarcadores() {
    coordenadasExemplo.forEach(local => {
        // Cor baseada na prioridade
        let cor;
        switch(local.prioridade) {
            case 'alta': cor = '#e74c3c'; break;
            case 'media': cor = '#f39c12'; break;
            case 'baixa': cor = '#2ecc71'; break;
            default: cor = '#3498db';
        }
        
        // Criar ícone personalizado
        const icon = L.divIcon({
            className: 'custom-marker',
            html: `
                <div style="
                    background: ${cor};
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    border: 3px solid white;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    font-size: 12px;
                    cursor: pointer;
                ">
                    ${local.hipertensos}
                </div>
            `,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });
        
        // Criar popup com informações
        const popupContent = `
            <div style="padding: 10px; min-width: 200px;">
                <h3 style="margin: 0 0 10px 0; color: #2c3e50;">${local.nome}</h3>
                <div style="display: grid; gap: 5px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-heartbeat" style="color: #e74c3c;"></i>
                        <span>Hipertensos: <strong>${local.hipertensos}</strong></span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-prescription-bottle" style="color: #f39c12;"></i>
                        <span>Diabéticos: <strong>${local.diabeticos}</strong></span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-female" style="color: #9b59b6;"></i>
                        <span>Gestantes: <strong>${local.gestantes}</strong></span>
                    </div>
                    <div style="margin-top: 10px; padding: 5px 10px; background: ${cor}; color: white; border-radius: 5px; font-size: 12px; text-align: center;">
                        Prioridade: ${local.prioridade.toUpperCase()}
                    </div>
                </div>
            </div>
        `;
        
        // Adicionar marcador ao mapa
        const marker = L.marker([local.lat, local.lng], { icon: icon })
            .addTo(map)
            .bindPopup(popupContent);
        
        markers.push({
            marker: marker,
            data: local
        });
    });
}

// Configurar filtros
function configurarFiltros() {
    const checkboxes = document.querySelectorAll('.filters input[type="checkbox"]');
    
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', filtrarMarcadores);
    });
}

// Filtrar marcadores baseado nas seleções
function filtrarMarcadores() {
    const showHipertensos = document.getElementById('showHipertensos').checked;
    const showDiabeticos = document.getElementById('showDiabeticos').checked;
    const showGestantes = document.getElementById('showGestantes').checked;
    const showAlta = document.getElementById('showAlta').checked;
    const showMedia = document.getElementById('showMedia').checked;
    const showBaixa = document.getElementById('showBaixa').checked;
    
    markers.forEach(item => {
        let mostrar = true;
        
        // Filtrar por prioridade
        if (!showAlta && item.data.prioridade === 'alta') mostrar = false;
        if (!showMedia && item.data.prioridade === 'media') mostrar = false;
        if (!showBaixa && item.data.prioridade === 'baixa') mostrar = false;
        
        // Filtrar por condição (se todas desmarcadas, mostrar tudo)
        const temCondicoes = showHipertensos || showDiabeticos || showGestantes;
        if (temCondicoes) {
            let temCondicaoVisivel = false;
            if (showHipertensos && item.data.hipertensos > 0) temCondicaoVisivel = true;
            if (showDiabeticos && item.data.diabeticos > 0) temCondicaoVisivel = true;
            if (showGestantes && item.data.gestantes > 0) temCondicaoVisivel = true;
            
            if (!temCondicaoVisivel) mostrar = false;
        }
        
        // Mostrar ou esconder marcador
        if (mostrar) {
            map.addLayer(item.marker);
        } else {
            map.removeLayer(item.marker);
        }
    });
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', initMap);