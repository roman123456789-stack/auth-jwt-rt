export interface CreateExchangeParameters {
  amqpUrl: string;
  exchangeName: string;
  exchangeType: 'direct' | 'fanout' | 'topic' | 'headers';
}

export async function createExchangeIfNotExists(settings: CreateExchangeParameters) {
  const amqp = require('amqplib');
  const connection = await amqp.connect(settings.amqpUrl);
  const channel = await connection.createChannel();

  await channel.assertExchange(settings.exchangeName, settings.exchangeType, {
    durable: true,
    autoDelete: false,
  });

  logger.log(`Exchange ${settings.exchangeName} created`, 'createExchangeIfNotExists');
  await channel.close();
  await connection.close();
}
