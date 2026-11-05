# Cena da landing no Blender: nosso carro (carroceria.ts exportada) num
# campo de anêmonas recoloridas, céu HDRI CC0 e câmera girando em volta.
# Uso (linha de comando):
#   blender -b --disable-autoexec --python cena_campo.py -- dir=<modelos> \
#       motor=CYCLES|EEVEE larg=960 alt=540 amostras=32 quadros=0 total=48 \
#       saida=<pasta> [salvar=<arquivo.blend>]
import bpy, bmesh, json, math, os, sys, time
from mathutils import Vector

cfg = dict(a.split("=", 1) for a in sys.argv[sys.argv.index("--") + 1:])
DIR = cfg["dir"]
SAIDA = cfg.get("saida", os.path.join(DIR, "..", "renders"))
os.makedirs(SAIDA, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
cena = bpy.context.scene
cena.unit_settings.system = "METRIC"


def material(nome, cor, metal=0.0, rug=0.5, coat=0.0, coat_rug=0.03, emissao=None, forca=0.0):
    m = bpy.data.materials.new(nome)
    m.use_nodes = True
    p = m.node_tree.nodes["Principled BSDF"]
    p.inputs["Base Color"].default_value = (*cor, 1)
    p.inputs["Metallic"].default_value = metal
    p.inputs["Roughness"].default_value = rug
    p.inputs["Coat Weight"].default_value = coat
    p.inputs["Coat Roughness"].default_value = coat_rug
    if emissao:
        p.inputs["Emission Color"].default_value = (*emissao, 1)
        p.inputs["Emission Strength"].default_value = forca
    return m


def srgb(h):
    """'#aabbcc' -> RGB linear (o Blender trabalha em linear)."""
    def lin(c):
        c /= 255
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return tuple(lin(int(h[i:i + 2], 16)) for i in (1, 3, 5))


def colecao(nome, oculta=False):
    c = bpy.data.collections.new(nome)
    cena.collection.children.link(c)
    if oculta:
        c.hide_render = True
        c.hide_viewport = True
    return c


# ------------------------------------------------------------------ céu
mundo = bpy.data.worlds.new("Ceu")
cena.world = mundo
mundo.use_nodes = True
nt = mundo.node_tree
fundo = nt.nodes["Background"]
amb = nt.nodes.new("ShaderNodeTexEnvironment")
amb.image = bpy.data.images.load(os.path.join(DIR, "ceu", "ceu_4k.hdr"))
coord = nt.nodes.new("ShaderNodeTexCoord")
mapa = nt.nodes.new("ShaderNodeMapping")
mapa.inputs["Rotation"].default_value[2] = math.radians(float(cfg.get("sol", "200")))
nt.links.new(coord.outputs["Generated"], mapa.inputs["Vector"])
nt.links.new(mapa.outputs["Vector"], amb.inputs["Vector"])
nt.links.new(amb.outputs["Color"], fundo.inputs["Color"])
fundo.inputs["Strength"].default_value = 1.0

# ------------------------------------------------------------------ chão
bpy.ops.mesh.primitive_plane_add(size=800)
chao = bpy.context.object
chao.name = "chao"
# Chão em verde-folhagem: o que aparece entre as flores parece mato.
m_chao = material("terra_verde", srgb("#2f4a24"), rug=0.95)
chao.data.materials.append(m_chao)

# ------------------------------------------------------------------ carro
# Tudo vem de carroceria.ts (ver exportar-carro.mjs): malha, curvas das luzes
# e o "desenho técnico" em vistas (vincos, áreas pretas, faróis, lanternas).
CARRO = os.path.join(DIR, "nosso-carro")
dados = json.load(open(os.path.join(CARRO, "carro.json")))
antes = set(bpy.data.objects)
bpy.ops.wm.obj_import(
    filepath=os.path.join(CARRO, "carro.obj"),
    forward_axis="Y", up_axis="Z",  # o OBJ já está em coordenadas do Blender
)
pecas = {o.name: o for o in set(bpy.data.objects) - antes}


def B(x, y, z):
    """Ponto do carro (x comprimento, y altura, z largura à direita) no Blender."""
    return Vector((x, -z, y))


class Nos:
    """Atalhos para montar materiais por nós."""

    def __init__(self, m):
        self.nt = m.node_tree
        self.N, self.L = self.nt.nodes, self.nt.links

    def novo(self, tipo, **kw):
        n = self.N.new(tipo)
        for k, v in kw.items():
            setattr(n, k, v)
        return n

    def ligar(self, x, entrada):
        if isinstance(x, (int, float)):
            entrada.default_value = x
        elif isinstance(x, tuple):
            entrada.default_value = x
        else:
            self.L.new(x, entrada)

    def op(self, operacao, a, b=None, c=None):
        n = self.novo("ShaderNodeMath", operation=operacao)
        for i, x in enumerate((a, b, c)):
            if x is not None:
                self.ligar(x, n.inputs[i])
        return n.outputs[0]

    def soma(self, *xs):
        total = xs[0]
        for x in xs[1:]:
            total = self.op("ADD", total, x)
        return total

    def mistura(self, fator, a, b, cor=True):
        n = self.novo("ShaderNodeMix", data_type="RGBA" if cor else "FLOAT")
        self.ligar(fator, n.inputs[0])
        if cor:
            self.ligar(a if not isinstance(a, tuple) else (*a, 1), n.inputs[6])
            self.ligar(b if not isinstance(b, tuple) else (*b, 1), n.inputs[7])
            return n.outputs[2]
        self.ligar(a, n.inputs[2])
        self.ligar(b, n.inputs[3])
        return n.outputs[0]


cor_carro = srgb(cfg.get("cor", "#e2e5e9"))  # branco perolado, como nas fotos


def material_lataria():
    """Pintura + desenho técnico projetado das 4 vistas (triplanar)."""
    m = bpy.data.materials.new("lataria")
    m.use_nodes = True
    n = Nos(m)
    p = n.N["Principled BSDF"]
    tc = n.novo("ShaderNodeTexCoord")
    pos = n.novo("ShaderNodeSeparateXYZ")
    n.ligar(tc.outputs["Object"], pos.inputs[0])
    bx, by, bz = pos.outputs
    zt = n.op("MULTIPLY", by, -1)  # z do desenho (direita do carro)
    geo = n.novo("ShaderNodeNewGeometry")
    nor = n.novo("ShaderNodeSeparateXYZ")
    n.ligar(geo.outputs["Normal"], nor.inputs[0])

    # Peso de cada vista pela direção da superfície (expoente alto = troca
    # rápida de uma vista para a outra nos cantos).
    def peso(s):
        return n.op("POWER", n.op("ABSOLUTE", s), 6)

    wl, wt, wf = peso(nor.outputs[1]), peso(nor.outputs[2]), peso(nor.outputs[0])
    total = n.soma(wl, wt, wf, 1e-6)
    wl, wt, wf = (n.op("DIVIDE", w, total) for w in (wl, wt, wf))
    # Superfícies viradas para baixo usam a vista lateral (saia e assoalho
    # pretos); a de topo vale só para o que olha para cima.
    para_cima = n.op("GREATER_THAN", nor.outputs[2], 0)
    wl = n.op("ADD", wl, n.op("MULTIPLY", wt, n.op("SUBTRACT", 1, para_cima)))
    wt = n.op("MULTIPLY", wt, para_cima)
    frente_lado = n.op("GREATER_THAN", bx, 0)
    wfr = n.op("MULTIPLY", wf, frente_lado)
    wtr = n.op("MULTIPLY", wf, n.op("SUBTRACT", 1, frente_lado))

    vistas = dados["vistas"]

    def coord(valor, faixa):
        a, b = faixa
        return n.op("MULTIPLY_ADD", valor, 1 / (b - a), -a / (b - a))

    def amostra(nome, hval, vval):
        vista = vistas[nome]
        img = n.novo("ShaderNodeTexImage", extension="CLIP", interpolation="Cubic")
        img.image = bpy.data.images.load(os.path.join(CARRO, f"detalhes_{nome}.png"))
        img.image.colorspace_settings.name = "Non-Color"
        img.image.alpha_mode = "CHANNEL_PACKED"
        uv = n.novo("ShaderNodeCombineXYZ")
        n.ligar(coord(hval, vista["h"]), uv.inputs[0])
        n.ligar(coord(vval, vista["v"]), uv.inputs[1])
        n.ligar(uv.outputs[0], img.inputs[0])
        sep = n.novo("ShaderNodeSeparateColor")
        n.ligar(img.outputs["Color"], sep.inputs[0])
        return [*sep.outputs, img.outputs["Alpha"]]

    lado = amostra("lado", bx, bz)
    topo = amostra("topo", bx, zt)
    frente = amostra("frente", zt, bz)
    tras = amostra("tras", zt, bz)

    def canal(i, pesos):
        return n.soma(*(n.op("MULTIPLY", w, v[i]) for w, v in pesos))

    todas = [(wl, lado), (wt, topo), (wfr, frente), (wtr, tras)]
    vinco = canal(0, todas)
    preto = canal(1, todas)
    # Caixas de roda: tudo dentro do círculo do arco (em x e altura) é o
    # fundo recolhido da caixa, qualquer que seja a direção da superfície.
    raio_caixa = dados["arcoRaio"] - 0.004
    for eixo in sorted({round(r[0], 3) for r in dados["rodas"]}):
        dx = n.op("SUBTRACT", bx, eixo)
        dz = n.op("SUBTRACT", bz, dados["rodaRaio"])
        dist = n.op("SQRT", n.op("ADD", n.op("MULTIPLY", dx, dx), n.op("MULTIPLY", dz, dz)))
        preto = n.op("MAXIMUM", preto, n.op("LESS_THAN", dist, raio_caixa))
    luz = canal(2, [(wfr, frente), (wtr, tras)])
    relevo = canal(3, [(wl, lado), (wt, topo)])
    grade = canal(3, [(wfr, frente)])
    led = canal(3, [(wtr, tras)])

    # Cor: pintura → plástico preto → carcaça/lente da luz → fresta.
    cor_luz = n.mistura(frente_lado, srgb("#5a0807"), srgb("#06080a"))
    cor = n.mistura(preto, cor_carro, srgb("#0e0f11"))
    cor = n.mistura(luz, cor, cor_luz)
    cor = n.mistura(n.op("MULTIPLY", vinco, 0.92), cor, srgb("#030303"))
    n.ligar(cor, p.inputs["Base Color"])
    rug = n.mistura(preto, 0.3, 0.55, cor=False)
    rug = n.mistura(luz, rug, 0.04, cor=False)
    n.ligar(n.mistura(vinco, rug, 0.9, cor=False), p.inputs["Roughness"])
    n.ligar(n.mistura(preto, 0.12, 0.0, cor=False), p.inputs["Metallic"])
    coat = n.mistura(preto, 1.0, 0.0, cor=False)
    n.ligar(n.mistura(luz, coat, 1.0, cor=False), p.inputs["Coat Weight"])
    p.inputs["Coat Roughness"].default_value = 0.02
    # LEDs da lanterna acesos.
    p.inputs["Emission Color"].default_value = (*srgb("#ff2414"), 1)
    n.ligar(n.op("MULTIPLY", led, float(cfg.get("luz_lanterna", "14"))), p.inputs["Emission Strength"])

    # Relevo: vincos de estilo sobem, frestas descem, lâminas na grade.
    laminas = n.op("MULTIPLY", grade,
                   n.op("MULTIPLY_ADD", n.op("SINE", n.op("MULTIPLY", bz, 2 * math.pi / 0.028)), 0.5, 0.5))
    altura = n.soma(n.op("MULTIPLY", relevo, 0.6), n.op("MULTIPLY", vinco, -1.0),
                    n.op("MULTIPLY", laminas, 0.8))
    bump = n.novo("ShaderNodeBump")
    bump.inputs["Distance"].default_value = 0.003
    n.ligar(altura, bump.inputs["Height"])
    n.ligar(bump.outputs["Normal"], p.inputs["Normal"])

    # Por dentro (visto pelas janelas), a lataria é forro escuro.
    forro = n.novo("ShaderNodeBsdfDiffuse")
    forro.inputs["Color"].default_value = (*srgb("#1d1c1e"), 1)
    junta = n.novo("ShaderNodeMixShader")
    n.ligar(geo.outputs["Backfacing"], junta.inputs[0])
    n.ligar(p.outputs[0], junta.inputs[1])
    n.ligar(forro.outputs[0], junta.inputs[2])
    n.ligar(junta.outputs[0], n.N["Material Output"].inputs["Surface"])
    return m


def material_vidro():
    """Vidro fino: deixa ver o interior e reflete o céu nas bordas (Fresnel)."""
    m = bpy.data.materials.new("vidro")
    m.use_nodes = True
    m.surface_render_method = "DITHERED"
    n = Nos(m)
    n.N.remove(n.N["Principled BSDF"])
    transp = n.novo("ShaderNodeBsdfTransparent")
    transp.inputs["Color"].default_value = (*srgb(cfg.get("tom_vidro", "#7d878c")), 1)
    brilho = n.novo("ShaderNodeBsdfGlossy")
    brilho.inputs["Roughness"].default_value = 0.02
    camada = n.novo("ShaderNodeLayerWeight")
    camada.inputs["Blend"].default_value = 0.12
    junta = n.novo("ShaderNodeMixShader")
    n.ligar(camada.outputs["Fresnel"], junta.inputs[0])
    n.ligar(transp.outputs[0], junta.inputs[1])
    n.ligar(brilho.outputs[0], junta.inputs[2])
    n.ligar(junta.outputs[0], n.N["Material Output"].inputs["Surface"])
    return m


m_pintura = material_lataria()
m_vidro = material_vidro()
m_frit = material("frit", srgb("#050506"), rug=0.08, coat=1.0)
m_preto = material("plastico_preto", srgb("#111214"), rug=0.55)
m_brilho = material("preto_brilhante", srgb("#060708"), rug=0.06, coat=1.0)
m_pneu = material("pneu", srgb("#161616"), rug=0.85)
m_aro = material("aro", srgb("#7a8188"), metal=1.0, rug=0.3)
m_aro_fundo = material("aro_fundo", srgb("#1a1c1f"), metal=0.6, rug=0.5)
m_borda_aro = material("borda_aro", srgb("#c9ced3"), metal=1.0, rug=0.15)
m_disco = material("disco", srgb("#6b7075"), metal=0.85, rug=0.4)
m_pinca = material("pinca", srgb("#7b5cd6"), rug=0.45)  # violeta da nova identidade
m_farol = material("farol", srgb("#f2f7ff"), emissao=srgb("#f2f7ff"), forca=10)
m_cromo = material("cromo", srgb("#b8bec4"), metal=1.0, rug=0.12)
m_lente = material("lente", srgb("#0b0d10"), metal=0.3, rug=0.03, coat=1.0)
m_couro = material("couro", srgb("#6e4128"), rug=0.5)  # interior conhaque
m_painel = material("painel", srgb("#18191b"), rug=0.6)
m_carpete = material("carpete", srgb("#101011"), rug=0.95)

for nome, o in pecas.items():
    with bpy.context.temp_override(active_object=o, object=o, selected_editable_objects=[o]):
        bpy.ops.object.mode_set(mode="EDIT")
        bpy.ops.mesh.select_all(action="SELECT")
        bpy.ops.mesh.remove_doubles(threshold=1e-4)
        if nome == "lataria":
            bpy.ops.mesh.normals_make_consistent(inside=False)
        bpy.ops.object.mode_set(mode="OBJECT")
        bpy.ops.object.shade_smooth_by_angle(angle=math.radians(50))
    o.data.materials.clear()
    if nome.startswith("vidro"):
        o.data.materials.append(m_vidro)
    elif nome.startswith("frit"):
        o.data.materials.append(m_frit)
    else:
        o.data.materials.append(m_pintura)
lataria = pecas["lataria"]
bpy.context.view_layer.update()


def pousar(origem, direcao):
    """Raio até a lataria: (ponto, normal) onde bate. Para pôr peças nela."""
    ok, loc, nor, _ = lataria.ray_cast(origem, direcao.normalized())
    if not ok:
        raise RuntimeError(f"raio não tocou a lataria: {tuple(origem)}")
    return loc, nor


def curva(nome, pontos, raio, mat):
    c = bpy.data.curves.new(nome, "CURVE")
    c.dimensions = "3D"
    c.bevel_depth = raio
    c.bevel_resolution = 4
    s = c.splines.new("POLY")
    s.points.add(len(pontos) - 1)
    for p, xyz in zip(s.points, pontos):
        p.co = (*xyz, 1)
    o = bpy.data.objects.new(nome, c)
    o.data.materials.append(mat)
    cena.collection.objects.link(o)
    return o


def prim(op, nome, mat, **kw):
    op(**kw)
    o = bpy.context.object
    o.name = nome
    o.data.materials.append(mat)
    return o


def caixa(nome, mat, centro, dim, rot=(0, 0, 0), chanfro=0.0, seg=4):
    o = prim(bpy.ops.mesh.primitive_cube_add, nome, mat, size=1, location=centro)
    o.scale = dim
    o.rotation_euler = rot
    if chanfro:
        b = o.modifiers.new("chanfro", "BEVEL")
        b.width = chanfro
        b.segments = seg
        b.limit_method = "NONE"
        b.affect = "EDGES"
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        bpy.ops.object.shade_smooth()
    return o


def giro_para(normal):
    """Rotação em z que aponta o eixo Y local para a normal (no plano)."""
    return math.atan2(-normal.x, normal.y)


# Friso cromado em volta das janelas laterais.
for lado in (1, -1):
    pts = [(x, y * lado, z) for x, y, z in dados["friso"]]
    curva(f"friso_janela_{lado}", pts + pts[:1], 0.006, m_cromo)

# Luz diurna dos faróis: segue a borda de cima da carcaça (mesmo desenho).
for i, f in enumerate(dados["farois"]):
    curva(f"farol_drl_{i}", f, 0.006, m_farol)

for s in (1, -1):
    # Faróis: dois projetores por lado (anel cromado + lente escura).
    for z, y in ((0.47, 0.683), (0.64, 0.69)):
        loc, nor = pousar(B(3.5, y, s * z), Vector((-1, 0, 0)))
        rot = nor.to_track_quat("Z", "Y").to_euler()
        anel = prim(bpy.ops.mesh.primitive_torus_add, f"anel_{s}_{z}", m_cromo,
                    major_radius=0.03, minor_radius=0.006, location=loc + nor * 0.002, rotation=rot)
        lente = prim(bpy.ops.mesh.primitive_uv_sphere_add, f"lente_{s}_{z}", m_lente,
                     radius=0.026, location=loc - nor * 0.006, rotation=rot)
        lente.scale = (1, 1, 0.45)
        bpy.ops.object.shade_smooth()

    # Retrovisor na porta, logo atrás da coluna dianteira.
    loc, nor = pousar(B(0.8, 0.93, s * 1.6), B(0, 0, -s))
    giro = giro_para(nor)
    fora = Vector((nor.x, nor.y, 0)).normalized()
    caixa(f"retrovisor_base_{s}", m_brilho, loc + fora * 0.015 + Vector((0, 0, 0.02)),
          (0.13, 0.04, 0.06), rot=(0, 0, giro), chanfro=0.012)
    caixa(f"retrovisor_braco_{s}", m_brilho, loc + fora * 0.06 + Vector((0, 0, 0.045)),
          (0.045, 0.09, 0.035), rot=(0, 0, giro), chanfro=0.01)
    centro = loc + fora * 0.15 + Vector((0, 0, 0.07))
    caixa(f"retrovisor_{s}", m_pintura, centro, (0.1, 0.21, 0.12), rot=(0, 0, giro),
          chanfro=0.04, seg=6)
    caixa(f"retrovisor_espelho_{s}", m_cromo, centro + Vector((-0.047, 0, 0)),
          (0.01, 0.18, 0.095), rot=(0, 0, giro), chanfro=0.02, seg=4)

    # Maçaneta embutida (o contorno está no desenho da lateral).
    loc, nor = pousar(B(-0.42, 0.86, s * 1.6), B(0, 0, -s))
    caixa(f"macaneta_{s}", m_cromo, loc + nor * 0.003, (0.2, 0.012, 0.026),
          rot=(0, 0, giro_para(nor)), chanfro=0.006)

    # Escapamentos: duas saídas por lado, no difusor.
    for z in (0.5, 0.63):
        loc, _ = pousar(B(-3.5, 0.27, s * z), Vector((1, 0, 0)))
        prim(bpy.ops.mesh.primitive_cylinder_add, f"escape_{s}_{z}", m_cromo, radius=0.04,
             depth=0.12, location=loc + Vector((0.03, 0, 0)), rotation=(0, math.pi / 2, 0), vertices=32)
        prim(bpy.ops.mesh.primitive_cylinder_add, f"escape_fundo_{s}_{z}", m_preto, radius=0.033,
             depth=0.01, location=loc + Vector((-0.031, 0, 0)), rotation=(0, math.pi / 2, 0), vertices=32)

# Palhetas na base do para-brisa.
for z0, z1 in ((-0.62, -0.06), (-0.02, 0.54)):
    pts = []
    for k in range(9):
        z = z0 + (z1 - z0) * k / 8
        x = 1.0 + 0.05 * k / 8
        loc, nor = pousar(B(x, 3, z), Vector((0, 0, -1)))
        pts.append(tuple(loc + nor * 0.012))
    curva(f"palheta_{z0}", pts, 0.007, m_preto)

# Aletas do difusor.
for k in range(5):
    z = -0.5 + k * 0.25
    loc, _ = pousar(B(-3.5, 0.22, z), Vector((1, 0, 0)))
    caixa(f"aleta_{k}", m_preto, loc + Vector((0.02, 0, 0)), (0.16, 0.012, 0.09))

# Interior: visível pelos vidros. Volumes simples, materiais de couro e
# painel escuros (é o que se vê de fora num carro de verdade).
caixa("piso", m_carpete, B(-0.2, 0.3, 0), (2.4, 1.5, 0.04))
for z in (0.38, -0.38):
    caixa(f"assento_{z}", m_couro, B(-0.3, 0.44, z), (0.52, 0.5, 0.13), chanfro=0.04)
    caixa(f"encosto_{z}", m_couro, B(-0.6, 0.76, z), (0.13, 0.5, 0.64), rot=(0, -0.25, 0), chanfro=0.05)
    caixa(f"apoio_{z}", m_couro, B(-0.7, 1.12, z), (0.1, 0.26, 0.18), rot=(0, -0.25, 0), chanfro=0.04)
caixa("banco_tras", m_couro, B(-1.12, 0.46, 0), (0.45, 1.2, 0.13), chanfro=0.04)
caixa("encosto_tras", m_couro, B(-1.37, 0.74, 0), (0.12, 1.2, 0.5), rot=(0, -0.35, 0), chanfro=0.05)
caixa("painel", m_painel, B(0.74, 0.86, 0), (0.45, 1.55, 0.22), chanfro=0.06)
caixa("console", m_painel, B(0.12, 0.52, 0), (0.8, 0.22, 0.3), chanfro=0.04)
# Volante do lado esquerdo (carro brasileiro).
prim(bpy.ops.mesh.primitive_torus_add, "volante", m_painel, major_radius=0.18, minor_radius=0.018,
     location=B(0.42, 0.88, -0.38), rotation=(0, math.radians(-65), 0))
prim(bpy.ops.mesh.primitive_cylinder_add, "volante_centro", m_painel, radius=0.06, depth=0.05,
     location=B(0.43, 0.88, -0.38), rotation=(0, math.radians(-65), 0))

R = dados["rodaRaio"]
for i, (x, y, z) in enumerate(dados["rodas"]):
    lado = 1 if y > 0 else -1
    rot = (math.pi / 2, 0, 0)
    pneu = prim(bpy.ops.mesh.primitive_torus_add, f"pneu_{i}", m_pneu,
                major_radius=R - 0.075, minor_radius=0.075, location=(x, y, z), rotation=rot,
                major_segments=64, minor_segments=24)
    pneu.scale = (1, 1, 1.75)  # mais largo que um toro comum
    bpy.ops.object.shade_smooth()
    # Tambor do aro aberto: entre os raios aparecem o disco e a pinça.
    prim(bpy.ops.mesh.primitive_cylinder_add, f"aro_{i}", m_aro_fundo, radius=R - 0.09, depth=0.2,
         location=(x, y, z), rotation=rot, vertices=64, end_fill_type="NOTHING")
    # Borda polida do aro (o "lábio" que brilha nas fotos).
    prim(bpy.ops.mesh.primitive_torus_add, f"borda_{i}", m_borda_aro, major_radius=R - 0.095,
         minor_radius=0.011, location=(x, y + lado * 0.1, z), rotation=rot, major_segments=64)
    # Cinco raios duplos, afinando para o centro.
    for k in range(10):
        a = (k // 2) * 2 * math.pi / 5 + (0.12 if k % 2 else -0.12)
        raio = prim(bpy.ops.mesh.primitive_cube_add, f"raio_{i}_{k}", m_aro, size=1,
                    location=(x + math.sin(a) * 0.14, y + lado * 0.09, z + math.cos(a) * 0.14))
        raio.scale = (0.026, 0.04, 0.22)
        raio.rotation_euler = (0, a, 0)
    prim(bpy.ops.mesh.primitive_cylinder_add, f"centro_{i}", m_brilho, radius=0.05, depth=0.03,
         location=(x, y + lado * 0.105, z), rotation=rot, vertices=32)
    for k in range(5):
        a = k * 2 * math.pi / 5
        prim(bpy.ops.mesh.primitive_cylinder_add, f"porca_{i}_{k}", m_cromo, radius=0.011, depth=0.02,
             location=(x + math.sin(a) * 0.075, y + lado * 0.105, z + math.cos(a) * 0.075),
             rotation=rot, vertices=6)
    prim(bpy.ops.mesh.primitive_cylinder_add, f"disco_{i}", m_disco, radius=0.2, depth=0.03,
         location=(x, y - lado * 0.03, z), rotation=rot, vertices=48)
    pinca = prim(bpy.ops.mesh.primitive_cube_add, f"pinca_{i}", m_pinca, size=1,
                 location=(x + 0.1, y + lado * 0.02, z + 0.12))
    pinca.scale = (0.08, 0.09, 0.15)
    pinca.rotation_euler = (0, -0.7, 0)
    # Caixa de roda escura (esconde o interior do arco).
    caixa_roda = prim(bpy.ops.mesh.primitive_cylinder_add, f"caixa_{i}", m_preto,
                      radius=dados["arcoRaio"] - 0.01, depth=0.42, location=(x, y * 0.82, z),
                      rotation=rot, vertices=48, end_fill_type="NOTHING")
    # Só a metade de cima: a de baixo aparecia como abas pretas sob o carro.
    bm = bmesh.new()
    bm.from_mesh(caixa_roda.data)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if (caixa_roda.matrix_basis @ v.co).z < z - 0.05],
                     context="VERTS")
    bm.to_mesh(caixa_roda.data)
    bm.free()

