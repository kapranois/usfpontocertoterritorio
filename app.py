from flask import Flask, render_template, jsonify, request, session, redirect, url_for
import json
import os
from datetime import datetime
import hashlib
from functools import wraps

app = Flask(__name__)
app.secret_key = 'acs_2025_seguro_123_altere_esta_chave'

# Configurações importantes da sessão
app.config.update(
    SESSION_COOKIE_SECURE=False,  # True em produção com HTTPS
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='Lax',
    PERMANENT_SESSION_LIFETIME=86400,  # 24 horas em segundos
    SESSION_PERMANENT=True
)

# Configuração das equipes
EQUIPES = {
    'equipe1': 'Equipe 1',
    'equipe2': 'Equipe 2',
    'equipe3': 'Equipe 3'
}

# Função para criar hash da senha
def criar_senha_hash(senha):
    """Cria hash da senha usando SHA-256"""
    return hashlib.sha256(senha.encode()).hexdigest()

# Dicionário de usuários (ADICIONADO USUÁRIO CONVIDADO)
USUARIOS = {
    'admin': {
        'senha_hash': criar_senha_hash('admin123'),
        'nome': 'Administrador',
        'nivel': 'admin',
        'equipes': ['equipe1', 'equipe2', 'equipe3']
    },
    'acs1': {
        'senha_hash': criar_senha_hash('acs123'),
        'nome': 'Agente Comunitário 1',
        'nivel': 'acs',
        'equipes': ['equipe1']
    },
    'acs2': {
        'senha_hash': criar_senha_hash('acs456'),
        'nome': 'Agente Comunitário 2',
        'nivel': 'acs',
        'equipes': ['equipe2']
    },
    'acs3': {
        'senha_hash': criar_senha_hash('acs789'),
        'nome': 'Agente Comunitário 3',
        'nivel': 'acs',
        'equipes': ['equipe3']
    },
    'convidado': {  # NOVO USUÁRIO CONVIDADO
        'senha_hash': criar_senha_hash('convidado'),
        'nome': 'Visitante',
        'nivel': 'convidado',
        'equipes': ['equipe1', 'equipe2', 'equipe3']
    }
}

def carregar_dados():
    """Carrega os dados do arquivo JSON"""
    if os.path.exists('data/dados.json'):
        with open('data/dados.json', 'r', encoding='utf-8') as f:
            dados = json.load(f)
            
            # Garantir compatibilidade
            for cond in dados.get('condominios', []):
                if 'acs_responsavel' in cond and 'acs_multiplos' not in cond:
                    cond['acs_multiplos'] = []
                    if cond['acs_responsavel']:
                        cond['acs_multiplos'].append({
                            'nome': cond['acs_responsavel'],
                            'blocos': cond.get('blocos_ativos', ''),
                            'data_inicio': cond.get('ultima_visita', '2024-01-01')
                        })
            
            return dados
    return {"condominios": [], "acs": []}

def carregar_equipes():
    """Carrega os dados das equipes profissionais"""
    try:
        if os.path.exists('data/equipes.json'):
            with open('data/equipes.json', 'r', encoding='utf-8') as f:
                dados = json.load(f)
                print(f"DEBUG: Arquivo equipes.json carregado. Estrutura: {type(dados)}")
                print(f"DEBUG: Chaves no JSON: {dados.keys() if isinstance(dados, dict) else 'Não é dict'}")
                return dados
        else:
            print("DEBUG: Arquivo equipes.json não encontrado")
            return {'equipes': []}
    except Exception as e:
        print(f"DEBUG: Erro ao carregar equipes.json: {e}")
        return {'equipes': []}

def salvar_dados(dados):
    """Salva dados no JSON"""
    os.makedirs('data', exist_ok=True)
    with open('data/dados.json', 'w', encoding='utf-8') as f:
        json.dump(dados, f, ensure_ascii=False, indent=2)

def filtrar_por_equipe(dados, equipe):
    """Filtra condomínios pela equipe"""
    if 'condominios' not in dados:
        return []
    return [c for c in dados['condominios'] if c.get('equipe') == equipe]

