import { Construct } from "constructs";
import { App, TerraformStack } from "cdktf";
import { config } from "../configs"
import { Types, Utils, Validators } from "../utils";
import { Client } from "../../.gen/providers/auth0/client";
import { Connection } from "../../.gen/providers/auth0/connection";
import { Auth0Provider } from "../../.gen/providers/auth0/provider";
import { Tenant } from "../../.gen/providers/auth0/tenant";
import { User } from "../../.gen/providers/auth0/user";

class Stack extends TerraformStack {

  readonly auth0Provider: Auth0Provider
  readonly client: Client
  readonly connection: Connection
  readonly user: User
  readonly tenant: Tenant;

  constructor(scope: Construct, name: string) {
    super(scope, name)

    Validators.validateEnvValues(["DOMAIN", "CLIENT_ID", "CLIENT_SECRET"])

    this.auth0Provider = new Auth0Provider(this, Utils.id(name, "auth0provider"), {
      domain: config.env.DOMAIN,
      clientId: config.env.CLIENT_ID,
      clientSecret: config.env.CLIENT_SECRET
    })

    // Create an Auth0 Application
    this.client = new Client(this, Utils.id(name, "client"), {
      ...config.base.client.rwa,
      name: Utils.id(name, "client"),
      grantTypes: [...Types.passwordGrantTypes(), Types.GrantTypes.refresh_token]
    })

    // Create an Auth0 Connection
    this.connection = new Connection(this, Utils.id(name, "connection"), {
      ...config.base.connection.auth0,
      name: Utils.id(name, "connection"),
      enabledClients: [this.client.clientId, config.env.CLIENT_ID]
    })

    // Update both password-reset and multifactor templates
    this.tenant = new Tenant(this, Utils.id(name, "tenant"), {
      defaultDirectory: this.connection.name,
      sessionCookie: {
        mode: Types.TenantCookieSessionModes.persistent 
      }
    })

    // Create a User in the created connection
    this.user = new User(this, Utils.id(name, "user"), {
      ...config.base.user.john,
      connectionName: this.connection.name,
    })

  }
}

export default (app: App) => {
  new Stack(app, "password-grant");
}