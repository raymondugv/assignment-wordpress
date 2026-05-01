<?php
namespace HelloPlus\Modules\TemplateParts\Widgets\Controls\Header;

use HelloPlus\Classes\Widgets\Abstract_Section;

class Site_Logo_Section extends Abstract_Section {

	protected function get_section_config(): array {
		return [
			'id' => 'site_logo_label',
			'args' => [
				'label' => esc_html__( 'Site Identity', 'hello-plus' ),
				'tab' => \Elementor\Controls_Manager::TAB_CONTENT,
			],
		];
	}

	protected function add_section_controls(): void {
		$widget = $this->get_widget();
		if ( $widget && method_exists( $widget, 'add_content_brand_controls' ) ) {
			$widget->add_content_brand_controls();
		}
	}
}
