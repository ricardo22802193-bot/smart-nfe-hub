import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { NFe, Fornecedor, Produto, ProdutoNFe, HistoricoPedido, Contato, DespesasProduto } from '@/types/nfe';
import { v4 as uuidv4 } from 'uuid';

// Convert database row to NFe type
function dbNFeToNFe(row: any, fornecedor: Fornecedor, produtos: ProdutoNFe[]): NFe {
  return {
    id: row.id,
    chaveAcesso: row.chave_acesso,
    numero: row.numero,
    serie: row.serie,
    dataEmissao: new Date(row.data_emissao),
    fornecedor,
    produtos,
    valorTotal: parseFloat(row.valor_total),
    valorImpostos: parseFloat(row.valor_impostos || 0),
    xmlOriginal: row.xml_original || '',
    importadoEm: new Date(row.importado_em),
  };
}

// Convert database row to Fornecedor type
function dbFornecedorToFornecedor(row: any, contatos: Contato[] = []): Fornecedor {
  return {
    id: row.id,
    cnpj: row.cnpj,
    razaoSocial: row.razao_social,
    nomeFantasia: row.nome_fantasia,
    endereco: row.endereco,
    telefone: row.telefone,
    observacoes: row.observacoes,
    contatos,
    totalCompras: parseFloat(row.total_compras || 0),
  };
}

// Convert database row to Contato type
function dbContatoToContato(row: any): Contato {
  return {
    id: row.id,
    nome: row.nome,
    cargo: row.cargo,
    telefone: row.telefone,
    email: row.email,
    observacoes: row.observacoes,
  };
}

// Convert database row to ProdutoNFe type
function dbNfeProdutoToProdutoNFe(row: any): ProdutoNFe {
  return {
    id: row.id,
    produtoId: row.produto_id,
    codigo: row.codigo,
    codigoBarras: row.codigo_barras,
    descricao: row.descricao,
    unidade: row.unidade,
    quantidade: parseFloat(row.quantidade),
    valorUnitario: parseFloat(row.valor_unitario),
    valorTotal: parseFloat(row.valor_total),
    valorImposto: parseFloat(row.valor_imposto || 0),
    valorTotalComDespesas: parseFloat(row.valor_total_com_despesas),
    valorUnitarioReal: parseFloat(row.valor_unitario_real),
    ncm: row.ncm,
    cfop: row.cfop,
    quantidadeEmbalagem: row.quantidade_embalagem,
    despesas: {
      valorProduto: parseFloat(row.despesa_valor_produto || 0),
      valorFrete: parseFloat(row.despesa_valor_frete || 0),
      valorSeguro: parseFloat(row.despesa_valor_seguro || 0),
      valorDesconto: parseFloat(row.despesa_valor_desconto || 0),
      valorOutrasDespesas: parseFloat(row.despesa_valor_outras || 0),
      valorIPI: parseFloat(row.despesa_valor_ipi || 0),
      valorICMS: parseFloat(row.despesa_valor_icms || 0),
      valorPIS: parseFloat(row.despesa_valor_pis || 0),
      valorCOFINS: parseFloat(row.despesa_valor_cofins || 0),
      valorICMSST: parseFloat(row.despesa_valor_icms_st || 0),
    },
  };
}

// Convert database row to Produto type
function dbProdutoToProduto(row: any, historico: HistoricoPedido[] = []): Produto {
  return {
    id: row.id,
    codigo: row.codigo,
    codigoBarras: row.codigo_barras,
    descricao: row.descricao,
    unidade: row.unidade,
    ncm: row.ncm,
    quantidadeEmbalagem: row.quantidade_embalagem,
    historicoPedidos: historico,
  };
}

