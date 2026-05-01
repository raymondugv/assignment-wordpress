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
