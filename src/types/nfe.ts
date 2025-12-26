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

export interface DespesasProduto {
  valorProduto: number;      // Valor do produto sem impostos
  valorFrete: number;        // Frete rateado
  valorSeguro: number;       // Seguro rateado
  valorDesconto: number;     // Desconto
  valorOutrasDespesas: number; // Outras despesas rateadas
  valorIPI: number;          // IPI
  valorICMS: number;         // ICMS
  valorPIS: number;          // PIS
  valorCOFINS: number;       // COFINS
  valorICMSST: number;       // ICMS-ST
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
  valorTotalComDespesas: number; // Valor total real (produto + impostos + despesas)
  valorUnitarioReal: number;     // Valor unitário real com tudo incluso
  despesas: DespesasProduto;
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
  valorTotalComDespesas: number;
  valorUnitarioReal: number;
  despesas: DespesasProduto;
  quantidadeEmbalagem?: number;
}

export interface FiltrosProduto {
  busca: string;
  fornecedorId?: string;
  nfeId?: string;
  dataInicio?: Date;
  dataFim?: Date;
}
