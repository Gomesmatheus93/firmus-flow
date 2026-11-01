# Skills que alimentam a `auditoria`

Material de referência em `third_party/instagram-agent-skill/` (MIT, Jake Schincariol).
Não editamos nada lá: o que a gente aproveita é escrito no `prompt.md` daqui.

| Skill | O que aproveitar |
| --- | --- |
| `ig-profile` + `rubric.json` | nota do perfil em 12 partes: campo de nome, bio, link, destaques, os três fixados, feed |
| `ig-audit` | post-mortem do que já foi postado: o que funcionou, por quê, o que parar de fazer |

## Notas

O `rubric.json` é **dado, não código** — a rubrica pode virar JSON nosso direto, sem
porte. Mas a escala dele é de 0 a 100 e a nossa (`auditFindingsSchema`) é de 0 a 10;
converta na saída, não mude o schema.

O `ig-audit` espera que o dono **cole** as métricas dele. A nossa auditoria não tem isso
no MVP: `instagram_manage_insights` depende de aprovação da Meta (regra 6). Enquanto
isso, a auditoria olha o que é público e **diz na tela de onde veio cada achado** — nunca
apresenta estimativa como número do Instagram.
