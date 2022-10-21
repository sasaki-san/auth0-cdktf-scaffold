import { Construct } from "constructs";
import { App, Fn, TerraformStack } from "cdktf";
import { Auth0Provider, Client, GlobalClient, ClientGrant, Connection, ResourceServer, User } from "../../.gen/providers/auth0"
import { config } from "../configs"
import { Types, Utils, Validators } from "../utils";

class Stack extends TerraformStack {

  readonly auth0Provider: Auth0Provider
  readonly client: Client
  readonly resourceServer: ResourceServer
  readonly clientGrants: ClientGrant
  readonly connection: Connection
  readonly user: User
  readonly globalClient: GlobalClient

  constructor(scope: Construct, name: string) {
    super(scope, name)

    Validators.validateEnvValues(["DOMAIN", "CLIENT_ID", "CLIENT_SECRET", "PASSWORDLESS_SMS_SEND_FROM_NUMBER", "PASSWORDLESS_SMS_USER_PHONE_NUMBER", "TWILIO_SID", "TWILIO_TOKEN"])

    this.auth0Provider = new Auth0Provider(this, Utils.id(name, "auth0provider"), {
      domain: config.env.DOMAIN,
      clientId: config.env.CLIENT_ID,
      clientSecret: config.env.CLIENT_SECRET
    })

    // Create an Auth0 Application
    this.client = new Client(this, Utils.id(name, "client"), {
      ...config.base.client.rwa,
      name: Utils.id(name, "client"),
      grantTypes: [
        Types.GrantTypes.implicit,
        Types.GrantTypes.passwordless_otp
      ]
    })

    // Create an Auth0 API 
    this.resourceServer = new ResourceServer(this, Utils.id(name, "api"), {
      ...config.base.api.default,
      name: Utils.id(name, "api"),
      identifier: `https://${name}`,
      scopes: [{ value: "transfer:funds", description: "Transfer funds" }]
    })

    // Grant API permissions to the Applicaiton
    this.clientGrants = new ClientGrant(this, Utils.id(name, "client-grants"), {
      clientId: this.client.clientId,
      audience: this.resourceServer.identifier,
      scope: ["transfer:funds"]
    })

    // Create a Passwordless - SMS Connection
    this.connection = new Connection(this, Utils.id(name, "connection-sms"), {
      ...config.base.connection.sms,
      options: {
        ...config.base.connection.sms.options,
        from: config.env.PASSWORDLESS_SMS_SEND_FROM_NUMBER,
        twilioSid: config.env.TWILIO_SID,
        twilioToken: config.env.TWILIO_TOKEN
      },
      enabledClients: [this.client.clientId, config.env.CLIENT_ID]
    })

    // Create a User in the connection
    this.user = new User(this, Utils.id(name, "user"), {
      ...config.base.user.passwordless.bo,
      connectionName: this.connection.name,
      phoneNumber: config.env.PASSWORDLESS_SMS_USER_PHONE_NUMBER
    })

    // Enable passwordless login
    this.globalClient = new GlobalClient(this, Utils.id(name, "globalclient"), {
      customLoginPageOn: true,
      customLoginPage: Fn.file(Utils.assetPath("classic-ul", "login.passwordless.html"))
    })

  }
}

export default (app: App) => {
  new Stack(app, "passwordless-sms");
}