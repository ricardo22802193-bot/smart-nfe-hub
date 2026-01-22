import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import type {
  Contato,
  Fornecedor,
  HistoricoPedido,
  NFe,
  Produto,
  ProdutoNFe,
} from "@/types/nfe";

// ---------- Helpers (DB row -> app types)
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
    xmlOriginal: row.xml_original || "",
    importadoEm: new Date(row.importado_em),
  };
}

// ---------- Store

type SupabaseDataState = {
  nfes: NFe[];
  fornecedores: Fornecedor[];
  produtos: Produto[];
  loading: boolean;
  error: string | null;
  initialized: boolean;
};

type SupabaseDataActions = {
  ensureLoaded: () => Promise<void>;
  refetch: () => Promise<void>;

  addNFe: (nfe: NFe) => Promise<{ success: boolean; message: string }>;
  removeNFe: (id: string) => Promise<void>;

  updateFornecedorObservacoes: (id: string, observacoes: string) => Promise<void>;
  addContatoFornecedor: (fornecedorId: string, contato: Contato) => Promise<void>;
  updateContatoFornecedor: (fornecedorId: string, contato: Contato) => Promise<void>;
  removeContatoFornecedor: (fornecedorId: string, contatoId: string) => Promise<void>;

  updateQuantidadeEmbalagem: (produtoId: string, quantidade: number) => Promise<void>;

  getProdutoByCodigoBarras: (codigoBarras: string) => Produto | undefined;
  getProdutoByCodigo: (codigo: string) => Produto | undefined;
  getTotalCompras: () => number;
  getTotalComprasFornecedor: (fornecedorId: string) => number;
};

let inflightLoad: Promise<void> | null = null;