def calcular_metricas(condominios):
    """Calcula métricas para os condomínios"""
    if not condominios:
        return {
            'total_moradores': 0,
            'total_hipertensos': 0,
            'total_diabeticos': 0,
            'total_gestantes': 0,
            'cobertura_geral': 0
        }
    
    total_moradores = sum(c.get('moradores', 0) for c in condominios)
    total_hipertensos = sum(c.get('hipertensos', 0) for c in condominios)
    total_diabeticos = sum(c.get('diabeticos', 0) for c in condominios)
    total_gestantes = sum(c.get('gestantes', 0) for c in condominios)
    
    # Calcula cobertura média com base nos valores reais de cobertura
    cobertura_total = sum(c.get('cobertura', 0) for c in condominios)
    cobertura_geral = cobertura_total / len(condominios) if condominios else 0
    
    return {
        'total_moradores': total_moradores,
        'total_hipertensos': total_hipertensos,
        'total_diabeticos': total_diabeticos,
        'total_gestantes': total_gestantes,
        'cobertura_geral': round(cobertura_geral, 1)
    }

def verificar_login():
    """Verifica se o usuário está logado e retorna informações"""
    if 'usuario' in session:
        return {
            'logado': True,
            'nome': session.get('nome_usuario', 'Usuário'),
            'nivel': session.get('nivel_usuario', 'acs')
        }
    return {'logado': False, 'nome': '', 'nivel': ''}

# Decorators
def equipe_required(f):
    """Decorator para exigir que uma equipe tenha sido escolhida"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'equipe' not in session:
            return jsonify({'error': 'Equipe não selecionada'}), 401
        return f(*args, **kwargs)
    return decorated_function

def login_required(f):
    """Decorator para exigir que o usuário esteja logado"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'usuario' not in session:
            return jsonify({'error': 'Usuário não autenticado'}), 401
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    """Decorator para exigir que o usuário seja admin"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'usuario' not in session:
            return jsonify({'error': 'Usuário não autenticado'}), 401
        if session.get('nivel_usuario') != 'admin':
            return jsonify({'error': 'Acesso restrito a administradores'}), 403
        return f(*args, **kwargs)
    return decorated_function

def convidado_bloqueado(f):
    """Decorator para bloquear ações de convidados"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'usuario' in session and session.get('nivel_usuario') == 'convidado':
            return jsonify({'status': 'erro', 'mensagem': 'Modo visitante: apenas visualização'}), 403
        return f(*args, **kwargs)
    return decorated_function

@app.before_request
def verificar_sessao():
    """Verifica a sessão antes de cada requisição"""
    # Lista de rotas que não precisam de verificação
    rotas_publicas = ['login', 'static', 'logout', 'inicio']
    
    if request.endpoint and request.endpoint not in rotas_publicas:
        # Se tem usuário na sessão, renova a sessão
        if 'usuario' in session:
            session.permanent = True

def calcular_cobertura(blocos_ativos_texto, total_torres):
    """
    Calcula cobertura a partir do texto de blocos ativos
    Exemplo: "1-5" = 5 blocos cobertos, "1,3,5" = 3 blocos cobertos
    """
    if not blocos_ativos_texto or not total_torres or total_torres <= 0:
        return 0, 0, 0, 'descoberto'
    
    blocos_cobertos = 0
    numeros_cobertos = set()
    
    try:
        # Remove espaços e divide por vírgula ou ponto e vírgula
        partes = [p.strip() for p in blocos_ativos_texto.replace(';', ',').split(',') if p.strip()]
        
        for parte in partes:
            if '-' in parte:
                # É uma faixa (ex: 1-5 ou 1 - 5)
                faixa = [n.strip() for n in parte.split('-') if n.strip()]
                if len(faixa) == 2:
                    inicio = int(faixa[0])
                    fim = int(faixa[1])
                    
                    if inicio <= fim:
                        # Adiciona todos os números da faixa
                        for i in range(inicio, fim + 1):
                            if 1 <= i <= total_torres:
                                numeros_cobertos.add(i)
            else:
                # É um número único
                try:
                    num = int(parte)
                    if 1 <= num <= total_torres:
                        numeros_cobertos.add(num)
                except ValueError:
                    continue  # Ignora partes que não são números
        
        blocos_cobertos = len(numeros_cobertos)
        
    except Exception as e:
        print(f"Erro ao calcular cobertura: {e}")
        blocos_cobertos = 0
    
    # Calcula valores
    blocos_cobertos = min(blocos_cobertos, total_torres)
    blocos_descobertos = total_torres - blocos_cobertos
    cobertura = round((blocos_cobertos / total_torres) * 100) if total_torres > 0 else 0
    
    # Determina status
    if cobertura == 0:
        status = 'descoberto'
    elif cobertura == 100:
        status = 'completo'
    else:
        status = 'parcial'
    
    return blocos_cobertos, blocos_descobertos, cobertura, status

