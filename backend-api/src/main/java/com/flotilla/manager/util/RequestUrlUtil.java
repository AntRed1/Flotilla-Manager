package com.flotilla.manager.util;

import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;

@Component
public class RequestUrlUtil {

    public String getBaseUrl() {
        try {
            ServletRequestAttributes attrs
                    = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs == null) {
                return "";
            }
            HttpServletRequest request = attrs.getRequest();
            String scheme = request.getScheme();
            String serverName = request.getServerName();
            int port = request.getServerPort();
            String contextPath = request.getContextPath();

            StringBuilder url = new StringBuilder();
            url.append(scheme).append("://").append(serverName);
            if (!((scheme.equals("http") && port == 80) || (scheme.equals("https") && port == 443))) {
                url.append(":").append(port);
            }
            url.append(contextPath);
            return url.toString();
        } catch (Exception e) {
            return "";
        }
    }
}
