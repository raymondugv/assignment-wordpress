<?php

namespace HelloPlus\Modules\Admin\Components;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

class Admin_Controller {

	public function plugin_row_meta( $plugin_meta, $plugin_file ) {
		if ( HELLOPLUS_PLUGIN_BASE === $plugin_file ) {
			$row_meta = [
				'changelog' => '<a href="#" id="hello-plus-whats-new-link" aria-label="' . esc_attr( esc_html__( 'Changelog', 'hello-plus' ) ) . '" >' . esc_html__( 'Changelog', 'hello-plus' ) . '</a><div id="hello-plus-whats-new"></div>',
			];

			$plugin_meta = array_merge( $plugin_meta, $row_meta );
		}

		return $plugin_meta;
	}

	public function maybe_init_cart() {
		if ( ! class_exists( 'WooCommerce' ) ) {
			return;
		}

		$has_cart = is_a( WC()->cart, 'WC_Cart' );
		if ( ! $has_cart ) {
			$session_class = apply_filters( 'woocommerce_session_handler', 'WC_Session_Handler' );
			WC()->session = new $session_class();
			WC()->session->init();
			WC()->cart = new \WC_Cart();
			WC()->customer = new \WC_Customer( get_current_user_id(), true );
		}
	}


	public function __construct() {
		add_filter( 'plugin_row_meta', [ $this, 'plugin_row_meta' ], 10, 2 );
		add_action( 'elementor/editor/before_enqueue_scripts', [ $this, 'maybe_init_cart' ] );
	}
}
