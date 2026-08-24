# Pity Tracker — Plano do Projeto (v2)

> App mobile local-first para registrar tiros (wishes/warps) em banners de **Genshin Impact** e **Honkai: Star Rail**, acompanhar o pity atual e saber quanto falta para o soft/hard pity.

**Autor:** Renato
**Data:** agosto/2026
**Status:** planejamento
**Versão:** 3 — com ajuste manual de pity

---

## Changelog

### v2 → v3

| # | Mudança | Motivo |
|---|---|---|
| 6 | Ação **"corrigir pity"** com `tipo_registro` no `pull_logs` | Vai acontecer de esquecer de anotar; a saída é conferir no jogo e setar o número, não inventar registros retroativos |

### v1 → v2

Depois de analisar as anotações reais do Discord, cinco ajustes estruturais:

| # | Mudança | Motivo |
|---|---|---|
| 1 | Nova tabela `banners` (instâncias) separada de `banner_types` | O modelo mental é por banner específico ("banner venti", "banner mydei"), não por tipo |
| 2 | Nova tabela `accounts` | Existe conta smurf com contadores próprios |
| 3 | Múltiplos 5★ por banner | O banner padrão acumula vários numa linha só |
| 4 | Campo `obs` promovido a cidadão de primeira classe | Os comentários são parte do valor do histórico |
| 5 | Entrada rápida em texto com parser | Permite manter o hábito de digitação atual |

---

## 1. Motivação

Hoje o controle é feito manualmente no Discord, em linhas como:

```
0/90 banner venti (peguei venti: 78)
45/90 banner dilluc
22/90 banner xiao (KRL JA VEIO 3 BEIDOU TMANOCU)
21/90 banner do mochileiro qiqi keking mona (veio qiqi 35, mona 25, jean 33,
      espada celestial 78, jean 77, qiqi 78, diluc 22)
00/90 banner eula (muie gasosa de gelo q dança) (peguei no 30)
50/80 banner arma itto (veio falcao)
```

Funciona, mas:

- Não calcula nada — é preciso somar de cabeça quanto falta pro pity.
- O número antes da barra é ambíguo: às vezes parece "tiros neste banner", às vezes "pity acumulado". Nas anotações as duas leituras aparecem.
- Erros de hard pity passam batido (`00/70 banner arma arco yoimiya` — arma é 80, não 70).
- Sem visão consolidada: pra saber o pity atual de arma do Genshin, tem que caçar a última linha de arma.
- Sem imagens, sem contexto visual.

O objetivo é uma versão **muito mais simples de operar**: abrir o app, tocar em "+10", e ver imediatamente quanto falta.

**Não-objetivos:**

- Importar histórico automático via URL da HoYoverse.
- Simulador de probabilidade / calculadora de primogems.
- Multi-usuário, social, compartilhamento.

---

## 2. Regras de pity (pesquisadas e confirmadas — 2026)

### Genshin Impact

| Banner | Soft pity | Hard pity | Taxa base 5★ |
|---|---|---|---|
| Personagem (Evento) | ~74 | **90** | 0,6% |
| Padrão / Wanderlust ("lendário") | ~74 | **90** | 0,6% |
| Arma (Epitome Invocation) | ~63 | **80** | 0,7% |

### Honkai: Star Rail

| Banner | Soft pity | Hard pity | Taxa base 5★ |
|---|---|---|---|
| Character Event Warp | ~74–75 | **90** | 0,6% |
| Light Cone Event Warp | ~65–70 | **80** | 0,8% |
| Stellar Warp (padrão / "lendário") | ~74 | **90** | 0,6% |

### Observações para a modelagem

1. **Soft pity não é ponto fixo** — é uma rampa de probabilidade. A média real de 5★ no banner de personagem fica no tiro **75–80**, o que bate com as anotações (venti 78, yae 75, kafka 75, saber 76, seele 76).
   - O "76" da memória popular não está errado; é a região onde a maioria cai. Mas **74** é o valor mais aceito como início da rampa.
   - `soft_pity_ref` fica **configurável por tipo de banner** — se a comunidade revisar, muda no dado, não no código.

2. **Hard pity é fixo por tipo e o app deve travá-lo.** Digitar "/70" num banner de arma tem que ser impossível.

