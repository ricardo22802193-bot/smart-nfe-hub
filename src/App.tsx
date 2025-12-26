import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ConsultaPreco from "./pages/ConsultaPreco";
import NFes from "./pages/NFes";
import Fornecedores from "./pages/Fornecedores";
import FornecedorDetalhe from "./pages/FornecedorDetalhe";
import Configuracoes from "./pages/Configuracoes";
import ProdutoDetalhe from "./pages/ProdutoDetalhe";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/consulta-preco" element={<ConsultaPreco />} />
          <Route path="/nfes" element={<NFes />} />
          <Route path="/fornecedores" element={<Fornecedores />} />
          <Route path="/fornecedor/:id" element={<FornecedorDetalhe />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
          <Route path="/produto/:id" element={<ProdutoDetalhe />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