// Convert database row to HistoricoPedido type
function dbHistoricoToHistorico(row: any): HistoricoPedido {
  return {
    id: row.id,
    nfeId: row.nfe_id,
    nfeNumero: row.nfe_numero,
    fornecedorId: row.fornecedor_id,
    fornecedorNome: row.fornecedor_nome,
    data: new Date(row.data),
    quantidade: parseFloat(row.quantidade),
    valorUnitario: parseFloat(row.valor_unitario),
    valorTotal: parseFloat(row.valor_total),
    valorImposto: parseFloat(row.valor_imposto || 0),
    valorTotalComDespesas: parseFloat(row.valor_total_com_despesas),
    valorUnitarioReal: parseFloat(row.valor_unitario_real),
    quantidadeEmbalagem: row.quantidade_embalagem,
    despesas: {
      valorProduto: parseFloat(row.despesa_valor_produto || 0),
      valorFrete: parseFloat(row.despesa_valor_frete || 0),
      valorSeguro: parseFloat(row.despesa_valor_seguro || 0),
      valorDesconto: parseFloat(row.despesa_valor_desconto || 0),
      valorOutrasDespesas: parseFloat(row.despesa_valor_outras || 0),
      valorIPI: parseFloat(row.despesa_valor_ipi || 0),
      valorICMS: parseFloat(row.despesa_valor_icms || 0),
      valorPIS: parseFloat(row.despesa_valor_pis || 0),
      valorCOFINS: parseFloat(row.despesa_valor_cofins || 0),
      valorICMSST: parseFloat(row.despesa_valor_icms_st || 0),
    },
  };
}

