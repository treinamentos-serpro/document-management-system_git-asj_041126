# Especificação - Document Management System

> Especificação funcional e técnica do MVP. Os contratos abaixo descrevem o
> comportamento esperado; não significam que as rotas já estejam implementadas.

## 1. Objetivo

Permitir que um usuário envie, liste, baixe e exclua documentos por meio de uma aplicação web, mantendo os arquivos no filesystem local e os metadados em memória.

## 2. Escopo

### Dentro do escopo

- Enviar um arquivo por requisição usando `multipart/form-data`.
- Gravar os arquivos localmente em `backend/storage`, usando Multer com `diskStorage`.
- Manter os metadados dos documentos em memória enquanto o processo do backend estiver ativo.
- Listar documentos e baixar um documento pelo seu identificador.
- Excluir um documento pelo seu identificador, removendo seu arquivo local e seus metadados em memória.
- Disponibilizar uma interface React que consome a API por meio do prefixo `/api`.
- Usar um proprietário lógico local configurável, sem autenticação ou autorização no MVP.

### Fora do escopo

- Armazenamento em nuvem, serviços de upload externos ou banco de dados.
- Persistência ou recuperação automática de metadados após reiniciar o backend.
- Autenticação, autorização, isolamento real entre usuários ou compartilhamento de documentos.
- Versionamento, edição, busca, pastas e pré-visualização de documentos.
- Upload de múltiplos arquivos em uma única requisição.

## 3. Requisitos funcionais

| ID | Requisito | Critérios de aceite |
| --- | --- | --- |
| RF-01 | O usuário pode enviar um documento. | A API aceita um arquivo no campo `file` de uma requisição `multipart/form-data`. Arquivos de qualquer tipo são aceitos até o limite configurado, cujo padrão é 10 MiB. O servidor gera um identificador UUID, grava o conteúdo com nome interno controlado pelo servidor e registra os metadados em memória. Em sucesso, responde `201 Created` com os metadados. Se o registro dos metadados falhar após a gravação, o arquivo recém-gravado é removido para evitar resíduo inconsistente. |
| RF-02 | O usuário pode listar os documentos disponíveis no processo atual. | A API responde `200 OK` com um array JSON de metadados, sem caminhos internos. A lista é ordenada do mais recente para o mais antigo; empates são ordenados pelo `id`. Sem documentos, retorna `[]`. Como o MVP não tem autenticação, a listagem não representa isolamento ou controle de acesso por usuário. |
| RF-03 | O usuário pode baixar um documento pelo identificador. | Para um identificador conhecido, a API transmite o conteúdo como anexo e usa o nome original seguro no cabeçalho `Content-Disposition`. A resposta não revela caminhos locais. Se o identificador não estiver registrado ou o arquivo não existir, responde `404 Not Found`. |
| RF-04 | O usuário recebe erros de API em formato consistente. | Erros esperados usam o código HTTP definido nos contratos e um corpo JSON `{ "error": { "code": "...", "message": "..." } }`. Mensagens não expõem stack traces, caminhos locais ou detalhes internos do filesystem. Respostas de download bem-sucedidas são binárias, não JSON. |
| RF-05 | O usuário pode excluir um documento. | A API recebe o ID do documento, remove primeiro o arquivo local e então seus metadados em memória; responde `204 No Content` em sucesso. Um ID ausente ou desconhecido resulta em `404 Not Found`. Se a remoção física falhar, responde `500 Internal Server Error` sem remover os metadados. A interface pede confirmação e remove a linha após a resposta de sucesso. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos são armazenados exclusivamente no filesystem local da aplicação, em `backend/storage` por padrão, usando Multer com `diskStorage`. Não usar armazenamento externo. |
| RNF-02 | Os metadados são mantidos em memória. Ao reiniciar o backend, a lista de metadados é perdida; os arquivos no disco não são removidos nem recuperados automaticamente e podem ficar inacessíveis/órfãos. |
| RNF-03 | O limite máximo do upload é configurável por variável de ambiente e tem padrão de 10 MiB. Arquivos acima do limite são rejeitados com `413 Payload Too Large`. Não há allowlist de MIME ou extensão no MVP. |
| RNF-04 | O nome usado para persistir o arquivo é gerado pelo servidor, independente do nome enviado pelo cliente. O nome original é somente metadado e deve ser tratado com segurança ao formar cabeçalhos de download. IDs e caminhos não podem ser derivados de entrada livre do usuário. |
| RNF-05 | Configurações operacionais, incluindo porta, diretório de armazenamento, limite de upload e proprietário lógico padrão, são fornecidas por variáveis de ambiente com defaults documentados. Segredos não são armazenados no código. |
| RNF-06 | O backend usa Node.js, Express e CommonJS; o frontend usa React, Vite e ES modules. A implementação permanece em JavaScript, sem TypeScript nesta fase. |
| RNF-07 | A arquitetura do backend segue o fluxo `routes -> controllers -> services -> repositories`. Rotas delegam aos controllers; controllers tratam HTTP e validação básica; services concentram regras de negócio; repositories abstraem filesystem e metadados em memória. Camadas internas não dependem de Express ou de detalhes de apresentação. |
| RNF-08 | O frontend acessa a API por `fetch` com prefixo `/api`. No desenvolvimento, o proxy do Vite remove esse prefixo e encaminha a chamada ao backend local. A interface deve apresentar estados de carregamento, sucesso, lista vazia e erro para upload/listagem/download/exclusão. |
| RNF-09 | Os testes do backend usam o runner nativo `node:test`. Testes devem cobrir os contratos, validações, erros e limpeza em caso de falha; não exigem banco de dados ou armazenamento externo. |
| RNF-10 | O MVP sem autenticação é adequado apenas a um ambiente local ou confiável. A API não deve ser apresentada como multiusuário seguro: qualquer cliente com acesso ao serviço pode enviar, listar e baixar os documentos disponíveis. |