# Friso dos para-lamas: arco na cor da lataria em volta de cada roda. Dá o
# acabamento da caixa de roda (a borda da malha fica serrilhada).
for i, (x, y, z) in enumerate(dados["rodas"]):
    lado = 1 if y > 0 else -1
    raio_arco = dados["arcoRaio"] + 0.005
    pontos = []
    for k in range(41):
        a = math.radians(-8 + k * (196 / 40))
        px, pz = x + math.cos(a) * raio_arco, z + math.sin(a) * raio_arco
        # Pousa na lataria (raio de fora para dentro): o friso acompanha a
        # superfície em vez de ficar saltado como um para-lama postiço.
        ok, loc, _, _ = lataria.ray_cast(Vector((px, lado * 1.6, pz)), Vector((0, -lado, 0)))
        if ok:
            pontos.append((px, loc.y + lado * 0.004, pz))
    curva(f"friso_{i}", pontos, 0.014, m_pintura)

# ----------------------------------------------------------- flores
COM_FLORES = cfg.get("flores", "1") == "1"
LIB = os.path.join(DIR, "flor", "Anemone_Hybrida_BLEND", "Anemone_Hybrida.blend")
with bpy.data.libraries.load(LIB, link=False) as (src, dst):
    dst.objects = ["Anemone_hybrida v01 m001"]
