import { Construct } from "constructs";
import { App, Fn, TerraformStack } from "cdktf";
import { config } from "../configs"
import { Types, Utils, Validators } from "../utils";
import { Client } from "../../.gen/providers/auth0/client";
import { Connection } from "../../.gen/providers/auth0/connection";
import { Auth0Provider } from "../../.gen/providers/auth0/provider";
import { ResourceServer } from "../../.gen/providers/auth0/resource-server";
import { Rule } from "../../.gen/providers/auth0/rule";
import { Tenant } from "../../.gen/providers/auth0/tenant";
import { User } from "../../.gen/providers/auth0/user";

class Stack extends TerraformStack {

  readonly auth0Provider: Auth0Provider
  readonly client: Client
  readonly resourceServer: ResourceServer
  readonly connection: Connection
  readonly user: User
  readonly tenant: Tenant

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
      ...config.base.client.spa,
      name: Utils.id(name, "client")
    })

    // Create an Auth0 API 
    this.resourceServer = new ResourceServer(this, Utils.id(name, "api"), {
      ...config.base.api.default,
      name: Utils.id(name, "api"),
      identifier: `https://${name}`,
    })

    // Create an Auth0 Connection
    this.connection = new Connection(this, Utils.id(name, "connection"), {
      ...config.base.connection.auth0,
      name: Utils.id(name, "connection"),
      enabledClients: [this.client.clientId, config.env.CLIENT_ID]
    })

    // Create a User in the created connection
    this.user = new User(this, Utils.id(name, "user"), {
      ...config.base.user.john,
      connectionName: this.connection.name,
      emailVerified: false
    })

    // Add force email verification rule
    new Rule(this, Utils.id(name, "rule"), {
      name: "Force Email Verification",
      script: Fn.file(Utils.assetPath("rules", "force-email-verification.js")),
      enabled: true,
    })

    // Apply a custom error page
    this.tenant = new Tenant(this, Utils.id(name, "tenant"), {
      sessionCookie: {
        mode: Types.TenantCookieSessionModes.persistent
      },
      errorPage: {
        html: Fn.file(Utils.assetPath("errors", "custom-error-page.html")),
        url: "",
        showLogLink: true
      }
    })

  }
}

export default (app: App) => {
  new Stack(app, "custom-error-page");
}