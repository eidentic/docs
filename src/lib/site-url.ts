interface SiteUrlConfig {
  sub_path?: string | null;
  sub_path_domain?: string | null;
}

function normalizeOrigin(value: string) {
  return value.replace(/\/+$/, '');
}

function normalizePath(value?: string | null) {
  if (!value) {
    return '';
  }

  return value.startsWith('/') ? value : `/${value}`;
}

export function getPublicOrigin(
  requestOrHeaders: Request | Headers,
  fallbackUrl: URL,
  config?: SiteUrlConfig,
) {
  const headers = requestOrHeaders instanceof Request ? requestOrHeaders.headers : requestOrHeaders;
  const envSiteUrl =
    process.env.PUBLIC_SITE_URL?.trim() ||
    import.meta.env.PUBLIC_SITE_URL?.trim();

  if (envSiteUrl) {
    try {
      const url = new URL(envSiteUrl);
      return normalizeOrigin(url.origin);
    } catch {
      // Ignore invalid env value and continue with header-based detection.
    }
  }

  const forwardedProto =
    headers.get('x-forwarded-proto') ||
    headers.get('x-forwarded-scheme') ||
    fallbackUrl.protocol.replace(':', '');
  const forwardedHost = headers.get('x-forwarded-host') || headers.get('x-original-host');

  if (config?.sub_path_domain) {
    return `${forwardedProto}://${config.sub_path_domain}`;
  }

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return normalizeOrigin(fallbackUrl.origin);
}

export function getPublicBaseUrl(
  requestOrHeaders: Request | Headers,
  fallbackUrl: URL,
  config?: SiteUrlConfig,
) {
  const origin = getPublicOrigin(requestOrHeaders, fallbackUrl, config);
  const pathPrefix = config?.sub_path_domain ? normalizePath(config.sub_path) : '';
  return `${origin}${pathPrefix}`;
}

export function buildPublicUrl(
  requestOrHeaders: Request | Headers,
  fallbackUrl: URL,
  pathname: string,
  config?: SiteUrlConfig,
) {
  const baseUrl = getPublicBaseUrl(requestOrHeaders, fallbackUrl, config);
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${baseUrl}${normalizedPath}`;
}

export function toAbsoluteUrl(
  value: string | null | undefined,
  requestOrHeaders: Request | Headers,
  fallbackUrl: URL,
  config?: SiteUrlConfig,
) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).toString();
  } catch {
    const baseUrl = getPublicBaseUrl(requestOrHeaders, fallbackUrl, config);
    return new URL(value.startsWith('/') ? value : `/${value}`, `${baseUrl}/`).toString();
  }
}
