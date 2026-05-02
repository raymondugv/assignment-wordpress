<?php
/**
 * Plugin Name: WC Elementor Widget
 * Description: Custom Elementor widget to create WooCommerce products via REST API
 * Version: 1.0.0
 * Author: kam.
 * Text Domain: wc-elementor-widget
 */

if ( ! defined( 'ABSPATH' ) ) exit;

define( 'WC_EL_WIDGET_PATH', plugin_dir_path( __FILE__ ) );
define( 'WC_EL_WIDGET_URL',  plugin_dir_url( __FILE__ ) );

final class WC_Elementor_Widget_Plugin {

    private static $_instance = null;

    public static function instance() {
        if ( is_null( self::$_instance ) ) {
            self::$_instance = new self();
        }
        return self::$_instance;
    }

    public function __construct() {
        add_action( 'plugins_loaded', [ $this, 'init' ] );
    }

    public function init() {
        $elementor_loaded   = did_action( 'elementor/loaded' ) || class_exists( '\Elementor\Plugin' );
        $woocommerce_loaded = class_exists( 'WooCommerce' );

        if ( ! $elementor_loaded ) {
            add_action( 'admin_notices', [ $this, 'admin_notice_missing_elementor' ] );
        }
        if ( ! $woocommerce_loaded ) {
            add_action( 'admin_notices', [ $this, 'admin_notice_missing_woocommerce' ] );
        }

        if ( $elementor_loaded && $woocommerce_loaded ) {
            // Register Elementor widget and supporting scripts/styles
            add_action( 'elementor/widgets/register',              [ $this, 'register_widgets' ] );
            add_action( 'elementor/editor/before_enqueue_scripts', [ $this, 'enqueue_editor_scripts' ] );
        }

        // Load frontend scripts and styles
        add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_frontend_scripts' ] );

        // Set up REST API endpoint for handling product creation and other actions through the backend
        add_action( 'rest_api_init', [ $this, 'register_rest_routes' ] );

        // Add shortcode
        add_shortcode( 'wc_create_product_form', [ $this, 'render_create_product_form' ] );

        // Add menu and settings page for WooCommerce API keys in the admin panel
        add_action( 'admin_menu',  [ $this, 'add_admin_menu' ] );
        add_action( 'admin_init',  [ $this, 'register_settings' ] );
    }

    // WIDGET REGISTRATION
    public function register_widgets( $widgets_manager ) {
        require_once WC_EL_WIDGET_PATH . 'widgets/create-product-widget.php';
        $widgets_manager->register( new \WC_Create_Product_Widget() );
    }

    public function enqueue_editor_scripts() {
        wp_enqueue_style(
            'wc-elementor-widget-editor',
            WC_EL_WIDGET_URL . 'assets/widget.css',
            [], '1.1.0'
        );
        wp_enqueue_script(
            'wc-elementor-widget-editor',
            WC_EL_WIDGET_URL . 'assets/widget-editor.js',
            [ 'jquery', 'elementor-editor' ], '1.1.0', true
        );
        wp_localize_script( 'wc-elementor-widget-editor', 'wcElWidget', [
            'restUrl'         => esc_url_raw( rest_url( 'wc-el-widget/v1/create-product' ) ),
            'productsRestUrl' => esc_url_raw( rest_url( 'wc-el-widget/v1/products' ) ),
            'nonce'           => wp_create_nonce( 'wp_rest' ),
        ] );
    }

    public function enqueue_frontend_scripts() {
        wp_enqueue_style(
            'wc-elementor-widget-frontend',
            WC_EL_WIDGET_URL . 'assets/widget.css',
            [], '1.1.0'
        );
        wp_enqueue_script(
            'wc-elementor-widget-frontend',
            WC_EL_WIDGET_URL . 'assets/widget-frontend.js',
            [ 'jquery' ], '1.1.0', true
        );
        wp_localize_script( 'wc-elementor-widget-frontend', 'wcElWidget', [
            'restUrl'         => esc_url_raw( rest_url( 'wc-el-widget/v1/create-product' ) ),
            'productsRestUrl' => esc_url_raw( rest_url( 'wc-el-widget/v1/products' ) ),
            'nonce'           => wp_create_nonce( 'wp_rest' ),
        ] );
    }

    public function register_rest_routes() {
        //fetch published products for frontend display
        register_rest_route( 'wc-el-widget/v1', '/products', [
            'methods'             => 'GET',
            'callback'            => [ $this, 'handle_get_products' ],
            'permission_callback' => '__return_true',
        ] );

        register_rest_route( 'wc-el-widget/v1', '/create-product', [
            'methods'             => 'POST',
            'callback'            => [ $this, 'handle_create_product' ],
            'permission_callback' => function() {
                return current_user_can( 'edit_posts' );
            },
            'args' => [
                'name'  => [ 'required' => true, 'sanitize_callback' => 'sanitize_text_field' ],
                'price' => [ 'required' => true, 'sanitize_callback' => 'sanitize_text_field' ],
            ],
        ] );
    }

