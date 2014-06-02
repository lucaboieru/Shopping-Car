var json;
var serverAddress;

// app core objects
var states = {};
var activeTab;
var activeProducts = [];

// load more init
var LIMIT = 10;
var currentSkip = 0;

// TODO these objects are hardcoded... they have to come from "THE GREAT SERVER OF DOOM >:)"
var hosts = {
    "emag.ro": "emag.png",
    "mediadot.ro": "mediadot.png",
    "pcgarage.ro": "pcgarage.png"
};

var categoryImgs = {
    electronice: "electronice.png",
    electrocasnice: "electrocasnice.png",
    computer_parts: "parts.png",
    portables: "portables.png",
    foto: "foto.png",
    video: "video.png",
    televizoare: "televizoare.png",
    phones: "phones.png",
    tablets: "tablets.png",
    gaming: "gaming.png",
    software: "software.png"
};

$(document).ready(function () {

    serverAddress = "squareapps.cloudapp.net";

    // load first tab
    $('.tab:first').show();
    $(".pageTitle").html("Categorii");
    states['categories'] = {
        active: {},
        history: []
    };
    activeTab = 'categories';

    loadCategories();

    // tab select handler
    $('.navItem').on('click', function () {

        // get the right tab
        var tab = $(this).attr('data-action');

        $('.navItem').removeClass('active');
        $('.navItem').each(function () {
            $(this).find("img").attr("src", "images/" + $(this).attr("data-action") + ".png");
        });
        $(this).addClass('active')
        $(this).find("img").attr("src", "images/" + $(this).attr("data-action") + "_active.png");

        // hide all tabs
        $('.tab').hide();

        // show the right tab
        var $currentTab = $('#' + tab);
        $currentTab.fadeIn(150);

        // init the states
        if (!states[tab]) {
            states[tab] = {
                active: {},
                history: []
            };
        }
        activeTab = tab;

        // actions based on state 
        if (!states[activeTab].history.length) {
            hideBackButton();
            $(".pageTitle").html(capitaliseFirstLetter(tab));
        } else {
            showBackButton();
            $(".pageTitle").html(states[activeTab].active.title);
        }
    });

    $(document).on('click', '.category', function() {
        
        // state is about to change, add active one to history
        states[activeTab].history.push(states[activeTab].active);

        if (!$(this).attr("subcategory")) {
            // create the active state
            states[activeTab].active = {
                title: $(this).attr("categoryName"),
                type: 'category',
                category: $(this).attr("category"),
                subcategory: null
            }

            loadSubcategories($(this).attr("category"));

            showBackButton();
            $(".pageTitle").html($(this).attr("categoryName"));
        } else {
            // create the active state
            states[activeTab].active = {
                title: $(this).attr("subcategoryName"),
                type: 'subcategory',
                category: $(this).attr("category"),
                subcategory: $(this).attr("subcategory")
            } 

            showSearchButton();
            // load the products
            loadProductList($(this).attr("category"), $(this).attr("subcategory"));

            showBackButton();
            $(".pageTitle").html($(this).attr("subcategoryName"));       
        }
    });

    // handle load more
    $(document).on("click", ".load-more", function () {
        var btn = $(this);
        btn.addClass("active");
        var howManyProducts = $(".product").length - 1;
        
        // call draw handler
        drawProducts (activeProducts, currentSkip, function () {
            btn.removeClass("active");
        });
    });

    $(document).on('click', '.backButton', function () {
        handleState();
        hideSearchButton();

        // hide search input
        $(".searchInput").val("");
        $(".searchInput").animate({"width": "0"}, 200);
        $(".searchInput").css("padding", "2px 0px");
        $(".searchInput").fadeOut(200);
    });

    $(document).on('click', '.searchButton', function () {
        if ($(".searchInput:visible")[0]) {
            $(".searchInput").val("");
            $(".searchInput").animate({"width": "0"}, 200);
            $(".searchInput").css("padding", "2px 0px");
            $(".searchInput").fadeOut(200);
        } else {
            $(".searchInput").show();
            $(".searchInput").css("padding", "2px 10px");
            $(".searchInput").animate({"width": "72%"}, 200);
        }
    });

    $(document).on('keyup', '.searchInput', function () {
        // do search
    });
});

document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady(){
    document.addEventListener("backbutton", function(e){
        e.preventDefault();
        handleState();
    }, false);
}

function handleState () {

    if (!states[activeTab].history.length) {
        hideBackButton();
        navigator.app.exitApp();
    }

    // get youngest state position
    var last = states[activeTab].history.length - 1;

    if (states[activeTab].history[last].type === 'index') {
        loadCategories();
        $(".pageTitle").html(states[activeTab].history[last].title);

        states[activeTab].active = states[activeTab].history[last];

        // delete the state
        states[activeTab].history.pop();
    } else if (states[activeTab].history[last].type === 'category') {
        loadSubcategories(states[activeTab].history[last].category);
        $(".pageTitle").html(states[activeTab].history[last].title);

        states[activeTab].active = states[activeTab].history[last];

        // delete the state
        states[activeTab].history.pop();
    }
}

