<?php
namespace HelloPlus\Modules\TemplateParts\Widgets\Controls\Header;

use HelloPlus\Classes\Widgets\Abstract_Section;

class Navigation_Section extends Abstract_Section {

	protected function get_section_config(): array {
		return [
			'id' => 'section_navigation',
			'args' => [
				'label' => esc_html__( 'Navigation', 'hello-plus' ),
			],
		];
	}

	protected function add_section_controls(): void {
		$this->add_navigation_menu_name_control();
		$this->add_navigation_menu_controls();
	}

	private function add_navigation_menu_name_control(): void {
		$this->add_control(
			'navigation_menu_name',
			[
				'label' => esc_html__( 'Accessible Name', 'hello-plus' ),
				'type' => \Elementor\Controls_Manager::TEXT,
				'default' => esc_html__( 'Menu', 'hello-plus' ),
			]
		);
	}

	private function add_navigation_menu_controls(): void {
		$widget = $this->get_widget();

		if ( ! $widget || ! method_exists( $widget, 'get_available_menus' ) ) {
			return;
		}

		$menus = $widget->get_available_menus();

		if ( empty( $menus ) ) {
			return;
		}

		$this->add_menu_selection_control( $menus );
		$this->add_empty_menu_alerts( $widget );
	}

	private function add_menu_selection_control( array $menus ): void {
		$this->add_control(
			'navigation_menu',
			[
				'label' => esc_html__( 'Menu', 'hello-plus' ),
				'type' => \Elementor\Controls_Manager::SELECT,
				'options' => $menus,
				'default' => array_keys( $menus )[0],
				'save_default' => true,
				'separator' => 'after',
				'description' => $this->get_menu_management_description(),
			]
		);

		$this->add_control(
			'navigation_icon_label',
			[
				'label' => esc_html__( 'Responsive Toggle Icon', 'hello-plus' ),
				'type' => \Elementor\Controls_Manager::HEADING,
				'separator' => 'before',
			]
		);

		$this->add_control(
			'navigation_menu_icon',
			[
				'label' => esc_html__( 'Menu', 'hello-plus' ),
				'type' => \Elementor\Controls_Manager::ICONS,
				'skin' => 'inline',
				'label_block' => false,
				'default' => [
					'value' => 'fas fa-bars',
					'library' => 'fa-solid',
				],
				'recommended' => [
					'fa-solid' => [
						'ellipsis-v',
						'ellipsis-h',
						'bars',
					],
				],
				'exclude_inline_options' => [ 'none' ],
			]
		);

		$this->add_control(
			'navigation_breakpoint',
			[
				'label' => esc_html__( 'Breakpoint', 'hello-plus' ),
				'type' => \Elementor\Controls_Manager::SELECT,
				'options' => [
					'mobile-portrait' => 'Mobile Portrait (> 767px)',
					'tablet-portrait' => 'Tablet Portrait (> 1024px)',
					'none' => 'None',
				],
				'default' => 'mobile-portrait',
				'separator' => 'after',
			]
		);

		$this->add_control(
			'navigation_menu_submenu_icon',
			[
				'label' => esc_html__( 'Submenu Indicator Icon', 'hello-plus' ),
				'type' => \Elementor\Controls_Manager::ICONS,
				'skin' => 'inline',
				'label_block' => false,
				'default' => [
					'value' => 'fas fa-caret-down',
					'library' => 'fa-solid',
				],
				'recommended' => [
					'fa-solid' => [
						'caret-down',
						'chevron-down',
						'angle-down',
						'chevron-circle-down',
						'caret-square-down',
					],
					'fa-regular' => [
						'caret-square-down',
					],
				],
				'exclude_inline_options' => [ 'svg' ],
			]
		);
	}

	private function get_menu_management_description(): string {
		return sprintf(
			esc_html__( 'Go to the %1$sMenus screen%2$s to manage your menus.', 'hello-plus' ),
			sprintf( '<a href="%s" target="_blank">', self_admin_url( 'nav-menus.php' ) ),
			'</a>'
		);
	}

	private function add_empty_menu_alerts( $widget ): void {
		if ( ! method_exists( $widget, 'get_empty_menus' ) ) {
			return;
		}

		foreach ( $widget->get_empty_menus() as $menu_id => $menu_slug ) {
			$this->add_control(
				'empty_menu_alert_' . $menu_id,
				[
					'type' => \Elementor\Controls_Manager::ALERT,
					'alert_type' => 'info',
					'content' => $this->get_empty_menu_alert_content( $menu_id ),
					'separator' => 'after',
					'condition' => [
						'navigation_menu' => $menu_slug,
					],
				]
			);
		}
	}

	private function get_empty_menu_alert_content( int $menu_id ): string {
		return sprintf(
			esc_html__( 'This menu has no items. Select another menu, or %1$sadd items%2$s. Then refresh this page. ', 'hello-plus' ),
			sprintf( '<a href="%s" target="_blank">', self_admin_url( 'nav-menus.php?action=edit&menu=' . $menu_id ) ),
			'</a>'
		);
	}
}
