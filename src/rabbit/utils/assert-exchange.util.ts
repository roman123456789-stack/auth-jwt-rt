import * as amqp from 'amqplib';

export interface BindQueueParameters {
  amqpUrl: string;
  exchangeName: string;
  queueName: string;
  routingKey: string;
}

export async function bindQueueToExchange(settings: BindQueueParameters): Promise<void> {
  let connection: amqp.Connection | null = null;
  let channel: amqp.Channel | null = null;

  try {
    connection = await amqp.connect(settings.amqpUrl);
    channel = await connection.createChannel();

    // Убедимся, что exchange существует
    await channel.assertExchange(settings.exchangeName, 'topic', {
      durable: true,
      autoDelete: false,
    });

    // Убедимся, что очередь существует
    await channel.assertQueue(settings.queueName, {
      durable: true,
      autoDelete: false,
    });

    // Выполняем привязку
    await channel.bindQueue(settings.queueName, settings.exchangeName, settings.routingKey);

    logger.log(
      `Queue "${settings.queueName}" bound to exchange "${settings.exchangeName}" with routing key "${settings.routingKey}"`,
      'bindQueueToExchange',
    );
  } catch (error) {
    logger.error(
      `Failed to bind queue "${settings.queueName}" to exchange "${settings.exchangeName}"`,
      error,
      'bindQueueToExchange',
    );
    throw error;
  } finally {
    if (channel) await channel.close().catch(() => {});
    if (connection) await connection.close().catch(() => {});
  }
}