// requests the products from the server and caches them
function loadProductList (category, subcategory, callback) {

    // build the params
    var params = {
        "class": category,
        "subclass": subcategory
    };

    callback = callback || function () {};

    // make the request for the products
    makeAjaxPostCall("", params, function (data) {

        // add products to cache
        activeProducts = JSON.parse(data);

        // skip is 0
        currentSkip = 0;
        callback();

        // draw the first proucts
        drawProducts (activeProducts, currentSkip);
    });
}

// draws products and handles the load more function
function drawProducts (products, skip, callback) {

    // add default values if variables do not exist
    callback = callback || function () {};
    skip = skip || 0;

    // build the limit
    var limit = (skip + LIMIT > products.length) ? products.length - skip : LIMIT

    // draw the products
    var elems = [];
    for (var i = skip; i < skip + limit; ++i) {

        if (!products[i]) continue;

        var $temp = $(".product-temp").clone();

        // add data to product template
        $temp.find(".host").attr("src", "images/" + hosts[products[i].host]);
        $temp.find(".product-img").attr("src", products[i].img);
        $temp.find(".price-tag").html(products[i].price);
        $temp.find(".old-price").html(products[i].oldPrice);
        $temp.find(".productLink").attr('href', products[i].link);
        $temp.find(".product-description .title").html(products[i].title);

        $temp.removeClass("product-temp");
        $temp.show();
        elems.push($temp);
    }
    skip ? $("#categories>.row").append(elems) : $("#categories>.row").html(elems);

    // raise the skip
    currentSkip += LIMIT;

    // hide load more button if no more products
    if (currentSkip > products.length) {
        $(".load-more").hide();
    } else {
        $(".load-more").show();
    }

    // let the caller know the products have been drawn
    callback();
}

function loadSubcategories (category) {

    var elems = [];

    for (var i in json) {
        if (json[i].class_id === category) {
            for (var j in json[i].subclass) {
                var $temp = $(".category-temp").clone();
                $temp.find(".category-img img").attr("src", "images/" + categoryImgs[json[i].subclass_id[j]]);
                $temp.find(".category-img").css("backgroundColor", json[i].colors.dark);
                $temp.find(".category-img").css("border","5px solid " + json[i].colors.light);
                $temp.find(".category-title").html(json[i].subclass[j]);
                $temp.find(".category-title").css("backgroundColor", json[i].colors.dark);
                $temp.find(".category").attr("subcategory", json[i].subclass_id[j]);
                $temp.find(".category").attr("subcategoryName", json[i].subclass[j]);
                $temp.find(".category").attr("categoryName", json[i].name);
                $temp.find(".category").attr("category", category);
                $temp.removeClass("category-temp");
                $temp.show();
                elems.push($temp);
            }
            break;
        }
    }
    $("#categories>.row").html(elems);
    $(".load-more").hide();
}

function loadCategories () {

    makeAjaxPostCall("getMappings", {}, function (data) {
        
        json = JSON.parse(data);
        var elems = [];

        for (var i in json) {
            var $temp = $(".category-temp").clone();
            $temp.find(".category-img img").attr("src", "images/" + categoryImgs[json[i].class_id]);
            $temp.find(".category-img").css("backgroundColor", json[i].colors.dark);
            $temp.find(".category-img").css("border","5px solid " + json[i].colors.light);
            $temp.find(".category-title").html(json[i].name);
            $temp.find(".category-title").css("backgroundColor", json[i].colors.dark);
            $temp.find(".category").attr("category", json[i].class_id);
            $temp.find(".category").attr("categoryName", json[i].name);
            $temp.removeClass("category-temp");
            $temp.show();
            elems.push($temp);
        }
        $("#categories>.row").html(elems);
        $(".load-more").hide();

        // handle states
        states[activeTab].active = {
            title: 'Categories',
            type: 'index',
            category: null,
            subcategory: null
        }

        // hide back button
        hideBackButton();
    });
}

function makeAjaxPostCall (url, params, callback) {

    // make the ajax request
    $.ajax({
        url:"http://" + serverAddress + ":7777/" + url,
        type: 'post',
        crossDomain: true,
        cache: false,
        data: params,
        success: function(data){
            // do stuff with json (in this case an array)
            callback(data);
        },
        error: function(jqXHR, textStatus, err){
            alert('text status ' + textStatus + ', err ' + err)
        }    
    });
};

function showSearchButton () {
    $(".searchButton").fadeIn(200);
}

function hideSearchButton () {
    $(".searchButton").fadeOut(200);
}

function showBackButton () {
    $(".backButton").show();
}

function hideBackButton () {
    $(".backbutton").hide();
}

function capitaliseFirstLetter (string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
