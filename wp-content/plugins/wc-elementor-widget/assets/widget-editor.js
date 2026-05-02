(function ($) {
    "use strict";

    var MODAL_HTML = [
        '<div id="wc-el-modal-overlay" class="wc-el-modal-overlay" aria-modal="true" role="dialog">',
        '  <div class="wc-el-modal">',
        '    <button type="button" class="wc-el-modal-close" aria-label="Close">&times;</button>',
        '    <div class="wc-el-modal-header">',
        '      <div class="wc-el-modal-icon">&#x1F6D2;</div>',
        "      <h2>Create WooCommerce Product</h2>",
        "      <p>Fill in the details below to create a new product.</p>",
        "    </div>",
        '    <div class="wc-el-modal-body">',
        '      <div class="wc-el-field">',
        '        <label for="wc-el-product-name">Product Name <span class="wc-el-required">*</span></label>',
        '        <input type="text" id="wc-el-product-name" placeholder="e.g. Blue Widget Pro" autocomplete="off" />',
        "      </div>",
        '      <div class="wc-el-field">',
        '        <label for="wc-el-product-price">Price <span class="wc-el-required">*</span></label>',
        '        <div class="wc-el-price-input-wrap">',
        '          <span class="wc-el-currency">$</span>',
        '          <input type="number" id="wc-el-product-price" placeholder="0.00" min="0" step="0.01" />',
        "        </div>",
        "      </div>",
        '      <div class="wc-el-error" id="wc-el-error" style="display:none;"></div>',
        "    </div>",
        '    <div class="wc-el-modal-footer">',
        '      <button type="button" class="wc-el-btn-cancel">Cancel</button>',
        '      <button type="button" class="wc-el-btn-submit">',
        '        <span class="wc-el-btn-submit-text">Create Product</span>',
        '        <span class="wc-el-btn-submit-spinner" style="display:none;">Creating...</span>',
        "      </button>",
        "    </div>",
        "  </div>",
        "</div>",
    ].join("");

    // Toast notification
    function showToast(message, type) {
        var $toast = $(
            '<div class="wc-el-toast wc-el-toast--' +
                (type || "success") +
                '">' +
                message +
                "</div>",
        );
        $("body").append($toast);
        setTimeout(function () {
            $toast.addClass("wc-el-toast--visible");
        }, 10);
        setTimeout(function () {
            $toast.removeClass("wc-el-toast--visible");
            setTimeout(function () {
                $toast.remove();
            }, 400);
        }, 4000);
    }

    // Modal
    function ensureModal() {
        if ($("#wc-el-modal-overlay").length === 0) {
            $("body").append(MODAL_HTML);
            bindModalEvents();
        }
    }

    function openModal() {
        ensureModal();
        $("#wc-el-product-name").val("");
        $("#wc-el-product-price").val("");
        hideError();
        $("#wc-el-modal-overlay").addClass("is-visible");
        setTimeout(function () {
            $("#wc-el-product-name").focus();
        }, 150);
    }

    function closeModal() {
        $("#wc-el-modal-overlay").removeClass("is-visible");
    }

    function showError(msg) {
        $("#wc-el-error").text(msg).show();
    }
    function hideError() {
        $("#wc-el-error").hide().text("");
    }

    function setLoading(state) {
        $(".wc-el-btn-submit").prop("disabled", state);
        $(".wc-el-btn-submit-text").toggle(!state);
        $(".wc-el-btn-submit-spinner").toggle(state);
    }

    function validateProductInput(name, price) {
        var normalizedName = $.trim(name);
        var normalizedPrice = $.trim(price);

        if (!normalizedName) {
            return { valid: false, message: "Please enter a product name." };
        }
        if (normalizedName.length < 3) {
            return {
                valid: false,
                message: "Product name must be at least 3 characters.",
            };
        }
        if (normalizedName.length > 100) {
            return {
                valid: false,
                message: "Product name must be 100 characters or fewer.",
            };
        }
        if (!/^[\w\s\-.,()&]+$/u.test(normalizedName)) {
            return {
                valid: false,
                message:
                    "Product name contains invalid characters. Use letters, numbers, spaces, and - . , ( ) &",
            };
        }

        if (normalizedPrice === "") {
            return { valid: false, message: "Please enter a valid price." };
        }

        var parsedPrice = Number(normalizedPrice);
        if (!isFinite(parsedPrice) || parsedPrice < 0) {
            return {
                valid: false,
                message: "Please enter a valid price (0 or higher).",
            };
        }

        if (!/^\d+(\.\d{1,2})?$/.test(normalizedPrice)) {
            return {
                valid: false,
                message: "Price can have up to 2 decimal places only.",
            };
        }

        return {
            valid: true,
            name: normalizedName,
            price: parsedPrice.toFixed(2),
        };
    }

    function bindModalEvents() {
        $(document).on("click", "#wc-el-modal-overlay", function (e) {
            if ($(e.target).is("#wc-el-modal-overlay")) closeModal();
        });
        $(document).on(
            "click",
            ".wc-el-modal-close, .wc-el-btn-cancel",
            closeModal,
        );
        $(document).on("keydown", function (e) {
            if (e.key === "Escape") closeModal();
        });
        $(document).on(
            "keydown",
            "#wc-el-product-name, #wc-el-product-price",
            function (e) {
                if (e.key === "Enter") submitProduct();
            },
        );
        $(document).on("click", ".wc-el-btn-submit", submitProduct);
    }

    // Submit
    function submitProduct() {
        hideError();

        var name = $.trim($("#wc-el-product-name").val());
        var price = $.trim($("#wc-el-product-price").val());
        var validation = validateProductInput(name, price);
        if (!validation.valid) {
            showError(validation.message);
            if (validation.message.toLowerCase().indexOf("price") !== -1) {
                $("#wc-el-product-price").focus();
            } else {
                $("#wc-el-product-name").focus();
            }
            return;
        }

        setLoading(true);

        $.ajax({
            url: wcElWidget.restUrl,
            method: "POST",
            beforeSend: function (xhr) {
                xhr.setRequestHeader("X-WP-Nonce", wcElWidget.nonce);
            },
            contentType: "application/json",
            data: JSON.stringify({
                name: validation.name,
                price: validation.price,
            }),
            success: function (response) {
                setLoading(false);
                if (response.success) {
                    onProductCreated(response);
                } else {
                    showError(response.message || "Failed to create product.");
                }
            },
            error: function (xhr) {
                setLoading(false);
                var msg = "Request failed (HTTP " + xhr.status + ").";
                try {
                    var body = JSON.parse(xhr.responseText);
                    msg = body.message || msg;
                } catch (e) {}
                showError(msg);
                console.error(
                    "[WC Widget] Error:",
                    xhr.status,
                    xhr.responseText,
                );
            },
        });
    }

    // After product created
    function onProductCreated(product) {
        closeModal();

        // Refresh the product list in the preview iframe if it exists
        try {
            var $previewFrame = elementor.$preview.contents();
            var $list = $previewFrame.find(".wc-product-list");
            if ($list.length) {
                $.get(wcElWidget.productsRestUrl, function (products) {
                    var html = "";
                    $.each(products, function (i, p) {
                        html += '<div class="wc-product-card is-visible">';
                        html +=
                            '<div class="wc-product-card__badge">WooCommerce Product</div>';
                        html +=
                            '<h3 class="wc-product-card__name">' +
                            $("<span>").text(p.name).html() +
                            "</h3>";
                        html +=
                            '<div class="wc-product-card__price">$' +
                            parseFloat(p.price || 0).toFixed(2) +
                            "</div>";
                        html +=
                            '<a href="' +
                            p.permalink +
                            '" class="wc-product-card__link" target="_blank">View Product &rarr;</a>';
                        html +=
                            '<div class="wc-product-card__id">ID: #' +
                            p.product_id +
                            "</div>";
                        html += "</div>";
                    });
                    $list.html(html);
                });
            }
        } catch (e) {
            console.warn("[WC Widget] Could not refresh preview:", e);
        }

        // Show toast notification
        showToast(
            "&#10003; Product <strong>" +
                $("<span>").text(product.name).html() +
                "</strong> created! (ID #" +
                product.product_id +
                ")",
            "success",
        );

        updatePanelStatus(product);

        // Update Elementor widget settings
        var currentWidget = getCurrentWidget();
        if (!currentWidget) {
            console.warn(
                "[WC Widget] Could not find active widget to update settings.",
            );
            return;
        }

        currentWidget.setSetting(
            "created_product_id",
            String(product.product_id),
        );
        currentWidget.setSetting("created_product_name", product.name);
        currentWidget.setSetting("created_product_price", product.price);
        currentWidget.setSetting(
            "created_product_permalink",
            product.permalink,
        );

        var model = currentWidget.getEditModel();
        if (model) {
            model.trigger("change");
        }
    }

    function getCurrentWidget() {
        var selected = elementor.selection.getElements();
        if (selected && selected.length > 0) {
            return selected[0];
        }

        try {
            var panelView = elementor.getPanelView();
            if (
                panelView &&
                panelView.getCurrentPageView &&
                panelView.getCurrentPageView()
            ) {
                return panelView
                    .getCurrentPageView()
                    .getOption("editedElementView");
            }
        } catch (e) {}

        return null;
    }

    function updatePanelStatus(product) {
        var $panel = $(".wc-el-panel-container");
        $panel.find(".wc-el-status-name").text(product.name);
        $panel
            .find(".wc-el-status-price")
            .text("$" + parseFloat(product.price).toFixed(2));
        $panel.find(".wc-el-status").show();
        $panel
            .find(".wc-el-create-btn")
            .html("&#10003; Product Created &mdash; Create Another")
            .css("background", "#22c55e");
        $panel
            .find(".wc-el-hint")
            .text("Drag this widget to the canvas to display the product.");
    }

    // Init
    function initPanelListeners() {
        $("body").on("click", ".wc-el-create-btn", function (e) {
            e.preventDefault();
            openModal();
        });
    }

    $(window).on("elementor:init", function () {
        initPanelListeners();
    });

    if (typeof elementor !== "undefined") {
        initPanelListeners();
    }
})(jQuery);