modelos = colecao("modelos_flor", oculta=True)
flor = dst.objects[0]
modelos.objects.link(flor)
flor.location = (0, 0, 0)
flor.rotation_euler = (0, 0, 0)
# A malha está em centímetros com escala 0,01 no objeto; os nós de geometria
# usam a malha crua (planta de 70 m!). Aplica a escala na malha.
flor.data = flor.data.copy()
flor.data.transform(flor.matrix_basis)
flor.matrix_basis.identity()
# Base da planta no chão (z = 0).
zmin = min(v.co.z for v in flor.data.vertices)
for v in flor.data.vertices:
    v.co.z -= zmin
print("FLOR dim", tuple(round(x, 3) for x in flor.dimensions), flush=True)

# Pétalas: tira a cor original da textura (rosa) e mantém só o detalhe
# (claro/escuro); cada flor sorteia um tom pelo "Random" da instância:
# lavanda, azul-violeta ou branco, como nas fotos de referência.
for m in flor.data.materials:
    if not m or not m.name.startswith("flower"):
        continue
    nos = m.node_tree.nodes
    L = m.node_tree.links
    p = next(n for n in nos if n.type == "BSDF_PRINCIPLED")
    entrada = p.inputs["Base Color"]
    if not entrada.is_linked:
        continue
    origem = entrada.links[0].from_socket
    cinza = nos.new("ShaderNodeRGBToBW")
    L.new(origem, cinza.inputs[0])
    info = nos.new("ShaderNodeObjectInfo")
    rampa = nos.new("ShaderNodeValToRGB")
    rampa.color_ramp.interpolation = "CONSTANT"
    el = rampa.color_ramp.elements
    el[0].position = 0.0
    el[0].color = (*srgb("#9a7fe3"), 1)  # lavanda
    el[1].position = 0.55
    el[1].color = (*srgb("#5a73e0"), 1)  # azul-violeta
    branco = el.new(0.86)
    branco.color = (*srgb("#f3f1ee"), 1)  # branco (poucas)
    L.new(info.outputs["Random"], rampa.inputs["Fac"])
    mix = nos.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.blend_type = "MULTIPLY"
    mix.inputs["Factor"].default_value = 1.0
    # O cinza da textura é escuro: clareia antes de multiplicar.
    clarear = nos.new("ShaderNodeMath")
    clarear.operation = "MULTIPLY"
    clarear.inputs[1].default_value = 1.9
    L.new(cinza.outputs[0], clarear.inputs[0])
    L.new(clarear.outputs[0], mix.inputs[6])
    L.new(rampa.outputs["Color"], mix.inputs[7])
    L.new(mix.outputs[2], entrada)


