import fp from 'fastify-plugin'
import { FastifyInstance } from 'fastify'
import { ConsumerConfig, ProducerConfig, Producer, Kafka, KafkaConfig, Consumer } from 'kafkajs'

export type FastifyKafkaJsOpts = {
  config: KafkaConfig
  producer: ProducerConfig|boolean,
  consumer: ConsumerConfig
}

export default fp(fastifyKafka, {
  fastify: '>=3',
  name: 'fastify-kafka'
})

async function fastifyKafka (fastify: FastifyInstance, opts: FastifyKafkaJsOpts, next: (err?: Error) => void) {
  fastify.decorate('kafka', {})

  const client = new Kafka(opts.config)
 
  if (opts.producer) {
    fastify.kafka.producer = client.producer(opts.producer === true ? {} : opts.producer)
    await fastify.kafka.producer.connect()
  }


  if (opts.consumer) {
    fastify.kafka.consumer = client.consumer(opts.consumer)
    await fastify.kafka.consumer.connect()
  }

  fastify.addHook('onClose', function closeKafkaJsConnections () {
    fastify.kafka.consumer?.disconnect()
    fastify.kafka.producer?.disconnect()
  })

  next()
}

declare module 'fastify' {
  interface FastifyInstance {
    kafka: {
      producer?: Producer,
      consumer?: Consumer
    };
  }
}
