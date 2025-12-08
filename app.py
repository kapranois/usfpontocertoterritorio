from flask import Flask, render_template, jsonify, request, session, redirect, url_for
import json
import os
from datetime import datetime

app = Flask(__name__)
app.secret_key = 'acs_2025'

# Configuração das equipes
EQUIPES = {
    'equipe1': 'Equipe 1',
    'equipe2': 'Equipe 2',
    'equipe3': 'Equipe 3'
}

# ============================================
# FUNÇÕES AUXILIARES (DEVEM VIR PRIMEIRO)
# ============================================

def carregar_dados():
    """Carrega os dados do arquivo JSON"""
    if os.path.exists('data/dados.json'):
        with open('data/dados.json', 'r', encoding='utf-8') as f:
            dados = json.load(f)
            
            # Garantir compatibilidade com versões antigas
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
    
    cobertura_geral = sum(c.get('cobertura', 0) for c in condominios) / len(condominios)
    
    return {
        'total_moradores': total_moradores,
        'total_hipertensos': total_hipertensos,
        'total_diabeticos': total_diabeticos,
        'total_gestantes': total_gestantes,
        'cobertura_geral': round(cobertura_geral, 1)
    }

def equipe_required(f):
    """Decorator para exigir que uma equipe tenha sido escolhida"""
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'equipe' not in session:
            return jsonify({'error': 'Equipe não selecionada'}), 401
        return f(*args, **kwargs)
    return decorated_function

# ============================================
# DADOS INICIAIS (DEPOIS DAS FUNÇÕES)
# ============================================

# Criar dados iniciais apenas se não existirem
if not os.path.exists('data/dados.json'):
    dados_iniciais = {
        "condominios": [
            {
                "id": 1,
                "nome": "Condomínio Lucaia",
                "equipe": "equipe1",
                "torres": 23,
                "blocos_cobertos": 13,
                "blocos_descobertos": 10,
                "acs_responsavel": "Maria Silva",
                "apartamentos": 460,
                "moradores": 1610,
                "hipertensos": 85,
                "diabeticos": 42,
                "gestantes": 18,
                "cobertura": 57,
                "status_cobertura": "parcial",
                "prioridade": "alta",
                "ultima_visita": "2024-01-15"
            }
        ],
        "acs": [
            {
                "id": 1,
                "nome": "Maria Silva",
                "equipe": "equipe1",
                "condominios": [1],
                "blocos_ativos": "1-13",
                "total_moradores": 1610,
                "total_hipertensos": 85
            }
        ]
    }
    salvar_dados(dados_iniciais)
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
    
    cobertura_geral = sum(c.get('cobertura', 0) for c in condominios) / len(condominios)
    
    return {
        'total_moradores': total_moradores,
        'total_hipertensos': total_hipertensos,
        'total_diabeticos': total_diabeticos,
        'total_gestantes': total_gestantes,
        'cobertura_geral': round(cobertura_geral, 1)
    }

def equipe_required(f):
    """Decorator para exigir que uma equipe tenha sido escolhida"""
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'equipe' not in session:
            return jsonify({'error': 'Equipe não selecionada'}), 401
        return f(*args, **kwargs)
    return decorated_function

# ============================================
# ROTAS PRINCIPAIS
# ============================================

@app.route('/')
def inicio():
    """Página inicial - escolher equipe"""
    if 'equipe' in session:
        return redirect(url_for('dashboard'))
    return render_template('escolha_equipe.html', equipes=EQUIPES)

@app.route('/selecionar-equipe', methods=['POST'])
def selecionar_equipe():
    """Processa a escolha da equipe"""
    equipe = request.form.get('equipe')
    if equipe in EQUIPES:
        session['equipe'] = equipe
        session['nome_equipe'] = EQUIPES[equipe]
        return redirect(url_for('dashboard'))
    return redirect(url_for('inicio'))

@app.route('/dashboard')
def dashboard():
    """Dashboard principal da equipe"""
    if 'equipe' not in session:
        return redirect(url_for('inicio'))
    
    dados = carregar_dados()
    condominios_equipe = filtrar_por_equipe(dados, session['equipe'])
    metricas = calcular_metricas(condominios_equipe)
    
    return render_template(
        'index.html',
        condominios=condominios_equipe,
        metricas=metricas,
        nome_equipe=session['nome_equipe']
    )

@app.route('/mapa')
def mapa():
    """Página do mapa"""
    if 'equipe' not in session:
        return redirect(url_for('inicio'))
    
    dados = carregar_dados()
    condominios_equipe = filtrar_por_equipe(dados, session['equipe'])
    
    return render_template(
        'mapa.html',
        condominios=condominios_equipe,
        nome_equipe=session['nome_equipe']
    )

