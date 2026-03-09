import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import SubDashPorPeriodo from "./SubDashPorPeriodo";
import "./App.css";

function App() {
  const [hora, setHora] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0]);
  const [dataFim, setDataFim] = useState(new Date().toISOString().split('T')[0]);

  const [form, setForm] = useState({
    funcionario: "",
    cliente: "",
    codParceiro: "", 
    contato: "",
    link: "" 
  });

  const [novoItem, setNovoItem] = useState({
    descricao: "",
    quantidade: 1,
    cod_prod: "" 
  });

  const [itens, setItens] = useState([]);

  // Relógio em tempo real
  useEffect(() => {
    const interval = setInterval(() => setHora(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Função para remover o readOnly (comum em apps mobile para evitar zoom indesejado)
  const disableReadOnly = (e) => {
    e.target.readOnly = false;
  };

  const aplicarMascaraTelefone = (valor) => {
    valor = valor.replace(/\D/g, ""); 
    if (valor.length > 11) valor = valor.slice(0, 11); 

    if (valor.length > 10) {
      return valor.replace(/^(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    } else if (valor.length > 6) {
      return valor.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
    } else if (valor.length > 2) {
      return valor.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
    } else {
      return valor.length > 0 ? `(${valor}` : valor;
    }
  };

  function handleChange(e) {
    const { name, value } = e.target;
    let valorFormatado = value;

    if (name === "codParceiro") {
      valorFormatado = value.replace(/\D/g, "").slice(0, 5);
    } else if (name === "contato") {
      valorFormatado = aplicarMascaraTelefone(value);
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

  async function registrar() {
    if (!form.funcionario.trim() || !form.cliente.trim() || !form.codParceiro.trim()) {
      return alert("Preencha os campos obrigatórios do cabeçalho.");
    }
    if (itens.length === 0) return alert("Adicione pelo menos um item.");

    setLoading(true);
    try {
      // 1. Inserir na tabela 'conversas'
      const { data: conversa, error: errConv } = await supabase
        .from('conversas')
        .insert([{ 
          vendedor: form.funcionario, 
          cliente: form.cliente, 
          codparceiro: parseInt(form.codParceiro), 
          contato: form.contato,
          url: form.link 
        }])
        .select().single();

      if (errConv) throw errConv;
      
      // 2. Inserir Itens Faltantes em Lote (Mais eficiente que um loop de inserts)
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
      setForm({ funcionario: "", cliente: "", codParceiro: "", contato: "", link: "" });

    } catch (error) {
      alert("Erro ao registrar: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function exportarPlanilha() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('itens_faltantes')
        .select(`
          quantidade, cod_prod, descricao,
          conversas!inner (vendedor, cliente, codparceiro, contato, url, dt_inclusao)
        `)
        .gte('conversas.dt_inclusao', `${dataInicio}T00:00:00`)
        .lte('conversas.dt_inclusao', `${dataFim}T23:59:59`);

      if (error) throw error;
      if (!data || data.length === 0) return alert("Nenhum dado encontrado.");

      const cabecalho = ["Data", "Vendedor", "Cliente", "Cod. Parceiro", "Contato", "Cod Prod", "Descricao", "Qtd", "Link"];
      const linhas = data.map(item => [
        new Date(item.conversas.dt_inclusao).toLocaleDateString('pt-BR'),
        item.conversas.vendedor,
        item.conversas.cliente,
        item.conversas.codparceiro,
        item.conversas.contato,
        item.cod_prod || "",
        item.descricao,
        item.quantidade,
        item.conversas.url || ""
      ]);

      const csvContent = [cabecalho, ...linhas].map(e => e.join(";")).join("\n");
      const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
      const urlBlob = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = urlBlob;
      link.download = `relatorio_${dataInicio}_a_${dataFim}.csv`;
      link.click();
      setShowExportModal(false);
    } catch (error) {
      alert("Erro na exportação: " + error.message);
    } finally {
      setLoading(false);
    }
  }
  return (

    
    <div className="container">

      <SubDashPorPeriodo />

      <header>
        <div className="header-top">
          <h1>Controle de Peças Faltantes</h1>
          <button className="btn-open-export" onClick={() => setShowExportModal(true)}>📊 Exportar</button>
        </div>
        <div className="hora">{hora.toLocaleTimeString()}</div>
      </header>

            {showExportModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Exportar Relatório</h3>
            
            <div className="modal-inputs">
              <label>
                Data Inicial
                <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
              </label>
              
              <label>
                Data Final
                <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
              </label>
            </div>

            <div className="modal-actions">
              <button className="btn-cancelar" onClick={() => setShowExportModal(false)}>
                CANCELAR
              </button>
              <button className="btn-baixar" onClick={exportarPlanilha} disabled={loading}>
                {loading ? "GERANDO..." : "BAIXAR CSV"}
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="secao-dados">
        <form className="formulario" autoComplete="off">
          <label>Funcionário</label>
          <input name="funcionario" value={form.funcionario} onChange={handleChange} placeholder="NOME VENDEDOR" onFocus={disableReadOnly} readOnly />
          
          <label>Cliente</label>
          <input name="cliente" value={form.cliente} onChange={handleChange} placeholder="NOME CLIENTE" onFocus={disableReadOnly} readOnly />

          <div className="row-inputs">
            <div className="input-box">
              <label>Cód. Parceiro</label>
              <input name="codParceiro" value={form.codParceiro} onChange={handleChange} placeholder="00000" onFocus={disableReadOnly} readOnly />
            </div>
            <div className="input-box">
              <label>Contato</label>
              <input name="contato" value={form.contato} onChange={handleChange} placeholder="(00) 00000-0000" onFocus={disableReadOnly} readOnly />
            </div>
          </div>

          <label>Link da Conversa</label>
          <input name="link" value={form.link} onChange={handleChange} placeholder="https://wa.me/..." onFocus={disableReadOnly} readOnly />
        </form>
      </section>

      <section className="secao-itens">
        <h3>Itens Faltantes</h3>
        <div className="item-input-group">
          <input className="input-qtd" type="number" min="1" value={novoItem.quantidade} onChange={(e) => setNovoItem({ ...novoItem, quantidade: e.target.value })} />
          <input className="input-cod" name="cod_prod" placeholder="CÓD" value={novoItem.cod_prod} onChange={handleItemChange} onFocus={disableReadOnly} readOnly />
          <input className="input-desc" name="descricao" placeholder="DESCRIÇÃO" value={novoItem.descricao} onChange={handleItemChange} onFocus={disableReadOnly} readOnly />
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