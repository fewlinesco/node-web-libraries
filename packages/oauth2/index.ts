export { getJWKS } from "./getJWKS";
export { verifyJWT } from "./verifyJWT";
import { OpenIDConfiguration, OAuth2ClientConstructor } from "./types";

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
    ).then((response) => response.json());

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

  // Second step oauth flow send payload
  getTokensFromAuthorizationCode(authorizationCode: string): string[] {
    // Verify RS256 vs HS256
    // Decode

    return [""];
  }
}

export default OAuth2Client;

export { OpenIDConfiguration, OAuth2ClientConstructor };