3. **Contadores são separados por tipo de banner** e independentes entre os jogos. E, com a conta smurf, também por conta.

4. **O contador só reseta ao sair um 5★** — não reseta ao trocar de banner nem em mudança de versão. **Pity carrega entre banners do mesmo tipo.** É exatamente isso que o app vai calcular sozinho.

5. **Sistema 50/50:**
   - Genshin/HSR personagem: 50% do 5★ ser o featured. Perdeu → próximo garantido.
   - HSR Light Cone: 75% de chance de ser o featured.
   - Genshin tem **Capturing Radiance** (desde a 5.0): perdas consecutivas aumentam uma chance oculta de "ganhar mesmo assim", elevando a taxa real de featured para ~55%.

   As anotações já registram isso implicitamente: `banner feixiao 9/90 feixiao 48-78` = perdeu o 50/50 no 48, pegou a Feixiao no 78. Mesma coisa em `castorice 30 (veio no 29)` e `banner arma jingliu (peguei 71 arma welt, peguei 67 arma jingliu)`.

---

## 3. Escopo do MVP

```
Abrir app → ver pity de cada tipo de banner → tocar "+1" ou "+10" → pronto
                                            ↘ se veio 5★, marcar e escolher
```

Requisitos funcionais:

- [x] Registrar N tiros em um banner específico
- [x] Marcar 5★ e qual personagem/arma veio, com a pity em que veio
- [x] Registrar **mais de um 5★** no mesmo banner
- [x] Calcular pity atual por tipo de banner, carregando entre banners
- [x] Mostrar quanto falta para soft pity e hard pity
- [x] Comentário livre por registro
- [x] Ver e **corrigir/deletar** registros anteriores
- [x] Alternar entre conta principal e smurf
- [x] Funcionar 100% offline
- [x] Foto do personagem
- [x] Sincronizar entre dispositivos quando houver internet

---

## 4. Modelo de dados

SQLite local como fonte da verdade. IDs em **UUID gerado no client** (ver §10).

```sql
CREATE TABLE accounts (
  id          TEXT PRIMARY KEY,       -- uuid
  nome        TEXT NOT NULL,          -- 'Principal' | 'Smurf'
  is_default  INTEGER DEFAULT 0
);

CREATE TABLE games (
  id    TEXT PRIMARY KEY,
  nome  TEXT NOT NULL,                -- 'Genshin Impact' | 'Honkai: Star Rail'
  slug  TEXT NOT NULL UNIQUE          -- 'genshin' | 'hsr'
);

-- Tipos: fixos, 6 linhas no total. Definem as REGRAS.
CREATE TABLE banner_types (
  id             TEXT PRIMARY KEY,
  game_id        TEXT NOT NULL REFERENCES games(id),
  nome           TEXT NOT NULL,       -- 'Personagem', 'Arma', 'Lendário'
  tipo           TEXT NOT NULL,       -- 'character' | 'weapon' | 'standard'
  hard_pity      INTEGER NOT NULL,    -- 90 | 80
  soft_pity_ref  INTEGER NOT NULL     -- 74 | 63 | 65
);

-- Instâncias: criadas por você conforme os banners saem. Contexto/rótulo.
CREATE TABLE banners (
  id              TEXT PRIMARY KEY,
  banner_type_id  TEXT NOT NULL REFERENCES banner_types(id),
  nome            TEXT NOT NULL,      -- 'Venti', 'Arma Itto', 'Mydei'
  apelido         TEXT,               -- 'muie gasosa de gelo q dança'
  data_inicio     TEXT,
  ativo           INTEGER DEFAULT 1,
  updated_at      TEXT NOT NULL,
  deleted_at      TEXT
);

CREATE TABLE characters (
  id                TEXT PRIMARY KEY,
  game_id           TEXT NOT NULL REFERENCES games(id),
  external_id       TEXT,             -- id/slug da API de origem
  nome              TEXT NOT NULL,
  raridade          INTEGER NOT NULL, -- 4 | 5
  tipo_item         TEXT NOT NULL,    -- 'character' | 'weapon' | 'lightcone'
  image_url         TEXT,
  image_local_path  TEXT
);

CREATE TABLE pull_logs (
  id             TEXT PRIMARY KEY,
  account_id     TEXT NOT NULL REFERENCES accounts(id),
  banner_id      TEXT NOT NULL REFERENCES banners(id),
  data           TEXT NOT NULL,       -- ISO 8601
  tipo_registro  TEXT NOT NULL DEFAULT 'pull',
                                      -- 'pull'   = tiros normais
                                      -- 'ajuste' = correção manual de pity
  qtd_tiros      INTEGER NOT NULL,    -- em 'ajuste', pode ser negativo
  veio_5estrela  INTEGER DEFAULT 0,
  character_id   TEXT REFERENCES characters(id),
  perdeu_5050    INTEGER,             -- nullable
  obs            TEXT,                -- comentário livre
  updated_at     TEXT NOT NULL,
  deleted_at     TEXT                 -- soft delete
);
```

