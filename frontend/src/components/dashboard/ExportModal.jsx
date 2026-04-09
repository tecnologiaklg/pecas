import { useState } from "react";
import { supabase } from "../../supabaseClient";
import styles from "./ExportModal.module.css";

export default function ExportModal({ onClose }) {
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0]);
  const [dataFim, setDataFim] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  async function exportarPlanilha() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('itens_faltantes')
        .select(`
          quantidade, cod_prod, descricao,
          conversas!inner (vendedor, cod_func, cliente, codparceiro, contato, url, dt_inclusao)
        `)
        .gte('conversas.dt_inclusao', `${dataInicio}T00:00:00`)
        .lte('conversas.dt_inclusao', `${dataFim}T23:59:59`);

      if (error) throw error;
      if (!data || data.length === 0) return alert("Nenhum dado encontrado.");

      const cabecalho = ["Data", "Cód. Vend", "Vendedor", "Cliente", "Cod. Parceiro", "Contato", "Cod Prod", "Descricao", "Qtd", "Link"];
      
      const linhas = data.map(item => [
        new Date(item.conversas.dt_inclusao).toLocaleDateString('pt-BR'),
        item.conversas.cod_func || "",
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
      
      onClose(); // Fecha o modal após baixar
    } catch (error) {
      alert("Erro na exportação: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3 className={styles.titulo}>Exportar Relatório</h3>
        
        <div className={styles.inputs}>
          <label>
            Data Inicial
            <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
          </label>
          
          <label>
            Data Final
            <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
          </label>
        </div>

        <div className={styles.actions}>
          <button className={styles.btnCancelar} onClick={onClose}>
            CANCELAR
          </button>
          <button className={styles.btnBaixar} onClick={exportarPlanilha} disabled={loading}>
            {loading ? "GERANDO..." : "BAIXAR CSV"}
          </button>
        </div>
      </div>
    </div>
  );
}