export const useSupabaseDataStore = create<SupabaseDataState & SupabaseDataActions>((set, get) => ({
  nfes: [],
  fornecedores: [],
  produtos: [],
  loading: false,
  error: null,
  initialized: false,

  ensureLoaded: async () => {
    const { initialized, loading } = get();
    if (initialized) return;

    if (loading && inflightLoad) {
      return inflightLoad;
    }

    inflightLoad = get()
      .refetch()
      .finally(() => {
        inflightLoad = null;
      });

    return inflightLoad;
  },

  refetch: async () => {
    try {
      set({ loading: true, error: null });

      const { data: fornecedoresData, error: fornecedoresError } = await supabase
        .from("fornecedores")
        .select("*, contatos(*)");
      if (fornecedoresError) throw fornecedoresError;

      const fornecedoresList = (fornecedoresData || []).map((f: any) =>
        dbFornecedorToFornecedor(f, (f.contatos || []).map(dbContatoToContato))
      );

      const { data: produtosData, error: produtosError } = await supabase
        .from("produtos")
        .select("*, historico_pedidos(*)");
      if (produtosError) throw produtosError;

      const produtosList = (produtosData || []).map((p: any) =>
        dbProdutoToProduto(p, (p.historico_pedidos || []).map(dbHistoricoToHistorico))
      );

      const { data: nfesData, error: nfesError } = await supabase
        .from("nfes")
        .select("*, nfe_produtos(*)");
      if (nfesError) throw nfesError;

      const nfesList = (nfesData || []).map((n: any) => {
        const fornecedor = fornecedoresList.find((f) => f.id === n.fornecedor_id) || {
          id: n.fornecedor_id,
          cnpj: "",
          razaoSocial: "Fornecedor não encontrado",
          nomeFantasia: null,
          endereco: null,
          telefone: null,
          observacoes: null,
          contatos: [],
          totalCompras: 0,
        };
        const nfeProdutos = (n.nfe_produtos || []).map(dbNfeProdutoToProdutoNFe);
        return dbNFeToNFe(n, fornecedor as Fornecedor, nfeProdutos);
      });

      set({
        fornecedores: fornecedoresList,
        produtos: produtosList,
        nfes: nfesList,
        initialized: true,
      });
    } catch (err: any) {
      console.error("Error fetching data:", err);
      set({ error: err?.message ?? String(err) });
    } finally {
      set({ loading: false });
    }
  },

  addNFe: async (nfe: NFe) => {
    try {
      const { data: existing } = await supabase
        .from("nfes")
        .select("id")
        .eq("chave_acesso", nfe.chaveAcesso)
        .maybeSingle();

      if (existing) {
        return { success: false, message: "Esta NFe já foi importada anteriormente." };
      }

      // Add or get fornecedor
      let fornecedorId = nfe.fornecedor.id;
      const { data: existingFornecedor } = await supabase
        .from("fornecedores")
        .select("id")
        .eq("cnpj", nfe.fornecedor.cnpj)
        .maybeSingle();

      if (existingFornecedor) {
        fornecedorId = existingFornecedor.id;
      } else {
        const { data: newFornecedor, error: fornecedorError } = await supabase
          .from("fornecedores")
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
        .from("nfes")
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
          .from("produtos")
          .select("id")
          .eq("codigo", prod.codigo)
          .maybeSingle();

        if (existingProduto) {
          produtoId = existingProduto.id;
        } else {
          const { data: newProduto, error: produtoError } = await supabase
            .from("produtos")
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

        await supabase.from("nfe_produtos").insert({
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

        await supabase.from("historico_pedidos").insert({
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

      const { data: nfesForFornecedor } = await supabase
        .from("nfes")
        .select("valor_total")
        .eq("fornecedor_id", fornecedorId);

      const totalCompras = (nfesForFornecedor || []).reduce(
        (sum, n) => sum + parseFloat(String(n.valor_total)),
        0
      );

      await supabase
        .from("fornecedores")
        .update({ total_compras: totalCompras })
        .eq("id", fornecedorId);

      await get().refetch();

      return { success: true, message: "NFe importada com sucesso!" };
    } catch (err: any) {
      console.error("Error adding NFe:", err);
      return { success: false, message: err?.message ?? String(err) };
    }
  },

  removeNFe: async (id: string) => {
    try {
      await supabase.from("nfes").delete().eq("id", id);
      await get().refetch();
    } catch (err: any) {
      console.error("Error removing NFe:", err);
    }
  },

  updateFornecedorObservacoes: async (id: string, observacoes: string) => {
    try {
      await supabase.from("fornecedores").update({ observacoes }).eq("id", id);
      await get().refetch();
    } catch (err: any) {
      console.error("Error updating fornecedor:", err);
    }
  },

  addContatoFornecedor: async (fornecedorId: string, contato: Contato) => {
    try {
      await supabase.from("contatos").insert({
        id: contato.id,
        fornecedor_id: fornecedorId,
        nome: contato.nome,
        cargo: contato.cargo,
        telefone: contato.telefone,
        email: contato.email,
        observacoes: contato.observacoes,
      });
      await get().refetch();
    } catch (err: any) {
      console.error("Error adding contato:", err);
    }
  },

  updateContatoFornecedor: async (fornecedorId: string, contato: Contato) => {
    try {
      await supabase
        .from("contatos")
        .update({
          nome: contato.nome,
          cargo: contato.cargo,
          telefone: contato.telefone,
          email: contato.email,
          observacoes: contato.observacoes,
        })
        .eq("id", contato.id);
      await get().refetch();
    } catch (err: any) {
      console.error("Error updating contato:", err);
    }
  },

  removeContatoFornecedor: async (fornecedorId: string, contatoId: string) => {
    try {
      await supabase.from("contatos").delete().eq("id", contatoId);
      await get().refetch();
    } catch (err: any) {
      console.error("Error removing contato:", err);
    }
  },

  updateQuantidadeEmbalagem: async (produtoId: string, quantidade: number) => {
    try {
      await supabase
        .from("produtos")
        .update({ quantidade_embalagem: quantidade })
        .eq("id", produtoId);
      await get().refetch();
    } catch (err: any) {
      console.error("Error updating quantidade embalagem:", err);
    }
  },

  getProdutoByCodigoBarras: (codigoBarras: string) => {
    // Remove zeros à esquerda e espaços para comparação mais flexível
    const cleanCode = codigoBarras.replace(/^0+/, '').trim();
    return get().produtos.find((p) => {
      if (!p.codigoBarras) return false;
      const cleanProductCode = p.codigoBarras.replace(/^0+/, '').trim();
      return p.codigoBarras === codigoBarras || cleanProductCode === cleanCode;
    });
  },

  getProdutoByCodigo: (codigo: string) => {
    return get().produtos.find((p) => p.codigo === codigo);
  },

  getTotalCompras: () => {
    return get().nfes.reduce((acc, nfe) => acc + nfe.valorTotal, 0);
  },

  getTotalComprasFornecedor: (fornecedorId: string) => {
    return get()
      .nfes.filter((n) => n.fornecedor.id === fornecedorId)
      .reduce((acc, nfe) => acc + nfe.valorTotal, 0);
  },
}));