def versao_leve(nome, razao):
    """Cópia simplificada da flor (a original tem 82 mil vértices)."""
    c = flor.copy()
    c.data = flor.data.copy()
    c.name = nome
    modelos.objects.link(c)
    mod = c.modifiers.new("dec", "DECIMATE")
    mod.ratio = razao
    with bpy.context.temp_override(object=c, active_object=c):
        bpy.ops.object.modifier_apply(modifier="dec")
    print("FLOR", nome, len(c.data.vertices), "vértices", flush=True)
    return c


flor_media = versao_leve("flor_media", float(cfg.get("decimar_perto", "0.25")))
# Longe, a flor vira um ponto: um "tufo" leve (5 esferinhas coloridas sobre
# folhas verdes, ~250 vértices) com as mesmas cores sorteadas por instância.
def material_tufo():
    m = bpy.data.materials.new("tufo")
    m.use_nodes = True
    nos, L = m.node_tree.nodes, m.node_tree.links
    p = nos["Principled BSDF"]
    p.inputs["Roughness"].default_value = 0.7
    info = nos.new("ShaderNodeObjectInfo")
    rampa = nos.new("ShaderNodeValToRGB")
    rampa.color_ramp.interpolation = "CONSTANT"
    el = rampa.color_ramp.elements
    el[0].position, el[0].color = 0.0, (*srgb("#9a7fe3"), 1)
    el[1].position, el[1].color = 0.55, (*srgb("#5a73e0"), 1)
    el.new(0.86).color = (*srgb("#f3f1ee"), 1)
    L.new(info.outputs["Random"], rampa.inputs["Fac"])
    L.new(rampa.outputs["Color"], p.inputs["Base Color"])
    return m


