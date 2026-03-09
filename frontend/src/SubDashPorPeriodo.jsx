import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const SubDashPorPeriodo = () => {
  const [stats, setStats] = useState({ totalConversas: 0, totalItens: 0 });
  const [stats15Dias, setStats15Dias] = useState({ totalConversas: 0, itens: [] });
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [isVisible, setIsVisible] = useState(false); // Controle de recolher

  const hoje = new Date();
  const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();
  const data15DiasAtras = new Date(new Date().setDate(hoje.getDate() - 15)).toISOString();

  const fetchStats = async () => {
    try {
      setLoading(true);
      const { count: convMes } = await supabase.from("conversas").select("*", { count: "exact", head: true }).gte("dt_inclusao", primeiroDiaMes);
      const { count: itensMes } = await supabase.from("itens_faltantes").select("id, conversas!inner(dt_inclusao)", { count: "exact", head: true }).gte("conversas.dt_inclusao", primeiroDiaMes);

      const { count: conv15 } = await supabase.from("conversas").select("*", { count: "exact", head: true }).gte("dt_inclusao", data15DiasAtras);
      const { data: itensData, error: errItens } = await supabase
        .from("itens_faltantes")
        .select("descricao, quantidade, cod_prod, conversas!inner(dt_inclusao)")
        .gte("conversas.dt_inclusao", data15DiasAtras);

      if (errItens) throw errItens;

      setStats({ totalConversas: convMes || 0, totalItens: itensMes || 0 });
      setStats15Dias({ totalConversas: conv15 || 0, itens: itensData || [] });

      const jaViu = localStorage.getItem("vistoPopup15Dias");
      if (jaViu !== hoje.toLocaleDateString()) {
        setShowPopup(true);
      }
    } catch (error) {
      console.error(error);
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
    <div className={`sub-dash-wrapper ${isVisible ? "expanded" : "collapsed"}`}>
      <button 
        className="btn-toggle-dash" 
        onClick={() => setIsVisible(!isVisible)}
      >
        {isVisible ? "▲ Recolher Dashboard" : "▼ Mostrar Dashboard"}
      </button>

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
          <button className="btn-dash-trigger" onClick={() => setShowPopup(true)}>📊</button>
          <button className="btn-refresh" onClick={fetchStats}>🔄</button>
        </div>
      </div>

      {showPopup && (
        <div className="modal-overlay">
          <div className="modal-content popup-15dias">
            <div className="popup-header">
              <h3>🚀 Itens Faltantes (15 Dias)</h3>
              <p>Total de <strong>{stats15Dias.totalConversas}</strong> atendimentos</p>
            </div>
            <div className="popup-scroll-area">
              <table className="popup-table">
                <thead>
                  <tr>
                    <th>Qtd</th>
                    <th>Descrição</th>
                    <th>Código</th>
                  </tr>
                </thead>
                <tbody>
                  {stats15Dias.itens.map((item, idx) => (
                    <tr key={idx}>
                      <td className="col-qty">{item.quantidade}x</td>
                      <td className="col-desc">{item.descricao}</td>
                      <td className="col-cod">{item.cod_prod || "---"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="btn-entendido" onClick={fecharPopup}>ENTENDIDO</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubDashPorPeriodo;