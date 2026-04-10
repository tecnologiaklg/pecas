import { useState, useEffect } from "react";
import { supabaseService } from "../../services/supabaseService";
import styles from "./MiniDashPopup.module.css";

export function MiniDashPopup({ onClose, vendedoresLista }) {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem("dashPref_activeTab") || "resumo");
  const [periodoDias, setPeriodoDias] = useState(() => {
    const saved = localStorage.getItem("dashPref_periodoDias");
    return saved ? Number(saved) : 90;
  });
  const [filtroVendedorDash, setFiltroVendedorDash] = useState(() => localStorage.getItem("dashPref_filtroVendedorDash") || "");
  const [filtroCodProduto, setFiltroCodProduto] = useState(() => localStorage.getItem("dashPref_filtroCodProduto") || "");
  const [filtroNomePeca, setFiltroNomePeca] = useState(() => localStorage.getItem("dashPref_filtroNomePeca") || "");
  const [filtroCliente, setFiltroCliente] = useState(() => localStorage.getItem("dashPref_filtroCliente") || "");
  const [loadingDash, setLoadingDash] = useState(true);
  const [dashData, setDashData] = useState({ totalAtendimentos: 0, porVendedor: [] });
  const [ultimosItens, setUltimosItens] = useState([]);
  const [ordemData, setOrdemData] = useState(() => localStorage.getItem("dashPref_ordemData") || "desc");

  useEffect(() => {
    localStorage.setItem("dashPref_activeTab", activeTab);
    localStorage.setItem("dashPref_periodoDias", periodoDias);
    localStorage.setItem("dashPref_filtroVendedorDash", filtroVendedorDash);
    localStorage.setItem("dashPref_filtroCodProduto", filtroCodProduto);
    localStorage.setItem("dashPref_filtroNomePeca", filtroNomePeca);
    localStorage.setItem("dashPref_filtroCliente", filtroCliente);
    localStorage.setItem("dashPref_ordemData", ordemData);
  }, [activeTab, periodoDias, filtroVendedorDash, filtroCodProduto, filtroNomePeca, filtroCliente, ordemData]);

  const formatarData = (isoString) => {
    if (!isoString) return "--/--";
    return new Date(isoString).toLocaleDateString("pt-BR");
  };

  useEffect(() => {
    carregarDash();
  }, [periodoDias]);

  async function carregarDash() {
    setLoadingDash(true);
    try {
      const itensData = await supabaseService.buscarDadosDashboard(periodoDias);

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
        totalPecas: listaVendedores.reduce((acc, obj) => acc + obj.pecas, 0),
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
          <div className={styles.headerLeft}>
            <h3>Mini Dash</h3>
            <select 
              className={styles.selectPeriodo} 
              value={periodoDias}
              onChange={(e) => setPeriodoDias(Number(e.target.value))}
            >
              <option value={7}>Últimos 7 dias</option>
              <option value={15}>Últimos 15 dias</option>
              <option value={30}>Últimos 30 dias</option>
              <option value={90}>Últimos 3 meses</option>
              <option value={180}>Últimos 6 meses</option>
              <option value={365}>Último ano</option>
            </select>
          </div>
          
          <div className={styles.headerRight}>
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
              
              <div className={styles.heroCards}>
                <div className={styles.heroCard}>
                  <div className={styles.heroIcon}>📞</div>
                  <div className={styles.heroInfo}>
                    <span className={styles.heroLabel}>Atendimentos Totais</span>
                    <strong className={styles.heroValue}>{dashData.totalAtendimentos}</strong>
                  </div>
                </div>

                <div className={styles.heroCard}>
                  <div className={styles.heroIcon}>⚙️</div>
                  <div className={styles.heroInfo}>
                    <span className={styles.heroLabel}>Peças Requisitadas</span>
                    <strong className={styles.heroValue}>{dashData.totalPecas || 0}</strong>
                  </div>
                </div>

                <div className={styles.heroCard} style={{ borderColor: 'var(--accent)', background: 'rgba(0, 242, 255, 0.05)' }}>
                  <div className={styles.heroIcon}>🥇</div>
                  <div className={styles.heroInfo}>
                    <span className={styles.heroLabel}>Top Vendedor(a)</span>
                    <strong className={styles.heroValue}>
                      {dashData.porVendedor.length > 0 
                        ? dashData.porVendedor.sort((a, b) => b.pecas - a.pecas)[0].nome 
                        : "---"}
                    </strong>
                  </div>
                </div>
              </div>

              <h4>Ranking Geral</h4>
              <div className={styles.listaVendedores}>
                {dashData.porVendedor
                  .sort((a, b) => b.pecas - a.pecas)
                  .map((vendedorObj, idx) => {
                    const arrayOrdenado = dashData.porVendedor.sort((a, b) => b.pecas - a.pecas);
                    const maiorPecas = arrayOrdenado.length > 0 ? arrayOrdenado[0].pecas : 1; 
                    const progresso = (vendedorObj.pecas / maiorPecas) * 100;
                    
                    let medalha = '';
                    if (idx === 0) medalha = '🥇';
                    else if (idx === 1) medalha = '🥈';
                    else if (idx === 2) medalha = '🥉';
                    else medalha = <span className={styles.rankNum}>#{idx + 1}</span>;

                    return (
                      <div key={idx} className={styles.cardDashPremium}>
                        <div className={styles.dashRankMetrica}>
                          <div className={styles.rankMedal}>{medalha}</div>
                          <span className={styles.nomeVendedor}>{vendedorObj.nome}</span>
                        </div>
                        
                        <div className={styles.rankBarContainer}>
                          <div className={styles.rankBarFill} style={{ width: `${progresso}%` }}></div>
                        </div>

                        <div className={styles.vendedorMetrias}>
                          <div className={styles.badgePremium}>
                            <span>📞</span>
                            <span className={styles.badgeValue}>{vendedorObj.atendimentos}</span>
                          </div>
                          <div className={styles.badgePremium} style={{ background: 'var(--accent)', color: '#000', borderColor: 'var(--accent)' }}>
                            <span style={{ color: '#000' }}>⚙️</span>
                            <span className={styles.badgeValue} style={{ color: '#000' }}>{vendedorObj.pecas}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          ) : (
            <div className={styles.itensTab}>
              <div className={styles.filterBarPremium}>
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>BUSCAR POR CÓDIGO</label>
                  <input
                    type="text"
                    className={styles.inputFiltroPremium}
                    placeholder="Ex: 54321..."
                    value={filtroCodProduto}
                    onChange={(e) => setFiltroCodProduto(e.target.value.toUpperCase())}
                  />
                </div>

                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>BUSCAR POR PEÇA</label>
                  <input
                    type="text"
                    className={styles.inputFiltroPremium}
                    placeholder="Nome da peça..."
                    value={filtroNomePeca}
                    onChange={(e) => setFiltroNomePeca(e.target.value.toUpperCase())}
                  />
                </div>
                
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>BUSCAR POR CLIENTE</label>
                  <input
                    type="text"
                    className={styles.inputFiltroPremium}
                    placeholder="Cód ou Nome..."
                    value={filtroCliente}
                    onChange={(e) => setFiltroCliente(e.target.value.toUpperCase())}
                  />
                </div>

                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>VENDEDOR</label>
                  <select 
                    className={styles.selectFiltroPremium}
                    value={filtroVendedorDash}
                    onChange={(e) => setFiltroVendedorDash(e.target.value)}
                  >
                    <option value="">Todos os Vendedores</option>
                    {vendedoresLista.map(v => (
                      <option key={v.codigo} value={v.nome}>{v.nome}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.filterGroup} style={{ flex: '0 1 auto' }}>
                  <label className={styles.filterLabel}>ORDENAÇÃO</label>
                  <button 
                    className={styles.btnFilterPremium}
                    onClick={() => setOrdemData(ordemData === "desc" ? "asc" : "desc")}
                    title="Inverter Ordem"
                  >
                    {ordemData === "desc" ? "🔻 MAIS NOVOS" : "🔺 MAIS ANTIGOS"}
                  </button>
                </div>
              </div>

              <div className={styles.gridHeader}>
                <span>DATA</span><span>COD</span><span>DESCRIÇÃO</span><span>CLIENTE</span><span>VENDEDOR</span><span style={{ textAlign: 'center' }}>QTD</span>
              </div>
              <div className={styles.listaItensDash}>
                {ultimosItens.length > 0 ? (
                  ultimosItens
                    .filter(item => filtroVendedorDash === "" || item.conversas.vendedor === filtroVendedorDash)
                    .filter(item => filtroCodProduto === "" || (item.cod_prod && String(item.cod_prod).includes(filtroCodProduto)))
                    .filter(item => filtroNomePeca === "" || (item.descricao && item.descricao.toUpperCase().includes(filtroNomePeca)))
                    .filter(item => filtroCliente === "" || (item.conversas.codparceiro && String(item.conversas.codparceiro).includes(filtroCliente)))
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