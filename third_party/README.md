# Código de terceiros

Esta pasta guarda código que **não foi escrito neste repositório**. Cada item abaixo
tem licença permissiva e o arquivo de licença original preservado, sem alterações.

Regra do projeto: **não edite nada dentro destas pastas.** Se precisarmos adaptar
algo, a adaptação é escrita no nosso próprio código (em `packages/` ou `apps/`),
citando a origem.

---

## instagram-agent-skill

Coleção de skills para trabalho com Instagram (auditoria de perfil, planejamento,
legendas, carrossel, reels, humanização de texto, entre outras).

| | |
| --- | --- |
| **Autor** | Jake Schincariol |
| **Repositório** | <https://github.com/Jakeschincariol/instagram-agent-skill> |
| **Licença** | MIT — ver [`instagram-agent-skill/LICENSE`](./instagram-agent-skill/LICENSE) |
| **Direitos** | Copyright (c) 2026 Jake Schincariol |
| **Versão copiada** | commit `d03c56bb598be770c60b201f94237e5d1a4268a6` |
| **Copiado em** | 29/10/2026 |

### Como usamos

As skills são **material de referência** para os prompts dos nossos agentes em
`packages/agents/`. O mapeamento planejado:

| Skill | Nosso agente |
| --- | --- |
| `ig-profile`, `ig-audit` | `auditoria` |
| `ig-plan` | `estrategista` |
| `ig-caption`, `ig-reel`, `ig-carousel` | `conteudo` |
| `ig-human` | humanizador de texto, usado pelo `conteudo` |

Os scripts Python das skills (`ig-human/humanize.py`, `ig-caption/caption.py` e outros)
**não são executados** pela plataforma. Quando precisarmos da lógica deles, ela é
portada para TypeScript no nosso código, com a lista de palavras adaptada para o
português do Brasil.

### Obrigações da licença MIT

A MIT permite uso, cópia, modificação e distribuição, inclusive comercial, desde que
o aviso de copyright e o texto da licença sejam mantidos junto ao código. Por isso o
arquivo `LICENSE` fica onde está e esta página existe.
