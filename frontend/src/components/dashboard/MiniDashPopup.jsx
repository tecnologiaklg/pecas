import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import styles from "./MiniDashPopup.module.css";

export default function MiniDashPopup({ onClose, vendedoresLista }) {
  const [activeTab, setActiveTab] = useState("resumo");
  const [filtroVendedorDash, setFiltroVendedorDash] = useState("");
  const [loadingDash, setLoadingDash] = useState(true);
  const [dashData, setDashData] = useState({ totalAtendimentos: 0, porVendedor: [] });
  const [ultimosItens, setUltimosItens] = useState([]);
  const [ordemData, setOrdemData] = useState("desc");
    const formatarData = (isoString) => {
    if (!isoString) return "--/--";
    return new Date(isoString).toLocaleDateString("pt-BR");
    };
  // Busca os dados assim que o componente aparecer na tela
  useEffect(() => {
    carregarDash();
  }, []);

  async function carregarDash() {
    setLoadingDash(true);
    try {
      const trintaDias = new Date();
      trintaDias.setDate(trintaDias.getDate() - 90);
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

  const alternarOrdemData = () => {
  setOrdemData(ordemAtual => ordemAtual === 'desc' ? 'asc' : 'desc');
  };

  return (
    <div className={styles.overlay}>
      <div className={`${styles.modal} ${styles.dashPopup}`}>
        <div className={styles.dashHeader}>
          <h3>Mini Dash - Últimos 90 dias</h3>
          
          <div className={styles.headerRight}>
            {activeTab === "itens" && (
            <div className={styles.headerFilters}>
                {/* Botão de Ordenação */}
                <button 
                className={styles.btnFilter}
                onClick={() => setOrdemData(ordemData === "desc" ? "asc" : "desc")}
                title="Inverter Ordem"
                >
                {ordemData === "desc" ? "📅 Mais Novos" : "📅 Mais Antigos"}
                </button>

                <select 
                className={styles.selectFiltro}
                value={filtroVendedorDash}
                onChange={(e) => setFiltroVendedorDash(e.target.value)}
                >
                <option value="">Todos os Vendedores</option>
                {vendedoresLista.map(v => (
                    <option key={v.codigo} value={v.nome}>{v.nome}</option>
                ))}
                </select>
            </div>
            )}
            <button className={styles.btnClose} onClick={onClose}>×</button>
          </div>
        </div>

        <div className={styles.dashTabs}>
          <button
            className={`${styles.tabBtn} ${activeTab === "resumo" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("resumo")}
          >
            Resumo
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === "itens" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("itens")}
          >
            Itens Faltantes
          </button>
        </div>

        <div className={styles.dashBody}>
          {loadingDash ? (
            <div className={styles.loadingContainer}><p>Carregando dados do Supabase...</p></div>
          ) : activeTab === "resumo" ? (
            <div className={styles.resumoTab}>
              <div>
                <p><strong>Total de Atendimentos:</strong> {dashData.totalAtendimentos}</p>
              </div>
              <h4>Ranking por Vendedor:</h4>
              <div className={styles.listaVendedores}>
                {dashData.porVendedor
                  .sort((a, b) => b.pecas - a.pecas)
                  .map((vendedorObj, idx) => (
                    <div key={idx} className={styles.cardDash}>
                      <span className={styles.nomeVendedor}>{vendedorObj.nome}</span>
                      <div className={styles.vendedorMetrias}>
                        <div className={styles.badge}>
                          <span>📞 Atendimentos: </span>
                          <span className={styles.badgeValue}>{vendedorObj.atendimentos} </span>
                        </div>
                        <div className={styles.badge}>
                          <span>⚙️ Peças: </span>
                          <span className={styles.badgeValue}>{vendedorObj.pecas}</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div className={styles.itensTab}>
              <h4>Itens Faltantes (Últimos 90 dias)</h4>
              <div className={styles.gridHeader}>
                <span>DATA</span><span>COD</span><span>DESCRIÇÃO</span><span>CLIENTE</span><span>VENDEDOR</span><span style={{ textAlign: 'center' }}>QTD</span>
              </div>
              <div className={styles.listaItensDash}>
                {ultimosItens.length > 0 ? (
                  ultimosItens
                    .filter(item => filtroVendedorDash === "" || item.conversas.vendedor === filtroVendedorDash)
                    .sort((a, b) => {
                    const dataA = new Date(a.conversas.dt_inclusao).getTime();
                    const dataB = new Date(b.conversas.dt_inclusao).getTime();

                    if (ordemData === 'desc') {
                      return dataB - dataA; // Mais novos primeiro
                    } else {
                      return dataA - dataB; // Mais antigos primeiro
                    }
                  })
                    .map((item, i) => (
                      <div key={i} className={styles.gridRow}>
                        <span className={styles.colData}>{formatarData(item.conversas.dt_inclusao)}</span>
                        <span className={styles.colCod}>{item.cod_prod || "---"}</span>
                        <span className={styles.colDesc} title={item.descricao}>{item.descricao}</span>
                        <span className={styles.colCliente}>{item.conversas.codparceiro || "---"}</span>
                        <span className={styles.colVendedor}>{item.conversas.vendedor}</span>
                        <span className={styles.colQtd}>{item.quantidade}x</span>
                      </div>
                    ))
                ) : (
                  <p className={styles.noData}>Nenhum item registrado.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}