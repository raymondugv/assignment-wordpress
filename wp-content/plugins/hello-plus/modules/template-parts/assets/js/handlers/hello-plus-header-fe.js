export default class HelloPlusHeaderHandler extends elementorModules.frontend.handlers.Base {
    getDefaultSettings() {
        return {
            selectors: {
                main: '.ehp-header',
                navigationToggle: '.ehp-header__button-toggle',
				dropdownToggle: '.ehp-header__dropdown-toggle',
				navigation: '.ehp-header__navigation',
				dropdown: '.ehp-header__dropdown',
				wpAdminBar: '#wpadminbar',
				menuCartItems: '.ehp-header__menu-cart-items',
				menuCartButton: '.ehp-header__menu-cart-button',
				menuCartClose: '.ehp-header__menu-cart-close',
				floatingBars: '.e-floating-bars.has-vertical-position-top',
            },
			constants: {
				mobilePortrait: 767,
				tabletPortrait: 1024,
				mobile: 'mobile',
				tablet: 'tablet',
				desktop: 'desktop',
				dataScrollBehavior: 'data-scroll-behavior',
				dataBehaviorFloat: 'data-behavior-float',
				scrollUp: 'scroll-up',
				always: 'always',
				none: 'none',
				no: 'no',
				submenuCloseDelay: 500,
			},
        };
    }

	getDefaultElements() {
		const selectors = this.getSettings( 'selectors' );

		return {
			main: this.$element[ 0 ].querySelector( selectors.main ),
			navigationToggle: this.$element[ 0 ].querySelector( selectors.navigationToggle ),
			dropdownToggle: this.$element[ 0 ].querySelectorAll( selectors.dropdownToggle ),
			navigation: this.$element[ 0 ].querySelector( selectors.navigation ),
			dropdown: this.$element[ 0 ].querySelector( selectors.dropdown ),
			wpAdminBar: document.querySelector( selectors.wpAdminBar ),
			menuCartItems: this.$element[ 0 ].querySelectorAll( selectors.menuCartItems ),
			menuCartButton: this.$element[ 0 ].querySelectorAll( selectors.menuCartButton ),
			menuCartClose: this.$element[ 0 ].querySelectorAll( selectors.menuCartClose ),
			floatingBars: document.querySelector( selectors.floatingBars ),
		};
	}

    bindEvents() {
		if ( this.elements.navigationToggle ) {
			this.elements.navigationToggle.addEventListener( 'click', () => this.toggleNavigation() );
		}

		if ( this.elements.dropdownToggle.length > 0 ) {
			this.elements.dropdownToggle.forEach( ( menuItem ) => {
				const menuItemParent = menuItem.closest( '.menu-item-has-children' );
				if ( menuItemParent ) {
					menuItemParent.addEventListener( 'mouseenter', ( event ) => {
						if ( ! this.isResponsiveBreakpoint() ) {
							this.openSubMenuOnHover( event );
						}
					} );
					menuItemParent.addEventListener( 'mouseleave', ( event ) => {
						if ( ! this.isResponsiveBreakpoint() ) {
							this.closeSubMenuOnHover( event );
						}
					} );
					menuItemParent.addEventListener( 'mousemove', ( event ) => {
						if ( ! this.isResponsiveBreakpoint() ) {
							this.trackMousePosition( event );
						}
					} );

					menuItem.addEventListener( 'click', ( event ) => {
						if ( this.isResponsiveBreakpoint() ) {
							event.preventDefault();
							this.toggleSubMenu( event );
						}
					} );

					menuItem.addEventListener( 'keydown', ( event ) => {
						if ( 'Enter' === event.key || ' ' === event.key ) {
							event.preventDefault();
							this.toggleSubMenu( event );
						}
					} );
				}
			} );
		}

		if ( this.elements.main ) {
			this.elements.main.addEventListener( 'click', ( event ) => this.handleCartButtonClicks( event ) );
			window.addEventListener( 'resize', () => this.onResize() );
			window.addEventListener( 'scroll', () => this.onScroll() );
			document.addEventListener( 'click', ( event ) => this.handleDocumentClick( event ) );
			document.addEventListener( 'keydown', ( event ) => this.handleKeydown( event ) );
		}
    }

	handleCartButtonClicks( event ) {
		const target = event.target;
		const matches = ( selector ) => target.classList.contains( selector ) || target.closest( `.${ selector }` );

		const isMenuCartButton = matches( 'ehp-header__menu-cart-button' );

		if ( isMenuCartButton ) {
			this.toggleMenuCart( event );
			return;
		}

		const isMenuCartClose = matches( 'ehp-header__menu-cart-close' );

		if ( isMenuCartClose ) {
			this.handleMenuCartCloseClick( event );
			return;
		}

		const isMenuCartItems = matches( 'ehp-header__menu-cart-items' );

		if ( ! isMenuCartItems ) {
			this.closeOpenMenuCart();
		}
	}

	onInit( ...args ) {
		super.onInit( ...args );

		this.initDefaultState();
		this.scrollTimeout = null;
		this.originalBodyOverflow = document.body.style.overflow;
		this.submenuCloseTimeouts = new Map();
		this.mousePositions = new Map();
		this.hasFirstScrollOccurred = document.body.classList.contains( 'ehp-body-after-scroll' );
		this.userHasInteracted = false;
		this.setupUserInteractionListeners();
		this.checkInitialScrollPosition();
	}

	initDefaultState() {
		this.lastScrollY = window.scrollY;

		const { none, no, always, scrollUp } = this.getSettings( 'constants' );

		this.handleAriaAttributesMenu();
		this.handleAriaAttributesDropdown();
		this.handleOffsetTop();

		if ( none === this.getDataScrollBehavior() && no === this.getBehaviorFloat() ) {
			this.setupInnerContainer();
		}

		if ( scrollUp === this.getDataScrollBehavior() || always === this.getDataScrollBehavior() ) {
			this.applyBodyPadding();
		}

		if ( this.elements.menuCartItems ) {
			this.handleInertMenuCart();
		}
	}

	getBehaviorFloat() {
		const { dataBehaviorFloat } = this.getSettings( 'constants' );
		return this.elements.main.getAttribute( dataBehaviorFloat );
	}

	getDataScrollBehavior() {
		const { dataScrollBehavior } = this.getSettings( 'constants' );
		return this.elements.main.getAttribute( dataScrollBehavior );
	}

	setupInnerContainer() {
		this.elements.main.closest( '.e-con-inner' )?.classList.add( 'e-con-inner--ehp-header' );
		this.elements.main.closest( '.e-con' )?.classList.add( 'e-con--ehp-header' );
	}

	onResize() {
		this.handleAriaAttributesMenu();
		this.handleOffsetTop();
	}

	onScroll() {
		if ( ! this.hasFirstScrollOccurred && this.userHasInteracted ) {
			this.handleFirstScroll();
		}

		const { scrollUp, always, none } = this.getSettings( 'constants' );

		if ( this.scrollTimeout ) {
			cancelAnimationFrame( this.scrollTimeout );
		}

		if ( scrollUp === this.getDataScrollBehavior() || always === this.getDataScrollBehavior() ) {
			this.handleScrollDown( this.getDataScrollBehavior() );
		}

		if ( this.elements.floatingBars && none === this.getDataScrollBehavior() && this.elements.main.classList.contains( 'has-behavior-float' ) ) {
			this.setFloatingBarsHeight();
		}

		this.scrollTimeout = requestAnimationFrame( () => {
			this.onScrollEnd();
		} );
	}

	onScrollEnd() {
		if ( this.elements.floatingBars ) {
			this.setFloatingBarsHeight();
		}
	}

	handleOffsetTop() {
		const wpAdminBarOffsetHeight = this.elements.wpAdminBar?.offsetHeight || 0;
		const floatingBars = this.elements.floatingBars;

		this.elements.main.style.setProperty( '--header-wp-admin-bar-height', `${ wpAdminBarOffsetHeight }px` );

		if ( this.elements.floatingBars ) {
			const floatingBarsHeight = this.elements.floatingBars?.offsetHeight || 0;
			this.elements.main.style.setProperty( '--header-floating-bars-height', `${ floatingBarsHeight }px` );

			if ( this.mutationObserver ) {
				this.mutationObserver.disconnect();
			}

			const observer = new MutationObserver( () => {
				const newHeight = floatingBars.offsetHeight;
				this.elements.main.style.setProperty( '--header-floating-bars-height', `${ newHeight }px` );
				this.applyBodyPadding();
			} );

			this.mutationObserver = observer;
			observer.observe( floatingBars, { attributes: true, childList: true } );
		}
	}

	applyBodyPadding() {
		const mainHeight = this.elements.main.offsetHeight;
		const floatingBars = this.elements.floatingBars;

		if ( floatingBars ) {
			const { none } = this.getSettings( 'constants' );

			if ( none !== this.getDataScrollBehavior() ) {
				if ( ! floatingBars.classList.contains( 'is-sticky' ) && ! floatingBars.classList.contains( 'is-hidden' ) ) {
					floatingBars.style.marginBottom = `${ mainHeight }px`;
					document.documentElement.style.setProperty( '--ehp-body-padding-top', '0px' );
				} else if ( floatingBars.classList.contains( 'is-sticky' ) ) {
					const floatingBarsHeight = floatingBars?.offsetHeight || 0;
					document.documentElement.style.setProperty( '--ehp-body-padding-top', `${ mainHeight + floatingBarsHeight }px` );
				}
			}
		} else {
			document.documentElement.style.setProperty( '--ehp-body-padding-top', `${ mainHeight }px` );
		}
	}

	setupUserInteractionListeners() {
		const interactionEvents = [ 'mousedown', 'touchstart', 'keydown', 'wheel' ];

		const markUserInteraction = () => {
			this.userHasInteracted = true;
			interactionEvents.forEach( ( event ) => {
				document.removeEventListener( event, markUserInteraction, { passive: true } );
			} );
		};

		interactionEvents.forEach( ( event ) => {
			document.addEventListener( event, markUserInteraction, { passive: true } );
		} );
	}

	checkInitialScrollPosition() {
		const checkScrollState = () => {
			if ( ! this.hasFirstScrollOccurred && window.scrollY > 0 ) {
				this.handleFirstScroll();
			}
		};

		if ( 'complete' === document.readyState ) {
			checkScrollState();
			return;
		}

		window.addEventListener( 'load', checkScrollState );
	}

	handleFirstScroll() {
		if ( ! document.body.classList.contains( 'ehp-body-after-scroll' ) ) {
			document.body.classList.add( 'ehp-body-after-scroll' );
			this.hasFirstScrollOccurred = true;
		}
	}

	handleAriaAttributesDropdown() {
		const selectors = this.getSettings( 'selectors' );
		this.elements.dropdownToggle.forEach( ( item ) => {
			const menuItem = item.closest( '.menu-item-has-children' );
			const submenu = menuItem ? menuItem.querySelector( selectors.dropdown ) : null;
			if ( submenu ) {
				submenu.setAttribute( 'aria-hidden', 'true' );
			}
		} );
	}

	handleInertMenuCart() {
		this.elements.menuCartItems.forEach( ( item ) => {
			item.setAttribute( 'inert', '' );
		} );
	}

	handleAriaAttributesMenu() {
		if ( this.isResponsiveBreakpoint() ) {
			this.elements.navigationToggle.setAttribute( 'aria-expanded', 'false' );
			this.elements.navigation.setAttribute( 'aria-hidden', 'true' );
		}
	}

	handleDocumentClick( event ) {
		const target = event.target;
		const isMenuCartButton = target.closest( '.ehp-header__menu-cart-button' );
		const isMenuCartItems = target.closest( '.ehp-header__menu-cart-items' );

		if ( ! isMenuCartButton && ! isMenuCartItems ) {
			this.closeOpenMenuCart();
		}
	}

	handleKeydown( event ) {
		if ( 'Escape' === event.key ) {
			this.closeOpenMenuCart();
		}
	}

	openSubMenuOnHover( event ) {
		const selectors = this.getSettings( 'selectors' );
		const menuItem = event.currentTarget;
		const subMenu = menuItem.querySelector( selectors.dropdown );
		const toggleButton = menuItem.querySelector( selectors.dropdownToggle );

		if ( ! subMenu || ! toggleButton ) {
			return;
		}

		if ( this.submenuCloseTimeouts.has( subMenu ) ) {
			clearTimeout( this.submenuCloseTimeouts.get( subMenu ) );
			this.submenuCloseTimeouts.delete( subMenu );
		}

		this.closeAllOtherSubMenus( toggleButton );
		this.openSubMenu( toggleButton, subMenu );

		subMenu.addEventListener( 'mouseenter', () => {
			if ( this.submenuCloseTimeouts.has( subMenu ) ) {
				clearTimeout( this.submenuCloseTimeouts.get( subMenu ) );
				this.submenuCloseTimeouts.delete( subMenu );
			}
		} );

		subMenu.addEventListener( 'mouseleave', () => {
			this.closeSubMenu( toggleButton, subMenu );
		} );
	}

	trackMousePosition( event ) {
		const menuItem = event.currentTarget;
		const currentTime = Date.now();
		const currentY = event.clientY;

		if ( ! this.mousePositions.has( menuItem ) ) {
			this.mousePositions.set( menuItem, { y: currentY, time: currentTime } );
			return;
		}

		const lastPosition = this.mousePositions.get( menuItem );
		this.mousePositions.set( menuItem, { y: currentY, time: currentTime, lastY: lastPosition.y, lastTime: lastPosition.time } );
	}

	isMouseMovingDown( menuItem ) {
		const position = this.mousePositions.get( menuItem );
		if ( ! position || ! position.lastY ) {
			return false;
		}

		const timeDiff = position.time - position.lastTime;
		const yDiff = position.y - position.lastY;

		return timeDiff > 0 && yDiff > 0;
	}

	closeSubMenuOnHover( event ) {
		const selectors = this.getSettings( 'selectors' );
		const menuItem = event.currentTarget;
		const subMenu = menuItem.querySelector( selectors.dropdown );
		const toggleButton = menuItem.querySelector( selectors.dropdownToggle );

		if ( ! subMenu || ! toggleButton ) {
			return;
		}

		if ( this.submenuCloseTimeouts.has( subMenu ) ) {
			clearTimeout( this.submenuCloseTimeouts.get( subMenu ) );
		}

		const constants = this.getSettings( 'constants' );
		const isMovingDown = this.isMouseMovingDown( menuItem );
		const delay = isMovingDown ? constants.submenuCloseDelay : 0;

		this.submenuCloseTimeouts.set( subMenu, setTimeout( () => {
			const isHoveringSubmenu = subMenu.matches( ':hover' ) || subMenu.querySelector( ':hover' );
			if ( ! isHoveringSubmenu ) {
				this.closeSubMenu( toggleButton, subMenu );
			}
			this.submenuCloseTimeouts.delete( subMenu );
		}, delay ) );

		this.mousePositions.delete( menuItem );
	}

	toggleSubMenu( event ) {
		event.preventDefault();
		const selectors = this.getSettings( 'selectors' );
		const toggleButton = event.target.closest( selectors.dropdownToggle );
		if ( ! toggleButton ) {
			return;
		}

		const menuItem = toggleButton.closest( '.menu-item-has-children' );
		const subMenu = menuItem ? menuItem.querySelector( selectors.dropdown ) : null;

		if ( ! subMenu ) {
			return;
		}

		const ariaHidden = subMenu.getAttribute( 'aria-hidden' );

		if ( 'true' === ariaHidden ) {
			this.closeAllOtherSubMenus( toggleButton );
			this.openSubMenu( toggleButton, subMenu );
		} else {
			this.closeSubMenu( toggleButton, subMenu );
		}
	}

	closeAllOtherSubMenus( currentTargetItem ) {
		const selectors = this.getSettings( 'selectors' );
		Array.from( this.elements.dropdownToggle ).forEach( ( toggle ) => {
			if ( toggle !== currentTargetItem && 'true' === toggle.getAttribute( 'aria-expanded' ) ) {
				const menuItem = toggle.closest( '.menu-item-has-children' );
				const menu = menuItem ? menuItem.querySelector( selectors.dropdown ) : null;
				if ( menu ) {
					this.closeSubMenu( toggle, menu );
				}
			}
		} );
	}

	openSubMenu( targetItem, subMenu ) {
		targetItem.setAttribute( 'aria-expanded', 'true' );
		subMenu.setAttribute( 'aria-hidden', 'false' );
	}

	closeSubMenu( targetItem, subMenu ) {
		targetItem.setAttribute( 'aria-expanded', 'false' );
		subMenu.setAttribute( 'aria-hidden', 'true' );
	}

	handleScrollDown( behaviorOnScroll ) {
		const currentScrollY = window.scrollY;
		const headerHeight = this.elements.main.offsetHeight;
		const wpAdminBarOffsetHeight = this.elements.wpAdminBar?.offsetHeight || 0;
		const headerFloatOffsetProperty = getComputedStyle( this.elements.main ).getPropertyValue( '--header-float-offset' );
		const headerFloatOffset = parseInt( headerFloatOffsetProperty, 10 ) || 0;
		const totalOffset = headerHeight + wpAdminBarOffsetHeight + headerFloatOffset;

		if ( currentScrollY <= 0 ) {
			this.elements.main.classList.remove( 'scroll-down' );
			this.elements.main.style.removeProperty( '--header-scroll-down' );
			return;
		}

		if ( currentScrollY > this.lastScrollY ) {
			this.elements.main.classList.add( 'scroll-down' );

			const { scrollUp } = this.getSettings( 'constants' );
			if ( scrollUp === behaviorOnScroll ) {
				this.elements.main.style.setProperty( '--header-scroll-down', `${ totalOffset }px` );
			}
		} else {
			this.elements.main.classList.remove( 'scroll-down' );
			this.elements.main.style.removeProperty( '--header-scroll-down' );
		}

		if ( this.elements.floatingBars ) {
			requestAnimationFrame( () => {
				this.setFloatingBarsHeight();
			} );
		}

		this.lastScrollY = currentScrollY;
	}

	setFloatingBarsHeight() {
		const floatingBarsRect = this.elements.floatingBars.getBoundingClientRect();
		const visibleHeight = Math.max( 0, Math.min( floatingBarsRect.height, floatingBarsRect.bottom ) );
		this.elements.main.style.setProperty( '--header-floating-bars-height', `${ visibleHeight }px` );
	}

	isResponsiveBreakpoint() {
		const responsiveBreakpoint = this.elements.main.getAttribute( 'data-responsive-breakpoint' );

		if ( ! responsiveBreakpoint ) {
			return false;
		}

		const { mobilePortrait, tabletPortrait } = this.getSettings( 'constants' );

		const breakpointValue = 'tablet-portrait' === responsiveBreakpoint ? tabletPortrait : mobilePortrait;

		return window.innerWidth <= breakpointValue;
	}

    toggleNavigation() {
		const isNavigationHidden = this.elements.navigation.getAttribute( 'aria-hidden' );

		if ( 'true' === isNavigationHidden ) {
			this.elements.navigation.setAttribute( 'aria-hidden', 'false' );
			this.elements.navigationToggle.setAttribute( 'aria-expanded', 'true' );
		} else {
			this.elements.navigation.setAttribute( 'aria-hidden', 'true' );
			this.elements.navigationToggle.setAttribute( 'aria-expanded', 'false' );
		}
    }

	toggleMenuCart( event ) {
		event.preventDefault();

		const target = event.target;
		const cartMenuItems = target.nextElementSibling;
		const inert = cartMenuItems.hasAttribute( 'inert' );

		if ( inert ) {
			this.openMenuCart( cartMenuItems );
		} else {
			this.closeMenuCart( cartMenuItems );
		}

		if ( this.isResponsiveBreakpoint() && 'false' === this.elements.navigation.getAttribute( 'aria-hidden' ) ) {
			this.toggleNavigation();
		}
	}

	closeOpenMenuCart() {
		const openCart = this.elements.main.querySelector( '.ehp-header__menu-cart-items:not([inert])' );
		if ( openCart ) {
			this.closeMenuCart( openCart );
		}
	}

	handleMenuCartCloseClick( event ) {
		event.preventDefault();
		this.closeOpenMenuCart();
	}

	openMenuCart( cartMenuItems ) {
		cartMenuItems.removeAttribute( 'inert' );

		const cartMenuList = cartMenuItems.querySelector( '.ehp-header__menu-cart-list' );

		if ( cartMenuList &&
			this.isResponsiveBreakpoint() &&
			this.checkCartMenuItemsOverflow( cartMenuList )
		) {
			if ( this.originalBodyOverflow !== document.body.style.overflow ) {
				this.originalBodyOverflow = document.body.style.overflow;
			}

			document.body.style.overflow = 'hidden';
		}
	}

	checkCartMenuItemsOverflow( cartMenuItems ) {
		return cartMenuItems.scrollHeight > cartMenuItems.clientHeight;
	}

	closeMenuCart( cartMenuItems ) {
		cartMenuItems.setAttribute( 'inert', '' );

		if ( this.isResponsiveBreakpoint() ) {
			document.body.style.overflow = this.originalBodyOverflow;
		}
	}
}