### Configuração inicial

| Variável | Padrão | Uso |
| --- | --- | --- |
| `PORT` | `3000` | Porta HTTP do backend. |
| `STORAGE_DIR` | `backend/storage` | Diretório local de destino dos arquivos. |
| `MAX_UPLOAD_SIZE_MB` | `10` | Tamanho máximo de um arquivo, em MiB. |
| `DMS_DEFAULT_OWNER` | `local` | Identificador lógico atribuído ao campo `owner`; não autentica nem identifica com segurança o cliente. |

## 5. Modelo de dados (metadados do documento)

Os metadados são registrados em memória após a gravação local do arquivo. O objeto abaixo é a representação pública retornada pela API; o caminho físico não faz parte dela.

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | string (UUID) | Sim | Identificador único gerado pelo servidor e usado nas rotas de consulta/download. |
| `originalName` | string | Sim | Nome original fornecido pelo cliente, preservado como metadado e tratado como dado não confiável. |
| `size` | number (inteiro) | Sim | Tamanho do conteúdo recebido, em bytes. |
| `uploadedAt` | string (ISO 8601 UTC) | Sim | Data e hora em que o upload foi concluído e registrado. |
| `owner` | string | Sim | Proprietário lógico do MVP, definido por `DMS_DEFAULT_OWNER` (padrão `local`); não é credencial nem mecanismo de autorização. |