@app.route('/condominios')
def condominios():
    """Página de condomínios"""
    if 'equipe' not in session:
        return redirect(url_for('inicio'))
    
    dados = carregar_dados()
    condominios_equipe = filtrar_por_equipe(dados, session['equipe'])
    
    return render_template(
        'condominios.html',
        condominios=condominios_equipe,
        nome_equipe=session['nome_equipe']
    )

@app.route('/relatorios')
def relatorios():
    """Página de relatórios"""
    if 'equipe' not in session:
        return redirect(url_for('inicio'))
    
    dados = carregar_dados()
    condominios_equipe = filtrar_por_equipe(dados, session['equipe'])
    metricas = calcular_metricas(condominios_equipe)
    
    return render_template(
        'relatorios.html',
        condominios=condominios_equipe,
        metricas=metricas,
        nome_equipe=session['nome_equipe']
    )



@app.route('/sair')
def sair():
    """Sair/trocar equipe"""
    session.clear()
    return redirect(url_for('inicio'))

@app.route('/api/novo-condominio', methods=['POST'])
def novo_condominio():
    """API para adicionar novo condomínio com dados de cobertura"""
    try:
        if 'equipe' not in session:
            return jsonify({'status': 'erro', 'mensagem': 'Equipe não selecionada'}), 401
        
        dados = carregar_dados()
        novo = request.json
        
        # Validações
        if not novo.get('nome') or not novo.get('nome').strip():
            return jsonify({'status': 'erro', 'mensagem': 'Nome do condomínio é obrigatório'}), 400
        
        if novo.get('torres', 0) <= 0:
            return jsonify({'status': 'erro', 'mensagem': 'Número de blocos inválido'}), 400
        
        # Garantir campos de cobertura
        if 'blocos_cobertos' not in novo:
            novo['blocos_cobertos'] = 0
        
        if 'blocos_descobertos' not in novo:
            novo['blocos_descobertos'] = novo['torres']
        
        if 'status_cobertura' not in novo:
            novo['status_cobertura'] = 'descoberto'
        
        # Pertence à equipe atual
        novo['equipe'] = session['equipe']
        
        # Gerar ID
        if dados['condominios']:
            novo['id'] = max(c['id'] for c in dados['condominios']) + 1
        else:
            novo['id'] = 1
        
        # Se tem ACS, registrar também na lista de ACS
        if novo.get('acs_responsavel'):
            # Verificar se ACS já existe
            acs_existente = None
            for acs in dados.get('acs', []):
                if acs['nome'] == novo['acs_responsavel'] and acs['equipe'] == session['equipe']:
                    acs_existente = acs
                    break
            
            if acs_existente:
                # Atualizar ACS existente
                if 'condominios' not in acs_existente:
                    acs_existente['condominios'] = []
                if novo['id'] not in acs_existente['condominios']:
                    acs_existente['condominios'].append(novo['id'])
            else:
                # Criar novo ACS
                if 'acs' not in dados:
                    dados['acs'] = []
                
                novo_acs = {
                    'id': len(dados['acs']) + 1,
                    'nome': novo['acs_responsavel'],
                    'equipe': session['equipe'],
                    'condominios': [novo['id']],
                    'blocos_ativos': novo.get('blocos_ativos', ''),
                    'total_moradores': novo.get('moradores', 0),
                    'total_hipertensos': novo.get('hipertensos', 0)
                }
                dados['acs'].append(novo_acs)
        
        # Adicionar condomínio
        dados['condominios'].append(novo)
        salvar_dados(dados)
        
        return jsonify({
            'status': 'sucesso',
            'mensagem': 'Condomínio cadastrado com informações de cobertura!',
            'id': novo['id'],
            'status_cobertura': novo['status_cobertura']
        })
        
    except Exception as e:
        return jsonify({'status': 'erro', 'mensagem': f'Erro interno: {str(e)}'}), 500# ============================================

