"""
Gera a migração da carga inicial do GoSafe a partir dos CSVs desta pasta.

Uso (a partir de gosafe-backend/carga-inicial):
  python gerar_carga.py aplicar-conferencia ORIGEM_locais.csv conferencia.json   -> grava locais.csv
  python gerar_carga.py sql                                                      -> grava a migração

Regras do que entra no banco:
- cada avaliação vira aviso + comentário inicial + avaliação, como no fluxo do app;
- os ids são UUIDs fixos (uuid5), para a geração ser reproduzível;
- as contas da base são inativas e sem senha válida: ninguém consegue entrar com elas;
- o peso aplicado é 0,2, o mesmo de uma conta nova sem check-in (ReputationFormula).
"""
import csv
import json
import math
import os
import re
import sys
import unicodedata
import uuid

AQUI = os.path.dirname(os.path.abspath(__file__))
SAIDA = os.path.join(AQUI, '..', 'src', 'main', 'resources', 'db', 'seed', 'V2_1__carga_inicial_salvador.sql')
NS = uuid.UUID('6f1d3c52-8a47-5b0e-9c11-2a7e4d90b3f1')
DATA = '2026-10-31 12:00:00-03'
PESO = 0.2

CATEGORIA = {
    'Restaurante': 'RESTAURANT', 'Outro': 'OTHER', 'Praça / parque': 'PARK', 'Bar': 'BAR',
    'Academia': 'GYM', 'Café': 'CAFE', 'Comércio': 'SHOP',
}
TIPO_AVISO = {'Geral': 'GENERAL', 'Iluminação': 'LIGHTING', 'Acolhimento': 'WELCOMING', 'Movimento': 'MOVEMENT'}
ANONIMA = {'Sim': 'TRUE', 'Não': 'FALSE'}
PRECISAS = ('Coordenada da fonte',)


def ler(nome):
    with open(os.path.join(AQUI, nome), encoding='utf-8-sig', newline='') as f:
        return list(csv.DictReader(f, delimiter=';'))


def uid(*partes):
    return str(uuid.uuid5(NS, ':'.join(partes)))


def q(valor):
    return 'NULL' if valor is None or valor == '' else "'" + str(valor).replace("'", "''") + "'"


def norm(texto):
    texto = unicodedata.normalize('NFKD', texto or '').encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9 ]', ' ', texto)


def distancia(a, b, c, d):
    return math.hypot((a - c) * 111000, (b - d) * 108000)


IGNORAR = set('de da do das dos e a o the bar restaurante cafe praca parque largo rua avenida salvador'.split())


def mesmo_nome(nome, achado):
    a = {t for t in norm(nome).split() if t not in IGNORAR and len(t) > 2}
    b = {t for t in norm(achado).split() if t not in IGNORAR and len(t) > 2}
    return bool(a) and len(a & b) >= max(1, math.ceil(len(a) * 0.6))


def escolher_coordenada(r, c):
    """Devolve (lat, lon, origem, precisão). Só troca a coordenada quando a nova é plausível."""
    lat, lon = float(r['latitude']), float(r['longitude'])
    original = r['conf_coordenada']
    if original.startswith(PRECISAS):
        return lat, lon, 'MANUAL', 'Coordenada da fonte'
    n = c.get('por_nome')
    if n and n['cat'] not in ('highway', 'boundary', 'place', 'landuse') \
            and distancia(lat, lon, n['lat'], n['lon']) <= 2000 and mesmo_nome(r['nome'], n.get('name')):
        return n['lat'], n['lon'], 'NOMINATIM', 'Local encontrado pelo nome no OpenStreetMap'
    e = c.get('por_endereco')
    if e and distancia(lat, lon, e['lat'], e['lon']) <= 2000:
        if r['numero'].upper() != 'S/N' and e['type'] in ('house', 'building', 'residential_building'):
            return e['lat'], e['lon'], 'NOMINATIM', 'Endereço com número encontrado no OpenStreetMap'
        if e['cat'] == 'highway' and original.startswith('Aproximada') and distancia(lat, lon, e['lat'], e['lon']) <= 1500:
            return e['lat'], e['lon'], 'NOMINATIM', 'Rua encontrada no OpenStreetMap (sem o número exato)'
    return lat, lon, 'MANUAL', original


def escolher_cep(r, c):
    """Devolve (cep, situação). Corrige só CEP estimado, e só quando o ViaCEP aponta um único candidato."""
    achados = c.get('viacep') or []
    if r['cep'] in [x['cep'] for x in achados]:
        return r['cep'], 'Confirmado no ViaCEP'
    if not r['conf_cep'].startswith('Estimado'):
        return r['cep'], r['conf_cep']
    candidatos = {x['cep'] for x in achados
                  if norm(x['logradouro']).strip() == norm(r['logradouro']).strip()
                  and norm(x['bairro']).strip() == norm(r['bairro']).strip()}
    if len(candidatos) == 1:
        return candidatos.pop(), 'Corrigido pelo ViaCEP'
    return r['cep'], r['conf_cep']


def aplicar_conferencia(origem, conferencia):
    with open(origem, encoding='utf-8-sig', newline='') as f:
        linhas = list(csv.DictReader(f, delimiter=';'))
    with open(conferencia, encoding='utf-8') as f:
        cache = json.load(f)
    campos = list(linhas[0].keys()) + ['geocode_source']
    for r in linhas:
        c = cache.get(r['id_local'], {})
        lat, lon, fonte, precisao = escolher_coordenada(r, c)
        cep, situacao = escolher_cep(r, c)
        r.update(latitude=f'{lat:.6f}', longitude=f'{lon:.6f}', geocode_source=fonte, conf_coordenada=precisao, cep=cep, conf_cep=situacao)
    with open(os.path.join(AQUI, 'locais.csv'), 'w', encoding='utf-8-sig', newline='') as f:
        w = csv.DictWriter(f, fieldnames=campos, delimiter=';')
        w.writeheader()
        w.writerows(linhas)


