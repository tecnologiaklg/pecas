# Peças Faltantes (Frontend)

Este é um aplicativo frontend desenvolvido em **React** com **Vite**. O objetivo principal da aplicação é servir como uma ferramenta interna para o registro de "Peças Faltantes" atreladas a conversas/atendimentos. 

Através de uma interface limpa, o usuário pode selecionar o funcionário (vendedor), preencher os dados do cliente e do contato, colar o link de um atendimento (ex: plataforma Zappy) e listar os itens/peças que estão em falta. Ao publicar, os dados são salvos em um banco de dados **Supabase**.

---

## 🛠️ Tecnologias Utilizadas

*   **React 19 & Vite 7:** Ferramentas base para a construção e o rápido empacotamento da interface e componentes de UI.
*   **Supabase (v2.99.0):** Utilizado como Backend-as-a-Service (BaaS) para o armazenamento e acesso ao banco de dados relacional.
*   **Axios:** Para requisições HTTP adicionais ou integrações via API.
*   **CSS Modules e Vanilla CSS:** A estilização adota uma arquitetura baseada em `tokens.css`, variáveis globais e `App.module.css` para o encapsulamento de estilos dos componentes.

---

## 📂 Arquitetura e Estrutura de Pastas

O projeto segue uma arquitetura modularizada que facilita a escalabilidade e a manutenção:

*   **`src/components/`**: Módulos de UI reutilizáveis. Possui diretórios como `dashboard` e `ui`, guardando componentes como:
    *   `Combobox`: Seleção customizada do vendedor.
    *   `ExportModal`: Modal focado na exportação rápida dos dados registrados.
    *   `MiniDashPopup`: Um pop-up visual para análise simplificada de estatísticas.
*   **`src/hooks/`**: Custom hooks do React para abstração de lógica (`useClock`, `useTheme`).
*   **`src/styles/`**: Arquivos puros de CSS que declaram estilos em nível superior (`app.css`, `base.css`, `global.css`, `tokens.css`).
*   **`src/utils/`**: Funções puras e de conveniência global (`constants.js`, `formatters.js`).

---

## ⚙️ Funcionalidades Principais Mapeadas

1.  **Formulário de Atendimento e Cliente:**
    *   Coleta detalhes como Funcionário/Vendedor, Cliente, Código do Parceiro, Contato (telefone) e Link.
    *   Inclui máscaras de validação em tempo de execução (caixa-alta, limites e máscaras de telefone).
2.  **Lista Dinâmica de Itens Faltantes:**
    *   O usuário constrói uma lista local das peças informando Quantidade, Código do Produto e Descrição.
3.  **Persistência Relacional Integrada com Supabase:**
    *   No ato de "Finalizar Registro", a aplicação cria o registro `conversas` e ensere *em lote* as peças na tabela `itens_faltantes`.
4.  **Interface Interativa:**
    *   Modais de Dashboard Miniatura e Exportação.
    *   Suporte a **Dark Mode**.

---

## 🚀 Como rodar localmente

Clone o repositório, navegue até a pasta frontend e execute:

```bash
# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

> **Nota:** Certifique-se de configurar e exportar suas variáveis de ambiente do banco de dados (Supabase) dentro de `src/supabaseClient.js` ou num arquivo `.env` dedicado.
