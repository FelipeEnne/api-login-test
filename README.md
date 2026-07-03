# Login React

Aplicação de demonstração de autenticação em React com Redux, roteamento protegido e uma API simulada no navegador.

## Funcionalidades

- Login e registro de usuários
- Rotas protegidas (acesso à home apenas autenticado)
- Listagem e exclusão de usuários cadastrados
- Sessão persistida via token e `localStorage`
- Senhas armazenadas com hash SHA-256 no backend simulado

## Tecnologias

- [React](https://react.dev/) 18
- [Redux](https://redux.js.org/) + [Redux Toolkit](https://redux-toolkit.js.org/)
- [React Router](https://reactrouter.com/) v5
- [Vite](https://vitejs.dev/) 6

## Pré-requisitos

- [Node.js](https://nodejs.org/) (versão LTS recomendada)

## Instalação

```bash
npm install
```

## Scripts disponíveis

### `npm start`

Inicia o servidor de desenvolvimento em [http://localhost:3000](http://localhost:3000). A página recarrega automaticamente ao editar os arquivos.

### `npm run build`

Gera a versão de produção na pasta `build/`.

### `npm run serve`

Serve localmente o build de produção para validação antes do deploy.

## Como usar

1. Execute `npm start`.
2. Acesse `/register` para criar uma conta.
3. Faça login em `/login`.
4. Na home (`/`), visualize e exclua usuários cadastrados.

Os dados ficam no `localStorage` do navegador (`users` e `tokens`). Para recomeçar do zero, limpe o armazenamento local do site.

## Estrutura do projeto

```
src/
├── App/              # Componente raiz e rotas
├── HomePage/         # Página autenticada (lista de usuários)
├── LoginPage/        # Formulário de login
├── RegisterPage/     # Formulário de cadastro
├── _actions/         # Action creators do Redux
├── _components/      # Componentes compartilhados (ex.: PrivateRoute)
├── _constants/       # Constantes das actions
├── _helpers/         # Store, history, auth-header e fake backend
├── _reducers/        # Reducers do Redux
└── _services/        # Chamadas HTTP à API simulada
```

## API simulada

O arquivo `src/_helpers/fake-backend.js` intercepta chamadas `fetch` e simula um backend REST com delay de 500 ms. Endpoints disponíveis:

| Método | Endpoint               | Descrição                          | Autenticação |
|--------|------------------------|------------------------------------|--------------|
| POST   | `/users/authenticate`  | Login (retorna token de sessão)    | Não          |
| POST   | `/users/register`      | Cadastro de novo usuário           | Não          |
| GET    | `/users`               | Lista todos os usuários            | Bearer token |
| GET    | `/users/:id`           | Busca usuário por ID               | Bearer token |
| DELETE | `/users/:id`           | Remove usuário                     | Bearer token |

O token é enviado no header `Authorization: Bearer <token>` após o login.

## Licença

Projeto privado para fins de estudo e testes.