# ============================================
# ROTAS PRINCIPAIS
# ============================================

@app.route('/login', methods=['GET', 'POST'])
def login():
    """Página de login com opção de convidado"""
    if request.method == 'POST':
        usuario = request.form.get('usuario')
        senha = request.form.get('senha')
        
        # Verificar se é acesso como convidado (senha fixa)
        if usuario == 'convidado' and senha == 'convidado':
            session['usuario'] = 'convidado'
            session['nome_usuario'] = 'Visitante'
            session['nivel_usuario'] = 'convidado'
            session['equipes_usuario'] = ['equipe1', 'equipe2', 'equipe3']
            session.permanent = True
            print(f"DEBUG: Convidado logado com sucesso")
            return redirect(url_for('inicio'))
        
        if usuario in USUARIOS:
            senha_hash = criar_senha_hash(senha)
            if USUARIOS[usuario]['senha_hash'] == senha_hash:
                # Login bem sucedido
                session['usuario'] = usuario
                session['nome_usuario'] = USUARIOS[usuario]['nome']
                session['nivel_usuario'] = USUARIOS[usuario]['nivel']
                session['equipes_usuario'] = USUARIOS[usuario]['equipes']
                session.permanent = True
                
                # Redirecionar para dashboard se já tiver equipe selecionada
                if 'equipe' in session and session['equipe'] in USUARIOS[usuario]['equipes']:
                    return redirect(url_for('dashboard'))
                else:
                    return redirect(url_for('inicio'))
        
        # Login falhou
        return render_template('login.html', error='Usuário ou senha inválidos')
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    """Logout completo - remove tudo"""
    session.clear()
    return redirect(url_for('login'))

@app.route('/trocar-equipe')
def trocar_equipe():
    """Trocar de equipe mantendo login"""
    # Remove apenas informações da equipe
    session.pop('equipe', None)
    session.pop('nome_equipe', None)
    return redirect(url_for('inicio'))

@app.route('/debug-session')
def debug_session():
    """Debug da sessão"""
    return jsonify({
        'session_data': dict(session),
        'usuario_logado': 'usuario' in session,
        'equipe_selecionada': 'equipe' in session,
        'cookies': dict(request.cookies)
    })

@app.route('/')
def inicio():
    """Página inicial - verifica se precisa login"""
    # Se não está logado, mostrar login
    if 'usuario' not in session:
        return redirect(url_for('login'))
    
    # Se está logado mas não tem equipe selecionada
    if 'equipe' not in session:
        login_info = verificar_login()
        return render_template('escolha_equipe.html', 
                             equipes=EQUIPES,
                             usuario_logado=login_info['logado'],
                             nome_usuario=login_info['nome'],
                             nivel_usuario=login_info['nivel'])
    
    # Se está logado e tem equipe, ir para dashboard
    return redirect(url_for('dashboard'))

