# Skills que alimentam o `tendencias` (o ig-viral)

Material de referência em `third_party/instagram-agent-skill/` (MIT, Jake Schincariol).
Não editamos nada lá: o que a gente aproveita é escrito no `prompt.md` daqui.

| Skill                            | O que aproveitar                                                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ig-viral`                       | achar o que está funcionando no nicho agora, ranquear por quanto cada um superou a própria conta, nomear a fórmula do gancho, virar arquivo de referência |
| `ig-viral/swipe.py` (206 linhas) | montagem do arquivo de referência — portar quando for usado                                                                                               |

## A regra deste agente

Ele **pesquisa na web**, porque a API do Instagram não entrega dado sobre perfil de
terceiro. Por isso, do CLAUDE.md:

> Ele sempre guarda a fonte de cada achado, e a tela só mostra o que tem fonte. É leitura
> de tendência, nunca número oficial do Instagram.

Achado sem link não vai para a tela. "Ranquear por quanto superou a própria conta" é a
parte mais frágil: depende de ver a média do perfil, que nem sempre é pública. Quando não
der para calcular, o agente diz que não deu — não estima.
