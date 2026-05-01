<?php

namespace HelloPlus\Tests\Modules\TemplateParts\Classes\Render\Header;

use PHPUnit\Framework\TestCase;
use HelloPlus\Modules\TemplateParts\Classes\Render\Header\Render_Navigation;
use HelloPlus\Tests\Modules\TemplateParts\Classes\Render\Header\Test_Widget;

class Render_Navigation_Test extends TestCase {
	public function test_parent_item_with_children_preserves_link_and_adds_toggle_button() {
		$widget = new Test_Widget( [
			'navigation_menu_submenu_icon' => null,
		] );

		$renderer = new Render_Navigation( $widget, 'ehp-header' );

		$item = (object) [
			'classes' => [ 'menu-item-has-children' ],
			'title' => 'Parent',
		];

		$original_output = '<a href="/parent" class="ehp-header__item ehp-header__item--top-level">Parent</a>';

		$output = $renderer->handle_walker_menu_start_el( $original_output, $item );

		$this->assertStringContainsString( $original_output, $output );
		$this->assertStringContainsString( 'type="button"', $output );
		$this->assertStringContainsString( 'ehp-header__dropdown-toggle', $output );
		$this->assertStringContainsString( 'aria-expanded="false"', $output );
	}

	public function test_item_without_children_is_unchanged() {
		$widget = new Test_Widget( [] );

		$renderer = new Render_Navigation( $widget, 'ehp-header' );

		$item = (object) [
			'classes' => [],
			'title' => 'Childless',
		];

		$original_output = '<a href="/childless" class="ehp-header__item ehp-header__item--top-level">Childless</a>';

		$output = $renderer->handle_walker_menu_start_el( $original_output, $item );

		$this->assertSame( $original_output, $output );
	}

	public function test_handle_link_classes_adds_expected_classes() {
		$widget = new Test_Widget( [] );
		$renderer = new Render_Navigation( $widget, 'ehp-header' );

		$atts = [ 'href' => '/page' ];
		$item = (object) [ 'classes' => [ 'current-menu-item' ] ];

		$result = $renderer->handle_link_classes( $atts, $item, [], 0 );

		$this->assertArrayHasKey( 'class', $result );
		$this->assertStringContainsString( 'ehp-header__item', $result['class'] );
		$this->assertStringContainsString( 'ehp-header__item--top-level', $result['class'] );
		$this->assertStringContainsString( 'is-item-active', $result['class'] );
	}

	public function test_handle_link_classes_marks_anchor_links() {
		$widget = new Test_Widget( [] );
		$renderer = new Render_Navigation( $widget, 'ehp-header' );

		$atts = [ 'href' => '#section' ];
		$item = (object) [ 'classes' => [] ];

		$result = $renderer->handle_link_classes( $atts, $item, [], 1 );
		$this->assertStringContainsString( 'ehp-header__item--sub-level', $result['class'] );
		$this->assertStringContainsString( 'is-item-anchor', $result['class'] );
	}

	public function test_handle_sub_menu_classes_returns_dropdown_with_shapes() {
		$widget = new Test_Widget( [
			'style_submenu_layout' => 'horizontal',
			'style_submenu_shape' => 'rounded',
		] );
		$renderer = new Render_Navigation( $widget, 'ehp-header' );

		$classnames = $renderer->handle_sub_menu_classes();

		$this->assertContains( 'ehp-header__dropdown', $classnames );
		$this->assertContains( 'has-layout-horizontal', $classnames );
		$this->assertContains( 'has-shape-rounded', $classnames );
	}
}