    public function handle_get_products( WP_REST_Request $request ) {
        $products = wc_get_products( [
            'status' => 'publish',
            'limit'  => 20,
            'orderby'=> 'date',
            'order'  => 'DESC',
        ] );

        $data = [];
        foreach ( $products as $product ) {
            $data[] = [
                'product_id' => $product->get_id(),
                'name'       => $product->get_name(),
                'price'      => $product->get_regular_price(),
                'permalink'  => get_permalink( $product->get_id() ),
            ];
        }

        return new WP_REST_Response( $data, 200 );
    }

    public function handle_create_product( WP_REST_Request $request ) {
        $name_validation = $this->validate_product_name( $request->get_param( 'name' ) );
        if ( is_wp_error( $name_validation ) ) {
            return $name_validation;
        }

        $price_validation = $this->validate_product_price( $request->get_param( 'price' ) );
        if ( is_wp_error( $price_validation ) ) {
            return $price_validation;
        }

        $consumer_key    = get_option( 'wc_el_widget_consumer_key', '' );
        $consumer_secret = get_option( 'wc_el_widget_consumer_secret', '' );

        if ( empty( $consumer_key ) || empty( $consumer_secret ) ) {
            return new WP_Error(
                'missing_credentials',
                'WooCommerce API keys are not configured. Go to Settings > WC Widget Settings.',
                [ 'status' => 500 ]
            );
        }

        // Build the WC REST API URL.
        // How the Base URL setting works with this Docker/Caddy setup:
        //   Mac browser → https://wp.localhost:8443 (Caddy) → http://wordpress:80 (WP container)
        $configured_base = get_option( 'wc_el_widget_base_url', '' );
        $base_url        = ! empty( $configured_base )
            ? rtrim( $configured_base, '/' )
            : rtrim( get_site_url(), '/' );

        $base_scheme = parse_url( $base_url, PHP_URL_SCHEME );
        $is_https    = ( $base_scheme === 'https' );

        $wc_api_url   = $base_url . '/wp-json/wc/v3/products';
        $sslverify    = ( $is_https && empty( $configured_base ) );

        $public_parsed = parse_url( get_site_url() );
        $host_header   = $public_parsed['host']
            . ( isset( $public_parsed['port'] ) ? ':' . $public_parsed['port'] : '' );

        $product_data = [
            'name'          => $name_validation,
            'type'          => 'simple',
            'regular_price' => $price_validation,
            'status'        => 'publish',
        ];

        $response = wp_remote_post( $wc_api_url, [
            'method'  => 'POST',
            'headers' => [
                'Content-Type'       => 'application/json',
                'Authorization'      => 'Basic ' . base64_encode( $consumer_key . ':' . $consumer_secret ),
                'Host'               => $host_header,
                'X-Forwarded-Proto'  => 'https',
                'X-Forwarded-Host'   => $host_header,
            ],
            'body'      => wp_json_encode( $product_data ),
            'timeout'   => 30,
            'sslverify' => $sslverify,
        ] );

        if ( is_wp_error( $response ) ) {
            return new WP_Error( 'wc_api_error', $response->get_error_message(), [ 'status' => 500 ] );
        }

        $body        = wp_remote_retrieve_body( $response );
        $status_code = wp_remote_retrieve_response_code( $response );
        $product     = json_decode( $body, true );

        if ( $status_code !== 201 ) {
            return new WP_REST_Response( [
                'success' => false,
                'message' => isset( $product['message'] ) ? $product['message'] : 'Unknown WooCommerce API error.',
                'code'    => $status_code,
            ], $status_code );
        }

        return new WP_REST_Response( [
            'success'    => true,
            'product_id' => $product['id'],
            'name'       => $product['name'],
            'price'      => $product['regular_price'],
            'permalink'  => $product['permalink'],
        ], 200 );
    }

    private function validate_product_name( $name ) {
        $name = trim( (string) $name );

        if ( $name === '' ) {
            return new WP_Error( 'invalid_name', 'Please enter a product name.', [ 'status' => 400 ] );
        }

        $name_length = strlen( $name );
        if ( $name_length < 3 ) {
            return new WP_Error( 'invalid_name', 'Product name must be at least 3 characters.', [ 'status' => 400 ] );
        }

        if ( $name_length > 100 ) {
            return new WP_Error( 'invalid_name', 'Product name must be 100 characters or fewer.', [ 'status' => 400 ] );
        }

        if ( preg_match( '/[^A-Za-z0-9\\s\\-\\.,\\(\\)&]/', $name ) ) {
            return new WP_Error(
                'invalid_name',
                'Product name contains invalid characters. Use letters, numbers, spaces, and - . , ( ) &',
                [ 'status' => 400 ]
            );
        }

        return $name;
    }

