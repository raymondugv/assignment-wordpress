<?php

namespace HelloPlus\Tests\Modules\TemplateParts\Widgets;

use HelloPlus\Modules\TemplateParts\Widgets\Ehp_Header;
use HelloPlus\Modules\Theme\Module as Theme_Module;
use ElementorEditorTesting\Elementor_Test_Base;

class Ehp_Header_Test extends Elementor_Test_Base {
	private const WIDGET_NAME = 'ehp-header';
	private const WIDGET_TITLE = 'Hello+ Header';
	private const WIDGET_ICON = 'eicon-single-page';
	private const WIDGET_CATEGORY = Theme_Module::HELLOPLUS_EDITOR_CATEGORY_SLUG;
	private const WIDGET_KEYWORD = 'header';
	private const STYLE_DEPEND = 'helloplus-header';
	private const SCRIPT_DEPEND = 'helloplus-header-fe';

	public function test_can_instantiate() {
		$widget = new Ehp_Header();
		$this->assertInstanceOf( Ehp_Header::class, $widget );
	}

	public function test_get_name() {
		$widget = new Ehp_Header();
		$this->assertEquals( self::WIDGET_NAME, $widget->get_name() );
	}

	public function test_get_title() {
		$widget = new Ehp_Header();
		$title = $widget->get_title();
		$this->assertIsString( $title );
		$this->assertStringContainsString( self::WIDGET_TITLE, $title );
	}

	public function test_get_categories() {
		$widget = new Ehp_Header();
		$categories = $widget->get_categories();
		$this->assertIsArray( $categories );
		$this->assertContains( self::WIDGET_CATEGORY, $categories );
	}

	public function test_get_keywords() {
		$widget = new Ehp_Header();
		$keywords = $widget->get_keywords();
		$this->assertIsArray( $keywords );
		$this->assertContains( self::WIDGET_KEYWORD, $keywords );
	}

	public function test_get_icon() {
		$widget = new Ehp_Header();
		$this->assertEquals( self::WIDGET_ICON, $widget->get_icon() );
	}

	public function test_get_style_depends() {
		$widget = new Ehp_Header();
		$styles = $widget->get_style_depends();
		$this->assertIsArray( $styles );
		$this->assertContains( self::STYLE_DEPEND, $styles );
	}

	public function test_get_script_depends() {
		$widget = new Ehp_Header();
		$scripts = $widget->get_script_depends();
		$this->assertIsArray( $scripts );
		$this->assertContains( self::SCRIPT_DEPEND, $scripts );
	}
}