@app.route('/selecionar-equipe', methods=['POST'])
def selecionar_equipe():
    """Processa a escolha da equipe"""
    if 'usuario' not in session:
        return redirect(url_for('login'))
    
    equipe = request.form.get('equipe')
    if equipe in EQUIPES:
        # Verificar se usuário tem permissão para esta equipe
        if equipe in session.get('equipes_usuario', []):
            session['equipe'] = equipe
            session['nome_equipe'] = EQUIPES[equipe]
            return redirect(url_for('dashboard'))
        else:
            # Usuário não tem permissão para esta equipe
            login_info = verificar_login()
            return render_template('escolha_equipe.html', 
                                equipes=EQUIPES,
                                error='Você não tem permissão para acessar esta equipe',
                                usuario_logado=login_info['logado'],
                                nome_usuario=login_info['nome'],
                                nivel_usuario=login_info['nivel'])
    
    return redirect(url_for('inicio'))

@app.route('/dashboard')
def dashboard():
    """Dashboard principal da equipe"""
    print(f"\n=== DEBUG DASHBOARD ===")
    print(f"Usuário na sessão: {session.get('usuario')}")
    print(f"Equipe na sessão: {session.get('equipe')}")
    print(f"Nome equipe: {session.get('nome_equipe')}")
    
    if 'equipe' not in session:
        print("DEBUG: Nenhuma equipe selecionada, redirecionando...")
        return redirect(url_for('inicio'))
    
    # Carregar dados
    dados = carregar_dados()
    equipes_data = carregar_equipes()
    
    # DEBUG: Verificar estrutura das equipes
    print(f"DEBUG: Tipo de equipes_data: {type(equipes_data)}")
    
    # Encontrar a equipe atual
    equipe_id = session['equipe']
    equipe_atual = None
    profissionais = {}
    
    if 'equipes' in equipes_data:
        print(f"DEBUG: Encontrando equipe com ID: {equipe_id}")
        print(f"DEBUG: Equipes disponíveis: {[e.get('id') for e in equipes_data.get('equipes', [])]}")
        
        for equipe in equipes_data['equipes']:
            if equipe.get('id') == equipe_id:
                equipe_atual = equipe
                print(f"DEBUG: Equipe encontrada: {equipe_atual.get('nome')}")
                print(f"DEBUG: Tem profissionais? {'profissionais' in equipe_atual}")
                break
    
    # Obter profissionais da equipe
    if equipe_atual and 'profissionais' in equipe_atual:
        profissionais = equipe_atual['profissionais']
        print(f"DEBUG: ACS encontrados: {len(profissionais.get('acs', []))}")
        print(f"DEBUG: Enfermeiro: {profissionais.get('enfermeiro', {}).get('nome')}")
        print(f"DEBUG: Médico: {profissionais.get('medico', {}).get('nome')}")
    else:
        print(f"DEBUG: NÃO ENCONTROU EQUIPE {equipe_id}!")
        print(f"DEBUG: Equipe atual: {equipe_atual}")
        profissionais = {
            'acs': [],
            'enfermeiro': None,
            'medico': None
        }
    
    # Filtrar condomínios da equipe
    condominios_equipe = filtrar_por_equipe(dados, session['equipe'])
    metricas = calcular_metricas(condominios_equipe)
    
    # Informações do usuário
    usuario_logado = 'usuario' in session
    nome_usuario = session.get('nome_usuario', 'Usuário')
    nivel_usuario = session.get('nivel_usuario', 'acs')
    
    print(f"DEBUG: Profissionais enviados ao template: {bool(profissionais)}")
    print(f"DEBUG: ACS no template: {len(profissionais.get('acs', []))}")
    print("=== FIM DEBUG ===\n")
    
    return render_template(
        'index.html',
        condominios=condominios_equipe,
        metricas=metricas,
        nome_equipe=session['nome_equipe'],
        usuario_logado=usuario_logado,
        nome_usuario=nome_usuario,
        nivel_usuario=nivel_usuario,
        equipe_profissionais=profissionais  # Envia o dicionário de profissionais
    )
@app.route('/debug-profissionais')
def debug_profissionais():
    """Endpoint para debug dos profissionais"""
    equipes_data = carregar_equipes()
    equipe_id = session.get('equipe', 'equipe1')
    
    # Encontrar a equipe atual
    equipe_atual = None
    if 'equipes' in equipes_data:
        for equipe in equipes_data['equipes']:
            if equipe.get('id') == equipe_id:
                equipe_atual = equipe
                break
    
    return jsonify({
        'session_equipe': equipe_id,
        'todas_equipes_ids': [e.get('id') for e in equipes_data.get('equipes', [])],
        'equipe_encontrada': equipe_atual,
        'profissionais': equipe_atual.get('profissionais', {}) if equipe_atual else {}
    })