    private function validate_product_price( $price ) {
        $price = trim( (string) $price );

        if ( $price === '' ) {
            return new WP_Error( 'invalid_price', 'Please enter a valid price.', [ 'status' => 400 ] );
        }

        if ( ! preg_match( '/^\\d+(\\.\\d{1,2})?$/', $price ) ) {
            return new WP_Error( 'invalid_price', 'Price can have up to 2 decimal places only.', [ 'status' => 400 ] );
        }

        $normalized_price = number_format( (float) $price, 2, '.', '' );
        if ( (float) $normalized_price < 0 ) {
            return new WP_Error( 'invalid_price', 'Please enter a valid price (0 or higher).', [ 'status' => 400 ] );
        }

        return $normalized_price;
    }

    public function render_create_product_form() {
        ob_start();
        ?>
        <div class="wc-el-standalone-form" id="wc-el-standalone-form">
            <h2>Create a New Product</h2>

            <div class="wc-el-form-field">
                <label for="wc-standalone-name">Product Name <span class="wc-el-required">*</span></label>
                <input type="text" id="wc-standalone-name" placeholder="Enter product name" />
            </div>

            <div class="wc-el-form-field">
                <label for="wc-standalone-price">Price ($) <span class="wc-el-required">*</span></label>
                <input type="number" id="wc-standalone-price" placeholder="0.00" min="0" step="0.01" />
            </div>

            <div class="wc-el-standalone-error" id="wc-standalone-error" style="display:none;"></div>
            <div class="wc-el-standalone-success" id="wc-standalone-success" style="display:none;"></div>

            <button type="button" id="wc-standalone-submit" class="wc-el-standalone-btn">
                <span class="wc-el-standalone-btn-text">Create Product</span>
                <span class="wc-el-standalone-btn-spinner" style="display:none;">Creating...</span>
            </button>
        </div>
        <?php
        return ob_get_clean();
    }

    // ADMIN SETTINGS
    public function add_admin_menu() {
        add_options_page(
            'WC Widget Settings', 'WC Widget Settings',
            'manage_options', 'wc-el-widget-settings',
            [ $this, 'render_settings_page' ]
        );
    }

    public function register_settings() {
        register_setting( 'wc_el_widget_settings', 'wc_el_widget_consumer_key' );
        register_setting( 'wc_el_widget_settings', 'wc_el_widget_consumer_secret' );
        register_setting( 'wc_el_widget_settings', 'wc_el_widget_base_url', [
            'sanitize_callback' => 'esc_url_raw',
        ] );
    }

    public function render_settings_page() {
        ?>
        <div class="wrap">
            <h1>WC Elementor Widget &mdash; Settings</h1>
            <p>
                Generate API keys at:
                <strong>WooCommerce &rarr; Settings &rarr; Advanced &rarr; REST API</strong>
                — set permission to <strong>Read/Write</strong>.
            </p>
            <p>
                After saving keys here, create a WordPress page and add the shortcode
                <code>[wc_create_product_form]</code> to it for the standalone product creation form (Task I &amp; II).
            </p>
            <form method="post" action="options.php">
                <?php settings_fields( 'wc_el_widget_settings' ); ?>
                <table class="form-table">
                    <tr>
                        <th scope="row">Consumer Key</th>
                        <td>
                            <input type="text" name="wc_el_widget_consumer_key"
                                value="<?php echo esc_attr( get_option( 'wc_el_widget_consumer_key' ) ); ?>"
                                style="width:420px" />
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Consumer Secret</th>
                        <td>
                            <input type="text" name="wc_el_widget_consumer_secret"
                                value="<?php echo esc_attr( get_option( 'wc_el_widget_consumer_secret' ) ); ?>"
                                style="width:420px" />
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">WC API Base URL</th>
                        <td>
                            <input type="url" name="wc_el_widget_base_url"
                                value="<?php echo esc_attr( get_option( 'wc_el_widget_base_url', '' ) ); ?>"
                                style="width:420px"
                                placeholder="<?php echo esc_attr( get_site_url() ); ?>" />
                            <p class="description">
                                <strong>Leave blank in production</strong> &mdash; the plugin will use your site URL automatically.<br>
                                Set this only when the server cannot reach its own public hostname from inside the container.<br><br>
                                <strong>Docker + Caddy (your setup):</strong> <code>http://wordpress</code><br>
                                &nbsp;&nbsp;&nbsp;WordPress runs on port 80 inside the Docker network. Caddy handles HTTPS externally.<br><br>
                                <strong>Docker + Nginx proxy:</strong> <code>http://wordpress:80</code><br>
                                <strong>Staging:</strong> <code>https://staging.mystore.com</code><br>
                                <strong>Production:</strong> leave blank &mdash; uses <code><?php echo esc_html( get_site_url() ); ?></code>
                            </p>
                        </td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>
        </div>
        <?php
    }

    public function admin_notice_missing_elementor() {
        echo '<div class="notice notice-error"><p><strong>WC Elementor Widget</strong> requires Elementor to be active.</p></div>';
    }

    public function admin_notice_missing_woocommerce() {
        echo '<div class="notice notice-error"><p><strong>WC Elementor Widget</strong> requires WooCommerce to be active.</p></div>';
    }
}

WC_Elementor_Widget_Plugin::instance();
