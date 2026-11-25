#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
say()  { printf '\n\033[1;32m==> %s\033[0m\n' "$*"; }
fail() { printf '\n\033[1;31mERROR: %s\033[0m\n' "$*" >&2; exit 1; }

USAGE="sudo bash $0 <WEB01_IP> <WEB02_IP> [DOMAIN] [EMAIL]"
[ "$(id -u)" -eq 0 ] || fail "Run with sudo: $USAGE"
[ $# -ge 2 ] && [ $# -le 4 ] || fail "Usage: $USAGE"
WEB01_IP="$1"
WEB02_IP="$2"
DOMAIN="${3:-}"
EMAIL="${4:-}"
CFG=/etc/haproxy/haproxy.cfg

[ -f "$SCRIPT_DIR/haproxy.cfg" ] || fail "Missing $SCRIPT_DIR/haproxy.cfg (keep it next to this script)"
command -v haproxy >/dev/null || fail "HAProxy is not installed on this server"
[ -z "$DOMAIN" ] || command -v certbot >/dev/null || fail "certbot is not installed on this server"

# Writes the config (with or without the "# SSL" lines), checks it, and (re)starts HAProxy
apply_config() {
    local mode="$1" tmp=/tmp/haproxy.cfg.new
    if [ "$mode" = ssl ]; then
        sed -e 's/ *# SSL$//' "$SCRIPT_DIR/haproxy.cfg" > "$tmp"
    else
        sed -e '/# SSL$/d' "$SCRIPT_DIR/haproxy.cfg" > "$tmp"
    fi
    sed -i -e "s/WEB01_IP/$WEB01_IP/" -e "s/WEB02_IP/$WEB02_IP/" -e "s/DOMAIN/$DOMAIN/" "$tmp"
    haproxy -c -f "$tmp" >/dev/null || { haproxy -c -f "$tmp"; fail "Generated HAProxy config is invalid"; }
    mv "$tmp" "$CFG"
    [ -f /etc/default/haproxy ] && sed -i 's/^ENABLED=0/ENABLED=1/' /etc/default/haproxy
    if service haproxy status >/dev/null 2>&1; then service haproxy reload; else service haproxy start; fi
    sleep 1
}

# ---------- 1. Check the web servers ----------
say "Checking the web servers"
for ip in "$WEB01_IP" "$WEB02_IP"; do
    if curl -fsS --max-time 5 "http://$ip/health" >/dev/null; then
        echo "  $ip  OK"
    else
        echo "  $ip  NOT responding on http://$ip/health (run web-setup.sh there first)."
        echo "       Continuing: HAProxy adds it as soon as it is healthy."
    fi
done

# ---------- 2. HTTP config ----------
say "Configuring HAProxy (port 80)"
[ -f "$CFG" ] && cp "$CFG" "$CFG.bak.$(date +%Y%m%d%H%M%S)" && echo "Backed up the old config"
apply_config http

# ---------- 3. HTTPS (optional) ----------
if [ -n "$DOMAIN" ]; then
    say "Getting a Let's Encrypt certificate for $DOMAIN"
    echo "($DOMAIN must already point to this server's public IP)"
    if [ -n "$EMAIL" ]; then ACCOUNT=(-m "$EMAIL"); else ACCOUNT=(--register-unsafely-without-email); fi

    # certbot answers the challenge on 127.0.0.1:8888; HAProxy forwards /.well-known/ to it
    certbot certonly --standalone --non-interactive --agree-tos "${ACCOUNT[@]}" \
        --http-01-address 127.0.0.1 --http-01-port 8888 \
        --keep-until-expiring -d "$DOMAIN"

    # HAProxy wants certificate + key in one file. This hook also runs after every renewal.
    HOOK=/etc/letsencrypt/renewal-hooks/deploy/haproxy-njeflow.sh
    mkdir -p "$(dirname "$HOOK")" /etc/haproxy/certs
    cat > "$HOOK" <<EOF
#!/bin/sh
# Rebuild the HAProxy certificate after certbot renews it
cat /etc/letsencrypt/live/$DOMAIN/fullchain.pem /etc/letsencrypt/live/$DOMAIN/privkey.pem > /etc/haproxy/certs/$DOMAIN.pem
chmod 600 /etc/haproxy/certs/$DOMAIN.pem
service haproxy reload
EOF
    chmod 755 "$HOOK"
    cat "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "/etc/letsencrypt/live/$DOMAIN/privkey.pem" > "/etc/haproxy/certs/$DOMAIN.pem"
    chmod 600 "/etc/haproxy/certs/$DOMAIN.pem"

    say "Enabling HTTPS (port 443) and redirecting HTTP to HTTPS"
    apply_config ssl

    # Renewal: without systemd timers, certbot relies on cron
    if [ ! -f /etc/cron.d/certbot ]; then
        echo '0 */12 * * * root certbot -q renew' > /etc/cron.d/certbot
        echo "Added /etc/cron.d/certbot for automatic renewal"
    fi
    service cron status >/dev/null 2>&1 || echo "NOTE: cron is not running; start it (sudo service cron start) so certificates renew."
fi

if command -v ufw >/dev/null && ufw status | grep -q "Status: active"; then
    ufw allow 80/tcp >/dev/null
    [ -n "$DOMAIN" ] && ufw allow 443/tcp >/dev/null
    echo "Opened ports in ufw"
fi

# ---------- 4. Check the round robin ----------
say "Testing the load balancer (should alternate between servers)"
if [ -n "$DOMAIN" ]; then URL="https://$DOMAIN/"; CURL_OPTS=(--resolve "$DOMAIN:443:127.0.0.1"); else URL="http://127.0.0.1/"; CURL_OPTS=(); fi
for i in 1 2 3 4; do
    printf '  request %s -> ' "$i"
    curl -s -o /dev/null -D - --max-time 5 "${CURL_OPTS[@]}" "$URL" | grep -i '^x-served-by' || echo "(no answer)"
done

say "Done! Open ${DOMAIN:+https://$DOMAIN/ or }http://<LB01_IP>/ in your browser."
echo "Status: sudo service haproxy status"
echo "Config: $CFG"
