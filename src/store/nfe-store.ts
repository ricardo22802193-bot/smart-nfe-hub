import { create } from "zustand";
import { persist } from "zustand/middleware";
import { NFe, Fornecedor, Produto, HistoricoPedido, Contato } from "@/types/nfe";
import { v4 as uuidv4 } from "uuid";

interface NFeStore {
  nfes: NFe[];
  fornecedores: Fornecedor[];
  produtos: Produto[];
  
  // NFe actions
  addNFe: (nfe: NFe) => { success: boolean; message: string };
  removeNFe: (id: string) => void;
  getNFeByChave: (chave: string) => NFe | undefined;
  
  // Fornecedor actions
  addOrUpdateFornecedor: (fornecedor: Fornecedor) => Fornecedor;
  updateFornecedorObservacoes: (id: string, observacoes: string) => void;
  addContatoFornecedor: (fornecedorId: string, contato: Contato) => void;
  updateContatoFornecedor: (fornecedorId: string, contato: Contato) => void;
  removeContatoFornecedor: (fornecedorId: string, contatoId: string) => void;
  
  // Produto actions
  addOrUpdateProduto: (codigo: string, codigoBarras: string | undefined, descricao: string, unidade: string, ncm: string | undefined) => Produto;
  addHistoricoProduto: (produtoId: string, historico: HistoricoPedido) => void;
  updateQuantidadeEmbalagem: (produtoId: string, quantidade: number) => void;
  getProdutoByCodigoBarras: (codigoBarras: string) => Produto | undefined;
  getProdutoByCodigo: (codigo: string) => Produto | undefined;
  
  // Stats
  getTotalCompras: () => number;
  getTotalComprasFornecedor: (fornecedorId: string) => number;
}

