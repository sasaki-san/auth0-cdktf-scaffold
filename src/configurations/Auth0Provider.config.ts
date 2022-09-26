require('dotenv').config();
import { Auth0ProviderConfig } from "../../.gen/providers/auth0";

export interface IAuth0ProviderBaseConfig extends Auth0ProviderConfig {
  domain: string
  clientId: string
  clientSecret: string
}

export const Auth0ProviderBaseConfig = {
  domain: process.env.DOMAIN,
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
} as IAuth0ProviderBaseConfig 