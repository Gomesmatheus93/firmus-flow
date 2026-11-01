# Skills que alimentam o `conteudo`

Material de referência em `third_party/instagram-agent-skill/` (MIT, Jake Schincariol).
Não editamos nada lá: o que a gente aproveita é escrito no `prompt.md` daqui.

É o agente que mais aproveita skill, porque é o que escreve.

| Skill | O que aproveitar |
| --- | --- |
| `ig-caption` | a linha que sobrevive ao corte do "... mais", o corpo, **um** pedido só, os termos de busca, três hashtags |
| `ig-reel` + `hooks.json` | 26 fórmulas de gancho, o roteiro falado, o texto na tela, o beat sheet com tempo |
| `ig-carousel` | a capa que ganha o arrasto e o texto slide a slide (o arquivo 1080x1350 é do `design`) |
| `ig-story` | a sequência do dia, qual sticker em qual quadro, e o quadro que leva para a DM |
| `ig-repurpose` | um ativo longo (vídeo, podcast, live, newsletter) virando uma semana |
| `ig-human` + `slop.json` | **o passe final**: tira travessão, palavra de IA e caractere invisível |

## O `ig-human` não é um agente

É filtro de saída. Toda legenda, roteiro e texto de carrossel passa por ele **antes** de
chegar ao chefe. Agente que escreve e agente que limpa são a mesma chamada aqui — o
`prompt.md` incorpora as regras dele.

## Scripts Python a portar quando chegar a hora

O CLAUDE.md manda portar para TypeScript **quando forem usados**, não antes. São
determinísticos — contam, medem e pontuam, sem IA no meio — então o porte é direto:

| Script | Linhas | O que faz |
| --- | --- | --- |
| `ig-human/humanize.py` | 283 | reescreve tirando a marca de máquina |
| `ig-human/detect.py` | 235 | pontua o texto num painel de cinco checagens |
| `ig-human/slop.json` | — | a lista de palavras. **Precisa de versão em português** |
| `ig-caption/caption.py` | 214 | lint da legenda |
| `ig-reel/hookscore.py` | 313 | nota do gancho |
| `ig-reel/beats.py` | 215 | beat sheet com tempo, a partir de palavras por minuto |

A lista do `slop.json` é o item que **não** dá para copiar: as palavras viciadas da IA em
inglês não são as mesmas em português. Essa lista a gente monta olhando a saída real dos
nossos agentes.
