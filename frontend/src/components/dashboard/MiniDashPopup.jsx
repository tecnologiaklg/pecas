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
  const [analiseData, setAnaliseData] = useState({
    tendenciaAtendimentos: 0,
    tendenciaPecas: 0,
    hotList: [],
    clientesAfetados: [],
    periodoAtual: "",
    periodoAnterior: ""
  });

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
      // Busca dobro do período para cálculo de tendências (Bio-Temporal)
      const todosItens = await supabaseService.buscarDadosDashboard(periodoDias * 2);

      const agora = new Date();
      const corte = new Date();
      corte.setDate(agora.getDate() - periodoDias);
      const dataCorte = corte.toISOString();

      // Separação dos períodos
      const itensAtuais = todosItens.filter(i => i.conversas.dt_inclusao >= dataCorte);
      const itensAnteriores = todosItens.filter(i => i.conversas.dt_inclusao < dataCorte);

      // 1. Processamento para aba Resumo (Período Atual)
      const statsVendedores = itensAtuais.reduce((acc, item) => {
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

      const totalAtendAtuais = new Set(itensAtuais.map(i => i.conversas.dt_inclusao + i.conversas.vendedor)).size;
      const totalPecasAtuais = listaVendedores.reduce((acc, obj) => acc + obj.pecas, 0);

      setDashData({
        totalAtendimentos: totalAtendAtuais,
        totalPecas: totalPecasAtuais,
        porVendedor: listaVendedores
      });
      setUltimosItens(itensAtuais);

      // 2. Processamento de Tendências (Análise de Impacto)
      const totalAtendAnteriores = new Set(itensAnteriores.map(i => i.conversas.dt_inclusao + i.conversas.vendedor)).size;
      const totalPecasAnteriores = itensAnteriores.reduce((acc, i) => acc + parseInt(i.quantidade || 0), 0);

      const calcularTendencia = (atual, anterior) => {
        if (anterior === 0) return atual > 0 ? 100 : 0;
        return ((atual - anterior) / anterior) * 100;
      };

      // 3. Hot List (Top 5 Itens Faltantes)
      const hotListMap = itensAtuais.reduce((acc, item) => {
        const desc = item.descricao || "SEM DESCRIÇÃO";
        acc[desc] = (acc[desc] || 0) + parseInt(item.quantidade || 0);
        return acc;
      }, {});

      const hotList = Object.entries(hotListMap)
        .map(([descricao, total]) => ({ descricao, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      // 4. Clientes Mais Afetados
      const clientesMap = itensAtuais.reduce((acc, item) => {
        const key = item.conversas.codparceiro;
        if (!key) return acc;

        if (!acc[key]) acc[key] = { total: 0 };
        acc[key].total += parseInt(item.quantidade || 0);
        return acc;
      }, {});

      const clientesAfetados = Object.entries(clientesMap)
        .map(([codigo, dados]) => ({ codigo, total: dados.total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      const formatLocal = (d) => d.toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit' });
      const periodoAtualStr = `${formatLocal(corte)} até ${formatLocal(agora)}`;

      const inicioAnterior = new Date(corte);
      inicioAnterior.setDate(inicioAnterior.getDate() - periodoDias);
      const periodoAnteriorStr = `${formatLocal(inicioAnterior)} até ${formatLocal(corte)}`;

      setAnaliseData({
        tendenciaAtendimentos: calcularTendencia(totalAtendAtuais, totalAtendAnteriores),
        tendenciaPecas: calcularTendencia(totalPecasAtuais, totalPecasAnteriores),
        hotList,
        clientesAfetados,
        periodoAtual: periodoAtualStr,
        periodoAnterior: periodoAnteriorStr
      });

    } catch (error) {
      console.error("Erro ao carregar dash:", error);
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
            <h3>Dash</h3>
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
            <button
              className={styles.btnReload}
              onClick={carregarDash}
              title="Recarregar Dados"
              disabled={loadingDash}
            >
              🔄
            </button>
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
            className={`${styles.tabBtn} ${activeTab === "analise" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("analise")}
          >
            Análise de Impacto
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
          ) : activeTab === "analise" ? (
            <div className={styles.analiseTab}>
              <div className={styles.trendCards}>
                <div className={`${styles.trendCard} ${analiseData.tendenciaPecas > 0 ? styles.trendBad : styles.trendGood}`}>
                  <span className={styles.trendValue}>
                    {analiseData.tendenciaPecas > 0 ? "+" : ""}{analiseData.tendenciaPecas.toFixed(1)}%
                  </span>
                  <div className={styles.trendInfo}>
                    <span className={styles.trendLabel}>Tendência de Peças</span>
                    <small className={styles.trendSub}>vs período anterior</small>
                  </div>
                </div>
              </div>

              <div className={styles.analiseGrids}>
                <div className={styles.analiseSection}>
                  <h4>Top 5 itens mais pedidos que estão em falta</h4>
                  <div className={styles.hotList}>
                    {analiseData.hotList.length > 0 ? analiseData.hotList.map((item, idx) => {
                      const max = analiseData.hotList[0].total;
                      const percent = (item.total / max) * 100;
                      return (
                        <div key={idx} className={styles.hotListItem}>
                          <div className={styles.hotListInfo}>
                            <span>{item.descricao}</span>
                            <strong>{item.total}x</strong>
                          </div>
                          <div className={styles.hotListBarContainer}>
                            <div className={styles.hotListBarFill} style={{ width: `${percent}%` }}></div>
                          </div>
                        </div>
                      )
                    }) : <p className={styles.noDataText}>Nenhum dado disponível.</p>}
                  </div>
                </div>

                <div className={styles.analiseSection}>
                  <h4>👥 Clientes Mais Afetados</h4>
                  <div className={styles.rankList}>
                    {analiseData.clientesAfetados.length > 0 ? analiseData.clientesAfetados.map((cli, idx) => (
                      <div key={idx} className={styles.rankListItem}>
                        <div className={styles.rankListPos}>#{idx + 1}</div>
                        <div className={styles.rankListData}>
                          <span className={styles.rankListClient}>Cod: {cli.codigo}</span>
                          <span className={styles.rankListTotal}>{cli.total} peças faltantes</span>
                        </div>
                      </div>
                    )) : <p className={styles.noDataText}>Nenhum dado disponível.</p>}
                  </div>
                </div>
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