export function useSupabaseData() {
  const [nfes, setNfes] = useState<NFe[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch fornecedores with contatos
      const { data: fornecedoresData, error: fornecedoresError } = await supabase
        .from('fornecedores')
        .select('*, contatos(*)');
      
      if (fornecedoresError) throw fornecedoresError;

      const fornecedoresList = (fornecedoresData || []).map((f: any) => 
        dbFornecedorToFornecedor(f, (f.contatos || []).map(dbContatoToContato))
      );
      setFornecedores(fornecedoresList);

      // Fetch produtos with historico
      const { data: produtosData, error: produtosError } = await supabase
        .from('produtos')
        .select('*, historico_pedidos(*)');
      
      if (produtosError) throw produtosError;

      const produtosList = (produtosData || []).map((p: any) => 
        dbProdutoToProduto(p, (p.historico_pedidos || []).map(dbHistoricoToHistorico))
      );
      setProdutos(produtosList);

      // Fetch NFes with produtos
      const { data: nfesData, error: nfesError } = await supabase
        .from('nfes')
        .select('*, nfe_produtos(*)');
      
      if (nfesError) throw nfesError;

      const nfesList = (nfesData || []).map((n: any) => {
        const fornecedor = fornecedoresList.find(f => f.id === n.fornecedor_id) || {
          id: n.fornecedor_id,
          cnpj: '',
          razaoSocial: 'Fornecedor não encontrado',
          contatos: [],
          totalCompras: 0,
        };
        const nfeProdutos = (n.nfe_produtos || []).map(dbNfeProdutoToProdutoNFe);
        return dbNFeToNFe(n, fornecedor, nfeProdutos);
      });
      setNfes(nfesList);

    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Add NFe
  const addNFe = async (nfe: NFe): Promise<{ success: boolean; message: string }> => {
    try {
      // Check if already exists
      const { data: existing } = await supabase
        .from('nfes')
        .select('id')
        .eq('chave_acesso', nfe.chaveAcesso)
        .maybeSingle();

      if (existing) {
        return { success: false, message: 'Esta NFe já foi importada anteriormente.' };
      }

      // Add or get fornecedor
      let fornecedorId = nfe.fornecedor.id;
      const { data: existingFornecedor } = await supabase
        .from('fornecedores')
        .select('id')
        .eq('cnpj', nfe.fornecedor.cnpj)
        .maybeSingle();

      if (existingFornecedor) {
        fornecedorId = existingFornecedor.id;
      } else {
        const { data: newFornecedor, error: fornecedorError } = await supabase
          .from('fornecedores')
          .insert({
            id: nfe.fornecedor.id,
            cnpj: nfe.fornecedor.cnpj,
            razao_social: nfe.fornecedor.razaoSocial,
            nome_fantasia: nfe.fornecedor.nomeFantasia,
            endereco: nfe.fornecedor.endereco,
            telefone: nfe.fornecedor.telefone,
          })
          .select()
          .single();

        if (fornecedorError) throw fornecedorError;
        fornecedorId = newFornecedor.id;
      }

      // Insert NFe
      const { data: newNfe, error: nfeError } = await supabase
        .from('nfes')
        .insert({
          id: nfe.id,
          chave_acesso: nfe.chaveAcesso,
          numero: nfe.numero,
          serie: nfe.serie,
          data_emissao: nfe.dataEmissao.toISOString(),
          fornecedor_id: fornecedorId,
          valor_total: nfe.valorTotal,
          valor_impostos: nfe.valorImpostos,
          xml_original: nfe.xmlOriginal,
        })
        .select()
        .single();

      if (nfeError) throw nfeError;

      // Process products
      for (const prod of nfe.produtos) {
        // Add or get produto
        let produtoId = prod.produtoId;
        const { data: existingProduto } = await supabase
          .from('produtos')
          .select('id')
          .eq('codigo', prod.codigo)
          .maybeSingle();

        if (existingProduto) {
          produtoId = existingProduto.id;
        } else {
          const { data: newProduto, error: produtoError } = await supabase
            .from('produtos')
            .insert({
              codigo: prod.codigo,
              codigo_barras: prod.codigoBarras,
              descricao: prod.descricao,
              unidade: prod.unidade,
              ncm: prod.ncm,
              quantidade_embalagem: prod.quantidadeEmbalagem,
            })
            .select()
            .single();

          if (produtoError) throw produtoError;
          produtoId = newProduto.id;
        }

        // Insert nfe_produto
        await supabase.from('nfe_produtos').insert({
          nfe_id: newNfe.id,
          produto_id: produtoId,
          codigo: prod.codigo,
          codigo_barras: prod.codigoBarras,
          descricao: prod.descricao,
          unidade: prod.unidade,
          quantidade: prod.quantidade,
          valor_unitario: prod.valorUnitario,
          valor_total: prod.valorTotal,
          valor_imposto: prod.valorImposto,
          valor_total_com_despesas: prod.valorTotalComDespesas,
          valor_unitario_real: prod.valorUnitarioReal,
          ncm: prod.ncm,
          cfop: prod.cfop,
          quantidade_embalagem: prod.quantidadeEmbalagem,
          despesa_valor_produto: prod.despesas.valorProduto,
          despesa_valor_frete: prod.despesas.valorFrete,
          despesa_valor_seguro: prod.despesas.valorSeguro,
          despesa_valor_desconto: prod.despesas.valorDesconto,
          despesa_valor_outras: prod.despesas.valorOutrasDespesas,
          despesa_valor_ipi: prod.despesas.valorIPI,
          despesa_valor_icms: prod.despesas.valorICMS,
          despesa_valor_pis: prod.despesas.valorPIS,
          despesa_valor_cofins: prod.despesas.valorCOFINS,
          despesa_valor_icms_st: prod.despesas.valorICMSST,
        });

        // Insert historico_pedidos
        await supabase.from('historico_pedidos').insert({
          produto_id: produtoId,
          nfe_id: newNfe.id,
          nfe_numero: nfe.numero,
          fornecedor_id: fornecedorId,
          fornecedor_nome: nfe.fornecedor.razaoSocial,
          data: nfe.dataEmissao.toISOString(),
          quantidade: prod.quantidade,
          valor_unitario: prod.valorUnitario,
          valor_total: prod.valorTotal,
          valor_imposto: prod.valorImposto,
          valor_total_com_despesas: prod.valorTotalComDespesas,
          valor_unitario_real: prod.valorUnitarioReal,
          quantidade_embalagem: prod.quantidadeEmbalagem,
          despesa_valor_produto: prod.despesas.valorProduto,
          despesa_valor_frete: prod.despesas.valorFrete,
          despesa_valor_seguro: prod.despesas.valorSeguro,
          despesa_valor_desconto: prod.despesas.valorDesconto,
          despesa_valor_outras: prod.despesas.valorOutrasDespesas,
          despesa_valor_ipi: prod.despesas.valorIPI,
          despesa_valor_icms: prod.despesas.valorICMS,
          despesa_valor_pis: prod.despesas.valorPIS,
          despesa_valor_cofins: prod.despesas.valorCOFINS,
          despesa_valor_icms_st: prod.despesas.valorICMSST,
        });
      }

      // Recalculate total_compras for fornecedor
      const { data: nfesForFornecedor } = await supabase
        .from('nfes')
        .select('valor_total')
        .eq('fornecedor_id', fornecedorId);
      
      const totalCompras = (nfesForFornecedor || []).reduce((sum, n) => sum + parseFloat(String(n.valor_total)), 0);
      
      await supabase
        .from('fornecedores')
        .update({ total_compras: totalCompras })
        .eq('id', fornecedorId);

      // Refresh data
      await fetchData();

      return { success: true, message: 'NFe importada com sucesso!' };
    } catch (err: any) {
      console.error('Error adding NFe:', err);
      return { success: false, message: err.message };
    }
  };

  // Remove NFe
  const removeNFe = async (id: string) => {
    try {
      await supabase.from('nfes').delete().eq('id', id);
      await fetchData();
    } catch (err: any) {
      console.error('Error removing NFe:', err);
    }
  };

  // Update fornecedor observacoes
  const updateFornecedorObservacoes = async (id: string, observacoes: string) => {
    try {
      await supabase
        .from('fornecedores')
        .update({ observacoes })
        .eq('id', id);
      await fetchData();
    } catch (err: any) {
      console.error('Error updating fornecedor:', err);
    }
  };

  // Add contato
  const addContatoFornecedor = async (fornecedorId: string, contato: Contato) => {
    try {
      await supabase.from('contatos').insert({
        id: contato.id,
        fornecedor_id: fornecedorId,
        nome: contato.nome,
        cargo: contato.cargo,
        telefone: contato.telefone,
        email: contato.email,
        observacoes: contato.observacoes,
      });
      await fetchData();
    } catch (err: any) {
      console.error('Error adding contato:', err);
    }
  };

  // Update contato
  const updateContatoFornecedor = async (fornecedorId: string, contato: Contato) => {
    try {
      await supabase
        .from('contatos')
        .update({
          nome: contato.nome,
          cargo: contato.cargo,
          telefone: contato.telefone,
          email: contato.email,
          observacoes: contato.observacoes,
        })
        .eq('id', contato.id);
      await fetchData();
    } catch (err: any) {
      console.error('Error updating contato:', err);
    }
  };

  // Remove contato
  const removeContatoFornecedor = async (fornecedorId: string, contatoId: string) => {
    try {
      await supabase.from('contatos').delete().eq('id', contatoId);
      await fetchData();
    } catch (err: any) {
      console.error('Error removing contato:', err);
    }
  };

  // Update quantidade embalagem
  const updateQuantidadeEmbalagem = async (produtoId: string, quantidade: number) => {
    try {
      await supabase
        .from('produtos')
        .update({ quantidade_embalagem: quantidade })
        .eq('id', produtoId);
      await fetchData();
    } catch (err: any) {
      console.error('Error updating quantidade embalagem:', err);
    }
  };

  // Get produto by codigo barras
  const getProdutoByCodigoBarras = (codigoBarras: string) => {
    return produtos.find(p => p.codigoBarras === codigoBarras);
  };

  // Get produto by codigo
  const getProdutoByCodigo = (codigo: string) => {
    return produtos.find(p => p.codigo === codigo);
  };

  // Get total compras
  const getTotalCompras = () => {
    return nfes.reduce((acc, nfe) => acc + nfe.valorTotal, 0);
  };

  // Get total compras fornecedor
  const getTotalComprasFornecedor = (fornecedorId: string) => {
    return nfes
      .filter(n => n.fornecedor.id === fornecedorId)
      .reduce((acc, nfe) => acc + nfe.valorTotal, 0);
  };

  return {
    nfes,
    fornecedores,
    produtos,
    loading,
    error,
    refetch: fetchData,
    addNFe,
    removeNFe,
    updateFornecedorObservacoes,
    addContatoFornecedor,
    updateContatoFornecedor,
    removeContatoFornecedor,
    updateQuantidadeEmbalagem,
    getProdutoByCodigoBarras,
    getProdutoByCodigo,
    getTotalCompras,
    getTotalComprasFornecedor,
  };
}
