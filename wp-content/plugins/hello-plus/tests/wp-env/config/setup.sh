#!/bin/bash
set -eox pipefail

wp plugin install wordpress-importer --activate
wp plugin activate elementor
wp plugin activate woocommerce

# Conditionally activate themes based on availability
if wp theme list --field=name | grep -q "hello-commerce"; then
    echo "Activating Hello Commerce theme"
    wp theme activate hello-commerce
elif wp theme list --field=name | grep -q "hello-biz"; then
    echo "Activating Hello Biz theme"
    wp theme activate hello-biz
else
    echo "Neither Hello Commerce nor Hello Biz theme found - using default theme"
fi

wp plugin activate hello-plus

WP_CLI_CONFIG_PATH=hello-plus-config/wp-cli.yml wp rewrite structure '/%postname%/' --hard

# Remove the Guttenberg welcome guide popup
wp user meta add admin wp_persisted_preferences 'a:2:{s:14:\"core/edit-post\";a:2:{b:1;s:12:\"welcomeGuide\";b:0;}}'

# Reset editor counter to avoid auto trigger of the checklist popup when entering the editor for the 2nd time
wp option update e_editor_counter 10
wp option update elementor_checklist '{"last_opened_timestamp":null,"first_closed_checklist_in_editor":true,"is_popup_minimized":false,"steps":[],"should_open_in_editor":false,"editor_visit_count":10}'

wp option set elementor_onboarded true

# Add user meta so the announcement popup will not be displayed - ED-9723
for id in $(wp user list --field=ID)
	do wp user meta add "$id" "announcements_user_counter" 999
	wp user meta add "$id" "elementor_onboarded" "a:1:{s:27:\"ai-get-started-announcement\";b:1;}"
done

wp cache flush
wp rewrite flush --hard

# Flush Elementor CSS if available
if wp help elementor >/dev/null 2>&1; then
    wp elementor flush-css || echo "Warning: elementor flush-css failed, continuing..."
else
    echo "Elementor commands not available yet - skipping CSS flush"
fi

# Install WooCommerce pages if WooCommerce is active
if wp plugin is-active woocommerce; then
    echo "WooCommerce is active - installing pages"
    wp wc tool run install_pages --user=admin
else
    echo "WooCommerce not active - skipping page installation"
fi

# Import sample data if file exists
if [ -f "./wp-content/plugins/hello-plus/tests/playwright/sample-data/sample_products_with_acf_meta.xml" ]; then
    echo "Importing sample data"
    wp import ./wp-content/plugins/hello-plus/tests/playwright/sample-data/sample_products_with_acf_meta.xml --authors=skip --quiet --allow-root
else
    echo "Sample data file not found - skipping import"
fi

wp import ./wp-content/plugins/hello-plus/tests/playwright/sample-data/hello-plus-footer.xml --authors=skip --quiet --allow-root
