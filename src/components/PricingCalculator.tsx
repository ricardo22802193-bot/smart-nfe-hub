import { useState, useCallback } from "react";
import { Calculator, TrendingUp, Percent, ArrowRightLeft, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtPct = (v: number) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";

/* ─── Markup Tab ─── */
function MarkupCalc() {
  const [custo, setCusto] = useState("");
  const [markup, setMarkup] = useState("");

  const custoNum = parseFloat(custo.replace(",", ".")) || 0;
  const markupNum = parseFloat(markup.replace(",", ".")) || 0;
  const venda = custoNum * (1 + markupNum / 100);
  const lucro = venda - custoNum;
  const margem = venda > 0 ? (lucro / venda) * 100 : 0;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Calcule o preço de venda a partir do custo e markup desejado.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="mk-custo">Custo (R$)</Label>
          <Input
            id="mk-custo"
            placeholder="0,00"
            inputMode="decimal"
            value={custo}
            onChange={(e) => setCusto(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="mk-markup">Markup (%)</Label>
          <Input
            id="mk-markup"
            placeholder="0,00"
            inputMode="decimal"
            value={markup}
            onChange={(e) => setMarkup(e.target.value)}
          />
        </div>
      </div>
      {custoNum > 0 && markupNum > 0 && (
        <ResultGrid
          items={[
            { label: "Preço de Venda", value: `R$ ${fmt(venda)}`, highlight: true },
            { label: "Lucro (R$)", value: `R$ ${fmt(lucro)}` },
            { label: "Margem real", value: fmtPct(margem) },
          ]}
        />
      )}
    </div>
  );
}

/* ─── Margem Tab ─── */
function MargemCalc() {
  const [custo, setCusto] = useState("");
  const [venda, setVenda] = useState("");

  const custoNum = parseFloat(custo.replace(",", ".")) || 0;
  const vendaNum = parseFloat(venda.replace(",", ".")) || 0;
  const lucro = vendaNum - custoNum;
  const margem = vendaNum > 0 ? (lucro / vendaNum) * 100 : 0;
  const markupReal = custoNum > 0 ? (lucro / custoNum) * 100 : 0;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Descubra a margem e markup entre custo e preço de venda.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="mg-custo">Custo (R$)</Label>
          <Input
            id="mg-custo"
            placeholder="0,00"
            inputMode="decimal"
            value={custo}
            onChange={(e) => setCusto(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="mg-venda">Venda (R$)</Label>
          <Input
            id="mg-venda"
            placeholder="0,00"
            inputMode="decimal"
            value={venda}
            onChange={(e) => setVenda(e.target.value)}
          />
        </div>
      </div>
      {custoNum > 0 && vendaNum > 0 && (
        <ResultGrid
          items={[
            { label: "Lucro (R$)", value: `R$ ${fmt(lucro)}`, highlight: lucro > 0 },
            { label: "Margem", value: fmtPct(margem) },
            { label: "Markup", value: fmtPct(markupReal) },
          ]}
        />
      )}
    </div>
  );
}

/* ─── Margem Desejada Tab ─── */
function MargemDesejadaCalc() {
  const [custo, setCusto] = useState("");
  const [margemDesejada, setMargemDesejada] = useState("");

  const custoNum = parseFloat(custo.replace(",", ".")) || 0;
  const margemNum = parseFloat(margemDesejada.replace(",", ".")) || 0;
  const vendaIdeal = margemNum < 100 ? custoNum / (1 - margemNum / 100) : 0;
  const lucro = vendaIdeal - custoNum;
  const markupEquiv = custoNum > 0 ? (lucro / custoNum) * 100 : 0;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Informe o custo e a margem desejada para descobrir o preço de venda ideal.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="md-custo">Custo (R$)</Label>
          <Input
            id="md-custo"
            placeholder="0,00"
            inputMode="decimal"
            value={custo}
            onChange={(e) => setCusto(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="md-margem">Margem desejada (%)</Label>
          <Input
            id="md-margem"
            placeholder="0,00"
            inputMode="decimal"
            value={margemDesejada}
            onChange={(e) => setMargemDesejada(e.target.value)}
          />
        </div>
      </div>
      {custoNum > 0 && margemNum > 0 && margemNum < 100 && (
        <ResultGrid
          items={[
            { label: "Preço de Venda", value: `R$ ${fmt(vendaIdeal)}`, highlight: true },
            { label: "Lucro (R$)", value: `R$ ${fmt(lucro)}` },
            { label: "Markup equivalente", value: fmtPct(markupEquiv) },
          ]}
        />
      )}
    </div>
  );
}

/* ─── Desconto Tab ─── */
function DescontoCalc() {
  const [preco, setPreco] = useState("");
  const [desconto, setDesconto] = useState("");

  const precoNum = parseFloat(preco.replace(",", ".")) || 0;
  const descontoNum = parseFloat(desconto.replace(",", ".")) || 0;
  const valorDesconto = precoNum * (descontoNum / 100);
  const precoFinal = precoNum - valorDesconto;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Calcule o preço final após aplicar um desconto percentual.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="dc-preco">Preço original (R$)</Label>
          <Input
            id="dc-preco"
            placeholder="0,00"
            inputMode="decimal"
            value={preco}
            onChange={(e) => setPreco(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="dc-desc">Desconto (%)</Label>
          <Input
            id="dc-desc"
            placeholder="0,00"
            inputMode="decimal"
            value={desconto}
            onChange={(e) => setDesconto(e.target.value)}
          />
        </div>
      </div>
      {precoNum > 0 && descontoNum > 0 && (
        <ResultGrid
          items={[
            { label: "Preço final", value: `R$ ${fmt(precoFinal)}`, highlight: true },
            { label: "Economia", value: `R$ ${fmt(valorDesconto)}` },
          ]}
        />
      )}
    </div>
  );
}

/* ─── Comparador de preço por unidade ─── */
function ComparadorCalc() {
  const [precoA, setPrecoA] = useState("");
  const [qtdA, setQtdA] = useState("");
  const [precoB, setPrecoB] = useState("");
  const [qtdB, setQtdB] = useState("");

  const pA = parseFloat(precoA.replace(",", ".")) || 0;
  const qA = parseFloat(qtdA.replace(",", ".")) || 0;
  const pB = parseFloat(precoB.replace(",", ".")) || 0;
  const qB = parseFloat(qtdB.replace(",", ".")) || 0;

  const unitA = qA > 0 ? pA / qA : 0;
  const unitB = qB > 0 ? pB / qB : 0;
  const melhor = unitA > 0 && unitB > 0 ? (unitA <= unitB ? "A" : "B") : null;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Compare o preço por unidade de dois produtos para ver qual compensa mais.
      </p>
      <div className="space-y-3">
        <p className="text-xs font-semibold text-foreground">Produto A</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="cmp-pa">Preço (R$)</Label>
            <Input id="cmp-pa" placeholder="0,00" inputMode="decimal" value={precoA} onChange={(e) => setPrecoA(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="cmp-qa">Quantidade</Label>
            <Input id="cmp-qa" placeholder="Ex: 500g" inputMode="decimal" value={qtdA} onChange={(e) => setQtdA(e.target.value)} />
          </div>
        </div>
        <p className="text-xs font-semibold text-foreground">Produto B</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="cmp-pb">Preço (R$)</Label>
            <Input id="cmp-pb" placeholder="0,00" inputMode="decimal" value={precoB} onChange={(e) => setPrecoB(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="cmp-qb">Quantidade</Label>
            <Input id="cmp-qb" placeholder="Ex: 1000g" inputMode="decimal" value={qtdB} onChange={(e) => setQtdB(e.target.value)} />
          </div>
        </div>
      </div>
      {unitA > 0 && unitB > 0 && (
        <div className="space-y-2">
          <ResultGrid
            items={[
              { label: "Unitário A", value: `R$ ${fmt(unitA)}`, highlight: melhor === "A" },
              { label: "Unitário B", value: `R$ ${fmt(unitB)}`, highlight: melhor === "B" },
            ]}
          />
          {melhor && (
            <p className="text-sm font-semibold text-center text-success">
              ✓ Produto {melhor} é mais vantajoso ({fmtPct(Math.abs(((unitA - unitB) / Math.max(unitA, unitB)) * 100))} mais barato)
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Result Grid helper ─── */
function ResultGrid({ items }: { items: { label: string; value: string; highlight?: boolean }[] }) {
  return (
    <div className="grid grid-cols-1 gap-2 animate-fade-in">
      {items.map((item) => (
        <div
          key={item.label}
          className={`flex items-center justify-between rounded-lg px-4 py-3 ${
            item.highlight
              ? "gradient-primary text-primary-foreground"
              : "bg-muted text-foreground"
          }`}
        >
          <span className="text-sm font-medium">{item.label}</span>
          <span className="text-lg font-bold">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Main Component ─── */
const PricingCalculator = () => {
  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
            <Calculator className="w-5 h-5 text-primary-foreground" />
          </div>
          Calculadora de Preços
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="markup" className="w-full">
          <TabsList className="w-full grid grid-cols-5 h-auto">
            <TabsTrigger value="markup" className="text-xs px-1 py-2 flex flex-col gap-0.5 items-center">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Markup</span>
            </TabsTrigger>
            <TabsTrigger value="margem" className="text-xs px-1 py-2 flex flex-col gap-0.5 items-center">
              <Percent className="w-3.5 h-3.5" />
              <span>Margem</span>
            </TabsTrigger>
            <TabsTrigger value="margem-desejada" className="text-xs px-1 py-2 flex flex-col gap-0.5 items-center">
              <DollarSign className="w-3.5 h-3.5" />
              <span>Preço Ideal</span>
            </TabsTrigger>
            <TabsTrigger value="desconto" className="text-xs px-1 py-2 flex flex-col gap-0.5 items-center">
              <Percent className="w-3.5 h-3.5" />
              <span>Desconto</span>
            </TabsTrigger>
            <TabsTrigger value="comparador" className="text-xs px-1 py-2 flex flex-col gap-0.5 items-center">
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Comparar</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="markup">
            <MarkupCalc />
          </TabsContent>
          <TabsContent value="margem">
            <MargemCalc />
          </TabsContent>
          <TabsContent value="margem-desejada">
            <MargemDesejadaCalc />
          </TabsContent>
          <TabsContent value="desconto">
            <DescontoCalc />
          </TabsContent>
          <TabsContent value="comparador">
            <ComparadorCalc />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PricingCalculator;
