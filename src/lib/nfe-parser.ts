import { NFe, ProdutoNFe, Fornecedor } from "@/types/nfe";
import { v4 as uuidv4 } from "uuid";

export function parseNFeXML(xmlString: string): NFe | null {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    
    const parserError = xmlDoc.querySelector("parsererror");
    if (parserError) {
      console.error("Erro ao parsear XML:", parserError.textContent);
      return null;
    }

    // Buscar elementos principais da NFe
    const infNFe = xmlDoc.querySelector("infNFe");
    if (!infNFe) {
      console.error("Elemento infNFe não encontrado");
      return null;
    }

    const chaveAcesso = infNFe.getAttribute("Id")?.replace("NFe", "") || "";
    
    // Dados da identificação
    const ide = xmlDoc.querySelector("ide");
    const numero = getTextContent(ide, "nNF");
    const serie = getTextContent(ide, "serie");
    const dataEmissaoStr = getTextContent(ide, "dhEmi") || getTextContent(ide, "dEmi");
    const dataEmissao = dataEmissaoStr ? new Date(dataEmissaoStr) : new Date();

    // Dados do emitente (fornecedor)
    const emit = xmlDoc.querySelector("emit");
    const fornecedor: Fornecedor = {
      id: uuidv4(),
      cnpj: getTextContent(emit, "CNPJ") || getTextContent(emit, "CPF") || "",
      razaoSocial: getTextContent(emit, "xNome") || "",
      nomeFantasia: getTextContent(emit, "xFant") || undefined,
      endereco: formatEndereco(emit?.querySelector("enderEmit")),
      contatos: [],
      totalCompras: 0,
    };

    // Produtos
    const detElements = xmlDoc.querySelectorAll("det");
    const produtos: ProdutoNFe[] = [];
    
    detElements.forEach((det) => {
      const prod = det.querySelector("prod");
      const imposto = det.querySelector("imposto");
      
      if (prod) {
        const valorImposto = calcularImpostos(imposto);
        const quantidade = parseFloat(getTextContent(prod, "qCom") || "0");
        const valorUnitario = parseFloat(getTextContent(prod, "vUnCom") || "0");
        
        produtos.push({
          id: uuidv4(),
          produtoId: "",
          codigo: getTextContent(prod, "cProd") || "",
          codigoBarras: getTextContent(prod, "cEAN") || getTextContent(prod, "cEANTrib") || undefined,
          descricao: getTextContent(prod, "xProd") || "",
          unidade: getTextContent(prod, "uCom") || "",
          quantidade,
          valorUnitario,
          valorTotal: parseFloat(getTextContent(prod, "vProd") || "0"),
          valorImposto,
          ncm: getTextContent(prod, "NCM") || undefined,
          cfop: getTextContent(prod, "CFOP") || undefined,
        });
      }
    });

    // Totais
    const ICMSTot = xmlDoc.querySelector("ICMSTot");
    const valorTotal = parseFloat(getTextContent(ICMSTot, "vNF") || "0");
    const valorImpostos = parseFloat(getTextContent(ICMSTot, "vTotTrib") || "0");

    return {
      id: uuidv4(),
      chaveAcesso,
      numero,
      serie,
      dataEmissao,
      fornecedor,
      produtos,
      valorTotal,
      valorImpostos,
      xmlOriginal: xmlString,
      importadoEm: new Date(),
    };
  } catch (error) {
    console.error("Erro ao processar NFe:", error);
    return null;
  }
}

function getTextContent(parent: Element | null | undefined, tagName: string): string {
  if (!parent) return "";
  const element = parent.querySelector(tagName);
  return element?.textContent?.trim() || "";
}

function formatEndereco(endereco: Element | null | undefined): string {
  if (!endereco) return "";
  const logradouro = getTextContent(endereco, "xLgr");
  const numero = getTextContent(endereco, "nro");
  const bairro = getTextContent(endereco, "xBairro");
  const cidade = getTextContent(endereco, "xMun");
  const uf = getTextContent(endereco, "UF");
  
  return [logradouro, numero, bairro, cidade, uf].filter(Boolean).join(", ");
}

function calcularImpostos(imposto: Element | null): number {
  if (!imposto) return 0;
  
  let total = 0;
  
  // ICMS
  const icms = imposto.querySelector("ICMS");
  if (icms) {
    const vICMS = getTextContent(icms, "vICMS");
    if (vICMS) total += parseFloat(vICMS);
  }
  
  // IPI
  const ipi = imposto.querySelector("IPI");
  if (ipi) {
    const vIPI = getTextContent(ipi, "vIPI");
    if (vIPI) total += parseFloat(vIPI);
  }
  
  // PIS
  const pis = imposto.querySelector("PIS");
  if (pis) {
    const vPIS = getTextContent(pis, "vPIS");
    if (vPIS) total += parseFloat(vPIS);
  }
  
  // COFINS
  const cofins = imposto.querySelector("COFINS");
  if (cofins) {
    const vCOFINS = getTextContent(cofins, "vCOFINS");
    if (vCOFINS) total += parseFloat(vCOFINS);
  }
  
  return total;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
