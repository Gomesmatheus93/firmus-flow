# Skills que alimentam o `marca`

Material de referência em `third_party/instagram-agent-skill/` (MIT, Jake Schincariol).
Não editamos nada lá: o que a gente aproveita é escrito no `prompt.md` daqui.

| Skill                | O que aproveitar      |
| -------------------- | --------------------- |
| `templates/voice.md` | o molde do tom de voz |

## O que o `voice.md` ensina

Ele é um formulário que o criador preenche à mão sobre a própria voz. Para nós vale como
**lista do que extrair** da conversa com o dono:

- "palavras que eu uso" e "palavras que eu nunca diria em voz alta" → `dos` e `donts`
- "minhas posições": três a cinco coisas em que ele acredita e parte do público dele não.
  É daí que sai conteúdo que não é genérico
- "fora de limite": assunto que não posta, cliente que não pode citar, **afirmação que
  ele não tem permissão de fazer** (conselho de classe, NDA, política do empregador)
- "prova que eu posso usar": número e caso real que ele assume

A frase mais importante do arquivo é sobre essa última seção: _as skills nunca inventam
um número, então se esta seção estiver vazia todo rascunho volta com um marcador no
lugar do número_. É a mesma regra do CLAUDE.md para as telas — estado vazio honesto,
nunca exemplo. No nosso caso o vazio vira o campo `missing`.