### Por que separar `banner_types` de `banners`

`banner_types` são 6 linhas fixas que carregam as **regras** (hard pity, soft pity). `banners` são as **instâncias** que você cria conforme os banners saem — é a unidade em que você já pensa e anota.

Isso resolve as duas coisas ao mesmo tempo:

- Você continua registrando "no banner do Mydei" (contexto humano preservado).
- O pity é calculado sobre a **cadeia de banners do mesmo tipo**, que é como a mecânica realmente funciona.

O campo `apelido` existe pra sobreviver o "muie gasosa de gelo q dança". Os comentários são metade da graça de reler o histórico.

### Pity é calculado, não armazenado

```sql
-- pity atual de um tipo de banner, para uma conta
SELECT COALESCE(SUM(p.qtd_tiros), 0) AS pity_atual
FROM pull_logs p
JOIN banners b ON b.id = p.banner_id
WHERE b.banner_type_id = ?
  AND p.account_id = ?
  AND p.deleted_at IS NULL
  AND p.data > COALESCE(
    (SELECT MAX(p2.data)
     FROM pull_logs p2
     JOIN banners b2 ON b2.id = p2.banner_id
     WHERE b2.banner_type_id = ?
       AND p2.account_id = ?
       AND p2.veio_5estrela = 1
       AND p2.deleted_at IS NULL),
    '1970-01-01'
  );
```

**Por quê:** um contador armazenado dessincroniza. Se você corrigir um registro antigo, o contador vira lixo silenciosamente. Derivando do histórico, a correção se propaga sozinha. O histórico é a fonte da verdade; o pity é uma projeção.

**Trade-off:** query mais cara. Irrelevante nessa escala (centenas de linhas), e dá pra memoizar na UI se incomodar.

### Seed inicial

`games`, `banner_types` e a conta `Principal` são populados na primeira execução via migration.

---

## 5. Ajuste manual de pity

Duas situações diferentes resolvidas pelo **mesmo mecanismo**: um `pull_log` com `tipo_registro = 'ajuste'`.

### 5.1 Por que existe

Vai acontecer de dar tiros e não anotar. É o que já acontece hoje no Discord — e a saída não é tentar lembrar quantos foram. É abrir o histórico de wishes no jogo, contar as páginas desde o último 5★, e **setar o número direto**.

O caminho ruim seria inventar registros retroativos falsos ("acho que dei uns 20 no dia tal") só pra fechar a conta. Isso polui o histórico com dados que nunca existiram e você perde a confiança no que está lendo. Um registro de ajuste é honesto: diz "aqui eu perdi a conta e recalibrei", e fica visível como tal.

Como contar no jogo:

- **Genshin:** tela de Wish → Histórico. Cada página mostra 6 wishes.
- **HSR:** tela de Warp → Registro. Conta as páginas desde o último 5★.

### 5.2 Como funciona

Você informa o **pity que deveria estar**. O app calcula a diferença e grava:

```
pity_calculado_hoje = 45
pity_real_no_jogo   = 67
→ grava pull_log { tipo_registro: 'ajuste', qtd_tiros: +22, obs: 'ajuste manual' }
```

Se o número real for menor, `qtd_tiros` é negativo. Por isso a coluna aceita negativo — só em registros de ajuste.

A query de pity do §4 **não muda**: ela já soma `qtd_tiros` de tudo. O ajuste entra na soma naturalmente.

### 5.3 Saldo inicial — não migre o histórico

