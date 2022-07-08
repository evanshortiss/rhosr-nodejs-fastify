import Fastify from 'fastify'
import { SchemaType } from '@kafkajs/confluent-schema-registry'
import { SchemaRegistryAPIClientArgs } from '@kafkajs/confluent-schema-registry/dist/api'
import { ConsumerConfig, KafkaConfig } from 'kafkajs'
import { FastifyKafkaJsOpts } from './kafka-plugin'
import { FastifySchemaRegistryOpts } from './schema-registry-plugin'
import S from 'fluent-json-schema'
import config from './config'
import { Song } from './schemas/song.json'

const fastify = Fastify({
  logger: true
})

fastify.register(require('./kafka-plugin'), {
  config: {
    clientId: 'sr-test',
    brokers: [config.BOOTSTRAP_SERVER],
    ssl: true,
    sasl: {
      username: config.CLIENT_ID,
      password: config.CLIENT_SECRET,
      mechanism: 'plain'
    }
  } as KafkaConfig,
  producer: true,
  consumer: {
    groupId: 'fastify'
  } as ConsumerConfig
} as FastifyKafkaJsOpts)

fastify.register(require('./schema-registry-plugin'), {
  registryConfig: {
    host: config.REGISTRY_URL,
    auth: {
      username: config.CLIENT_ID,
      password: config.CLIENT_SECRET
    }
  } as SchemaRegistryAPIClientArgs
} as FastifySchemaRegistryOpts)


fastify.get('/', async () => {
  
})

fastify.addHook('onReady', () => {
  console.log('ready!')
  if (fastify.kafka.consumer) {
    fastify.kafka.consumer.subscribe({ topic: 'quote-requests', fromBeginning: true })
    fastify.kafka.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
  
        if (message && message.value) {
          console.log(await fastify.registry.decode(message.value))
        } else {
          console.log('NULL message received')
        }
      },
    })
    console.log('started consumer')
  } else {
    throw new Error('consumer not defined')
  }
})

fastify.route({
  url: '/',
  method: 'POST',
  schema: {
    body: S.object()
    .additionalProperties(false)
    .prop('artist', S.string().minLength(2).maxLength(100).required())
    .prop('name', S.string().minLength(2).maxLength(100).required())
    // .prop('year', S.number().minimum(0).maximum(9999).required())
  },
  handler: async (req, reply) => {
    const { registry } = fastify
    const { producer } = fastify.kafka

    if (!producer) {
      throw new Error('Kafka producer is not enabled/configured')
    }

    const { id } = await registry.register({
      type: SchemaType.AVRO,
      schema: JSON.stringify(require('./schemas/json/song.json'))
    })

    fastify.log.info('schema registered. id is: %j', { id })

    const key = (req.body as Song).artist
    const value = await registry.encode(id, req.body)

    fastify.log.info('encoded body is: %j', { value })

    const result = await producer.send({
      topic: 'songs',
      messages: [{
        key,
        value
      }]
    })

    reply.send(result)
  }
})

fastify.listen(3000, '0.0.0.0', function (err, address) {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
  fastify.log.info(`server listening on ${address}`)
})
