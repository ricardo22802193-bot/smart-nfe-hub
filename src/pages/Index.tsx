import { useNavigate } from "react-router-dom";
import { Search, FileText, Users, Settings, Package } from "lucide-react";
import { useSupabaseData } from "@/hooks/use-supabase-data";

const Index = () => {
  const navigate = useNavigate();
  const { nfes, fornecedores } = useSupabaseData();

  const menuItems = [
    {
      title: "Consulta Preço",
      description: "Pesquise produtos e compare preços",
      icon: Search,
      color: "gradient-primary",
      path: "/consulta-preco",
    },
    {
      title: "NFes",
      description: `${nfes.length} notas importadas`,
      icon: FileText,
      color: "gradient-accent",
      path: "/nfes",
    },
    {
      title: "Fornecedores",
      description: `${fornecedores.length} fornecedores cadastrados`,
      icon: Users,
      color: "gradient-success",
      path: "/fornecedores",
    },
    {
      title: "Configurações",
      description: "Importe XMLs e configure o sistema",
      icon: Settings,
      color: "bg-secondary",
      path: "/configuracoes",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-card border-b border-border">
        <div className="container py-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
              <Package className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Gestão NFe</h1>
              <p className="text-sm text-muted-foreground">Sistema de Consulta de Preços</p>
            </div>
          </div>
        </div>
      </header>

      {/* Menu Grid */}
      <div className="container py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="group relative overflow-hidden rounded-xl bg-card p-6 text-left shadow-card border border-border transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-primary/30 animate-fade-in"
            >
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-xl ${item.color} flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110`}>
                  <item.icon className={`w-7 h-7 ${item.color === 'bg-secondary' ? 'text-secondary-foreground' : 'text-primary-foreground'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-foreground mb-1">
                    {item.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
