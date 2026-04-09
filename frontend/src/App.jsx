import { useState } from "react";
import { supabase } from "./supabaseClient";
import styles from "./App.module.css";

// Importando os componentes que separamos
import { Combobox, ExportModal, MiniDashPopup } from "./components";

// Importando as constantes e utilitários
import { vendedoresLista } from "./utils/constants";
import { aplicarMascaraTelefone } from "./utils/formatters";
import { useClock } from "./hooks/useClock";
import { useTheme } from "./hooks/useTheme";

function App() {
  // --- ESTADOS DE INTERFACE ---
  const hora = useClock();
  const { theme, toggle: toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDashPopup, setShowDashPopup] = useState(false);

  // --- ESTADOS DO FORMULÁRIO ---
  const [form, setForm] = useState({
    funcionario: "",
    cod_func: "",
    cliente: "",
    codParceiro: "",
    contato: "",
    link: ""
  });

  const [itens, setItens] = useState([]);
  const [novoItem, setNovoItem] = useState({
    descricao: "",
    quantidade: 1,
    cod_prod: ""
  });

  // --- LÓGICA DE MANIPULAÇÃO ---
  const disableReadOnly = (e) => { e.target.readOnly = false; };

  function handleChange(e) {
    const { name, value } = e.target;
    let valorFormatado = value;

    if (name === "codParceiro") {
      valorFormatado = value.replace(/\D/g, "").slice(0, 5);
    } else if (name === "contato") {
      valorFormatado = aplicarMascaraTelefone(value); // Utils
    } else if (name === "link") {
      valorFormatado = value;
    } else {
      valorFormatado = value.toUpperCase();
    }

    setForm({ ...form, [name]: valorFormatado });
  }

  function handleItemChange(e) {
    const { name, value } = e.target;
    let valorFormatado = (name === "cod_prod")
      ? value.replace(/\D/g, "").slice(0, 5)
      : value.toUpperCase();

    setNovoItem({ ...novoItem, [name]: valorFormatado });
  }

  function addItem() {
    if (!novoItem.descricao.trim()) return alert("A descrição é obrigatória!");
    setItens([...itens, novoItem]);
    setNovoItem({ descricao: "", quantidade: 1, cod_prod: "" });
  }

  // --- COMUNICAÇÃO COM SUPABASE ---
  async function registrar() {
    if (!form.funcionario.trim() || !form.contato.trim()) {
      return alert("Preencha Funcionário e Contato.");
    }
    if (itens.length === 0) return alert("Adicione pelo menos um item.");

    setLoading(true);
    try {
      // 1. Inserir na tabela 'conversas'
      const { data: conversa, error: errConv } = await supabase
        .from('conversas')
        .insert([{
          vendedor: form.funcionario,
          cod_func: form.cod_func,
          cliente: form.cliente,
          codparceiro: form.codParceiro ? parseInt(form.codParceiro) : null,
          contato: form.contato,
          url: form.link
        }])
        .select().single();

      if (errConv) throw errConv;

      // 2. Inserir Itens Faltantes em Lote
      const itensParaInserir = itens.map(item => ({
        conversa_id: conversa.id,
        descricao: item.descricao,
        quantidade: parseInt(item.quantidade),
        cod_prod: item.cod_prod
      }));

      const { error: errItems } = await supabase
        .from('itens_faltantes')
        .insert(itensParaInserir);

      if (errItems) throw errItems;

      alert("Registro concluído com sucesso!");
      setItens([]);
      setForm({ funcionario: "", cod_func: "", cliente: "", codParceiro: "", contato: "", link: "" });

    } catch (error) {
      alert("Erro ao registrar: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      {/* Modais Organizados */}
      {showDashPopup && (
        <MiniDashPopup 
          onClose={() => setShowDashPopup(false)} 
          vendedoresLista={vendedoresLista} 
        />
      )}

      {showExportModal && (
        <ExportModal onClose={() => setShowExportModal(false)} />
      )}

      <header className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.titulo}>Peças Faltantes</h1>
          <div className={styles.acoesHeader}>
            <button className={styles.btn} onClick={toggleTheme} title="Alternar tema">
              {theme === "light" ? "🌙 Escuro" : "☀️ Claro"}
            </button>
            <button className={styles.btn} onClick={() => setShowDashPopup(true)}>
              📊 Mini Dash
            </button>
            <button className={styles.btn} onClick={() => setShowExportModal(true)}>
              📊 Exportar
            </button>
          </div>
        </div>
        <div className={styles.hora}>{hora.toLocaleTimeString()}</div>
      </header>

      <section className={styles.secaoDados}>
        <form className={styles.formulario} autoComplete="off">
          <label className={styles.label}>Funcionário (obrigatório)</label>
          <Combobox
            value={form.funcionario}
            onChange={(nome, codigo) => setForm({ ...form, funcionario: nome, cod_func: codigo })}
            lista={vendedoresLista}
          />
          
          <label className={styles.label}>Cliente</label>
          <input className={styles.input} name="cliente" value={form.cliente} onChange={handleChange} placeholder="Cliente" onFocus={disableReadOnly} readOnly />

          <div className={styles.rowInputs}>
            <div className={styles.inputBox}>
              <label className={styles.label}>Cód. Parceiro</label>
              <input className={styles.input} name="codParceiro" value={form.codParceiro} onChange={handleChange} placeholder="12345" onFocus={disableReadOnly} readOnly />
            </div>
            <div className={styles.inputBox}>
              <label className={styles.label}>Contato (obrigatório)</label>
              <input className={styles.input} name="contato" value={form.contato} onChange={handleChange} placeholder="(12) 99999-9999" onFocus={disableReadOnly} readOnly />
            </div>
          </div>

          <label className={styles.label}>Link da Conversa</label>
          <input className={styles.input} name="link" value={form.link} onChange={handleChange} placeholder="https://klg.zapplataforma.chat/tickets/..." onFocus={disableReadOnly} readOnly />
        </form>
      </section>

      <section className={styles.secaoItens}>
        <h3 className={styles.tituloItens}>Itens Faltantes (mínimo: 1)</h3>
        <div className={styles.itemInputGroup}>
          <input className={styles.input} type="number" min="1" value={novoItem.quantidade} onChange={(e) => setNovoItem({ ...novoItem, quantidade: e.target.value })} />
          <input className={styles.input} name="cod_prod" placeholder="Código" value={novoItem.cod_prod} onChange={handleItemChange} onFocus={disableReadOnly} readOnly />
          <input className={styles.input} name="descricao" placeholder="Descrição (obrigatório)" value={novoItem.descricao} onChange={handleItemChange} onFocus={disableReadOnly} readOnly />
          <button className={styles.btnAdd} onClick={addItem}>+</button>
        </div>

        <div className={styles.listaItens}>
          {itens.map((item, i) => (
            <div className={styles.itemCard} key={i}>
              <span className={styles.itemCodText}>{item.cod_prod || "---"}</span>
              <span className={styles.itemDescText} title={item.descricao}>{item.descricao}</span>
              <span className={styles.itemTag}>{item.quantidade}x</span>
              <button onClick={() => setItens(itens.filter((_, idx) => idx !== i))} className={styles.btnRemover}>×</button>
            </div>
          ))}
        </div>
      </section>

      <button className={styles.btnRegistrar} onClick={registrar} disabled={loading}>
        {loading ? "SALVANDO..." : "FINALIZAR REGISTRO"}
      </button>
    </div>
  );
}

export default App;