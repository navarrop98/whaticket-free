import axios from "axios";

export interface WebhookMessageData {
  event: string;
  timestamp: string;
  data: {
    messageId?: number;
    ticketId?: number;
    contactId?: number;
    body?: string;
    fromMe?: boolean;
    read?: boolean;
    createdAt?: Date;
    status?: string;
    userId?: number;
    unreadMessages?: number;
    lastMessageAt?: Date;
    updatedAt?: Date;
  };
}

export class WebhookSender {
  private static n8nWebhookUrl = "http://localhost:5678/webhook/wati-ticket";
  static async sendToN8N(data: WebhookMessageData): Promise<boolean> {
    try {
      console.log(`Enviando webhook a n8n: ${data.event}`);
      
      const response = await axios.post(this.n8nWebhookUrl, data, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log(`Webhook enviado exitosamente: ${response.status}`);
      return response.status >= 200 && response.status < 300;
    } catch (error: any) {
      console.error('Error enviando webhook a n8n:', error.message);
      if (error.response) {
        console.error('Respuesta de error:', error.response.status, error.response.data);
      }
      return false;
    }
  }

  static async sendNewMessageWebhook(message: any, ticket: any): Promise<void> {
    const webhookData: WebhookMessageData = {
      event: 'new_message',
      timestamp: new Date().toISOString(),
      data: {
        messageId: message.id,
        ticketId: ticket.id,
        contactId: ticket.contactId,
        body: message.body,
        fromMe: message.fromMe,
        read: message.read,
        createdAt: message.createdAt
      }
    };

    await this.sendToN8N(webhookData);
  }

  static async sendTicketUpdateWebhook(ticket: any, oldStatus?: string): Promise<void> {
    const webhookData: WebhookMessageData = {
      event: 'ticket_update',
      timestamp: new Date().toISOString(),
      data: {
        ticketId: ticket.id,
        status: ticket.status,
        userId: ticket.userId,
        unreadMessages: ticket.unreadMessages,
        lastMessageAt: ticket.lastMessageAt,
        updatedAt: ticket.updatedAt
      }
    };

    await this.sendToN8N(webhookData);
  }
}

export default WebhookSender;
