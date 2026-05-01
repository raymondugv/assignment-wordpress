<?php

namespace HelloPlus\Tests\Modules\TemplateParts\Classes\Render\Header;

use Elementor\Widget_Base;

class Test_Widget extends Widget_Base {
	private array $test_settings;

	public function __construct( array $settings = [] ) {
		$this->test_settings = $settings;
	}

	public function get_name() {
		return 'test-widget';
	}

	public function get_title() {
		return 'Test Widget';
	}

	public function get_icon() {
		return 'eicon-placeholder';
	}

	public function get_categories() {
		return [];
	}

	public function render() {}

	public function get_settings_for_display( $setting_key = null ) {
		return $this->test_settings;
	}
}
