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

# Microáreas disponíveis (pode ser ajustado por equipe)
MICROAREAS = {
    'equipe1': ['Microárea 01', 'Microárea 02', 'Microárea 03', 'Microárea 04'],
    'equipe2': ['Microárea 05', 'Microárea 06', 'Microárea 07', 'Microárea 08'],
    'equipe3': ['Microárea 09', 'Microárea 10', 'Microárea 11', 'Microárea 12']
}

def criar_senha_hash(senha):
    """Cria hash da senha usando SHA-256"""
    return hashlib.sha256(senha.encode()).hexdigest()

# Dicionário de usuários
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
    'convidado': {
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
                
                # Garantir que microarea existe (para dados antigos)
                if 'microarea' not in cond:
                    cond['microarea'] = cond.get('prioridade', 'Microárea A')  # Converter prioridade antiga
                    if 'prioridade' in cond:
                        del cond['prioridade']
            
            return dados
    
    # Criar estrutura inicial se não existir
    return {"condominios": [], "acs": []}

def carregar_equipes():
    """Carrega os dados das equipes profissionais"""
    try:
        if os.path.exists('data/equipes.json'):
            with open('data/equipes.json', 'r', encoding='utf-8') as f:
                dados = json.load(f)
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
    rotas_publicas = ['login', 'static', 'logout', 'inicio']
    
    if request.endpoint and request.endpoint not in rotas_publicas:
        if 'usuario' in session:
            session.permanent = True

def calcular_cobertura(blocos_ativos_texto, total_torres):
    """
    Calcula cobertura a partir do texto de blocos ativos
    """
    if not blocos_ativos_texto or not total_torres or total_torres <= 0:
        return 0, 0, 0, 'descoberto'
    
    blocos_cobertos = 0
    numeros_cobertos = set()
    
    try:
        partes = [p.strip() for p in blocos_ativos_texto.replace(';', ',').split(',') if p.strip()]
        
        for parte in partes:
            if '-' in parte:
                faixa = [n.strip() for n in parte.split('-') if n.strip()]
                if len(faixa) == 2:
                    inicio = int(faixa[0])
                    fim = int(faixa[1])
                    
                    if inicio <= fim:
                        for i in range(inicio, fim + 1):
                            if 1 <= i <= total_torres:
                                numeros_cobertos.add(i)
            else:
                try:
                    num = int(parte)
                    if 1 <= num <= total_torres:
                        numeros_cobertos.add(num)
                except ValueError:
                    continue
        
        blocos_cobertos = len(numeros_cobertos)
        
    except Exception as e:
        print(f"Erro ao calcular cobertura: {e}")
        blocos_cobertos = 0
    
    blocos_cobertos = min(blocos_cobertos, total_torres)
    blocos_descobertos = total_torres - blocos_cobertos
    cobertura = round((blocos_cobertos / total_torres) * 100) if total_torres > 0 else 0
    
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
        
        if usuario == 'convidado' and senha == 'convidado':
            session['usuario'] = 'convidado'
            session['nome_usuario'] = 'Visitante'
            session['nivel_usuario'] = 'convidado'
            session['equipes_usuario'] = ['equipe1', 'equipe2', 'equipe3']
            session.permanent = True
            return redirect(url_for('inicio'))
        
        if usuario in USUARIOS:
            senha_hash = criar_senha_hash(senha)
            if USUARIOS[usuario]['senha_hash'] == senha_hash:
                session['usuario'] = usuario
                session['nome_usuario'] = USUARIOS[usuario]['nome']
                session['nivel_usuario'] = USUARIOS[usuario]['nivel']
                session['equipes_usuario'] = USUARIOS[usuario]['equipes']
                session.permanent = True
                
                if 'equipe' in session and session['equipe'] in USUARIOS[usuario]['equipes']:
                    return redirect(url_for('dashboard'))
                else:
                    return redirect(url_for('inicio'))
        
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
    session.pop('equipe', None)
    session.pop('nome_equipe', None)
    return redirect(url_for('inicio'))

@app.route('/')
def inicio():
    """Página inicial - verifica se precisa login"""
    if 'usuario' not in session:
        return redirect(url_for('login'))
    
    if 'equipe' not in session:
        login_info = verificar_login()
        return render_template('escolha_equipe.html', 
                             equipes=EQUIPES,
                             usuario_logado=login_info['logado'],
                             nome_usuario=login_info['nome'],
                             nivel_usuario=login_info['nivel'])
    
    return redirect(url_for('dashboard'))

@app.route('/selecionar-equipe', methods=['POST'])
def selecionar_equipe():
    """Processa a escolha da equipe"""
    if 'usuario' not in session:
        return redirect(url_for('login'))
    
    equipe = request.form.get('equipe')
    if equipe in EQUIPES:
        if equipe in session.get('equipes_usuario', []):
            session['equipe'] = equipe
            session['nome_equipe'] = EQUIPES[equipe]
            return redirect(url_for('dashboard'))
        else:
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
    if 'equipe' not in session:
        return redirect(url_for('inicio'))
    
    dados = carregar_dados()
    equipes_data = carregar_equipes()
    
    equipe_id = session['equipe']
    equipe_atual = None
    profissionais = {}
    
    if 'equipes' in equipes_data:
        for equipe in equipes_data['equipes']:
            if equipe.get('id') == equipe_id:
                equipe_atual = equipe
                break
    
    if equipe_atual and 'profissionais' in equipe_atual:
        profissionais = equipe_atual['profissionais']
    else:
        profissionais = {
            'acs': [],
            'enfermeiro': None,
            'medico': None
        }
    
    condominios_equipe = filtrar_por_equipe(dados, session['equipe'])
    metricas = calcular_metricas(condominios_equipe)
    
    usuario_logado = 'usuario' in session
    nome_usuario = session.get('nome_usuario', 'Usuário')
    nivel_usuario = session.get('nivel_usuario', 'acs')
    
    # Obter microáreas para esta equipe
    microareas = MICROAREAS.get(session['equipe'], [])
    
    return render_template(
        'index.html',
        condominios=condominios_equipe,
        metricas=metricas,
        nome_equipe=session['nome_equipe'],
        usuario_logado=usuario_logado,
        nome_usuario=nome_usuario,
        nivel_usuario=nivel_usuario,
        equipe_profissionais=profissionais,
        microareas=microareas
    )

@app.route('/condominios')
def condominios():
    """Página de condomínios"""
    if 'equipe' not in session:
        return redirect(url_for('inicio'))
    
    dados = carregar_dados()
    condominios_equipe = filtrar_por_equipe(dados, session['equipe'])
    
    login_info = verificar_login()
    
    # Obter microáreas para esta equipe
    microareas = MICROAREAS.get(session['equipe'], [])
    
    return render_template(
        'condominios.html',
        condominios=condominios_equipe,
        nome_equipe=session['nome_equipe'],
        usuario_logado=login_info['logado'],
        nome_usuario=login_info['nome'],
        nivel_usuario=login_info['nivel'],
        microareas=microareas
    )
@app.context_processor
def inject_request():
    return dict(request=request)

@app.route('/mapa')
def mapa():
    """Página do mapa"""
    if 'equipe' not in session:
        return redirect(url_for('inicio'))
    
    dados = carregar_dados()
    condominios_equipe = filtrar_por_equipe(dados, session['equipe'])
    
    login_info = verificar_login()
    
    # Obter microáreas para esta equipe
    microareas = MICROAREAS.get(session['equipe'], [])
    
    return render_template(
        'mapa.html',
        condominios=condominios_equipe,
        nome_equipe=session['nome_equipe'],
        usuario_logado=login_info['logado'],
        nome_usuario=login_info['nome'],
        nivel_usuario=login_info['nivel'],
        microareas=microareas
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
    
    # Obter microáreas para esta equipe
    microareas = MICROAREAS.get(session['equipe'], [])
    
    return render_template(
        'relatorios.html',
        condominios=condominios_equipe,
        metricas=metricas,
        nome_equipe=session['nome_equipe'],
        usuario_logado=login_info['logado'],
        nome_usuario=login_info['nome'],
        nivel_usuario=login_info['nivel'],
        microareas=microareas
    )

# ============================================
# API PARA CONDOMÍNIOS
# ============================================

@app.route('/api/novo-condominio', methods=['POST'])
@login_required
@convidado_bloqueado
def novo_condominio():
    """API para adicionar novo condomínio"""
    try:
        if 'equipe' not in session:
            return jsonify({'status': 'erro', 'mensagem': 'Equipe não selecionada'}), 401
        
        dados = carregar_dados()
        novo = request.json
        
        if not novo.get('nome') or not novo.get('nome').strip():
            return jsonify({'status': 'erro', 'mensagem': 'Nome do condomínio é obrigatório'}), 400
        
        torres = novo.get('torres', 0)
        if torres <= 0:
            return jsonify({'status': 'erro', 'mensagem': 'Número de blocos inválido'}), 400
        
        blocos_ativos = novo.get('blocos_ativos', '')
        blocos_cobertos, blocos_descobertos, cobertura, status_cobertura = calcular_cobertura(blocos_ativos, torres)
        
        # Garantir campos de cobertura
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
        novo['microarea'] = novo.get('microarea', MICROAREAS.get(session['equipe'], ['Microárea A'])[0])
        
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
            
            acs_existente = None
            for acs in dados.get('acs', []):
                if acs['nome'] == acs_responsavel and acs['equipe'] == session['equipe']:
                    acs_existente = acs
                    break
            
            if acs_existente:
                if 'condominios' not in acs_existente:
                    acs_existente['condominios'] = []
                if novo['id'] not in acs_existente['condominios']:
                    acs_existente['condominios'].append(novo['id'])
                acs_existente['blocos_ativos'] = blocos_ativos
            else:
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
        
        return jsonify({
            'status': 'sucesso',
            'mensagem': 'Condomínio cadastrado com sucesso!',
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

@app.route('/api/atualizar-condominio/<int:condominio_id>', methods=['PUT'])
@login_required
@convidado_bloqueado
def atualizar_condominio(condominio_id):
    """Atualizar um condomínio existente"""
    try:
        dados = carregar_dados()
        atualizacoes = request.json
        equipe_atual = session['equipe']
        
        for i, cond in enumerate(dados['condominios']):
            if cond['id'] == condominio_id:
                if cond.get('equipe') != equipe_atual:
                    return jsonify({
                        'status': 'erro',
                        'mensagem': 'Você não tem permissão para modificar este condomínio'
                    }), 403
                
                # Atualizar campos básicos
                campos_basicos = ['nome', 'torres', 'apartamentos', 'moradores',
                                 'hipertensos', 'diabeticos', 'gestantes', 'microarea',
                                 'ultima_visita', 'acs_responsavel', 'blocos_ativos']
                
                for campo in campos_basicos:
                    if campo in atualizacoes:
                        dados['condominios'][i][campo] = atualizacoes[campo]
                
                # SEMPRE RECALCULAR COBERTURA
                torres = dados['condominios'][i]['torres']
                blocos_ativos = dados['condominios'][i].get('blocos_ativos', '')
                
                blocos_cobertos, blocos_descobertos, cobertura, status_cobertura = calcular_cobertura(
                    blocos_ativos, 
                    torres
                )
                
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
                            acs_existente = None
                            for acs in dados['acs']:
                                if acs['nome'] == acs_novo and acs['equipe'] == equipe_atual:
                                    acs_existente = acs
                                    break
                            
                            if acs_existente:
                                if 'condominios' not in acs_existente:
                                    acs_existente['condominios'] = []
                                if condominio_id not in acs_existente['condominios']:
                                    acs_existente['condominios'].append(condominio_id)
                                acs_existente['blocos_ativos'] = blocos_ativos
                            else:
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
# ============================================
# ROTAS PARA EDIÇÃO E EXCLUSÃO
# ============================================

@app.route('/api/condominio/<int:condominio_id>')
@equipe_required
def get_condominio(condominio_id):
    """Obter dados de um condomínio específico para edição"""
    dados = carregar_dados()
    
    for cond in dados['condominios']:
        if cond['id'] == condominio_id and cond.get('equipe') == session['equipe']:
            return jsonify(cond)
    
    return jsonify({'error': 'Condomínio não encontrado'}), 404

@app.route('/api/excluir-condominio/<int:condominio_id>', methods=['DELETE'])
@login_required
@convidado_bloqueado
def excluir_condominio(condominio_id):
    """Excluir um condomínio"""
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
            'mensagem': f'Erro interno de cu: {str(e)}'
        }), 500

# ============================================
# API PARA LISTAR MICROÁREAS
# ============================================

@app.route('/api/microareas')
@equipe_required
def get_microareas():
    """Retorna as microáreas disponíveis para a equipe atual"""
    equipe = session['equipe']
    return jsonify({
        'microareas': MICROAREAS.get(equipe, [])
    })
# ============================================
# INICIALIZAÇÃO
# ============================================

if __name__ == '__main__':
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
                    "microarea": "Microárea 01",
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
                    "microarea": "Microárea 02",
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
    print("📍 Microáreas por equipe:")
    for equipe, areas in MICROAREAS.items():
        print(f"   - {equipe}: {', '.join(areas)}")
    print("🔐 Credenciais:")
    print("   - admin/admin123 (Administrador)")
    print("   - acs1/acs123 (ACS Equipe 1)")
    print("   - convidado/convidado (Apenas visualização)")
    print("=" * 50)
    app.run(debug=True, port=5000)
