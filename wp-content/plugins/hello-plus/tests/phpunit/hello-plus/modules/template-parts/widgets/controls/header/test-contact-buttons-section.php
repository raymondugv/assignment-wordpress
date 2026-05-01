<?php

namespace HelloPlus\Tests\Modules\TemplateParts\Widgets\Controls\Header;

use PHPUnit\Framework\TestCase;
use HelloPlus\Modules\TemplateParts\Widgets\Controls\Header\Contact_Buttons_Section;
use Elementor\Widget_Base;

class Contact_Buttons_Section_Test extends TestCase {
	private $section;
	private $mock_widget;

	protected function setUp(): void {
		parent::setUp();
		$this->section = new Contact_Buttons_Section();
		$this->mock_widget = $this->getMockBuilder( Widget_Base::class )
			->disableOriginalConstructor()
			->onlyMethods( [ 'get_name', 'get_title', 'get_icon', 'get_categories', 'start_controls_section', 'add_control', 'end_controls_section' ] )
			->getMock();
	}

	public function test_add_to_widget_starts_correct_section() {
		$this->mock_widget->expects( $this->once() )
			->method( 'start_controls_section' )
			->with(
				'section_contact_buttons',
				[
					'label' => 'Contact Buttons',
					'tab' => \Elementor\Controls_Manager::TAB_CONTENT,
				]
			);

		$this->mock_widget->expects( $this->any() )
			->method( 'add_control' );

		$this->mock_widget->expects( $this->once() )
			->method( 'end_controls_section' );

		$this->section->add_to_widget( $this->mock_widget );
	}

	public function test_add_to_widget_adds_show_controls() {
		$control_calls = [];
		$this->mock_widget->expects( $this->any() )
			->method( 'add_control' )
			->willReturnCallback(function ( $id, $args ) use ( &$control_calls ) {
				$control_calls[ $id ] = $args;
			});

		$this->mock_widget->expects( $this->any() )
			->method( 'start_controls_section' );

		$this->mock_widget->expects( $this->any() )
			->method( 'end_controls_section' );

		$this->section->add_to_widget( $this->mock_widget );

		$this->assertArrayHasKey( 'contact_buttons_show', $control_calls );
		$show_control = $control_calls['contact_buttons_show'];
		$this->assertEquals( 'Show', $show_control['label'] );
		$this->assertEquals( \Elementor\Controls_Manager::SWITCHER, $show_control['type'] );
		$this->assertEquals( 'yes', $show_control['return_value'] );

		$this->assertArrayHasKey( 'contact_buttons_show_connect', $control_calls );
		$connect_show_control = $control_calls['contact_buttons_show_connect'];
		$this->assertEquals( 'Show', $connect_show_control['label'] );
		$this->assertEquals( \Elementor\Controls_Manager::SWITCHER, $connect_show_control['type'] );
		$this->assertEquals( 'yes', $connect_show_control['return_value'] );
		$this->assertEquals( 'yes', $connect_show_control['default'] );
	}

	public function test_add_to_widget_adds_repeater_control() {
		$control_calls = [];
		$this->mock_widget->expects( $this->any() )
			->method( 'add_control' )
			->willReturnCallback(function ( $id, $args ) use ( &$control_calls ) {
				$control_calls[ $id ] = $args;
			});

		$this->mock_widget->expects( $this->any() )
			->method( 'start_controls_section' );

		$this->mock_widget->expects( $this->any() )
			->method( 'end_controls_section' );

		$this->section->add_to_widget( $this->mock_widget );

		$this->assertArrayHasKey( 'contact_buttons_repeater', $control_calls );
		$repeater_control = $control_calls['contact_buttons_repeater'];
		$this->assertEquals( \Elementor\Controls_Manager::REPEATER, $repeater_control['type'] );
		$this->assertTrue( $repeater_control['prevent_empty'] );
		$this->assertEquals( 'Add Item', $repeater_control['button_text'] );
		$this->assertEquals( '{{{ contact_buttons_label }}}', $repeater_control['title_field'] );
		$this->assertArrayHasKey( 'conditions', $repeater_control );
	}

	public function test_add_to_widget_complete_flow() {
		$call_order = [];

		$this->mock_widget->expects( $this->once() )
			->method( 'start_controls_section' )
			->willReturnCallback(function () use ( &$call_order ) {
				$call_order[] = 'start_section';
			});

		$this->mock_widget->expects( $this->atLeast( 3 ) )
			->method( 'add_control' )
			->willReturnCallback(function () use ( &$call_order ) {
				$call_order[] = 'add_control';
			});

		$this->mock_widget->expects( $this->once() )
			->method( 'end_controls_section' )
			->willReturnCallback(function () use ( &$call_order ) {
				$call_order[] = 'end_section';
			});

		$this->section->add_to_widget( $this->mock_widget );

		$this->assertEquals( 'start_section', $call_order[0] );
		$this->assertEquals( 'end_section', $call_order[ count( $call_order ) - 1 ] );
		$this->assertContains( 'add_control', $call_order );
	}
}
