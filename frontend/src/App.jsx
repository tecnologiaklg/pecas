import { useState } from "react";
import styles from "./App.module.css";
import { supabaseService } from "./services/supabaseService";

import { ExportModal, MiniDashPopup } from "./components/dashboard";
import { Header, AtendimentoForm, ListaItensFaltantes } from "./components/ui";
import { vendedoresLista } from "./utils/constants";

function App() {
  const [loading, setLoading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDashPopup, setShowDashPopup] = useState(false);

  const [form, setForm] = useState({
    funcionario: "",
    cod_func: "",
    cliente: "",
    codParceiro: "",
    contato: "",
    link: ""
  });

  const [itens, setItens] = useState([]);

  async function registrar() {
    if (!form.funcionario.trim() || !form.contato.trim()) {
      return alert("Preencha Funcionário e Contato.");
    }
    if (itens.length === 0) return alert("Adicione pelo menos um item.");

    setLoading(true);
    try {
      await supabaseService.registrarAtendimento(form, itens);
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
    <div className={styles.container}>
      {showDashPopup && (
        <MiniDashPopup 
          onClose={() => setShowDashPopup(false)} 
          vendedoresLista={vendedoresLista} 
        />
      )}

      {showExportModal && (
        <ExportModal onClose={() => setShowExportModal(false)} />
      )}

      <Header 
        setShowDashPopup={setShowDashPopup} 
        setShowExportModal={setShowExportModal} 
      />

      <AtendimentoForm form={form} setForm={setForm} />

      <ListaItensFaltantes itens={itens} setItens={setItens} />

      <button className={styles.btnRegistrar} onClick={registrar} disabled={loading}>
        {loading ? "SALVANDO..." : "FINALIZAR REGISTRO"}
      </button>
    </div>
  );
}

export default App;