export const useNFeStore = create<NFeStore>()(
  persist(
    (set, get) => ({
      nfes: [],
      fornecedores: [],
      produtos: [],

      addNFe: (nfe: NFe) => {
        const existente = get().nfes.find(n => n.chaveAcesso === nfe.chaveAcesso);
        if (existente) {
          return { success: false, message: "Esta NFe já foi importada anteriormente." };
        }

        // Adicionar ou atualizar fornecedor
        const fornecedor = get().addOrUpdateFornecedor(nfe.fornecedor);
        nfe.fornecedor = fornecedor;

        // Processar produtos
        nfe.produtos.forEach(prodNfe => {
          const produto = get().addOrUpdateProduto(
            prodNfe.codigo,
            prodNfe.codigoBarras,
            prodNfe.descricao,
            prodNfe.unidade,
            prodNfe.ncm
          );
          prodNfe.produtoId = produto.id;

          // Adicionar ao histórico
          const historico: HistoricoPedido = {
            id: uuidv4(),
            nfeId: nfe.id,
            nfeNumero: nfe.numero,
            fornecedorId: fornecedor.id,
            fornecedorNome: fornecedor.razaoSocial,
            data: nfe.dataEmissao,
            quantidade: prodNfe.quantidade,
            valorUnitario: prodNfe.valorUnitario,
            valorTotal: prodNfe.valorTotal,
            valorImposto: prodNfe.valorImposto,
            valorTotalComDespesas: prodNfe.valorTotalComDespesas,
            valorUnitarioReal: prodNfe.valorUnitarioReal,
            despesas: prodNfe.despesas,
            quantidadeEmbalagem: prodNfe.quantidadeEmbalagem,
          };
          get().addHistoricoProduto(produto.id, historico);
        });

        // Atualizar total de compras do fornecedor
        set(state => ({
          fornecedores: state.fornecedores.map(f =>
            f.id === fornecedor.id
              ? { ...f, totalCompras: f.totalCompras + nfe.valorTotal }
              : f
          ),
          nfes: [...state.nfes, nfe],
        }));

        return { success: true, message: "NFe importada com sucesso!" };
      },

      removeNFe: (id: string) => {
        set(state => ({
          nfes: state.nfes.filter(n => n.id !== id),
        }));
      },

      getNFeByChave: (chave: string) => {
        return get().nfes.find(n => n.chaveAcesso === chave);
      },

      addOrUpdateFornecedor: (fornecedor: Fornecedor) => {
        const existente = get().fornecedores.find(f => f.cnpj === fornecedor.cnpj);
        if (existente) {
          return existente;
        }
        set(state => ({
          fornecedores: [...state.fornecedores, fornecedor],
        }));
        return fornecedor;
      },

      updateFornecedorObservacoes: (id: string, observacoes: string) => {
        set(state => ({
          fornecedores: state.fornecedores.map(f =>
            f.id === id ? { ...f, observacoes } : f
          ),
        }));
      },

      addContatoFornecedor: (fornecedorId: string, contato: Contato) => {
        set(state => ({
          fornecedores: state.fornecedores.map(f =>
            f.id === fornecedorId
              ? { ...f, contatos: [...f.contatos, contato] }
              : f
          ),
        }));
      },

      updateContatoFornecedor: (fornecedorId: string, contato: Contato) => {
        set(state => ({
          fornecedores: state.fornecedores.map(f =>
            f.id === fornecedorId
              ? {
                  ...f,
                  contatos: f.contatos.map(c =>
                    c.id === contato.id ? contato : c
                  ),
                }
              : f
          ),
        }));
      },

      removeContatoFornecedor: (fornecedorId: string, contatoId: string) => {
        set(state => ({
          fornecedores: state.fornecedores.map(f =>
            f.id === fornecedorId
              ? { ...f, contatos: f.contatos.filter(c => c.id !== contatoId) }
              : f
          ),
        }));
      },

      addOrUpdateProduto: (codigo, codigoBarras, descricao, unidade, ncm) => {
        let produto = get().produtos.find(p => p.codigo === codigo);
        if (!produto && codigoBarras) {
          produto = get().produtos.find(p => p.codigoBarras === codigoBarras);
        }
        
        if (produto) {
          // Atualizar código de barras se não existir
          if (!produto.codigoBarras && codigoBarras) {
            set(state => ({
              produtos: state.produtos.map(p =>
                p.id === produto!.id ? { ...p, codigoBarras } : p
              ),
            }));
          }
          return produto;
        }

        const novoProduto: Produto = {
          id: uuidv4(),
          codigo,
          codigoBarras,
          descricao,
          unidade,
          ncm,
          historicoPedidos: [],
        };

        set(state => ({
          produtos: [...state.produtos, novoProduto],
        }));

        return novoProduto;
      },

      addHistoricoProduto: (produtoId: string, historico: HistoricoPedido) => {
        set(state => ({
          produtos: state.produtos.map(p =>
            p.id === produtoId
              ? { ...p, historicoPedidos: [...p.historicoPedidos, historico] }
              : p
          ),
        }));
      },

      updateQuantidadeEmbalagem: (produtoId: string, quantidade: number) => {
        set(state => ({
          produtos: state.produtos.map(p =>
            p.id === produtoId ? { ...p, quantidadeEmbalagem: quantidade } : p
          ),
        }));
      },

      getProdutoByCodigoBarras: (codigoBarras: string) => {
        return get().produtos.find(p => p.codigoBarras === codigoBarras);
      },

      getProdutoByCodigo: (codigo: string) => {
        return get().produtos.find(p => p.codigo === codigo);
      },

      getTotalCompras: () => {
        return get().nfes.reduce((acc, nfe) => acc + nfe.valorTotal, 0);
      },

      getTotalComprasFornecedor: (fornecedorId: string) => {
        return get().nfes
          .filter(n => n.fornecedor.id === fornecedorId)
          .reduce((acc, nfe) => acc + nfe.valorTotal, 0);
      },
    }),
    {
      name: "nfe-storage",
    }
  )
);
