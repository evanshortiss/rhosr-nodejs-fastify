import fp from 'fastify-plugin'
import { FastifyInstance } from 'fastify'
import { SchemaRegistry } from '@kafkajs/confluent-schema-registry'
import { SchemaRegistryAPIClientArgs } from '@kafkajs/confluent-schema-registry/dist/api'

export type FastifySchemaRegistryOpts = {
  registryConfig: SchemaRegistryAPIClientArgs
}

export default fp(fastifySchemaRegistry, {
  fastify: '>=3',
  name: 'fastify-kafka'
})

function fastifySchemaRegistry (fastify: FastifyInstance, opts: FastifySchemaRegistryOpts, next: (err?: Error) => void) {
  fastify.decorate('registry', {})

  const { registryConfig } = opts

  const client = new SchemaRegistry(registryConfig)

  fastify.registry = client

  console.log()

  next()
}

declare module 'fastify' {
  interface FastifyInstance {
    registry: SchemaRegistry;
  }
}


