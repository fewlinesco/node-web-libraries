import cookie from "cookie";

type SetServerSideCookiesOptions = {
  shouldCookieBeSealed: boolean;
  cookieSalt?: string;
} & cookie.CookieSerializeOptions;

type GetServerSideCookiesParams = {
  cookieName: string;
  isCookieSealed: boolean;
  cookieSalt?: string;
};

type AlertMessage = {
  id: string;
  text: string;
  expiresAt: number;
};

export type {
  SetServerSideCookiesOptions,
  GetServerSideCookiesParams,
  AlertMessage,
};