m_tufo = material_tufo()
m_folha = material("folha_tufo", srgb("#3f6a2c"), rug=0.9)
tufo_partes = []
rt = random.Random(5) if "random" in globals() else None
import random as _r
rt = _r.Random(5)
for k in range(5):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.06,
                                          location=(rt.uniform(-0.12, 0.12), rt.uniform(-0.12, 0.12), rt.uniform(0.35, 0.55)))
    o = bpy.context.object
    o.scale.z = 0.6
    o.data.materials.append(m_tufo)
    tufo_partes.append(o)
bpy.ops.mesh.primitive_cone_add(vertices=6, radius1=0.2, depth=0.4, location=(0, 0, 0.2))
folhas = bpy.context.object
folhas.data.materials.append(m_folha)
tufo_partes.append(folhas)
with bpy.context.temp_override(active_object=folhas, selected_editable_objects=tufo_partes):
    bpy.ops.object.join()
flor_leve = folhas
flor_leve.name = "tufo"
for c in list(flor_leve.users_collection):
    c.objects.unlink(flor_leve)
modelos.objects.link(flor_leve)
print("FLOR tufo", len(flor_leve.data.vertices), "vértices", flush=True)


def espalhar(nome, objeto, raio_min, raio_max, densidade, semente):
    """Planta 'objeto' num anel em volta do carro, com nós de geometria."""
    bpy.ops.mesh.primitive_circle_add(vertices=96, radius=raio_max, fill_type="NGON")
    base = bpy.context.object
    base.name = nome
    g = bpy.data.node_groups.new(nome, "GeometryNodeTree")
    g.interface.new_socket("Geometry", in_out="INPUT", socket_type="NodeSocketGeometry")
    g.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
    N = g.nodes
    L = g.links
    ent, sai = N.new("NodeGroupInput"), N.new("NodeGroupOutput")
    dist = N.new("GeometryNodeDistributePointsOnFaces")
    dist.inputs["Density"].default_value = densidade
    dist.inputs["Seed"].default_value = semente
    L.new(ent.outputs[0], dist.inputs["Mesh"])
    # Apaga pontos: dentro do raio mínimo e sob o carro.
    pos = N.new("GeometryNodeInputPosition")
    sep = N.new("ShaderNodeSeparateXYZ")
    L.new(pos.outputs[0], sep.inputs[0])
    compr = N.new("ShaderNodeVectorMath")
    compr.operation = "LENGTH"
    L.new(pos.outputs[0], compr.inputs[0])
    perto = N.new("FunctionNodeCompare")
    perto.data_type = "FLOAT"
    perto.operation = "LESS_THAN"
    L.new(compr.outputs["Value"], perto.inputs[0])
    perto.inputs[1].default_value = raio_min
    absx, absy = N.new("ShaderNodeMath"), N.new("ShaderNodeMath")
    absx.operation = absy.operation = "ABSOLUTE"
    L.new(sep.outputs[0], absx.inputs[0])
    L.new(sep.outputs[1], absy.inputs[0])
    dx, dy = N.new("FunctionNodeCompare"), N.new("FunctionNodeCompare")
    for c, entrada_abs, lim in ((dx, absx, 2.25), (dy, absy, 0.92)):
        c.data_type = "FLOAT"
        c.operation = "LESS_THAN"
        L.new(entrada_abs.outputs[0], c.inputs[0])
        c.inputs[1].default_value = lim
    sob = N.new("FunctionNodeBooleanMath")
    sob.operation = "AND"
    L.new(dx.outputs[0], sob.inputs[0])
    L.new(dy.outputs[0], sob.inputs[1])
    apagar = N.new("FunctionNodeBooleanMath")
    apagar.operation = "OR"
    L.new(sob.outputs[0], apagar.inputs[0])
    L.new(perto.outputs[0], apagar.inputs[1])
    dele = N.new("GeometryNodeDeleteGeometry")
    dele.domain = "POINT"
    L.new(dist.outputs["Points"], dele.inputs["Geometry"])
    L.new(apagar.outputs[0], dele.inputs["Selection"])
    inst = N.new("GeometryNodeInstanceOnPoints")
    info = N.new("GeometryNodeObjectInfo")
    info.inputs["Object"].default_value = objeto
    L.new(dele.outputs[0], inst.inputs["Points"])
    L.new(info.outputs["Geometry"], inst.inputs["Instance"])
    giro = N.new("FunctionNodeRandomValue")
    giro.data_type = "FLOAT_VECTOR"
    giro.inputs["Min"].default_value = (-0.15, -0.15, 0)
    giro.inputs["Max"].default_value = (0.15, 0.15, 6.283)
    giro.inputs["Seed"].default_value = semente + 1
    L.new(giro.outputs["Value"], inst.inputs["Rotation"])
    esc = N.new("FunctionNodeRandomValue")
    esc.data_type = "FLOAT"
    # Flores na altura das rodas (35–55 cm), como nas fotos de referência.
    esc.inputs[2].default_value = float(cfg.get("esc_min", "0.5"))
    esc.inputs[3].default_value = float(cfg.get("esc_max", "0.8"))
    esc.inputs["Seed"].default_value = semente + 2
    L.new(esc.outputs[1], inst.inputs["Scale"])
    L.new(inst.outputs[0], sai.inputs[0])
    mod = base.modifiers.new(nome, "NODES")
    mod.node_group = g
    return base