def nota(a):
    v = [int(a[k]) for k in ('seguranca', 'iluminacao', 'movimento', 'acolhimento')]
    if a['banheiro'].strip():
        v.append(int(a['banheiro']))
    # igual a ReputationFormula.averageScore (Math.round arredonda 0,5 para cima)
    return math.floor(sum(v) / len(v) * 100 + 0.5) / 100


def insert(tabela, colunas, linhas, f):
    for i in range(0, len(linhas), 200):
        f.write(f'INSERT INTO {tabela} ({colunas}) VALUES\n')
        f.write(',\n'.join('    (' + l + ')' for l in linhas[i:i + 200]))
        f.write(';\n\n')


def gerar_sql():
    locais = ler('locais.csv')
    avaliacoes = ler('avaliacoes.csv')
    base = uid('conta', 'base')
    d = q(DATA)

    contas = {base: ('Base inicial GoSafe', 'base.inicial', 'base.inicial@gosafe.invalid', 0)}
    for codigo in sorted({a['avaliadora'] for a in avaliacoes}):
        n = sum(1 for a in avaliacoes if a['avaliadora'] == codigo)
        num = codigo[1:]
        contas[uid('conta', codigo)] = (f'Base inicial GoSafe {num}', f'base.inicial.{num}', f'base.inicial.{num}@gosafe.invalid', n)

    users = [
        f"{q(i)}, {q(n)}, {q(u)}, {q(e)}, '!', 'NOT_INFORMED', FALSE, 'USER', {c}, FALSE, {d}, {d}"
        for i, (n, u, e, c) in contas.items()
    ]
    places = [
        ', '.join([
            q(uid('local', r['id_local'])), q(r['nome']), q(CATEGORIA[r['categoria']]), q(r['descricao']),
            q(r['cep']), q(r['logradouro']), q(r['numero']), q(r['complemento']), q(r['bairro']),
            q(r['cidade']), q(r['uf']), r['latitude'], r['longitude'], q(r['geocode_source']), q(base), 'TRUE', d, d,
        ])
        for r in locais
    ]
    notices, comments, reviews = [], [], []
    for a in avaliacoes:
        chave = a['id_local'] + ':' + a['avaliadora']
        n, c, v = uid('aviso', chave), uid('comentario', chave), uid('avaliacao', chave)
        autora = uid('conta', a['avaliadora'])
        lugar = uid('local', a['id_local'])
        anonima = ANONIMA[a['anonima']]
        notices.append(f"{q(n)}, {q(lugar)}, {q(autora)}, {q(a['titulo_aviso'])}, {q(TIPO_AVISO[a['tipo_aviso']])}, {anonima}, 'ACTIVE', 0, {d}, {d}, {d}")
        comments.append(f"{q(c)}, {q(n)}, {q(autora)}, {q(a['comentario'])}, TRUE, {anonima}, 'ACTIVE', {d}")
        banheiro = a['banheiro'].strip() or 'NULL'
        reviews.append(f"{q(v)}, {q(autora)}, {q(lugar)}, {q(c)}, {a['seguranca']}, {a['iluminacao']}, {a['movimento']}, {a['acolhimento']}, {banheiro}, {nota(a)}, {PESO}, {d}")

    os.makedirs(os.path.dirname(SAIDA), exist_ok=True)
    with open(SAIDA, 'w', encoding='utf-8', newline='\n') as f:
        f.write('-- Carga inicial de Salvador/BA. Arquivo gerado por carga-inicial/gerar_carga.py: não edite à mão.\n')
        f.write(f'-- {len(locais)} locais e {len(avaliacoes)} avaliações ESTIMADAS (não vêm de usuárias do GoSafe). Fontes: carga-inicial/fontes.csv\n\n')
        insert('users', 'id, name, username, email, password_hash, sex, verified, role, valid_contributions, active, created_at, updated_at', users, f)
        insert('places', 'id, name, category, description, postal_code, street, street_number, complement, district, city, state_code, latitude, longitude, geocode_source, created_by, active, created_at, updated_at', places, f)
        insert('notices', 'id, place_id, author_id, title, type, anonymous, status, comment_count, last_activity_at, created_at, updated_at', notices, f)
        insert('comments', 'id, notice_id, author_id, body, is_initial, anonymous, status, created_at', comments, f)
        insert('reviews', 'id, user_id, place_id, comment_id, safety, lighting, movement, welcoming, restroom, score, applied_weight, created_at', reviews, f)
        f.write(f"""-- Mesma conta do PlaceRatingService: média ponderada, arredondada em 2 casas
UPDATE places p
SET weighted_rating = s.rating, rating_count = s.total
FROM (
    SELECT place_id,
           round((sum(score * applied_weight) / sum(applied_weight))::numeric, 2)::double precision AS rating,
           count(*)::integer AS total
    FROM reviews
    GROUP BY place_id
) s
WHERE p.id = s.place_id AND p.created_by = {q(base)};
""")
    print(f'{len(users)} contas, {len(places)} locais, {len(reviews)} avaliações -> {os.path.normpath(SAIDA)}')


if __name__ == '__main__':
    if sys.argv[1] == 'aplicar-conferencia':
        aplicar_conferencia(sys.argv[2], sys.argv[3])
    elif sys.argv[1] == 'sql':
        gerar_sql()
