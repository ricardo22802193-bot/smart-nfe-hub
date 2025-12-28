-- Tabela de fornecedores
CREATE TABLE public.fornecedores (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    cnpj TEXT NOT NULL UNIQUE,
    razao_social TEXT NOT NULL,
    nome_fantasia TEXT,
    endereco TEXT,
    telefone TEXT,
    observacoes TEXT,
    total_compras DECIMAL(15,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de contatos do fornecedor
CREATE TABLE public.contatos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    fornecedor_id UUID NOT NULL REFERENCES public.fornecedores(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    cargo TEXT,
    telefone TEXT,
    email TEXT,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de produtos
CREATE TABLE public.produtos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo TEXT NOT NULL,
    codigo_barras TEXT,
    descricao TEXT NOT NULL,
    unidade TEXT NOT NULL,
    ncm TEXT,
    quantidade_embalagem INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de NFes
CREATE TABLE public.nfes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    chave_acesso TEXT NOT NULL UNIQUE,
    numero TEXT NOT NULL,
    serie TEXT NOT NULL,
    data_emissao TIMESTAMP WITH TIME ZONE NOT NULL,
    fornecedor_id UUID NOT NULL REFERENCES public.fornecedores(id) ON DELETE RESTRICT,
    valor_total DECIMAL(15,2) NOT NULL,
    valor_impostos DECIMAL(15,2) NOT NULL DEFAULT 0,
    xml_original TEXT,
    importado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de produtos da NFe (itens)
CREATE TABLE public.nfe_produtos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nfe_id UUID NOT NULL REFERENCES public.nfes(id) ON DELETE CASCADE,
    produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE RESTRICT,
    codigo TEXT NOT NULL,
    codigo_barras TEXT,
    descricao TEXT NOT NULL,
    unidade TEXT NOT NULL,
    quantidade DECIMAL(15,4) NOT NULL,
    valor_unitario DECIMAL(15,4) NOT NULL,
    valor_total DECIMAL(15,2) NOT NULL,
    valor_imposto DECIMAL(15,2) NOT NULL DEFAULT 0,
    valor_total_com_despesas DECIMAL(15,2) NOT NULL,
    valor_unitario_real DECIMAL(15,4) NOT NULL,
    ncm TEXT,
    cfop TEXT,
    quantidade_embalagem INTEGER,
    -- Despesas do produto
    despesa_valor_produto DECIMAL(15,2) NOT NULL DEFAULT 0,
    despesa_valor_frete DECIMAL(15,2) NOT NULL DEFAULT 0,
    despesa_valor_seguro DECIMAL(15,2) NOT NULL DEFAULT 0,
    despesa_valor_desconto DECIMAL(15,2) NOT NULL DEFAULT 0,
    despesa_valor_outras DECIMAL(15,2) NOT NULL DEFAULT 0,
    despesa_valor_ipi DECIMAL(15,2) NOT NULL DEFAULT 0,
    despesa_valor_icms DECIMAL(15,2) NOT NULL DEFAULT 0,
    despesa_valor_pis DECIMAL(15,2) NOT NULL DEFAULT 0,
    despesa_valor_cofins DECIMAL(15,2) NOT NULL DEFAULT 0,
    despesa_valor_icms_st DECIMAL(15,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de histórico de pedidos (para consulta rápida de preços)
CREATE TABLE public.historico_pedidos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
    nfe_id UUID NOT NULL REFERENCES public.nfes(id) ON DELETE CASCADE,
    nfe_numero TEXT NOT NULL,
    fornecedor_id UUID NOT NULL REFERENCES public.fornecedores(id) ON DELETE RESTRICT,
    fornecedor_nome TEXT NOT NULL,
    data TIMESTAMP WITH TIME ZONE NOT NULL,
    quantidade DECIMAL(15,4) NOT NULL,
    valor_unitario DECIMAL(15,4) NOT NULL,
    valor_total DECIMAL(15,2) NOT NULL,
    valor_imposto DECIMAL(15,2) NOT NULL DEFAULT 0,
    valor_total_com_despesas DECIMAL(15,2) NOT NULL,
    valor_unitario_real DECIMAL(15,4) NOT NULL,
    quantidade_embalagem INTEGER,
    -- Despesas
    despesa_valor_produto DECIMAL(15,2) NOT NULL DEFAULT 0,
    despesa_valor_frete DECIMAL(15,2) NOT NULL DEFAULT 0,
    despesa_valor_seguro DECIMAL(15,2) NOT NULL DEFAULT 0,
    despesa_valor_desconto DECIMAL(15,2) NOT NULL DEFAULT 0,
    despesa_valor_outras DECIMAL(15,2) NOT NULL DEFAULT 0,
    despesa_valor_ipi DECIMAL(15,2) NOT NULL DEFAULT 0,
    despesa_valor_icms DECIMAL(15,2) NOT NULL DEFAULT 0,
    despesa_valor_pis DECIMAL(15,2) NOT NULL DEFAULT 0,
    despesa_valor_cofins DECIMAL(15,2) NOT NULL DEFAULT 0,
    despesa_valor_icms_st DECIMAL(15,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para melhor performance
CREATE INDEX idx_nfes_fornecedor ON public.nfes(fornecedor_id);
CREATE INDEX idx_nfes_data ON public.nfes(data_emissao);
CREATE INDEX idx_nfe_produtos_nfe ON public.nfe_produtos(nfe_id);
CREATE INDEX idx_nfe_produtos_produto ON public.nfe_produtos(produto_id);
CREATE INDEX idx_historico_produto ON public.historico_pedidos(produto_id);
CREATE INDEX idx_historico_fornecedor ON public.historico_pedidos(fornecedor_id);
CREATE INDEX idx_historico_data ON public.historico_pedidos(data);
CREATE INDEX idx_produtos_codigo ON public.produtos(codigo);
CREATE INDEX idx_produtos_codigo_barras ON public.produtos(codigo_barras);
CREATE INDEX idx_contatos_fornecedor ON public.contatos(fornecedor_id);

-- Habilitar RLS
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nfes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nfe_produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_pedidos ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público (sem autenticação por enquanto)
CREATE POLICY "Allow all access to fornecedores" ON public.fornecedores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to contatos" ON public.contatos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to produtos" ON public.produtos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to nfes" ON public.nfes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to nfe_produtos" ON public.nfe_produtos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to historico_pedidos" ON public.historico_pedidos FOR ALL USING (true) WITH CHECK (true);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers para updated_at
CREATE TRIGGER update_fornecedores_updated_at
    BEFORE UPDATE ON public.fornecedores
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_produtos_updated_at
    BEFORE UPDATE ON public.produtos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();