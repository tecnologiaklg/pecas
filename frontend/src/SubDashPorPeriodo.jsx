import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const SubDashPorPeriodo = () => {
  const [stats, setStats] = useState({ totalConversas: 0, totalItens: 0 });
  // Agora stats15Dias armazena a lista real de objetos
  const [stats15Dias, setStats15Dias] = useState({ totalConversas: 0, itens: [] });
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);

  const hoje = new Date();
  const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();
  const data15DiasAtras = new Date(new Date().setDate(hoje.getDate() - 15)).toISOString();

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Stats do Mês (Contagem rápida)
      const { count: convMes } = await supabase.from("conversas").select("*", { count: "exact", head: true }).gte("dt_inclusao", primeiroDiaMes);
      const { count: itensMes } = await supabase.from("itens_faltantes").select("id, conversas!inner(dt_inclusao)", { count: "exact", head: true }).gte("conversas.dt_inclusao", primeiroDiaMes);

      // Busca detalhada dos últimos 15 dias para o Popup
      const { count: conv15 } = await supabase.from("conversas").select("*", { count: "exact", head: true }).gte("dt_inclusao", data15DiasAtras);
      
      // Aqui buscamos os dados dos itens e não apenas o count
      const { data: itensData, error: errItens } = await supabase
        .from("itens_faltantes")
        .select("descricao, quantidade, cod_prod, conversas!inner(dt_inclusao)")
        .gte("conversas.dt_inclusao", data15DiasAtras);

      if (errItens) throw errItens;

      setStats({ totalConversas: convMes || 0, totalItens: itensMes || 0 });
      setStats15Dias({ 
        totalConversas: conv15 || 0, 
        itens: itensData || [] 
      });

      const jaViu = localStorage.getItem("vistoPopup15Dias");
      if (jaViu !== hoje.toLocaleDateString()) {
        setShowPopup(true);
      }
    } catch (error) {
      console.error("Erro ao puxar dados:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const fecharPopup = () => {
    localStorage.setItem("vistoPopup15Dias", hoje.toLocaleDateString());
    setShowPopup(false);
  };

  return (
    <>
      <div className="sub-dash-container">
        <div className="dash-card">
          <span className="dash-label">Atendimentos (Mês)</span>
          <span className="dash-value">{loading ? "..." : stats.totalConversas}</span>
        </div>
        <div className="dash-card highlighted">
          <span className="dash-label">Peças Faltantes</span>
          <span className="dash-value">{loading ? "..." : stats.totalItens}</span>
        </div>
        
        <div className="dash-controls">
          <button className="btn-dash-trigger" onClick={() => setShowPopup(true)} title="Ver resumo 15 dias">📊</button>
          <button className="btn-refresh" onClick={fetchStats} title="Atualizar">🔄</button>
        </div>
      </div>

      {showPopup && (
        <div className="modal-overlay">
          <div className="modal-content popup-15dias">
            <div className="popup-header">
              <h3>🚀 Resumo Últimos 15 Dias</h3>
              <p>Foram <strong>{stats15Dias.totalConversas}</strong> atendimentos no período</p>
            </div>
            
            <div className="popup-body list-mode">
              <div className="popup-scroll-area">
                {stats15Dias.itens.length > 0 ? (
                  <table className="popup-table">
                    <thead>
                      <tr>
                        <th>Qtd</th>
                        <th>Descrição</th>
                        <th>Código</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats15Dias.itens.map((item, index) => (
                        <tr key={index}>
                          <td className="col-qty">{item.quantidade}x</td>
                          <td className="col-desc">{item.descricao}</td>
                          <td className="col-cod">{item.cod_prod || "---"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="no-data">Nenhuma peça registrada.</p>
                )}
              </div>
            </div>

            <button className="btn-entendido" onClick={fecharPopup}>ENTENDIDO</button>
          </div>
        </div>
      )}
    </>
  );
};

export default SubDashPorPeriodo;