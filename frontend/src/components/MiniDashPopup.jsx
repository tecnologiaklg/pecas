import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function MiniDashPopup({ onClose, vendedoresLista }) {
  const [activeTab, setActiveTab] = useState("resumo");
  const [filtroVendedorDash, setFiltroVendedorDash] = useState("");
  const [loadingDash, setLoadingDash] = useState(true);
  const [dashData, setDashData] = useState({ totalAtendimentos: 0, porVendedor: [] });
  const [ultimosItens, setUltimosItens] = useState([]);

  // Busca os dados assim que o componente aparecer na tela
  useEffect(() => {
    carregarDash();
  }, []);

  async function carregarDash() {
    setLoadingDash(true);
    try {
      const trintaDias = new Date();
      trintaDias.setDate(trintaDias.getDate() - 30);
      const dataBusca = trintaDias.toISOString();

      const { data: itensData, error: errItens } = await supabase
        .from('itens_faltantes')
        .select(`quantidade, descricao, cod_prod, conversas!inner (vendedor, dt_inclusao, codparceiro, cliente)`)
        .gte('conversas.dt_inclusao', dataBusca);

      if (errItens) throw errItens;

      const statsVendedores = itensData.reduce((acc, item) => {
        const nome = item.conversas.vendedor;
        const conversaId = item.conversas.dt_inclusao + nome;

        if (!acc[nome]) {
          acc[nome] = { atendimentosIds: new Set(), totalPeças: 0 };
        }

        acc[nome].atendimentosIds.add(conversaId); 
        acc[nome].totalPeças += parseInt(item.quantidade || 0);
        return acc;
      }, {});

      const listaVendedores = Object.entries(statsVendedores).map(([nome, dados]) => ({
        nome,
        atendimentos: dados.atendimentosIds.size,
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

  return (
    <div className="modal-overlay">
      <div className="modal-content dash-popup">
        <div className="dash-header">
          <h3>Mini Dash - Últimos 30 dias</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {activeTab === "itens" && (
              <select 
                className="select-filtro"
                value={filtroVendedorDash}
                onChange={(e) => setFiltroVendedorDash(e.target.value)}
              >
                <option value="">Todos os Vendedores</option>
                {vendedoresLista.map(v => (
                  <option key={v.codigo} value={v.nome}>{v.nome}</option>
                ))}
              </select>
            )}
            <button className="btn-close" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="dash-tabs">
          <button className={activeTab === "resumo" ? "active" : ""} onClick={() => setActiveTab("resumo")}>Resumo</button>
          <button className={activeTab === "itens" ? "active" : ""} onClick={() => setActiveTab("itens")}>Itens Faltantes</button>
        </div>

        <div className="dash-body">
          {loadingDash ? (
            <div className="loading-container"><p>Carregando dados do Supabase...</p></div>
          ) : activeTab === "resumo" ? (
            <div className="resumo-tab">
              <div className="resumo-header-cards">
                <p><strong>Total de Atendimentos:</strong> {dashData.totalAtendimentos}</p>
              </div>
              <h4>Ranking por Vendedor:</h4>
              <div className="lista-vendedores-dash">
                {dashData.porVendedor
                  .sort((a, b) => b.pecas - a.pecas)
                  .map((vendedorObj, idx) => (
                    <div key={idx} className="item-card-dash vendedor-stats">
                      <span className="nome-vendedor">{vendedorObj.nome}</span>
                      <div className="vendedor-metrias">
                        <div className="badge badge-atend">
                          <span className="badge-icon">📞 Atendimentos: </span>
                          <span className="badge-value">{vendedorObj.atendimentos} </span>
                        </div>
                        <div className="badge badge-pecas">
                          <span className="badge-icon">⚙️ Peças: </span>
                          <span className="badge-value">{vendedorObj.pecas}</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div className="itens-tab">
              <h4>Itens Faltantes (Últimos 30 dias)</h4>
              <div className="grid-header">
                <span>COD</span><span>DESCRIÇÃO</span><span>CLIENTE</span><span>VENDEDOR</span><span style={{ textAlign: 'center' }}>QTD</span>
              </div>
              <div className="lista-itens-dash">
                {ultimosItens.length > 0 ? (
                  ultimosItens
                    .filter(item => filtroVendedorDash === "" || item.conversas.vendedor === filtroVendedorDash)
                    .map((item, i) => (
                      <div key={i} className="item-card-dash grid-layout">
                        <span className="col-cod">{item.cod_prod || "---"}</span>
                        <span className="col-desc">{item.descricao}</span>
                        <span className="col-cliente">{item.conversas.codparceiro || "---"}</span>
                        <span className="col-vendedor">{item.conversas.vendedor}</span>
                        <span className="col-qtd">{item.quantidade}x</span>
                      </div>
                    ))
                ) : (
                  <p className="no-data">Nenhum item registrado.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}