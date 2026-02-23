import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const NUVEM_FISCAL_BASE = "https://api.nuvemfiscal.com.br";
const NUVEM_FISCAL_AUTH_URL = "https://auth.nuvemfiscal.com.br/oauth/token";

// Cache token in memory (lives as long as the edge function instance)
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getNuvemFiscalToken(): Promise<string> {
  // Return cached token if still valid (with 60s margin)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
    return cachedToken.token;
  }

  const clientId = Deno.env.get("NUVEM_FISCAL_CLIENT_ID");
  const clientSecret = Deno.env.get("NUVEM_FISCAL_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error("NUVEM_FISCAL_CLIENT_ID e NUVEM_FISCAL_CLIENT_SECRET não configurados");
  }

  const res = await fetch(NUVEM_FISCAL_AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      scope: "empresa certificado nfe",
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error("OAuth2 token error:", res.status, text);
    throw new Error(`Erro ao obter token Nuvem Fiscal: ${res.status}`);
  }

  const data = JSON.parse(text);
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
  };

  console.log("Got new Nuvem Fiscal access token, expires in", data.expires_in, "seconds");
  return cachedToken.token;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ success: false, error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    let userId: string;
    try {
      const payloadBase64 = token.split('.')[1];
      const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
      const payload = JSON.parse(payloadJson);
      userId = payload.sub;
      if (!userId) throw new Error("No sub in token");
    } catch {
      return new Response(JSON.stringify({ success: false, error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const nfToken = await getNuvemFiscalToken();

    const { action, ...params } = await req.json();

    switch (action) {
      case "upload-certificate": {
        const { pfxBase64, senha, cnpj } = params;

        if (!pfxBase64 || !senha || !cnpj) {
          throw new Error("Certificado (.pfx), senha e CNPJ são obrigatórios");
        }

        let validade: string | null = null;
        let razaoSocial: string | null = null;
        const cnpjClean = cnpj.replace(/\D/g, "");

        try {
          // 1. Register company (ignore 409 = already exists)
          const empresaRes = await fetch(`${NUVEM_FISCAL_BASE}/empresas`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${nfToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              cpf_cnpj: cnpjClean,
              nome_razao_social: "Empresa",
              email: "contato@empresa.com",
              endereco: {
                logradouro: "Rua",
                numero: "0",
                bairro: "Centro",
                codigo_municipio: "3550308",
                cidade: "São Paulo",
                uf: "SP",
                cep: "01001000",
              },
            }),
          });

          if (!empresaRes.ok && empresaRes.status !== 409) {
            const errText = await empresaRes.text();
            console.error("Error registering company:", errText);
          } else {
            await empresaRes.text();
          }

          // 2. Upload certificate
          const certUploadRes = await fetch(
            `${NUVEM_FISCAL_BASE}/empresas/${cnpjClean}/certificado`,
            {
              method: "PUT",
              headers: {
                "Authorization": `Bearer ${nfToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                certificado: pfxBase64,
                password: senha,
              }),
            }
          );

          const certText = await certUploadRes.text();
          console.log("Certificate upload status:", certUploadRes.status);

          if (certUploadRes.ok) {
            try {
              const certData = JSON.parse(certText);
              validade = certData.not_valid_after || null;
              razaoSocial = certData.nome_razao_social || certData.subject_name || null;
              console.log("Cert validade:", validade, "razaoSocial:", razaoSocial);
            } catch (e) {
              console.error("Error parsing cert response:", e);
            }
          } else {
            console.error("Error uploading cert:", certText);
          }

          // 3. Fallback: GET cert info
          if (!validade) {
            try {
              const certInfoRes = await fetch(
                `${NUVEM_FISCAL_BASE}/empresas/${cnpjClean}/certificado`,
                {
                  method: "GET",
                  headers: { "Authorization": `Bearer ${nfToken}` },
                }
              );
              if (certInfoRes.ok) {
                const certInfo = JSON.parse(await certInfoRes.text());
                validade = certInfo.not_valid_after || null;
                razaoSocial = razaoSocial || certInfo.nome_razao_social || certInfo.subject_name || null;
              } else {
                await certInfoRes.text();
              }
            } catch (e) {
              console.error("Error fetching cert info:", e);
            }
          }
        } catch (parseErr) {
          console.error("Error processing certificate:", parseErr);
        }

        // Upload .pfx to Supabase Storage
        const storagePath = `${userId}/${cnpjClean}.pfx`;
        const pfxBuffer = Uint8Array.from(atob(pfxBase64), c => c.charCodeAt(0));

        const { error: uploadError } = await supabase.storage
          .from("certificados")
          .upload(storagePath, pfxBuffer, {
            contentType: "application/x-pkcs12",
            upsert: true,
          });

        if (uploadError) {
          console.error("Storage upload error:", uploadError);
          throw new Error("Erro ao salvar certificado no storage");
        }

        // Save metadata
        const { data: existing } = await supabase
          .from("certificados")
          .select("id")
          .eq("user_id", userId)
          .eq("cnpj", cnpjClean)
          .maybeSingle();

        const certRecord = {
          user_id: userId,
          cnpj: cnpjClean,
          razao_social: razaoSocial,
          senha_certificado: senha,
          validade,
          storage_path: storagePath,
          updated_at: new Date().toISOString(),
        };

        let savedCert;
        if (existing) {
          const { data, error } = await supabase
            .from("certificados")
            .update(certRecord)
            .eq("id", existing.id)
            .select()
            .single();
          if (error) throw error;
          savedCert = data;
        } else {
          const { data, error } = await supabase
            .from("certificados")
            .insert(certRecord)
            .select()
            .single();
          if (error) throw error;
          savedCert = data;
        }

        return new Response(JSON.stringify({
          success: true,
          certificado: {
            id: savedCert.id,
            cnpj: savedCert.cnpj,
            razao_social: savedCert.razao_social,
            validade: savedCert.validade,
            ultimo_nsu: savedCert.ultimo_nsu,
          },
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "consultar-nfes": {
        const { cnpj } = params;
        if (!cnpj) throw new Error("CNPJ é obrigatório");

        const cnpjClean = cnpj.replace(/\D/g, "");

        const { data: certRecord, error: certError } = await supabase
          .from("certificados")
          .select("*")
          .eq("user_id", userId)
          .eq("cnpj", cnpjClean)
          .single();

        if (certError || !certRecord) {
          throw new Error("Certificado não encontrado. Faça upload primeiro.");
        }

        const ultimoNsu = certRecord.ultimo_nsu || "0";
        console.log(`Consulting SEFAZ for CNPJ ${cnpjClean}, ultimo_nsu: ${ultimoNsu}`);

        // Nuvem Fiscal DistDFeInt endpoint
        const distRes = await fetch(
          `${NUVEM_FISCAL_BASE}/nfe/distribuicoes`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${nfToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              cpf_cnpj: cnpjClean,
              ultimo_nsu: ultimoNsu,
            }),
          }
        );

        const distText = await distRes.text();
        console.log("Distribution status:", distRes.status);
        console.log("Distribution response:", distText.substring(0, 3000));

        if (!distRes.ok) {
          console.error("Distribution error:", distText);
          throw new Error(`Erro na consulta SEFAZ: ${distRes.status} - ${distText.substring(0, 200)}`);
        }

        const distData = JSON.parse(distText);

        const xmlDocuments: Array<{
          nsu: string;
          chave_acesso: string;
          xml: string;
          tipo: string;
        }> = [];

        let maxNsu = ultimoNsu;

        // Parse documents from response
        const documentos = distData.documentos || distData.body?.documentos || distData.data || [];

        if (Array.isArray(documentos)) {
          for (const doc of documentos) {
            const docNsu = doc.nsu || doc.NSU || "";
            if (docNsu && docNsu > maxNsu) {
              maxNsu = docNsu;
            }
            
            const xml = doc.xml || doc.body || "";
            const tipo = doc.tipo_documento || doc.tipo || doc.schema || "nfe";
            
            if (xml) {
              xmlDocuments.push({
                nsu: docNsu,
                chave_acesso: doc.chave_acesso || doc.chave || doc.chNFe || "",
                xml,
                tipo,
              });
            }
          }
        }

        // Check for max_nsu in response
        const responseMaxNsu = distData.max_nsu || distData.ultimo_nsu || distData.ultNSU || "";
        if (responseMaxNsu && responseMaxNsu > maxNsu) {
          maxNsu = responseMaxNsu;
        }

        console.log(`Found ${xmlDocuments.length} documents. Max NSU: ${maxNsu} (was: ${ultimoNsu})`);

        // Update ultimo_nsu
        if (maxNsu !== ultimoNsu) {
          const { error: updateError } = await supabase
            .from("certificados")
            .update({ 
              ultimo_nsu: maxNsu, 
              updated_at: new Date().toISOString() 
            })
            .eq("id", certRecord.id);
          
          if (updateError) {
            console.error("Error updating NSU:", updateError);
          } else {
            console.log(`NSU updated: ${ultimoNsu} -> ${maxNsu}`);
          }
        }

        return new Response(JSON.stringify({
          success: true,
          documentos: xmlDocuments,
          ultimo_nsu: maxNsu,
          total: xmlDocuments.length,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get-certificate": {
        const { data: certs, error } = await supabase
          .from("certificados")
          .select("id, cnpj, razao_social, validade, ultimo_nsu, created_at, updated_at")
          .eq("user_id", userId);

        if (error) throw error;

        return new Response(JSON.stringify({
          success: true,
          certificados: certs || [],
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete-certificate": {
        const { certificadoId } = params;

        const { data: cert } = await supabase
          .from("certificados")
          .select("storage_path, cnpj")
          .eq("id", certificadoId)
          .eq("user_id", userId)
          .single();

        if (cert?.storage_path) {
          await supabase.storage.from("certificados").remove([cert.storage_path]);
        }

        if (cert?.cnpj) {
          try {
            const delRes = await fetch(
              `${NUVEM_FISCAL_BASE}/empresas/${cert.cnpj}/certificado`,
              {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${nfToken}` },
              }
            );
            await delRes.text();
          } catch (e) {
            console.error("Error deleting cert from Nuvem Fiscal:", e);
          }
        }

        await supabase
          .from("certificados")
          .delete()
          .eq("id", certificadoId)
          .eq("user_id", userId);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        throw new Error(`Ação desconhecida: ${action}`);
    }
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
