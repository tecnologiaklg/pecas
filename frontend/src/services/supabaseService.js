import { supabase } from "../supabaseClient";

export const supabaseService = {
  // Busca as métricas para o Dashboard (variável)
  buscarDadosDashboard: async (dias = 90) => {
    const dataAlvo = new Date();
    dataAlvo.setDate(dataAlvo.getDate() - dias);
    const dataBusca = dataAlvo.toISOString();

    const { data: itensData, error: errItens } = await supabase
      .from('itens_faltantes')
      .select(`quantidade, descricao, cod_prod, conversas!inner (vendedor, dt_inclusao, codparceiro, cliente)`)
      .gte('conversas.dt_inclusao', dataBusca);

    if (errItens) throw errItens;
    return itensData;
  },

  // Insere uma nova conversa e repassa os itens de forma serializada 
  registrarAtendimento: async (form, itens) => {
    // 1. Inserir na tabela 'conversas'
    const { data: conversa, error: errConv } = await supabase
      .from('conversas')
      .insert([{
        vendedor: form.funcionario,
        cod_func: form.cod_func,
        cliente: form.cliente,
        codparceiro: form.codParceiro ? parseInt(form.codParceiro) : null,
        contato: form.contato,
        url: form.link
      }])
      .select().single();

    if (errConv) throw errConv;

    // 2. Inserir Itens Faltantes em Lote
    const itensParaInserir = itens.map(item => ({
      conversa_id: conversa.id,
      descricao: item.descricao,
      quantidade: parseInt(item.quantidade),
      cod_prod: item.cod_prod
    }));

    const { error: errItems } = await supabase
      .from('itens_faltantes')
      .insert(itensParaInserir);

    if (errItems) throw errItems;

    return conversa;
  }
};