if COM_FLORES:
    R1 = float(cfg.get("raio_perto", "15"))
    espalhar("flores_perto", flor_media, 0.0, R1, float(cfg.get("dens_perto", "8")), 3)
    espalhar("flores_longe", flor_leve, R1, float(cfg.get("raio_longe", "90")), float(cfg.get("dens_longe", "10")), 7)
    # Até o horizonte: tufos esparsos (de longe se fundem numa faixa lavanda).
    espalhar("flores_horizonte", flor_leve, float(cfg.get("raio_longe", "90")), 320, float(cfg.get("dens_horizonte", "1.5")), 11)

# ----------------------------------------------------- horizonte e névoa
# Linha de árvores ao longe, como nas fotos: recortes do olmo (renders do
# modelo Royalty Free, ver docs/creditos.md) em placas que encaram a câmera.
# Sem névoa volumétrica (estoura a memória da RX 580), a distância vem da
# cor: a imagem é misturada com o tom do horizonte (perspectiva atmosférica).
import random
rnd = random.Random(11)
cam_alvo = bpy.data.objects.new("alvo_arvores", None)
cena.collection.objects.link(cam_alvo)


def material_arvore(nome_img):
    m = bpy.data.materials.new(f"copa_{nome_img}")
    m.use_nodes = True
    m.surface_render_method = "DITHERED"
    nos, L = m.node_tree.nodes, m.node_tree.links
    p = nos["Principled BSDF"]
    tex = nos.new("ShaderNodeTexImage")
    tex.image = bpy.data.images.load(os.path.join(DIR, "arvores", f"{nome_img}.png"))
    tex.image.alpha_mode = "STRAIGHT"
    mix = nos.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.inputs["Factor"].default_value = float(cfg.get("haze", "0.62"))
    L.new(tex.outputs["Color"], mix.inputs[6])
    mix.inputs[7].default_value = (*srgb(cfg.get("cor_horizonte", "#a9bcc0")), 1)
    # Sem iluminação (emissão): placas acesas pelo sol de frente e escuras de
    # costas faziam as árvores mudarem de cor enquanto a câmera gira.
    nos.remove(p)
    emi = nos.new("ShaderNodeEmission")
    emi.inputs["Strength"].default_value = float(cfg.get("luz_arvores", "0.55"))
    L.new(mix.outputs[2], emi.inputs["Color"])
    vazio = nos.new("ShaderNodeBsdfTransparent")
    junta = nos.new("ShaderNodeMixShader")
    L.new(tex.outputs["Alpha"], junta.inputs["Fac"])
    L.new(vazio.outputs[0], junta.inputs[1])
    L.new(emi.outputs[0], junta.inputs[2])
    L.new(junta.outputs[0], nos["Material Output"].inputs["Surface"])
    return m, tex.image.size[0] / tex.image.size[1]