@app.route('/mapa')
def mapa():
    """Página do mapa"""
    if 'equipe' not in session:
        return redirect(url_for('inicio'))
    
    dados = carregar_dados()
    condominios_equipe = filtrar_por_equipe(dados, session['equipe'])
    
    login_info = verificar_login()
    
    return render_template(
        'mapa.html',
        condominios=condominios_equipe,
        nome_equipe=session['nome_equipe'],
        usuario_logado=login_info['logado'],
        nome_usuario=login_info['nome'],
        nivel_usuario=login_info['nivel']
    )

@app.route('/condominios')
def condominios():
    """Página de condomínios"""
    if 'equipe' not in session:
        return redirect(url_for('inicio'))
    
    dados = carregar_dados()
    condominios_equipe = filtrar_por_equipe(dados, session['equipe'])
    
    login_info = verificar_login()
    
    return render_template(
        'condominios.html',
        condominios=condominios_equipe,
        nome_equipe=session['nome_equipe'],
        usuario_logado=login_info['logado'],
        nome_usuario=login_info['nome'],
        nivel_usuario=login_info['nivel']
    )

@app.route('/relatorios')
def relatorios():
    """Página de relatórios"""
    if 'equipe' not in session:
        return redirect(url_for('inicio'))
    
    dados = carregar_dados()
    condominios_equipe = filtrar_por_equipe(dados, session['equipe'])
    metricas = calcular_metricas(condominios_equipe)
    
    login_info = verificar_login()
    
    return render_template(
        'relatorios.html',
        condominios=condominios_equipe,
        metricas=metricas,
        nome_equipe=session['nome_equipe'],
        usuario_logado=login_info['logado'],
        nome_usuario=login_info['nome'],
        nivel_usuario=login_info['nivel']
    )

# ============================================
# API PARA CONDOMÍNIOS (ATUALIZADA COM BLOQUEIO PARA CONVIDADOS)
# ============================================

