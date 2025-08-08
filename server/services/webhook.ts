import type { ContratacaoFuncionario } from '@shared/contratacao-schema';

export class WebhookService {
  private webhookUrl: string;

  constructor(webhookUrl: string) {
    this.webhookUrl = webhookUrl;
  }

  async sendContratacaoData(contratacao: ContratacaoFuncionario, folderLink?: string, publicLinks?: any[], emailInfo?: any, folderPath?: string): Promise<boolean> {
    try {
      const payload = {
        id: contratacao.id,
        timestamp: new Date().toISOString(),
        type: 'contratacao_funcionario',
        emailSent: emailInfo ? {
          success: emailInfo.success,
          recipients: emailInfo.recipients,
          timestamp: emailInfo.timestamp,
          messageId: emailInfo.messageId
        } : null,
        data: {
          empresa: {
            razaoSocial: contratacao.razaoSocial,
            cnpj: contratacao.cnpj,
            endereco: contratacao.endereco,
            telefone: contratacao.telefone,
            email: contratacao.email,
            responsavel: contratacao.responsavel
          },
          funcionario: {
            nome: contratacao.nomeFuncionario,
            cpf: contratacao.cpfFuncionario,
            rg: contratacao.rgFuncionario,
            dataNascimento: contratacao.dataNascimento,
            estadoCivil: contratacao.estadoCivil,
            escolaridade: contratacao.escolaridade,
            endereco: contratacao.endereco_funcionario,
            telefone: contratacao.telefone_funcionario,
            email: contratacao.email_funcionario
          },
          cargo: {
            cargo: contratacao.cargo,
            setor: contratacao.setor,
            salario: contratacao.salario,
            cargaHoraria: contratacao.cargaHoraria,
            tipoContrato: contratacao.tipoContrato,
            dataAdmissao: contratacao.dataAdmissao
          },
          beneficios: {
            valeTransporte: contratacao.valeTransporte,
            valeRefeicao: contratacao.valeRefeicao,
            valeAlimentacao: contratacao.valeAlimentacao,
            planoSaude: contratacao.planoSaude,
            planoDental: contratacao.planoDental,
            seguroVida: contratacao.seguroVida
          },
          dadosBancarios: {
            banco: contratacao.banco,
            agencia: contratacao.agencia,
            conta: contratacao.conta,
            tipoConta: contratacao.tipoConta
          },
          informacoesAdicionais: {
            numeroPis: contratacao.numeroPis,
            observacoes: contratacao.observacoes
          }
        },
        googleDriveFolder: folderLink,
        objectStorage: {
          folderPath: folderPath || folderLink,
          note: "Files accessible via Replit workspace > Object Storage",
          publicDownloadLinks: publicLinks || []
        }
      };

      console.log('📤 Sending webhook payload with public links:', {
        id: contratacao.id,
        publicLinksCount: publicLinks?.length || 0,
        publicLinks: publicLinks?.map(link => ({ name: link.name, type: link.type })) || []
      });

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error('Webhook request failed:', response.status, response.statusText);
        return false;
      }

      console.log('Webhook sent successfully to:', this.webhookUrl);
      return true;
    } catch (error) {
      console.error('Error sending webhook:', error);
      return false;
    }
  }
}

export const webhookService = new WebhookService(
  'https://webhook.aquiprospera.com.br/webhook/515d783f-ebad-4f9b-bdfe-dd9c214525a9'
);