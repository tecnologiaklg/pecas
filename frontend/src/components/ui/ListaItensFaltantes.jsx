import { useState } from "react";
import styles from "../../App.module.css";

export function ListaItensFaltantes({ itens, setItens }) {
  const [novoItem, setNovoItem] = useState({ descricao: "", quantidade: 1, cod_prod: "" });
  const disableReadOnly = (e) => { e.target.readOnly = false; };

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

  return (
    <section className={styles.secaoItens}>
      <h3 className={styles.tituloItens}>Itens Faltantes (mínimo: 1)</h3>
      <div className={styles.itemInputGroup}>
        <input className={styles.input} type="number" min="1" value={novoItem.quantidade} onChange={(e) => setNovoItem({ ...novoItem, quantidade: e.target.value })} />
        <input className={styles.input} name="cod_prod" placeholder="Código" value={novoItem.cod_prod} onChange={handleItemChange} onFocus={disableReadOnly} readOnly />
        <input className={styles.input} name="descricao" placeholder="Descrição (obrigatório)" value={novoItem.descricao} onChange={handleItemChange} onFocus={disableReadOnly} readOnly />
        <button className={styles.btnAdd} onClick={addItem}>+</button>
      </div>

      <div className={styles.listaItens}>
        {itens.map((item, i) => (
          <div className={styles.itemCard} key={i}>
            <span className={styles.itemCodText}>{item.cod_prod || "---"}</span>
            <span className={styles.itemDescText} title={item.descricao}>{item.descricao}</span>
            <span className={styles.itemTag}>{item.quantidade}x</span>
            <button onClick={() => setItens(itens.filter((_, idx) => idx !== i))} className={styles.btnRemover}>×</button>
          </div>
        ))}
      </div>
    </section>
  );
}
