import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import "./App.css";

// Importando os componentes que separamos
import Combobox from "./components/Combobox";
import ExportModal from "./components/ExportModal";
import MiniDashPopup from "./components/MiniDashPopup";

// Importando as constantes e utilitários
import { vendedoresLista } from "./utils/constants";
import { aplicarMascaraTelefone } from "./utils/formatters";

function App() {
  // --- ESTADOS DE INTERFACE ---
  const [hora, setHora] = useState(new Date());
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

  // --- EFEITOS ---
  useEffect(() => {
    const interval = setInterval(() => setHora(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

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
    <div className="container">
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

      <header>
        <div className="header-top">
          <h1>Peças Faltantes</h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-mini-dash" onClick={() => setShowDashPopup(true)}>
              📊 Mini Dash
            </button>
            <button className="btn-open-export" onClick={() => setShowExportModal(true)}>
              📊 Exportar
            </button>
          </div>
        </div>
        <div className="hora">{hora.toLocaleTimeString()}</div>
      </header>

      <section className="secao-dados">
        <form className="formulario" autoComplete="off">
          <label>Funcionário (obrigatório)</label>
          <Combobox
            value={form.funcionario}
            onChange={(nome, codigo) => setForm({ ...form, funcionario: nome, cod_func: codigo })}
            lista={vendedoresLista}
          />
          
          <label>Cliente</label>
          <input name="cliente" value={form.cliente} onChange={handleChange} placeholder="Cliente" onFocus={disableReadOnly} readOnly />

          <div className="row-inputs">
            <div className="input-box">
              <label>Cód. Parceiro</label>
              <input name="codParceiro" value={form.codParceiro} onChange={handleChange} placeholder="12345" onFocus={disableReadOnly} readOnly />
            </div>
            <div className="input-box">
              <label>Contato (obrigatório)</label>
              <input name="contato" value={form.contato} onChange={handleChange} placeholder="(12) 34567-8901" onFocus={disableReadOnly} readOnly />
            </div>
          </div>

          <label>Link da Conversa</label>
          <input name="link" value={form.link} onChange={handleChange} placeholder="https://klg.zapplataforma.chat/tickets/..." onFocus={disableReadOnly} readOnly />
        </form>
      </section>

      <section className="secao-itens">
        <h3>Itens Faltantes (mínimo: 1)</h3>
        <div className="item-input-group">
          <input className="input-qtd" type="number" min="1" value={novoItem.quantidade} onChange={(e) => setNovoItem({ ...novoItem, quantidade: e.target.value })} />
          <input className="input-cod" name="cod_prod" placeholder="Código" value={novoItem.cod_prod} onChange={handleItemChange} onFocus={disableReadOnly} readOnly />
          <input className="input-desc" name="descricao" placeholder="Descrição (obrigatório)" value={novoItem.descricao} onChange={handleItemChange} onFocus={disableReadOnly} readOnly />
          <button className="btn-add" onClick={addItem}>+</button>
        </div>

        <div className="lista-itens">
          {itens.map((item, i) => (
            <div className="item-card" key={i}>
              <span className="item-cod-text">{item.cod_prod || "---"}</span>
              <span className="item-desc-text">{item.descricao}</span>
              <span className="item-tag">{item.quantidade}x</span>
              <button onClick={() => setItens(itens.filter((_, idx) => idx !== i))} className="btn-remover">×</button>
            </div>
          ))}
        </div>
      </section>

      <button className="btn-registrar" onClick={registrar} disabled={loading}>
        {loading ? "SALVANDO..." : "FINALIZAR REGISTRO"}
      </button>
    </div>
  );
}

export default App;