import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { useSupabaseDataStore } from "@/store/supabase-data-store";

export function useSupabaseData() {
  const state = useSupabaseDataStore(
    useShallow((s) => ({
      nfes: s.nfes,
      fornecedores: s.fornecedores,
      produtos: s.produtos,
      loading: s.loading,
      error: s.error,
      ensureLoaded: s.ensureLoaded,
      refetch: s.refetch,
      addNFe: s.addNFe,
      removeNFe: s.removeNFe,
      updateFornecedorObservacoes: s.updateFornecedorObservacoes,
      addContatoFornecedor: s.addContatoFornecedor,
      updateContatoFornecedor: s.updateContatoFornecedor,
      removeContatoFornecedor: s.removeContatoFornecedor,
      updateQuantidadeEmbalagem: s.updateQuantidadeEmbalagem,
      getProdutoByCodigoBarras: s.getProdutoByCodigoBarras,
      getProdutoByCodigo: s.getProdutoByCodigo,
      getTotalCompras: s.getTotalCompras,
      getTotalComprasFornecedor: s.getTotalComprasFornecedor,
    }))
  );

  useEffect(() => {
    state.ensureLoaded();
  }, [state.ensureLoaded]);

  return {
    nfes: state.nfes,
    fornecedores: state.fornecedores,
    produtos: state.produtos,
    loading: state.loading,
    error: state.error,
    refetch: state.refetch,
    addNFe: state.addNFe,
    removeNFe: state.removeNFe,
    updateFornecedorObservacoes: state.updateFornecedorObservacoes,
    addContatoFornecedor: state.addContatoFornecedor,
    updateContatoFornecedor: state.updateContatoFornecedor,
    removeContatoFornecedor: state.removeContatoFornecedor,
    updateQuantidadeEmbalagem: state.updateQuantidadeEmbalagem,
    getProdutoByCodigoBarras: state.getProdutoByCodigoBarras,
    getProdutoByCodigo: state.getProdutoByCodigo,
    getTotalCompras: state.getTotalCompras,
    getTotalComprasFornecedor: state.getTotalComprasFornecedor,
  };
}