# Adicione esta rota para gerenciar múltiplos ACS
@app.route('/api/condominio/<int:condominio_id>/acs', methods=['POST', 'DELETE'])
@equipe_required
def gerenciar_acs_condominio(condominio_id):
    """Adicionar ou remover ACS de um condomínio"""
    try:
        dados = carregar_dados()
        equipe_atual = session['equipe']
        
        # Encontrar o condomínio
        for i, cond in enumerate(dados['condominios']):
            if cond['id'] == condominio_id and cond.get('equipe') == equipe_atual:
                
                if request.method == 'POST':
                    # Adicionar novo ACS
                    novo_acs = request.json
                    
                    # Garantir que existe a lista de múltiplos ACS
                    if 'acs_multiplos' not in cond:
                        cond['acs_multiplos'] = []
                    
                    # Adicionar à lista
                    cond['acs_multiplos'].append({
                        'nome': novo_acs['nome'],
                        'blocos': novo_acs['blocos'],
                        'data_inicio': novo_acs.get('data_inicio', datetime.now().strftime('%Y-%m-%d'))
                    })
                    
                    # Recalcular cobertura total
                    blocos_cobertos = 0
                    total_blocos = cond['torres']
                    
                    # Calcular todos os blocos cobertos por todos os ACS
                    blocos_cobertos_set = set()
                    for acs in cond['acs_multiplos']:
                        blocos_str = acs['blocos']
                        if blocos_str:
                            # Processar formato "1-5, 8-10"
                            partes = blocos_str.split(',')
                            for parte in partes:
                                parte = parte.strip()
                                if '-' in parte:
                                    inicio, fim = map(int, parte.split('-'))
                                    for bloco in range(inicio, fim + 1):
                                        blocos_cobertos_set.add(bloco)
                                elif parte.isdigit():
                                    blocos_cobertos_set.add(int(parte))
                    
                    blocos_cobertos = len(blocos_cobertos_set)
                    
                    # Atualizar campos do condomínio
                    dados['condominios'][i]['blocos_cobertos'] = blocos_cobertos
                    dados['condominios'][i]['blocos_descobertos'] = total_blocos - blocos_cobertos
                    
                    if total_blocos > 0:
                        cobertura = round((blocos_cobertos / total_blocos) * 100)
                        dados['condominios'][i]['cobertura'] = cobertura
                        
                        # Atualizar status
                        if blocos_cobertos == 0:
                            dados['condominios'][i]['status_cobertura'] = 'descoberto'
                        elif blocos_cobertos == total_blocos:
                            dados['condominios'][i]['status_cobertura'] = 'completo'
                        else:
                            dados['condominios'][i]['status_cobertura'] = 'parcial'
                    
                    # Manter compatibilidade com campo antigo
                    if cond['acs_multiplos']:
                        dados['condominios'][i]['acs_responsavel'] = cond['acs_multiplos'][0]['nome']
                        dados['condominios'][i]['blocos_ativos'] = cond['acs_multiplos'][0]['blocos']
                    
                    salvar_dados(dados)
                    
                    # Atualizar também na lista geral de ACS
                    if 'acs' not in dados:
                        dados['acs'] = []
                    
                    # Verificar se ACS já existe
                    acs_existente = None
                    for acs in dados['acs']:
                        if acs['nome'] == novo_acs['nome'] and acs['equipe'] == equipe_atual:
                            acs_existente = acs
                            break
                    
                    if acs_existente:
                        # Adicionar condomínio à lista do ACS
                        if 'condominios' not in acs_existente:
                            acs_existente['condominios'] = []
                        if condominio_id not in acs_existente['condominios']:
                            acs_existente['condominios'].append(condominio_id)
                    else:
                        # Criar novo registro de ACS
                        novo_acs_registro = {
                            'id': len(dados['acs']) + 1,
                            'nome': novo_acs['nome'],
                            'equipe': equipe_atual,
                            'condominios': [condominio_id],
                            'blocos_ativos': novo_acs['blocos'],
                            'data_cadastro': datetime.now().strftime('%Y-%m-%d')
                        }
                        dados['acs'].append(novo_acs_registro)
                    
                    salvar_dados(dados)
                    
                    return jsonify({
                        'status': 'sucesso',
                        'mensagem': 'ACS adicionado com sucesso',
                        'total_acs': len(cond['acs_multiplos'])
                    })
                
                elif request.method == 'DELETE':
                    # Remover ACS
                    nome_acs_remover = request.json.get('nome')
                    
                    if 'acs_multiplos' in cond and nome_acs_remover:
                        # Remover da lista
                        cond['acs_multiplos'] = [acs for acs in cond['acs_multiplos'] 
                                                if acs['nome'] != nome_acs_remover]
                        
                        # Recalcular
                        if cond['acs_multiplos']:
                            dados['condominios'][i]['acs_responsavel'] = cond['acs_multiplos'][0]['nome']
                            dados['condominios'][i]['blocos_ativos'] = cond['acs_multiplos'][0]['blocos']
                        else:
                            dados['condominios'][i]['acs_responsavel'] = None
                            dados['condominios'][i]['blocos_ativos'] = None
                            dados['condominios'][i]['blocos_cobertos'] = 0
                            dados['condominios'][i]['cobertura'] = 0
                            dados['condominios'][i]['status_cobertura'] = 'descoberto'
                        
                        salvar_dados(dados)
                        return jsonify({
                            'status': 'sucesso',
                            'mensagem': 'ACS removido com sucesso'
                        })
                    else:
                        return jsonify({
                            'status': 'erro',
                            'mensagem': 'ACS não encontrado'
                        }), 404
        
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
# API PARA CONDOMÍNIOS (EDITAR/EXCLUIR)
# ============================================

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
@equipe_required
def atualizar_condominio(condominio_id):
    """Atualizar um condomínio existente"""
    try:
        dados = carregar_dados()
        atualizacoes = request.json
        equipe_atual = session['equipe']
        
        for i, cond in enumerate(dados['condominios']):
            if cond['id'] == condominio_id:
                # Verificar se pertence à equipe atual
                if cond.get('equipe') != equipe_atual:
                    return jsonify({
                        'status': 'erro',
                        'mensagem': 'Você não tem permissão para modificar este condomínio'
                    }), 403
                
                # Atualizar campos permitidos
                campos_permitidos = ['nome', 'torres', 'apartamentos', 'moradores',
                                   'hipertensos', 'diabeticos', 'gestantes', 'prioridade',
                                   'cobertura', 'ultima_visita']
                
                for campo in campos_permitidos:
                    if campo in atualizacoes:
                        dados['condominios'][i][campo] = atualizacoes[campo]
                
                # Recalcular cobertura se necessário
                if 'torres' in atualizacoes or 'blocos_cobertos' in atualizacoes:
                    torres = dados['condominios'][i]['torres']
                    blocos_cobertos = dados['condominios'][i].get('blocos_cobertos', 0)
                    
                    if torres > 0:
                        cobertura = round((blocos_cobertos / torres) * 100)
                        dados['condominios'][i]['cobertura'] = cobertura
                        
                        # Atualizar status
                        if blocos_cobertos == 0:
                            dados['condominios'][i]['status_cobertura'] = 'descoberto'
                        elif blocos_cobertos == torres:
                            dados['condominios'][i]['status_cobertura'] = 'completo'
                        else:
                            dados['condominios'][i]['status_cobertura'] = 'parcial'
                
                salvar_dados(dados)
                return jsonify({
                    'status': 'sucesso',
                    'mensagem': 'Condomínio atualizado com sucesso'
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

@app.route('/api/excluir-condominio/<int:condominio_id>', methods=['DELETE'])
@equipe_required
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
            'mensagem': f'Erro interno: {str(e)}'
        }), 500