materiais_arvore = [material_arvore("arvore"), material_arvore("arvore-b")]
for k in range(160):
    ang = rnd.uniform(0, 2 * math.pi)
    d = rnd.uniform(300, 380)
    m, proporcao = materiais_arvore[k % 2]
    altura = rnd.uniform(9, 16)
    bpy.ops.mesh.primitive_plane_add(size=1, location=(math.cos(ang) * d, math.sin(ang) * d, altura / 2))
    placa = bpy.context.object
    placa.rotation_euler = (math.pi / 2, 0, 0)
    placa.scale = (altura * proporcao * (1 if rnd.random() > 0.5 else -1), altura, 1)
    placa.data.materials.append(m)
    # Sempre de frente para a câmera, girando só no eixo vertical.
    c = placa.constraints.new("LOCKED_TRACK")
    c.target = cam_alvo
    c.track_axis = "TRACK_Z"
    c.lock_axis = "LOCK_Y"
if cfg.get("nevoa", "0") == "1":
    vol = nt.nodes.new("ShaderNodeVolumePrincipled")
    vol.inputs["Density"].default_value = float(cfg.get("dens_nevoa", "0.0025"))
    vol.inputs["Color"].default_value = (*srgb("#cfdbe6"), 1)
    nt.links.new(vol.outputs[0], nt.nodes["World Output"].inputs["Volume"])

