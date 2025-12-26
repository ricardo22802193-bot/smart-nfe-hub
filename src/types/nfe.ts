export interface NFe {
  id: string;
  chaveAcesso: string;
  numero: string;
  serie: string;
  dataEmissao: Date;
  fornecedor: Fornecedor;
  produtos: ProdutoNFe[];
  valorTotal: number;
  valorImpostos: number;
  xmlOriginal: string;
  importadoEm: Date;
}

export interface Fornecedor {
  id: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  endereco?: string;
  telefone?: string;
  observacoes?: string;
  contatos: Contato[];
  totalCompras: number;
}

export interface Contato {
  id: string;
  nome: string;
  cargo?: string;
  telefone?: string;
  email?: string;
  observacoes?: string;
}

export interface Produto {
  id: string;
  codigo: string;
  codigoBarras?: string;
  descricao: string;
  unidade: string;
  ncm?: string;
  historicoPedidos: HistoricoPedido[];
  quantidadeEmbalagem?: number;
}

export interface ProdutoNFe {
  id: string;
  produtoId: string;
  codigo: string;
  codigoBarras?: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  valorImposto: number;
  ncm?: string;
  cfop?: string;
  quantidadeEmbalagem?: number;
}

export interface HistoricoPedido {
  id: string;
  nfeId: string;
  nfeNumero: string;
  fornecedorId: string;
  fornecedorNome: string;
  data: Date;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  valorImposto: number;
  quantidadeEmbalagem?: number;
}

export interface FiltrosProduto {
  busca: string;
  fornecedorId?: string;
  nfeId?: string;
  dataInicio?: Date;
  dataFim?: Date;
}
