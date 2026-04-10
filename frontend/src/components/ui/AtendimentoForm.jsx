import styles from "../../App.module.css";
import Combobox from "./Combobox";
import { vendedoresLista } from "../../utils/constants";
import { aplicarMascaraTelefone } from "../../utils/formatters";

export function AtendimentoForm({ form, setForm }) {
  const disableReadOnly = (e) => { e.target.readOnly = false; };

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

  return (
    <section className={styles.secaoDados}>
      <form className={styles.formulario} autoComplete="off">
        <label className={styles.label}>Funcionário (obrigatório)</label>
        <Combobox
          value={form.funcionario}
          onChange={(nome, codigo) => setForm({ ...form, funcionario: nome, cod_func: codigo })}
          lista={vendedoresLista}
        />
        
        <label className={styles.label}>Cliente</label>
        <input className={styles.input} name="cliente" value={form.cliente} onChange={handleChange} placeholder="Cliente" onFocus={disableReadOnly} readOnly />

        <div className={styles.rowInputs}>
          <div className={styles.inputBox}>
            <label className={styles.label}>Cód. Parceiro</label>
            <input className={styles.input} name="codParceiro" value={form.codParceiro} onChange={handleChange} placeholder="12345" onFocus={disableReadOnly} readOnly />
          </div>
          <div className={styles.inputBox}>
            <label className={styles.label}>Contato (obrigatório)</label>
            <input className={styles.input} name="contato" value={form.contato} onChange={handleChange} placeholder="(12) 99999-9999" onFocus={disableReadOnly} readOnly />
          </div>
        </div>

        <label className={styles.label}>Link da Conversa</label>
        <input className={styles.input} name="link" value={form.link} onChange={handleChange} placeholder="https://klg.zapplataforma.chat/tickets/..." onFocus={disableReadOnly} readOnly />
      </form>
    </section>
  );
}
