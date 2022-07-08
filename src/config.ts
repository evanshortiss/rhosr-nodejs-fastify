import { get } from 'env-var'

const config = {
  HTTP_PORT: get('HTTP_PORT').default(8080).asPortNumber(),
  HTTP_HOST: get('HTTP_HOS').default('0.0.0.0').asString(),

  REGISTRY_URL: get('REGISTRY_URL').required().asString(),
  BOOTSTRAP_SERVER: get('BOOTSTRAP_SERVER').required().asString(),
  CLIENT_ID: get('CLIENT_ID').required().asString(),
  CLIENT_SECRET: get('CLIENT_SECRET').required().asString()
}

export default config
