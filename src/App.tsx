import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
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
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/consulta-preco" element={<ProtectedRoute><ConsultaPreco /></ProtectedRoute>} />
          <Route path="/nfes" element={<ProtectedRoute><NFes /></ProtectedRoute>} />
          <Route path="/fornecedores" element={<ProtectedRoute><Fornecedores /></ProtectedRoute>} />
          <Route path="/fornecedor/:id" element={<ProtectedRoute><FornecedorDetalhe /></ProtectedRoute>} />
          <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
          <Route path="/produto/:id" element={<ProtectedRoute><ProdutoDetalhe /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