@app.route('/api/novo-condominio', methods=['POST'])
@login_required
@convidado_bloqueado
def novo_condominio():
    """API para adicionar novo condomínio (BLOQUEADO PARA CONVIDADOS)"""
    print(f"DEBUG API: Usuário tentando adicionar condomínio: {session.get('usuario')}")
    
    try:
        if 'equipe' not in session:
            return jsonify({'status': 'erro', 'mensagem': 'Equipe não selecionada'}), 401
        
        dados = carregar_dados()
        novo = request.json
        
        print(f"DEBUG: Dados recebidos: {novo}")
        
        # Validações
        if not novo.get('nome') or not novo.get('nome').strip():
            return jsonify({'status': 'erro', 'mensagem': 'Nome do condomínio é obrigatório'}), 400
        
        torres = novo.get('torres', 0)
        if torres <= 0:
            return jsonify({'status': 'erro', 'mensagem': 'Número de blocos inválido'}), 400
        
        # CALCULAR COBERTURA NO BACKEND
        blocos_ativos = novo.get('blocos_ativos', '')
        blocos_cobertos, blocos_descobertos, cobertura, status_cobertura = calcular_cobertura(blocos_ativos, torres)
        
        print(f"DEBUG Cálculo: torres={torres}, blocos_ativos='{blocos_ativos}'")
        print(f"DEBUG Resultado: cobertos={blocos_cobertos}, descobertos={blocos_descobertos}, cobertura={cobertura}%, status={status_cobertura}")
        
        # Garantir campos de cobertura (usar valores calculados)
        novo['blocos_cobertos'] = blocos_cobertos
        novo['blocos_descobertos'] = blocos_descobertos
        novo['cobertura'] = cobertura
        novo['status_cobertura'] = status_cobertura
        
        # Se não tem ACS, garantir que status seja 'descoberto'
        if not novo.get('acs_responsavel'):
            novo['status_cobertura'] = 'descoberto'
            novo['cobertura'] = 0
            novo['blocos_cobertos'] = 0
            novo['blocos_descobertos'] = torres
        
        # Pertence à equipe atual
        novo['equipe'] = session['equipe']
        
        # Garantir que tem data de última visita
        if 'ultima_visita' not in novo or not novo['ultima_visita']:
            novo['ultima_visita'] = datetime.now().strftime('%Y-%m-%d')
        
        # Garantir campos de saúde com valor padrão
        novo['hipertensos'] = novo.get('hipertensos', 0)
        novo['diabeticos'] = novo.get('diabeticos', 0)
        novo['gestantes'] = novo.get('gestantes', 0)
        novo['prioridade'] = novo.get('prioridade', 'media')
        
        # Gerar ID
        if dados['condominios']:
            novo['id'] = max(c['id'] for c in dados['condominios']) + 1
        else:
            novo['id'] = 1
        
        # Se tem ACS, registrar também na lista de ACS
        acs_responsavel = novo.get('acs_responsavel')
        if acs_responsavel:
            if 'acs' not in dados:
                dados['acs'] = []
            
            # Verificar se ACS já existe
            acs_existente = None
            for acs in dados.get('acs', []):
                if acs['nome'] == acs_responsavel and acs['equipe'] == session['equipe']:
                    acs_existente = acs
                    break
            
            if acs_existente:
                # Atualizar ACS existente
                if 'condominios' not in acs_existente:
                    acs_existente['condominios'] = []
                if novo['id'] not in acs_existente['condominios']:
                    acs_existente['condominios'].append(novo['id'])
                acs_existente['blocos_ativos'] = blocos_ativos
            else:
                # Criar novo ACS
                novo_acs = {
                    'id': len(dados['acs']) + 1,
                    'nome': acs_responsavel,
                    'equipe': session['equipe'],
                    'condominios': [novo['id']],
                    'blocos_ativos': blocos_ativos,
                    'total_moradores': novo.get('moradores', 0),
                    'total_hipertensos': novo.get('hipertensos', 0)
                }
                dados['acs'].append(novo_acs)
        
        # Adicionar condomínio
        dados['condominios'].append(novo)
        salvar_dados(dados)
        
        print(f"DEBUG: Condomínio salvo com ID {novo['id']}")
        print(f"DEBUG: Cobertura calculada: {cobertura}% ({blocos_cobertos}/{torres} blocos)")
        
        return jsonify({
            'status': 'sucesso',
            'mensagem': 'Condomínio cadastrado com informações de cobertura!',
            'id': novo['id'],
            'status_cobertura': novo['status_cobertura'],
            'cobertura': novo['cobertura'],
            'blocos_cobertos': novo['blocos_cobertos'],
            'blocos_descobertos': novo['blocos_descobertos']
        })
        
    except Exception as e:
        print(f"DEBUG ERRO: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'status': 'erro', 'mensagem': f'Erro interno: {str(e)}'}), 500

@app.route('/api/condominio/<int:condominio_id>')
@equipe_required
def get_condominio(condominio_id):
    """Obter dados de um condomínio específico"""
    dados = carregar_dados()
    
    for cond in dados['condominios']:
        if cond['id'] == condominio_id and cond.get('equipe') == session['equipe']:
            return jsonify(cond)
    
    return jsonify({'error': 'Condomínio não encontrado'}), 404

@app.route('/api/atualizar-condominio/<int:condominio_id>', methods=['PUT'])
@login_required
@convidado_bloqueado
def atualizar_condominio(condominio_id):
    """Atualizar um condomínio existente (BLOQUEADO PARA CONVIDADOS)"""
    try:
        dados = carregar_dados()
        atualizacoes = request.json
        equipe_atual = session['equipe']
        
        print(f"DEBUG ATUALIZAÇÃO: Recebendo atualizações para condomínio {condominio_id}")
        print(f"DEBUG ATUALIZAÇÃO: Dados recebidos: {atualizacoes}")
        
        for i, cond in enumerate(dados['condominios']):
            if cond['id'] == condominio_id:
                # Verificar se pertence à equipe atual
                if cond.get('equipe') != equipe_atual:
                    return jsonify({
                        'status': 'erro',
                        'mensagem': 'Você não tem permissão para modificar este condomínio'
                    }), 403
                
                print(f"DEBUG: Condomínio encontrado - Antes: {cond}")
                
                # Atualizar campos básicos
                campos_basicos = ['nome', 'torres', 'apartamentos', 'moradores',
                                 'hipertensos', 'diabeticos', 'gestantes', 'prioridade',
                                 'ultima_visita', 'acs_responsavel', 'blocos_ativos']
                
                for campo in campos_basicos:
                    if campo in atualizacoes:
                        dados['condominios'][i][campo] = atualizacoes[campo]
                
                # SEMPRE RECALCULAR COBERTURA (não confiar nos valores enviados)
                # Obter valores atuais
                torres = dados['condominios'][i]['torres']
                blocos_ativos = dados['condominios'][i].get('blocos_ativos', '')
                
                # Usar a função calcular_cobertura que já temos
                blocos_cobertos, blocos_descobertos, cobertura, status_cobertura = calcular_cobertura(
                    blocos_ativos, 
                    torres
                )
                
                print(f"DEBUG CÁLCULO: torres={torres}, blocos_ativos='{blocos_ativos}'")
                print(f"DEBUG CÁLCULO: Resultado - cobertos={blocos_cobertos}, descobertos={blocos_descobertos}, cobertura={cobertura}%")
                
                # Atualizar campos calculados
                dados['condominios'][i]['blocos_cobertos'] = blocos_cobertos
                dados['condominios'][i]['blocos_descobertos'] = blocos_descobertos
                dados['condominios'][i]['cobertura'] = cobertura
                dados['condominios'][i]['status_cobertura'] = status_cobertura
                
                # Se não tem ACS, garantir status 'descoberto'
                if not dados['condominios'][i].get('acs_responsavel'):
                    dados['condominios'][i]['status_cobertura'] = 'descoberto'
                    dados['condominios'][i]['cobertura'] = 0
                    dados['condominios'][i]['blocos_cobertos'] = 0
                    dados['condominios'][i]['blocos_descobertos'] = torres
                
                print(f"DEBUG: Condomínio atualizado - Depois: {dados['condominios'][i]}")
                
                # Atualizar também na lista de ACS se o nome do ACS mudou
                acs_novo = dados['condominios'][i].get('acs_responsavel')
                acs_antigo = cond.get('acs_responsavel')
                
                if acs_novo != acs_antigo or 'acs' in dados:
                    if 'acs' in dados:
                        # Remover do ACS antigo (se existir)
                        if acs_antigo:
                            for acs in dados['acs']:
                                if acs['nome'] == acs_antigo and acs['equipe'] == equipe_atual:
                                    if 'condominios' in acs and condominio_id in acs['condominios']:
                                        acs['condominios'].remove(condominio_id)
                        
                        # Adicionar ao novo ACS (se existir)
                        if acs_novo:
                            # Verificar se ACS já existe
                            acs_existente = None
                            for acs in dados['acs']:
                                if acs['nome'] == acs_novo and acs['equipe'] == equipe_atual:
                                    acs_existente = acs
                                    break
                            
                            if acs_existente:
                                # Atualizar ACS existente
                                if 'condominios' not in acs_existente:
                                    acs_existente['condominios'] = []
                                if condominio_id not in acs_existente['condominios']:
                                    acs_existente['condominios'].append(condominio_id)
                                acs_existente['blocos_ativos'] = blocos_ativos
                            else:
                                # Criar novo ACS
                                novo_acs = {
                                    'id': len(dados['acs']) + 1,
                                    'nome': acs_novo,
                                    'equipe': equipe_atual,
                                    'condominios': [condominio_id],
                                    'blocos_ativos': blocos_ativos,
                                    'total_moradores': dados['condominios'][i].get('moradores', 0),
                                    'total_hipertensos': dados['condominios'][i].get('hipertensos', 0)
                                }
                                dados['acs'].append(novo_acs)
                
                salvar_dados(dados)
                
                return jsonify({
                    'status': 'sucesso',
                    'mensagem': 'Condomínio atualizado com sucesso',
                    'blocos_cobertos': blocos_cobertos,
                    'blocos_descobertos': blocos_descobertos,
                    'cobertura': cobertura,
                    'status_cobertura': status_cobertura
                })
        
        return jsonify({
            'status': 'erro',
            'mensagem': 'Condomínio não encontrado'
        }), 404
        
    except Exception as e:
        print(f"DEBUG ERRO ATUALIZAÇÃO: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'status': 'erro',
            'mensagem': f'Erro interno: {str(e)}'
        }), 500

