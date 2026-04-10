import { useClock } from "../../hooks/useClock";
import { useTheme } from "../../hooks/useTheme";
import styles from "../../App.module.css";

export function Header({ setShowDashPopup, setShowExportModal }) {
  const hora = useClock();
  const { theme, toggle: toggleTheme } = useTheme();

  return (
    <header className={styles.header}>
      <div className={styles.headerTop}>
        <h1 className={styles.titulo}>Peças Faltantes</h1>
        <div className={styles.acoesHeader}>
          <button className={styles.btn} onClick={toggleTheme} title="Alternar tema">
            {theme === "light" ? "🌙 Escuro" : "☀️ Claro"}
          </button>
          <button className={styles.btn} onClick={() => setShowDashPopup(true)}>
            📊 Mini Dash
          </button>
          <button className={styles.btn} onClick={() => setShowExportModal(true)}>
            📊 Exportar
          </button>
        </div>
      </div>
      <div className={styles.hora}>{hora.toLocaleTimeString()}</div>
    </header>
  );
}
