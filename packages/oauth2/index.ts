export { getJWKS } from "./getJWKS";
export { verifyJWT } from "./verifyJWT";
import { OpenIDConfiguration, OAuth2ClientConstructor } from "./types";

class OAuth2Client {
  openIDConfigurationURL: string;
  clientID: string;
  clientSecret: string;
  redirectURI: string;
  openIDConfiguration?: OpenIDConfiguration;

  constructor({
    openIDConfigurationURL,
    clientID,
    clientSecret,
    redirectURI,
    openIDConfiguration,
  }: OAuth2ClientConstructor) {
    this.openIDConfigurationURL = openIDConfigurationURL;
    this.clientID = clientID;
    this.clientSecret = clientSecret;
    this.redirectURI = redirectURI;
    this.openIDConfiguration = openIDConfiguration;
  }

  private async getOpenIDConfiguration(): Promise<OpenIDConfiguration> {
    const openIDConfiguration: OpenIDConfiguration = await fetch(
      this.openIDConfigurationURL,
    ).then((response) => response.json());

    return openIDConfiguration;
  }

  async init(): Promise<OAuth2Client> {
    const openIDConfiguration = await this.getOpenIDConfiguration();

    const CompleteOAuth2ClientConstructorParams = {
      openIDConfigurationURL: this.openIDConfigurationURL,
      clientID: this.clientID,
      clientSecret: this.clientSecret,
      redirectURI: this.redirectURI,
      openIDConfiguration: openIDConfiguration,
    };

    return new OAuth2Client(CompleteOAuth2ClientConstructorParams);
  }

  getAuthorizationURL(): URL {
    const authorizeURL = new URL(
      "/oauth/authorize",
      this.openIDConfiguration.issuer,
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

  getTokensFromAuthorizationCode(_authorizationCode): string[] {
    // Verify RS256 vs HS256
    // Decode

    return [""];
  }
}

export default OAuth2Client;

export { OpenIDConfiguration, OAuth2ClientConstructor };