O mesmo mecanismo cobre a carga inicial. As ~35 linhas do Discord **não precisam virar dados**: pity carrega apenas de onde você parou, tudo antes disso é arquivo morto.

O app precisa de **6 números** (+ smurf), cada um entrando como um `ajuste` com `obs = 'saldo inicial'`:

| Conta | Jogo | Tipo | Pity |
|---|---|---|---|
| Principal | Genshin | Personagem | a conferir |
| Principal | Genshin | Arma | a conferir |
| Principal | Genshin | Lendário | a conferir |
| Principal | HSR | Personagem | a conferir |
| Principal | HSR | Cone | a conferir |
| Principal | HSR | Lendário | a conferir |
| Smurf | Genshin | Lendário | a conferir |

> Os números das anotações do Discord estão desatualizados — houve tiros não registrados depois da última anotação. Levantar direto do histórico do jogo antes de popular, usando o método do §5.1.

Se quiser preservar as linhas antigas por nostalgia, jogue o texto bruto num `.md` no repo. Não vale estruturar.

### 5.4 UI

- Toque longo no card do dashboard → "Corrigir pity"
- Campo numérico com o valor atual pré-preenchido
- Mostra o delta antes de confirmar: *"isso vai adicionar 22 tiros ao histórico"*
- No histórico, registros de ajuste aparecem com estilo distinto (ícone/cor) — não se confundem com tiros reais

### 5.5 Impacto nas estatísticas

Registros de ajuste **não devem contar** em estatísticas de "pity médio dos meus 5★" ou "taxa real de 50/50" — eles representam tiros de origem incerta. Filtrar por `tipo_registro = 'pull'` nesses cálculos. Já em "total de tiros dados", devem contar.

---

## 6. Telas

### 6.1 Home (dashboard)

Seletor de conta no topo. Cards agrupados por jogo, um por **tipo** de banner, mostrando o banner ativo daquele tipo:

