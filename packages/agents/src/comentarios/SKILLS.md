# Skills que alimentam o `comentarios`

Material de referência em `third_party/instagram-agent-skill/` (MIT, Jake Schincariol).
Não editamos nada lá: o que a gente aproveita é escrito no `prompt.md` daqui.

| Skill        | O que aproveitar                                                                                                                 |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `ig-reply`   | comentários nos posts **da própria empresa**: quais valem resposta, em que ordem, e como lidar com crítica, hater e lead no meio |
| `ig-comment` | comentário em post **de outra pessoa**, soando como gente com opinião e não como robô                                            |

## Por que é um agente separado do `atendimento`

Os dois respondem gente, mas o risco é outro: **comentário é público**. Errar no WhatsApp
é um cliente insatisfeito; errar num comentário fica no perfil, embaixo do post, para
todo mundo ver e tirar print. Voz mais contida, e nada de preço ou dado pessoal em
público — isso vai para a conversa privada.

O `ig-reply` separa bem crítica (responde), hater (não alimenta) e lead (puxa para a
conversa privada). Essa separação é o coração do prompt.

## Dependência da Meta

Pela regra 6 do CLAUDE.md, responder comentário de verdade exige
`instagram_manage_comments` aprovado na revisão da Meta. Até lá a plataforma guarda a
regra, mostra na tela o que falta e **não publica nada**.
