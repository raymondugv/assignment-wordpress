<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class WC_Create_Product_Widget extends \Elementor\Widget_Base {

    public function get_name()       { return 'wc_create_product'; }
    public function get_title()      { return esc_html__( 'Create WC Product', 'wc-elementor-widget' ); }
    public function get_icon()       { return 'eicon-woocommerce'; }
    public function get_categories() {
        return [ 'woocommerce-elements', 'general' ];
    }
    public function get_keywords()   { return [ 'woocommerce', 'product', 'create', 'shop' ]; }

    protected function register_controls() {

        $this->start_controls_section( 'section_product', [
            'label' => esc_html__( 'Create Product', 'wc-elementor-widget' ),
            'tab'   => \Elementor\Controls_Manager::TAB_CONTENT,
        ] );

        $this->add_control( 'create_product_btn', [
            'label'           => '',
            'type'            => \Elementor\Controls_Manager::RAW_HTML,
            'raw'             => $this->get_editor_panel_html(),
            'content_classes' => 'wc-el-widget-panel',
        ] );

        $this->end_controls_section();

        $this->start_controls_section( 'section_style', [
            'label' => esc_html__( 'Card Style', 'wc-elementor-widget' ),
            'tab'   => \Elementor\Controls_Manager::TAB_STYLE,
        ] );

        $this->add_control( 'card_bg_color', [
            'label'     => esc_html__( 'Card Background', 'wc-elementor-widget' ),
            'type'      => \Elementor\Controls_Manager::COLOR,
            'default'   => '#ffffff',
            'selectors' => [ '{{WRAPPER}} .wc-product-card' => 'background-color: {{VALUE}};' ],
        ] );

        $this->add_control( 'card_text_color', [
            'label'     => esc_html__( 'Text Color', 'wc-elementor-widget' ),
            'type'      => \Elementor\Controls_Manager::COLOR,
            'default'   => '#2d2d2d',
            'selectors' => [ '{{WRAPPER}} .wc-product-card' => 'color: {{VALUE}};' ],
        ] );

        $this->end_controls_section();
    }

    private function get_editor_panel_html() {
        ob_start();
        ?>
        <div class="wc-el-panel-container">
            <div class="wc-el-status" style="display:none;">
                <div class="wc-el-status-icon">&#10003;</div>
                <div class="wc-el-status-info">
                    <strong class="wc-el-status-name"></strong>
                    <span class="wc-el-status-price"></span>
                </div>
            </div>
            <button type="button" class="wc-el-create-btn elementor-button">
                <span class="wc-el-btn-icon">+</span>
                <span class="wc-el-btn-text">Create WooCommerce Product</span>
            </button>
            <p class="wc-el-hint">
                Click to create a product, then drag this widget to the canvas.
            </p>
        </div>
        <?php
        return ob_get_clean();
    }

    /**
     * Fetches all published products via REST API.
     */
    protected function render() {
        $products = wc_get_products( [
            'status'  => 'publish',
            'limit'   => 20,
            'orderby' => 'date',
            'order'   => 'DESC',
        ] );

        echo '<div class="wc-product-list" data-products-url="' . esc_url( rest_url( 'wc-el-widget/v1/products' ) ) . '">';

        if ( empty( $products ) ) {
            echo '<div class="wc-product-card wc-product-card--placeholder is-visible">';
            echo '<div class="wc-product-card__placeholder">';
            echo '<div class="wc-product-card__placeholder-icon">&#x1F6D2;</div>';
            echo '<p>No products yet. Use the Elementor panel to create one.</p>';
            echo '</div></div>';
        } else {
            foreach ( $products as $product ) {
                $id        = $product->get_id();
                $name      = esc_html( $product->get_name() );
                $price     = wc_price( $product->get_regular_price() );
                $permalink = esc_url( get_permalink( $id ) );

                echo '<div class="wc-product-card is-visible">';
                echo '<div class="wc-product-card__badge">WooCommerce Product</div>';
                echo '<h3 class="wc-product-card__name">' . $name . '</h3>';
                echo '<div class="wc-product-card__price">' . $price . '</div>';
                echo '<a href="' . $permalink . '" class="wc-product-card__link" target="_blank">View Product &rarr;</a>';
                echo '<div class="wc-product-card__id">ID: #' . $id . '</div>';
                echo '</div>';
            }
        }

        echo '</div>';
    }

    protected function content_template() {
        ?>
        <div class="wc-product-card is-visible">
            <div class="wc-product-card__badge">WooCommerce Products</div>
            <div class="wc-product-card__placeholder" style="border:none;padding:16px 0 0;">
                <div class="wc-product-card__placeholder-icon">&#x1F6D2;</div>
                <p>Products will appear here on the published page.</p>
            </div>
        </div>
        <?php
    }
}