```
┌─────────────────────────────────────┐
│  [ Principal ▾ ]                    │
│                                     │
│  GENSHIN IMPACT                     │
│  ┌───────────────────────────────┐  │
│  │ Personagem · banner Mydei     │  │
│  │ ███████████████░░░░░  67 / 90 │  │
│  │ 7 para soft pity · 23 p/ hard │  │
│  │            [ +1 ]    [ +10 ]  │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ Arma · banner arma Robin      │  │
│  │ ████░░░░░░░░░░░░░░░░  20 / 80 │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

- Barra de progresso com a **zona de soft pity destacada** em cor diferente.
- `+1` e `+10` registram direto do card, sem abrir tela. É o caminho mais usado — tem que ser 1 toque.
- Passou do soft pity, o texto vira "na zona de soft pity 🔥".
- Um toque longo no card troca o banner ativo daquele tipo.

### 6.2 Entrada rápida em texto

Campo único no topo da Home que aceita a sintaxe já usada no Discord:

| Você digita | O app entende |
|---|---|
| `+10` | 10 tiros no banner ativo |
| `+10 venti` | 10 tiros, e o último foi Venti (5★) |
| `venti 78` | 5★ Venti veio no pity 78 → soma os tiros que faltavam |
| `feixiao 48-78` | perdeu o 50/50 no 48, pegou Feixiao no 78 → dois registros |
| `+10 KRL JA VEIO 3 BEIDOU` | 10 tiros + comentário livre |

Regras do parser:

- Número solto com `+` → quantidade de tiros.
- Nome que casa com um personagem do jogo ativo → 5★.
- `N-M` depois de um nome → padrão de 50/50 perdido.
- Resto do texto → `obs`.
- **Sempre mostra um preview do que vai gravar antes de confirmar.** Parser de linguagem natural erra; confirmar é barato, dado errado no histórico é caro.

Existe também o caminho por formulário (§6.3) — o texto é atalho, não é obrigatório.

### 6.3 Registrar tiro (formulário)

Para quando saiu 5★ ou pra registro mais detalhado:

- Conta → jogo → banner (com opção "novo banner")
- Input numérico + botões rápidos
- Toggle "veio 5★?"
- Se sim: grid de personagens **com foto**, filtrado por jogo e pelo tipo do banner
- Se sim e for evento: toggle "perdeu o 50/50?"
- Campo de comentário
- Botão "+ outro 5★ neste banner" (o banner padrão acumula vários)

### 6.4 Histórico

Lista cronológica agrupada por banner, com swipe para editar/deletar. Registros de 5★ destacados com a foto. Os comentários aparecem em destaque — é o que dá graça em reler.

Filtros: por conta, por jogo, por tipo, só 5★.

### 6.5 Configurações

Contas, login/sync, atualizar catálogo de personagens, backup manual (export JSON), ajustar `soft_pity_ref`.

---

## 7. Imagens dos personagens

### Fontes

| Jogo | Fonte | Formato |
|---|---|---|
| Genshin | `api.genshin.dev` | REST público, sem chave. `/characters` lista, `/characters/{nome}/icon` retorna a imagem |
| HSR | `Mar-7th/StarRailRes` via `raw.githubusercontent.com` | JSON estático (`index_min/pt/characters.json`) + pasta `icon/` |
| HSR (alternativa) | `StarRailStaticAPI` | Espelho do StarRailRes, já organizado como API estática |

**Fallback:** `ScobbleQ/HoYo-Assets` serve arte dos dois jogos via `raw.githubusercontent`, indexada por ID do Enka.Network.

### Estratégia local-first

1. **Primeira execução:** baixa o catálogo (JSON, leve) dos dois jogos → persiste em `characters`.
2. **Imagens:** só dos 5★ inicialmente (são os que interessam no registro), salvos com `expo-file-system`. 4★ sob demanda.
3. **Refresh:** background, no máximo 1×/semana — personagem novo sai a cada patch (~6 semanas).
4. **Uso:** sempre lê de `image_local_path`. Se faltar, mostra placeholder com a inicial e enfileira o download.

Depois do primeiro boot, tudo funciona offline com foto.

⚠️ Todas as fontes são fan-made, não oficiais. Assets pertencem à HoYoverse. Uso pessoal sem redistribuição — ok. Manter as URLs em arquivo de config para trocar rápido se alguma quebrar.

---

## 8. Stack

| Camada | Escolha | Motivo |
|---|---|---|
| App | **React Native + Expo** | Reaproveita React/TS; um código pra Android e iOS; sem Gradle/Xcode direto |
| Banco local | **expo-sqlite** + **Drizzle ORM** | Padrão local-first mobile; tipagem e migrations sem peso |
| Estado | **Zustand** | Estado pequeno; Redux seria overkill |
| Arquivos | **expo-file-system** | Cache das imagens |
| Backend/sync | **Supabase** | Postgres gerenciado + auth + free tier. Evita manter backend próprio |
| Build | **EAS Build** | Gera o APK sem toolchain local |

**Por que não Flutter:** aprender Dart pra um projeto pessoal pequeno é custo sem retorno, já que o objetivo não é aprender stack nova. Vale reconsiderar se o interesse mudar.

**Por que não PWA:** mais simples de fazer, mas ícone na home e notificação ficam capengas. O app tem que abrir rápido no celular.

---

## 9. Sincronização

Modelo **local-first com sync eventual**:

```
Escrita → SQLite local (sempre, imediato, offline)
            ↓ (fila)
       Sync worker → Supabase (quando houver rede)
