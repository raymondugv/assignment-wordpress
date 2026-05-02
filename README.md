# WordPress Local Development

This project runs WordPress with Docker Compose and keeps deployable code editable in git.

## Services

- WordPress (HTTPS via Caddy): `https://wp.localhost:8443`
- WordPress (internal container): `wordpress:80`
- Database: MySQL (`db` service)
- MySQL host access: `localhost:3369`

## Start

```bash
docker compose up -d
```

Then open `https://wp.localhost:8443` and complete WordPress setup.

## Local HTTPS setup

This stack uses Caddy as a local TLS terminator in front of WordPress.

- Public local URL: `https://wp.localhost:8443`
- Caddy reads certs from `certs/`
- WordPress runs behind Caddy and receives `X-Forwarded-Proto: https`

Generate local trusted certificates with `mkcert`:

```bash
mkcert -install
mkcert -cert-file "certs/wp.localhost.pem" -key-file "certs/wp.localhost-key.pem" wp.localhost localhost 127.0.0.1 ::1
```

Notes:

- `:8443` is used because local `:443` may already be in use.
- If your machine has free `:443`, you can remap Docker and use `https://wp.localhost` directly.
- This setup is local-only and does not affect production unless you deploy these files there.

## Stop

```bash
docker compose down
```

To remove database data as well:

```bash
docker compose down -v
```

## Editable and versioned code

The following paths are mounted into the WordPress container and tracked in git:

- `wp-content/themes`
- `wp-content/plugins`
- `wp-content/uploads`

Use these folders for production-bound changes.

## Deployable scope

For deployment, package and upload content from `wp-content` (themes/plugins/uploads) to your production WordPress server.

## WC Elementor Widget setup

This project includes a custom plugin at `wp-content/plugins/wc-elementor-widget`.

### 1) Install dependencies and activate plugins

In WordPress Admin (`https://wp.localhost:8443/wp-admin`):

1. Go to **Plugins**.
2. Make sure these plugins are installed and activated:
   - **WooCommerce**
   - **Elementor**
   - **WC Elementor Widget**

### 2) Configure WordPress permalinks (required)

1. Go to **Settings -> Permalinks**.
2. Set **Permalink Structure** to **Post name**.
3. Click **Save Changes**.

Important:

- Do this on each environment (local, staging, production).
- If permalinks are incorrect, REST routes can fail or return `404 rest_no_route`.

### 3) Generate WooCommerce API keys

1. Go to **WooCommerce -> Settings -> Advanced -> REST API**.
2. Click **Add key**.
3. Fill in:
   - **Description**: any name (for example `WC Elementor Widget Local`)
   - **User**: your admin user
   - **Permissions**: **Read/Write** (required to create products)
4. Click **Generate API key**.
5. Copy and save:
   - **Consumer key** (starts with `ck_...`)
   - **Consumer secret** (starts with `cs_...`)

Important:

- You can only view the full secret right after generation.
- If you lose it, generate a new key pair.

### 4) Add `consumer_key` and `consumer_secret` to plugin settings

1. Go to **Settings -> WC Widget Settings**.
2. Paste values into:
   - **Consumer Key** -> `ck_...`
   - **Consumer Secret** -> `cs_...`
3. (Optional) Configure **WC API Base URL**:
   - For this Docker setup, use `http://wordpress` if internal container routing is needed.
   - Otherwise leave it blank to use `get_site_url()` automatically.
4. Click **Save Changes**.

### 5) Verify permissions and connection

After saving keys:

1. Open Elementor editor on any page.
2. Search for widget **Create WC Product**.
3. Create a test product from the widget panel or with shortcode `[wc_create_product_form]`.

If product creation fails:

- Re-check that key permission is **Read/Write** (not Read only).
- Re-generate keys and update plugin settings.
- Confirm WooCommerce and WC Elementor Widget are both active.
