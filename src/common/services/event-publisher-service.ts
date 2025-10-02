import * as amqplib from 'amqplib';
import { Injectable, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';

@Injectable()
export class EventPublisher implements OnApplicationBootstrap, OnApplicationShutdown {
  private connection: amqplib.Connection;
  private channel: amqplib.Channel;
  private isConnected = false;

  constructor() {}

  async connect(): Promise<void> {
    try {
      this.connection = await amqplib.connect('amqp://rabbitmq:5672');
      this.channel = await this.connection.createChannel();

      await this.channel.assertExchange('microservices_events', 'topic', {
        durable: true,
      });

      this.isConnected = true;
      logger.debug('Connected to RabbitMQ for publishing', 'EventPublisher.connect');
    } catch (error) {
      logger.error('Failed to connect to RabbitMQ', error, 'EventPublisher.connect');
      throw error;
    }
  }

  async onApplicationBootstrap(): Promise<void> {
    logger.debug('Initializing EventPublisher...', 'EventPublisher.onApplicationBootstrap');
    await this.connect();
  }
  async ensureConnection(): Promise<void> {
    if (!this.isConnected || !this.channel) {
      await this.connect();
    }
  }

  async publish(exchange: string, routingKey: string, message: any): Promise<boolean> {
    try {
      await this.ensureConnection();

      const sent = this.channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(message)), {
        persistent: true,
      });

      if (sent) {
        logger.debug(`Message sent to exchange ${exchange} with routing key ${routingKey}`, 'EventPublisher.publish');
      } else {
        logger.warn(`Message not sent to exchange ${exchange}`, 'EventPublisher.publish');
      }

      return sent;
    } catch (error) {
      logger.error('Failed to publish message', error, 'EventPublisher.publish');
      this.isConnected = false;
      throw error;
    }
  }

  async publishForNestJS(exchange: string, pattern: string, data: any): Promise<boolean> {
    try {
      await this.ensureConnection();

      const nestMessage = {
        pattern: pattern,
        data: data,
        id: Math.random().toString(36).substring(7),
        timestamp: new Date().toISOString(),
      };

      const sent = this.channel.publish(exchange, pattern, Buffer.from(JSON.stringify(nestMessage)), {
        persistent: true,
      });

      if (sent) {
        logger.debug(
          `NestJS message sent with pattern ${pattern} messageId: ${nestMessage.id}`,
          'EventPublisher.publishForNestJS',
        );
      } else {
        logger.warn(`NestJS message not sent with pattern ${pattern}`, 'EventPublisher.publishForNestJS');
      }

      return sent;
    } catch (error) {
      logger.error('Failed to publish NestJS message', error, 'EventPublisher.publishForNestJS');
      this.isConnected = false;
      throw error;
    }
  }

  async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        logger.debug('RabbitMQ channel closed', 'EventPublisher.close');
      }

      if (this.connection) {
        await this.connection.close();
        logger.debug('RabbitMQ connection closed', 'EventPublisher.close');
      }

      this.isConnected = false;
    } catch (error) {
      logger.error('Error closing RabbitMQ connection', error, 'EventPublisher.close');
    }
  }

  async onApplicationShutdown(signal?: string): Promise<void> {
    logger.debug(
      'Application is shutting down, closing RabbitMQ connection...',
      'EventPublisher.onApplicationShutdown',
    );
    await this.close();
  }

  getConnectionStatus(): { isConnected: boolean } {
    return { isConnected: this.isConnected };
  }
}
