#!/usr/bin/env bash

set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/jngoh-maker/NjeFlow.git}"
BRANCH="${BRANCH:-master}"
APP_DIR=/var/www/njeflow
APP_USER=njeflow
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

say()  { printf '\n\033[1;32m==> %s\033[0m\n' "$*"; }
fail() { printf '\n\033[1;31mERROR: %s\033[0m\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || fail "Run with sudo: sudo bash $0"
for f in njeflow.init nginx-njeflow.conf; do
    [ -f "$SCRIPT_DIR/$f" ] || fail "Missing $SCRIPT_DIR/$f (run this from inside the cloned repo)"
done

# ---------- 1. Packages ----------
export DEBIAN_FRONTEND=noninteractive
command -v nginx >/dev/null || fail "Nginx is not installed on this server"
MISSING=""
for pkg in git curl; do command -v "$pkg" >/dev/null || MISSING="$MISSING $pkg"; done
if [ -n "$MISSING" ]; then
    say "Installing:$MISSING"
    apt-get update -y
    apt-get install -y $MISSING ca-certificates
fi

NODE_MAJOR=0
command -v node >/dev/null && NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" -lt 18 ]; then
    say "Installing Node.js 22 LTS"
    command -v gpg >/dev/null || { apt-get update -y; apt-get install -y gnupg; }
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
fi
echo "Node $(node -v), npm $(npm -v)"

# ---------- 2. App user & code ----------
id "$APP_USER" >/dev/null 2>&1 || {
    say "Creating system user '$APP_USER'"
    useradd --system --home "$APP_DIR" --shell /usr/sbin/nologin "$APP_USER"
}

if [ -d "$APP_DIR/.git" ]; then
    say "Updating code in $APP_DIR"
    git config --global --add safe.directory "$APP_DIR"
    git -C "$APP_DIR" fetch --quiet origin "$BRANCH"
    git -C "$APP_DIR" reset --hard "origin/$BRANCH"
else
    say "Cloning $REPO_URL ($BRANCH) into $APP_DIR"
    mkdir -p "$(dirname "$APP_DIR")"
    git clone --quiet --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
    git config --global --add safe.directory "$APP_DIR"
fi

say "Installing npm dependencies"
cd "$APP_DIR"
if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

# ---------- 3. Secrets (.env, never committed) ----------
if [ ! -f "$APP_DIR/.env" ]; then
    if [ -z "${WEATHER_KEY:-}" ]; then
        read -r -s -p "Enter your OpenWeather API key: " WEATHER_KEY; echo
    fi
    [ -n "$WEATHER_KEY" ] || fail "An OpenWeather API key is required"
    printf 'WEATHER_KEY=%s\n' "$WEATHER_KEY" > "$APP_DIR/.env"
    echo "Created $APP_DIR/.env"
else
    echo "Keeping existing $APP_DIR/.env"
fi
chown -R "$APP_USER:$APP_USER" "$APP_DIR"
chmod 600 "$APP_DIR/.env"

# ---------- 4. App service (init.d, no systemd) ----------
say "Installing the njeflow service (/etc/init.d/njeflow)"
install -m 755 "$SCRIPT_DIR/njeflow.init" /etc/init.d/njeflow
sed -i "s#^NODE_BIN=.*#NODE_BIN=$(command -v node)#" /etc/init.d/njeflow
# Start on boot where the init system supports it
command -v update-rc.d >/dev/null && update-rc.d njeflow defaults >/dev/null 2>&1 || true
service njeflow restart

# ---------- 5. Nginx ----------
say "Configuring Nginx (port 80 -> Node on 127.0.0.1:3000)"
install -m 644 "$SCRIPT_DIR/nginx-njeflow.conf" /etc/nginx/sites-available/njeflow
ln -sf /etc/nginx/sites-available/njeflow /etc/nginx/sites-enabled/njeflow
if [ -e /etc/nginx/sites-enabled/default ]; then
    # Our site is the default_server now; keep a backup of the old one
    cp -n /etc/nginx/sites-available/default /etc/nginx/sites-available/default.bak 2>/dev/null || true
    rm -f /etc/nginx/sites-enabled/default
    echo "Disabled the old default site (backup: /etc/nginx/sites-available/default.bak)"
fi
nginx -t
if service nginx status >/dev/null 2>&1; then service nginx reload; else service nginx start; fi

if command -v ufw >/dev/null && ufw status | grep -q "Status: active"; then
    ufw allow 'Nginx HTTP' >/dev/null && echo "Opened port 80 in ufw"
fi

# ---------- 6. Check ----------
say "Checking the app"
for i in $(seq 1 15); do
    curl -fsS http://127.0.0.1:3000/health >/dev/null 2>&1 && break
    sleep 1
done
if curl -fsS http://127.0.0.1/health; then
    echo
    say "Done! NjeFlow is running on $(hostname) (port 80)."
    echo "Logs:    sudo tail -f /var/log/njeflow.log"
    echo "Restart: sudo service njeflow restart"
else
    service njeflow status || true
    tail -n 30 /var/log/njeflow.log 2>/dev/null || true
    fail "The app did not respond. Check: sudo tail -n 50 /var/log/njeflow.log"
fi
