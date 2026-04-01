import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";
import "./App.css";

function Combobox({ value, onChange, lista }) {
  const [open, setOpen] = useState(false);
  const [filtro, setFiltro] = useState(value || "");
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const listRef = useRef(null); // Referência para a <ul>
  const itemsRef = useRef([]); // Referência para os itens <li>

  useEffect(() => {
    setFiltro(value || "");
  }, [value]);

  const resultados = lista.filter(v =>
    v.codigo.startsWith(filtro) || v.nome.toLowerCase().startsWith(filtro.toLowerCase())
  );

  // Garante que o scroll acompanhe a seleção das setas
  useEffect(() => {
    if (open && itemsRef.current[selectedIndex]) {
      itemsRef.current[selectedIndex].scrollIntoView({
        block: "nearest", // Move apenas o necessário para aparecer
        behavior: "smooth"
      });
    }
  }, [selectedIndex, open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filtro]);

  const selecionar = (vendedor) => {
    setFiltro(vendedor.nome);
    onChange(vendedor.nome, vendedor.codigo);
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") setOpen(true);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev < resultados.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (resultados.length > 0) {
        selecionar(resultados[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="custom-combobox" style={{ position: 'relative' }}>
      <input
        type="text"
        placeholder="Digite código ou nome"
        value={filtro}
        onKeyDown={handleKeyDown}
        onChange={(e) => {
          setFiltro(e.target.value);
          setOpen(true);
          if (e.target.value === "") onChange("", "");
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setTimeout(() => setOpen(false), 200);
        }}
      />
      
      {open && resultados.length > 0 && (
        <ul 
          className="options" 
          ref={listRef} // Atribui a referência da lista
          style={{ 
            position: 'absolute', 
            zIndex: 1000, 
            width: '100%', 
            background: 'var(--input-bg)',
            maxHeight: '200px', 
            overflowY: 'auto',
            border: '1px solid var(--accent)',
            borderRadius: '8px',
            padding: 0, 
            margin: '5px 0 0 0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
          }}
        >
          {resultados.map((v, index) => (
            <li
              key={v.codigo}
              ref={el => itemsRef.current[index] = el} // Atribui a referência de cada item
              onMouseDown={(e) => {
                e.preventDefault(); 
                selecionar(v);
              }}
              style={{ 
                padding: '10px', 
                cursor: 'pointer', 
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--text-main)',
                backgroundColor: index === selectedIndex ? 'rgba(0, 242, 255, 0.2)' : 'transparent'
              }}
            >
              <strong style={{ color: 'var(--accent)' }}>{v.codigo}</strong> - {v.nome}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function App() {
  const [hora, setHora] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDashPopup, setShowDashPopup] = useState(false);
  const [activeTab, setActiveTab] = useState("resumo"); // "resumo" ou "itens"
  const [dashData, setDashData] = useState({ totalAtendimentos: 0, porVendedor: [] });
  const [ultimosItens, setUltimosItens] = useState([]);
  const [loadingDash, setLoadingDash] = useState(false);
    
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0]);
  const [dataFim, setDataFim] = useState(new Date().toISOString().split('T')[0]);

  const [form, setForm] = useState({
    funcionario: "",
    cliente: "",
    codParceiro: "", 
    contato: "",
    link: "" 
  });

  const buscarFuncionario = (input) => {
  input = input.trim().toLowerCase();

  // Sugestões pelo código ou pelo nome
  return vendedoresLista.filter(v => 
    v.codigo.startsWith(input) || v.nome.toLowerCase().startsWith(input)
  );
};

  const [novoItem, setNovoItem] = useState({
    descricao: "",
    quantidade: 1,
    cod_prod: "" 
  });

  const vendedoresLista = [
  { codigo: "31", nome: "Larissa" },
  { codigo: "55", nome: "Junior" },
  { codigo: "140", nome: "Duda" },
  { codigo: "154", nome: "João" },
  { codigo: "155", nome: "Bryan" }
];

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

 async function carregarDash() {
  setLoadingDash(true);
  try {
    const trintaDias = new Date();
    trintaDias.setDate(trintaDias.getDate() - 30);
    const dataBusca = trintaDias.toISOString();

    // Busca os itens vinculados às conversas dos últimos 30 dias
    const { data: itensData, error: errItens } = await supabase
      .from('itens_faltantes')
      .select(`
        quantidade, 
        descricao, 
        cod_prod, 
        conversas!inner (vendedor, dt_inclusao)
      `)
      .gte('conversas.dt_inclusao', dataBusca);

    if (errItens) throw errItens;

    // Processamento de dados
      const statsVendedores = itensData.reduce((acc, item) => {
      const nome = item.conversas.vendedor;
      
      // Criamos um ID único para a conversa (usando a data de inclusão ou ID se tiver)
      // para garantir que 1 conversa com 5 itens conte como apenas 1 atendimento
      const conversaId = item.conversas.dt_inclusao + nome;

      if (!acc[nome]) {
        acc[nome] = { atendimentosIds: new Set(), totalPeças: 0 };
      }

      // Adiciona o ID ao Set (Set ignora duplicatas automaticamente)
      acc[nome].atendimentosIds.add(conversaId); 
      
      // Soma a quantidade real de peças do item
      acc[nome].totalPeças += parseInt(item.quantidade || 0);
      
      return acc;
    }, {});

    // Formata para o estado usando o .size do Set para os atendimentos
    const listaVendedores = Object.entries(statsVendedores).map(([nome, dados]) => ({
      nome,
      atendimentos: dados.atendimentosIds.size, // Aqui pegamos a contagem única
      pecas: dados.totalPeças
    }));

    setDashData({ 
      totalAtendimentos: new Set(itensData.map(i => i.conversas.dt_inclusao)).size, 
      porVendedor: listaVendedores 
    });
    setUltimosItens(itensData);

  } catch (error) {
    alert("Erro ao carregar dash: " + error.message);
  } finally {
    setLoadingDash(false);
  }
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
          cod_func: form.cod_func, // Adicionado aqui
          cliente: form.cliente, 
          codparceiro: form.codParceiro ? parseInt(form.codParceiro) : null,
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
        conversas!inner (vendedor, cod_func, cliente, codparceiro, contato, url, dt_inclusao)
      `) // Ajustado para cod_func aqui
      .gte('conversas.dt_inclusao', `${dataInicio}T00:00:00`)
      .lte('conversas.dt_inclusao', `${dataFim}T23:59:59`);

    if (error) throw error;
    if (!data || data.length === 0) return alert("Nenhum dado encontrado.");

    const cabecalho = ["Data", "Cód. Vend", "Vendedor", "Cliente", "Cod. Parceiro", "Contato", "Cod Prod", "Descricao", "Qtd", "Link"];
    
    const linhas = data.map(item => [
      new Date(item.conversas.dt_inclusao).toLocaleDateString('pt-BR'),
      item.conversas.cod_func || "", // Puxando o valor de cod_func
      item.conversas.vendedor,
      item.conversas.cliente,
      item.conversas.codparceiro,
      item.conversas.contato,
      item.cod_prod || "",
      item.descricao,
      item.quantidade,
      item.conversas.url || ""
    ]);

    // Gera o conteúdo do CSV com separador ponto e vírgula (padrão Excel Brasil)
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
      {/* Popup do Mini Dash */}
      {showDashPopup && (
        <div className="modal-overlay">
          <div className="modal-content dash-popup">
            <div className="dash-header">
              <h3>Mini Dash - Últimos 30 dias</h3>
              <button className="btn-close" onClick={() => setShowDashPopup(false)}>×</button>
            </div>

            <div className="dash-tabs">
              <button className={activeTab === "resumo" ? "active" : ""} onClick={() => setActiveTab("resumo")}>Resumo</button>
              <button className={activeTab === "itens" ? "active" : ""} onClick={() => setActiveTab("itens")}>Itens Faltantes</button>
            </div>

            <div className="dash-body">
              {loadingDash ? (
                <div className="loading-container">
                  <p>Carregando dados do Supabase...</p>
                </div>
              ) : activeTab === "resumo" ? (
                <div className="resumo-tab">
                  <div className="resumo-header-cards">
                    <p><strong>Total de Atendimentos:</strong> {dashData.totalAtendimentos}</p>
                  </div>

                  <h4>Ranking por Vendedor:</h4>
                  <div className="lista-vendedores-dash">
                    {/* Ordenando por quem vendeu mais peças */}
                    {dashData.porVendedor
                      .sort((a, b) => b.pecas - a.pecas)
                      .map((vendedorObj, idx) => (
                        <div key={idx} className="item-card-dash vendedor-stats">
                          <span className="nome-vendedor">{vendedorObj.nome}</span>
                          <div className="vendedor-metrias">
                            <div className="badge badge-atend">
                              <span className="badge-icon">📞</span>
                              <span className="badge-value">{vendedorObj.atendimentos}</span>
                              <span className="badge-label"> Atendimentos</span>
                            </div>
                            <div className="badge badge-pecas">
                              <span className="badge-icon">⚙️</span>
                              <span className="badge-value">{vendedorObj.pecas}</span>
                              <span className="badge-label"> Peças</span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="itens-tab">
                  <h4>Itens Faltantes (Últimos 30 dias)</h4>
                  <div className="lista-itens-dash">
                    {ultimosItens.length > 0 ? (
                      ultimosItens.map((item, i) => (
                        <div key={i} className="item-card-dash">
                          <span className="item-cod-text">{item.cod_prod || "---"}</span>
                          <span className="item-desc-text">{item.descricao}</span>
                          <span className="item-tag-qty">{item.quantidade}x</span>
                        </div>
                      ))
                    ) : (
                      <p className="no-data">Nenhum item registrado nos últimos 30 dias.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

<header>
  <div className="header-top">
    <h1>Peças Faltantes</h1>
    <div style={{ display: 'flex', gap: '10px' }}>
      {/* Botão agora com classe e alinhado */}
      <button 
        className="btn-mini-dash" 
        onClick={() => {
          carregarDash(); // Busca os dados no Supabase
          setShowDashPopup(true); // Abre o popup
        }}
      >
        📊 Mini Dash
      </button>
      <button className="btn-open-export" onClick={() => setShowExportModal(true)}>
        📊 Exportar
      </button>
    </div>
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
       <label>Funcionário (obrigatório)</label>
        <Combobox
          value={form.funcionario} // Importante para o reset funcionar
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
          <input name="link" value={form.link} onChange={handleChange} placeholder="https://wa.me/..." onFocus={disableReadOnly} readOnly />
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