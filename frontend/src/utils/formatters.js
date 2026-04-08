export const aplicarMascaraTelefone = (valor) => {
  valor = valor.replace(/\D/g, ""); 
  if (valor.length > 11) valor = valor.slice(0, 11); 

  if (valor.length > 10) {
    return valor.replace(/^(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  } else if (valor.length > 6) {
    return valor.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  } else if (valor.length > 2) {
    return valor.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
  } else {
    return valor.length > 0 ? `(${valor}` : valor;
  }
};