# ----------------------------------------------------------- câmera
cam_dados = bpy.data.cameras.new("cam")
cam_dados.lens = float(cfg.get("lente", "50"))
cam_dados.dof.use_dof = True
cam_dados.dof.aperture_fstop = float(cfg.get("f", "2.8"))
cam = bpy.data.objects.new("cam", cam_dados)
cena.collection.objects.link(cam)
cena.camera = cam
# Olhar mais alto deixa o carro mais baixo no quadro (espaço para texto).
alvo = Vector((0.0, 0.0, float(cfg.get("alvo_z", "0.62"))))
DIST = float(cfg.get("dist", "11"))
TOTAL = int(cfg.get("total", "48"))
INICIO, VARREDURA = math.radians(float(cfg.get("inicio", "35"))), math.radians(float(cfg.get("varredura", "220")))


def posicionar(q):
    t = q / max(1, TOTAL - 1)
    a = INICIO + VARREDURA * t
    altura = 1.25 + 0.5 * math.sin(math.pi * t)  # sobe um pouco no meio do giro
    cam.location = (math.cos(a) * DIST, math.sin(a) * DIST, altura)
    direcao = alvo - cam.location
    cam.rotation_euler = direcao.to_track_quat("-Z", "Y").to_euler()
    cam_dados.dof.focus_distance = direcao.length
    bpy.data.objects["alvo_arvores"].location = cam.location

# ----------------------------------------------------------- motor
r = cena.render
r.resolution_x = int(cfg.get("larg", "960"))
r.resolution_y = int(cfg.get("alt", "540"))
r.resolution_percentage = 100
r.image_settings.file_format = "PNG"
cena.view_settings.view_transform = "AgX"
cena.view_settings.look = "AgX - Medium High Contrast"
if cfg.get("motor", "CYCLES") == "CYCLES":
    r.engine = "CYCLES"
    cena.cycles.device = "CPU"
    cena.cycles.samples = int(cfg.get("amostras", "32"))
    cena.cycles.use_denoising = True
    cena.cycles.max_bounces = 6
    cena.cycles.transparent_max_bounces = 16
else:
    r.engine = "BLENDER_EEVEE_NEXT"
    cena.eevee.taa_render_samples = int(cfg.get("amostras", "32"))
    # Raytracing pesa na memória da placa (RX 580): desligável.
    cena.eevee.use_raytracing = cfg.get("rt", "0") == "1"
    cena.eevee.volumetric_end = 250
    cena.eevee.volumetric_tile_size = "8"
    cena.eevee.use_shadows = True

if "salvar" in cfg:
    bpy.ops.wm.save_as_mainfile(filepath=cfg["salvar"])

quadros = [int(q) for q in cfg.get("quadros", "0").split(",")]
for q in quadros:
    posicionar(q)
    r.filepath = os.path.join(SAIDA, f"{cfg.get('prefixo', 'quadro')}_{q:03d}.png")
    t0 = time.time()
    bpy.ops.render.render(write_still=True)
    print(f"RENDER quadro={q} motor={r.engine} {r.resolution_x}x{r.resolution_y} {time.time() - t0:.1f}s", flush=True)
