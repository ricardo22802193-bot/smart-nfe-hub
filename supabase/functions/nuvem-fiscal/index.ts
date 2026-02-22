import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const NUVEM_FISCAL_BASE = "https://api.nuvemfiscal.com.br";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const nuvemFiscalKey = Deno.env.get("NUVEM_FISCAL_API_KEY");

    if (!nuvemFiscalKey) {
      throw new Error("NUVEM_FISCAL_API_KEY não configurada");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ success: false, error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Decode JWT to extract user ID
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

    const { action, ...params } = await req.json();

    switch (action) {
      case "upload-certificate": {
        const { pfxBase64, senha, cnpj } = params;

        if (!pfxBase64 || !senha || !cnpj) {
          throw new Error("Certificado (.pfx), senha e CNPJ são obrigatórios");
        }

        // Parse certificate to get expiry date using node-forge via npm
        let validade: string | null = null;
        let razaoSocial: string | null = null;

        try {
          // Decode base64 to binary
          const pfxBinary = atob(pfxBase64);
          const pfxBytes = new Uint8Array(pfxBinary.length);
          for (let i = 0; i < pfxBinary.length; i++) {
            pfxBytes[i] = pfxBinary.charCodeAt(i);
          }

          // Try to extract certificate info using Nuvem Fiscal API
          // Upload certificate to Nuvem Fiscal - they return certificate details
          // First, ensure company is registered
          const empresaRes = await fetch(`${NUVEM_FISCAL_BASE}/empresas`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${nuvemFiscalKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              cpf_cnpj: cnpj.replace(/\D/g, ""),
            }),
          });

          // If company already exists (409), that's fine
          if (!empresaRes.ok && empresaRes.status !== 409) {
            const errText = await empresaRes.text();
            console.error("Error registering company:", errText);
            // Continue anyway - we'll still save the certificate
          }

          // Upload certificate to Nuvem Fiscal
          const certUploadRes = await fetch(
            `${NUVEM_FISCAL_BASE}/empresas/${cnpj.replace(/\D/g, "")}/certificado`,
            {
              method: "PUT",
              headers: {
                "Authorization": `Bearer ${nuvemFiscalKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                certificado: pfxBase64,
                password: senha,
              }),
            }
          );

          if (certUploadRes.ok) {
            const certData = await certUploadRes.json();
            if (certData.validade || certData.not_after) {
              validade = certData.validade || certData.not_after;
            }
            if (certData.razao_social || certData.common_name) {
              razaoSocial = certData.razao_social || certData.common_name;
            }
          } else {
            const errText = await certUploadRes.text();
            console.error("Error uploading cert to Nuvem Fiscal:", errText);
            // Try to parse the error - if it contains certificate info, extract it
            try {
              const errData = JSON.parse(errText);
              if (errData.validade || errData.not_after) {
                validade = errData.validade || errData.not_after;
              }
            } catch {}
          }
        } catch (parseErr) {
          console.error("Error processing certificate:", parseErr);
        }

        // Upload .pfx to Supabase Storage
        const storagePath = `${userId}/${cnpj.replace(/\D/g, "")}.pfx`;
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

        // Save metadata to database
        const { data: existing } = await supabase
          .from("certificados")
          .select("id")
          .eq("user_id", userId)
          .eq("cnpj", cnpj.replace(/\D/g, ""))
          .maybeSingle();

        const certRecord = {
          user_id: userId,
          cnpj: cnpj.replace(/\D/g, ""),
          razao_social: razaoSocial,
          senha_certificado: senha,
          validade: validade,
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

        // Get certificate record for NSU
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

        // Query Nuvem Fiscal distribution API
        const distRes = await fetch(
          `${NUVEM_FISCAL_BASE}/nfe/distribuicoes?cpf_cnpj=${cnpjClean}&ultimo_nsu=${ultimoNsu}`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${nuvemFiscalKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              cpf_cnpj: cnpjClean,
              ultimo_nsu: ultimoNsu,
            }),
          }
        );

        if (!distRes.ok) {
          const errText = await distRes.text();
          console.error("Distribution error:", errText);
          throw new Error(`Erro na consulta SEFAZ: ${distRes.status}`);
        }

        const distData = await distRes.json();

        // Extract XMLs from the response
        const xmlDocuments: Array<{
          nsu: string;
          chave_acesso: string;
          xml: string;
          tipo: string;
        }> = [];

        let maxNsu = ultimoNsu;

        if (distData.documentos && Array.isArray(distData.documentos)) {
          for (const doc of distData.documentos) {
            if (doc.nsu && doc.nsu > maxNsu) {
              maxNsu = doc.nsu;
            }
            if (doc.xml) {
              xmlDocuments.push({
                nsu: doc.nsu || "",
                chave_acesso: doc.chave_acesso || doc.chave || "",
                xml: doc.xml,
                tipo: doc.tipo_documento || doc.tipo || "nfe",
              });
            }
          }
        }

        // Also check if the response has a different structure
        if (distData.body?.documentos && Array.isArray(distData.body.documentos)) {
          for (const doc of distData.body.documentos) {
            if (doc.nsu && doc.nsu > maxNsu) {
              maxNsu = doc.nsu;
            }
            if (doc.xml) {
              xmlDocuments.push({
                nsu: doc.nsu || "",
                chave_acesso: doc.chave_acesso || doc.chave || "",
                xml: doc.xml,
                tipo: doc.tipo_documento || doc.tipo || "nfe",
              });
            }
          }
        }

        // Update last NSU
        if (maxNsu !== ultimoNsu) {
          await supabase
            .from("certificados")
            .update({ ultimo_nsu: maxNsu, updated_at: new Date().toISOString() })
            .eq("id", certRecord.id);
        }

        return new Response(JSON.stringify({
          success: true,
          documentos: xmlDocuments,
          ultimo_nsu: maxNsu,
          total: xmlDocuments.length,
          max_nsu_response: distData.max_nsu || distData.ultimo_nsu || maxNsu,
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
          .select("storage_path")
          .eq("id", certificadoId)
          .eq("user_id", userId)
          .single();

        if (cert?.storage_path) {
          await supabase.storage.from("certificados").remove([cert.storage_path]);
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