Exemplo:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "originalName": "relatorio.pdf",
  "size": 2048,
  "uploadedAt": "2026-11-04T15:30:00.000Z",
  "owner": "local"
}
```

O identificador também determina o nome interno de armazenamento. O arquivo não usa o nome original como caminho. O backend é a autoridade para metadados; o cliente não pode escolher `id`, `size`, `uploadedAt`, `owner` ou o caminho físico.

## 6. Contratos de API

### Convenções

- As rotas Express do backend são `/upload`, `/documents`, `/documents/:id` e `/documents/:id/download`.
- O frontend chama essas rotas através de `/api`: por exemplo, `POST /api/upload`. O proxy de desenvolvimento do Vite remove `/api` antes de encaminhar ao backend.
- O prefixo `/api` é de integração do frontend; os contratos também podem ser chamados diretamente no backend sem esse prefixo.
- Os corpos JSON usam `application/json`; erros seguem o formato comum definido em RF-04.

### `POST /upload`

**Finalidade:** gravar um documento e registrar seus metadados.

**Requisição:** `multipart/form-data` com exatamente um arquivo no campo `file`.

| Campo | Tipo | Obrigatório | Regras |
| --- | --- | --- | --- |
| `file` | arquivo binário | Sim | Qualquer tipo; tamanho máximo configurado, padrão de 10 MiB. |

Exemplo de chamada pelo frontend: `POST /api/upload`.

**Sucesso - `201 Created`:** corpo JSON correspondente ao objeto de metadados do modelo de dados. Pode incluir `Location: /documents/{id}/download`.

**Erros:**

| Status | Código | Situação |
| --- | --- | --- |
| `400 Bad Request` | `FILE_REQUIRED` | Campo `file` ausente, vazio ou requisição multipart inválida. |
| `413 Payload Too Large` | `FILE_TOO_LARGE` | Arquivo ultrapassa o limite configurado. |
| `500 Internal Server Error` | `STORAGE_ERROR` | Falha ao criar diretório, gravar arquivo ou concluir o registro. O arquivo parcial/recém-gravado deve ser limpo quando possível. |

### `GET /documents`

**Finalidade:** listar metadados registrados no processo atual.

**Requisição:** sem corpo e sem parâmetros obrigatórios.

Exemplo de chamada pelo frontend: `GET /api/documents`.

**Sucesso - `200 OK`:** array JSON de objetos do modelo de metadados, ordenado por `uploadedAt` decrescente. Retorna array vazio quando não houver documentos registrados.

**Erros:**

| Status | Código | Situação |
| --- | --- | --- |
| `500 Internal Server Error` | `METADATA_ERROR` | Falha inesperada ao consultar o repositório em memória. |

### `DELETE /documents/:id`

**Finalidade:** remover um documento e seus metadados do processo atual.

**Requisição:** parâmetro `id` com UUID do documento; sem corpo.

Exemplo de chamada pelo frontend: `DELETE /api/documents/{id}`.

**Sucesso - `204 No Content`:** arquivo removido do filesystem local e metadados removidos da memória; resposta sem corpo.

**Erros:**

| Status | Código | Situação |
| --- | --- | --- |
| `404 Not Found` | `DOCUMENT_NOT_FOUND` | ID desconhecido ou sem metadados no processo atual. |
| `500 Internal Server Error` | `STORAGE_ERROR` | Falha ao remover o arquivo local. Os metadados permanecem disponíveis. |

### `GET /documents/:id/download`

**Finalidade:** baixar o arquivo associado a um identificador.

**Requisição:** parâmetro `id` com UUID do documento; sem corpo.

Exemplo de chamada pelo frontend: `GET /api/documents/{id}/download`.

**Sucesso - `200 OK`:** corpo binário transmitido como anexo, com `Content-Disposition: attachment` e nome original devidamente escapado. Usar `application/octet-stream` para o conteúdo, sem confiar no MIME informado pelo cliente. A resposta não inclui o caminho local.

**Erros:**

| Status | Código | Situação |
| --- | --- | --- |
| `404 Not Found` | `DOCUMENT_NOT_FOUND` | ID inválido/desconhecido, metadado ausente ou arquivo não encontrado no disco. |
| `500 Internal Server Error` | `STORAGE_ERROR` | Falha inesperada ao abrir ou transmitir o arquivo. |

## 7. Decisões arquiteturais

- A aplicação segue uma Clean Architecture simples no backend: routes, controllers, services e repositories, nessa direção de dependência.
- A persistência do conteúdo é responsabilidade do repositório de arquivos e usa filesystem local com Multer `diskStorage`; a persistência de metadados é responsabilidade do repositório em memória.
- A exclusão remove o arquivo do filesystem antes de remover o metadado, evitando ocultar um documento quando a operação de disco falha.
- O fluxo de upload só publica metadados depois que o arquivo é gravado. Falha ao registrar metadados deve disparar tentativa de remoção do arquivo recém-criado.
- A API nunca recebe do cliente um caminho de armazenamento e nunca usa `originalName` como nome físico do arquivo.
- O frontend é construído com componentes React e chama a API por uma camada de serviço baseada em `fetch`, usando `/api` como base no desenvolvimento.
- A ausência de autenticação é uma decisão deliberada do MVP, não uma garantia de segurança por usuário. `owner` existe para manter o modelo inicial e não deve ser usado para simular autorização.
- Reinícios do processo apagam o índice de metadados em memória. Recuperação de documentos no disco e persistência durável ficam fora do escopo atual.
- Não são introduzidos banco de dados, armazenamento externo, filas ou abstrações além das necessárias às camadas definidas.

## 8. Plano de execução

As etapas abaixo descrevem a implementação futura do produto em nível de entregável. Este documento não executa essas etapas nem altera arquivos de backend ou frontend.

1. **Estabelecer contratos e regras:** alinhar validação de upload, limites configuráveis, modelo de metadados, formato de erros e comportamento de limpeza em falhas.
2. **Implementar upload e armazenamento local:** configurar `diskStorage`, gerar IDs controlados pelo servidor, gravar arquivos no diretório local e registrar metadados em memória.
3. **Implementar consulta e download:** expor listagem ordenada e transmissão segura do arquivo pelo ID, tratando recursos ausentes e falhas de I/O.
4. **Construir a experiência de usuário:** permitir seleção e envio de arquivo, exibir resultado/erros, listar documentos disponíveis, baixar e excluir após confirmação.
5. **Integrar e validar o fluxo completo:** verificar contratos HTTP e estados da interface; cobrir sucesso, lista vazia, arquivo ausente, tamanho excedido, exclusão, falhas de armazenamento e reinício com perda de metadados.