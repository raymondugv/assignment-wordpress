<?php
namespace HelloPlus\Modules\TemplateParts\Classes\Runners;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

use Elementor\App\Modules\ImportExport\Runners\Import\Import_Runner_Base;

class Handle_Woocommerce_Activation extends Import_Runner_Base {

	public static function get_name(): string {
		return 'handle-woocommerce-activation';
	}

	public function should_import( array $data ): bool {
		return ! empty( $data['manifest']['plugins'] );
	}

	public function import( array $data, array $imported_data ) {
		$plugins = $data['manifest']['plugins'] ?? [];

		foreach ( $plugins as $plugin ) {
			$name = $plugin['name'] ?? '';
			if ( 'WooCommerce' === $name ) {
				delete_transient( '_wc_activation_redirect' );
				break;
			}
		}

		return [];
	}
}