# API (opcional)
# ============================================

@app.route('/api/dados')
def api_dados():
    """API para obter dados da equipe"""
    if 'equipe' not in session:
        return jsonify({'error': 'Equipe não selecionada'}), 401
    
    dados = carregar_dados()
    condominios_equipe = filtrar_por_equipe(dados, session['equipe'])
    metricas = calcular_metricas(condominios_equipe)
    
    return jsonify({
        'condominios': condominios_equipe,
        'metricas': metricas,
        'equipe': session['equipe']
    })

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
                },
                {
                    "id": 3,
                    "nome": "Edifício Central Park",
                    "equipe": "equipe2",
                    "torres": 4,
                    "apartamentos": 160,
                    "moradores": 560,
                    "hipertensos": 60,
                    "diabeticos": 35,
                    "gestantes": 15,
                    "cobertura": 75,
                    "prioridade": "alta",
                    "ultima_visita": "2024-01-12"
                },
                {
                    "id": 4,
                    "nome": "Condomínio Solar das Flores",
                    "equipe": "equipe2",
                    "torres": 2,
                    "apartamentos": 60,
                    "moradores": 210,
                    "hipertensos": 25,
                    "diabeticos": 12,
                    "gestantes": 6,
                    "cobertura": 95,
                    "prioridade": "baixa",
                    "ultima_visita": "2024-01-14"
                },
                {
                    "id": 5,
                    "nome": "Residencial Alto da Serra",
                    "equipe": "equipe3",
                    "torres": 3,
                    "apartamentos": 90,
                    "moradores": 315,
                    "hipertensos": 28,
                    "diabeticos": 15,
                    "gestantes": 7,
                    "cobertura": 80,
                    "prioridade": "media",
                    "ultima_visita": "2024-01-13"
                },
                {
                    "id": 6,
                    "nome": "Condomínio Vista Alegre",
                    "equipe": "equipe3",
                    "torres": 2,
                    "apartamentos": 70,
                    "moradores": 245,
                    "hipertensos": 20,
                    "diabeticos": 10,
                    "gestantes": 4,
                    "cobertura": 88,
                    "prioridade": "baixa",
                    "ultima_visita": "2024-01-11"
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
    print("=" * 50)
    

    app.run(debug=True, port=5000)
