<?php

namespace HelloPlus\Tests\Modules\TemplateParts\Widgets\Controls\Header;

use PHPUnit\Framework\TestCase;
use HelloPlus\Modules\TemplateParts\Widgets\Controls\Header\Site_Logo_Section;
use Elementor\Widget_Base;

class Site_Logo_Section_Test extends TestCase {
	public function test_add_to_widget_adds_expected_controls() {
		$mock_widget = $this->getMockBuilder( Widget_Base::class )
			->disableOriginalConstructor()
			->onlyMethods( [ 'get_name', 'get_title', 'get_icon', 'get_categories', 'start_controls_section', 'end_controls_section' ] )
			->addMethods( [ 'add_content_brand_controls' ] )
			->getMock();

		$mock_widget->expects( $this->once() )
			->method( 'start_controls_section' )
			->with(
				'site_logo_label',
				[
					'label' => 'Site Identity',
					'tab' => \Elementor\Controls_Manager::TAB_CONTENT,
				]
			);
		$mock_widget->expects( $this->once() )
			->method( 'add_content_brand_controls' );
		$mock_widget->expects( $this->once() )
			->method( 'end_controls_section' );

		$section = new Site_Logo_Section();

		$section->add_to_widget( $mock_widget );
	}
}
