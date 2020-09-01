export { verifyJWT } from "./verifyJWT";
import { OpenIDConfiguration, OAuth2ClientConstructor, JWKSDT } from "./types";

class OAuth2Client {
  openIDConfigurationURL: string;
  clientID: string;
  clientSecret: string;
  redirectURI: string;
  audience: string;
  openIDConfiguration?: OpenIDConfiguration;

  constructor({
    openIDConfigurationURL,
    clientID,
    clientSecret,
    redirectURI,
    audience,
  }: OAuth2ClientConstructor) {
    this.openIDConfigurationURL = openIDConfigurationURL;
    this.clientID = clientID;
    this.clientSecret = clientSecret;
    this.redirectURI = redirectURI;
    this.audience = audience;
  }

  private async getOpenIDConfiguration(): Promise<OpenIDConfiguration> {
    const openIDConfiguration: OpenIDConfiguration = await fetch(
      this.openIDConfigurationURL,
    )
      .then((response) => response.json())
      .catch((error) => {
        throw error;
      });

    return openIDConfiguration;
  }

  async getAuthorizationURL(): Promise<URL> {
    this.openIDConfiguration = this.openIDConfiguration
      ? this.openIDConfiguration
      : await this.getOpenIDConfiguration();

    const authorizeURL = new URL(
      this.openIDConfiguration.authorization_endpoint,
    );

    authorizeURL.searchParams.append("client_id", this.clientID);
    authorizeURL.searchParams.append("response_type", "code");
    authorizeURL.searchParams.append("redirect_uri", this.redirectURI);
    authorizeURL.searchParams.append(
      "scope",
      this.openIDConfiguration.scopes_supported.join(" "),
    );

    return authorizeURL;
  }

  async getJWKS(): Promise<JWKSDT> {
    this.openIDConfiguration = this.openIDConfiguration
      ? this.openIDConfiguration
      : await this.getOpenIDConfiguration();

    const JWKS: JWKSDT = await fetch(this.openIDConfiguration.jwks_uri)
      .then((response) => response.json())
      .catch((error) => {
        throw error;
      });

    return JWKS;
  }

  async getTokensFromAuthorizationCode(
    authorizationCode: string,
  ): Promise<string[]> {
    this.openIDConfiguration = this.openIDConfiguration
      ? this.openIDConfiguration
      : await this.getOpenIDConfiguration();

    const callback = {
      client_id: this.clientID,
      client_secret: this.clientSecret,
      code: authorizationCode,
      grant_type: "authorization_code",
      redirect_uri: this.redirectURI,
    };

    const tokens = await fetch(this.openIDConfiguration.token_endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(callback),
    })
      .then((response) => response.json())
      .catch((error) => {
        throw error;
      });

    return tokens;
  }
}

export default OAuth2Client;

export { OpenIDConfiguration, OAuth2ClientConstructor };
