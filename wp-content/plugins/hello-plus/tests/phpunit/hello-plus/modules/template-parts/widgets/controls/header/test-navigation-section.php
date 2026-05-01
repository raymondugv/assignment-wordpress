<?php

namespace HelloPlus\Tests\Modules\TemplateParts\Widgets\Controls\Header;

use PHPUnit\Framework\TestCase;
use HelloPlus\Modules\TemplateParts\Widgets\Controls\Header\Navigation_Section;
use Elementor\Widget_Base;

class Navigation_Section_Test extends TestCase {
	public function test_add_to_widget_adds_expected_controls() {
		$mock_widget = $this->getMockBuilder( Widget_Base::class )
			->disableOriginalConstructor()
			->onlyMethods( [ 'get_name', 'get_title', 'get_icon', 'get_categories', 'start_controls_section', 'add_control', 'end_controls_section' ] )
			->addMethods( [ 'get_available_menus', 'get_empty_menus' ] )
			->getMock();

		$mock_widget->method( 'get_available_menus' )
			->willReturn( [ 'main-menu' => 'Main Menu' ] );
		$mock_widget->method( 'get_empty_menus' )
			->willReturn( [] );

		$mock_widget->expects( $this->once() )
			->method( 'start_controls_section' )
			->with( 'section_navigation', [ 'label' => 'Navigation' ] );
		$mock_widget->expects( $this->atLeastOnce() )
			->method( 'add_control' );
		$mock_widget->expects( $this->once() )
			->method( 'end_controls_section' );

		$section = new Navigation_Section();

		$section->add_to_widget( $mock_widget );
	}
}
