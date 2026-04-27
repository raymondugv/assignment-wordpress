<?php

namespace HelloBiz\Includes;

use Elementor\App\App;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * class Utils
 **/
class Utils {

	const MIN_ELEMENTOR_CUSTOMIZATION_VERSION = '3.34.0';

	private static ?bool $elementor_installed = null;

	private static ?bool $elementor_active = null;

	public static function elementor(): \Elementor\Plugin {
		return \Elementor\Plugin::$instance;
	}

	public static function has_pro(): bool {
		return defined( 'ELEMENTOR_PRO_VERSION' );
	}

	public static function is_elementor_active(): bool {
		if ( null === self::$elementor_active ) {
			self::$elementor_active = defined( 'ELEMENTOR_VERSION' );
		}

		return self::$elementor_active;
	}

	public static function get_theme_builder_slug(): string {
		if ( ! class_exists( 'Elementor\App\App' ) ) {
			return '';
		}

		if ( self::has_pro() ) {
			return App::PAGE_ID . '&ver=' . ELEMENTOR_VERSION . '#site-editor';
		}

		if ( self::is_elementor_active() ) {
			return App::PAGE_ID . '&ver=' . ELEMENTOR_VERSION . '#site-editor/promotion';
		}

		return '';
	}

	public static function is_elementor_installed(): bool {
		if ( null === self::$elementor_installed ) {
			self::$elementor_installed = file_exists( WP_PLUGIN_DIR . '/elementor/elementor.php' );
		}

		return self::$elementor_installed;
	}

	public static function is_hello_plus_active(): bool {
		return defined( 'HELLO_PLUS_VERSION' );
	}

	public static function is_hello_plus_installed(): bool {
		return file_exists( WP_PLUGIN_DIR . '/hello-plus/hello-plus.php' );
	}

	public static function is_hello_plus_setup_wizard_done(): bool {
		if ( ! class_exists( 'HelloPlus\Modules\Admin\Classes\Menu\Pages\Setup_Wizard' ) ) {
			return false;
		}

		return \HelloPlus\Modules\Admin\Classes\Menu\Pages\Setup_Wizard::has_site_wizard_been_completed();
	}

	public static function has_chosen_blank_canvas(): bool {
		if ( ! class_exists( 'HelloPlus\Modules\Admin\Classes\Ajax\Blank_Canvas_Option' ) ) {
			return false;
		}

		return \HelloPlus\Modules\Admin\Classes\Ajax\Blank_Canvas_Option::has_chosen_blank_canvas();
	}

	public static function get_hello_plus_activation_link(): string {
		$plugin = 'hello-plus/hello-plus.php';

		$url = 'plugins.php?action=activate&plugin=' . $plugin . '&plugin_status=all';

		return add_query_arg( '_wpnonce', wp_create_nonce( 'activate-plugin_' . $plugin ), $url );
	}

	public static function get_plugin_install_url( $plugin_slug ): string {
		$action = 'install-plugin';

		$url = add_query_arg(
			[
				'action' => $action,
				'plugin' => $plugin_slug,
				'referrer' => 'hello-biz',
			],
			admin_url( 'update.php' )
		);

		return add_query_arg( '_wpnonce', wp_create_nonce( $action . '_' . $plugin_slug ), $url );
	}

	public static function get_theme_builder_options(): array {
		$url = 'https://go.elementor.com/hello-biz-builder';
		$target = '_blank';

		if ( ! class_exists( 'Elementor\App\App' ) ) {
			return [
				'link' => $url,
				'target' => $target,
			];
		}

		if ( self::is_elementor_active() ) {
			$url = admin_url( 'admin.php?page=' . App::PAGE_ID . '&ver=' . ELEMENTOR_VERSION ) . '#site-editor/promotion';
			$target = '_self';
		}

		if ( self::has_pro() ) {
			$url = admin_url( 'admin.php?page=' . App::PAGE_ID . '&ver=' . ELEMENTOR_VERSION ) . '#site-editor';
			$target = '_self';
		}

		return [
			'link' => $url,
			'target' => $target,
		];
	}

	public static function has_at_least_one_kit() {
		static $has_at_least_one_kit = null;

		if ( ! is_null( $has_at_least_one_kit ) ) {
			return $has_at_least_one_kit;
		}

		if ( ! self::is_elementor_active() ) {
			return false;
		}

		if ( version_compare( ELEMENTOR_VERSION, self::MIN_ELEMENTOR_CUSTOMIZATION_VERSION, '>=' ) ) {
			if ( ! class_exists( '\Elementor\App\Modules\ImportExportCustomization\Processes\Revert' ) ) {
				return false;
			}

			$sessions = \Elementor\App\Modules\ImportExportCustomization\Processes\Revert::get_import_sessions();
		} else {
			if ( ! class_exists( '\Elementor\App\Modules\ImportExport\Processes\Revert' ) ) {
				return false;
			}

			$sessions = \Elementor\App\Modules\ImportExport\Processes\Revert::get_import_sessions();
		}

		return ! empty( $sessions );
	}
}