@app.route('/api/excluir-condominio/<int:condominio_id>', methods=['DELETE'])
@login_required
@convidado_bloqueado
def excluir_condominio(condominio_id):
    """Excluir um condomínio (BLOQUEADO PARA CONVIDADOS)"""
    try:
        dados = carregar_dados()
        equipe_atual = session['equipe']
        
        for i, cond in enumerate(dados['condominios']):
            if cond['id'] == condominio_id:
                # Verificar se pertence à equipe atual
                if cond.get('equipe') != equipe_atual:
                    return jsonify({
                        'status': 'erro',
                        'mensagem': 'Você não tem permissão para excluir este condomínio'
                    }), 403
                
                # Remover da lista
                dados['condominios'].pop(i)
                salvar_dados(dados)
                
                # Remover também da lista de ACS se existir
                if 'acs' in dados:
                    for acs in dados['acs']:
                        if 'condominios' in acs and condominio_id in acs['condominios']:
                            acs['condominios'].remove(condominio_id)
                
                salvar_dados(dados)
                return jsonify({
                    'status': 'sucesso',
                    'mensagem': 'Condomínio excluído com sucesso'
                })
        
        return jsonify({
            'status': 'erro',
            'mensagem': 'Condomínio não encontrado'
        }), 404
        
    except Exception as e:
        return jsonify({
            'status': 'erro',
            'mensagem': f'Erro interno: {str(e)}'
        }), 500

