package com.innovan.roombooking.auth;

import java.net.URI;
import java.util.Collection;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class HttpHeaderUtils {

    /**
     * default-src 'self'; to limit the sources of scripts, styles, images, and other content.
     * script-src 'self' to prevent execution of unauthorized scripts.
     * style-src 'self' 'unsafe-inline' (if inline styles are required).
     * object-src 'none' to disable the use of <object>, <embed>, or <applet>.
     * base-uri 'self' to restrict the base URL for relative URLs.
     * form-action 'self' to limit where forms can be submitted.
     * @param allowedOrigins
     * @return
     */
    public static String commonContentSecurityPolicy(Collection<String> allowedOrigins) {
        return (
            HttpHeaderUtils.cspFrameAncestors(allowedOrigins) +
            ";default-src 'self'" +
            ";script-src 'self'" +
            ";style-src 'self'" +
            ";object-src 'none'" +
            ";base-uri 'self'" +
            ";form-action 'self'"
        );
    }

    /**
     * Generates a header value for Content-Security-Policy: frame-ancestors [origins] This is used
     * to allow the content to be included in an iframe.
     * <a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/frame-ancestors">...</a>
     * @param allowedOrigins collection of allowed origins
     * @return frame-ancestors [origins]
     */
    public static String cspFrameAncestors(Collection<String> allowedOrigins) {
        StringBuilder sb = new StringBuilder();
        sb.append("frame-ancestors ");
        if (allowedOrigins == null || allowedOrigins.isEmpty()) {
            sb.append("'self'");
        } else {
            boolean first = true;
            for (String allowedOrigin : allowedOrigins) {
                if (first) {
                    first = false;
                } else {
                    sb.append(' ');
                }
                URI uri = URI.create(allowedOrigin);
                sb.append(uri.getHost());
                if (uri.getPort() > 0) {
                    sb.append(":").append(uri.getPort());
                }
            }
        }
        return sb.toString();
    }
}
