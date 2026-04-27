# WordPress Local Development

This project runs WordPress with Docker Compose and keeps deployable code editable in git.

## Services

- WordPress: `http://localhost:8080`
- Database: MariaDB (`db` service)

## Start

```bash
docker compose up -d
```

Then open `http://localhost:8080` and complete WordPress setup.

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