```

- Toda tabela sincronizada tem `updated_at` e `deleted_at` (soft delete).
- **Last-write-wins.** Suficiente: uso pessoal, um usuário, sem edição concorrente real. CRDT aqui seria engenharia desnecessária.
- Push: registros com `updated_at > last_sync_at` local. Pull: idem remoto, com upsert.
- `last_sync_at` numa tabela de metadados.
- Falha de rede não bloqueia nada — só adia.
- Roda ao abrir o app e após cada escrita (com debounce), não em intervalo fixo.

---

## 10. Decisão: UUID desde o início

IDs são **UUID v4 gerados no client**, não `INTEGER AUTOINCREMENT`.

Com autoincrement, dois dispositivos offline geram `id = 42` para registros diferentes, e o sync colide. Trocar depois exige migration de dados com reescrita de todas as FKs. Custo baixo agora, chato depois.

---

## 11. Fases de entrega

| Fase | Entrega | Resultado |
|---|---|---|
| **1** | Expo + SQLite + seed + contas + banners + registro + cálculo de pity + **ajuste manual** + dashboard + histórico editável | **App usável, offline, substitui o Discord** |
| **2** | Catálogo de personagens + cache de imagens | Fotos funcionando |
| **3** | Auth + sync Supabase | Multi-dispositivo |
| **4** | Entrada rápida em texto (parser) | Mantém o hábito de digitação |
| **5** | Extras opcionais | Ver abaixo |

**Marco crítico:** ao fim da Fase 1 o app já resolve o problema. As demais entram sem quebrar nada.

A entrada por texto ficou na Fase 4 de propósito: é a parte mais divertida de construir e a menos essencial. Formulário resolve; parser é conforto.

### Fase 5 — backlog opcional

- Estatísticas: pity médio dos seus 5★, taxa real de 50/50, total de tiros por jogo, gasto estimado
- Notificação "banner X acaba em 3 dias" (exige dados de banner atual — fonte extra)
- Export/import JSON completo
- Widget de home screen com pity atual
- Tema escuro

---

## 12. Riscos e mitigações

| Risco | Impacto | Mitigação |
|---|---|---|
| API fan-made sai do ar | Sem fotos de personagens novos | URLs em config; múltiplas fontes; imagens já baixadas continuam funcionando |
| Valores de soft pity mudarem | Cálculo desatualizado | Valores em banco, editáveis nas Configurações |
| Esquecer de registrar tiros | Pity errado | Ajuste manual (§5) — confere no histórico do jogo e seta o número |
| Ajuste manual virar muleta | Histórico vira ficção | Registros de ajuste marcados visualmente e excluídos das estatísticas (§5.5) |
| Parser interpretar errado | Dado sujo | Preview obrigatório antes de gravar |
| Registrar na conta errada | Contadores misturados | Conta ativa sempre visível no topo; cor distinta pro smurf |

---

## 13. Estrutura de pastas

```
pity-tracker/
├── app/                     # rotas (expo-router)
│   ├── index.tsx            # dashboard
│   ├── registrar.tsx
│   ├── historico.tsx
│   └── config.tsx
├── src/
│   ├── db/
│   │   ├── schema.ts        # drizzle
│   │   ├── migrations/
│   │   └── seed.ts          # games + banner_types + conta padrão
│   ├── domain/
│   │   ├── pity.ts          # cálculo de pity — função pura
│   │   ├── parser.ts        # entrada rápida em texto — função pura
│   │   └── types.ts
│   ├── services/
│   │   ├── characters.ts    # catálogo + cache de imagens
│   │   └── sync.ts
│   ├── components/
│   └── store/
├── assets/
└── app.json
```

`pity.ts` e `parser.ts` devem ser **funções puras sem dependência de banco** — recebem dados, devolvem resultado. Toda a regra testável sem subir SQLite.

Casos de teste que valem escrever primeiro para `pity.ts`:

- Pity carrega entre dois banners do mesmo tipo sem 5★ no meio
- Pity **não** carrega entre tipos diferentes
- Pity **não** carrega entre contas diferentes
- Dois 5★ no mesmo banner → conta a partir do último
- Deletar um registro recalcula corretamente
- Registro retroativo (data anterior) entra na posição certa da ordenação
- Ajuste positivo eleva o pity para o valor informado
- Ajuste negativo reduz o pity para o valor informado
- Ajuste anterior a um 5★ é ignorado no cálculo (o 5★ zera a contagem)
- Ajuste não entra nas estatísticas de pity médio (§5.5)

---

## 14. Próximos passos imediatos

1. Levantar os 6 números de saldo inicial pelo histórico do jogo (§5.1 e §5.3)
2. `npx create-expo-app` + setup do Drizzle
3. Implementar `pity.ts` com os testes do §13 **antes de qualquer UI**
4. Dashboard com dados mockados
5. Plugar o SQLite
6. Registro + histórico

---

## Referências

- Regras de pity Genshin — Game8, PlayAware, Genshin Tactics (cruzadas com dados do KeQingMains)
- Regras de pity HSR — Game8, The Loadout, Sportskeeda
- `api.genshin.dev` — genshindev/api (GitHub)
- `Mar-7th/StarRailRes` — recursos do HSR (GitHub)
- `StarRailStaticAPI` — espelho estático do StarRailRes
- `ScobbleQ/HoYo-Assets` — arte dos dois jogos via raw.githubusercontent
