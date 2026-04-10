import { useState, useEffect, useRef } from "react";
import styles from "./Combobox.module.css";

export default function Combobox({ value, onChange, lista }) {
    
  const [open, setOpen] = useState(false);
  const [filtro, setFiltro] = useState(value || "");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const listRef = useRef(null); // Referência para a <ul>
  const itemsRef = useRef([]); // Referência para os itens <li>

  useEffect(() => {
    if (!open) {
      setFiltro(value || "");
    } else if (value && filtro === "") {
      setFiltro(value);
    }
  }, [value, open]);

  const resultados = lista.filter(v =>
    v.codigo.startsWith(filtro) || v.nome.toLowerCase().startsWith(filtro.toLowerCase())
  );

  // Garante que o scroll acompanhe a seleção das setas
  useEffect(() => {
    if (open && itemsRef.current[selectedIndex]) {
      itemsRef.current[selectedIndex].scrollIntoView({
        block: "nearest", // Move apenas o necessário para aparecer
        behavior: "smooth"
      });
    }
  }, [selectedIndex, open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filtro]);

  const selecionar = (vendedor) => {
    setFiltro(vendedor.nome);
    onChange(vendedor.nome, vendedor.codigo);
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") setOpen(true);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev < resultados.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (resultados.length > 0) {
        selecionar(resultados[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className={styles.root}>
      <input
        type="text"
        placeholder="Digite código ou nome"
        className={styles.input}
        value={filtro}
        onKeyDown={handleKeyDown}
        onChange={(e) => {
          setFiltro(e.target.value);
          setOpen(true);
          if (e.target.value === "") onChange("", "");
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setTimeout(() => {
            if (open && filtro) {
              const exactMatch = lista.find(v => 
                v.codigo.toLowerCase() === filtro.toLowerCase() || 
                v.nome.toLowerCase() === filtro.toLowerCase()
              );
              if (exactMatch) {
                selecionar(exactMatch);
                return;
              }
            }
            setOpen(false);
          }, 200);
        }}
      />
      
      {open && resultados.length > 0 && (
        <ul 
          className={styles.options}
          ref={listRef} // Atribui a referência da lista
        >
          {resultados.map((v, index) => (
            <li
              key={v.codigo}
              ref={el => itemsRef.current[index] = el} // Atribui a referência de cada item
              onMouseDown={(e) => {
                e.preventDefault(); 
                selecionar(v);
              }}
              className={`${styles.option} ${index === selectedIndex ? styles.optionSelected : ""}`}
            >
              <strong className={styles.codigo}>{v.codigo}</strong> - {v.nome}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}