# ============================================
# INICIALIZAÇÃO
# ============================================

if __name__ == '__main__':
    # Criar estrutura inicial
    if not os.path.exists('data'):
        os.makedirs('data')
    
    if not os.path.exists('data/dados.json'):
        dados_iniciais = {
            "condominios": [
                {
                    "id": 1,
                    "nome": "Condomínio Parque Verde",
                    "equipe": "equipe1",
                    "torres": 3,
                    "apartamentos": 120,
                    "moradores": 420,
                    "hipertensos": 45,
                    "diabeticos": 28,
                    "gestantes": 12,
                    "cobertura": 85,
                    "prioridade": "alta",
                    "ultima_visita": "2024-01-15"
                },
                {
                    "id": 2,
                    "nome": "Residencial São José",
                    "equipe": "equipe1",
                    "torres": 2,
                    "apartamentos": 80,
                    "moradores": 280,
                    "hipertensos": 32,
                    "diabeticos": 18,
                    "gestantes": 8,
                    "cobertura": 90,
                    "prioridade": "media",
                    "ultima_visita": "2024-01-10"
                }
            ]
        }
        salvar_dados(dados_iniciais)
        print("✅ Dados iniciais criados em data/dados.json")
    
    print("=" * 50)
    print("🚀 TERRITORIALIZAÇÃO USF - SISTEMA INICIADO")
    print("=" * 50)
    print("🌐 Acesse: http://localhost:5000")
    print("👥 Equipes: Equipe 1, Equipe 2, Equipe 3")
    print("🔐 Credenciais:")
    print("   - admin/admin123 (Administrador)")
    print("   - acs1/acs123 (ACS Equipe 1)")
    print("   - convidado/convidado (Apenas visualização)")
    print("🐛 Debug: http://localhost:5000/debug-session")
    print("=" * 50)
    
    app.run(debug=True, port=5000)
