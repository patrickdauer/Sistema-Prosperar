import htmlPdf from 'html-pdf-node';
import type { BusinessRegistration } from '@shared/schema';

export async function generateBusinessRegistrationPDF(registration: BusinessRegistration): Promise<Buffer> {
  const socios = registration.socios as any[];
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Dados para Abertura de Empresa - ${registration.razaoSocial}</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                margin: 40px;
                color: #333;
            }
            .header {
                text-align: center;
                border-bottom: 3px solid #007bff;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .company-name {
                font-size: 24px;
                font-weight: bold;
                color: #007bff;
                margin-bottom: 10px;
            }
            .section {
                margin-bottom: 25px;
                page-break-inside: avoid;
            }
            .section-title {
                font-size: 18px;
                font-weight: bold;
                color: #007bff;
                border-bottom: 2px solid #e9ecef;
                padding-bottom: 5px;
                margin-bottom: 15px;
            }
            .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin-bottom: 15px;
            }
            .info-item {
                margin-bottom: 10px;
            }
            .label {
                font-weight: bold;
                color: #495057;
            }
            .value {
                margin-left: 10px;
            }
            .full-width {
                grid-column: span 2;
            }
            .partner-section {
                border: 1px solid #dee2e6;
                border-radius: 5px;
                padding: 15px;
                margin-bottom: 20px;
                background-color: #f8f9fa;
            }
            .partner-title {
                font-size: 16px;
                font-weight: bold;
                color: #28a745;
                margin-bottom: 10px;
            }
            .footer {
                margin-top: 40px;
                text-align: center;
                font-size: 12px;
                color: #6c757d;
                border-top: 1px solid #e9ecef;
                padding-top: 15px;
            }
            .activities-list {
                list-style-type: disc;
                margin-left: 20px;
            }
            @media print {
                body { margin: 20px; }
                .section { page-break-inside: avoid; }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="company-name">PROSPERAR CONTABILIDADE</div>
            <h1>DADOS PARA ABERTURA DE EMPRESA</h1>
            <p>Solicitação ID: ${registration.id} | Data: ${registration.createdAt?.toLocaleDateString('pt-BR')}</p>
        </div>

        <div class="section">
            <div class="section-title">📋 DADOS DA EMPRESA</div>
            <div class="info-grid">
                <div class="info-item">
                    <span class="label">Razão Social:</span>
                    <span class="value">${registration.razaoSocial}</span>
                </div>
                <div class="info-item">
                    <span class="label">Nome Fantasia:</span>
                    <span class="value">${registration.nomeFantasia}</span>
                </div>
                <div class="info-item full-width">
                    <span class="label">Endereço:</span>
                    <span class="value">${registration.endereco}</span>
                </div>
                <div class="info-item">
                    <span class="label">Inscrição Imobiliária:</span>
                    <span class="value">${registration.inscricaoImobiliaria}</span>
                </div>
                <div class="info-item">
                    <span class="label">Metragem Ocupada:</span>
                    <span class="value">${registration.metragem}m²</span>
                </div>
                <div class="info-item">
                    <span class="label">Telefone:</span>
                    <span class="value">${registration.telefoneEmpresa}</span>
                </div>
                <div class="info-item">
                    <span class="label">E-mail:</span>
                    <span class="value">${registration.emailEmpresa}</span>
                </div>
                <div class="info-item">
                    <span class="label">Capital Social:</span>
                    <span class="value">R$ ${registration.capitalSocial}</span>
                </div>
                <div class="info-item full-width">
                    <span class="label">Atividade Principal:</span>
                    <span class="value">${registration.atividadePrincipal}</span>
                </div>
                ${registration.atividadesSecundarias ? `
                <div class="info-item full-width">
                    <span class="label">Atividades Secundárias:</span>
                    <span class="value">${registration.atividadesSecundarias}</span>
                </div>
                ` : ''}
                ${registration.atividadesSugeridas && registration.atividadesSugeridas.length > 0 ? `
                <div class="info-item full-width">
                    <span class="label">Atividades Sugeridas Selecionadas:</span>
                    <ul class="activities-list">
                        ${registration.atividadesSugeridas.map(atividade => `<li>${atividade}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
            </div>
        </div>

        <div class="section">
            <div class="section-title">👥 DADOS DOS SÓCIOS (${socios.length})</div>
            ${socios.map((socio, index) => `
                <div class="partner-section">
                    <div class="partner-title">Sócio ${index + 1}</div>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="label">Nome Completo:</span>
                            <span class="value">${socio.nomeCompleto}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Nacionalidade:</span>
                            <span class="value">${socio.nacionalidade}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">CPF:</span>
                            <span class="value">${socio.cpf}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">RG:</span>
                            <span class="value">${socio.rg}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Data de Nascimento:</span>
                            <span class="value">${socio.dataNascimento}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Estado Civil:</span>
                            <span class="value">${socio.estadoCivil}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Profissão:</span>
                            <span class="value">${socio.profissao}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Telefone Pessoal:</span>
                            <span class="value">${socio.telefonePessoal}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">E-mail Pessoal:</span>
                            <span class="value">${socio.emailPessoal}</span>
                        </div>
                        <div class="info-item full-width">
                            <span class="label">Filiação:</span>
                            <span class="value">${socio.filiacao}</span>
                        </div>
                        <div class="info-item full-width">
                            <span class="label">Endereço Pessoal:</span>
                            <span class="value">${socio.enderecoPessoal}</span>
                        </div>
                        <div class="info-item full-width">
                            <span class="label">Documentos Enviados:</span>
                            <span class="value">
                                ${socio.documentoComFotoUrl ? '✓ Documento com foto' : '✗ Documento com foto'} | 
                                ${socio.certidaoCasamentoUrl ? '✓ Certidão de casamento' : '✗ Certidão de casamento'} | 
                                ${socio.documentosAdicionaisUrls?.length ? `✓ ${socio.documentosAdicionaisUrls.length} documento(s) adicional(is)` : '✗ Documentos adicionais'}
                            </span>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>

        <div class="footer">
            <p><strong>Prosperar Contabilidade</strong></p>
            <p>📧 contato@prosperarcontabilidade.com.br</p>
            <p>Documento gerado automaticamente em ${new Date().toLocaleString('pt-BR')}</p>
        </div>
    </body>
    </html>
  `;

  const options = {
    format: 'A4',
    border: {
      top: '20px',
      right: '20px',
      bottom: '20px',
      left: '20px'
    }
  };

  const file = { content: htmlContent };
  const pdfBuffer = await htmlPdf.generatePdf(file, options);
  
  return pdfBuffer;
}